# State Management

![**Figure 6.1:** State Management Hierarchy](../images/06-state-management-3.png)

***Figure 6.1:** State Management Hierarchy*


State management is one of the most critical aspects of application development. Poor state management leads to bugs, performance issues, and maintenance nightmares. Good state management makes applications predictable, testable, and maintainable.

LARC takes a pragmatic approach: start simple and scale complexity only when needed. This chapter explores state management at every level, from component-local state to distributed, offline-first architectures.

## Component-Local State

The simplest form of state lives entirely within a single component. This is your first choice for most scenarios.

### Instance Properties

Use instance properties for component-specific state:

```javascript
class ToggleSwitch extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Local state
    this.isOn = false;
  }

  connectedCallback() {
    this.render();

    this.shadowRoot.querySelector('button').addEventListener('click', () => {
      this.isOn = !this.isOn;  // Update state
      this.render();            // Re-render

      // Notify others
      this.dispatchEvent(new CustomEvent('toggle', {
        detail: { isOn: this.isOn }
      }));
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: ${this.isOn ? '#48bb78' : '#cbd5e0'};
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>
      <button>${this.isOn ? 'ON' : 'OFF'}</button>
    `;
  }
}
```

**When to use:**

- UI state (expanded/collapsed, selected, etc.)
- Temporary values (search input, form drafts)
- Component-specific configuration

**Advantages:**

- Simple and straightforward
- No dependencies on external state
- Easy to reason about
- Easy to test

### Private Fields

Use private fields (with `#`) for true encapsulation:

