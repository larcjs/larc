# State Management Components API Reference

Complete API reference for LARC's state management components.

## Table of Contents

- [pan-state-sync](#pan-state-sync)
- [pan-computed-state](#pan-computed-state)
- [pan-offline-sync](#pan-offline-sync)
- [pan-persistence-strategy](#pan-persistence-strategy)
- [pan-schema-validator](#pan-schema-validator)
- [pan-undo-redo](#pan-undo-redo)
- [pan-store](#pan-store)

---

## pan-state-sync

Cross-tab state synchronization using BroadcastChannel API.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `channel` | string | `'pan-state-sync'` | Name of the BroadcastChannel |
| `topics` | string | `'*'` | Comma-separated topic patterns to sync |
| `strategy` | string | `'last-write-wins'` | Conflict resolution: `'last-write-wins'`, `'merge'`, `'custom'` |
| `leader` | string | `'auto'` | Leader election: `'auto'`, `'always'`, `'never'` |
| `debug` | boolean | false | Enable debug logging |

### Properties

```javascript
const sync = document.querySelector('pan-state-sync');

sync.tabId              // string: Unique tab identifier
sync.isLeader           // boolean: Whether this tab is the leader
sync.channel            // string: Current channel name
```

### Methods

```javascript
// Request full state sync from leader
await sync.requestFullSync();

// Clear local state cache
sync.clearCache();

// Get cached state
const cache = sync.getStateCache(); // Map<topic, stateData>
```

### Topics Published

| Topic | Data | Description |
|-------|------|-------------|
| `{channel}.sync.leader-elected` | `{ tabId, timestamp }` | New leader elected |
| `{channel}.sync.conflict` | `{ topic, local, remote, strategy }` | Conflict detected |

### Example

```html
<pan-state-sync
  channel="myapp-sync"
  topics="users.*,todos.*,settings.*"
  strategy="last-write-wins"
  leader="auto"
  debug>
</pan-state-sync>

<script type="module">
  const sync = document.querySelector('pan-state-sync');

  // Monitor leadership changes
  panClient.subscribe('myapp-sync.sync.leader-elected', ({ data }) => {
    console.log('New leader:', data.tabId);
  });

  // Force sync on demand
  document.getElementById('syncBtn').addEventListener('click', async () => {
    await sync.requestFullSync();
  });
</script>
```

---

## pan-computed-state

Derived/computed state with automatic dependency tracking.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `sources` | string | required | Comma-separated source topic list |
| `output` | string | required | Output topic for computed result |
| `debounce` | number | `0` | Debounce delay in ms |
| `retain` | boolean | false | Whether to retain the computed message |
| `async` | boolean | false | Whether the compute function is async |
| `memo` | string | `'shallow'` | Memoization: `'none'`, `'shallow'`, `'deep'` |
| `debug` | boolean | false | Enable debug logging |

### Properties

```javascript
const computed = document.querySelector('pan-computed-state');

computed.sources        // string[]: Array of source topics
computed.output         // string: Output topic
computed.lastResult     // any: Last computed value
```

### Methods

```javascript
// Force recomputation
await computed.recompute();

// Clear memoization cache
computed.clearMemo();

// Get current source data
const sources = computed.getSourceData(); // Map<topic, data>
```

### Compute Function

The compute function is provided as a `<script>` element child:

```html
<!-- Sync function -->
<pan-computed-state sources="a,b" output="sum">
  <script>
    (a, b) => a + b
  </script>
</pan-computed-state>

<!-- Async function -->
<pan-computed-state sources="userId" output="userProfile" async>
  <script>
    async (userId) => {
      const response = await fetch(`/api/users/${userId}`);
      return await response.json();
    }
  </script>
</pan-computed-state>

<!-- JSON format -->
<pan-computed-state sources="cart" output="total">
  <script type="application/json">
  {
    "compute": "(cart) => cart.items.reduce((sum, item) => sum + item.price, 0)"
  }
  </script>
</pan-computed-state>
```

### Example

```html
<pan-computed-state
  sources="cart.items,cart.tax,cart.shipping"
  output="cart.grandTotal"
  debounce="200"
  memo="shallow"
  retain>
  <script>
    (items, tax, shipping) => {
      const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
      return subtotal + tax + shipping;
    }
  </script>
</pan-computed-state>
```

---

## pan-offline-sync

Offline-first synchronization with queue management.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `storage` | string | `'pan-offline-sync'` | IndexedDB database name |
| `retry-max` | number | `3` | Maximum retry attempts |
| `retry-delay` | number | `1000` | Initial retry delay in ms |
| `topics` | string | required | Comma-separated topic patterns to queue |
| `strategy` | string | `'server-wins'` | Conflict resolution: `'server-wins'`, `'client-wins'`, `'merge'` |
| `endpoints` | JSON string | optional | Topic-to-endpoint mapping |
| `debug` | boolean | false | Enable debug logging |

### Properties

```javascript
const offlineSync = document.querySelector('pan-offline-sync');

offlineSync.online         // boolean: Network status
offlineSync.queueLength    // number: Pending mutations count
offlineSync.queue          // Array: Queue items (read-only copy)
```

### Methods

```javascript
// Force sync if online
await offlineSync.syncNow();

// Clear all pending mutations
await offlineSync.clearQueue();

// Get failed mutations
const failed = await offlineSync.getFailedMutations();
```

### Topics Published

| Topic | Data | Description |
|-------|------|-------------|
| `{storage}.queue.add` | `{ id, topic, queueLength }` | Mutation queued |
| `{storage}.queue.sync` | `{ timestamp, queueLength }` | Sync started |
| `{storage}.queue.success` | `{ id, topic, remaining }` | Mutation synced |
| `{storage}.queue.error` | `{ id, topic, error, retries }` | Sync error |
| `{storage}.queue.conflict` | `{ topic, local, server, strategy }` | Conflict detected |
| `{storage}.network.online` | `{ timestamp, queueLength }` | Network online |
| `{storage}.network.offline` | `{ timestamp }` | Network offline |

### Example

```html
<pan-offline-sync
  storage="app-offline"
  retry-max="5"
  retry-delay="2000"
  topics="todos.item.*,notes.item.*"
  strategy="server-wins"
  endpoints='{
    "todos.item.*": "/api/todos",
    "notes.item.*": "/api/notes"
  }'
  debug>
</pan-offline-sync>

<script type="module">
  const offlineSync = document.querySelector('pan-offline-sync');

  // Show network status
  panClient.subscribe('app-offline.network.online', () => {
    showNotification('Back online! Syncing...');
  });

  panClient.subscribe('app-offline.network.offline', () => {
    showNotification('You are offline. Changes will sync when reconnected.');
  });

  // Monitor queue
  panClient.subscribe('app-offline.queue.success', ({ data }) => {
    console.log('Synced:', data.topic, 'Remaining:', data.remaining);
  });
</script>
```

---

## pan-persistence-strategy

Declarative persistence routing to storage backends.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `auto-hydrate` | boolean | false | Automatically load persisted state on init |
| `debug` | boolean | false | Enable debug logging |

### Strategy Element Attributes

Each `<strategy>` child element configures a persistence rule:

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `topics` | string | required | Comma-separated topic patterns |
| `storage` | string | `'memory'` | Storage type: `'memory'`, `'localStorage'`, `'sessionStorage'`, `'indexedDB'` |
| `ttl` | number | `0` | Time-to-live in ms (0 = no expiry) |
| `database` | string | `'pan-persistence'` | IndexedDB database name |
| `max-size` | number | `0` | Max data size in bytes (0 = unlimited) |
| `compress` | boolean | false | Compress data before storage (future) |

### Methods

```javascript
const strategy = document.querySelector('pan-persistence-strategy');

// Force hydration
await strategy.hydrate();

// Clear all persisted data
await strategy.clearAll();

// View configured strategies
const strategies = strategy.getStrategies();
```

### Topics Published

| Topic | Data | Description |
|-------|------|-------------|
| `persist.hydrated` | `{ timestamp }` | All state hydrated |
| `persist.saved` | `{ topic, storage, timestamp }` | State persisted |
| `persist.error` | `{ topic, storage, error }` | Persistence error |

### Example

```html
<pan-persistence-strategy auto-hydrate debug>
  <!-- Session data: Memory only, expires in 30 min -->
  <strategy
    topics="session.*"
    storage="memory"
    ttl="1800000">
  </strategy>

  <!-- User preferences: localStorage, persists across sessions -->
  <strategy
    topics="user.preferences.*,theme.*"
    storage="localStorage">
  </strategy>

  <!-- Form drafts: sessionStorage, cleared when tab closes -->
  <strategy
    topics="forms.draft.*"
    storage="sessionStorage"
    ttl="3600000">
  </strategy>

  <!-- Large data: IndexedDB, up to 5MB per item -->
  <strategy
    topics="documents.*,images.*"
    storage="indexedDB"
    database="app-data"
    max-size="5242880">
  </strategy>
</pan-persistence-strategy>

<script type="module">
  panClient.subscribe('persist.hydrated', () => {
    console.log('All persisted state has been loaded');
  });
</script>
```

---

## pan-schema-validator

Runtime JSON Schema validation.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `topic` | string | required | Topic pattern to validate |
| `strict` | boolean | false | Reject invalid messages (vs warning only) |
| `debug` | boolean | false | Enable debug logging |

### Schema Definition

The schema is provided as a `<script type="application/json">` child element:

```html
<pan-schema-validator topic="users.item.*">
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "email": { "type": "string", "format": "email" },
      "age": { "type": "integer", "minimum": 0, "maximum": 150 }
    },
    "required": ["id", "email"]
  }
  </script>
</pan-schema-validator>
```

### Supported JSON Schema Features

- **Types**: `string`, `number`, `integer`, `boolean`, `object`, `array`, `null`
- **String**: `minLength`, `maxLength`, `pattern`, `format`
- **Number**: `minimum`, `maximum`, `multipleOf`
- **Array**: `minItems`, `maxItems`, `uniqueItems`, `items`
- **Object**: `properties`, `required`, `additionalProperties`
- **Other**: `enum`, `const`

### Built-in Formats

- `email` - Email address
- `uri` / `url` - Web URL
- `date` - ISO date (YYYY-MM-DD)
- `time` - ISO time
- `date-time` - ISO date-time
- `uuid` - UUID v4
- `ipv4` - IPv4 address
- `ipv6` - IPv6 address

### Methods

```javascript
const validator = document.querySelector('pan-schema-validator');

// Get current schema
const schema = validator.getSchema();

// Update schema
validator.setSchema({
  type: 'object',
  properties: { ... }
});

// Manual validation
const result = validator.validate(data, schema);
// { valid: boolean, errors: Array }
```

### Topics Published

| Topic | Data | Description |
|-------|------|-------------|
| `{topic}.valid` | `{ topic, timestamp }` | Message passed validation |
| `{topic}.invalid` | `{ topic, errors, timestamp }` | Message failed validation |

### Example

```html
<pan-schema-validator topic="forms.registration" strict>
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "username": {
        "type": "string",
        "minLength": 3,
        "maxLength": 20,
        "pattern": "^[a-zA-Z0-9_]+$"
      },
      "email": {
        "type": "string",
        "format": "email"
      },
      "age": {
        "type": "integer",
        "minimum": 13
      },
      "terms": {
        "type": "boolean",
        "const": true
      }
    },
    "required": ["username", "email", "terms"]
  }
  </script>
</pan-schema-validator>

<script type="module">
  // Listen for validation errors
  panClient.subscribe('forms.registration.invalid', ({ data }) => {
    data.errors.forEach(error => {
      showError(error.path, error.message);
    });
  });
</script>
```

---

## pan-undo-redo

Time-travel debugging with undo/redo support.

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `topics` | string | required | Comma-separated topic patterns to track |
| `max-history` | number | `50` | Maximum history stack size |
| `channel` | string | `'history'` | Channel name for control commands |
| `auto-snapshot` | boolean | false | Auto-snapshot on interval |
| `snapshot-interval` | number | `5000` | Snapshot interval in ms |
| `debug` | boolean | false | Enable debug logging |

### Properties

```javascript
const undoRedo = document.querySelector('pan-undo-redo');

undoRedo.canUndo        // boolean: Can undo
undoRedo.canRedo        // boolean: Can redo
undoRedo.historySize    // number: History stack size
undoRedo.futureSize     // number: Future stack size (redo)
```

### Methods

```javascript
// Undo last change
undoRedo.undo();

// Redo last undone change
undoRedo.redo();

// Clear history
undoRedo.clear();

// Force snapshot
undoRedo.snapshot();

// Get history
const history = undoRedo.getHistory();
// [{ timestamp, changes: [{ topic, oldValue, newValue }] }]

// Get current state
const state = undoRedo.getCurrentState(); // Map

// Jump to timestamp
undoRedo.goToTimestamp(1234567890);
```

### Control via PAN Topics

```javascript
// Undo
panClient.publish('history.undo', null);

// Redo
panClient.publish('history.redo', null);

// Clear history
panClient.publish('history.clear', null);

// Force snapshot
panClient.publish('history.snapshot', null);
```

### Topics Published

| Topic | Data | Description |
|-------|------|-------------|
| `{channel}.state` | `{ canUndo, canRedo, historySize, futureSize, maxHistory, timestamp }` | History state changes |

### Example

```html
<pan-undo-redo
  topics="editor.content,canvas.objects"
  max-history="100"
  channel="history"
  auto-snapshot
  snapshot-interval="3000"
  debug>
</pan-undo-redo>

<button id="undoBtn">Undo</button>
<button id="redoBtn">Redo</button>

<script type="module">
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');

  // Update button states
  panClient.subscribe('history.state', ({ data }) => {
    undoBtn.disabled = !data.canUndo;
    redoBtn.disabled = !data.canRedo;
  });

  // Wire up buttons
  undoBtn.onclick = () => panClient.publish('history.undo', null);
  redoBtn.onclick = () => panClient.publish('history.redo', null);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey) {
      if (e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        panClient.publish('history.undo', null);
      } else if (e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        panClient.publish('history.redo', null);
      }
    }
  });
</script>
```

---

## pan-store

Enhanced local reactive store with composition helpers.

### Creating a Store

```javascript
import { createStore } from '@larcjs/components/pan-store';

const store = createStore({
  count: 0,
  user: { name: 'Ada', age: 36 }
});
```

### Properties

```javascript
store.state              // Proxy: Reactive state object
```

### Core Methods

```javascript
// Subscribe to changes
const unsub = store.subscribe(({ detail }) => {
  console.log('Changed:', detail.key, detail.value, detail.oldValue);
});

// Get immutable snapshot
const snapshot = store.snapshot();

// Set single value
store.set('count', 10);

// Patch multiple values
store.patch({ count: 20, user: { name: 'Bob', age: 40 } });

// Functional update
store.update((current) => {
  current.count += 1;
  return current;
});
```

### New Composition Methods

```javascript
// Select nested value by path
const name = store.select('user.name'); // 'Ada'

// Derive computed value
const unsub = store.derive('doubledCount', ['count'], (count) => count * 2);
console.log(store.state.doubledCount); // Automatically computed

// Batch updates (single event)
store.batch(({ set }) => {
  set('count', 10);
  set('user', { name: 'Charlie', age: 25 });
});

// Add middleware
const removeMiddleware = store.use(({ key, value, oldValue }) => {
  console.log(`Middleware: ${key} changed from ${oldValue} to ${value}`);
});

// Reset to initial state
store.reset();

// Check if key exists
console.log(store.has('count')); // true

// Delete key
store.delete('count');

// Get all keys (including derived)
const keys = store.keys();
```

### Two-Way Data Binding

```javascript
import { bind } from '@larcjs/components/pan-store';

const store = createStore({ name: '', email: '' });

// Bind to form inputs
const unbind = bind(document.body, store, {
  'input[name=name]': 'name',
  'input[name=email]': 'email'
});

// Changes in inputs update store
// Changes in store update inputs
```

### Example: Shopping Cart

```javascript
import { createStore } from '@larcjs/components/pan-store';

const cart = createStore({
  items: [],
  discount: 0,
  tax: 0
});

// Computed subtotal
cart.derive('subtotal', ['items'], (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
});

// Computed total
cart.derive('total', ['subtotal', 'discount', 'tax'], (subtotal, discount, tax) => {
  return subtotal - discount + tax;
});

// Subscribe to total changes
cart.subscribe(({ detail }) => {
  if (detail.key === 'total') {
    console.log('Cart total:', detail.value);
  }
});

// Add item
cart.update((state) => {
  state.items.push({ id: 1, name: 'Widget', price: 10, qty: 2 });
  return state;
});

console.log(cart.state.subtotal); // 20
console.log(cart.state.total); // 20 + tax - discount
```

---

## Integration Example

Complete example using multiple state management components together:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Advanced State Management Demo</title>
  <script type="module" src="https://unpkg.com/@larcjs/core/pan.js"></script>
</head>
<body>
  <h1>Todo App with Advanced State</h1>

  <!-- PAN Bus -->
  <pan-bus debug></pan-bus>

  <!-- Persistence -->
  <pan-persistence-strategy auto-hydrate>
    <strategy topics="todos.*" storage="localStorage"></strategy>
  </pan-persistence-strategy>

  <!-- Cross-tab sync -->
  <pan-state-sync
    channel="todo-sync"
    topics="todos.*"
    strategy="last-write-wins">
  </pan-state-sync>

  <!-- Offline support -->
  <pan-offline-sync
    storage="todo-offline"
    topics="todos.item.*"
    endpoints='{"todos.item.*": "/api/todos"}'>
  </pan-offline-sync>

  <!-- Validation -->
  <pan-schema-validator topic="todos.item.add" strict>
    <script type="application/json">
    {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "text": { "type": "string", "minLength": 1 },
        "completed": { "type": "boolean" }
      },
      "required": ["id", "text", "completed"]
    }
    </script>
  </pan-schema-validator>

  <!-- Computed stats -->
  <pan-computed-state
    sources="todos.list.state"
    output="todos.stats"
    retain>
    <script>
      (todos) => ({
        total: todos.length,
        completed: todos.filter(t => t.completed).length,
        pending: todos.filter(t => !t.completed).length
      })
    </script>
  </pan-computed-state>

  <!-- Undo/redo -->
  <pan-undo-redo
    topics="todos.*"
    max-history="50"
    channel="history">
  </pan-undo-redo>

  <!-- Inspector for debugging -->
  <pan-inspector></pan-inspector>

  <script type="module">
    import { PanClient } from '@larcjs/core';
    const panClient = new PanClient();

    // Your app logic here...
  </script>
</body>
</html>
```

---

## See Also

- [State Management Patterns Guide](./state-management-patterns.md)
- [Offline-First Example](../examples/offline-todo-app.html)
- [Main Documentation](./README.md)
