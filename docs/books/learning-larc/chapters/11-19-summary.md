# Chapter 11: Data Fetching and APIs

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

---

# Chapter 12: Authentication and Security

Authentication is the bouncer at your application's door. Get it wrong, and either legitimate users can't get in, or everyone can. Security isn't a feature you add later—it's a mindset that shapes every decision from the start.

## Understanding Authentication vs Authorization

These terms often get conflated, but they're distinct:

**Authentication** answers: "Who are you?" It's verifying identity—matching a username and password, validating a token, confirming you are who you claim to be.

**Authorization** answers: "What can you do?" Once we know who you are, authorization determines your permissions—can you view this page, edit this record, delete this user?

LARC applications typically handle authentication with JWT tokens and authorization with role-based or permission-based access control.

## JWT Token Management

JSON Web Tokens (JWTs) are the standard for stateless authentication. A JWT contains encoded claims about the user, signed by the server:

```javascript
// auth-service.js
class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshKey = 'refresh_token';
  }

  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { accessToken, refreshToken, user } = await response.json();

    this.setTokens(accessToken, refreshToken);
    pan.publish('auth.login', { user }, { retained: true });

    return user;
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshKey, refreshToken);
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  decodeToken(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  async refresh() {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const { accessToken } = await response.json();
    localStorage.setItem(this.tokenKey, accessToken);
    return accessToken;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    pan.publish('auth.logout', {}, { retained: true });
  }

  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  }
}

export const auth = new AuthService();
```

## Automatic Token Refresh

Tokens expire. Good applications refresh them transparently:

```javascript
// api-client.js with token refresh
class AuthenticatedApiClient {
  async fetch(endpoint, options = {}) {
    // First attempt
    try {
      return await this.doFetch(endpoint, options);
    } catch (error) {
      // If 401, try refreshing token
      if (error.status === 401) {
        try {
          await auth.refresh();
          // Retry with new token
          return await this.doFetch(endpoint, options);
        } catch (refreshError) {
          // Refresh failed, user must log in again
          auth.logout();
          throw error;
        }
      }
      throw error;
    }
  }

  async doFetch(endpoint, options) {
    const token = auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, { ...options, headers });

    if (!response.ok) {
      throw { status: response.status, message: await response.text() };
    }

    return response.json();
  }
}
```

## Protected Routes

Some pages should only be accessible to authenticated users. Here's a route guard pattern:

```javascript
// route-guard.js
class RouteGuard extends HTMLElement {
  connectedCallback() {
    this.checkAuth();
    pan.subscribe('auth.logout', () => this.checkAuth());
  }

  checkAuth() {
    if (!auth.isAuthenticated()) {
      // Store intended destination
      sessionStorage.setItem('returnUrl', window.location.pathname);
      // Redirect to login
      pan.publish('router.navigate', { path: '/login' });
    }
  }
}

customElements.define('route-guard', RouteGuard);
```

Use it to wrap protected content:

```html
<route-guard>
  <dashboard-page></dashboard-page>
</route-guard>
```

## Role-Based Access Control

Different users have different permissions. A simple RBAC implementation:

```javascript
// rbac.js
class RBAC {
  constructor() {
    this.permissions = {
      admin: ['read', 'write', 'delete', 'manage-users'],
      editor: ['read', 'write'],
      viewer: ['read']
    };
  }

  can(user, action) {
    if (!user?.role) return false;
    const allowed = this.permissions[user.role] || [];
    return allowed.includes(action);
  }
}

export const rbac = new RBAC();
```

Use it in components:

```javascript
class AdminPanel extends HTMLElement {
  connectedCallback() {
    const user = auth.getCurrentUser();

    if (!rbac.can(user, 'manage-users')) {
      this.innerHTML = '<p>Access denied</p>';
      return;
    }

    this.render();
  }
}
```

## Security Best Practices

### Sanitize User Input

Never trust user input. Always sanitize before rendering:

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safe rendering
this.innerHTML = `<p>${escapeHtml(userInput)}</p>`;
```

### Use HTTPS

Always serve your application over HTTPS. This protects tokens in transit and enables secure cookies.

### Secure Token Storage

LocalStorage is convenient but accessible to JavaScript. For high-security applications, consider httpOnly cookies:

```javascript
// Server sets cookie
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### Content Security Policy