```javascript
class Counter extends HTMLElement {
  // Private fields
  #count = 0;
  #max = 100;
  #min = 0;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  // Public getter
  get count() {
    return this.#count;
  }

  // Public setter with validation
  set count(value) {
    const newCount = Number(value);

    if (isNaN(newCount)) {
      throw new Error('Count must be a number');
    }

    if (newCount < this.#min || newCount > this.#max) {
      throw new Error(`Count must be between ${this.#min} and ${this.#max}`);
    }

    this.#count = newCount;
    this.render();
  }

  increment() {
    this.count = Math.min(this.#count + 1, this.#max);
  }

  decrement() {
    this.count = Math.max(this.#count - 1, this.#min);
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>${this.#count}</div>
    `;
  }
}
```

**Benefits:**

- True privacy (can't access from outside)
- Validation at setter boundaries
- Clear public API

### State Objects

Organize related state in objects:

```javascript
class UserProfile extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Group related state
    this.state = {
      user: null,
      loading: false,
      error: null,
      editMode: false
    };
  }

  setState(updates) {
    // Merge updates into state
    this.state = {
      ...this.state,
      ...updates
    };

    this.render();
  }

  async loadUser(userId) {
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`/api/users/${userId}`);
      const user = await response.json();

      this.setState({ user, loading: false });
    } catch (error) {
      this.setState({ error: error.message, loading: false });
    }
  }

  render() {
    const { user, loading, error, editMode } = this.state;

    if (loading) {
      this.shadowRoot.innerHTML = '<div>Loading...</div>';
    } else if (error) {
      this.shadowRoot.innerHTML = `<div class="error">${error}</div>`;
    } else if (user) {
      this.shadowRoot.innerHTML = `
        <div>
          <h2>${user.name}</h2>
          ${editMode ? this.renderEditForm() : this.renderDisplay()}
        </div>
      `;
    }
  }
}
```

**Benefits:**

- Organized state structure
- Single method to update state
- Clear state shape
- Easier debugging (log entire state)

## Shared State Patterns

When multiple components need access to the same data, you need shared state.

### Simple Global State

Create a shared state object:

```javascript
// lib/state.js
export const appState = {
  user: null,
  theme: 'light',
  language: 'en',
  notifications: []
};

// Update state
export function updateState(updates) {
  Object.assign(appState, updates);
  pan.publish('app.state.changed', appState);
}

// Get state
export function getState() {
  return { ...appState };
}
```

**Usage in components:**

```javascript
import { appState, updateState } from '../lib/state.js';

class ThemeSwitcher extends HTMLElement {
  connectedCallback() {
    // Read initial state
    this.render(appState.theme);

    // Subscribe to changes
    this.unsubscribe = pan.subscribe('app.state.changed', (state) => {
      this.render(state.theme);
    });

    // Add event listener
    this.addEventListener('click', () => {
      const newTheme = appState.theme === 'light' ? 'dark' : 'light';
      updateState({ theme: newTheme });
    });
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render(theme) {
    this.textContent = `Theme: ${theme}`;
  }
}
```

### Reactive State with Proxy

Make state changes automatically trigger updates:

```javascript
// lib/reactive-state.js
export function createReactiveState(initialState) {
  const listeners = new Set();

  const state = new Proxy(initialState, {
    set(target, property, value) {
      const oldValue = target[property];
      target[property] = value;

      // Notify listeners
      listeners.forEach(listener => {
        listener(property, value, oldValue);
      });

      // Also publish via PAN
      pan.publish('state.changed', {
        property,
        value,
        oldValue
      });

      return true;
    },

    get(target, property) {
      return target[property];
    }
  });

  return {
    state,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getState() {
      return { ...state };
    }
  };
}
```

**Usage:**

```javascript
// Create reactive state
const { state, subscribe } = createReactiveState({
  count: 0,
  user: null,
  theme: 'light'
});

// Components automatically react to changes
class CountDisplay extends HTMLElement {
  connectedCallback() {
    // Subscribe to specific property changes
    this.unsubscribe = subscribe((property, value) => {
      if (property === 'count') {
        this.textContent = `Count: ${value}`;
      }
    });

    // Initial render
    this.textContent = `Count: ${state.count}`;
  }

  disconnectedCallback() {
    this.unsubscribe();
  }
}

// Update state (automatically triggers updates)
state.count++;  // All subscribers notified
state.count = 42;  // All subscribers notified
```

### Store Pattern

Build a more sophisticated store:

```javascript
// lib/store.js
class Store {
  constructor(initialState = {}) {
    this.state = initialState;
    this.listeners = new Map();
    this.middleware = [];
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    // Run middleware
    this.middleware.forEach(fn => fn(this.state, oldState));

    // Notify listeners
    this.listeners.forEach((listeners, key) => {
      if (key === '*' || key in updates) {
        listeners.forEach(listener => {
          listener(this.state, oldState);
        });
      }
    });
  }

  subscribe(key, listener) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key).add(listener);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(key);
      if (listeners) {
        listeners.delete(listener);
      }
    };
  }

  use(middleware) {
    this.middleware.push(middleware);
  }

  dispatch(action) {
    // Action pattern: { type, payload }
    switch (action.type) {
      case 'user/login':
        this.setState({ user: action.payload });
        break;
      case 'user/logout':
        this.setState({ user: null });
        break;
      case 'theme/change':
        this.setState({ theme: action.payload });
        break;
      default:
        console.warn(`Unknown action: ${action.type}`);
    }
  }
}

// Create store instance
export const store = new Store({
  user: null,
  theme: 'light',
  notifications: []
});

// Add logging middleware
store.use((state, oldState) => {
  console.log('State changed:', { old: oldState, new: state });
});

// Add persistence middleware
store.use((state) => {
  localStorage.setItem('app-state', JSON.stringify(state));
});
```

**Usage:**

```javascript
import { store } from '../lib/store.js';

class UserMenu extends HTMLElement {
  connectedCallback() {
    // Subscribe to user changes only
    this.unsubscribe = store.subscribe('user', (state) => {
      this.render(state.user);
    });

    // Initial render
    this.render(store.getState().user);
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render(user) {
    if (user) {
      this.innerHTML = `
        <div>Hello, ${user.name}</div>
        <button id="logout">Logout</button>
      `;

      this.querySelector('#logout').addEventListener('click', () => {
        store.dispatch({ type: 'user/logout' });
      });
    } else {
      this.innerHTML = '<button id="login">Login</button>';

      this.querySelector('#login').addEventListener('click', () => {
        // Trigger login flow
        pan.publish('auth.login.requested');
      });
    }
  }
}
```

## The pan-store Component

![**Figure 6.2:** pan-store Architecture](../images/06-state-management-9.png)

***Figure 6.2:** pan-store Architecture*


LARC provides a built-in component for state management:

```html
<pan-store id="app-store" persist="true">
  <!-- Initial state -->
  <script type="application/json">
  {
    "user": null,
    "theme": "light",
    "cart": {
      "items": [],
      "total": 0
    }
  }
  </script>
</pan-store>

<script type="module">
  const store = document.getElementById('app-store');

  // Get state
  const state = store.getState();

  // Update state
  store.setState({ theme: 'dark' });

  // Subscribe to changes
  store.addEventListener('state-changed', (e) => {
    console.log('State changed:', e.detail);
  });

  // Or use PAN bus
  pan.subscribe('store.changed', (state) => {
    console.log('State via PAN:', state);
  });
</script>
```

**Features:**

- Declarative state initialization
- Optional persistence to localStorage
- Integrates with PAN bus
- Supports nested state updates
- Time-travel debugging in dev mode

**Advanced usage:**

```javascript
// Get nested state
const cartItems = store.getState('cart.items');

// Update nested state
store.setState('cart.items', [...items, newItem]);

// Subscribe to specific paths
store.subscribe('cart.total', (value) => {
  console.log('Cart total changed:', value);
});

// Computed properties
store.computed('cart.itemCount', (state) => {
  return state.cart.items.length;
});

// Actions
store.action('addToCart', (item) => {
  const cart = store.getState('cart');
  const items = [...cart.items, item];
  const total = items.reduce((sum, item) => sum + item.price, 0);

  store.setState({
    'cart.items': items,
    'cart.total': total
  });
});

// Use action
store.dispatch('addToCart', { id: 1, name: 'Product', price: 29.99 });
```

## IndexedDB Integration

For large datasets or offline capability, use IndexedDB:

### Basic IndexedDB Wrapper

```javascript
// lib/db.js
class Database {
  constructor(name, version = 1) {
    this.name = name;
    this.version = version;
    this.db = null;
  }

  async open(stores) {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.name, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        stores.forEach(({ name, keyPath, indexes }) => {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath });

            indexes?.forEach(({ name, keyPath, options }) => {
              store.createIndex(name, keyPath, options);
            });
          }
        });
      };
    });
  }

  async add(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async get(storeName, key) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName) {
    const tx = this.db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async update(storeName, data) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName, key) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName) {
    const tx = this.db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

// Initialize database
export const db = new Database('MyApp', 1);

await db.open([
  {
    name: 'todos',
    keyPath: 'id',
    indexes: [
      { name: 'by-status', keyPath: 'status' },
      { name: 'by-created', keyPath: 'createdAt' }
    ]
  },
  {
    name: 'users',
    keyPath: 'id'
  }
]);
```

**Usage:**

```javascript
import { db } from '../lib/db.js';

class TodoList extends HTMLElement {
  async connectedCallback() {
    // Load todos from IndexedDB
    this.todos = await db.getAll('todos');
    this.render();

    // Subscribe to changes
    pan.subscribe('todo.added', async ({ todo }) => {
      await db.add('todos', todo);
      this.todos = await db.getAll('todos');
      this.render();
    });

    pan.subscribe('todo.updated', async ({ todo }) => {
      await db.update('todos', todo);
      this.todos = await db.getAll('todos');
      this.render();
    });

    pan.subscribe('todo.deleted', async ({ id }) => {
      await db.delete('todos', id);
      this.todos = await db.getAll('todos');
      this.render();
    });
  }

  render() {
    this.innerHTML = `
      <ul>
        ${this.todos.map(todo => `
          <li>
            <span>${todo.text}</span>
            <button data-id="${todo.id}">Delete</button>
          </li>
        `).join('')}
      </ul>
    `;
  }
}
```

### Cache-First Strategy

Implement cache-first data loading:

```javascript
class DataManager {
  constructor(storeName) {
    this.storeName = storeName;
    this.cache = new Map();
  }

  async get(id) {
    // 1. Check memory cache
    if (this.cache.has(id)) {
      return this.cache.get(id);
    }

    // 2. Check IndexedDB
    const cached = await db.get(this.storeName, id);
    if (cached) {
      this.cache.set(id, cached);
      return cached;
    }

    // 3. Fetch from API
    const data = await this.fetchFromAPI(id);

    // 4. Store in cache and IndexedDB
    this.cache.set(id, data);
    await db.add(this.storeName, data);

    return data;
  }

  async fetchFromAPI(id) {
    const response = await fetch(`/api/${this.storeName}/${id}`);
    return response.json();
  }

  async refresh(id) {
    // Force refresh from API
    const data = await this.fetchFromAPI(id);

    // Update cache and IndexedDB
    this.cache.set(id, data);
    await db.update(this.storeName, data);

    return data;
  }

  async getAll() {
    // Load from IndexedDB first
    const items = await db.getAll(this.storeName);

    // Cache in memory
    items.forEach(item => {
      this.cache.set(item.id, item);
    });

    return items;
  }
}

// Usage
const userManager = new DataManager('users');

// Always returns fast (from cache if available)
const user = await userManager.get(123);

// Force refresh
const freshUser = await userManager.refresh(123);
```

## Persistence Strategies

### localStorage

Simple key-value storage:

```javascript
class PersistentState {
  constructor(key) {
    this.key = key;
    this.state = this.load();
  }

  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load state:', error);
      return {};
    }
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.state));
    } catch (error) {
      console.error('Failed to save state:', error);
    }
  }

  get(path) {
    return this.getNestedValue(this.state, path);
  }

  set(path, value) {
    this.setNestedValue(this.state, path, value);
    this.save();
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!(key in current)) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  clear() {
    this.state = {};
    localStorage.removeItem(this.key);
  }
}

// Usage
const settings = new PersistentState('app-settings');

settings.set('theme', 'dark');
settings.set('user.preferences.notifications', true);

console.log(settings.get('theme'));  // 'dark'
console.log(settings.get('user.preferences.notifications'));  // true
```

### sessionStorage

For temporary session data:

```javascript
class SessionState {
  constructor(key) {
    this.key = key;
  }

  set(data) {
    sessionStorage.setItem(this.key, JSON.stringify(data));
  }

  get() {
    const data = sessionStorage.getItem(this.key);
    return data ? JSON.parse(data) : null;
  }

  clear() {
    sessionStorage.removeItem(this.key);
  }
}

// Usage - data persists only for the session
const sessionData = new SessionState('form-draft');

// Save form draft
sessionData.set({ email: 'user@example.com', message: 'Draft...' });

// Restore on page reload (same session)
const draft = sessionData.get();
```

### Hybrid Strategy

Combine localStorage and IndexedDB:

```javascript
class HybridStorage {
  constructor(namespace) {
    this.namespace = namespace;
  }

  async set(key, value) {
    const fullKey = `${this.namespace}:${key}`;

    // Store small data in localStorage
    if (this.isSmall(value)) {
      localStorage.setItem(fullKey, JSON.stringify(value));
    } else {
      // Store large data in IndexedDB
      await db.update('storage', { key: fullKey, value });
    }
  }

  async get(key) {
    const fullKey = `${this.namespace}:${key}`;

    // Try localStorage first
    const local = localStorage.getItem(fullKey);
    if (local) {
      return JSON.parse(local);
    }

    // Try IndexedDB
    const result = await db.get('storage', fullKey);
    return result?.value;
  }

  isSmall(value) {
    const str = JSON.stringify(value);
    return str.length < 1024 * 10; // 10KB threshold
  }

  async clear() {
    // Clear localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(`${this.namespace}:`)) {
        localStorage.removeItem(key);
      }
    });

    // Clear IndexedDB items
    const all = await db.getAll('storage');
    for (const item of all) {
      if (item.key.startsWith(`${this.namespace}:`)) {
        await db.delete('storage', item.key);
      }
    }
  }
}
```

## Offline-First Applications

Build applications that work without connectivity:

### Service Worker + State Management

```javascript
// sw.js - Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/src/app.js',
        '/',
        // Cache critical assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch
      return response || fetch(event.request);
    })
  );
});
```

### Sync Queue

Queue operations when offline:

```javascript
// lib/sync-queue.js
class SyncQueue {
  constructor() {
    this.queue = this.loadQueue();
    this.processing = false;

    // Listen for online events
    window.addEventListener('online', () => {
      this.process();
    });

    // Start processing if online
    if (navigator.onLine) {
      this.process();
    }
  }

  loadQueue() {
    const data = localStorage.getItem('sync-queue');
    return data ? JSON.parse(data) : [];
  }

  saveQueue() {
    localStorage.setItem('sync-queue', JSON.stringify(this.queue));
  }

  add(operation) {
    this.queue.push({
      id: Date.now() + Math.random(),
      operation,
      timestamp: Date.now(),
      attempts: 0
    });

    this.saveQueue();

    if (navigator.onLine) {
      this.process();
    }
  }

  async process() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0 && navigator.onLine) {
      const item = this.queue[0];

      try {
        await this.executeOperation(item.operation);

        // Success - remove from queue
        this.queue.shift();
        this.saveQueue();

        pan.publish('sync.success', { operation: item.operation });
      } catch (error) {
        item.attempts++;

        if (item.attempts >= 3) {
          // Max attempts - remove and report error
          this.queue.shift();
          this.saveQueue();

          pan.publish('sync.failed', {
            operation: item.operation,
            error: error.message
          });
        } else {
          // Retry later
          break;
        }
      }
    }

    this.processing = false;
  }

  async executeOperation(operation) {
    switch (operation.type) {
      case 'CREATE':
        return this.create(operation.data);
      case 'UPDATE':
        return this.update(operation.data);
      case 'DELETE':
        return this.delete(operation.id);
      default:
        throw new Error(`Unknown operation: ${operation.type}`);
    }
  }

  async create(data) {
    const response = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Create failed');
    return response.json();
  }

  async update(data) {
    const response = await fetch(`/api/items/${data.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) throw new Error('Update failed');
    return response.json();
  }

  async delete(id) {
    const response = await fetch(`/api/items/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) throw new Error('Delete failed');
  }

  clear() {
    this.queue = [];
    this.saveQueue();
  }

  getStatus() {
    return {
      queued: this.queue.length,
      online: navigator.onLine,
      processing: this.processing
    };
  }
}

export const syncQueue = new SyncQueue();
```

**Usage:**

```javascript
import { syncQueue } from '../lib/sync-queue.js';

class TodoManager {
  async addTodo(text) {
    const todo = {
      id: Date.now(),
      text,
      completed: false,
      createdAt: new Date()
    };

    // Save locally immediately
    await db.add('todos', todo);
    pan.publish('todo.added', { todo });

    // Queue for server sync
    if (!navigator.onLine) {
      syncQueue.add({
        type: 'CREATE',
        data: todo
      });

      pan.publish('notification.info', {
        message: 'Saved locally. Will sync when online.'
      });
    } else {
      // Online - sync immediately
      try {
        await this.syncToServer(todo);
      } catch (error) {
        // Failed - add to queue
        syncQueue.add({
          type: 'CREATE',
          data: todo
        });
      }
    }
  }

  async syncToServer(todo) {
    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo)
    });

    if (!response.ok) {
      throw new Error('Sync failed');
    }

    const result = await response.json();

    // Update local copy with server ID
    await db.update('todos', { ...todo, serverId: result.id });
  }
}
```

## Summary

This chapter covered state management at every level:

- **Component-Local State**: Instance properties, private fields, and state objects
- **Shared State**: Global state, reactive proxies, and store patterns
- **pan-store**: Built-in state management component
- **IndexedDB**: Large dataset storage and offline capability
- **Persistence**: localStorage, sessionStorage, and hybrid strategies
- **Offline-First**: Service workers, sync queues, and conflict resolution

Choose the simplest solution that meets your needs, then scale up complexity as requirements grow.

---

## Best Practices

1. **Start with local state**
   - Only share state when necessary
   - Keeps components independent
   - Easier to test and debug

2. **Use IndexedDB for large data**
   - localStorage limited to ~5-10MB
   - IndexedDB can store gigabytes
   - Better performance for large datasets

3. **Implement cache-first strategies**
   - Load from cache immediately
   - Update from server in background
   - Show stale data rather than loading spinner

4. **Queue offline operations**
   - Don't lose user data
   - Sync when connection restored
   - Show sync status to user

5. **Test offline scenarios**
   - Use DevTools to simulate offline
   - Test sync queue behavior
   - Verify conflict resolution

6. **Monitor storage usage**
   - Check quota before storing
   - Clean up old data
   - Provide clear error messages when full

---

## Further Reading

**For complete state management reference:**
- *Building with LARC* Chapter 4: State Management - All state patterns and strategies
- *Building with LARC* Chapter 18: Data Components - pan-store and pan-idb API reference
- *Building with LARC* Appendix E: Recipes and Patterns - State management recipes