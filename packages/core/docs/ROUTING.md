# PAN Routes - Dynamic Message Routing

**Runtime-configurable message routing for declarative event-driven architectures**

PAN Routes extends the PAN bus with a powerful routing system that lets you configure message flows declaratively at runtime. Instead of hardcoding message transformations and forwarding in your application code, you define routing rules that:

- ✅ Match messages based on type, topic, tags, or custom predicates
- ✅ Transform message data with pick, map, or custom functions
- ✅ Execute actions like emit, forward, log, or call custom handlers
- ✅ Can be added, updated, or removed at runtime
- ✅ Work seamlessly with the existing PAN bus message flow

## Why Use Routing?

**Before PAN Routes (Tightly Coupled):**
```javascript
// Components must know about each other and transformation logic
bus.subscribe('sensor.temperature', (msg) => {
  if (msg.payload.value > 30) {
    const alert = {
      type: 'alert.highTemp',
      severity: 'warning',
      temp: msg.payload.value,
      sensor: msg.meta.source
    };
    bus.publish('alerts', alert);
    console.warn(`High temp alert: ${alert.temp}°C from ${alert.sensor}`);
  }
});
```

**With PAN Routes (Declarative & Decoupled):**
```javascript
// Define routing rules declaratively
pan.routes.add({
  name: 'High Temperature Alert',
  match: {
    type: 'sensor.temperature',
    where: { op: 'gt', path: 'payload.value', value: 30 }
  },
  actions: [
    {
      type: 'EMIT',
      message: {
        type: 'alert.highTemp',
        payload: { severity: 'warning' }
      },
      inherit: ['payload', 'meta']
    },
    {
      type: 'LOG',
      level: 'warn',
      template: 'High temp: {{payload.value}}°C from {{meta.source}}'
    }
  ]
});
```

**Benefits:**
- 🎯 **Separation of Concerns** - Routing logic separate from business logic
- 🔄 **Runtime Configuration** - Change message flows without code changes
- 📦 **Reusable** - Route definitions can be shared and stored
- 🐛 **Debuggable** - See all routing rules in one place
- 🧪 **Testable** - Test routing rules in isolation

## Quick Start

### Enable Routing

Add the `enable-routing` attribute to your `<pan-bus>`:

```html
<pan-bus enable-routing="true"></pan-bus>
```

Or enable it programmatically:

```javascript
const bus = document.querySelector('pan-bus');
bus.setAttribute('enable-routing', 'true');
```

### Add Your First Route

```javascript
// Access the routing manager
const routes = window.pan.routes;

// Add a simple route
routes.add({
  name: 'Welcome Message Logger',
  match: { type: 'user.login.success' },
  actions: [
    {
      type: 'LOG',
      level: 'info',
      template: 'User {{payload.name}} logged in'
    }
  ]
});
```

## Core Concepts

### Routes

A **route** is a declarative rule with three parts:

1. **Match** - Conditions that determine if a message matches this route
2. **Transform** (optional) - How to modify the message before actions
3. **Actions** - What to do when a message matches

```javascript
routes.add({
  name: 'Route Name',           // Human-readable name
  enabled: true,                // Enable/disable route
  order: 0,                     // Execution order (lower first)
  match: { /* conditions */ },  // Matching criteria
  transform: { /* transform */ }, // Optional transformation
  actions: [ /* actions */ ]    // Actions to execute
});
```

### Matching

Routes match messages based on multiple criteria:

#### Match by Type

```javascript
match: {
  type: 'user.login'           // Single type
}

match: {
  type: ['user.login', 'user.signup']  // Multiple types
}
```

#### Match by Topic

```javascript
match: {
  topic: 'users.data'
}
```

#### Match by Source

```javascript
match: {
  source: 'mobile-app'
}
```

#### Match by Tags

```javascript
match: {
  tagsAny: ['important', 'urgent']  // At least one tag
}

match: {
  tagsAll: ['priority', 'verified']  // All tags required
}
```

#### Match with Predicates

Predicates let you filter messages based on their data:

