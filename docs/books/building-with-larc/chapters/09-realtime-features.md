# Real-time Features

Quick reference for real-time communication patterns in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 11.

## Overview

Real-time features enable live data updates without page reloads using WebSockets, Server-Sent Events (SSE), BroadcastChannel for cross-tab sync, and Web Workers for background processing.

**Key Concepts**:

- WebSockets: Full-duplex bidirectional communication
- SSE: One-way server-to-client streaming
- BroadcastChannel: Cross-tab/window messaging
- Web Workers: Background thread processing
- Heartbeat: Keep-alive mechanism to detect disconnections
- Reconnection: Automatic recovery from connection failures

## Quick Example

```javascript
// WebSocket connection
import { wsClient } from './services/websocket-client.js';

await wsClient.connect();

// Subscribe to events
wsClient.on('notification', (data) => {
  console.log('New notification:', data);
});

// Send message
wsClient.send('chat.message', { text: 'Hello!' });

// Check connection
if (wsClient.isConnected()) {
  // Connected
}
```

## WebSocket Client API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | Promise\<void\> | Connect to WebSocket server |
| `disconnect()` | - | void | Close connection |
| `send(type, payload)` | type: string, payload: any | void | Send message to server |
| `on(type, handler)` | type: string, handler: Function | Function | Subscribe to message type (returns unsubscribe) |
| `isConnected()` | - | boolean | Check connection status |

### WebSocket Configuration

```javascript
class WebSocketClient {
  constructor(config) {
    this.config = {
      url: 'ws://localhost:3000/ws',
      reconnectInterval: 5000,        // Delay between reconnect attempts
      maxReconnectAttempts: 10,       // Max reconnection attempts
      heartbeatInterval: 30000,       // Heartbeat ping interval
      ...config
    };
  }
}
```

### WebSocket Connection Pattern

```javascript
const wsClient = new WebSocketClient({
  url: 'ws://localhost:3000/ws'
});

// Connection lifecycle
wsClient.on('connected', () => {
  console.log('Connected');
});

wsClient.on('disconnected', ({ code, reason }) => {
  console.log('Disconnected:', code, reason);
});

wsClient.on('error', ({ error }) => {
  console.error('WebSocket error:', error);
});

wsClient.on('reconnect-failed', () => {
  console.error('Reconnection failed');
});

await wsClient.connect();
```

## Server-Sent Events (SSE)

SSE provides one-way server-to-client streaming over HTTP. Simpler than WebSockets, automatic reconnection, works with existing HTTP infrastructure.

### SSE Client API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `connect()` | - | void | Connect to SSE endpoint |
| `disconnect()` | - | void | Close connection |
| `on(eventName, handler)` | eventName: string, handler: Function | Function | Subscribe to named events |
| `isConnected()` | - | boolean | Check connection status |

### SSE Usage Pattern

```javascript
import { SSEClient } from './services/sse-client.js';

const sseClient = new SSEClient({
  url: '/api/events',
  withCredentials: true,
  reconnectDelay: 3000
});

sseClient.connect();

// Subscribe to named events
sseClient.on('activity', (data) => {
  console.log('Activity:', data);
});

sseClient.on('notification', (data) => {
  console.log('Notification:', data);
});

// Connection events
sseClient.on('connected', () => console.log('SSE connected'));
sseClient.on('disconnected', () => console.log('SSE disconnected'));
```

## BroadcastChannel: Cross-Tab Communication

Synchronize state across browser tabs and windows.

### BroadcastChannel API

```javascript
class TabSyncService {
  constructor(channelName = 'app-sync') {
    this.channel = new BroadcastChannel(channelName);
    this.tabId = this.generateTabId();
    
    this.channel.onmessage = (event) => {
      this.handleMessage(event.data);
    };
  }
  
  broadcast(type, payload) {
    this.channel.postMessage({
      type,
      payload,
      timestamp: Date.now(),
      tabId: this.tabId
    });
  }
  
  on(type, handler) {
    // Subscribe to message type
  }
}

const tabSync = new TabSyncService();
```

### Cross-Tab Sync Patterns

```javascript
// Sync authentication state
tabSync.on('auth-logout', () => {
  authService.logout();
  window.location.href = '/login';
});

tabSync.on('auth-login', (user) => {
  window.location.reload();
});

// Broadcast logout to other tabs
tabSync.broadcast('auth-logout', {});

// Sync data changes
tabSync.on('data-updated', ({ resource, id }) => {
  // Refresh data in this tab
  reloadResource(resource, id);
});
```

## Web Workers: Background Processing

Run JavaScript in background threads without blocking UI.

### Worker Creation

