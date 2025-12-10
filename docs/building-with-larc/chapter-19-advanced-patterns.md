# Advanced Patterns

> "Any sufficiently advanced technology is indistinguishable from magic. Any sufficiently advanced LARC pattern is indistinguishable from over-engineering." — Clarke's Third Law, Revised

You've mastered the basics of LARC. Your components communicate gracefully. Your state management is pristine. Your error handling would make a DevOps engineer weep tears of joy. But now you're ready for the advanced stuff—the patterns that separate the "just building apps" developers from the "architect a scalable micro-frontend ecosystem" developers.

Fair warning: some of these patterns are powerful. Some are clever. Some might be too clever. Use your judgment, and remember that the best code is the code your teammates can understand at 9 AM on a Monday.

## Message Forwarding and Bridging

Sometimes you need messages from one bus to appear on another. Maybe you're integrating a third-party widget. Maybe you're building a multi-window application. Maybe you just like making things complicated (no judgment).

### Basic Message Forwarding

Forward messages from one bus to another:

```javascript
class MessageBridge extends Component {
  constructor(sourceBus, targetBus, messageTypes) {
    super();
    this.sourceBus = sourceBus;
    this.targetBus = targetBus;
    this.messageTypes = messageTypes || ['*']; // Forward all by default
  }

  init() {
    this.messageTypes.forEach(type => {
      this.sourceBus.on(type, (data) => {
        this.targetBus.emit(type, data);
      });
    });
  }

  render() {
    return null; // Bridges don't render
  }
}

// Usage
const mainBus = createBus();
const widgetBus = createBus();

// Forward user actions from widget to main app
const bridge = new MessageBridge(
  widgetBus,
  mainBus,
  ['user-click', 'user-input']
);
```

### Bidirectional Bridging

When you need messages flowing both ways:

```javascript
class BidirectionalBridge extends Component {
  constructor(busA, busB, config = {}) {
    super();
    this.busA = busA;
    this.busB = busB;
    this.config = {
      aToB: config.aToB || ['*'], // Types to forward A -> B
      bToA: config.bToA || ['*'], // Types to forward B -> A
      transform: config.transform || ((data) => data), // Transform data
      filter: config.filter || (() => true) // Filter messages
    };
  }

  init() {
    // Forward A -> B
    this.config.aToB.forEach(type => {
      this.busA.on(type, (data) => {
        if (this.config.filter(type, data, 'aToB')) {
          const transformed = this.config.transform(data, 'aToB');
          this.busB.emit(type, transformed);
        }
      });
    });

    // Forward B -> A
    this.config.bToA.forEach(type => {
      this.busB.on(type, (data) => {
        if (this.config.filter(type, data, 'bToA')) {
          const transformed = this.config.transform(data, 'bToA');
          this.busA.emit(type, transformed);
        }
      });
    });
  }

  render() {
    return null;
  }
}

// Usage with transformation
const bridge = new BidirectionalBridge(mainBus, widgetBus, {
  aToB: ['theme-changed', 'user-logged-in'],
  bToA: ['widget-action'],
  transform: (data, direction) => {
    // Add metadata for tracking
    return {
      ...data,
      bridged: true,
      direction,
      timestamp: Date.now()
    };
  },
  filter: (type, data, direction) => {
    // Don't forward internal messages
    return !type.startsWith('internal-');
  }
});
```

### Message Translation

When buses speak different dialects:

```javascript
class MessageTranslator extends Component {
  constructor(sourceBus, targetBus, translations) {
    super();
    this.sourceBus = sourceBus;
    this.targetBus = targetBus;
    this.translations = translations;
  }

  init() {
    Object.entries(this.translations).forEach(([sourceType, config]) => {
      this.sourceBus.on(sourceType, (data) => {
        const targetType = config.type || sourceType;
        const targetData = config.transform
          ? config.transform(data)
          : data;

        this.targetBus.emit(targetType, targetData);
      });
    });
  }

  render() {
    return null;
  }
}

// Usage: Translate between LARC app and legacy jQuery plugin
const translator = new MessageTranslator(larcBus, jqueryBus, {
  'user-logged-in': {
    type: 'userLogin', // Different naming convention
    transform: (data) => ({
      userId: data.id, // Different property names
      userName: data.username,
      timestamp: new Date().toISOString()
    })
  },
  'cart-updated': {
    type: 'cartChange',
    transform: (data) => ({
      items: data.cartItems.map(item => ({
        id: item.productId,
        qty: item.quantity,
        price: item.unitPrice
      }))
    })
  }
});
```