```javascript
match: {
  type: 'sensor.update',
  where: {
    op: 'gt',                    // Greater than
    path: 'payload.temperature', // Field to check
    value: 30                    // Threshold
  }
}
```

**Available Predicate Operators:**

| Operator | Description | Example |
|----------|-------------|---------|
| `eq` | Equal | `{ op: 'eq', path: 'payload.status', value: 'active' }` |
| `neq` | Not equal | `{ op: 'neq', path: 'payload.type', value: 'test' }` |
| `gt` | Greater than | `{ op: 'gt', path: 'payload.count', value: 100 }` |
| `gte` | Greater than or equal | `{ op: 'gte', path: 'payload.score', value: 80 }` |
| `lt` | Less than | `{ op: 'lt', path: 'payload.age', value: 18 }` |
| `lte` | Less than or equal | `{ op: 'lte', path: 'payload.price', value: 50 }` |
| `in` | Value in array | `{ op: 'in', path: 'payload.role', value: ['admin', 'moderator'] }` |
| `regex` | Regular expression | `{ op: 'regex', path: 'payload.email', value: '^[^@]+@example\\.com$' }` |
| `and` | Logical AND | `{ op: 'and', children: [pred1, pred2] }` |
| `or` | Logical OR | `{ op: 'or', children: [pred1, pred2] }` |
| `not` | Logical NOT | `{ op: 'not', child: pred }` |

**Complex Predicate Example:**

```javascript
match: {
  type: 'order.created',
  where: {
    op: 'and',
    children: [
      { op: 'gte', path: 'payload.total', value: 100 },
      { op: 'eq', path: 'payload.status', value: 'pending' },
      {
        op: 'or',
        children: [
          { op: 'eq', path: 'payload.priority', value: 'high' },
          { op: 'in', path: 'meta.tags', value: ['vip', 'urgent'] }
        ]
      }
    ]
  }
}
```

### Transforms

Transforms modify messages before actions execute:

#### Identity Transform (No Change)

```javascript
transform: {
  op: 'identity'
}
```

#### Pick Transform (Select Fields)

```javascript
transform: {
  op: 'pick',
  paths: ['payload.userId', 'payload.email', 'meta.timestamp']
}
```

#### Map Transform (Apply Function to Field)

```javascript
// Register transform function
routes.registerTransform('normalize-email', (email) => {
  return email.toLowerCase().trim();
});

// Use in route
transform: {
  op: 'map',
  path: 'payload.email',
  fnId: 'normalize-email'
}
```

#### Custom Transform (Full Message Transformation)

```javascript
// Register custom transform
routes.registerTransform('enrich-user-data', (msg) => {
  return {
    ...msg,
    payload: {
      ...msg.payload,
      timestamp: Date.now(),
      source: 'enriched'
    }
  };
});

// Use in route
transform: {
  op: 'custom',
  fnId: 'enrich-user-data'
}
```

### Actions

Actions define what happens when a message matches a route:

#### EMIT Action

Publish a new message on the bus:

```javascript
actions: [
  {
    type: 'EMIT',
    message: {
      type: 'notification.send',
      payload: {
        title: 'New Order',
        body: 'Order received'
      }
    }
  }
]
```

**With Inheritance:**

```javascript
actions: [
  {
    type: 'EMIT',
    message: {
      type: 'order.processed',
      payload: { status: 'processing' }
    },
    inherit: ['payload', 'meta']  // Merge original payload and meta
  }
]
```

#### FORWARD Action

Forward the message to a different topic:

```javascript
actions: [
  {
    type: 'FORWARD',
    topic: 'analytics.events'
  }
]
```

**With Type Override:**

```javascript
actions: [
  {
    type: 'FORWARD',
    topic: 'backup.events',
    typeOverride: 'archived.event'
  }
]
```

#### LOG Action

Log message with template interpolation:

```javascript
actions: [
  {
    type: 'LOG',
    level: 'info',  // debug, info, warn, error
    template: 'User {{payload.username}} performed {{payload.action}}'
  }
]
```