```javascript
// worker.js
self.onmessage = (event) => {
  const { id, type, data, options } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'sort':
        result = sortData(data, options);
        break;
      case 'filter':
        result = filterData(data, options);
        break;
      case 'aggregate':
        result = aggregateData(data, options);
        break;
    }
    
    self.postMessage({ id, result });
  } catch (error) {
    self.postMessage({ id, result: null, error: error.message });
  }
};

function sortData(data, options) {
  const { field, order = 'asc' } = options;
  return [...data].sort((a, b) => {
    const comparison = a[field] < b[field] ? -1 : a[field] > b[field] ? 1 : 0;
    return order === 'asc' ? comparison : -comparison;
  });
}
```

### Worker Manager

```javascript
class WorkerManager {
  constructor(workerUrl) {
    this.worker = new Worker(workerUrl);
    this.requestId = 0;
    this.pendingRequests = new Map();
    
    this.worker.onmessage = (event) => {
      const { id, result, error } = event.data;
      const pending = this.pendingRequests.get(id);
      
      if (pending) {
        this.pendingRequests.delete(id);
        error ? pending.reject(new Error(error)) : pending.resolve(result);
      }
    };
  }
  
  async process(type, data, options) {
    const id = `req-${++this.requestId}`;
    
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      this.worker.postMessage({ id, type, data, options });
      
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error('Request timeout'));
        }
      }, 30000);
    });
  }
  
  terminate() {
    this.worker.terminate();
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    this.pendingRequests.clear();
  }
}

const dataWorker = new WorkerManager('/workers/data-processor.js');

// Use worker
const sorted = await dataWorker.process('sort', data, {
  field: 'name',
  order: 'asc'
});
```

## Real-time Component Patterns

### Notification Feed