Set CSP headers to prevent XSS attacks:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

---

# Chapter 13: Server Integration

LARC is frontend-agnostic about backends. Whether you're using Node.js, Python, PHP, or any other server technology, the patterns remain the same: your components communicate via HTTP and WebSockets, and the PAN bus coordinates the frontend.

## Node.js with Express

Express is the most popular Node.js framework, and it pairs naturally with LARC:

```javascript
// server.js
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Authentication middleware
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Public routes
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await db.users.findByEmail(email);
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  res.json({ accessToken, user: { id: user.id, email: user.email } });
});

// Protected routes
app.get('/api/users', authenticate, async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

app.post('/api/users', authenticate, async (req, res) => {
  const user = await db.users.create(req.body);
  res.status(201).json(user);
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Python with Flask

Flask provides a lightweight Python backend:

```python
# app.py
from flask import Flask, jsonify, request
from flask_cors import CORS
from functools import wraps
import jwt

app = Flask(__name__, static_folder='public')
CORS(app)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'No token provided'}), 401

        token = auth_header[7:]
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            request.user = data
        except:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/api/users')
@token_required
def get_users():
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])

@app.route('/api/users', methods=['POST'])
@token_required
def create_user():
    data = request.get_json()
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201

if __name__ == '__main__':
    app.run(debug=True)
```

## PHP Integration

PHP remains popular for web backends:

```php
<?php
// api.php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

require_once 'vendor/autoload.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

function authenticate() {
    $headers = getallheaders();
    $auth = $headers['Authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.*)$/i', $auth, $matches)) {
        http_response_code(401);
        echo json_encode(['error' => 'No token provided']);
        exit;
    }

    try {
        return JWT::decode($matches[1], new Key($_ENV['JWT_SECRET'], 'HS256'));
    } catch (Exception $e) {
        http_response_code(401);
        echo json_encode(['error' => 'Invalid token']);
        exit;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($path === '/api/users' && $method === 'GET') {
    $user = authenticate();
    $users = $pdo->query('SELECT id, name, email FROM users')->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($users);
}
```

## Real-Time with WebSockets

For real-time features, add WebSocket support. Here's Node.js with the `ws` library:

```javascript
// websocket-server.js
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

const wss = new WebSocket.Server({ port: 8080 });

const clients = new Map();

wss.on('connection', (ws, req) => {
  // Authenticate connection
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    clients.set(ws, user);
  } catch {
    ws.close(4001, 'Unauthorized');
    return;
  }

  ws.on('message', (data) => {
    const message = JSON.parse(data);
    handleMessage(ws, message);
  });

  ws.on('close', () => {
    clients.delete(ws);
  });
});