#### CALL Action

Call a registered handler function:

```javascript
// Register handler
routes.registerHandler('process-payment', (msg) => {
  console.log('Processing payment:', msg.payload);
  // ... payment processing logic
});

// Use in route
actions: [
  {
    type: 'CALL',
    handlerId: 'process-payment'
  }
]
```

#### Multiple Actions

Routes can execute multiple actions in sequence:

```javascript
actions: [
  {
    type: 'LOG',
    level: 'info',
    template: 'Processing order {{payload.orderId}}'
  },
  {
    type: 'CALL',
    handlerId: 'validate-order'
  },
  {
    type: 'EMIT',
    message: {
      type: 'order.validated',
      payload: { valid: true }
    }
  }
]
```

## API Reference

### Route Management

#### `add(route)`

Add a new route:

```javascript
const route = routes.add({
  name: 'My Route',
  match: { type: 'test' },
  actions: [{ type: 'LOG', level: 'info' }]
});

console.log(route.id); // Auto-generated ID
```

#### `list(options)`

List all routes (with optional filtering):

```javascript
const allRoutes = routes.list();
const enabledOnly = routes.list({ enabled: true });
const byTag = routes.list({ meta: { tags: ['production'] } });
```

#### `update(id, patch)`

Update an existing route:

```javascript
routes.update('route-123', {
  name: 'Updated Name',
  enabled: false
});
```

#### `remove(id)`

Remove a route:

```javascript
routes.remove('route-123');
```

#### `enable(id)` / `disable(id)`

Enable or disable a route:

```javascript
routes.enable('route-123');
routes.disable('route-123');
```

#### `clear()`

Remove all routes:

```javascript
routes.clear();
```

### Transform & Handler Registration

#### `registerTransform(fnId, fn)`

Register a transform function:

```javascript
routes.registerTransform('upper', (val) => val.toUpperCase());

// Unregister
routes.unregisterTransform('upper');
```

#### `registerHandler(handlerId, handler)`

Register an action handler:

```javascript
routes.registerHandler('my-handler', (msg) => {
  console.log('Handling:', msg);
});

// Unregister
routes.unregisterHandler('my-handler');
```

### Statistics

#### `getStats()`

Get routing statistics:

```javascript
const stats = routes.getStats();
console.log(stats);
// {
//   routesEvaluated: 1234,
//   routesMatched: 456,
//   actionsExecuted: 789,
//   errors: 0,
//   routeCount: 5,
//   enabledRouteCount: 4,
//   transformFnCount: 2,
//   handlerCount: 3
// }
```

#### `resetStats()`

Reset statistics counters:

```javascript
routes.resetStats();
```

### Event Listeners

#### `onChange(listener)`

Listen for route changes:

```javascript
const unsubscribe = routes.onChange((allRoutes) => {
  console.log('Routes changed:', allRoutes);
});

// Later: unsubscribe()
```

#### `onError(listener)`

Listen for routing errors:

```javascript
const unsubscribe = routes.onError((error) => {
  console.error('Routing error:', error);
});
```

### Control via Messages

You can also control routing via PAN control messages:

```javascript
// Add route
document.dispatchEvent(new CustomEvent('pan:control', {
  detail: {
    type: 'pan.routes.add',
    payload: {
      route: {
        name: 'My Route',
        match: { type: 'test' },
        actions: [{ type: 'LOG' }]
      }
    }
  }
}));

// Remove route
document.dispatchEvent(new CustomEvent('pan:control', {
  detail: {
    type: 'pan.routes.remove',
    payload: { id: 'route-123' }
  }
}));

// List routes
document.dispatchEvent(new CustomEvent('pan:control', {
  detail: {
    type: 'pan.routes.list',
    payload: {}
  }
}));
```

## Real-World Examples

### Example 1: User Activity Tracking

