# Chapter 22: Data Components

*In which we explore state management and persistent storage without losing track of what's true*

Data is the lifeblood of any application, but managing that data—keeping it consistent, synchronized, and available—is where complexity breeds. An application without proper data management is like a library where books randomly teleport between shelves. Eventually, nobody trusts anything they find.

This chapter covers LARC's data components: tools designed to manage state and persistent storage in ways that feel predictable and maintainable. We'll explore `pan-store`, a reactive state management solution built on JavaScript Proxies and EventTarget, and `pan-idb`, a component that bridges IndexedDB with LARC's message bus. By the end, you'll understand how to build applications that handle data with discipline and grace.

## Overview

LARC provides two core components for data management:

- **pan-store**: Reactive state management for in-memory application state
- **pan-idb**: IndexedDB integration for persistent client-side storage

These components operate independently but complement each other. Use `pan-store` for reactive application state that needs to be synchronized across components. Use `pan-idb` when you need data to persist across sessions or when working with large datasets that exceed reasonable memory limits.

Both components communicate via the PAN bus, making them first-class participants in LARC's message-based architecture. State changes become messages. Database operations become requests. Everything flows through topics, maintaining the architectural consistency that makes LARC applications comprehensible.

## pan-store: Reactive State Management

### Purpose

`pan-store` provides reactive state management using JavaScript Proxies and the EventTarget API. It's designed for shared application state that needs to be observed by multiple components without tight coupling.

Think of it as a specialized key-value store that automatically notifies subscribers when values change. Set a property, and any component listening for that change receives a message. No manual event dispatching, no brittle observer patterns, just reactive updates that work.

### When to Use

Use `pan-store` when you need:

- **Shared state across components**: User preferences, authentication status, shopping cart contents
- **Reactive updates**: Components that need to re-render when specific values change
- **Middleware hooks**: Logging, validation, or side effects on state changes
- **Derived values**: Computed properties that depend on other state
- **Undo/redo functionality**: State snapshots make time-travel debugging possible

### When Not to Use

Avoid `pan-store` for:

- **Local component state**: Use plain JavaScript properties instead
- **Large datasets**: IndexedDB or OPFS are better suited for bulk data
- **Transient UI state**: Dropdown open/closed, hover states, animation frames
- **High-frequency updates**: Thousands of changes per second may cause performance issues

### Installation

```javascript
import { createStore, bind } from './pan-store.mjs';
```

The module exports two functions:

- `createStore(initial)`: Creates a new reactive store
- `bind(element, store, mapping, options)`: Binds form inputs to store properties

### API Reference

#### createStore(initial)

Creates a reactive store with optional initial state.

**Parameters:**
- `initial` (Object, optional): Initial state object. Defaults to `{}`

**Returns:** Store instance with the following methods and properties

**Example:**
```javascript
const store = createStore({
  count: 0,
  user: { name: 'Ada', role: 'admin' }
});
```

#### Store Properties

**state** (Proxy)

The reactive state object. Access and modify properties directly:

```javascript
store.state.count = 5;
console.log(store.state.count); // 5
```

Any assignment triggers change events and notifies subscribers.

#### Store Methods

**subscribe(callback)**

Subscribes to state changes.

**Parameters:**
- `callback` (Function): Called when state changes. Receives event object with `detail` containing:

  - `key` (String): Changed property name
  - `value` (Any): New value
  - `oldValue` (Any): Previous value
  - `state` (Proxy): Current state object

**Returns:** Unsubscribe function

**Example:**
```javascript
const unsub = store.subscribe(({ detail }) => {
  console.log(`${detail.key} changed from ${detail.oldValue} to ${detail.value}`);
});

// Later, unsubscribe
unsub();
```

**set(key, value)**

Sets a single property.

**Parameters:**
- `key` (String): Property name
- `value` (Any): New value

**Example:**
```javascript
store.set('theme', 'dark');
```

