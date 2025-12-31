# Data Components Reference

API documentation for LARC's data management components. For tutorials, see *Learning LARC* Chapter 6.

## pan-store

**Purpose**: Reactive state management for shared application state  
**Import**: `import { createStore, bind } from './pan-store.mjs';`

### Quick Example

```javascript
import { createStore } from './pan-store.mjs';

const store = createStore({ count: 0, theme: 'light' });

// Subscribe to changes
store.subscribe(({ detail }) => {
  console.log(`${detail.key} changed to ${detail.value}`);
});

// Update state
store.state.count++; // Triggers subscriber
```

### API

#### createStore(initial)

Creates reactive store with optional initial state.

**Parameters:**
- `initial` (Object, optional): Initial state

**Returns:** Store instance

**Properties:**
- `state` (Proxy): Reactive state object

#### Store Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `subscribe(callback)` | callback: Function | Function | Subscribe to changes (returns unsubscribe fn) |
| `set(key, value)` | key: String, value: Any | - | Set single property |
| `patch(object)` | object: Object | - | Merge multiple properties |
| `update(fn)` | fn: Function | - | Update using function |
| `select(path)` | path: String | Any | Get nested value by dot-path |
| `derive(key, deps, computeFn)` | key: String, deps: Array, computeFn: Function | Function | Create computed property |
| `batch(fn)` | fn: Function | - | Batch multiple updates |
| `use(middleware)` | middleware: Function | Function | Add middleware (returns unsubscribe) |
| `snapshot()` | - | Object | Deep clone of current state |
| `reset()` | - | - | Reset to initial values |
| `has(key)` | key: String | Boolean | Check if property exists |
| `delete(key)` | key: String | Boolean | Remove property |
| `keys()` | - | Array | Get all property names |

**Usage:**
```javascript
const store = createStore({ count: 0 });

// Direct access
store.state.count++; // Triggers updates

// Methods
store.set('theme', 'dark');
store.patch({ count: 5, theme: 'dark' });
store.update(state => { state.count += 1; return state; });

// Derived values
store.derive('doubled', ['count'], (count) => count * 2);
console.log(store.state.doubled); // 10

// Batching
store.batch(({ set }) => {
  set('loading', true);
  set('error', null);
}); // Single event

// Cleanup
const unsub = store.subscribe(handler);
unsub();
```

### Events

- **state**: Emitted on state change  
  Detail: `{ key, value, oldValue, state, batch?, changes?, deleted? }`
  
- **derived**: Emitted on derived value update  
  Detail: `{ key, value, state }`

### bind(element, store, mapping, options)

Two-way binding for form inputs.

**Parameters:**
- `element` (HTMLElement): Container element
- `store` (Store): Store instance
- `mapping` (Object): CSS selectors to property names
- `options` (Object, optional): `{ events: ['input', 'change'] }`

**Returns:** Unbind function

**Usage:**
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

### Complete Example

```javascript
import { createStore } from './pan-store.mjs';

// Shopping cart with derived totals
const cart = createStore({
  items: [
    { id: 1, name: 'Widget', price: 10, qty: 2 },
    { id: 2, name: 'Gadget', price: 25, qty: 1 }
  ],
  taxRate: 0.08
});

// Derive subtotal
cart.derive('subtotal', ['items'], (items) => {
  return items.reduce((sum, item) => sum + (item.price * item.qty), 0);
});

// Derive tax and total
cart.derive('tax', ['subtotal', 'taxRate'], (sub, rate) => sub * rate);
cart.derive('total', ['subtotal', 'tax'], (sub, tax) => sub + tax);

// Add logging middleware
cart.use(({ key, value }) => {
  console.log(`State changed: ${key} = ${value}`);
});

// Subscribe to total changes
cart.subscribe(({ detail }) => {
  if (detail.key === 'total') {
    console.log(`Cart total: $${detail.value.toFixed(2)}`);
  }
});

// Access computed values
console.log(cart.state.subtotal); // 45
console.log(cart.state.tax);      // 3.6
console.log(cart.state.total);    // 48.6
```

