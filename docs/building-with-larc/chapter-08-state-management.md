# Chapter 8: State Management

> "There are only two hard things in Computer Science: cache invalidation, naming things, and state management."
>
> — Phil Karlton (updated for modern web development)

State management is the art of keeping track of what's true about your application right now. Which user is logged in? What items are in the shopping cart? Is the modal open or closed? Has the data been saved or is it still dirty?

Get state management right, and your application feels solid, predictable, and reliable. Get it wrong, and you'll spend your days hunting down race conditions, stale data, and mysterious bugs that only reproduce on Tuesdays when Mercury is in retrograde.

In this chapter, we'll explore how LARC approaches state management. You'll learn the difference between local and shared state, strategies for persisting state to IndexedDB and OPFS (Origin Private File System), patterns for synchronizing state across components, and techniques for resolving conflicts when multiple sources of truth collide.

Fair warning: this chapter is dense. State management is hard, and anyone who tells you otherwise is selling something. But LARC's message-based architecture provides a solid foundation for tackling this complexity. By the end of this chapter, you'll have the tools to build applications that manage state gracefully, even under adverse conditions.

## Local vs. Shared State

The first decision in state management is: where does this state live?

**Local state** belongs to a single component. It's not shared, not synchronized, and not persisted. Examples include:

- Whether a dropdown is expanded
- The current input value in a form field
- The selected tab in a tab panel
- Animation state

Local state is simple. Store it in component properties:

```javascript
class DropdownMenu extends HTMLElement {
  constructor() {
    super();
    this.isOpen = false; // Local state
  }

  connectedCallback() {
    this.render();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="dropdown">
        <button id="toggle-btn">${this.isOpen ? 'Close' : 'Open'}</button>
        ${this.isOpen ? `
          <ul class="dropdown-menu">
            <li>Option 1</li>
            <li>Option 2</li>
            <li>Option 3</li>
          </ul>
        ` : ''}
      </div>
    `;

    this.querySelector('#toggle-btn').addEventListener('click', () => {
      this.toggle();
    });
  }
}

customElements.define('dropdown-menu', DropdownMenu);
```

Local state requires no persistence, no synchronization, and no messaging. When the component is destroyed, the state disappears. This is fine—ephemeral state should be ephemeral.

**Shared state** is accessed by multiple components. Examples include:

- The current authenticated user
- Items in a shopping cart
- Application theme (light/dark mode)
- Cached API responses

Shared state lives outside individual components and flows through the PAN bus. Components subscribe to state changes and publish updates.

## The State Store Pattern

For shared state, LARC applications typically use a "state store" component—a component whose sole job is to manage a piece of shared state.

Here's a minimal example:

```javascript
class UserStore extends HTMLElement {
  constructor() {
    super();
    this.currentUser = null;
  }

  connectedCallback() {
    // Subscribe to login events
    this.subscriptions = [
      subscribe('auth.login.success', (msg) => {
        this.setUser(msg.data);
      }),

      subscribe('auth.logout', () => {
        this.setUser(null);
      }),

      subscribe('user.profile.updated', (msg) => {
        if (this.currentUser && msg.data.userId === this.currentUser.userId) {
          this.setUser({ ...this.currentUser, ...msg.data });
        }
      })
    ];

    // Load persisted user from localStorage
    this.loadPersistedUser();
  }

  setUser(user) {
    this.currentUser = user;

    // Publish updated state
    publish('user.current', user);

    // Persist to localStorage
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  loadPersistedUser() {
    const stored = localStorage.getItem('currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        this.setUser(user);
      } catch (error) {
        console.error('Failed to load persisted user:', error);
      }
    }
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('user-store', UserStore);
```

This store:

1. Listens for events that change user state
2. Updates its internal state
3. Publishes the new state to `user.current`
4. Persists the state to localStorage

Other components simply subscribe to `user.current`:

```javascript
class UserGreeting extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('user.current', (msg) => {
      this.render(msg.data);
    });
  }