**patch(object)**

Merges multiple properties at once.

**Parameters:**
- `object` (Object): Properties to merge

**Example:**
```javascript
store.patch({
  theme: 'dark',
  fontSize: 16
});
```

**update(fn)**

Updates state using a function.

**Parameters:**
- `fn` (Function): Receives current state snapshot, returns new state (or mutates and returns undefined)

**Example:**
```javascript
store.update(state => {
  state.count += 1;
  return state;
});
```

**select(path)**

Retrieves nested value by dot-notation path.

**Parameters:**
- `path` (String): Dot-separated property path

**Returns:** Value at path, or `undefined` if not found

**Example:**
```javascript
store.state.user = { profile: { name: 'Ada' } };
const name = store.select('user.profile.name'); // 'Ada'
```

**derive(key, deps, computeFn)**

Creates a computed/derived value.

**Parameters:**
- `key` (String): Name for derived property
- `deps` (Array|Function): Dependency property names, or compute function if omitted
- `computeFn` (Function): Computation function receiving dependency values

**Returns:** Unsubscribe function

**Example:**
```javascript
store.state.firstName = 'Ada';
store.state.lastName = 'Lovelace';

store.derive('fullName', ['firstName', 'lastName'], (first, last) => {
  return `${first} ${last}`;
});

console.log(store.state.fullName); // 'Ada Lovelace'
```

**batch(fn)**

Batches multiple updates into single change event.

**Parameters:**
- `fn` (Function): Receives object with `set(key, value)` method and `state` proxy

**Example:**
```javascript
store.batch(({ set }) => {
  set('loading', true);
  set('error', null);
  set('data', null);
});
```

**use(middleware)**

Adds middleware function called on every state change.

**Parameters:**
- `middleware` (Function): Receives object with `key`, `value`, `oldValue`, `state`

**Returns:** Unsubscribe function

**Example:**
```javascript
const unuse = store.use(({ key, value }) => {
  console.log(`[Middleware] ${key} = ${value}`);
});
```

**snapshot()**

Creates deep clone of current state.

**Returns:** Plain object with current state

**Example:**
```javascript
const current = store.snapshot();
console.log(current); // { count: 5, theme: 'dark' }
```

**reset()**

Resets state to initial values.

**Example:**
```javascript
store.reset();
```

**has(key)**

Checks if property exists (including derived properties).

**Parameters:**
- `key` (String): Property name

**Returns:** Boolean

**Example:**
```javascript
store.has('count'); // true
store.has('nonexistent'); // false
```

**delete(key)**

Removes property from state.

**Parameters:**
- `key` (String): Property name