### Errors

pan-store emits errors through the `error` event for error conditions:

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| Circular dependency | Derived value depends on itself | Review `derive()` dependency chains |
| Invalid path | `select()` with non-string path | Use valid dot-notation string (e.g., `'user.name'`) |
| Middleware error | Middleware function throws exception | Wrap middleware in try-catch or fix thrown error |
| Frozen state | Attempting to modify frozen object | Unfreeze object or create new reference |
| Type error | Non-object passed to `patch()` | Pass plain object to `patch()` |

**Error handling example**:
```javascript
const store = createStore({ count: 0 });

// Listen for errors
store.addEventListener('error', (e) => {
  const { error, operation, key } = e.detail;
  console.error(`Store error in ${operation}:`, error.message);

  // Handle specific errors
  if (error.message.includes('Circular')) {
    // Remove circular dependencies
    console.warn(`Circular dependency detected for key: ${key}`);
  } else if (operation === 'middleware') {
    // Middleware failed
    console.error('Middleware error:', error);
  }
});

// Safe derived value with error handling
try {
  store.derive('computed', ['dep1'], (dep) => {
    if (!dep) throw new Error('Invalid dependency');
    return dep * 2;
  });
} catch (err) {
  console.error('Failed to create derived value:', err);
}

// Safe middleware usage
store.use((state, changes) => {
  try {
    // Validate changes
    if (changes.price && changes.price < 0) {
      throw new Error('Price cannot be negative');
    }
    return changes;
  } catch (err) {
    console.error('Middleware validation failed:', err);
    return null; // Reject changes
  }
});
```

**Exceptions thrown**:

- `TypeError`: Invalid parameters (e.g., non-string path, non-function callback)
- `RangeError`: Invalid computed dependency (circular reference)
- `Error`: Middleware exceptions (propagated from user code)

### Common Issues

**Nested changes not detected**
```javascript
// Problem
store.state.user.name = 'Ada'; // No event

// Solution: reassign parent
store.state.user = { ...store.state.user, name: 'Ada' };
```

**Performance with frequent updates**
```javascript
// Problem: 1000 individual events
for (let i = 0; i < 1000; i++) store.state.count = i;

// Solution: use batch()
store.batch(({ set }) => {
  for (let i = 0; i < 1000; i++) set('count', i);
});
```

**Memory leaks**
```javascript
// Problem: no cleanup
class MyComponent extends HTMLElement {
  connectedCallback() {
    store.subscribe(this.handleChange); // Leaks
  }
}

// Solution: unsubscribe on disconnect
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.unsub = store.subscribe(this.handleChange);
  }
  disconnectedCallback() {
    if (this.unsub) this.unsub();
  }
}
```

---

## pan-idb

**Purpose**: IndexedDB integration via PAN message bus  
**Import**: `<pan-idb>` custom element

### Quick Example

