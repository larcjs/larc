# Advanced State Management in LARC

This document describes the enhanced state management capabilities added to LARC, providing persistent, cross-tab synchronized, offline-first state management while maintaining the zero-build, framework-agnostic philosophy.

## 🎯 Overview

LARC now includes a comprehensive suite of state management components that work together to provide:

- **Cross-tab synchronization** - State stays in sync across browser tabs
- **Offline-first support** - Queue mutations when offline, sync when reconnected
- **Flexible persistence** - Route state to memory, localStorage, sessionStorage, or IndexedDB
- **Computed state** - Derived values with automatic dependency tracking
- **Runtime validation** - JSON Schema validation without build tools
- **Time-travel debugging** - Undo/redo with history management
- **Enhanced debugging** - State tree visualization, metrics, and performance profiling

All components maintain LARC's core principles:
- ✅ Zero build required - works directly in browsers
- ✅ Framework agnostic - works with vanilla JS, React, Vue, etc.
- ✅ Web Components based - declarative HTML configuration
- ✅ Progressive enhancement - adopt features incrementally

## 📦 New Components

### 1. `pan-state-sync` - Cross-Tab Synchronization

Synchronizes state across multiple browser tabs using BroadcastChannel API.

**Features:**
- Leader election to prevent sync loops
- Conflict resolution strategies (last-write-wins, merge, custom)
- Automatic state hydration when tabs become visible
- Tab heartbeat monitoring

**Usage:**
```html
<pan-state-sync
  channel="myapp-sync"
  topics="users.*,todos.*"
  strategy="last-write-wins"
  leader="auto"
  debug>
</pan-state-sync>
```

**API:**
```javascript
const sync = document.querySelector('pan-state-sync');

console.log(sync.isLeader);     // true/false
console.log(sync.tabId);        // Unique tab ID
await sync.requestFullSync();   // Force sync from leader
sync.clearCache();              // Clear local cache
```

**Topics:**
- `{channel}.sync.message` - State broadcast to other tabs
- `{channel}.sync.leader-elected` - New leader elected
- `{channel}.sync.conflict` - Conflict detected

---

### 2. `pan-computed-state` - Derived State

Creates computed values that automatically update when dependencies change.

**Features:**
- Subscribe to multiple PAN topics
- Async computation support
- Debouncing for performance
- Memoization strategies (none, shallow, deep)

**Usage:**
```html
<pan-computed-state
  sources="cart.items,user.discount"
  output="cart.total"
  debounce="100"
  memo="shallow"
  retain>
  <script>
    (items, discount) => {
      const subtotal = items.reduce((sum, item) => sum + item.price, 0);
      return subtotal - (discount || 0);
    }
  </script>
</pan-computed-state>
```

**Async Example:**
```html
<pan-computed-state
  sources="user.location"
  output="weather.current"
  async
  debounce="500">
  <script>
    async (location) => {
      const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
      return await res.json();
    }
  </script>
</pan-computed-state>
```

**API:**
```javascript
const computed = document.querySelector('pan-computed-state');

await computed.recompute();         // Force recomputation
computed.clearMemo();               // Clear memoization cache
console.log(computed.lastResult);   // Last computed value
console.log(computed.getSourceData()); // Current source values
```

---

### 3. `pan-offline-sync` - Offline-First Support

Queues mutations when offline and automatically syncs when reconnected.

**Features:**
- IndexedDB-based mutation queue
- Automatic retry with exponential backoff
- Conflict resolution (server-wins, client-wins, merge)
- Network status monitoring

**Usage:**
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

**API:**
```javascript
const offlineSync = document.querySelector('pan-offline-sync');

console.log(offlineSync.online);         // true/false
console.log(offlineSync.queueLength);    // Number of pending mutations
console.log(offlineSync.queue);          // Array of queued items

await offlineSync.syncNow();             // Force sync if online
await offlineSync.clearQueue();          // Clear all pending
const failed = await offlineSync.getFailedMutations(); // Get failures
```

**Topics:**
- `{storage}.queue.add` - Mutation queued
- `{storage}.queue.sync` - Sync started
- `{storage}.queue.success` - Mutation synced
- `{storage}.queue.error` - Sync error
- `{storage}.queue.conflict` - Conflict detected
- `{storage}.network.online` - Network online
- `{storage}.network.offline` - Network offline

---

### 4. `pan-persistence-strategy` - Declarative Persistence

Routes state to different storage backends based on topic patterns.

**Features:**
- Multiple storage backends (memory, localStorage, sessionStorage, IndexedDB)
- TTL (time-to-live) support for cache expiration
- Size limits per topic
- Automatic hydration on page load