**Returns:** Boolean (true if deleted, false if didn't exist)

**Example:**
```javascript
store.delete('temporaryFlag');
```

**keys()**

Returns all property names, including derived properties.

**Returns:** Array of strings

**Example:**
```javascript
const allKeys = store.keys(); // ['count', 'theme', 'fullName']
```

#### Store Events

**state**

Emitted when state changes.

**Event Detail:**
- `key` (String): Changed property name
- `value` (Any): New value
- `oldValue` (Any): Previous value
- `state` (Proxy): Current state
- `batch` (Boolean, optional): True if part of batch update
- `changes` (Array, optional): Array of changes in batch
- `deleted` (Boolean, optional): True if property was deleted

**derived**

Emitted when derived value updates.

**Event Detail:**
- `key` (String): Derived property name
- `value` (Any): New computed value
- `state` (Proxy): Current state

### bind(element, store, mapping, options)

Binds form inputs to store properties, creating two-way data binding.

**Parameters:**
- `element` (HTMLElement): Container element
- `store` (Store): Store instance
- `mapping` (Object): Map of CSS selectors to property names
- `options` (Object, optional):

  - `events` (Array): Events to listen for (default: `['input', 'change']`)

**Returns:** Unbind function

**Example:**
```javascript
const store = createStore({ username: '', email: '' });

const form = document.querySelector('#user-form');
const unbind = bind(form, store, {
  'input[name="username"]': 'username',
  'input[name="email"]': 'email'
});

// Input changes update store
// Store changes update inputs
```

### Complete Working Examples

#### Basic Counter

```html
<!DOCTYPE html>
<html>
<head>
  <title>Counter with pan-store</title>
</head>
<body>
  <div id="app">
    <h1>Count: <span id="count">0</span></h1>
    <button id="increment">+</button>
    <button id="decrement">-</button>
    <button id="reset">Reset</button>
  </div>

  <script type="module">
    import { createStore } from './pan-store.mjs';

    const store = createStore({ count: 0 });

    // Subscribe to changes
    store.subscribe(({ detail }) => {
      if (detail.key === 'count') {
        document.getElementById('count').textContent = detail.value;
      }
    });

    // Bind buttons
    document.getElementById('increment').addEventListener('click', () => {
      store.state.count++;
    });

    document.getElementById('decrement').addEventListener('click', () => {
      store.state.count--;
    });

    document.getElementById('reset').addEventListener('click', () => {
      store.reset();
    });
  </script>
</body>
</html>
```

#### Form Binding

```html
<!DOCTYPE html>
<html>
<head>
  <title>Form Binding</title>
</head>
<body>
  <form id="settings">
    <label>
      Theme:
      <select name="theme">
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
    </label>

    <label>
      <input type="checkbox" name="notifications">
      Enable notifications
    </label>

    <label>
      Font size:
      <input type="range" name="fontSize" min="12" max="24">
    </label>
  </form>

  <pre id="output"></pre>

  <script type="module">
    import { createStore, bind } from './pan-store.mjs';

    const store = createStore({
      theme: 'light',
      notifications: false,
      fontSize: 16
    });

    // Bind form inputs
    const form = document.getElementById('settings');
    bind(form, store, {
      'select[name="theme"]': 'theme',
      'input[name="notifications"]': 'notifications',
      'input[name="fontSize"]': 'fontSize'
    });

    // Display current state
    const output = document.getElementById('output');
    store.subscribe(() => {
      output.textContent = JSON.stringify(store.snapshot(), null, 2);
    });

    // Initial render
    output.textContent = JSON.stringify(store.snapshot(), null, 2);
  </script>
</body>
</html>
```

#### Derived Values and Middleware

```javascript
import { createStore } from './pan-store.mjs';

// Create store with cart items
const store = createStore({
  items: [
    { id: 1, name: 'Widget', price: 10, quantity: 2 },
    { id: 2, name: 'Gadget', price: 25, quantity: 1 }
  ],
  taxRate: 0.08
});

// Derive subtotal
store.derive('subtotal', ['items'], (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
});

// Derive tax
store.derive('tax', ['subtotal', 'taxRate'], (subtotal, rate) => {
  return subtotal * rate;
});

// Derive total
store.derive('total', ['subtotal', 'tax'], (subtotal, tax) => {
  return subtotal + tax;
});

// Add logging middleware
store.use(({ key, value, oldValue }) => {
  console.log(`State changed: ${key}`, { oldValue, newValue: value });
});

// Add validation middleware
store.use(({ key, value }) => {
  if (key === 'taxRate' && (value < 0 || value > 1)) {
    console.error('Invalid tax rate:', value);
  }
});

// Subscribe to total changes
store.subscribe(({ detail }) => {
  if (detail.key === 'total') {
    console.log(`Cart total: $${detail.value.toFixed(2)}`);
  }
});

// Access computed values
console.log(store.state.subtotal); // 45
console.log(store.state.tax); // 3.6
console.log(store.state.total); // 48.6
```

#### Time-Travel Debugging

```javascript
import { createStore } from './pan-store.mjs';

const store = createStore({ position: { x: 0, y: 0 } });

// History tracking
const history = [store.snapshot()];
let historyIndex = 0;

store.subscribe(() => {
  // Save snapshot after each change
  const snapshot = store.snapshot();
  history.splice(historyIndex + 1);
  history.push(snapshot);
  historyIndex = history.length - 1;
});

function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    store.patch(history[historyIndex]);
  }
}

function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    store.patch(history[historyIndex]);
  }
}

// Make changes
store.state.position = { x: 10, y: 20 };
store.state.position = { x: 15, y: 25 };

console.log(store.state.position); // { x: 15, y: 25 }

undo();
console.log(store.state.position); // { x: 10, y: 20 }

undo();
console.log(store.state.position); // { x: 0, y: 0 }

redo();
console.log(store.state.position); // { x: 10, y: 20 }
```

### Common Issues and Solutions

**Issue: Nested object changes not detected**

```javascript
// Problem: Direct mutation doesn't trigger updates
store.state.user.name = 'Ada'; // No event fired

// Solution: Reassign the parent object
store.state.user = { ...store.state.user, name: 'Ada' };

// Or use update()
store.update(state => {
  state.user.name = 'Ada';
  return state;
});
```

**Issue: Circular references causing errors**

```javascript
// Problem: snapshot() fails with circular structures
const store = createStore({});
store.state.self = store.state; // Circular reference

// Solution: Avoid circular references, or use custom serialization
store.use(({ key, value }) => {
  // Custom handling for specific keys
  if (key === 'self') {
    return; // Skip serialization
  }
});
```

**Issue: Performance with frequent updates**

```javascript
// Problem: Hundreds of updates firing individual events
for (let i = 0; i < 1000; i++) {
  store.state.count = i; // 1000 events
}

// Solution: Use batch()
store.batch(({ set }) => {
  for (let i = 0; i < 1000; i++) {
    set('count', i);
  }
}); // Single event
```

**Issue: Memory leaks from uncanceled subscriptions**

```javascript
// Problem: Subscriptions outlive components
class MyComponent extends HTMLElement {
  connectedCallback() {
    store.subscribe(this.handleChange); // Never unsubscribed
  }
}

// Solution: Store unsub function and call in disconnectedCallback
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.unsub = store.subscribe(this.handleChange);
  }

  disconnectedCallback() {
    if (this.unsub) this.unsub();
  }
}
```

## pan-idb: IndexedDB Integration

### Purpose

`pan-idb` provides a declarative interface to IndexedDB through LARC's message bus. It handles database initialization, schema upgrades, and CRUD operations via PAN topics, abstracting away IndexedDB's verbose API.

Think of it as a database component that speaks the language of your application. Instead of managing transactions, cursors, and error handlers manually, you publish messages and receive results.

### When to Use

Use `pan-idb` when you need:

- **Persistent client-side storage**: Data that survives page reloads and browser restarts
- **Offline-first applications**: Local storage for sync later
- **Large datasets**: Gigabytes of data that won't fit in memory
- **Structured queries**: Indexed lookups by multiple fields
- **File-like data**: Blobs, images, or binary data

### When Not to Use

Avoid `pan-idb` for:

- **Simple key-value storage**: Use localStorage or sessionStorage
- **Transient state**: Use pan-store for in-memory state
- **Small data**: Overhead isn't worth it for tiny datasets
- **Server-authoritative data**: If server is source of truth, cache in memory instead

### Installation

`pan-idb` is a custom element. Include it in your HTML or create it programmatically:

```html
<pan-idb
  database="myapp"
  store="documents"
  key-path="id"
  auto-increment
  indexes='[{"name":"byTitle","keyPath":"title"},{"name":"byDate","keyPath":"created"}]'>
</pan-idb>
```

### Attributes Reference

**database** (required)

Database name.

**Type:** String
**Default:** None
**Example:** `database="myapp"`

**version**

Database version number. Increment to trigger schema upgrade.

**Type:** Number
**Default:** `1`
**Example:** `version="2"`

**store** (required)

Object store name (similar to table name).

**Type:** String
**Default:** None
**Example:** `store="documents"`

**key-path**

Property name to use as primary key.

**Type:** String
**Default:** `"id"`
**Example:** `key-path="documentId"`

**auto-increment**

Use auto-incrementing keys. Presence of attribute enables it.

**Type:** Boolean
**Default:** `false`
**Example:** `auto-increment` (no value needed)

**indexes**

JSON array of index configurations.

**Type:** JSON String
**Default:** `[]`
**Format:**
```json
[
  {
    "name": "byTitle",
    "keyPath": "title",
    "unique": false,
    "multiEntry": false
  }
]
```

### PAN Topics

All topics follow the pattern `{store}.idb.{operation}`. For a store named `documents`, topics are:

#### Subscribe Topics (Commands)

**{store}.idb.get**

Retrieve item by key.

**Message Data:**
- `key` (Any): Item key

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.get',
  data: { key: 123 }
});
```

**{store}.idb.put**

Insert or update item.

**Message Data:**
- `item` (Object): Item to store

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.put',
  data: {
    item: { id: 123, title: 'Report', content: '...' }
  }
});
```