```html
<pan-idb
  database="myapp"
  store="documents"
  key-path="id"
  auto-increment
  indexes='[{"name":"byTitle","keyPath":"title"}]'>
</pan-idb>

<script type="module">
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Add document
pc.publish({
  topic: 'documents.idb.add',
  data: { item: { title: 'Report', content: '...' } }
});

// Listen for result
pc.subscribe('documents.idb.result', (msg) => {
  console.log('Saved with key:', msg.data.key);
});
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `database` | String | - | Database name (required) |
| `version` | Number | 1 | Database version |
| `store` | String | - | Object store name (required) |
| `key-path` | String | "id" | Primary key property |
| `auto-increment` | Boolean | false | Use auto-incrementing keys |
| `indexes` | JSON String | [] | Index configurations |

**Index format:**
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

All topics follow pattern `{store}.idb.{operation}`.

#### Subscribe (Commands)

| Topic | Data | Description |
|-------|------|-------------|
| `{store}.idb.get` | `{ key }` | Retrieve item by key |
| `{store}.idb.put` | `{ item }` | Insert or update item |
| `{store}.idb.add` | `{ item }` | Insert item (fails if exists) |
| `{store}.idb.delete` | `{ key }` | Delete item by key |
| `{store}.idb.clear` | `{}` | Delete all items |
| `{store}.idb.list` | `{ index?, range?, direction?, limit? }` | List items |
| `{store}.idb.query` | `{ index, value }` | Query by index |
| `{store}.idb.count` | `{ index? }` | Count items |

#### Publish (Results)

| Topic | Data | Description |
|-------|------|-------------|
| `{store}.idb.ready` | `{ database, store }` | Database initialized |
| `{store}.idb.result` | `{ operation, success, ...data }` | Operation succeeded |
| `{store}.idb.error` | `{ operation, success: false, error }` | Operation failed |

**Result data by operation:**
- `get`: `{ item }`
- `put`/`add`: `{ key }`
- `list`/`query`: `{ items }`
- `count`: `{ count }`

### Methods

Direct JavaScript API (alternative to PAN topics):

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `get(key)` | key: Any | Promise\<Object\> | Retrieve item |
| `put(item)` | item: Object | Promise\<Any\> | Insert/update item |
| `add(item)` | item: Object | Promise\<Any\> | Insert item |
| `delete(key)` | key: Any | Promise\<void\> | Delete item |
| `clear()` | - | Promise\<void\> | Delete all |
| `list(options)` | options: Object | Promise\<Array\> | List items |
| `query(index, value)` | index: String, value: Any | Promise\<Array\> | Query by index |
| `count(index)` | index?: String | Promise\<Number\> | Count items |

**Usage:**
```javascript
const idb = document.querySelector('pan-idb');
await customElements.whenDefined('pan-idb');
await idb.initPromise;

// CRUD operations
const id = await idb.add({ title: 'Report', status: 'draft' });
const doc = await idb.get(id);
doc.status = 'published';
await idb.put(doc);

// Query
const drafts = await idb.query('byStatus', 'draft');
const recent = await idb.list({ 
  index: 'byCreated', 
  direction: 'prev', 
  limit: 5 
});