```javascript
routes.add({
  name: 'Track User Actions',
  match: {
    type: ['user.click', 'user.view', 'user.interact'],
    tagsAny: ['trackable']
  },
  actions: [
    {
      type: 'FORWARD',
      topic: 'analytics.user-events'
    },
    {
      type: 'LOG',
      level: 'debug',
      template: '[Analytics] {{type}}: {{payload.element}}'
    }
  ]
});
```

### Example 2: Error Monitoring

```javascript
routes.add({
  name: 'Critical Error Monitor',
  match: {
    type: 'error',
    where: {
      op: 'or',
      children: [
        { op: 'eq', path: 'payload.severity', value: 'critical' },
        { op: 'eq', path: 'payload.severity', value: 'fatal' }
      ]
    }
  },
  actions: [
    {
      type: 'LOG',
      level: 'error',
      template: '🚨 CRITICAL: {{payload.message}} in {{payload.component}}'
    },
    {
      type: 'EMIT',
      message: {
        type: 'notification.alert',
        payload: {
          title: 'Critical Error',
          priority: 'high'
        }
      },
      inherit: ['payload']
    },
    {
      type: 'CALL',
      handlerId: 'send-to-error-tracking'
    }
  ]
});
```

### Example 3: Data Transformation Pipeline

```javascript
// Register transforms
routes.registerTransform('validate-email', (email) => {
  const valid = /^[^@]+@[^@]+\.[^@]+$/.test(email);
  return { email, valid };
});

routes.registerTransform('normalize-user', (msg) => ({
  ...msg,
  payload: {
    id: msg.payload.id,
    email: msg.payload.email.toLowerCase().trim(),
    name: msg.payload.name.trim(),
    createdAt: Date.now()
  }
}));

// Add transformation route
routes.add({
  name: 'User Registration Pipeline',
  match: { type: 'user.register' },
  transform: {
    op: 'custom',
    fnId: 'normalize-user'
  },
  actions: [
    {
      type: 'EMIT',
      message: { type: 'user.normalized' },
      inherit: ['payload']
    }
  ]
});
```

### Example 4: Conditional Notification Routing

```javascript
routes.add({
  name: 'VIP Customer Notifications',
  match: {
    type: 'order.created',
    where: {
      op: 'and',
      children: [
        { op: 'gte', path: 'payload.total', value: 1000 },
        { op: 'eq', path: 'payload.customerTier', value: 'vip' }
      ]
    }
  },
  actions: [
    {
      type: 'EMIT',
      message: {
        type: 'notification.vip-order',
        payload: {
          priority: 'high',
          channels: ['email', 'sms', 'push']
        }
      },
      inherit: ['payload', 'meta']
    },
    {
      type: 'LOG',
      level: 'info',
      template: '💎 VIP Order: ${{payload.total}} from {{payload.customerId}}'
    }
  ]
});
```

### Example 5: Feature Flag Routing

```javascript
// Register handler that checks feature flags
routes.registerHandler('check-feature', (msg) => {
  const features = getFeatureFlags(); // Your feature flag system
  if (features.newCheckout) {
    window.pan.bus.publish('checkout.v2', msg.payload);
  } else {
    window.pan.bus.publish('checkout.v1', msg.payload);
  }
});

routes.add({
  name: 'Checkout Version Router',
  match: { type: 'checkout.start' },
  actions: [
    {
      type: 'CALL',
      handlerId: 'check-feature'
    }
  ]
});
```

## Best Practices

### 1. Name Routes Descriptively

```javascript
// ✅ Good
name: 'High-Priority Order Alert'

// ❌ Bad
name: 'Route 1'
```

### 2. Use Tags for Organization

```javascript
meta: {
  tags: ['production', 'alerts', 'v1']
}
```

### 3. Order Routes Appropriately

```javascript
// Lower order executes first
{ name: 'Validation', order: 10, ... }
{ name: 'Transformation', order: 20, ... }
{ name: 'Logging', order: 30, ... }
```

### 4. Handle Errors Gracefully

```javascript
routes.onError((error) => {
  console.error('Routing error:', error);
  // Send to error tracking service
});
```

### 5. Use Control Guards for Security