**{store}.idb.add**

Insert item (fails if key exists).

**Message Data:**
- `item` (Object): Item to add

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.add',
  data: {
    item: { id: 456, title: 'New Doc' }
  }
});
```

**{store}.idb.delete**

Delete item by key.

**Message Data:**
- `key` (Any): Item key

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.delete',
  data: { key: 123 }
});
```

**{store}.idb.clear**

Delete all items.

**Message Data:** Empty object `{}`

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.clear',
  data: {}
});
```

**{store}.idb.list**

List items with optional filtering.

**Message Data:**
- `index` (String, optional): Index name to use
- `range` (IDBKeyRange, optional): Key range for filtering
- `direction` (String, optional): `'next'`, `'prev'`, `'nextunique'`, `'prevunique'`
- `limit` (Number, optional): Maximum results

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.list',
  data: {
    index: 'byDate',
    direction: 'prev',
    limit: 10
  }
});
```

**{store}.idb.query**

Query by index.

**Message Data:**
- `index` (String): Index name
- `value` (Any): Value to match

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.query',
  data: {
    index: 'byTitle',
    value: 'Report'
  }
});
```

**{store}.idb.count**

Count items.

**Message Data:**
- `index` (String, optional): Index name

**Response:** `{store}.idb.result`

**Example:**
```javascript
pc.publish({
  topic: 'documents.idb.count',
  data: {}
});
```

#### Publish Topics (Results)

**{store}.idb.ready**

Published when database is initialized and ready.

**Event Data:**
- `database` (String): Database name
- `store` (String): Store name

**{store}.idb.result**

Published after successful operation.

**Event Data:**
- `operation` (String): Operation name (`'get'`, `'put'`, etc.)
- `success` (Boolean): Always `true`
- `requestId` (String, optional): Original request ID
- Additional fields depend on operation:

  - `get`: `item` (Object)
  - `put`/`add`: `key` (Any)
  - `list`/`query`: `items` (Array)
  - `count`: `count` (Number)

**{store}.idb.error**

Published after failed operation.

**Event Data:**
- `operation` (String): Operation name
- `success` (Boolean): Always `false`
- `error` (String): Error message
- `requestId` (String, optional): Original request ID

### Methods Reference

The component also exposes JavaScript methods for direct usage:

**async get(key)**

Retrieve item by key.

**Returns:** Promise resolving to item or `undefined`

**Example:**
```javascript
const idb = document.querySelector('pan-idb');
const doc = await idb.get(123);
```

**async put(item)**

Insert or update item.

**Returns:** Promise resolving to key

**Example:**
```javascript
const key = await idb.put({ id: 123, title: 'Updated' });
```

**async add(item)**

Insert item (throws if exists).

**Returns:** Promise resolving to key

**async delete(key)**

Delete item.

**Returns:** Promise resolving to `undefined`

**async clear()**

Delete all items.

**Returns:** Promise resolving to `undefined`

**async list(options)**

List items.

**Parameters:**
- `options` (Object): Same as message data

**Returns:** Promise resolving to array of items

**async query(index, value)**

Query by index.

**Returns:** Promise resolving to array of items

**async count(index)**

Count items.

**Returns:** Promise resolving to number

### Complete Working Examples

#### Document Storage

```html
<!DOCTYPE html>
<html>
<head>
  <title>Document Manager</title>