function handleMessage(sender, message) {
  switch (message.type) {
    case 'broadcast':
      // Send to all connected clients
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
      break;

    case 'direct':
      // Send to specific user
      clients.forEach((user, client) => {
        if (user.id === message.targetUserId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
      break;
  }
}
```

## Database Patterns

Most backends need a database. Here's a clean repository pattern:

```javascript
// user-repository.js
class UserRepository {
  constructor(db) {
    this.db = db;
  }

  async findAll() {
    return this.db.query('SELECT id, name, email FROM users');
  }

  async findById(id) {
    const [user] = await this.db.query(
      'SELECT id, name, email FROM users WHERE id = ?',
      [id]
    );
    return user;
  }

  async create(data) {
    const result = await this.db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [data.name, data.email, data.hashedPassword]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    await this.db.query(
      'UPDATE users SET name = ?, email = ? WHERE id = ?',
      [data.name, data.email, id]
    );
    return this.findById(id);
  }

  async delete(id) {
    await this.db.query('DELETE FROM users WHERE id = ?', [id]);
  }
}
```

---

# Chapter 14: Testing

Testing isn't optional. It's how you know your code works, how you prevent regressions, and how you confidently refactor. LARC applications benefit from the same testing strategies as any JavaScript application, with some patterns specific to Web Components.

## Unit Testing Components

The `@open-wc/testing` library provides excellent utilities for testing Web Components:

```javascript
// user-card.test.js
import { expect, fixture, html } from '@open-wc/testing';
import '../components/user-card.js';

describe('UserCard', () => {
  it('renders user name and email', async () => {
    const el = await fixture(html`
      <user-card></user-card>
    `);

    el.user = { name: 'Alice', email: 'alice@example.com' };
    await el.updateComplete;

    const name = el.shadowRoot.querySelector('.name');
    const email = el.shadowRoot.querySelector('.email');

    expect(name.textContent).to.equal('Alice');
    expect(email.textContent).to.equal('alice@example.com');
  });

  it('dispatches follow event when button clicked', async () => {
    const el = await fixture(html`<user-card></user-card>`);
    el.user = { id: 1, name: 'Alice' };

    let eventDetail = null;
    el.addEventListener('follow', (e) => {
      eventDetail = e.detail;
    });

    el.shadowRoot.querySelector('.follow-btn').click();

    expect(eventDetail).to.deep.equal({ userId: 1 });
  });

  it('shows loading state initially', async () => {
    const el = await fixture(html`<user-card loading></user-card>`);

    const spinner = el.shadowRoot.querySelector('.spinner');
    expect(spinner).to.exist;
  });
});
```

## Testing PAN Bus Integration

Mock the PAN bus to test component communication:

```javascript
// pan-mock.js
class MockPanBus {
  constructor() {
    this.messages = [];
    this.subscriptions = new Map();
  }

  publish(topic, data) {
    this.messages.push({ topic, data });
    const handlers = this.subscriptions.get(topic) || [];
    handlers.forEach(handler => handler(data));
  }

  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push(handler);
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic, handler) {
    const handlers = this.subscriptions.get(topic) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  clear() {
    this.messages = [];
    this.subscriptions.clear();
  }
}

export const mockPan = new MockPanBus();
```

Use it in tests:

```javascript
import { mockPan } from './pan-mock.js';

describe('NotificationList', () => {
  beforeEach(() => mockPan.clear());

  it('displays notifications from PAN bus', async () => {
    const el = await fixture(html`<notification-list></notification-list>`);

    mockPan.publish('notification.new', {
      id: 1,
      message: 'Hello world'
    });

    await el.updateComplete;

    const notifications = el.shadowRoot.querySelectorAll('.notification');
    expect(notifications.length).to.equal(1);
    expect(notifications[0].textContent).to.include('Hello world');
  });
});
```

## Integration Testing

Test components working together:

```javascript
describe('Shopping Cart Integration', () => {
  it('updates cart when product added', async () => {
    const cart = await fixture(html`<shopping-cart></shopping-cart>`);
    const product = await fixture(html`
      <product-card .product=${{ id: 1, name: 'Widget', price: 10 }}>
      </product-card>
    `);

    // Simulate add to cart
    product.shadowRoot.querySelector('.add-btn').click();

    await cart.updateComplete;

    expect(cart.items.length).to.equal(1);
    expect(cart.total).to.equal(10);
  });
});
```

## End-to-End Testing with Playwright

For full user flow testing, Playwright provides excellent browser automation:

```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toHaveText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});
```

## Mocking Fetch Requests

Control network responses in tests:

```javascript
// fetch-mock.js
class FetchMock {
  constructor() {
    this.mocks = new Map();
    this.originalFetch = window.fetch;
  }

  mock(url, response, options = {}) {
    this.mocks.set(url, { response, options });
  }

  enable() {
    window.fetch = async (url, config) => {
      const mock = this.mocks.get(url);
      if (mock) {
        if (mock.options.delay) {
          await new Promise(r => setTimeout(r, mock.options.delay));
        }
        return new Response(JSON.stringify(mock.response), {
          status: mock.options.status || 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return this.originalFetch(url, config);
    };
  }

  disable() {
    window.fetch = this.originalFetch;
    this.mocks.clear();
  }
}

export const fetchMock = new FetchMock();
```

---

# Chapter 15: Performance and Optimization

Performance is a feature. Slow applications frustrate users and hurt business metrics. LARC's no-build philosophy gives you a head start—no framework overhead, no transpilation artifacts—but there's more you can do.

## Lazy Loading Components

Don't load everything upfront. Load components when needed:

```javascript
// Lazy load on route change
pan.subscribe('router.navigate', async ({ path }) => {
  if (path === '/admin') {
    await import('./components/admin-panel.js');
  }
});

// Lazy load on user interaction
document.querySelector('.show-chart').addEventListener('click', async () => {
  const { ChartComponent } = await import('./components/chart.js');
  // Use component
}, { once: true });

// Lazy load when visible
const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const component = entry.target.dataset.component;
      await import(`./components/${component}.js`);
      observer.unobserve(entry.target);
    }
  }
});

