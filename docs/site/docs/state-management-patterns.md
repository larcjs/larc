# State Management Patterns in LARC

A comprehensive guide to state management patterns, persistence strategies, and best practices for building robust applications with LARC.

## Table of Contents

1. [Core Concepts](#core-concepts)
2. [Local State Patterns](#local-state-patterns)
3. [Cross-Tab Synchronization](#cross-tab-synchronization)
4. [Offline-First Patterns](#offline-first-patterns)
5. [Persistence Strategies](#persistence-strategies)
6. [Computed State](#computed-state)
7. [State Validation](#state-validation)
8. [Time-Travel Debugging](#time-travel-debugging)
9. [Best Practices](#best-practices)

---

## Core Concepts

LARC uses a **message-based state management** approach built on the PAN (Page Area Network) bus:

- **Topics**: Hierarchical message channels (e.g., `users.list.get`, `todos.item.save`)
- **Retained Messages**: State that persists and is delivered to late subscribers
- **Request/Reply**: Async operations with correlation IDs
- **Loose Coupling**: Components communicate via topics, not direct references

### Basic State Flow

```
Component A → PAN Bus (topic: users.save) → Component B
                ↓
          Persistence Layer
                ↓
          Cross-Tab Sync
```

---

## Local State Patterns

### 1. Component-Local Reactive Store

Use `pan-store` for reactive local state within a component:

```javascript
import { createStore, bind } from '@larcjs/ui/components/pan-store.mjs';

const store = createStore({
  name: '',
  email: '',
  age: 0
});

// Two-way binding with DOM
const unbind = bind(document.body, store, {
  'input[name=name]': 'name',
  'input[name=email]': 'email',
  'input[name=age]': 'age'
});

// Subscribe to changes
store.subscribe(({ detail }) => {
  console.log('Changed:', detail.key, detail.value);
});

// Update programmatically
store.set('name', 'Ada Lovelace');
store.patch({ email: 'ada@example.com', age: 36 });
```

### 2. Enhanced Store with Composition Helpers

```javascript
const store = createStore({ count: 0, multiplier: 2 });

// Computed/derived values
store.derive('doubled', ['count', 'multiplier'], (count, mult) => count * mult);

console.log(store.state.doubled); // Automatically computed

// Middleware for logging
const removeMiddleware = store.use(({ key, value, oldValue }) => {
  console.log(`${key}: ${oldValue} → ${value}`);
});

// Batch updates (single event)
store.batch(({ set }) => {
  set('count', 10);
  set('multiplier', 3);
});

// Nested selection
const user = createStore({ profile: { name: 'Ada', age: 36 } });
console.log(store.select('profile.name')); // 'Ada'
```

### 3. PAN-Connected Store

Sync local store with PAN topics:

```javascript
import { syncItem, syncList } from '@larcjs/ui/components/pan-store-pan.mjs';
import { createStore } from '@larcjs/ui/components/pan-store.mjs';

const store = createStore({ id: '', name: '', email: '' });

// Sync with PAN topics (auto-save with debouncing)
syncItem({
  store,
  topic: 'users.item',
  id: 'user-123',
  debounce: 300 // Auto-save after 300ms of inactivity
});

// Store changes → PAN
store.set('name', 'Ada'); // Automatically published to users.item.save after 300ms

// PAN → Store
// When users.item.changed is received, store updates automatically
```

---

## Cross-Tab Synchronization

Keep state in sync across multiple browser tabs using `pan-state-sync`:

### Basic Setup

```html
<pan-bus></pan-bus>

<pan-state-sync
  channel="myapp-sync"
  topics="users.*,todos.*"
  strategy="last-write-wins"
  leader="auto"
  debug>
</pan-state-sync>
```

### Features

- **Leader Election**: One tab coordinates sync to prevent conflicts
- **Conflict Resolution**: `last-write-wins`, `merge`, or custom strategies
- **BroadcastChannel**: Native browser API for fast cross-tab messaging
- **Automatic Reconnection**: Handles tab visibility changes

### Usage Example

```javascript
// Tab 1: Update todo
panClient.publish('todos.item.update', {
  id: '123',
  title: 'Updated title',
  completed: true
}, { retain: true });

// Tab 2: Automatically receives update via BroadcastChannel
// Store updates without manual sync code
```

### Manual Sync Control

```javascript
const syncEl = document.querySelector('pan-state-sync');

// Check sync status
console.log(syncEl.isLeader); // true/false
console.log(syncEl.tabId); // Unique tab identifier

// Force full sync
await syncEl.requestFullSync();

// Clear cache
syncEl.clearCache();
```

---

## Offline-First Patterns

Build apps that work offline and sync when reconnected using `pan-offline-sync`:

### Basic Setup

```html
<pan-offline-sync
  storage="offline-queue"
  retry-max="3"
  retry-delay="1000"
  topics="todos.*,notes.*"
  strategy="server-wins"
  endpoints='{"todos.*": "/api/todos", "notes.*": "/api/notes"}'
  debug>
</pan-offline-sync>
```

### How It Works

1. **Online**: Mutations pass through directly to server
2. **Offline**: Mutations queued in IndexedDB
3. **Reconnected**: Queue processes automatically with retry logic
4. **Conflicts**: Resolved per strategy (server-wins, client-wins, merge)

### Usage Example

```javascript
// Works the same online or offline
panClient.publish('todos.item.add', {
  id: crypto.randomUUID(),
  title: 'New Todo',
  completed: false
});

// If offline, mutation is queued
// If online, sent immediately
// On reconnect, queue processes automatically
```

### Monitoring Sync Status

```javascript
const offlineSync = document.querySelector('pan-offline-sync');

// Check online status
console.log(offlineSync.online); // true/false

// Check queue
console.log(offlineSync.queueLength); // Number of pending mutations
console.log(offlineSync.queue); // Array of queued items

// Manual sync
if (offlineSync.online) {
  await offlineSync.syncNow();
}

// Subscribe to events
panClient.subscribe('offline-queue.network.online', () => {
  console.log('Back online! Syncing...');
});

panClient.subscribe('offline-queue.queue.success', ({ data }) => {
  console.log('Synced:', data.topic);
});

panClient.subscribe('offline-queue.queue.conflict', ({ data }) => {
  console.log('Conflict:', data);
});
```

---

## Persistence Strategies

Declaratively route state to different storage backends:

### Setup

```html
<pan-persistence-strategy auto-hydrate debug>
  <!-- Session data: Memory only, expires in 30 minutes -->
  <strategy topics="session.*" storage="memory" ttl="1800000"></strategy>

  <!-- User preferences: localStorage, persists across sessions -->
  <strategy topics="user.preferences.*" storage="localStorage"></strategy>

  <!-- Form drafts: sessionStorage, cleared when tab closes -->
  <strategy topics="form.draft.*" storage="sessionStorage" ttl="3600000"></strategy>

  <!-- Large data: IndexedDB, up to 5MB per item -->
  <strategy topics="*.list.*" storage="indexedDB" database="app-data" max-size="5242880"></strategy>
</pan-persistence-strategy>
```

### Storage Types

1. **memory**: No persistence, optional TTL
2. **localStorage**: Persists across sessions (~5-10MB limit)
3. **sessionStorage**: Cleared when tab closes
4. **indexedDB**: Large data, structured queries (~50MB+ depending on browser)

### Auto-Hydration

When `auto-hydrate` is enabled, persisted state is automatically loaded and published to PAN on page load:

```javascript
// On page load:
// 1. Reads from localStorage/sessionStorage/IndexedDB
// 2. Checks TTL expiration
// 3. Publishes valid state to PAN bus
// 4. Fires persist.hydrated event
```

### Manual Control

```javascript
const strategy = document.querySelector('pan-persistence-strategy');

// Force hydration
await strategy.hydrate();

// Clear all persisted data
await strategy.clearAll();

// View strategies
console.log(strategy.getStrategies());
```

---

## Computed State

Create derived state that automatically updates with `pan-computed-state`:

### Basic Example

```html
<pan-computed-state
  sources="cart.items,user.discount"
  output="cart.total"
  debounce="100"
  retain>
  <script>
    (items, discount) => {
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      return subtotal - (discount || 0);
    }
  </script>
</pan-computed-state>
```

### Async Computed State

```html
<pan-computed-state
  sources="user.location"
  output="weather.current"
  async
  debounce="300"
  retain>
  <script>
    async (location) => {
      const response = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
      return await response.json();
    }
  </script>
</pan-computed-state>
```

### Memoization

```html
<!-- Shallow memoization (default): Skip if dependencies haven't changed -->
<pan-computed-state
  sources="a,b,c"
  output="result"
  memo="shallow">
  <script>
    (a, b, c) => a + b + c
  </script>
</pan-computed-state>

<!-- Deep memoization: JSON.stringify comparison -->
<pan-computed-state memo="deep">...</pan-computed-state>

<!-- No memoization: Always recompute -->
<pan-computed-state memo="none">...</pan-computed-state>
```

### Manual Control

```javascript
const computed = document.querySelector('pan-computed-state');

// Force recomputation
await computed.recompute();

// Clear memoization cache
computed.clearMemo();

// Check last result
console.log(computed.lastResult);

// View source data
console.log(computed.getSourceData());
```

---

## State Validation

Validate state against JSON Schema at runtime:

### Basic Validation

```html
<pan-schema-validator topic="users.item.*" strict>
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "email": { "type": "string", "format": "email" },
      "age": { "type": "number", "minimum": 0, "maximum": 150 },
      "role": { "type": "string", "enum": ["admin", "user", "guest"] }
    },
    "required": ["id", "email"]
  }
  </script>
</pan-schema-validator>
```

### Modes

- **Strict Mode** (`strict` attribute): Reject invalid messages, publish `.cancel` event
- **Warning Mode** (default): Log validation errors but allow messages through

### Supported JSON Schema Features

- **Types**: string, number, integer, boolean, object, array, null
- **String**: minLength, maxLength, pattern, format (email, uri, date-time, uuid, ipv4, ipv6)
- **Number**: minimum, maximum, multipleOf
- **Array**: minItems, maxItems, uniqueItems, items
- **Object**: properties, required, additionalProperties
- **enum, const**

### Validation Events

```javascript
panClient.subscribe('users.item.*.valid', ({ data }) => {
  console.log('Valid message:', data);
});

panClient.subscribe('users.item.*.invalid', ({ data }) => {
  console.error('Validation errors:', data.errors);
  // data.errors: [{ path: 'email', message: 'Invalid email format' }]
});
```

---

## Time-Travel Debugging

Implement undo/redo with `pan-undo-redo`:

### Setup

```html
<pan-undo-redo
  topics="editor.*,canvas.*"
  max-history="50"
  channel="history"
  auto-snapshot
  snapshot-interval="5000"
  debug>
</pan-undo-redo>
```

### Usage

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

### History State

```javascript
panClient.subscribe('history.state', ({ data }) => {
  console.log('Can undo:', data.canUndo);
  console.log('Can redo:', data.canRedo);
  console.log('History size:', data.historySize);
  console.log('Future size:', data.futureSize);
});
```

### Direct Control

```javascript
const undoRedo = document.querySelector('pan-undo-redo');

// Check state
console.log(undoRedo.canUndo); // true/false
console.log(undoRedo.canRedo); // true/false

// Manual operations
undoRedo.undo();
undoRedo.redo();
undoRedo.clear();

// Get history
const history = undoRedo.getHistory();
// [{ timestamp, changes: [{ topic, oldValue, newValue }] }]

// Jump to specific point in time
undoRedo.goToTimestamp(1234567890);

// Get current state snapshot
const state = undoRedo.getCurrentState();
```

### Batching Changes

Changes are automatically batched with a 100ms window to group related updates:

```javascript
// These will be grouped into a single undo step
store.set('x', 10);
store.set('y', 20);
store.set('z', 30);
// Wait 100ms...

// One undo() will revert all three changes
```

---

## Best Practices

### 1. Topic Naming Conventions

Use hierarchical topics for clarity:

```
resource.collection.action
resource.item.action

✅ users.list.get
✅ users.item.save
✅ users.item.delete
✅ cart.items.add
✅ auth.login.request

❌ getUsersList
❌ saveUser
❌ delete_user
```

### 2. Retain Strategically

Mark important state as `retained` to ensure late subscribers receive it:

```javascript
// Retained: Current user, app config, UI state
panClient.publish('auth.current-user', user, { retain: true });

// Transient: Notifications, loading states, temporary UI
panClient.publish('ui.notification', message, { retain: false });
```

### 3. Use Wildcards Carefully

Wildcards are powerful but can impact performance:

```javascript
// ✅ Specific
panClient.subscribe('users.item.123.changed', handler);

// ✅ Narrow wildcard
panClient.subscribe('users.item.*.changed', handler);

// ⚠️ Broad wildcard (use sparingly)
panClient.subscribe('users.*', handler);

// ❌ Global wildcard (debugging only)
panClient.subscribe('*', handler);
```

### 4. Debounce Mutations

Use debouncing to reduce network traffic and improve performance:

```javascript
// Auto-save after 300ms of inactivity
syncItem({ store, topic: 'users.item', id: '123', debounce: 300 });

// Computed state with debouncing
<pan-computed-state sources="search.query" output="search.results" debounce="500">
```

### 5. Handle Conflicts Gracefully

Choose appropriate conflict resolution strategies:

- **server-wins**: Safe default, server is source of truth
- **client-wins**: Optimistic UI, client changes always win
- **merge**: Combine changes (requires custom logic)

```html
<pan-offline-sync strategy="server-wins">...</pan-offline-sync>
```

### 6. Validate Early

Validate state at boundaries (user input, API responses):

```html
<!-- Validate user input -->
<pan-schema-validator topic="forms.user-registration.*" strict>
  ...
</pan-schema-validator>

<!-- Validate API responses -->
<pan-schema-validator topic="api.users.*.response">
  ...
</pan-schema-validator>
```

### 7. Monitor Performance

Use the enhanced `pan-inspector` to track:

- Message throughput
- Topic activity
- State tree size
- Average message size

```html
<pan-inspector></pan-inspector>
```

### 8. Clean Up Subscriptions

Always unsubscribe to prevent memory leaks:

```javascript
const unsub = panClient.subscribe('users.*', handler);

// Later...
unsub();

// Or in component disconnectedCallback:
disconnectedCallback() {
  this._subscriptions.forEach(unsub => unsub());
}
```

### 9. Test State Transitions

Use `pan-inspector` export/import for testing:

```javascript
// Export current state
const inspector = document.querySelector('pan-inspector');
// Click "Export" in State Tree tab → Downloads JSON

// In tests: Import state
panClient.publish('todos.list.state', testData, { retain: true });
```

### 10. Progressive Enhancement

Build layers incrementally:

1. **Local state**: Start with `pan-store` for component state
2. **Global state**: Add PAN-connected stores for cross-component communication
3. **Persistence**: Add `pan-persistence-strategy` for offline support
4. **Sync**: Add `pan-state-sync` for multi-tab
5. **Offline**: Add `pan-offline-sync` for offline-first
6. **Debug**: Add `pan-undo-redo` and enhanced inspector

---

## Common Patterns

### Pattern: Shopping Cart

```html
<!-- Persistence -->
<pan-persistence-strategy auto-hydrate>
  <strategy topics="cart.*" storage="localStorage"></strategy>
</pan-persistence-strategy>

<!-- Validation -->
<pan-schema-validator topic="cart.item.add">
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "id": { "type": "string" },
      "quantity": { "type": "integer", "minimum": 1 },
      "price": { "type": "number", "minimum": 0 }
    },
    "required": ["id", "quantity", "price"]
  }
  </script>
</pan-schema-validator>

<!-- Computed total -->
<pan-computed-state
  sources="cart.items,cart.discount"
  output="cart.total"
  retain>
  <script>
    (items, discount) => {
      const subtotal = items.reduce((sum, item) => sum.price * item.quantity, 0);
      return Math.max(0, subtotal - (discount || 0));
    }
  </script>
</pan-computed-state>

<!-- Cross-tab sync -->
<pan-state-sync channel="cart-sync" topics="cart.*"></pan-state-sync>
```

### Pattern: Collaborative Editor

```html
<!-- Offline support -->
<pan-offline-sync
  topics="document.edit.*"
  strategy="merge"
  endpoints='{"document.edit.*": "/api/documents"}'
  retry-max="5">
</pan-offline-sync>

<!-- Cross-tab sync -->
<pan-state-sync
  channel="editor-sync"
  topics="document.content,document.cursor.*"
  strategy="merge">
</pan-state-sync>

<!-- Undo/redo -->
<pan-undo-redo
  topics="document.content"
  max-history="100"
  auto-snapshot
  snapshot-interval="3000">
</pan-undo-redo>

<!-- Autosave -->
<pan-computed-state
  sources="document.content"
  output="document.save.trigger"
  debounce="2000">
  <script>
    (content) => ({ content, timestamp: Date.now() })
  </script>
</pan-computed-state>
```

---

## Migration from Other State Managers

### From Redux

| Redux | LARC |
|-------|------|
| Store | PAN Bus + Retained Messages |
| Actions | PAN Topics (e.g., `users.add`) |
| Reducers | Provider Components (e.g., `pan-data-provider`) |
| Selectors | `pan-computed-state` or `store.select()` |
| Middleware | `store.use()` or PAN message handlers |
| DevTools | `pan-inspector` + Chrome Extension |

### From Context API (React)

| Context API | LARC |
|-------------|------|
| `createContext()` | PAN topic namespace |
| `Provider` | Provider components (e.g., `pan-auth`, `pan-theme-provider`) |
| `useContext()` | `usePanState()` (React adapter) or `panClient.subscribe()` |
| Context value | Retained message data |

---

## Next Steps

- Explore the [offline-first example](../examples/offline-todo/)
- Check out the [React adapter guide](./react-integration.md)
- Read the [PAN Bus architecture](./pan-architecture.md)
- Try the [interactive playground](https://larc.page/playground)

---

**Questions?** Open an issue on [GitHub](https://github.com/yourusername/larc) or join our [Discord](https://discord.gg/larc).