</head>
<body>
  <pan-idb
    database="docapp"
    store="documents"
    key-path="id"
    auto-increment
    indexes='[
      {"name":"byTitle","keyPath":"title"},
      {"name":"byCreated","keyPath":"created"}
    ]'>
  </pan-idb>

  <form id="doc-form">
    <input name="title" placeholder="Title" required>
    <textarea name="content" placeholder="Content"></textarea>
    <button type="submit">Save</button>
  </form>

  <ul id="doc-list"></ul>

  <script type="module">
    import { PanClient } from './pan-client.mjs';

    const pc = new PanClient();
    const form = document.getElementById('doc-form');
    const list = document.getElementById('doc-list');

    // Wait for database ready
    pc.subscribe('documents.idb.ready', loadDocuments);

    // Save document
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(form);

      pc.publish({
        topic: 'documents.idb.add',
        data: {
          item: {
            title: formData.get('title'),
            content: formData.get('content'),
            created: Date.now()
          }
        }
      });

      form.reset();
    });

    // Listen for save results
    pc.subscribe('documents.idb.result', (msg) => {
      if (msg.data.operation === 'add') {
        loadDocuments();
      }
    });

    // Load and display documents
    function loadDocuments() {
      pc.publish({
        topic: 'documents.idb.list',
        data: {
          index: 'byCreated',
          direction: 'prev',
          limit: 20
        }
      });
    }

    pc.subscribe('documents.idb.result', (msg) => {
      if (msg.data.operation === 'list') {
        renderDocuments(msg.data.items);
      }
    });

    function renderDocuments(docs) {
      list.innerHTML = docs.map(doc => `
        <li>
          <strong>${doc.title}</strong>
          <p>${doc.content}</p>
          <small>${new Date(doc.created).toLocaleString()}</small>
          <button onclick="deleteDoc(${doc.id})">Delete</button>
        </li>
      `).join('');
    }

    window.deleteDoc = (id) => {
      pc.publish({
        topic: 'documents.idb.delete',
        data: { key: id }
      });
    };

    pc.subscribe('documents.idb.result', (msg) => {
      if (msg.data.operation === 'delete') {
        loadDocuments();
      }
    });
  </script>
