# Core Components Reference

API documentation for LARC's core components. For tutorials, see *Learning LARC* Chapters 4-5.

## pan-bus

**Purpose**: Message bus for decoupled component communication via pub/sub
**Import**: `<script type="module" src="/core/pan-bus.mjs"></script>`

### Quick Example

```html
<pan-bus debug="true"></pan-bus>

<script type="module">
const bus = document.querySelector('pan-bus');

// Subscribe
bus.subscribe('user.login', (msg) => {
  console.log('User:', msg.data.name);
});

// Publish
bus.publish('user.login', { name: 'Alice' });
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-retained` | Integer | 1000 | Max retained messages (LRU eviction) |
| `max-message-size` | Integer | 1048576 (1MB) | Max message size (bytes) |
| `cleanup-interval` | Integer | 30000 (30s) | Cleanup interval (ms) |
| `rate-limit` | Integer | 1000 | Max messages/client/second |
| `allow-global-wildcard` | Boolean | true | Allow `*` wildcard subscriptions |
| `debug` | Boolean | false | Enable console logging |
| `enable-routing` | Boolean | false | Enable declarative routing |
| `enable-tracing` | Boolean | false | Enable message tracing |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `publish(topic, data, options)` | topic: String, data: Any, options?: Object | undefined | Publish message |
| `subscribe(topics, handler)` | topics: String\|Array, handler: Function | Function | Subscribe (returns unsubscribe fn) |
| `PanBusEnhanced.matches(topic, pattern)` | topic: String, pattern: String | Boolean | Test if topic matches pattern |

**Usage**:
```javascript
const bus = document.querySelector('pan-bus');

// Publish
bus.publish('user.login', { userId: 123 });
bus.publish('config', { theme: 'dark' }, { retain: true });

// Subscribe
const unsub = bus.subscribe('user.*', (msg) => {
  console.log(msg.topic, msg.data);
});

// Unsubscribe
unsub();
```

### Events

**Incoming** (components dispatch these):
- `pan:hello` - Register client: `{ id, caps }`
- `pan:subscribe` - Subscribe: `{ topics, clientId, options }`
- `pan:unsubscribe` - Unsubscribe: `{ topics, clientId }`
- `pan:publish` - Publish: `{ topic, data, retain, clientId }`
- `pan:request` - Request (like publish): `{ topic, data, requestId }`
- `pan:sys.stats` - Get statistics
- `pan:sys.clear-retained` - Clear retained: `{ pattern? }`

**Outgoing** (bus dispatches these):
- `pan:sys.ready` - Bus ready: `{ enhanced, routing, tracing, config }`
- `pan:sys.error` - Error: `{ code, message, details }`
- `pan:deliver` - Deliver message: `{ topic, data, id, ts, ...extras }`

### Complete Example

```javascript
// Publisher component
class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<button id="login">Login</button>';

    this.querySelector('#login').addEventListener('click', () => {
      const bus = document.querySelector('pan-bus');
      bus.publish('user.login', {
        userId: '123',
        name: 'Alice',
        timestamp: Date.now()
      });
    });
  }
}

// Subscriber component
class Dashboard extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    this.unsubscribe = bus.subscribe('user.login', (msg) => {
      this.innerHTML = `<h1>Welcome, ${msg.data.name}!</h1>`;
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

customElements.define('login-form', LoginForm);
customElements.define('dash-board', Dashboard);
```

### Common Issues

**Messages not delivered**: Wait for `pan:sys.ready` event or check `window.__panReady`
**Memory leaks**: Always unsubscribe in `disconnectedCallback()`
**Rate limiting**: Increase `rate-limit` attribute for high-frequency apps
**JSON errors**: Payloads must be JSON-serializable (no functions, DOM nodes, circular refs)

### Errors

The pan-bus component dispatches `pan:sys.error` events for error conditions:

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `RATE_LIMIT` | Client exceeds rate limit | Increase `rate-limit` attribute or reduce publish frequency |
| `MESSAGE_TOO_LARGE` | Message exceeds max size | Increase `max-message-size` or reduce payload size |
| `INVALID_TOPIC` | Topic name is invalid | Use alphanumeric + dots (e.g., `user.login`) |
| `SUBSCRIPTION_FAILED` | Handler threw exception | Fix handler code, check console for details |
| `RETAINED_OVERFLOW` | Too many retained messages | Increase `max-retained` or clean up old messages |
| `WILDCARD_DISABLED` | `*` wildcard used when disabled | Set `allow-global-wildcard="true"` |

