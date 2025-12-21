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
