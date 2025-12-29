# Advanced Patterns

Quick reference for advanced LARC architecture patterns. For detailed tutorials, see *Learning LARC* Chapter 7.

## Overview

Advanced patterns for complex scenarios: message bridging, multi-bus architectures, backend integration, micro-frontends, and plugin systems. These patterns solve scalability and modularity challenges in large applications.

**Key Concepts:**
- Message bridging between buses
- Domain-segregated architectures
- API gateway patterns
- Micro-frontend integration
- Plugin/middleware systems

## Quick Example

```javascript
// Bidirectional bridge between two buses
class BidirectionalBridge {
  constructor(busA, busB, config) {
    this.busA = busA;
    this.busB = busB;
    
    // Forward A → B
    config.aToB.forEach(type => {
      busA.subscribe(type, msg => busB.publish(type, msg.data));
    });
    
    // Forward B → A
    config.bToA.forEach(type => {
      busB.subscribe(type, msg => busA.publish(type, msg.data));
    });
  }
}

// Usage
const bridge = new BidirectionalBridge(mainBus, widgetBus, {
  aToB: ['theme.changed', 'user.login'],
  bToA: ['widget.action']
});
```

## Message Bridging Patterns

| Pattern | Use Case | Key Features |
|---------|----------|--------------|
| **Basic Forward** | One-way message relay | Simple topic mapping |
| **Bidirectional** | Two-way communication | Transform and filter support |
| **Translation** | Protocol conversion | Type and data transformation |
| **Hierarchical** | Parent-child buses | Bubble-up and propagate-down |

## Backend Integration Patterns

| Pattern | Use Case | Key Features |
|---------|----------|--------------|
| **API Gateway** | Centralized HTTP calls | Request queue, offline support |
| **WebSocket Bridge** | Real-time bidirectional | Auto-reconnect, message queue |
| **GraphQL Client** | Structured queries | Response caching, mutation invalidation |

## Common Patterns

### Pattern 1: API Gateway Component

Centralize all API calls with offline support.

```javascript
class APIGateway extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');
    
    bus.subscribe('api.request', async (msg) => {
      const { method, endpoint, data, requestId } = msg.data;
      
      try {
        const response = await fetch(`/api${endpoint}`, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
          },
          body: data ? JSON.stringify(data) : undefined
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const result = await response.json();
        bus.publish('api.success', { requestId, result });
        
      } catch (error) {
        bus.publish('api.error', { requestId, error: error.message });
      }
    });
  }
}

customElements.define('api-gateway', APIGateway);
```

**Usage:**
```javascript
// In any component
bus.publish('api.request', {
  method: 'GET',
  endpoint: '/users/123',
  requestId: crypto.randomUUID()
});

bus.subscribe('api.success', (msg) => {
  if (msg.data.requestId === myRequestId) {
    this.user = msg.data.result;
  }
});
```

### Pattern 2: Micro-Frontend Loader

Load remote modules dynamically.

```javascript
class MicroFrontendLoader extends HTMLElement {
  async loadModule(name, url, props) {
    try {
      const module = await import(/* webpackIgnore: true */ url);
      const instance = new module.default(props);
      
      this.modules.set(name, instance);
      this.dispatchEvent(new CustomEvent('module-loaded', { 
        detail: { name } 
      }));
      
    } catch (error) {
      console.error(`Failed to load module ${name}:`, error);
    }
  }
  
  unloadModule(name) {
    const module = this.modules.get(name);
    if (module?.destroy) module.destroy();
    this.modules.delete(name);
  }
}

// Usage
const loader = document.querySelector('mf-loader');
await loader.loadModule('cart', 'https://cdn.example.com/cart.js', {
  bus: document.querySelector('pan-bus'),
  apiEndpoint: '/api/cart'
});
```

### Pattern 3: Plugin Registry with Hooks

Extensible plugin system.

```javascript
class PluginRegistry {
  constructor(bus) {
    this.bus = bus;
    this.plugins = new Map();
    this.hooks = new Map();
  }
  
  register(id, plugin) {
    // Initialize plugin
    plugin.init({ bus: this.bus });
    
    // Register hooks
    if (plugin.hooks) {
      Object.entries(plugin.hooks).forEach(([hookName, handler]) => {
        if (!this.hooks.has(hookName)) {
          this.hooks.set(hookName, []);
        }
        this.hooks.get(hookName).push({ id, handler });
      });
    }
    
    this.plugins.set(id, plugin);
  }
  
  async executeHook(hookName, data) {
    const handlers = this.hooks.get(hookName) || [];
    let result = data;
    
    for (const { handler } of handlers) {
      result = await handler(result);
    }
    
    return result;
  }
}

// Plugin example
const analyticsPlugin = {
  init({ bus }) {
    bus.subscribe('*', (msg) => {
      gtag('event', msg.topic, msg.data);
    });
  },
  
  hooks: {
    'before-submit': (formData) => {
      console.log('Analytics: Form submit', formData);
      return formData;
    }
  }
};

// Usage
const registry = new PluginRegistry(bus);
registry.register('analytics', analyticsPlugin);

const data = await registry.executeHook('before-submit', formData);
```

## Architecture Tables

### Multi-Bus Architecture

| Approach | Pros | Cons | Use Case |
|----------|------|------|----------|
| **Domain-Segregated** | Clear boundaries, testable | More complexity | Large apps with distinct domains |
| **Hierarchical** | Natural parent-child | Bubble/propagate overhead | Nested module systems |
| **Federated** | Independent deployment | Coordination needed | Micro-frontends |

