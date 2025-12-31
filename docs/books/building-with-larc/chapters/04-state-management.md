# State Management

Quick reference for state management patterns in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 6.

## Overview

State management is the practice of tracking application data across components. LARC distinguishes between **local state** (component-specific) and **shared state** (application-wide), using the PAN bus for state synchronization.

**Key Concepts**:

- Local state: Component properties, ephemeral
- Shared state: Store components, persisted via localStorage, IndexedDB, or OPFS
- State stores: Components that manage and publish shared state
- Synchronization: Optimistic updates, debouncing, polling, conflict resolution

## Quick Example

```javascript
// State store component
class UserStore extends HTMLElement {
  constructor() {
    super();
    this.currentUser = null;
  }

  connectedCallback() {
    this.subscriptions = [
      subscribe('auth.login.success', (msg) => this.setUser(msg.data)),
      subscribe('auth.logout', () => this.setUser(null))
    ];
    
    this.loadPersistedUser();
  }

  setUser(user) {
    this.currentUser = user;
    publish('user.current', user);
    
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
        this.setUser(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to load user:', error);
      }
    }
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('user-store', UserStore);
```

## Persistence Strategies

| Strategy | Size Limit | API Style | Use Case |
|----------|------------|-----------|----------|
| **localStorage** | 5-10 MB | Synchronous | Small settings, simple data |
| **IndexedDB** | 100s of MB | Async (Promise) | Structured data, queries |
| **OPFS** | GB+ | Async (File API) | Large files, binary data |

### When to Use Each

- **localStorage**: Settings, themes, small JSON (< 100 KB)
- **IndexedDB**: Documents, cached API responses, structured records
- **OPFS**: Images, videos, large text files, application data files

## State Synchronization Patterns

### Optimistic Updates

| Step | Action |
|------|--------|
| 1 | Update local state immediately |
| 2 | Publish updated state to UI |
| 3 | Sync to server in background |
| 4 | On success: Publish confirmation |
| 5 | On error: Rollback and publish error |

```javascript
async addTodo(todo) {
  // Step 1-2: Optimistic update
  const temp = { id: `temp-${Date.now()}`, ...todo };
  this.todos.push(temp);
  publish('todos.loaded', { todos: this.todos });

  try {
    // Step 3: Sync to server
    const response = await fetch('/api/todos', {
      method: 'POST',
      body: JSON.stringify(todo)
    });
    const saved = await response.json();
    
    // Step 4: Replace temp with server ID
    this.todos = this.todos.map(t => t.id === temp.id ? saved : t);
    publish('todos.loaded', { todos: this.todos });
  } catch (error) {
    // Step 5: Rollback on error
    this.todos = this.todos.filter(t => t.id !== temp.id);
    publish('todos.loaded', { todos: this.todos });
    publish('todo.error', { error: error.message });
  }
}
```

### Debounced Sync

For high-frequency updates (e.g., text editor), debounce server sync while updating UI immediately:

```javascript
updateContent(content) {
  this.content = content;
  publish('editor.content.updated', { content }); // Immediate UI update
  
  clearTimeout(this.syncTimer);
  this.syncTimer = setTimeout(() => {
    this.syncToServer(); // Delayed server sync
  }, 1000);
}
```

### Polling

Poll server periodically for updates without WebSockets:

```javascript
startPolling() {
  this.fetchNotifications();
  this.pollTimer = setInterval(() => {
    this.fetchNotifications();
  }, 30000); // Every 30 seconds
}
```

## Conflict Resolution Strategies

| Strategy | Description | Use Case |
|----------|-------------|----------|
| **Last Write Wins** | Most recent update overwrites | Simple apps, rare conflicts |
| **Timestamps** | Keep update with newest timestamp | Async updates, out-of-order messages |
| **Version Vectors** | Track causality across clients | Distributed systems, offline-first |
| **User Intervention** | Detect conflict, prompt user | Collaborative apps, important data |

### Example: Timestamp-Based Resolution

```javascript
connectedCallback() {
  this.unsubscribe = subscribe('data.update', (msg) => {
    const { key, value, timestamp } = msg.data;
    
    // Only apply if newer
    if (!this.timestamps[key] || timestamp > this.timestamps[key]) {
      this.data[key] = value;
      this.timestamps[key] = timestamp;
      publish('data.current', this.data);
    }
  });
}
```

## Derived State Pattern

Compute derived state from source state rather than storing redundantly:

```javascript
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
```

## History and Time Travel

Implement undo/redo by maintaining state snapshots:

```javascript
addSnapshot(state) {
  this.history = this.history.slice(0, this.currentIndex + 1);
  this.history.push(JSON.parse(JSON.stringify(state)));
  this.currentIndex++;
  
  if (this.history.length > this.maxHistory) {
    this.history.shift();
    this.currentIndex--;
  }
  
  publish('state.current', state);
  publish('state.history.updated', {
    canUndo: this.currentIndex > 0,
    canRedo: this.currentIndex < this.history.length - 1
  });
}
```

## Performance Best Practices

| Practice | Why |
|----------|-----|
| Minimize updates | Only publish when state actually changes |
| Batch updates | Combine multiple field changes into single message |
| Immutable updates | Create new objects, don't mutate |
| Debounce high-frequency | Don't publish every keystroke |
| Lazy load | Load data on demand |
| Prune old data | Remove stale data to prevent memory bloat |

## Component Reference

- **pan-store**: Reactive state store with persistence - See Chapter 18
- **pan-idb**: IndexedDB wrapper component - See Chapter 18

## Complete Example: Document Store with IndexedDB

```javascript
class DocumentStore extends HTMLElement {
  constructor() {
    super();
    this.db = new IndexedDBStore('app-db', 'documents');
    this.documents = [];
  }

  async connectedCallback() {
    this.subscriptions = [
      subscribe('document.save', async (msg) => await this.saveDocument(msg.data)),
      subscribe('document.delete', async (msg) => await this.deleteDocument(msg.data.id)),
      subscribe('document.load', async (msg) => await this.loadDocument(msg.data.id))
    ];

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

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 6 (State Management)
- **Components**: Chapter 18 (pan-store, pan-idb)
- **Patterns**: Appendix E (Message Patterns)
- **Related**: Chapter 5 (Routing), Chapter 7 (Data Fetching)

## Common Issues

### Issue: State not persisting
**Problem**: Data lost on page reload
**Solution**: Ensure `loadPersistedUser()` called in `connectedCallback()` and storage API used correctly

### Issue: Race conditions
**Problem**: Concurrent updates causing inconsistent state
**Solution**: Use timestamps or version vectors, implement conflict resolution strategy

### Issue: Memory leaks from subscriptions
**Problem**: Memory grows over time
**Solution**: Always unsubscribe in `disconnectedCallback()`, store subscription functions

### Issue: localStorage quota exceeded
**Problem**: `QuotaExceededError` thrown
**Solution**: Migrate to IndexedDB for larger data, implement data pruning strategy

### Issue: Stale data after optimistic update failure
**Problem**: UI shows incorrect state after server error
**Solution**: Implement rollback in catch block, publish error state

See *Learning LARC* Chapter 6 for detailed troubleshooting and advanced patterns.