```javascript
class NotificationFeed extends HTMLElement {
  connectedCallback() {
    this.notifications = [];
    
    wsClient.on('notification', (notification) => {
      this.notifications.unshift(notification);
      this.render();
      
      // Auto-dismiss after 5s
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, 5000);
    });
    
    this.render();
  }
  
  render() {
    this.innerHTML = `
      <div class="notifications">
        ${this.notifications.map(n => `
          <div class="notification ${n.type}">
            <strong>${n.title}</strong>
            <p>${n.message}</p>
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('notification-feed', NotificationFeed);
```

### Live Activity Feed

```javascript
class ActivityFeed extends HTMLElement {
  async connectedCallback() {
    this.activities = [];
    
    // Load initial data
    const response = await fetch('/api/activities');
    this.activities = await response.json();
    
    // Subscribe to live updates
    sseClient.on('activity', (activity) => {
      this.activities.unshift(activity);
      this.activities = this.activities.slice(0, 100); // Limit
      this.render();
    });
    
    this.render();
  }
  
  render() {
    this.innerHTML = `
      <div class="activities">
        ${this.activities.map(a => `
          <div class="activity">
            <strong>${a.userName}</strong> ${a.action} <em>${a.target}</em>
            <span class="time">${this.formatTime(a.timestamp)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
  
  formatTime(timestamp) {
    const diff = Date.now() - timestamp;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return new Date(timestamp).toLocaleString();
  }
}

customElements.define('activity-feed', ActivityFeed);
```

### Collaborative Editor

```javascript
class CollaborativeEditor extends HTMLElement {
  connectedCallback() {
    this.docId = this.getAttribute('doc-id');
    this.content = '';
    this.collaborators = new Map();
    
    // Join document
    wsClient.send('join-document', { docId: this.docId });
    
    // Subscribe to updates
    wsClient.on('document-update', (update) => {
      if (!this.isLocalUpdate) {
        this.content = update.content;
        this.render();
      }
    });
    
    wsClient.on('collaborator-joined', (collab) => {
      this.collaborators.set(collab.userId, collab);
      this.render();
    });
    
    wsClient.on('collaborator-left', ({ userId }) => {
      this.collaborators.delete(userId);
      this.render();
    });
    
    this.render();
  }
  
  handleInput(e) {
    this.content = e.target.value;
    this.isLocalUpdate = true;
    
    wsClient.send('document-update', {
      docId: this.docId,
      content: this.content
    });
    
    setTimeout(() => { this.isLocalUpdate = false; }, 100);
  }
  
  render() {
    this.innerHTML = `
      <div class="editor">
        <div class="collaborators">
          ${Array.from(this.collaborators.values()).map(c => `
            <div class="badge">${c.name[0]}</div>
          `).join('')}
        </div>
        <textarea>${this.content}</textarea>
      </div>
    `;
    
    this.querySelector('textarea').addEventListener('input', (e) => this.handleInput(e));
  }
}

customElements.define('collaborative-editor', CollaborativeEditor);
```

## Component Reference

See Chapter 20 for real-time components:

- **pan-websocket**: WebSocket connection management
- **pan-sse**: Server-Sent Events integration
- **pan-live-data**: Auto-refreshing data display

## Advanced Patterns

### Optimistic Updates

```javascript
class OptimisticList extends HTMLElement {
  async addItem(item) {
    // Add to UI immediately (optimistic)
    this.items.push({ ...item, pending: true });
    this.render();
    
    try {
      // Send to server
      const response = await fetch('/api/items', {
        method: 'POST',
        body: JSON.stringify(item)
      });
      
      const serverItem = await response.json();
      
      // Replace pending with server version
      const index = this.items.findIndex(i => i.pending);
      this.items[index] = serverItem;
      this.render();
    } catch (err) {
      // Rollback on error
      this.items = this.items.filter(i => !i.pending);
      this.render();
      alert('Failed to add item');
    }
  }
}
```

### Presence Tracking

```javascript
class PresenceTracker {
  constructor() {
    this.users = new Map();
    
    wsClient.on('presence-update', ({ userId, status }) => {
      this.users.set(userId, { userId, status, lastSeen: Date.now() });
      this.notifySubscribers();
    });
    
    wsClient.on('presence-offline', ({ userId }) => {
      this.users.delete(userId);
      this.notifySubscribers();
    });
    
    // Send heartbeat
    setInterval(() => {
      wsClient.send('presence-heartbeat', {});
    }, 30000);
  }
  
  getOnlineUsers() {
    return Array.from(this.users.values()).filter(u => u.status === 'online');
  }
}
```

### Conflict Resolution

```javascript
class ConflictResolver {
  async handleUpdate(localVersion, remoteVersion) {
    if (localVersion.timestamp > remoteVersion.timestamp) {
      // Local wins - send to server
      await this.sendUpdate(localVersion);
    } else if (localVersion.timestamp < remoteVersion.timestamp) {
      // Remote wins - apply locally
      this.applyUpdate(remoteVersion);
    } else {
      // Timestamps equal - merge
      const merged = this.merge(localVersion, remoteVersion);
      this.applyUpdate(merged);
    }
  }
  
  merge(local, remote) {
    // Last-write-wins per field
    return {
      ...remote,
      ...Object.entries(local).reduce((acc, [key, value]) => {
        if (local[`${key}_timestamp`] > remote[`${key}_timestamp`]) {
          acc[key] = value;
        }
        return acc;
      }, {})
    };
  }
}
```

## Performance Considerations

| Strategy | Use Case | Implementation |
|----------|----------|----------------|
| **Throttling** | High-frequency events (scroll, mousemove) | Send update max once per 100-500ms |
| **Debouncing** | Text input | Send update after 300ms of inactivity |
| **Batching** | Multiple updates | Accumulate and send in single message |
| **Compression** | Large payloads | Use MessagePack or gzip compression |
| **Selective sync** | Large datasets | Only sync visible/relevant data |

### Throttle Example

```javascript
class ThrottledInput extends HTMLElement {
  connectedCallback() {
    let lastSent = 0;
    const throttleMs = 300;
    
    this.querySelector('input').addEventListener('input', (e) => {
      const now = Date.now();
      if (now - lastSent >= throttleMs) {
        wsClient.send('input-update', { value: e.target.value });
        lastSent = now;
      }
    });
  }
}
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 11 (Real-time Features)
- **Components**: Chapter 20 (pan-websocket, pan-sse, pan-live-data)
- **Patterns**: Appendix E (Real-time Patterns)
- **Related**: Chapter 7 (API Integration), Chapter 12 (Performance)

## Common Issues

### Issue: Connection drops on mobile/sleep
**Problem**: WebSocket closes when device sleeps
**Solution**: Implement heartbeat + reconnection; use SSE for mobile

### Issue: Message order not guaranteed
**Problem**: Messages arrive out of sequence
**Solution**: Add sequence numbers; buffer and reorder on client

### Issue: Memory leaks from event listeners
**Problem**: Component unmounts but listeners remain
**Solution**: Always unsubscribe in `disconnectedCallback()`

### Issue: Duplicate messages on reconnect
**Problem**: Server resends messages after reconnection
**Solution**: Track message IDs; deduplicate on client

### Issue: High bandwidth usage
**Problem**: Too many messages or large payloads
**Solution**: Throttle updates; compress payloads; batch messages

See *Learning LARC* Chapter 11 for complete real-time patterns, WebSocket authentication, and scaling strategies.