### Middleware Patterns

| Type | Use Case | Example |
|------|----------|---------|
| **Logging** | Debug message flow | Log all messages |
| **Rate Limiting** | Prevent spam | Max 10 msgs/sec/topic |
| **Transform** | Add metadata | Inject timestamp, userId |
| **Auth** | Protect actions | Check token before API calls |
| **Error Handling** | Catch failures | Try/catch middleware chain |

## Complete Example

Multi-domain e-commerce app with API gateway, WebSocket, and plugin system.

```javascript
// 1. Create domain buses
const buses = {
  auth: document.createElement('pan-bus'),
  cart: document.createElement('pan-bus'),
  ui: document.createElement('pan-bus')
};

Object.values(buses).forEach(bus => document.body.appendChild(bus));

// 2. Bridge auth events to UI
buses.auth.subscribe('user.login', (msg) => {
  buses.ui.publish('notification', {
    message: `Welcome, ${msg.data.username}!`
  });
});

// 3. API Gateway on auth bus
class AuthAPI extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus[domain="auth"]');
    
    bus.subscribe('auth.login', async (msg) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify(msg.data)
      });
      
      if (response.ok) {
        const { token, user } = await response.json();
        localStorage.setItem('token', token);
        bus.publish('user.login', user);
      }
    });
  }
}

customElements.define('auth-api', AuthAPI);

// 4. WebSocket bridge for cart updates
class CartSocket extends HTMLElement {
  connectedCallback() {
    this.ws = new WebSocket('wss://example.com/cart');
    const bus = document.querySelector('pan-bus[domain="cart"]');
    
    this.ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      bus.publish('cart.updated', update);
    };
    
    bus.subscribe('cart.add-item', (msg) => {
      this.ws.send(JSON.stringify({
        action: 'add',
        item: msg.data
      }));
    });
  }
}

customElements.define('cart-socket', CartSocket);

// 5. Plugin system
const registry = new PluginRegistry(buses.ui);

registry.register('analytics', {
  init({ bus }) {
    bus.subscribe('*', (msg) => {
      gtag('event', msg.topic, msg.data);
    });
  }
});

registry.register('error-handler', {
  init({ bus }) {
    bus.subscribe('app.error', (msg) => {
      Sentry.captureException(msg.data.error);
    });
  }
});
```

## Component Reference

See Chapter 17 for core PAN Bus API documentation.

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 7 (Advanced Patterns)
- **Components**: Chapter 17 (pan-bus), Chapter 20 (integration components)
- **Backend Integration**: Chapter 7 (Data Fetching), Chapter 9 (Realtime Features)
- **Testing**: Chapter 13 (mocking bridges and plugins)

## Common Issues

### Bridge Message Loops
**Problem**: Messages bounce between bridges infinitely  
**Solution**: Add loop detection with message IDs or use one-way bridges

```javascript
const processedIds = new Set();

bus.subscribe('*', (msg) => {
  if (processedIds.has(msg.id)) return;
  processedIds.add(msg.id);
  
  // Forward to other bus...
  
  // Clean up old IDs
  if (processedIds.size > 1000) {
    processedIds.clear();
  }
});
```

### Plugin Hook Failures
**Problem**: One plugin failure breaks entire hook chain  
**Solution**: Wrap hooks in try/catch

```javascript
async executeHook(hookName, data) {
  const handlers = this.hooks.get(hookName) || [];
  let result = data;
  
  for (const { id, handler } of handlers) {
    try {
      result = await handler(result);
    } catch (error) {
      console.error(`Plugin ${id} hook ${hookName} failed:`, error);
      // Continue with other plugins
    }
  }
  
  return result;
}
```

### WebSocket Reconnect Storms
**Problem**: Exponential backoff too aggressive or too slow  
**Solution**: Use capped exponential backoff

```javascript
attemptReconnect() {
  this.reconnectAttempts++;
  
  // Min 1s, max 30s, exponential between
  const delay = Math.min(
    1000 * Math.pow(2, this.reconnectAttempts),
    30000
  );
  
  setTimeout(() => this.connect(), delay);
}
```

### Micro-Frontend Memory Leaks
**Problem**: Modules not properly cleaned up on unload  
**Solution**: Enforce destroy lifecycle

```javascript
unloadModule(name) {
  const module = this.modules.get(name);
  
  if (!module) return;
  
  // Call destroy if exists
  if (module.destroy && typeof module.destroy === 'function') {
    try {
      module.destroy();
    } catch (error) {
      console.error(`Module ${name} destroy failed:`, error);
    }
  }
  
  // Remove DOM elements
  const container = this.querySelector(`[data-module="${name}"]`);
  if (container) container.remove();
  
  this.modules.delete(name);
}
```

### Middleware Performance
**Problem**: Too many middleware slow down message delivery  
**Solution**: Profile and optimize critical path

```javascript
// Add timing middleware in dev mode
if (import.meta.env.DEV) {
  registry.register('timing', {
    priority: 1000, // Run first
    middleware: async (context) => {
      const start = performance.now();
      context = await next(context);
      const duration = performance.now() - start;
      
      if (duration > 16) { // Longer than 1 frame
        console.warn(`Slow middleware for ${context.type}: ${duration}ms`);
      }
      
      return context;
    }
  });
}
```

**See Also**: *Learning LARC* Chapter 7 for hands-on advanced pattern tutorials.