**Error handling example**:
```javascript
const bus = document.querySelector('pan-bus');

// Listen for errors
bus.addEventListener('pan:sys.error', (e) => {
  const { code, message, details } = e.detail;
  console.error(`PAN Bus Error [${code}]:`, message, details);

  // Handle specific errors
  if (code === 'RATE_LIMIT') {
    // Slow down publishing
    enableThrottling();
  } else if (code === 'MESSAGE_TOO_LARGE') {
    // Split large payloads
    splitPayload(details.payload);
  }
});
```

**Exceptions thrown**:
- `TypeError`: Invalid parameters (e.g., non-string topic, non-function handler)
- `RangeError`: Attribute values out of bounds (e.g., negative rate-limit)

---

## pan-theme-provider

**Purpose**: Manages app theme with system preference detection
**Import**: `<script type="module" src="/ui/pan-theme-provider.mjs"></script>`

### Quick Example

```html
<pan-theme-provider theme="auto"></pan-theme-provider>

<style>
  :root[data-theme="light"] { --bg: #fff; --text: #000; }
  :root[data-theme="dark"] { --bg: #000; --text: #fff; }
  body { background: var(--bg); color: var(--text); }
</style>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | String | "auto" | Theme mode: "light", "dark", or "auto" |

### Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `setTheme(theme)` | undefined | Set theme: "light", "dark", or "auto" |
| `getTheme()` | String | Get theme mode |
| `getEffectiveTheme()` | String | Get actual theme ("light" or "dark") |
| `getSystemTheme()` | String | Get system preference |

**Usage**:
```javascript
const provider = document.querySelector('pan-theme-provider');
provider.setTheme('dark');
console.log(provider.getEffectiveTheme());  // "dark"
```

### Events

- **DOM**: `theme-change` - Detail: `{ theme, effective }`
- **PAN**: `theme.changed` - Data: `{ theme, effective }`
- **PAN**: `theme.system-changed` - Data: `{ theme }`

### Complete Example

```javascript
class ThemedApp extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    // Subscribe to theme changes
    this.unsubscribe = bus.subscribe('theme.changed', (msg) => {
      this.applyTheme(msg.data.effective);
    });

    // Get initial theme
    const provider = document.querySelector('pan-theme-provider');
    if (provider) {
      this.applyTheme(provider.getEffectiveTheme());
    }

    // Persist preference
    bus.subscribe('theme.changed', (msg) => {
      localStorage.setItem('theme', msg.data.theme);
    });
  }

  applyTheme(theme) {
    this.className = `app theme-${theme}`;
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

customElements.define('themed-app', ThemedApp);
```

### Common Issues

**Theme not applying**: Define CSS variables for both `[data-theme="light"]` and `[data-theme="dark"]`
**Flash on load**: Set theme in inline `<script>` before loading components
**Not updating**: Subscribe to `theme.changed` in `connectedCallback()`

### Errors

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| Invalid theme value | `setTheme()` called with invalid value | Use "light", "dark", or "auto" only |
| `matchMedia` not supported | Old browser | Provide polyfill or default to "light" |
| localStorage quota | Storage full | Clear old data or use memory-only mode |

**Error handling example**:
```javascript
const provider = document.querySelector('pan-theme-provider');

try {
  provider.setTheme('custom'); // Invalid!
} catch (e) {
  console.error('Theme error:', e.message);
  // Fallback to auto
  provider.setTheme('auto');
}
```

**Exceptions thrown**:
- `TypeError`: Invalid theme value passed to `setTheme()`
- `DOMException`: localStorage access denied (privacy mode)

---

## pan-theme-toggle

**Purpose**: UI control for theme switching
**Import**: `<script type="module" src="/ui/pan-theme-toggle.mjs"></script>`

### Quick Example

```html
<pan-theme-toggle></pan-theme-toggle>
<pan-theme-toggle variant="button" label="Theme"></pan-theme-toggle>
<pan-theme-toggle variant="dropdown"></pan-theme-toggle>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | String | "" | Text label (button variant only) |
| `variant` | String | "icon" | Style: "icon", "button", or "dropdown" |

### Complete Example

```html
<nav class="toolbar">
  <h1>My App</h1>
  <div class="actions">
    <button>Settings</button>
    <pan-theme-toggle></pan-theme-toggle>
  </div>
</nav>

<style>
  .toolbar {
    display: flex;
    justify-content: space-between;
    padding: 1rem;
    background: var(--surface);
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
</style>
```

### Common Issues

**Not working**: Ensure `pan-theme-provider` exists
**Wrong icon**: Component subscribes on connect; add after `pan:sys.ready`
**Dropdown positioning**: Wrap in `position: relative` container

### Errors

| Error Condition | Cause | Resolution |
|-----------------|-------|------------|
| Provider not found | `pan-theme-provider` missing | Add `<pan-theme-provider>` to page |
| Invalid variant | Unsupported `variant` attribute | Use "icon", "button", or "dropdown" |
| Event not dispatched | pan-bus not ready | Wait for `pan:sys.ready` or add toggle after bus loads |

**Error handling example**:
```javascript
// Ensure provider exists
window.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('pan-theme-toggle');
  const provider = document.querySelector('pan-theme-provider');

  if (!provider) {
    console.warn('pan-theme-toggle requires pan-theme-provider');
    // Add provider dynamically
    const newProvider = document.createElement('pan-theme-provider');
    document.body.prepend(newProvider);
  }
});
```

**Exceptions thrown**: None (component fails gracefully without provider)

---

## pan-routes

**Purpose**: Runtime-configurable message routing
**Import**: Enabled via `<pan-bus enable-routing="true"></pan-bus>`
**Access**: `window.pan.routes` or `bus.routingManager`

### Quick Example

```javascript
const routes = window.pan.routes;

// Add route
routes.add({
  name: 'Login redirect',
  match: { type: 'user.login.success' },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'ui.navigate', data: { to: '/dashboard' } }
    }
  ]
});
```

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `add(route)` | route: Object | Object | Add route (returns route with ID) |
| `update(id, patch)` | id: String, patch: Object | Object | Update route |
| `remove(id)` | id: String | Boolean | Remove route |
| `enable(id)` / `disable(id)` | id: String | - | Enable/disable route |
| `get(id)` | id: String | Object? | Get route by ID |
| `list(filter?)` | filter?: Object | Array | List routes |
| `clear()` | - | - | Remove all routes |
| `registerTransformFn(id, fn)` | id: String, fn: Function | - | Register transform |
| `registerHandler(id, fn)` | id: String, fn: Function | - | Register handler |
| `getStats()` | - | Object | Get statistics |
| `resetStats()` | - | - | Reset statistics |
| `setEnabled(bool)` | enabled: Boolean | - | Enable/disable routing |
| `onRoutesChanged(fn)` | fn: Function | Function | Subscribe to changes (returns unsub) |
| `onError(fn)` | fn: Function | Function | Subscribe to errors (returns unsub) |

### Route Configuration

```javascript
{
  id: String,           // Optional (auto-generated)
  name: String,         // Required
  enabled: Boolean,     // Default: true
  order: Number,        // Default: 0 (execution order)
  match: {             // Match criteria
    type: String|Array,     // Message type(s)
    topic: String|Array,    // Topic pattern(s)
    source: String|Array,   // Source client(s)
    tagsAny: Array,        // Has any tag
    tagsAll: Array,        // Has all tags
    where: Object          // Predicate (see below)
  },
  transform: Object,    // Optional transform
  actions: Array,       // Actions to perform
  meta: Object         // Optional metadata
}
```

### Match Predicates

Operators: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `regex`, `and`, `or`, `not`

```javascript
// Simple
where: { op: 'gt', path: 'payload.temp', value: 30 }

// Regex
where: { op: 'regex', path: 'payload.email', value: '^[\\w-]+@' }

// Combined
where: {
  op: 'and',
  children: [
    { op: 'eq', path: 'payload.status', value: 'active' },
    { op: 'gt', path: 'payload.score', value: 75 }
  ]
}
```

### Transform Operations

```javascript
// Identity (no change)
transform: { op: 'identity' }

// Pick fields
transform: {
  op: 'pick',
  paths: ['payload.userId', 'meta.timestamp']
}

// Map with function (register first)
routes.registerTransformFn('double', (x) => x * 2);
transform: { op: 'map', path: 'payload.value', fnId: 'double' }

// Custom (register first)
routes.registerTransformFn('custom', (msg) => ({ ...msg, payload: {} }));
transform: { op: 'custom', fnId: 'custom' }
```

### Actions

```javascript
// EMIT - Publish new message
{
  type: 'EMIT',
  message: { topic: 'new.topic', data: {} },
  inherit: ['payload', 'meta']
}

// FORWARD - Forward to different topic
{
  type: 'FORWARD',
  topic: 'new.topic',
  typeOverride: 'new.type'  // Optional
}

// LOG - Console log
{
  type: 'LOG',
  level: 'info',  // 'log', 'info', 'warn', 'error'
  template: 'User {{payload.id}} action'
}

// CALL - Call registered handler
{
  type: 'CALL',
  handlerId: 'myHandler'
}
```

### Complete Example

```javascript
const routes = window.pan.routes;

// Register handlers
routes.registerHandler('notifyAdmin', async (msg) => {
  await fetch('/api/admin/notify', {
    method: 'POST',
    body: JSON.stringify(msg)
  });
});

routes.registerTransformFn('sanitize', (email) => {
  return email.toLowerCase().trim();
});

// Workflow: Registration -> Validation -> Welcome
routes.add({
  name: 'User registration workflow',
  order: 0,
  match: { type: 'user.register' },
  transform: {
    op: 'map',
    path: 'payload.email',
    fnId: 'sanitize'
  },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'email.validate' },
      inherit: ['payload']
    }
  ]
});

routes.add({
  name: 'Email validated -> Welcome',
  order: 10,
  match: { type: 'email.validated' },
  actions: [
    {
      type: 'EMIT',
      message: {
        topic: 'email.send',
        data: { template: 'welcome' }
      },
      inherit: ['payload']
    }
  ]
});

// Log high-value transactions
routes.add({
  name: 'High-value transaction alert',
  match: {
    type: 'transaction.complete',
    where: { op: 'gt', path: 'payload.amount', value: 1000 }
  },
  actions: [
    {
      type: 'LOG',
      level: 'warn',
      template: 'High-value: ${{payload.amount}}'
    },
    {
      type: 'CALL',
      handlerId: 'notifyAdmin'
    }
  ]
});

// Filter invalid sensor data
routes.add({
  name: 'Filter sensor readings',
  match: {
    type: 'sensor.reading',
    where: {
      op: 'and',
      children: [
        { op: 'gte', path: 'payload.temp', value: -40 },
        { op: 'lte', path: 'payload.temp', value: 85 }
      ]
    }
  },
  transform: {
    op: 'pick',
    paths: ['payload.temp', 'meta.sensorId']
  },
  actions: [
    { type: 'FORWARD', topic: 'sensor.valid' }
  ]
});

// Get stats
console.log(routes.getStats());
// {
//   routesEvaluated: 150,
//   routesMatched: 45,
//   actionsExecuted: 67,
//   errors: 0,
//   routeCount: 4,
//   enabledRouteCount: 4
// }
```

### Common Issues

**Routes not firing**: Enable routing with `<pan-bus enable-routing="true">`
**Wrong matches**: Enable debug mode: `<pan-bus debug="true">`
**Transform not found**: Register functions before adding routes
**Wrong order**: Set explicit `order` property (lower executes first)

### Errors

Subscribe to errors using `onError()`:

| Error Type | Cause | Resolution |
|------------|-------|------------|
| `INVALID_ROUTE` | Missing required fields (`name`, `match`, or `actions`) | Provide all required fields in route config |
| `ROUTE_NOT_FOUND` | `update()` or `remove()` with invalid ID | Check route exists with `get(id)` first |
| `PREDICATE_ERROR` | Invalid `where` operator or structure | Use supported operators: `eq`, `gt`, `lt`, `in`, `regex`, `and`, `or`, `not` |
| `TRANSFORM_ERROR` | Transform function threw exception | Fix transform function or handle errors within it |
| `TRANSFORM_NOT_FOUND` | `fnId` not registered | Call `registerTransformFn(id, fn)` before using |
| `ACTION_ERROR` | Action execution failed | Check action configuration and registered handlers |
| `HANDLER_NOT_FOUND` | `CALL` action with unregistered handler | Call `registerHandler(id, fn)` before using |

**Error handling example**:
```javascript
const routes = window.pan.routes;

// Subscribe to errors
const unsubscribe = routes.onError((error) => {
  console.error('Route error:', error);

  // Handle specific errors
  switch (error.code) {
    case 'TRANSFORM_ERROR':
      // Disable problematic route
      routes.disable(error.routeId);
      notifyAdmin('Route failed', error);
      break;

    case 'HANDLER_NOT_FOUND':
      // Register missing handler
      routes.registerHandler(error.handlerId, fallbackHandler);
      break;
  }
});

// Validate route before adding
try {
  routes.add({
    name: 'My Route',
    match: { type: 'test' },
    actions: [{ type: 'LOG', level: 'info', template: 'Test' }]
  });
} catch (e) {
  console.error('Failed to add route:', e.message);
}
```

**Exceptions thrown**:
- `Error`: Invalid route configuration (missing required fields)
- `TypeError`: Invalid parameters (e.g., non-function handler)
- `RangeError`: Invalid `order` value

---

## Summary

This chapter documented LARC's four core components:

- **pan-bus**: Message bus infrastructure for pub/sub communication
- **pan-theme-provider**: Centralized theme management
- **pan-theme-toggle**: UI controls for theme switching
- **pan-routes**: Message routing for workflows and orchestration

These form the backbone of every LARC application.

**See Also**:
- Tutorial: *Learning LARC* Chapters 4-5
- State components: Chapter 18
- UI components: Chapter 19
- Message patterns: Appendix A
- Configuration: Appendix C