```javascript
routes.setControlGuard((message) => {
  // Only allow control messages from admin users
  return message.meta?.userId === 'admin';
});
```

### 6. Test Routes in Isolation

```javascript
// Test that route matches correctly
const testMsg = { type: 'test', payload: { value: 50 } };
const matched = routes.processMessage(testMsg);
console.log('Routes matched:', matched.length);
```

### 7. Monitor Performance

```javascript
const stats = routes.getStats();
console.log(`${stats.routesMatched}/${stats.routesEvaluated} matches`);
console.log(`${stats.actionsExecuted} actions executed`);
```

## Performance Considerations

- **Route Evaluation**: All enabled routes are evaluated for every message. Keep the number of routes reasonable (<100).
- **Predicate Complexity**: Complex predicates (deep `and`/`or` trees) can impact performance.
- **Transform Functions**: Custom transforms should be fast. Avoid expensive operations.
- **Action Ordering**: Actions execute sequentially. Put faster actions first.

## Security

### Control Message Guard

Protect routing configuration from unauthorized changes:

```javascript
routes.setControlGuard((message) => {
  const user = getCurrentUser();
  return user && user.role === 'admin';
});
```

### Validate Route Sources

```javascript
match: {
  source: ['trusted-app', 'internal-service']  // Only match trusted sources
}
```

### Sanitize Log Templates

Be careful with user-provided data in log templates:

```javascript
// ⚠️ Potentially unsafe if payload.message contains sensitive data
template: 'Error: {{payload.message}}'

// ✅ Better: use specific, known-safe fields
template: 'Error code: {{payload.errorCode}}'
```

## TypeScript Support

Use with `@larcjs/core-types`:

```typescript
import type { PanRoute, PanMessage } from '@larcjs/core-types';

const route: PanRoute = {
  name: 'Typed Route',
  match: { type: 'user.action' },
  actions: [{ type: 'LOG', level: 'info' }]
};

window.pan.routes.add(route);
```

## Debugging

### Enable Debug Logging

```html
<pan-bus enable-routing="true" debug="true"></pan-bus>
```

### Inspect Routes

```javascript
// List all routes
console.table(routes.list());

// Get specific route
const route = routes.list().find(r => r.name === 'My Route');
console.log(route);
```

### View Statistics

```javascript
console.log(routes.getStats());
```

### Trace Message Flow

```javascript
routes.onChange((routes) => {
  console.log('Routes updated:', routes.map(r => r.name));
});

routes.onError((error) => {
  console.error('Routing error:', error);
});
```

## Migration Guide

### From Manual Subscriptions

**Before:**
```javascript
bus.subscribe('data.fetch', async (msg) => {
  const result = await fetchData(msg.payload.id);
  bus.publish('data.loaded', result);
});
```

**After:**
```javascript
routes.registerHandler('fetch-data', async (msg) => {
  const result = await fetchData(msg.payload.id);
  return result;
});

routes.add({
  name: 'Data Fetcher',
  match: { type: 'data.fetch' },
  actions: [
    {
      type: 'CALL',
      handlerId: 'fetch-data'
    },
    {
      type: 'EMIT',
      message: { type: 'data.loaded' },
      inherit: ['payload']
    }
  ]
});
```

## FAQ

**Q: Do routes affect normal PAN bus subscriptions?**
A: No. Routes run in parallel with subscriptions. Both will receive messages.

**Q: Can routes create infinite loops?**
A: Yes, if a route emits a message that matches itself. Be careful with EMIT actions.

**Q: How do I persist routes across page reloads?**
A: Use `routes.setStorage()` with localStorage or your own storage adapter.

**Q: Can I use routes in Web Workers?**
A: Yes, but the routing manager must be initialized in each worker context.

**Q: What's the performance impact?**
A: Minimal for <50 routes. Each message evaluation is ~0.1ms on average hardware.

## Resources

- [API Reference](./API_REFERENCE.md)
- [LARC Core Documentation](../README.md)
- [Examples Repository](https://github.com/larcjs/examples)

## License

MIT © Chris Robison
