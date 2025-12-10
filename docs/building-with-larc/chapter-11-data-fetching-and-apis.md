# Data Fetching and APIs

*In which we learn to retrieve data from distant servers without losing our minds (or our users' patience)*

Modern web applications are essentially elaborate interfaces for remote data. They fetch JSON from APIs, subscribe to WebSocket streams, poll for updates, and cache responses like digital squirrels preparing for winter. The challenge isn't just getting data—it's getting it reliably, efficiently, and without making users stare at loading spinners longer than they stare at the actual content.

In this chapter, we'll explore LARC's approach to data fetching, from basic REST API calls to sophisticated real-time communication. We'll cover error handling strategies that acknowledge the chaos of distributed systems, caching patterns that balance freshness with performance, and retry logic that persists without becoming annoying. By the end, you'll be equipped to build applications that fetch data like they know what they're doing, even when the network doesn't.

## The Foundation: Fetch API

JavaScript's Fetch API is the modern standard for making HTTP requests. It's promise-based, supports streaming, and doesn't require external libraries. Let's start with the basics and build up to production-ready patterns.

### Basic GET Request

```javascript
class ProductList extends LarcComponent {
  constructor() {
    super();
    this.products = [];
    this.loading = true;
    this.error = null;
  }

  async onMount() {
    await this.loadProducts();
  }

  async loadProducts() {
    this.loading = true;
    this.error = null;
    this.render();

    try {
      const response = await fetch('/api/products');

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.products = await response.json();
    } catch (error) {
      this.error = error.message;
      console.error('Failed to load products:', error);
    } finally {
      this.loading = false;
      this.render();
    }
  }

  template() {
    if (this.loading) {
      return '<div class="loading">Loading products...</div>';
    }

    if (this.error) {
      return `
        <div class="error">
          <p>Failed to load products: ${this.error}</p>
          <button onclick="this.loadProducts()">Retry</button>
        </div>
      `;
    }

    return `
      <div class="product-list">
        ${this.products.map(product => `
          <div class="product-card">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <span class="price">$${product.price}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
}
```

### POST Request with JSON

```javascript
class ProductForm extends LarcComponent {
  async submitProduct(formData) {
    const product = {
      name: formData.get('name'),
      description: formData.get('description'),
      price: parseFloat(formData.get('price')),
      category: formData.get('category')
    };

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(product)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create product');
      }

      const created = await response.json();
      navigate(`/products/${created.id}`);
    } catch (error) {
      this.showError(error.message);
    }
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }
}
```

### Request Configuration

For consistent API communication, create a configured fetch wrapper:

```javascript
class APIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.defaultHeaders = options.headers || {};
    this.timeout = options.timeout || 30000;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultHeaders,
        ...options.headers
      }
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), this.timeout);
    });

    // Race between fetch and timeout
    try {
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise
      ]);

      if (!response.ok) {
        await this.handleHTTPError(response);
      }

      return await response.json();
    } catch (error) {
      throw this.enhanceError(error);
    }
  }

  async handleHTTPError(response) {
    let message = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const body = await response.json();
      if (body.message) {
        message = body.message;
      }
    } catch {
      // Response body wasn't JSON
    }

    const error = new Error(message);
    error.status = response.status;
    error.response = response;
    throw error;
  }

  enhanceError(error) {
    if (error.name === 'AbortError') {
      error.message = 'Request was cancelled';
    } else if (!navigator.onLine) {
      error.message = 'No internet connection';
      error.offline = true;
    }
    return error;
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }

  // Convenience methods
  get(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  patch(endpoint, data, options) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint, options) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

// Create global API client instance
const api = new APIClient('/api', {
  timeout: 10000,
  headers: {
    'X-App-Version': '1.0.0'
  }
});
```

Now use the API client throughout your application:

```javascript
class ProductDetail extends LarcComponent {
  async onRoute(params) {
    try {
      this.product = await api.get(`/products/${params.id}`);
      this.render();
    } catch (error) {
      if (error.status === 404) {
        navigate('/not-found');
      } else {
        this.showError(error.message);
      }
    }
  }

  async handleDelete() {
    if (!confirm('Delete this product?')) {
      return;
    }

    try {
      await api.delete(`/products/${this.product.id}`);
      navigate('/products');
    } catch (error) {
      this.showError('Failed to delete product');
    }
  }
}
```

## Error Handling and Retries

Networks are unreliable, servers crash, and APIs return errors. Good error handling is what separates professional applications from abandoned side projects.

### Retry Logic

Implement exponential backoff for transient failures:

```javascript
class RetryableAPIClient extends APIClient {
  async requestWithRetry(endpoint, options = {}, retries = 3) {
    let lastError;
    let delay = 1000; // Start with 1 second

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await this.request(endpoint, options);
      } catch (error) {
        lastError = error;

        // Don't retry client errors (4xx) except 429 (rate limit)
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }

        // Don't retry if we're out of attempts
        if (attempt === retries) {
          break;
        }

        // Wait before retrying (exponential backoff with jitter)
        const jitter = Math.random() * 1000;
        await this.sleep(delay + jitter);
        delay *= 2; // Double the delay each time
      }
    }

    throw lastError;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Override convenience methods to use retry logic
  get(endpoint, options) {
    return this.requestWithRetry(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, data, options) {
    return this.requestWithRetry(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

const api = new RetryableAPIClient('/api');
```

### Circuit Breaker Pattern

Prevent cascading failures by temporarily disabling requests to failing services:

```javascript
class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.timeout = timeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      // Try to recover
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
    this.failures = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
    }
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
    }
  }

  getState() {
    return this.state;
  }
}

// Use with API client
class ResilientAPIClient extends APIClient {
  constructor(baseURL, options = {}) {
    super(baseURL, options);
    this.circuitBreaker = new CircuitBreaker();
  }

  async request(endpoint, options = {}) {
    return this.circuitBreaker.execute(async () => {
      return await super.request(endpoint, options);
    });
  }
}
```

## Caching Strategies

Caching reduces server load, speeds up your application, and works when the network doesn't. But cache invalidation is one of computer science's hardest problems, so tread carefully.

### In-Memory Cache

```javascript
class CacheManager {
  constructor(defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.cache = new Map();
    this.defaultTTL = defaultTTL;
  }

  set(key, value, ttl = this.defaultTTL) {
    this.cache.set(key, {
      value,
      expires: Date.now() + ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  invalidate(key) {
    this.cache.delete(key);
  }

  invalidatePattern(pattern) {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear() {
    this.cache.clear();
  }
}

class CachedAPIClient extends APIClient {
  constructor(baseURL, options = {}) {
    super(baseURL, options);
    this.cache = new CacheManager();
  }

  async get(endpoint, options = {}) {
    const cacheKey = this.getCacheKey('GET', endpoint);
    const cached = this.cache.get(cacheKey);

    if (cached && !options.bypassCache) {
      return cached;
    }

    const data = await super.get(endpoint, options);
    this.cache.set(cacheKey, data, options.cacheTTL);
    return data;
  }

  getCacheKey(method, endpoint) {
    return `${method}:${endpoint}`;
  }

  invalidateCache(endpoint) {
    this.cache.invalidatePattern(endpoint);
  }
}

const api = new CachedAPIClient('/api');

// Usage
class ProductList extends LarcComponent {
  async loadProducts() {
    // This will use cache if available
    this.products = await api.get('/products');
    this.render();
  }

  async refreshProducts() {
    // Bypass cache and get fresh data
    this.products = await api.get('/products', { bypassCache: true });
    this.render();
  }
}
```

### LocalStorage Cache

For persistence across sessions:

```javascript
class PersistentCache extends CacheManager {
  constructor(prefix = 'cache:', defaultTTL = 5 * 60 * 1000) {
    super(defaultTTL);
    this.prefix = prefix;
    this.loadFromStorage();
  }

  loadFromStorage() {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith(this.prefix)) {
          const data = JSON.parse(localStorage.getItem(key));
          const originalKey = key.substring(this.prefix.length);
          this.cache.set(originalKey, data);
        }
      }
    } catch (error) {
      console.error('Failed to load cache from storage:', error);
    }
  }

  set(key, value, ttl = this.defaultTTL) {
    super.set(key, value, ttl);

    try {
      localStorage.setItem(
        this.prefix + key,
        JSON.stringify({ value, expires: Date.now() + ttl })
      );
    } catch (error) {
      console.error('Failed to persist cache:', error);
    }
  }

  invalidate(key) {
    super.invalidate(key);
    localStorage.removeItem(this.prefix + key);
  }

  clear() {
    super.clear();
    const keysToRemove = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  }
}
```

### Stale-While-Revalidate

Serve cached data immediately while fetching fresh data in the background:

```javascript
class SWRAPIClient extends APIClient {
  constructor(baseURL, options = {}) {
    super(baseURL, options);
    this.cache = new CacheManager();
  }

  async get(endpoint, options = {}) {
    const cacheKey = `GET:${endpoint}`;
    const cached = this.cache.get(cacheKey);

    // Return cached data immediately if available
    if (cached && !options.bypassCache) {
      // Fetch fresh data in background
      this.revalidate(endpoint, cacheKey, options);
      return cached;
    }

    // No cache, fetch fresh data
    const data = await super.get(endpoint, options);
    this.cache.set(cacheKey, data);
    return data;
  }

  async revalidate(endpoint, cacheKey, options) {
    try {
      const fresh = await super.get(endpoint, options);
      this.cache.set(cacheKey, fresh);

      // Notify subscribers of new data
      this.notifySubscribers(cacheKey, fresh);
    } catch (error) {
      console.error('Revalidation failed:', error);
    }
  }

  notifySubscribers(key, data) {
    const event = new CustomEvent('cache-update', {
      detail: { key, data }
    });
    window.dispatchEvent(event);
  }
}
```

## GraphQL Integration

GraphQL provides a more flexible alternative to REST, allowing clients to request exactly the data they need.

### GraphQL Client

```javascript
class GraphQLClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
  }

  async query(query, variables = {}) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({ query, variables })
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(result.errors.map(e => e.message).join(', '));
    }

    return result.data;
  }

  async mutate(mutation, variables = {}) {
    return this.query(mutation, variables);
  }

  getAuthToken() {
    return localStorage.getItem('auth_token');
  }
}

const graphql = new GraphQLClient('/graphql');
```

### Using GraphQL Queries

```javascript
class ProductList extends LarcComponent {
  async loadProducts() {
    const query = `
      query GetProducts($category: String, $limit: Int) {
        products(category: $category, limit: $limit) {
          id
          name
          description
          price
          category
          imageUrl
          inStock
        }
      }
    `;

    try {
      const data = await graphql.query(query, {
        category: this.selectedCategory,
        limit: 20
      });

      this.products = data.products;
      this.render();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async createProduct(product) {
    const mutation = `
      mutation CreateProduct($input: ProductInput!) {
        createProduct(input: $input) {
          id
          name
          price
        }
      }
    `;

    try {
      const data = await graphql.mutate(mutation, {
        input: product
      });

      navigate(`/products/${data.createProduct.id}`);
    } catch (error) {
      this.showError(error.message);
    }
  }
}
```

## WebSocket Communication

WebSockets enable real-time bidirectional communication, perfect for chat applications, live updates, and collaborative features.

### WebSocket Client

```javascript
class WebSocketClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.listeners = new Map();
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = 30000;
    this.reconnectAttempts = 0;
  }

  connect() {
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.emit('error', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      this.emit('disconnected');
      this.attemptReconnect();
    };
  }

  attemptReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay}ms...`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  handleMessage(message) {
    const { type, data } = message;
    this.emit(type, data);
  }

  send(type, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.error('WebSocket not connected');
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const filtered = callbacks.filter(cb => cb !== callback);
      this.listeners.set(event, filtered);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

// Create global WebSocket client
const ws = new WebSocketClient('wss://api.example.com/ws');
ws.connect();
```

### Real-Time Chat Component

```javascript
class ChatRoom extends LarcComponent {
  constructor() {
    super();
    this.messages = [];
    this.connected = false;

    this.handleMessage = this.handleMessage.bind(this);
    this.handleConnected = this.handleConnected.bind(this);
    this.handleDisconnected = this.handleDisconnected.bind(this);
  }

  onMount() {
    ws.on('message', this.handleMessage);
    ws.on('connected', this.handleConnected);
    ws.on('disconnected', this.handleDisconnected);

    // Request message history
    ws.send('get_history', { room: this.roomId });
  }

  onUnmount() {
    ws.off('message', this.handleMessage);
    ws.off('connected', this.handleConnected);
    ws.off('disconnected', this.handleDisconnected);
  }

  handleMessage(message) {
    this.messages.push(message);
    this.render();
    this.scrollToBottom();
  }

  handleConnected() {
    this.connected = true;
    this.render();
  }

  handleDisconnected() {
    this.connected = false;
    this.render();
  }

  sendMessage(event) {
    event.preventDefault();

    const input = this.querySelector('input[name="message"]');
    const message = input.value.trim();

    if (!message) {
      return;
    }

    ws.send('message', {
      room: this.roomId,
      text: message,
      timestamp: Date.now()
    });

    input.value = '';
  }

  scrollToBottom() {
    const container = this.querySelector('.messages');
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  template() {
    return `
      <div class="chat-room">
        <div class="status ${this.connected ? 'connected' : 'disconnected'}">
          ${this.connected ? 'Connected' : 'Disconnected'}
        </div>

        <div class="messages">
          ${this.messages.map(msg => `
            <div class="message">
              <span class="author">${msg.author}:</span>
              <span class="text">${msg.text}</span>
              <span class="time">${this.formatTime(msg.timestamp)}</span>
            </div>
          `).join('')}
        </div>

        <form onsubmit="this.sendMessage(event)">
          <input
            type="text"
            name="message"
            placeholder="Type a message..."
            ?disabled="${!this.connected}">
          <button type="submit" ?disabled="${!this.connected}">
            Send
          </button>
        </form>
      </div>
    `;
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString();
  }
}
```

## Server-Sent Events (SSE)

SSE provides one-way real-time communication from server to client—simpler than WebSockets but perfect for live updates, notifications, and progress tracking.

### SSE Client

```javascript
class SSEClient {
  constructor(url) {
    this.url = url;
    this.eventSource = null;
    this.listeners = new Map();
  }

  connect() {
    this.eventSource = new EventSource(this.url);

    this.eventSource.onopen = () => {
      console.log('SSE connected');
      this.emit('connected');
    };

    this.eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      this.emit('error', error);

      if (this.eventSource.readyState === EventSource.CLOSED) {
        this.emit('disconnected');
      }
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit('message', data);
      } catch (error) {
        console.error('Failed to parse SSE data:', error);
      }
    };
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Subscribe to custom event types
    if (event !== 'connected' && event !== 'error' && event !== 'disconnected' && event !== 'message') {
      this.eventSource?.addEventListener(event, (e) => {
        try {
          const data = JSON.parse(e.data);
          callback(data);
        } catch (error) {
          callback(e.data);
        }
      });
    }
  }

  off(event, callback) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const filtered = callbacks.filter(cb => cb !== callback);
      this.listeners.set(event, filtered);
    }
  }

  emit(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}
```

### Live Notifications

```javascript
class NotificationCenter extends LarcComponent {
  constructor() {
    super();
    this.notifications = [];
    this.sse = new SSEClient('/api/notifications/stream');

    this.handleNotification = this.handleNotification.bind(this);
  }

  onMount() {
    this.sse.on('notification', this.handleNotification);
    this.sse.connect();
  }

  onUnmount() {
    this.sse.off('notification', this.handleNotification);
    this.sse.disconnect();
  }

  handleNotification(notification) {
    this.notifications.unshift(notification);

    // Keep only last 50 notifications
    if (this.notifications.length > 50) {
      this.notifications = this.notifications.slice(0, 50);
    }

    this.render();
    this.showToast(notification);
  }

  showToast(notification) {
    // Show temporary toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = notification.message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  dismissNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.render();

    // Mark as read on server
    api.post(`/notifications/${id}/read`);
  }

  template() {
    return `
      <div class="notification-center">
        <h2>Notifications</h2>

        ${this.notifications.length === 0 ? `
          <p class="empty">No notifications</p>
        ` : `
          <ul class="notification-list">
            ${this.notifications.map(notif => `
              <li class="notification ${notif.read ? 'read' : 'unread'}">
                <div class="content">
                  <strong>${notif.title}</strong>
                  <p>${notif.message}</p>
                  <time>${this.formatTime(notif.timestamp)}</time>
                </div>
                <button onclick="this.dismissNotification('${notif.id}')">
                  Dismiss
                </button>
              </li>
            `).join('')}
          </ul>
        `}
      </div>
    `;
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = Date.now();
    const diff = now - date;

    if (diff < 60000) {
      return 'Just now';
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  }
}
```

## Request Cancellation

Long-running requests should be cancellable to avoid wasting resources and confusing users.

### AbortController

```javascript
class SearchComponent extends LarcComponent {
  constructor() {
    super();
    this.query = '';
    this.results = [];
    this.searching = false;
    this.abortController = null;
  }

  async handleSearch(event) {
    this.query = event.target.value;

    // Cancel previous search
    if (this.abortController) {
      this.abortController.abort();
    }

    if (!this.query) {
      this.results = [];
      this.render();
      return;
    }

    this.searching = true;
    this.render();

    // Create new abort controller
    this.abortController = new AbortController();

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(this.query)}`,
        { signal: this.abortController.signal }
      );

      this.results = await response.json();
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Search cancelled');
        return;
      }
      console.error('Search failed:', error);
    } finally {
      this.searching = false;
      this.abortController = null;
      this.render();
    }
  }

  template() {
    return `
      <div class="search">
        <input
          type="search"
          placeholder="Search..."
          value="${this.query}"
          oninput="this.handleSearch(event)">

        ${this.searching ? '<div class="spinner"></div>' : ''}

        <ul class="results">
          ${this.results.map(result => `
            <li>${result.title}</li>
          `).join('')}
        </ul>
      </div>
    `;
  }
}
```

## Putting It All Together

Let's create a complete data layer that combines all these concepts:

```javascript
// data-layer.js
class DataLayer {
  constructor() {
    this.api = new RetryableAPIClient('/api');
    this.cache = new PersistentCache();
    this.ws = null;
    this.sse = null;
  }

  // REST API methods
  async getProducts(options = {}) {
    return this.api.get('/products', options);
  }

  async getProduct(id) {
    return this.api.get(`/products/${id}`);
  }

  async createProduct(data) {
    const product = await this.api.post('/products', data);
    this.cache.invalidatePattern('/products');
    return product;
  }

  async updateProduct(id, data) {
    const product = await this.api.put(`/products/${id}`, data);
    this.cache.invalidate(`/products/${id}`);
    this.cache.invalidatePattern('/products');
    return product;
  }

  async deleteProduct(id) {
    await this.api.delete(`/products/${id}`);
    this.cache.invalidate(`/products/${id}`);
    this.cache.invalidatePattern('/products');
  }

  // WebSocket methods
  connectWebSocket(url) {
    this.ws = new WebSocketClient(url);
    this.ws.connect();
    return this.ws;
  }

  // SSE methods
  subscribeToNotifications(callback) {
    if (!this.sse) {
      this.sse = new SSEClient('/api/notifications/stream');
      this.sse.connect();
    }
    this.sse.on('notification', callback);
  }

  unsubscribeFromNotifications(callback) {
    if (this.sse) {
      this.sse.off('notification', callback);
    }
  }

  // Cleanup
  destroy() {
    this.ws?.disconnect();
    this.sse?.disconnect();
    this.cache.clear();
  }
}

// Export singleton instance
export const dataLayer = new DataLayer();
```

Data fetching is the nervous system of your application—it connects your UI to the outside world and keeps everything in sync. With proper error handling, intelligent caching, and real-time communication, you can build applications that feel fast, reliable, and responsive, even when the network isn't cooperating. The patterns in this chapter will help you navigate the chaos of distributed systems and emerge with applications that users can actually depend on.

And with that, we've covered the essential patterns for building robust, maintainable applications with LARC. From routing to forms to data fetching, you now have the tools to create web applications that don't just work—they work well.