document.querySelectorAll('[data-lazy]').forEach(el => observer.observe(el));
```

## Image Optimization

Images are often the largest assets. Optimize them:

```javascript
class LazyImage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <img
        loading="lazy"
        src="${this.getAttribute('placeholder') || 'placeholder.svg'}"
        data-src="${this.getAttribute('src')}"
        alt="${this.getAttribute('alt') || ''}"
      >
    `;

    const img = this.querySelector('img');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  }
}

customElements.define('lazy-image', LazyImage);
```

Use responsive images with srcset:

```html
<img
  srcset="image-400.jpg 400w,
          image-800.jpg 800w,
          image-1200.jpg 1200w"
  sizes="(max-width: 400px) 400px,
         (max-width: 800px) 800px,
         1200px"
  src="image-800.jpg"
  alt="Responsive image"
  loading="lazy"
>
```

## Service Worker Caching

Service workers enable offline functionality and faster loads:

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/components/header.js',
  '/components/footer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Cache first, network fallback
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
```

Register it in your app:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Measuring Performance

You can't optimize what you don't measure. Use the Performance API:

```javascript
// Measure component render time
performance.mark('render-start');
this.render();
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');

const measure = performance.getEntriesByName('render')[0];
console.log(`Render took ${measure.duration}ms`);
```

Track Web Vitals:

```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getLCP(console.log);  // Largest Contentful Paint
```

## Virtual Lists for Large Data

Rendering thousands of items kills performance. Virtualize:

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 40;
    this.visibleCount = 20;
    this.scrollTop = 0;
  }

  set data(items) {
    this.items = items;
    this.render();
  }

  connectedCallback() {
    this.style.cssText = `
      display: block;
      height: 400px;
      overflow-y: auto;
    `;

    this.addEventListener('scroll', () => {
      this.scrollTop = this.scrollTop;
      this.render();
    });

    this.render();
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const visibleItems = this.items.slice(startIndex, startIndex + this.visibleCount);

    this.innerHTML = `
      <div style="height: ${this.items.length * this.itemHeight}px; position: relative;">
        ${visibleItems.map((item, i) => `
          <div style="
            position: absolute;
            top: ${(startIndex + i) * this.itemHeight}px;
            height: ${this.itemHeight}px;
            width: 100%;
          ">
            ${item.name}
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('virtual-list', VirtualList);
```

---

# Chapter 16: Deployment

Deploying LARC applications is refreshingly simple. No build artifacts to manage, no complex CI/CD pipelines required. Just static files that any web server can handle.

## Static Hosting Options

LARC apps are static files. Host them anywhere:

### GitHub Pages

Free hosting for public repositories:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### Netlify

Drag and drop deployment or connect to Git:

```toml
# netlify.toml
[build]
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

Zero-config deployment:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## CDN Configuration

Serve assets from a CDN for faster global delivery:

```html
<!-- Use CDN for LARC core -->
<script type="importmap">
{
  "imports": {
    "@aspect/pan-client": "https://cdn.jsdelivr.net/npm/@aspect/pan-client@latest/pan-client.mjs"
  }
}
</script>
```

Set proper cache headers:

```
# .htaccess for Apache
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML - no cache (or short cache)
  ExpiresByType text/html "access plus 0 seconds"

  # CSS and JS - long cache (use versioned filenames)
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"

  # Images - long cache
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Environment Variables

Manage configuration across environments:

```javascript
// config.js
const configs = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    debug: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false
  }
};

const env = window.location.hostname === 'localhost' ? 'development' : 'production';
export const config = configs[env];
```

Or use a build-time approach:

```html
<!-- Injected by server/build -->
<script>
  window.CONFIG = {
    apiUrl: '%%API_URL%%',
    version: '%%VERSION%%'
  };
</script>
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Test in all target browsers
- [ ] Verify all API endpoints use HTTPS
- [ ] Check for console errors
- [ ] Validate accessibility (keyboard navigation, screen readers)
- [ ] Test on slow network (Chrome DevTools throttling)
- [ ] Verify error handling works
- [ ] Check mobile responsiveness
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure analytics
- [ ] Enable HTTPS
- [ ] Set security headers

## Monitoring

Track errors in production:

```javascript
// error-tracking.js
window.addEventListener('error', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
});

window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
});
```

---

# Chapter 17: Component Library

As your application grows, you'll accumulate reusable components. A well-organized component library accelerates development and ensures consistency.

## Organizing Components

Structure your library logically:

```
components/
├── core/
│   ├── pan-button.js
│   ├── pan-input.js
│   └── pan-card.js
├── layout/
│   ├── pan-header.js
│   ├── pan-sidebar.js
│   └── pan-grid.js
├── data/
│   ├── pan-table.js
│   ├── pan-list.js
│   └── pan-pagination.js
└── index.js
```

Export from a single entry point:

```javascript
// components/index.js
export * from './core/pan-button.js';
export * from './core/pan-input.js';
export * from './core/pan-card.js';
export * from './layout/pan-header.js';
// ...
```

## Documentation

Document every component:

```javascript
/**
 * A customizable button component.
 *
 * @element pan-button
 *
 * @attr {string} variant - Button style: "primary", "secondary", "danger"
 * @attr {boolean} disabled - Disables the button
 * @attr {string} size - Button size: "small", "medium", "large"
 *
 * @fires click - Fired when button is clicked
 *
 * @slot - Button content
 *
 * @example
 * <pan-button variant="primary">Click me</pan-button>
 *
 * @example
 * <pan-button variant="danger" disabled>Delete</pan-button>
 */