  render(user) {
    if (user) {
      this.textContent = `Hello, ${user.username}!`;
    } else {
      this.textContent = 'Please log in.';
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('user-greeting', UserGreeting);
```

Notice the separation of concerns: `UserStore` manages state, `UserGreeting` displays it. Neither component knows about the other.

## State Persistence with localStorage

For simple persistence, localStorage is hard to beat. It's synchronous, widely supported, and requires no setup.

```javascript
class SettingsStore extends HTMLElement {
  constructor() {
    super();
    this.settings = this.loadSettings();
  }

  connectedCallback() {
    this.unsubscribe = subscribe('settings.update', (msg) => {
      this.updateSettings(msg.data);
    });

    // Publish initial state
    publish('settings.current', this.settings);
  }

  loadSettings() {
    const stored = localStorage.getItem('settings');
    const defaults = {
      theme: 'light',
      fontSize: 16,
      notifications: true
    };

    if (stored) {
      try {
        return { ...defaults, ...JSON.parse(stored) };
      } catch (error) {
        console.error('Failed to load settings:', error);
        return defaults;
      }
    }

    return defaults;
  }

  updateSettings(updates) {
    this.settings = { ...this.settings, ...updates };

    // Persist to localStorage
    localStorage.setItem('settings', JSON.stringify(this.settings));

    // Publish updated state
    publish('settings.current', this.settings);
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('settings-store', SettingsStore);
```

### localStorage Limitations

localStorage is convenient but has limitations:

1. **Size limit**: Typically 5-10 MB per origin
2. **Synchronous API**: Blocks the main thread (though usually fast)
3. **String-only storage**: Must serialize/deserialize data
4. **No structured queries**: You can't query localStorage like a database

For larger datasets or structured data, use IndexedDB.

## State Persistence with IndexedDB

IndexedDB is a powerful, asynchronous, transactional database built into browsers. It can store much larger amounts of data than localStorage (often hundreds of megabytes or more) and supports structured queries.

However, IndexedDB's API is notoriously verbose. Here's a wrapper to make it more palatable:

```javascript
class IndexedDBStore {
  constructor(dbName, storeName) {
    this.dbName = dbName;
    this.storeName = storeName;
    this.db = null;
  }

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  async get(id) {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async put(object) {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(object);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }

  async delete(id) {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async getAll() {
    if (!this.db) await this.open();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
    });
  }
}
```

Now use it in a store component:

```javascript
class DocumentStore extends HTMLElement {
  constructor() {
    super();
    this.db = new IndexedDBStore('app-db', 'documents');
    this.documents = [];
  }

  async connectedCallback() {
    this.subscriptions = [
      subscribe('document.save', async (msg) => {
        await this.saveDocument(msg.data);
      }),

      subscribe('document.delete', async (msg) => {
        await this.deleteDocument(msg.data.id);
      }),

      subscribe('document.load', async (msg) => {
        await this.loadDocument(msg.data.id);
      })
    ];

    // Load all documents on startup
    await this.loadAllDocuments();
  }

  async loadAllDocuments() {
    try {
      this.documents = await this.db.getAll();
      publish('documents.loaded', { documents: this.documents });
    } catch (error) {
      console.error('Failed to load documents:', error);
      publish('documents.error', { error: error.message });
    }
  }

  async saveDocument(document) {
    try {
      await this.db.put(document);
      this.documents = await this.db.getAll();
      publish('document.saved', { document });
      publish('documents.loaded', { documents: this.documents });
    } catch (error) {
      console.error('Failed to save document:', error);
      publish('document.error', { error: error.message });
    }
  }

  async deleteDocument(id) {
    try {
      await this.db.delete(id);
      this.documents = await this.db.getAll();
      publish('document.deleted', { id });
      publish('documents.loaded', { documents: this.documents });
    } catch (error) {
      console.error('Failed to delete document:', error);
      publish('document.error', { error: error.message });
    }
  }

  async loadDocument(id) {
    try {
      const document = await this.db.get(id);
      publish('document.loaded', { document });
    } catch (error) {
      console.error('Failed to load document:', error);
      publish('document.error', { error: error.message });
    }
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('document-store', DocumentStore);
```

This store persists documents to IndexedDB and publishes events when documents are saved, deleted, or loaded. Other components react to these events without knowing anything about IndexedDB.

## State Persistence with OPFS

The Origin Private File System (OPFS) is a newer browser API that provides high-performance file storage. Unlike IndexedDB, which is designed for structured data, OPFS is designed for files—making it ideal for large binary data like images, videos, or application data files.

Here's how to use OPFS:

```javascript
class OPFSStore {
  constructor() {
    this.root = null;
  }

  async init() {
    if (!this.root) {
      this.root = await navigator.storage.getDirectory();
    }
  }

  async writeFile(path, data) {
    await this.init();

    const fileHandle = await this.root.getFileHandle(path, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(data);
    await writable.close();
  }

  async readFile(path) {
    await this.init();

    try {
      const fileHandle = await this.root.getFileHandle(path);
      const file = await fileHandle.getFile();
      return await file.text();
    } catch (error) {
      if (error.name === 'NotFoundError') {
        return null;
      }
      throw error;
    }
  }

  async deleteFile(path) {
    await this.init();

    try {
      await this.root.removeEntry(path);
    } catch (error) {
      if (error.name !== 'NotFoundError') {
        throw error;
      }
    }
  }

  async listFiles() {
    await this.init();

    const files = [];
    for await (const entry of this.root.values()) {
      if (entry.kind === 'file') {
        files.push(entry.name);
      }
    }
    return files;
  }
}
```

Use OPFS for storing large files:

```javascript
class FileStore extends HTMLElement {
  constructor() {
    super();
    this.opfs = new OPFSStore();
  }

  async connectedCallback() {
    this.subscriptions = [
      subscribe('file.save', async (msg) => {
        await this.saveFile(msg.data);
      }),

      subscribe('file.load', async (msg) => {
        await this.loadFile(msg.data.path);
      }),

      subscribe('file.delete', async (msg) => {
        await this.deleteFile(msg.data.path);
      })
    ];

    // Publish list of available files
    const files = await this.opfs.listFiles();
    publish('files.list', { files });
  }

  async saveFile({ path, content }) {
    try {
      await this.opfs.writeFile(path, content);
      publish('file.saved', { path });

      const files = await this.opfs.listFiles();
      publish('files.list', { files });
    } catch (error) {
      console.error('Failed to save file:', error);
      publish('file.error', { error: error.message });
    }
  }

  async loadFile(path) {
    try {
      const content = await this.opfs.readFile(path);
      publish('file.loaded', { path, content });
    } catch (error) {
      console.error('Failed to load file:', error);
      publish('file.error', { error: error.message });
    }
  }

  async deleteFile(path) {
    try {
      await this.opfs.deleteFile(path);
      publish('file.deleted', { path });

      const files = await this.opfs.listFiles();
      publish('files.list', { files });
    } catch (error) {
      console.error('Failed to delete file:', error);
      publish('file.error', { error: error.message });
    }
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('file-store', FileStore);
```

### When to Use OPFS vs. IndexedDB

Use **IndexedDB** when:

- You need structured data with queries
- You need transactions
- Data is primarily JSON or small blobs

Use **OPFS** when:

- You're working with large files (>1 MB)
- You need high-performance sequential access
- You're building a file-based application (e.g., document editor, media player)

Use **localStorage** when:

- Data is small (<100 KB)
- Simplicity matters more than performance
- You need synchronous access

## Synchronization Patterns

When multiple components interact with shared state, synchronization becomes critical. Here are common patterns:

### Pattern: Optimistic Updates

Update the UI immediately, then sync with the server in the background:

```javascript
class TodoStore extends HTMLElement {
  constructor() {
    super();
    this.todos = [];
  }

  connectedCallback() {
    this.subscriptions = [
      subscribe('todo.add', async (msg) => {
        await this.addTodo(msg.data);
      }),

      subscribe('todo.complete', async (msg) => {
        await this.completeTodo(msg.data.id);
      })
    ];

    this.loadTodos();
  }

  async loadTodos() {
    try {
      const response = await fetch('/api/todos');
      this.todos = await response.json();
      publish('todos.loaded', { todos: this.todos });
    } catch (error) {
      console.error('Failed to load todos:', error);
    }
  }

  async addTodo(todo) {
    // Optimistic update: add to local state immediately
    const optimisticTodo = { id: `temp-${Date.now()}`, ...todo };
    this.todos.push(optimisticTodo);
    publish('todos.loaded', { todos: this.todos });

    try {
      // Sync with server
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo)
      });

      const savedTodo = await response.json();

      // Replace optimistic todo with server response
      this.todos = this.todos.map(t =>
        t.id === optimisticTodo.id ? savedTodo : t
      );

      publish('todos.loaded', { todos: this.todos });
      publish('todo.synced', { todo: savedTodo });
    } catch (error) {
      // Rollback on error
      this.todos = this.todos.filter(t => t.id !== optimisticTodo.id);
      publish('todos.loaded', { todos: this.todos });
      publish('todo.error', { error: error.message });
    }
  }

  async completeTodo(id) {
    // Optimistic update: mark complete immediately
    const originalTodos = [...this.todos];
    this.todos = this.todos.map(t =>
      t.id === id ? { ...t, completed: true } : t
    );
    publish('todos.loaded', { todos: this.todos });

    try {
      // Sync with server
      await fetch(`/api/todos/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: true })
      });

      publish('todo.synced', { id });
    } catch (error) {
      // Rollback on error
      this.todos = originalTodos;
      publish('todos.loaded', { todos: this.todos });
      publish('todo.error', { error: error.message });
    }
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('todo-store', TodoStore);
```

Optimistic updates make the UI feel instant while handling network latency gracefully.

### Pattern: Debounced Sync

For high-frequency updates, debounce synchronization to reduce server load:

```javascript
class EditorStore extends HTMLElement {
  constructor() {
    super();
    this.content = '';
    this.syncTimer = null;
    this.syncDelay = 1000; // 1 second
  }

  connectedCallback() {
    this.unsubscribe = subscribe('editor.content.changed', (msg) => {
      this.updateContent(msg.data.content);
    });

    this.loadContent();
  }

  async loadContent() {
    try {
      const response = await fetch('/api/document/current');
      const data = await response.json();
      this.content = data.content;
      publish('editor.content.loaded', { content: this.content });
    } catch (error) {
      console.error('Failed to load content:', error);
    }
  }

  updateContent(content) {
    this.content = content;

    // Publish immediately for reactive UI
    publish('editor.content.updated', { content });

    // Debounce server sync
    clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => {
      this.syncToServer();
    }, this.syncDelay);
  }

  async syncToServer() {
    try {
      await fetch('/api/document/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: this.content })
      });

      publish('editor.content.synced', { timestamp: Date.now() });
    } catch (error) {
      console.error('Failed to sync content:', error);
      publish('editor.sync.error', { error: error.message });
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Flush pending sync on disconnect
    clearTimeout(this.syncTimer);
    this.syncToServer();
  }
}

customElements.define('editor-store', EditorStore);
```

### Pattern: Polling

For real-time-ish updates without WebSockets, poll the server periodically:

```javascript
class NotificationStore extends HTMLElement {
  constructor() {
    super();
    this.notifications = [];
    this.pollInterval = 30000; // 30 seconds
    this.pollTimer = null;
  }

  connectedCallback() {
    this.startPolling();
  }

  startPolling() {
    this.fetchNotifications();

    this.pollTimer = setInterval(() => {
      this.fetchNotifications();
    }, this.pollInterval);
  }

  async fetchNotifications() {
    try {
      const response = await fetch('/api/notifications');
      const notifications = await response.json();

      // Check for new notifications
      const newNotifications = notifications.filter(n =>
        !this.notifications.some(existing => existing.id === n.id)
      );

      if (newNotifications.length > 0) {
        publish('notifications.new', { notifications: newNotifications });
      }

      this.notifications = notifications;
      publish('notifications.updated', { notifications });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }

  disconnectedCallback() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }
}

customElements.define('notification-store', NotificationStore);
```

## Conflict Resolution

When multiple sources can update the same state, conflicts arise. Here are strategies for resolving them:

### Strategy: Last Write Wins

The simplest strategy: the most recent write wins, earlier writes are lost:

```javascript
class SimpleStore extends HTMLElement {
  constructor() {
    super();
    this.data = {};
  }

  connectedCallback() {
    this.unsubscribe = subscribe('data.update', (msg) => {
      // Last write wins
      this.data = { ...this.data, ...msg.data };
      publish('data.current', this.data);
    });
  }
}
```

This works when conflicts are rare or unimportant.

### Strategy: Timestamps

Use timestamps to determine which update is newer:

```javascript
class TimestampedStore extends HTMLElement {
  constructor() {
    super();
    this.data = {};
    this.timestamps = {};
  }

  connectedCallback() {
    this.unsubscribe = subscribe('data.update', (msg) => {
      const { key, value, timestamp } = msg.data;

      // Only apply update if it's newer
      if (!this.timestamps[key] || timestamp > this.timestamps[key]) {
        this.data[key] = value;
        this.timestamps[key] = timestamp;
        publish('data.current', this.data);
      }
    });
  }
}
```

This handles out-of-order updates gracefully.

### Strategy: Version Vectors

For distributed systems, use version vectors to track causality:

```javascript
class VersionedStore extends HTMLElement {
  constructor() {
    super();
    this.data = {};
    this.version = {}; // { clientId: sequence }
  }

  connectedCallback() {
    this.unsubscribe = subscribe('data.update', (msg) => {
      const { key, value, version } = msg.data;

      if (this.isNewer(version)) {
        this.data[key] = value;
        this.version = this.mergeVersions(this.version, version);
        publish('data.current', { data: this.data, version: this.version });
      }
    });
  }

  isNewer(incomingVersion) {
    // Check if incoming version is causally newer
    for (const clientId in incomingVersion) {
      if (incomingVersion[clientId] > (this.version[clientId] || 0)) {
        return true;
      }
    }
    return false;
  }

  mergeVersions(v1, v2) {
    const merged = { ...v1 };
    for (const clientId in v2) {
      merged[clientId] = Math.max(merged[clientId] || 0, v2[clientId]);
    }
    return merged;
  }
}
```

This is overkill for most applications, but essential for offline-first or collaborative apps.

### Strategy: Conflict Detection and User Intervention

When conflicts matter, detect them and let the user decide:

```javascript
class ConflictAwareStore extends HTMLElement {
  constructor() {
    super();
    this.data = {};
    this.version = 0;
  }

  connectedCallback() {
    this.unsubscribe = subscribe('data.update', (msg) => {
      const { key, value, expectedVersion } = msg.data;

      if (expectedVersion !== this.version) {
        // Conflict detected
        publish('data.conflict', {
          key,
          currentValue: this.data[key],
          incomingValue: value,
          currentVersion: this.version,
          expectedVersion
        });
      } else {
        // No conflict, apply update
        this.data[key] = value;
        this.version++;
        publish('data.current', { data: this.data, version: this.version });
      }
    });
  }
}
```

A UI component can subscribe to `data.conflict` and show a dialog asking the user which value to keep.

## State Snapshots and Time Travel

For debugging and undo/redo functionality, maintain a history of state snapshots:

```javascript
class HistoryStore extends HTMLElement {
  constructor() {
    super();
    this.history = [];
    this.currentIndex = -1;
    this.maxHistory = 50;
  }

  connectedCallback() {
    this.subscriptions = [
      subscribe('state.update', (msg) => {
        this.addSnapshot(msg.data);
      }),

      subscribe('state.undo', () => {
        this.undo();
      }),

      subscribe('state.redo', () => {
        this.redo();
      })
    ];
  }

  addSnapshot(state) {
    // Remove any history after current index (user made changes after undo)
    this.history = this.history.slice(0, this.currentIndex + 1);

    // Add new snapshot
    this.history.push(JSON.parse(JSON.stringify(state)));
    this.currentIndex++;

    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
      this.currentIndex--;
    }

    publish('state.current', state);
    publish('state.history.updated', {
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    });
  }

  undo() {
    if (this.canUndo()) {
      this.currentIndex--;
      const state = this.history[this.currentIndex];
      publish('state.current', state);
      publish('state.history.updated', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    }
  }

  redo() {
    if (this.canRedo()) {
      this.currentIndex++;
      const state = this.history[this.currentIndex];
      publish('state.current', state);
      publish('state.history.updated', {
        canUndo: this.canUndo(),
        canRedo: this.canRedo()
      });
    }
  }

  canUndo() {
    return this.currentIndex > 0;
  }

  canRedo() {
    return this.currentIndex < this.history.length - 1;
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('history-store', HistoryStore);
```

## Derived State

Sometimes state is computed from other state. Rather than storing derived state redundantly, compute it on demand:

```javascript
class CartStore extends HTMLElement {
  constructor() {
    super();
    this.items = [];
  }

  connectedCallback() {
    this.unsubscribe = subscribe('cart.item.added', (msg) => {
      this.items.push(msg.data);
      this.publishDerivedState();
    });
  }

  publishDerivedState() {
    const itemCount = this.items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    publish('cart.state', {
      items: this.items,
      itemCount,
      subtotal,
      tax,
      total
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

Components receive the fully computed state and don't need to recalculate it.

## Performance Considerations

State management can be expensive. Here are tips for keeping it performant:

1. **Minimize state updates**: Only publish when state actually changes
2. **Batch updates**: If updating multiple fields, batch them into a single message
3. **Use immutable updates**: Create new objects rather than mutating existing ones
4. **Debounce high-frequency updates**: Don't publish on every keystroke
5. **Lazy load large datasets**: Load data on demand rather than upfront
6. **Prune old data**: Remove stale data from stores to prevent memory bloat

## Wrapping Up

State management is hard, but LARC's message-based architecture provides a solid foundation. By separating state stores from UI components, using the PAN bus for state synchronization, and choosing the right persistence strategy (localStorage, IndexedDB, or OPFS), you can build applications that manage state gracefully even under complex conditions.

The key insights:

- Local state lives in components; shared state lives in stores
- Stores subscribe to commands and publish state updates
- Components subscribe to state updates and render accordingly
- Persistence strategies vary by data size and access patterns
- Conflicts are inevitable; plan your resolution strategy
- Derived state should be computed, not stored

In the next chapter, we'll explore advanced topics like routing, code splitting, and progressive enhancement. But state management is the foundation—get this right, and everything else becomes easier.

Now go forth and manage some state. And when you inevitably encounter a conflict on a Tuesday when Mercury is in retrograde, you'll know exactly what to do.