</body>
</html>
```

#### Direct API Usage

```javascript
// Get reference to component
const idb = document.querySelector('pan-idb');

// Wait for ready
await customElements.whenDefined('pan-idb');
await idb.initPromise;

// CRUD operations
const id = await idb.add({
  title: 'Report Q4',
  status: 'draft',
  created: Date.now()
});

const doc = await idb.get(id);
console.log(doc);

doc.status = 'published';
await idb.put(doc);

// Query by index
const drafts = await idb.query('byStatus', 'draft');
console.log(`Found ${drafts.length} drafts`);

// List all with limit
const recent = await idb.list({
  index: 'byCreated',
  direction: 'prev',
  limit: 5
});

// Count items
const total = await idb.count();
console.log(`Total documents: ${total}`);

// Delete
await idb.delete(id);
```

#### Offline Task Queue

```javascript
import { PanClient } from './pan-client.mjs';

class OfflineQueue {
  constructor() {
    this.pc = new PanClient();
    this.setupDatabase();
    this.setupListeners();
  }

  setupDatabase() {
    const idb = document.createElement('pan-idb');
    idb.setAttribute('database', 'offline-queue');
    idb.setAttribute('store', 'tasks');
    idb.setAttribute('key-path', 'id');
    idb.setAttribute('auto-increment', '');
    idb.setAttribute('indexes', JSON.stringify([
      { name: 'byStatus', keyPath: 'status' },
      { name: 'byTimestamp', keyPath: 'timestamp' }
    ]));
    document.body.appendChild(idb);
    this.idb = idb;
  }