class PanButton extends HTMLElement {
  // ...
}
```

Generate documentation automatically with tools like `web-component-analyzer`:

```bash
npx web-component-analyzer analyze components/**/*.js --outFile docs.json
```

## Design Tokens

Use CSS custom properties for theming:

```css
/* tokens.css */
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Borders */
  --border-radius: 4px;
  --border-width: 1px;
  --border-color: #dee2e6;
}
```

Components use these tokens:

```javascript
class PanButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }

        button {
          font-family: var(--font-family);
          font-size: var(--font-size-md);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          border: var(--border-width) solid transparent;
          cursor: pointer;
        }

        :host([variant="primary"]) button {
          background: var(--color-primary);
          color: white;
        }

        :host([variant="secondary"]) button {
          background: var(--color-secondary);
          color: white;
        }

        :host([disabled]) button {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}
```

## Versioning and Publishing

Use semantic versioning. Publish to npm or a private registry:

```json
{
  "name": "@myorg/components",
  "version": "1.2.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./button": "./core/pan-button.js",
    "./card": "./core/pan-card.js"
  }
}
```

```bash
npm publish --access public
```

---

# Chapter 18: Tooling

While LARC doesn't require a build step, the right tools make development faster and more enjoyable.

## Development Server

A simple development server with live reload:

```javascript
// dev-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3000;
const PUBLIC_DIR = './public';

// HTTP Server
const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  });
});

// WebSocket for live reload
const wss = new WebSocket.Server({ server });

fs.watch(PUBLIC_DIR, { recursive: true }, () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

server.listen(PORT, () => console.log(`Dev server at http://localhost:${PORT}`));
```

Add live reload to your HTML:

```html
<script>
  const ws = new WebSocket('ws://localhost:3000');
  ws.onmessage = () => location.reload();
</script>
```

## VS Code Configuration

Enhance your editor experience:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "files.associations": {
    "*.mjs": "javascript"
  }
}
```

Useful snippets:

```json
// .vscode/snippets/larc.code-snippets
{
  "LARC Component": {
    "prefix": "larc",
    "body": [
      "class ${1:ComponentName} extends HTMLElement {",
      "  constructor() {",
      "    super();",
      "    this.attachShadow({ mode: 'open' });",
      "  }",
      "",
      "  connectedCallback() {",
      "    this.render();",
      "  }",
      "",
      "  render() {",
      "    this.shadowRoot.innerHTML = `",
      "      <style>",
      "        :host { display: block; }",
      "      </style>",
      "      <div>$2</div>",
      "    `;",
      "  }",
      "}",
      "",
      "customElements.define('${3:component-name}', ${1:ComponentName});"
    ]
  }
}
```

## ESLint Configuration

Lint your code for consistency:

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
```

