# Data Fetching and APIs

Every meaningful web application needs to communicate with servers. Whether you're loading user profiles, submitting forms, or streaming real-time updates, data fetching is the bridge between your frontend and the outside world. LARC embraces the browser's native fetch API while providing patterns that make common tasks simple and complex scenarios manageable.

## The Fetch API: Your Foundation

The Fetch API is built into every modern browser, and it's genuinely excellent. Unlike the XMLHttpRequest it replaced, fetch returns Promises, works naturally with async/await, and provides a clean interface for HTTP operations.

Here's the simplest possible fetch:

```javascript
const response = await fetch('/api/users');
const users = await response.json();
```

Two lines. No libraries. No configuration. This is the foundation everything else builds upon.

But real applications need more: error handling, loading states, retries, caching. Let's build these capabilities systematically.

## Building an API Client

Rather than scattering fetch calls throughout your application, centralize them in an API client. This gives you one place to handle authentication, errors, and common patterns:

```javascript
// api-client.js
class ApiClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
  }

  async fetch(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new ApiError(response.status, error.message || 'Request failed');
      }

      return response.json();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(0, 'Network error');
    }
  }

  get(endpoint) {
    return this.fetch(endpoint);
  }

  post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.fetch(endpoint, { method: 'DELETE' });
  }
}

class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const api = new ApiClient();
```

Now every component in your application can import this client and make requests with consistent error handling and authentication.

## Integrating with the PAN Bus

Here's where LARC shines. Instead of each component managing its own loading states and error handling, broadcast API events on the PAN bus:

```javascript
// api-client.js (enhanced)
import { pan } from '@aspect/pan-client';

class ApiClient {
  async fetch(endpoint, options = {}) {
    const requestId = crypto.randomUUID();

    // Announce request start
    pan.publish('api.request.start', { requestId, endpoint });

    try {
      const response = await fetch(/* ... */);
      const data = await response.json();

      // Announce success
      pan.publish('api.request.success', { requestId, endpoint, data });
      return data;

    } catch (error) {
      // Announce failure
      pan.publish('api.request.error', { requestId, endpoint, error });
      throw error;
    }
  }
}
```

Now any component can listen for API events. A loading indicator component might subscribe to `api.request.start` and `api.request.success`. An error toast might listen only for `api.request.error`. Components become loosely coupled—they don't need to know about each other, just the messages they care about.

## Caching Strategies

Network requests are slow and expensive. Smart caching makes your application feel instant while reducing server load.

### Cache-First Strategy

For data that changes infrequently, serve from cache immediately and update in the background:

```javascript
class CachedApiClient extends ApiClient {
  constructor() {
    super();
    this.cache = new Map();
  }

  async getCached(endpoint, maxAge = 60000) {
    const cached = this.cache.get(endpoint);

    if (cached && Date.now() - cached.timestamp < maxAge) {
      // Return cached data immediately
      return cached.data;
    }

    // Fetch fresh data
    const data = await this.get(endpoint);
    this.cache.set(endpoint, { data, timestamp: Date.now() });
    return data;
  }

  async getStaleWhileRevalidate(endpoint, maxAge = 60000) {
    const cached = this.cache.get(endpoint);

    // Return stale data immediately if available
    if (cached) {
      // Revalidate in background
      this.get(endpoint).then(data => {
        this.cache.set(endpoint, { data, timestamp: Date.now() });
        pan.publish(`cache.updated.${endpoint}`, { data });
      });

      return cached.data;
    }

    // No cache, must wait for network
    const data = await this.get(endpoint);
    this.cache.set(endpoint, { data, timestamp: Date.now() });
    return data;
  }
}
```

### Network-First Strategy

For data that must be current, try the network first and fall back to cache:

```javascript
async getNetworkFirst(endpoint, maxAge = 300000) {
  try {
    const data = await this.get(endpoint);
    this.cache.set(endpoint, { data, timestamp: Date.now() });
    return data;
  } catch (error) {
    const cached = this.cache.get(endpoint);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      console.warn('Using cached data due to network error');
      return cached.data;
    }
    throw error;
  }
}
```

## WebSocket Communication

When you need real-time bidirectional communication, WebSockets provide a persistent connection between browser and server:

```javascript
// websocket-client.js
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect() {
    this.socket = new WebSocket(this.url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      pan.publish('ws.connected');
    };

    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      // Broadcast message on PAN bus
      pan.publish(`ws.message.${message.type}`, message.payload);
    };

    this.socket.onclose = () => {
      pan.publish('ws.disconnected');
      this.attemptReconnect();
    };

    this.socket.onerror = (error) => {
      pan.publish('ws.error', { error });
    };
  }

  send(type, payload) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      setTimeout(() => this.connect(), delay);
    }
  }
}
```

The beauty of this approach: your components don't know or care that data comes from a WebSocket. They just subscribe to PAN bus topics like `ws.message.user-joined` or `ws.message.chat-message`.

## Server-Sent Events

When you only need server-to-client updates (no bidirectional communication), Server-Sent Events (SSE) are simpler and more reliable than WebSockets:

```javascript
// sse-client.js
class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      pan.publish('sse.message', data);
    };

    this.eventSource.addEventListener('notification', (event) => {
      const data = JSON.parse(event.data);
      pan.publish('sse.notification', data);
    });

    this.eventSource.onerror = () => {
      pan.publish('sse.error');
      // EventSource automatically reconnects
    };
  }

  disconnect() {
    this.eventSource?.close();
  }
}
```

SSE reconnects automatically, handles authentication through cookies, and works through proxies that might block WebSockets. For many real-time use cases, it's the better choice.

## Retry Logic with Exponential Backoff

Network requests fail. Good applications handle failure gracefully:

```javascript
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;

      // Don't retry client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status}`);
      }

      throw new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s...
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
```

## Putting It All Together

Here's a component that fetches user data with loading states, caching, and error handling—all integrated with the PAN bus:

```javascript
class UserList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.users = [];
    this.loading = true;
    this.error = null;
  }

  async connectedCallback() {
    // Subscribe to cache updates
    pan.subscribe('cache.updated./api/users', ({ data }) => {
      this.users = data;
      this.render();
    });

    try {
      this.users = await api.getStaleWhileRevalidate('/users');
      this.loading = false;
    } catch (error) {
      this.error = error.message;
      this.loading = false;
    }

    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .loading { color: #666; }
        .error { color: red; }
        .user { padding: 8px; border-bottom: 1px solid #eee; }
      </style>

      ${this.loading ? '<p class="loading">Loading users...</p>' : ''}
      ${this.error ? `<p class="error">Error: ${this.error}</p>` : ''}

      <div class="users">
        ${this.users.map(user => `
          <div class="user">${user.name} - ${user.email}</div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('user-list', UserList);
```

## GraphQL Integration

While REST APIs are common, GraphQL offers precise data fetching—request exactly what you need, nothing more. Here's how to integrate GraphQL with LARC:

```javascript
// graphql-client.js
class GraphQLClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async query(query, variables = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ query, variables })
    });

    const { data, errors } = await response.json();

    if (errors) {
      throw new GraphQLError(errors);
    }

    return data;
  }

  async mutation(mutation, variables = {}) {
    return this.query(mutation, variables);
  }
}

class GraphQLError extends Error {
  constructor(errors) {
    super(errors.map(e => e.message).join(', '));
    this.errors = errors;
  }
}

export const graphql = new GraphQLClient('/graphql');
```

### Using GraphQL in Components

```javascript
class UserProfile extends HTMLElement {
  async connectedCallback() {
    const userId = this.getAttribute('user-id');

    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
          avatar
          posts {
            id
            title
            publishedAt
          }
        }
      }
    `;

    try {
      const { user } = await graphql.query(query, { id: userId });
      this.renderUser(user);
    } catch (error) {
      this.renderError(error);
    }
  }

  renderUser(user) {
    this.innerHTML = `
      <div class="profile">
        <img src="${user.avatar}" alt="${user.name}">
        <h2>${user.name}</h2>
        <p>${user.email}</p>
        <h3>Recent Posts</h3>
        <ul>
          ${user.posts.map(post => `
            <li>${post.title} (${new Date(post.publishedAt).toLocaleDateString()})</li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}
```

## Real-World Example: Building a Dashboard

Let's build a complete dashboard that fetches data from multiple API endpoints, handles loading states, and updates in real-time.

### The Dashboard Component

```javascript
// components/dashboard.js
import { api } from '../lib/api-client.js';
import { pan } from '@larcjs/core';

class Dashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      stats: null,
      activity: [],
      loading: true,
      error: null
    };
  }

  async connectedCallback() {
    // Subscribe to real-time updates
    pan.subscribe('ws.message.stats-updated', ({ stats }) => {
      this.state.stats = stats;
      this.render();
    });

    pan.subscribe('ws.message.activity-added', ({ activity }) => {
      this.state.activity.unshift(activity);
      this.render();
    });

    await this.loadData();
    this.render();
  }

  async loadData() {
    try {
      // Load multiple endpoints in parallel
      const [stats, activity] = await Promise.all([
        api.getCached('/stats', 30000),
        api.get('/activity?limit=10')
      ]);

      this.state = {
        stats,
        activity,
        loading: false,
        error: null
      };
    } catch (error) {
      this.state = {
        ...this.state,
        loading: false,
        error: error.message
      };
    }
  }

  async refreshData() {
    this.state.loading = true;
    this.render();
    await this.loadData();
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 20px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .stat-value {
          font-size: 32px;
          font-weight: bold;
          color: #667eea;
        }

        .stat-label {
          color: #666;
          margin-top: 5px;
        }

        .activity {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .activity-header {
          padding: 20px;
          border-bottom: 1px solid #eee;
          font-weight: 600;
        }

        .activity-item {
          padding: 15px 20px;
          border-bottom: 1px solid #eee;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }

        .error {
          background: #fee;
          color: #c00;
          padding: 15px;
          border-radius: 4px;
        }

        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover {
          background: #5568d3;
        }
      </style>

      <div class="header">
        <h1>Dashboard</h1>
        <button @click="${() => this.refreshData()}">Refresh</button>
      </div>

      ${this.state.loading && !this.state.stats ? `
        <div class="loading">Loading dashboard...</div>
      ` : ''}

      ${this.state.error ? `
        <div class="error">Error: ${this.state.error}</div>
      ` : ''}

      ${this.state.stats ? `
        <div class="stats">
          <div class="stat-card">
            <div class="stat-value">${this.state.stats.totalUsers}</div>
            <div class="stat-label">Total Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.state.stats.activeUsers}</div>
            <div class="stat-label">Active Users</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.state.stats.revenue}</div>
            <div class="stat-label">Revenue</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${this.state.stats.conversionRate}%</div>
            <div class="stat-label">Conversion Rate</div>
          </div>
        </div>
      ` : ''}

      ${this.state.activity.length > 0 ? `
        <div class="activity">
          <div class="activity-header">Recent Activity</div>
          ${this.state.activity.map(item => `
            <div class="activity-item">
              <strong>${item.user}</strong> ${item.action}
              <span style="color: #999; font-size: 14px;">
                ${this.formatTime(item.timestamp)}
              </span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;

    // Attach event listeners
    const refreshBtn = this.shadowRoot.querySelector('button');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.refreshData());
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  }
}

customElements.define('app-dashboard', Dashboard);
```

This dashboard demonstrates:
- **Parallel data loading** with `Promise.all`
- **Caching** for stats that don't change often
- **Real-time updates** via PAN bus
- **Loading and error states**
- **Manual refresh** capability
- **Relative time formatting**

## Error Handling Patterns

### Circuit Breaker Pattern

Prevent cascading failures by stopping requests to failing services:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      pan.publish('circuit-breaker.opened', {
        breaker: this
      });
    }
  }
}

// Usage
const userApiBreaker = new CircuitBreaker();

async function fetchUsers() {
  return userApiBreaker.execute(() => api.get('/users'));
}
```

### Fallback Strategies

Provide graceful degradation when APIs fail:

```javascript
class FallbackApiClient extends ApiClient {
  async getWithFallback(endpoint, fallbackData) {
    try {
      return await this.get(endpoint);
    } catch (error) {
      console.warn(`API call failed, using fallback for ${endpoint}`);
      pan.publish('api.fallback', { endpoint, error });
      return fallbackData;
    }
  }

  async getWithCacheFallback(endpoint) {
    try {
      const data = await this.get(endpoint);
      localStorage.setItem(`fallback:${endpoint}`, JSON.stringify(data));
      return data;
    } catch (error) {
      const cached = localStorage.getItem(`fallback:${endpoint}`);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }
}
```

## Optimistic Updates

Update UI immediately before the server responds:

```javascript
class TodoList extends HTMLElement {
  async addTodo(text) {
    const optimisticTodo = {
      id: `temp-${Date.now()}`,
      text,
      completed: false,
      pending: true
    };

    // Add to UI immediately
    this.todos.push(optimisticTodo);
    this.render();

    try {
      // Send to server
      const savedTodo = await api.post('/todos', { text });

      // Replace optimistic todo with server response
      const index = this.todos.findIndex(t => t.id === optimisticTodo.id);
      this.todos[index] = savedTodo;
      this.render();

    } catch (error) {
      // Revert on failure
      this.todos = this.todos.filter(t => t.id !== optimisticTodo.id);
      this.render();

      pan.publish('notification.error', {
        message: 'Failed to add todo'
      });
    }
  }
}
```

## Infinite Scroll / Pagination

Load more data as the user scrolls:

```javascript
class InfiniteList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.page = 1;
    this.loading = false;
    this.hasMore = true;
  }

  connectedCallback() {
    this.render();
    this.loadMore();

    // Intersection Observer for infinite scroll
    const sentinel = this.querySelector('.sentinel');
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !this.loading && this.hasMore) {
        this.loadMore();
      }
    });
    observer.observe(sentinel);
  }

  async loadMore() {
    if (this.loading || !this.hasMore) return;

    this.loading = true;
    this.render();

    try {
      const data = await api.get(`/items?page=${this.page}&limit=20`);

      this.items.push(...data.items);
      this.hasMore = data.hasMore;
      this.page++;

    } catch (error) {
      console.error('Failed to load more items:', error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  render() {
    this.innerHTML = `
      <div class="items">
        ${this.items.map(item => `
          <div class="item">${item.title}</div>
        `).join('')}
      </div>

      ${this.loading ? '<div class="loading">Loading...</div>' : ''}
      ${this.hasMore ? '<div class="sentinel"></div>' : ''}
      ${!this.hasMore ? '<div class="end">No more items</div>' : ''}
    `;
  }
}
```

## Troubleshooting

### Problem: CORS Errors

**Symptom**: `Access to fetch at 'https://api.example.com' from origin 'http://localhost:3000' has been blocked by CORS policy`

**Solution**: Configure your server to send CORS headers:

```javascript
// Express.js example
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});
```

Or use a proxy in development:

```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': {
        target: 'https://api.example.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
};
```

### Problem: Requests Timing Out

**Symptom**: Fetch hangs indefinitely or takes too long

**Solution**: Add timeout to fetch requests:

```javascript
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
}
```

### Problem: Memory Leaks from Uncancelled Requests

**Symptom**: Component removed but requests still updating state

**Solution**: Cancel requests when component disconnects:

```javascript
class UserList extends HTMLElement {
  constructor() {
    super();
    this.abortController = new AbortController();
  }

  async connectedCallback() {
    try {
      const response = await fetch('/api/users', {
        signal: this.abortController.signal
      });
      const users = await response.json();
      this.render(users);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error(error);
      }
    }
  }

  disconnectedCallback() {
    this.abortController.abort();
  }
}
```

### Problem: Stale Data After Navigation

**Symptom**: Old data briefly appears before loading new data

**Solution**: Clear cache or reset state on navigation:

```javascript
pan.subscribe('navigation.changed', () => {
  // Clear API cache
  api.clearCache();

  // Or invalidate specific endpoints
  api.invalidate('/users');
});
```

## Best Practices

1. **Centralize API logic** - Use a single API client, not scattered fetch calls
2. **Handle loading states** - Always show feedback during async operations
3. **Implement caching** - Reduce server load and improve perceived performance
4. **Use optimistic updates** - Make UI feel instant for common operations
5. **Fail gracefully** - Provide fallbacks, don't just show error messages
6. **Cancel requests** - Clean up when components unmount
7. **Use the PAN bus** - Decouple components from API implementation details
8. **Implement retries** - Networks are unreliable, retry with backoff
9. **Monitor API health** - Use circuit breakers for failing services
10. **Test with mocks** - Don't depend on live APIs for tests

## Exercises

### Exercise 1: Weather Dashboard

Build a weather dashboard that:
- Fetches current weather for a city
- Displays 5-day forecast
- Caches results for 30 minutes
- Updates automatically when city changes
- Shows loading spinner during fetch
- Handles API errors gracefully

**Bonus**: Add geolocation to auto-detect user's city.

### Exercise 2: Infinite Scroll Blog

Create a blog list with infinite scroll that:
- Loads 10 posts initially
- Loads 10 more as user scrolls down
- Shows loading indicator at bottom
- Handles "no more posts" state
- Implements pull-to-refresh on mobile

**Bonus**: Add search that filters posts while maintaining infinite scroll.

### Exercise 3: Real-Time Chat

Build a simple chat application that:
- Uses WebSockets for real-time messages
- Shows typing indicators
- Displays online/offline status
- Reconnects automatically when connection drops
- Falls back to polling if WebSockets unavailable

**Bonus**: Add message read receipts and "User is typing..." indicators.

### Exercise 4: Optimistic Todo List

Create a todo list with optimistic updates:
- Add todos instantly (before server confirms)
- Revert if server rejects
- Show pending state with different styling
- Handle offline mode (queue operations)
- Sync when connection restored

**Bonus**: Use IndexedDB for offline storage and sync queue.

---

## Summary

Data fetching is the bridge between your frontend and the world. LARC embraces native browser APIs (fetch, WebSocket, EventSource) while providing patterns that make common tasks simple:

- **Use fetch** for HTTP requests, enhance with retries and timeouts
- **Build an API client** to centralize authentication and error handling
- **Integrate with PAN bus** to decouple components from API details
- **Implement caching** to improve performance and reduce server load
- **Handle errors gracefully** with circuit breakers and fallbacks
- **Use optimistic updates** to make UI feel instant
- **Choose the right tool**: REST for standard APIs, GraphQL for flexible queries, WebSockets for bidirectional real-time, SSE for server push

The web platform provides excellent data fetching capabilities. LARC helps you use them effectively.

---

## Further Reading

**For complete API integration reference:**
- *Building with LARC* Chapter 7: Data Fetching and APIs - All patterns and strategies
- *Building with LARC* Chapter 20: Integration Components - pan-data-connector, pan-websocket, pan-sse API reference
- *Building with LARC* Appendix E: Recipes and Patterns - API integration recipes