  setupListeners() {
    // Process queue when online
    window.addEventListener('online', () => this.processQueue());

    // Listen for new tasks
    this.pc.subscribe('queue.add', (msg) => {
      this.enqueue(msg.data.task);
    });
  }

  async enqueue(task) {
    await this.idb.add({
      ...task,
      status: 'pending',
      timestamp: Date.now()
    });

    if (navigator.onLine) {
      this.processQueue();
    }
  }

  async processQueue() {
    const pending = await this.idb.query('byStatus', 'pending');

    for (const task of pending) {
      try {
        await this.executeTask(task);
        await this.idb.delete(task.id);
      } catch (error) {
        console.error('Task failed:', error);
        // Update task status
        task.status = 'failed';
        task.error = error.message;
        await this.idb.put(task);
      }
    }
  }

  async executeTask(task) {
    // Execute actual task (e.g., API call)
    const response = await fetch(task.url, {
      method: task.method,
      body: JSON.stringify(task.data)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }
}

// Usage
const queue = new OfflineQueue();

// Enqueue tasks
queue.pc.publish({
  topic: 'queue.add',
  data: {
    task: {
      url: '/api/items',
      method: 'POST',
      data: { name: 'New Item' }
    }
  }
});
```

#### Syncing with pan-store

```javascript
import { createStore } from './pan-store.mjs';
import { PanClient } from './pan-client.mjs';

class PersistentStore {
  constructor(storeName, initialState = {}) {
    this.storeName = storeName;
    this.store = createStore(initialState);
    this.pc = new PanClient();
    this.setupPersistence();
    this.loadPersistedState();
  }

  setupPersistence() {
    // Create IndexedDB component
    const idb = document.createElement('pan-idb');
    idb.setAttribute('database', 'persistent-stores');
    idb.setAttribute('store', 'states');
    idb.setAttribute('key-path', 'name');
    document.body.appendChild(idb);
    this.idb = idb;

    // Save on every change
    this.store.subscribe(({ detail }) => {
      this.persist();
    });
  }

  async loadPersistedState() {
    await customElements.whenDefined('pan-idb');
    await this.idb.initPromise;

    const saved = await this.idb.get(this.storeName);
    if (saved && saved.state) {
      this.store.patch(saved.state);
    }
  }

  async persist() {
    const snapshot = this.store.snapshot();
    await this.idb.put({
      name: this.storeName,
      state: snapshot,
      updated: Date.now()
    });
  }

  get state() {
    return this.store.state;
  }
}

// Usage
const appStore = new PersistentStore('app', {
  theme: 'light',
  sidebarOpen: true,
  fontSize: 14
});

// Changes automatically persist
appStore.state.theme = 'dark';

// State restored on page reload
```

### Common Issues and Solutions

**Issue: Database version conflicts**

```javascript
// Problem: Different tabs have different versions
// Tab 1 opens v1, Tab 2 tries v2, Tab 1 blocks upgrade

// Solution: Handle versionchange event
const idb = document.querySelector('pan-idb');
idb.db.addEventListener('versionchange', () => {
  idb.db.close();
  alert('Database upgraded. Please reload page.');
});
```

**Issue: Quota exceeded errors**

```javascript
// Problem: Storing too much data
// Error: QuotaExceededError

// Solution: Check available storage
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  const percent = (estimate.usage / estimate.quota) * 100;

  if (percent > 90) {
    console.warn('Storage nearly full:', percent.toFixed(1) + '%');
    // Trigger cleanup
  }
}
```

**Issue: Index not working after changes**

```javascript
// Problem: Modified keyPath but index still references old path

// Solution: Increment version and recreate indexes
// Change version="1" to version="2" in HTML
// onupgradeneeded handler will recreate indexes
```

**Issue: Transactions timing out**

```javascript
// Problem: Long-running operation causes transaction timeout

// Solution: Break into smaller transactions
async function bulkInsert(items) {
  const BATCH_SIZE = 100;

  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      await idb.add(item);
    }