## Browser DevTools

Chrome DevTools has excellent Web Component support:

- **Elements panel**: Inspect shadow DOM by clicking the `#shadow-root` toggle
- **Console**: Access element's shadow root with `$0.shadowRoot`
- **Network panel**: Monitor fetch requests and WebSocket connections
- **Performance panel**: Profile render performance
- **Application panel**: Inspect localStorage, sessionStorage, IndexedDB

## Debugging PAN Bus

Add a debug utility:

```javascript
// pan-debug.js
pan.subscribe('*', (data, topic) => {
  console.log(`[PAN] ${topic}`, data);
});
```

Or use the LARC DevTools extension for a visual message inspector.

---

# Chapter 19: Real-World Applications

Theory only takes you so far. Let's examine how LARC principles apply to real applications.

## Case Study: E-Commerce Platform

An online store built with LARC demonstrates the architecture at scale.

### Architecture Overview

```
store/
├── index.html
├── components/
│   ├── product-card.js
│   ├── product-grid.js
│   ├── shopping-cart.js
│   ├── cart-item.js
│   ├── checkout-form.js
│   └── order-confirmation.js
├── services/
│   ├── cart-service.js
│   ├── product-service.js
│   └── order-service.js
└── styles/
    └── main.css
```

### Product Catalog

The product grid loads data and renders cards:

```javascript
// product-grid.js
class ProductGrid extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = '<p>Loading products...</p>';

    try {
      const products = await productService.getAll();
      this.render(products);
    } catch (error) {
      this.innerHTML = `<p class="error">Failed to load products</p>`;
    }
  }

  render(products) {
    this.innerHTML = `
      <div class="grid">
        ${products.map(p => `
          <product-card
            product-id="${p.id}"
            name="${p.name}"
            price="${p.price}"
            image="${p.image}">
          </product-card>
        `).join('')}
      </div>
    `;
  }
}
```

### Shopping Cart

The cart subscribes to add-to-cart events and persists state:

```javascript
// shopping-cart.js
class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
  }

  connectedCallback() {
    pan.subscribe('cart.add', ({ product }) => {
      this.addItem(product);
    });

    pan.subscribe('cart.remove', ({ productId }) => {
      this.removeItem(productId);
    });

    this.render();
  }

  addItem(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    this.render();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.render();
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
    pan.publish('cart.updated', { items: this.items, total: this.total });
  }

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  render() {
    this.innerHTML = `
      <h2>Cart (${this.items.length} items)</h2>
      ${this.items.map(item => `
        <cart-item
          product-id="${item.id}"
          name="${item.name}"
          price="${item.price}"
          quantity="${item.quantity}">
        </cart-item>
      `).join('')}
      <p class="total">Total: $${this.total.toFixed(2)}</p>
      <button class="checkout-btn">Checkout</button>
    `;
  }
}
```

## Case Study: Dashboard Application

A data dashboard shows real-time metrics with role-based access.

### Real-Time Updates

WebSocket messages update charts automatically:

```javascript
// metrics-chart.js
class MetricsChart extends HTMLElement {
  connectedCallback() {
    this.data = [];

    pan.subscribe('ws.message.metrics', ({ value, timestamp }) => {
      this.data.push({ value, timestamp });
      if (this.data.length > 100) this.data.shift();
      this.render();
    });

    this.render();
  }

  render() {
    // Render chart using canvas or SVG
    const canvas = this.querySelector('canvas') || document.createElement('canvas');
    if (!this.contains(canvas)) this.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    // ... draw chart
  }
}
```

### Role-Based Views

Different users see different widgets:

```javascript
// dashboard-page.js
class DashboardPage extends HTMLElement {
  connectedCallback() {
    const user = auth.getCurrentUser();

    this.innerHTML = `
      <h1>Dashboard</h1>

      <div class="widgets">
        <metrics-chart></metrics-chart>
        <recent-activity></recent-activity>

        ${rbac.can(user, 'view-analytics') ? `
          <analytics-panel></analytics-panel>
        ` : ''}

        ${rbac.can(user, 'manage-users') ? `
          <user-management></user-management>
        ` : ''}
      </div>
    `;
  }
}
```