**Usage:**
```html
<pan-persistence-strategy auto-hydrate debug>
  <!-- Session data in memory, expires in 30 min -->
  <strategy topics="session.*" storage="memory" ttl="1800000"></strategy>

  <!-- User preferences in localStorage -->
  <strategy topics="user.preferences.*" storage="localStorage"></strategy>

  <!-- Form drafts in sessionStorage -->
  <strategy topics="form.draft.*" storage="sessionStorage" ttl="3600000"></strategy>

  <!-- Large data in IndexedDB, max 5MB per item -->
  <strategy topics="*.list.*" storage="indexedDB" database="app-data" max-size="5242880"></strategy>
</pan-persistence-strategy>
```

**API:**
```javascript
const strategy = document.querySelector('pan-persistence-strategy');

await strategy.hydrate();           // Force hydration
await strategy.clearAll();          // Clear all persisted data
console.log(strategy.getStrategies()); // View configured strategies
```

**Topics:**
- `persist.hydrated` - All state hydrated
- `persist.saved` - State persisted
- `persist.error` - Persistence error

---

### 5. `pan-schema-validator` - Runtime Validation

Validates PAN messages against JSON Schema without build tools.

**Features:**
- Subset of JSON Schema Draft-07
- Strict mode (reject invalid) or warning mode (log only)
- Built-in format validators (email, uri, date-time, uuid, ipv4, ipv6)
- Detailed error messages with paths

**Usage:**
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

**Supported JSON Schema Features:**
- Types: string, number, integer, boolean, object, array, null
- String: minLength, maxLength, pattern, format
- Number: minimum, maximum, multipleOf
- Array: minItems, maxItems, uniqueItems, items
- Object: properties, required, additionalProperties
- enum, const

**Topics:**
- `{topic}.valid` - Message passed validation
- `{topic}.invalid` - Message failed validation

---

### 6. `pan-undo-redo` - Time-Travel Debugging

Provides undo/redo functionality with history management.

**Features:**
- Configurable history stack size
- Automatic change batching (100ms window)
- Auto-snapshot on interval
- Jump to specific timestamp

**Usage:**
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

**Control:**
```javascript
// Via PAN topics
panClient.publish('history.undo', null);
panClient.publish('history.redo', null);
panClient.publish('history.clear', null);
panClient.publish('history.snapshot', null);

// Direct API
const undoRedo = document.querySelector('pan-undo-redo');

undoRedo.undo();                    // Undo last change
undoRedo.redo();                    // Redo last undone change
undoRedo.clear();                   // Clear history
undoRedo.snapshot();                // Force snapshot

console.log(undoRedo.canUndo);      // true/false
console.log(undoRedo.canRedo);      // true/false
console.log(undoRedo.historySize);  // Number of history entries

const history = undoRedo.getHistory(); // Full history
undoRedo.goToTimestamp(1234567890);    // Jump to specific point
```

**Topics:**
- `{channel}.state` - History state changes (canUndo, canRedo, sizes)

---

### 7. Enhanced `pan-inspector`

The existing pan-inspector has been significantly enhanced with:

**New Features:**
- **State Tree View** - Visualize all retained messages in a tree
- **Metrics Dashboard** - Total messages, message rate, top topics
- **Advanced Filtering** - Filter by topic patterns and message type
- **Message Type Filtering** - Separate retained vs transient messages
- **Performance Tracking** - Message handler duration, sizes
- **Export/Import** - Save and restore state snapshots
- **Message Details Modal** - Inspect full message data and metadata

**Views:**
1. **Messages** - Real-time message log with filtering
2. **State Tree** - Hierarchical view of retained state
3. **Metrics** - Performance and usage statistics

---

### 8. Enhanced `pan-store`

The local reactive store now includes composition helpers:

**New Methods:**
```javascript
const store = createStore({ count: 0, name: 'Ada' });

// Select nested values
console.log(store.select('user.profile.name'));

// Derive computed values
store.derive('doubled', ['count'], (count) => count * 2);

// Batch updates (single event)
store.batch(({ set }) => {
  set('count', 10);
  set('name', 'Bob');
});

// Middleware
const unsub = store.use(({ key, value, oldValue }) => {
  console.log(`${key}: ${oldValue} → ${value}`);
});

// Reset to initial state
store.reset();

// Check key existence
console.log(store.has('count')); // true

// Delete key
store.delete('count');

// Get all keys (including derived)
console.log(store.keys());
```

---

## 🚀 Quick Start