## Multi-Bus Architectures

One bus is good. Multiple buses? That's when things get interesting (and complicated).

### Domain-Segregated Buses

Separate concerns by domain:

```javascript
class MultiDomainApp {
  constructor() {
    // Separate buses for different domains
    this.buses = {
      auth: createBus({ namespace: 'auth' }),
      cart: createBus({ namespace: 'cart' }),
      ui: createBus({ namespace: 'ui' }),
      analytics: createBus({ namespace: 'analytics' })
    };

    // Create cross-domain bridges
    this.setupBridges();
  }

  setupBridges() {
    // Auth events trigger analytics
    new MessageBridge(
      this.buses.auth,
      this.buses.analytics,
      ['user-logged-in', 'user-logged-out']
    );

    // Cart events trigger UI updates
    new MessageBridge(
      this.buses.cart,
      this.buses.ui,
      ['cart-updated']
    );

    // Auth changes affect cart
    this.buses.auth.on('user-logged-out', () => {
      this.buses.cart.emit('clear-cart');
    });
  }

  getComponentProps(domain) {
    return {
      bus: this.buses[domain],
      globalBus: this.buses.ui // Some components need global access
    };
  }
}

// Usage
const app = new MultiDomainApp();

class LoginForm extends Component {
  constructor(props) {
    super(props);
    this.authBus = props.bus; // Domain-specific bus
  }

  async handleLogin(username, password) {
    // Emit on auth bus
    this.authBus.emit('login-attempt', { username });

    const result = await this.authenticate(username, password);

    if (result.success) {
      this.authBus.emit('user-logged-in', {
        userId: result.userId,
        username: username
      });
    }
  }
}

const loginForm = new LoginForm(app.getComponentProps('auth'));
```

### Hierarchical Bus Structure

Create parent-child bus relationships:

```javascript
class HierarchicalBus {
  constructor(parent = null) {
    this.parent = parent;
    this.children = new Set();
    this.handlers = new Map();

    if (parent) {
      parent.children.add(this);
    }
  }

  emit(type, data, options = {}) {
    const { bubble = false, propagate = false } = options;

    // Handle locally
    this._emitLocal(type, data);

    // Bubble up to parent
    if (bubble && this.parent) {
      this.parent.emit(type, data, { bubble: true });
    }

    // Propagate down to children
    if (propagate) {
      this.children.forEach(child => {
        child.emit(type, data, { propagate: true });
      });
    }
  }

  _emitLocal(type, data) {
    const handlers = this.handlers.get(type) || [];
    handlers.forEach(handler => handler(data));

    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach(handler => handler(type, data));
  }

  on(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  destroy() {
    if (this.parent) {
      this.parent.children.delete(this);
    }
    this.children.clear();
    this.handlers.clear();
  }
}

// Usage: App with nested modules
const appBus = new HierarchicalBus();
const moduleBus = new HierarchicalBus(appBus);
const subModuleBus = new HierarchicalBus(moduleBus);

// Local event
subModuleBus.emit('button-clicked', { id: 123 });

// Bubble up to parent
subModuleBus.emit('critical-error', { error: 'Oh no!' }, { bubble: true });

// Propagate down to all children
appBus.emit('theme-changed', { theme: 'dark' }, { propagate: true });
```

## Backend Integration Strategies

LARC runs in the browser, but your data lives on a server. Let's build bridges between these two worlds.

### API Gateway Component

Centralize all API calls in one component:

```javascript
class APIGateway extends Component {
  init() {
    this.state = {
      baseURL: '/api',
      token: localStorage.getItem('authToken'),
      requestQueue: [],
      online: navigator.onLine
    };

    // Listen for API requests
    this.on('api-request', this.handleRequest);
    this.on('auth-token-updated', (data) => {
      this.state.token = data.token;
    });

    // Handle online/offline
    window.addEventListener('online', () => {
      this.state.online = true;
      this.flushQueue();
    });
    window.addEventListener('offline', () => {
      this.state.online = false;
    });
  }

  async handleRequest({ method, endpoint, data, requestId }) {
    if (!this.state.online) {
      this.state.requestQueue.push({ method, endpoint, data, requestId });
      this.emit('api-offline', { requestId });
      return;
    }

    try {
      const response = await fetch(`${this.state.baseURL}${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.state.token}`
        },
        body: data ? JSON.stringify(data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      this.emit('api-success', {
        requestId,
        endpoint,
        result
      });

    } catch (error) {
      this.emit('api-error', {
        requestId,
        endpoint,
        error: error.message
      });
    }
  }

  async flushQueue() {
    const queue = [...this.state.requestQueue];
    this.state.requestQueue = [];

    for (const request of queue) {
      await this.handleRequest(request);
    }
  }

  render() {
    return null;
  }
}

// Usage in other components
class UserProfile extends Component {
  loadUserData(userId) {
    const requestId = crypto.randomUUID();

    this.emit('api-request', {
      method: 'GET',
      endpoint: `/users/${userId}`,
      requestId
    });

    this.once(`api-success`, (data) => {
      if (data.requestId === requestId) {
        this.state.user = data.result;
      }
    });

    this.once(`api-error`, (data) => {
      if (data.requestId === requestId) {
        this.state.error = data.error;
      }
    });
  }
}
```

### WebSocket Integration

Real-time bidirectional communication:

```javascript
class WebSocketBridge extends Component {
  init() {
    this.state = {
      connected: false,
      reconnectAttempts: 0,
      maxReconnectAttempts: 5
    };

    this.ws = null;
    this.connect();

    // Listen for outgoing messages
    this.on('ws-send', this.sendMessage);
    this.on('ws-disconnect', () => this.disconnect());
  }

  connect() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsURL = `${protocol}//${window.location.host}/ws`;

    this.ws = new WebSocket(wsURL);

    this.ws.onopen = () => {
      this.state.connected = true;
      this.state.reconnectAttempts = 0;
      this.emit('ws-connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Emit as LARC message
        this.emit(message.type, message.data);
      } catch (error) {
        console.error('Invalid WebSocket message:', event.data);
      }
    };

    this.ws.onclose = () => {
      this.state.connected = false;
      this.emit('ws-disconnected');
      this.attemptReconnect();
    };

    this.ws.onerror = (error) => {
      this.emit('ws-error', { error });
    };
  }

  sendMessage({ type, data }) {
    if (this.ws && this.state.connected) {
      this.ws.send(JSON.stringify({ type, data }));
    } else {
      console.warn('WebSocket not connected, message queued');
      // Could implement a queue here
    }
  }

  attemptReconnect() {
    if (this.state.reconnectAttempts >= this.state.maxReconnectAttempts) {
      this.emit('ws-reconnect-failed');
      return;
    }

    this.state.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.state.reconnectAttempts), 30000);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  render() {
    return null;
  }
}

// Usage
class ChatComponent extends Component {
  init() {
    this.state = { messages: [] };

    // Receive messages from WebSocket
    this.on('chat-message', (data) => {
      this.state.messages.push(data);
    });
  }

  sendMessage(text) {
    // Send via WebSocket
    this.emit('ws-send', {
      type: 'chat-message',
      data: {
        text,
        userId: this.getCurrentUserId(),
        timestamp: Date.now()
      }
    });
  }
}
```

### GraphQL Integration

For those who prefer structured queries:

```javascript
class GraphQLClient extends Component {
  init() {
    this.state = {
      endpoint: '/graphql',
      cache: new Map()
    };

    this.on('graphql-query', this.executeQuery);
    this.on('graphql-mutation', this.executeMutation);
  }