## Lessons Learned

Building real applications with LARC teaches valuable lessons:

1. **Start simple**: Begin with basic components and add complexity as needed.

2. **Use the PAN bus liberally**: It's cheap and powerful. When in doubt, publish an event.

3. **Embrace the platform**: Native APIs are well-optimized. Use fetch, not axios. Use template literals, not a template library.

4. **Think in components**: Small, focused components are easier to test, reuse, and understand.

5. **Test early**: Writing tests as you build prevents painful debugging later.

6. **Profile before optimizing**: Measure performance before assuming where bottlenecks are.

7. **Document as you go**: Future you will thank present you.

8. **Progressive enhancement**: Build core functionality first, then enhance for modern browsers.

---

# Appendices

## Appendix A: Web Components API Reference

### Custom Elements

**Defining elements:**
```javascript
customElements.define('my-element', MyElement);
customElements.define('my-element', MyElement, { extends: 'button' });
```

**Retrieving definitions:**
```javascript
customElements.get('my-element');  // Returns constructor or undefined
await customElements.whenDefined('my-element');  // Resolves when defined
customElements.upgrade(element);  // Upgrade an element
```

### Lifecycle Callbacks

| Callback | When Called |
|----------|-------------|
| `constructor()` | Element created |
| `connectedCallback()` | Element added to DOM |
| `disconnectedCallback()` | Element removed from DOM |
| `attributeChangedCallback(name, oldVal, newVal)` | Observed attribute changed |
| `adoptedCallback()` | Element moved to new document |

### Shadow DOM

```javascript
// Attach shadow root
const shadow = element.attachShadow({ mode: 'open' });

// Access shadow root
element.shadowRoot  // null if mode is 'closed'

// Slots
const slot = shadow.querySelector('slot');
slot.assignedNodes();  // All assigned nodes
slot.assignedElements();  // Only element nodes
```

## Appendix B: PAN Bus API Reference

### Publishing

```javascript
// Simple publish
pan.publish('topic', data);

// With options
pan.publish('topic', data, { retained: true });
```

### Subscribing

```javascript
// Subscribe
const unsubscribe = pan.subscribe('topic', (data) => {
  console.log(data);
});

// Wildcard subscribe
pan.subscribe('user.*', (data, topic) => {
  console.log(topic, data);
});

// Unsubscribe
unsubscribe();
```

### Request/Response

```javascript
// Request with timeout
const result = await pan.request('service.getData', { id: 1 }, 5000);

// Respond to requests
pan.respond('service.getData', async ({ id }) => {
  return await fetchData(id);
});
```

## Appendix C: Component Quick Reference

| Component | Purpose | Key Attributes |
|-----------|---------|----------------|
| `pan-router` | Client-side routing | `base` |
| `pan-route` | Route definition | `path`, `component` |
| `pan-store` | State management | `persist`, `namespace` |
| `pan-fetch` | Data fetching | `url`, `method`, `auto` |

## Appendix D: Migration Cheat Sheet

### React → LARC

| React | LARC |
|-------|------|
| JSX | Template literals |
| `props` | Attributes/properties |
| `useState` | Instance properties |
| `useEffect` | `connectedCallback` |
| Context | PAN bus |
| Redux | `pan-store` |

### Vue → LARC

| Vue | LARC |
|-----|------|
| Templates | Template literals |
| `v-if` | Ternary in template |
| `v-for` | `array.map()` |
| `computed` | Getters |
| Vuex | `pan-store` |

## Appendix E: Resources

### Official

- Documentation: https://larcjs.com/docs
- GitHub: https://github.com/larcjs/larc
- Examples: https://github.com/larcjs/larc/tree/main/packages/examples

### Web Standards

- MDN Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- Custom Elements Spec: https://html.spec.whatwg.org/multipage/custom-elements.html
- Shadow DOM Spec: https://dom.spec.whatwg.org/#shadow-trees

### Community

- Discord: https://discord.gg/larc
- Forum: https://forum.larcjs.com