### 1. Basic Setup

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Load LARC -->
  <script type="module">
    import '../../core/src/pan.mjs';
  </script>

  <!-- PAN Bus -->
  <pan-bus debug></pan-bus>

  <!-- State Management Components -->
  <pan-persistence-strategy auto-hydrate>
    <strategy topics="*" storage="localStorage"></strategy>
  </pan-persistence-strategy>

  <pan-state-sync channel="myapp" topics="*"></pan-state-sync>

  <pan-inspector></pan-inspector>

  <!-- Your app code -->
  <script type="module">
    import { PanClient } from '../../core/src/components/pan-client.mjs';
    const panClient = new PanClient();

    // Publish state
    panClient.publish('user.name', 'Ada', { retain: true });

    // Subscribe to changes
    panClient.subscribe('user.name', ({ data }) => {
      console.log('Name changed:', data);
    });
  </script>
</body>
</html>
```

### 2. Offline-First Todo App

See `examples/offline-todo-app.html` for a complete example demonstrating:
- Cross-tab sync
- Offline queueing
- Auto-persistence
- Undo/redo
- Schema validation
- Computed state

### 3. Common Patterns

**Shopping Cart:**
```html
<pan-persistence-strategy auto-hydrate>
  <strategy topics="cart.*" storage="localStorage"></strategy>
</pan-persistence-strategy>

<pan-computed-state sources="cart.items" output="cart.total" retain>
  <script>
    (items) => items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  </script>
</pan-computed-state>

<pan-state-sync channel="cart" topics="cart.*"></pan-state-sync>
```

**Form with Validation:**
```html
<pan-schema-validator topic="forms.registration" strict>
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "email": { "type": "string", "format": "email" },
      "age": { "type": "integer", "minimum": 13 }
    },
    "required": ["email"]
  }
  </script>
</pan-schema-validator>

<pan-persistence-strategy auto-hydrate>
  <strategy topics="forms.draft.*" storage="sessionStorage" ttl="3600000"></strategy>
</pan-persistence-strategy>
```

---

## 📖 Documentation

- **[State Management Patterns Guide](./site/docs/state-management-patterns.md)** - Comprehensive patterns and best practices
- **[Offline-First Example](./examples/offline-todo-app.html)** - Working demo app
- **[API Reference](./site/docs/api-reference.md)** - Detailed API docs

---

## 🎯 Best Practices

1. **Use retained messages for important state** - Session data, user prefs, UI state
2. **Debounce frequently changing values** - Input fields, scroll positions
3. **Validate at boundaries** - User input, API responses
4. **Choose appropriate storage** - Memory for temporary, IndexedDB for large data
5. **Monitor performance** - Use pan-inspector metrics view
6. **Test offline scenarios** - Use Chrome DevTools network throttling
7. **Handle conflicts gracefully** - Choose appropriate resolution strategy
8. **Clean up subscriptions** - Unsubscribe in disconnectedCallback

---

## 🤝 Migration Guide

### From Redux

| Redux | LARC |
|-------|------|
| Store | PAN Bus + Retained Messages |
| Actions | PAN Topics |
| Reducers | Provider Components |
| Selectors | pan-computed-state |
| Middleware | store.use() |
| DevTools | pan-inspector |

### From Context API

| Context API | LARC |
|-------------|------|
| createContext() | PAN topic namespace |
| Provider | Provider components |
| useContext() | panClient.subscribe() |

---

## 🔮 Roadmap

Future enhancements under consideration:

- [ ] State migration utilities for schema changes
- [ ] Conflict resolution UI components
- [ ] React DevTools integration
- [ ] Performance profiling with flame graphs
- [ ] State snapshots with compression
- [ ] SharedWorker for cross-tab coordination
- [ ] Service Worker integration for offline PWAs

---

## 🐛 Troubleshooting

**Cross-tab sync not working:**
- Check BroadcastChannel browser support
- Verify same channel name across tabs
- Check browser console for errors

**Offline sync not queuing:**
- Verify IndexedDB is available
- Check topic patterns match mutations
- Look for validation errors

**State not persisting:**
- Check storage quotas (localStorage ~5-10MB, IndexedDB ~50MB+)
- Verify topic patterns in persistence strategy
- Check browser privacy settings

**Undo/redo not working:**
- Ensure topics match tracked patterns
- Check max-history limit
- Verify changes aren't from undo-redo itself (check meta.source)

---

## 📄 License

Same as LARC core (check main LICENSE file)

---

## 🙏 Credits

Built with love by the LARC community. Inspired by:
- Redux for predictable state
- MobX for reactivity
- IndexedDB for persistence
- MQTT for messaging patterns

---

**Questions or feedback?** Open an issue on GitHub!