  async executeQuery({ query, variables, requestId, cache = true }) {
    // Check cache
    const cacheKey = JSON.stringify({ query, variables });
    if (cache && this.state.cache.has(cacheKey)) {
      this.emit('graphql-result', {
        requestId,
        data: this.state.cache.get(cacheKey),
        cached: true
      });
      return;
    }

    try {
      const response = await fetch(this.state.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Cache result
      if (cache) {
        this.state.cache.set(cacheKey, result.data);
      }

      this.emit('graphql-result', {
        requestId,
        data: result.data
      });

    } catch (error) {
      this.emit('graphql-error', {
        requestId,
        error: error.message
      });
    }
  }

  async executeMutation({ mutation, variables, requestId }) {
    try {
      const response = await fetch(this.state.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: mutation, variables })
      });

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      // Invalidate cache on mutation
      this.state.cache.clear();

      this.emit('graphql-result', {
        requestId,
        data: result.data
      });

    } catch (error) {
      this.emit('graphql-error', {
        requestId,
        error: error.message
      });
    }
  }

  render() {
    return null;
  }
}

// Usage
class UserList extends Component {
  loadUsers() {
    const requestId = crypto.randomUUID();

    this.emit('graphql-query', {
      query: `
        query GetUsers($limit: Int) {
          users(limit: $limit) {
            id
            username
            email
          }
        }
      `,
      variables: { limit: 10 },
      requestId
    });

    this.once('graphql-result', (data) => {
      if (data.requestId === requestId) {
        this.state.users = data.data.users;
      }
    });
  }
}
```

## Micro-Frontends with LARC

Split your monolith into independently deployable micro-frontends. It's like microservices, but with more JavaScript!

### Module Federation Pattern

Load remote LARC modules dynamically:

```javascript
class MicroFrontendLoader extends Component {
  init() {
    this.state = {
      modules: new Map(),
      loading: new Set()
    };

    this.on('load-module', this.loadModule);
    this.on('unload-module', this.unloadModule);
  }

  async loadModule({ name, url, props }) {
    if (this.state.modules.has(name)) {
      console.warn(`Module ${name} already loaded`);
      return;
    }

    if (this.state.loading.has(name)) {
      console.warn(`Module ${name} is already loading`);
      return;
    }

    this.state.loading.add(name);
    this.emit('module-loading', { name });

    try {
      // Dynamic import
      const module = await import(/* webpackIgnore: true */ url);

      // Initialize module with props
      const instance = new module.default(props);

      this.state.modules.set(name, instance);
      this.state.loading.delete(name);

      this.emit('module-loaded', { name });

    } catch (error) {
      this.state.loading.delete(name);
      this.emit('module-load-error', {
        name,
        error: error.message
      });
    }
  }

  unloadModule({ name }) {
    const module = this.state.modules.get(name);
    if (module && module.destroy) {
      module.destroy();
    }
    this.state.modules.delete(name);
    this.emit('module-unloaded', { name });
  }

  render() {
    return html`
      <div class="micro-frontend-container">
        ${Array.from(this.state.modules.entries()).map(([name, module]) => html`
          <div key=${name} class="module-wrapper" data-module=${name}>
            ${module.render ? module.render() : ''}
          </div>
        `)}
      </div>
    `;
  }
}

// Usage: Load shopping cart from different server
loader.receive('load-module', {
  name: 'shopping-cart',
  url: 'https://cdn.example.com/modules/cart.js',
  props: {
    bus: sharedBus,
    apiEndpoint: '/api/cart'
  }
});
```

### Shell Application Pattern

Create a shell that hosts multiple micro-frontends:

```javascript
class MicroFrontendShell extends Component {
  init() {
    this.state = {
      activeModule: null,
      modules: {
        'dashboard': {
          url: '/modules/dashboard.js',
          title: 'Dashboard'
        },
        'products': {
          url: '/modules/products.js',
          title: 'Products'
        },
        'checkout': {
          url: '/modules/checkout.js',
          title: 'Checkout'
        }
      }
    };

    this.loader = new MicroFrontendLoader({ bus: this.bus });
    this.on('navigate-to-module', this.navigateToModule);
  }