    // Allow other operations between batches
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

## Combining pan-store and pan-idb

The real power emerges when combining reactive state with persistent storage:

```javascript
import { createStore } from './pan-store.mjs';

class HybridStore {
  constructor(name, initial = {}) {
    this.name = name;
    this.memory = createStore(initial);
    this.setupPersistence();
    this.setupSync();
  }

  setupPersistence() {
    const idb = document.createElement('pan-idb');
    idb.setAttribute('database', 'hybrid-stores');
    idb.setAttribute('store', 'data');
    idb.setAttribute('key-path', 'key');
    document.body.appendChild(idb);
    this.idb = idb;
  }

  async setupSync() {
    await customElements.whenDefined('pan-idb');
    await this.idb.initPromise;

    // Load persisted data
    const items = await this.idb.list();
    for (const item of items) {
      if (item.store === this.name) {
        this.memory.state[item.key] = item.value;
      }
    }

    // Sync changes to IndexedDB
    this.memory.subscribe(async ({ detail }) => {
      if (detail.deleted) {
        await this.idb.delete(`${this.name}.${detail.key}`);
      } else {
        await this.idb.put({
          key: `${this.name}.${detail.key}`,
          store: this.name,
          value: detail.value,
          updated: Date.now()
        });
      }
    });
  }

  get state() {
    return this.memory.state;
  }

  subscribe(fn) {
    return this.memory.subscribe(fn);
  }
}

// Usage: reactive AND persistent
const userPrefs = new HybridStore('preferences', {
  theme: 'light',
  language: 'en'
});

// Reactive updates
userPrefs.subscribe(({ detail }) => {
  console.log('Preference changed:', detail.key);
});

// Changes persist automatically
userPrefs.state.theme = 'dark';
```

## Related Components

- **pan-client**: Underlying message bus for PAN communication
- **pan-persistence-strategy**: Advanced persistence patterns
- **pan-offline-sync**: Synchronization with remote servers
- **pan-event**: Event delegation and routing

## Best Practices

1. **Choose the right tool**: Use pan-store for reactive state, pan-idb for persistence
2. **Avoid excessive persistence**: Don't save every keystroke to IndexedDB
3. **Version your schemas**: Plan for database migrations
4. **Handle errors gracefully**: Storage operations can fail
5. **Test offline scenarios**: Ensure app works without network
6. **Clean up subscriptions**: Prevent memory leaks
7. **Use indexes wisely**: Every index adds storage overhead
8. **Batch operations**: Group related changes when possible
9. **Monitor storage quota**: Don't assume unlimited space
10. **Document your state shape**: Make data structures explicit

## Conclusion

Data management doesn't have to be chaotic. With `pan-store` and `pan-idb`, you have tools that handle state and persistence in ways that feel natural within LARC's architecture. Changes flow through messages, operations return predictable results, and components stay loosely coupled.

The key is choosing the right abstraction for your data. Ephemeral UI state stays in component properties. Shared reactive state lives in pan-store. Persistent data goes in pan-idb. Everything communicates via the PAN bus.

When you structure your data management this way, applications become comprehensible again. You know where state lives, how it changes, and when it persists. That clarity—knowing what's true about your application—is worth more than any clever framework feature.