// Count and delete
const total = await idb.count();
await idb.delete(id);
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head><title>Document Manager</title></head>
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

    // Wait for ready
    pc.subscribe('documents.idb.ready', loadDocuments);

    // Save document
    form.addEventListener('submit', (e) => {
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

    // Load documents
    function loadDocuments() {
      pc.publish({
        topic: 'documents.idb.list',
        data: { index: 'byCreated', direction: 'prev', limit: 20 }
      });
    }

    // Render results
    pc.subscribe('documents.idb.result', (msg) => {
      if (msg.data.operation === 'add') loadDocuments();
      if (msg.data.operation === 'list') renderDocuments(msg.data.items);
      if (msg.data.operation === 'delete') loadDocuments();
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
      pc.publish({ topic: 'documents.idb.delete', data: { key: id } });
    };
  </script>
</body>
</html>
```

### Errors

pan-idb publishes error messages to `{storeName}.idb.error` topic:

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `DB_OPEN_FAILED` | Cannot open IndexedDB | Check browser support, quota, or permissions |
| `STORE_NOT_FOUND` | Object store doesn't exist | Set correct `store` attribute or upgrade database version |
| `VERSION_ERROR` | Version downgrade attempted | Remove old database or increment version number |
| `QUOTA_EXCEEDED` | Storage limit reached | Clear old data or request persistent storage |
| `TRANSACTION_FAILED` | Transaction aborted | Check data validity, reduce transaction size |
| `INDEX_ERROR` | Index operation failed | Verify index exists and data matches index keyPath |
| `KEY_ERROR` | Invalid key provided | Use valid key type (number, string, date, array) |
| `DATA_ERROR` | Data cannot be cloned | Remove non-cloneable values (functions, DOM nodes) |
| `READ_ONLY_ERROR` | Write on readonly transaction | Use correct transaction mode |
| `NOT_SUPPORTED` | Browser doesn't support IndexedDB | Provide fallback (localStorage, memory store) |

**Error handling example**:
```javascript
const bus = document.querySelector('pan-bus');
const idb = document.querySelector('pan-idb');

// Subscribe to errors
bus.subscribe('documents.idb.error', (msg) => {
  const { code, error, operation } = msg.data;
  console.error(`IDB error [${code}]:`, error.message);

  // Handle specific errors
  switch (code) {
    case 'QUOTA_EXCEEDED':
      // Prompt user to clear data
      if (confirm('Storage full. Clear old data?')) {
        bus.publish({ topic: 'documents.idb.clear' });
      }
      break;

    case 'VERSION_ERROR':
      // Database needs upgrade
      console.warn('Please reload to upgrade database');
      location.reload();
      break;

    case 'NOT_SUPPORTED':
      // Fallback to alternative storage
      console.warn('IndexedDB not available, using localStorage');
      initLocalStorageFallback();
      break;

    case 'DB_OPEN_FAILED':
      // Retry with exponential backoff
      setTimeout(() => {
        idb.setAttribute('database', idb.getAttribute('database'));
      }, 1000 * Math.pow(2, retryCount++));
      break;

    default:
      // Generic error handling
      showErrorNotification(`Database error: ${error.message}`);
  }
});

// Graceful degradation
bus.subscribe('documents.idb.error', async (msg) => {
  if (msg.data.code === 'NOT_SUPPORTED' || msg.data.code === 'DB_OPEN_FAILED') {
    // Switch to memory-only mode
    window.inMemoryStore = new Map();
    console.warn('Using in-memory storage (data will not persist)');
  }
});

// Quota management
async function checkQuota() {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    const percentUsed = (estimate.usage / estimate.quota) * 100;

    if (percentUsed > 90) {
      console.warn(`Storage ${percentUsed.toFixed(1)}% full`);
      // Trigger cleanup
      bus.publish({ topic: 'documents.idb.cleanup' });
    }
  }
}
```

**Exceptions thrown**:

- `DOMException`: IndexedDB-specific errors (InvalidStateError, ConstraintError, etc.)
- `TypeError`: Invalid parameters (e.g., non-cloneable data)
- `QuotaExceededError`: Storage limit reached
- `Error`: General database operation failures

**Browser Compatibility Notes**:

- IndexedDB supported in all modern browsers (Chrome 24+, Firefox 16+, Safari 10+)
- Private browsing may disable or limit IndexedDB
- Check support: `if ('indexedDB' in window)`

### Common Issues

**Database version conflicts**: Different tabs with different versions
```javascript
// Handle versionchange event
idb.db.addEventListener('versionchange', () => {
  idb.db.close();
  alert('Database upgraded. Please reload.');
});
```

**Quota exceeded**: Check available storage
```javascript
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  const percent = (estimate.usage / estimate.quota) * 100;
  if (percent > 90) console.warn('Storage nearly full');
}
```

**Index not working after schema changes**: Increment version number
```html
<!-- Change version="1" to version="2" -->
<pan-idb database="myapp" store="docs" version="2">
```

**Transaction timeouts**: Break bulk operations into batches
```javascript
async function bulkInsert(items) {
  const BATCH_SIZE = 100;
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    for (const item of batch) await idb.add(item);
    await new Promise(r => setTimeout(r, 0)); // Yield
  }
}
```

---

## Summary

This chapter documented LARC's data management components:

- **pan-store**: Reactive state management with Proxy-based observation
- **pan-idb**: IndexedDB integration via PAN message bus

Use pan-store for reactive application state, pan-idb for persistent storage.

**See Also**:

- Tutorial: *Learning LARC* Chapter 6
- Message bus: Chapter 17
- UI components: Chapter 19
- State patterns: Appendix A