  async navigateToModule({ module }) {
    // Unload previous module
    if (this.state.activeModule) {
      this.emit('unload-module', { name: this.state.activeModule });
    }

    // Load new module
    const config = this.state.modules[module];
    if (config) {
      await this.emit('load-module', {
        name: module,
        url: config.url,
        props: {
          bus: this.bus,
          navigate: (to) => this.navigateToModule({ module: to })
        }
      });

      this.state.activeModule = module;
    }
  }

  render() {
    return html`
      <div class="shell">
        <nav class="shell-nav">
          ${Object.entries(this.state.modules).map(([key, config]) => html`
            <button
              key=${key}
              class=${this.state.activeModule === key ? 'active' : ''}
              onclick=${() => this.navigateToModule({ module: key })}
            >
              ${config.title}
            </button>
          `)}
        </nav>
        <main class="shell-content">
          ${this.loader.render()}
        </main>
      </div>
    `;
  }
}
```

## Plugin Systems

Let users extend your application with their own components.

### Plugin Registry

```javascript
class PluginRegistry extends Component {
  init() {
    this.state = {
      plugins: new Map(),
      hooks: new Map()
    };

    this.on('register-plugin', this.registerPlugin);
    this.on('unregister-plugin', this.unregisterPlugin);
    this.on('execute-hook', this.executeHook);
  }

  registerPlugin({ id, plugin }) {
    if (this.state.plugins.has(id)) {
      throw new Error(`Plugin ${id} already registered`);
    }

    // Validate plugin interface
    if (!plugin.init || typeof plugin.init !== 'function') {
      throw new Error('Plugin must have an init() method');
    }

    this.state.plugins.set(id, plugin);

    // Register plugin hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        if (!this.state.hooks.has(hookName)) {
          this.state.hooks.set(hookName, []);
        }
        this.state.hooks.get(hookName).push({ id, handler });
      });
    }

    // Initialize plugin
    plugin.init({
      bus: this.bus,
      emit: (type, data) => this.emit(type, data)
    });

    this.emit('plugin-registered', { id });
  }

  unregisterPlugin({ id }) {
    const plugin = this.state.plugins.get(id);
    if (!plugin) return;

    // Remove hooks
    this.state.hooks.forEach((handlers, hookName) => {
      this.state.hooks.set(
        hookName,
        handlers.filter(h => h.id !== id)
      );
    });

    // Cleanup plugin
    if (plugin.destroy) {
      plugin.destroy();
    }

    this.state.plugins.delete(id);
    this.emit('plugin-unregistered', { id });
  }

  async executeHook({ hook, data }) {
    const handlers = this.state.hooks.get(hook) || [];

    let result = data;

    for (const { id, handler } of handlers) {
      try {
        result = await handler(result);
      } catch (error) {
        console.error(`Plugin ${id} hook ${hook} failed:`, error);
      }
    }

    return result;
  }

  render() {
    return null;
  }
}

// Example plugin
const analyticsPlugin = {
  init({ bus, emit }) {
    this.bus = bus;
    this.emit = emit;

    // Listen to all messages
    bus.on('*', (type, data) => {
      this.trackEvent(type, data);
    });
  },

  hooks: {
    'before-submit': async (formData) => {
      // Validate or transform data
      console.log('Analytics: Form submission', formData);
      return formData;
    },

    'after-navigation': async (route) => {
      // Track page view
      console.log('Analytics: Page view', route);
      return route;
    }
  },

  trackEvent(type, data) {
    // Send to analytics service
    if (window.gtag) {
      window.gtag('event', type, data);
    }
  },

  destroy() {
    console.log('Analytics plugin destroyed');
  }
};

// Register plugin
registry.receive('register-plugin', {
  id: 'analytics',
  plugin: analyticsPlugin
});

// Use hooks
const formData = { name: 'Alice', email: 'alice@example.com' };
registry.receive('execute-hook', {
  hook: 'before-submit',
  data: formData
}).then(result => {
  console.log('After hook:', result);
});
```

## Middleware Patterns

Intercept and transform messages as they flow through your application.

### Message Middleware

```javascript
class MessageMiddleware extends Component {
  init() {
    this.state = {
      middlewares: []
    };

    this.on('register-middleware', this.registerMiddleware);

    // Intercept all messages
    this.interceptBus();
  }

  registerMiddleware({ middleware, priority = 0 }) {
    this.state.middlewares.push({ middleware, priority });

    // Sort by priority (higher first)
    this.state.middlewares.sort((a, b) => b.priority - a.priority);
  }

  interceptBus() {
    const originalEmit = this.bus.emit.bind(this.bus);

    this.bus.emit = async (type, data) => {
      let context = {
        type,
        data,
        timestamp: Date.now(),
        stopped: false
      };

      // Run through middleware chain
      for (const { middleware } of this.state.middlewares) {
        context = await middleware(context);

        if (context.stopped) {
          return; // Stop propagation
        }
      }

      // Emit transformed message
      originalEmit(context.type, context.data);
    };
  }

  render() {
    return null;
  }
}

// Example middleware: Logging
const loggingMiddleware = async (context) => {
  console.log(`[Middleware] ${context.type}`, context.data);
  return context;
};

// Example middleware: Rate limiting
const rateLimitMiddleware = (() => {
  const limits = new Map();

  return async (context) => {
    const key = context.type;
    const now = Date.now();
    const limit = limits.get(key) || { count: 0, resetAt: now + 1000 };

    if (now > limit.resetAt) {
      limit.count = 0;
      limit.resetAt = now + 1000;
    }

    limit.count++;

    if (limit.count > 10) {
      console.warn(`Rate limit exceeded for ${key}`);
      context.stopped = true;
    }

    limits.set(key, limit);
    return context;
  };
})();

// Example middleware: Transform
const transformMiddleware = async (context) => {
  // Add metadata to all messages
  context.data = {
    ...context.data,
    _meta: {
      timestamp: context.timestamp,
      version: '1.0'
    }
  };
  return context;
};

// Register middleware
middleware.receive('register-middleware', {
  middleware: loggingMiddleware,
  priority: 100
});

middleware.receive('register-middleware', {
  middleware: rateLimitMiddleware,
  priority: 90
});

middleware.receive('register-middleware', {
  middleware: transformMiddleware,
  priority: 80
});
```

### Async Middleware with Error Handling

```javascript
class AsyncMiddleware extends Component {
  init() {
    this.state = {
      middlewares: []
    };
  }

  async runMiddleware(context) {
    try {
      for (const middleware of this.state.middlewares) {
        context = await middleware(context);

        if (context.stopped) {
          break;
        }
      }

      return context;

    } catch (error) {
      console.error('Middleware error:', error);

      // Emit error event
      this.emit('middleware-error', {
        error: error.message,
        context
      });

      // Stop propagation on error
      context.stopped = true;
      return context;
    }
  }
}

// Example: Authentication middleware
const authMiddleware = async (context) => {
  const protectedMessages = ['api-request', 'user-action'];

  if (protectedMessages.includes(context.type)) {
    const token = localStorage.getItem('authToken');

    if (!token) {
      console.warn('Authentication required');
      context.stopped = true;

      // Redirect to login
      setTimeout(() => {
        bus.emit('navigate', { route: '/login' });
      }, 0);
    }
  }

  return context;
};
```

## Conclusion

These advanced patterns are powerful tools in your LARC toolkit. Use them judiciously. Not every application needs a multi-bus architecture or a plugin system. But when you do need them, you'll be glad you have them.

Remember: the goal is to build maintainable, scalable applications—not to use every pattern just because you can. Choose patterns that solve real problems in your codebase, and your future self (and your teammates) will thank you.

In the next chapter, we'll take your LARC application from development to production, covering deployment strategies, performance optimization, and how to sleep soundly knowing your app is running smoothly in the wild.
