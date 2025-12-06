# Appendix C: Configuration Options

This appendix provides a comprehensive reference for all configuration options available in LARC, from PAN bus settings to component configuration, global defaults, and environment variables. These settings control performance characteristics, security policies, feature flags, and operational behavior.

## PAN Bus Configuration

The `<pan-bus>` element accepts configuration through HTML attributes. These settings control the bus's behavior, resource limits, and enabled features.

### Attribute Reference

#### max-retained

**Type:** Integer
**Default:** `1000`
**Range:** `1` to `100000`
**Purpose:** Maximum number of retained messages stored by the bus.

When this limit is exceeded, the bus evicts the least recently accessed retained message (LRU eviction).

```html
<pan-bus max-retained="5000"></pan-bus>
```

**Use Cases:**
- Small apps with minimal state: `100-500`
- Medium apps: `1000-2000` (default: `1000`)
- Large apps with extensive state: `5000-10000`

**Performance Impact:**
- Higher values: More memory usage, slower eviction checks
- Lower values: Less memory, faster eviction, more message loss

**Monitoring:**
```javascript
const stats = await client.request('pan:sys.stats', {});
console.log('Retained:', stats.data.retained);
console.log('Evicted:', stats.data.retainedEvicted);
```

#### max-message-size

**Type:** Integer
**Default:** `1048576` (1MB)
**Range:** `1024` to `10485760` (1KB to 10MB)
**Purpose:** Maximum total size of a message envelope in bytes.

Includes all fields: topic, data, headers, id, ts, etc.

```html
<pan-bus max-message-size="2097152"></pan-bus>
```

**Recommendations:**
- Default `1048576` (1MB) suitable for most apps
- Increase for apps with large payloads (analytics, file metadata)
- Decrease for memory-constrained environments (IoT, embedded)

**Enforcement:**
```javascript
// Message rejected if too large
{
  topic: 'pan:sys.error',
  data: {
    code: 'MESSAGE_INVALID',
    message: 'Message size (2000000 bytes) exceeds limit (1048576 bytes)'
  }
}
```

#### max-payload-size

**Type:** Integer
**Default:** `524288` (512KB)
**Range:** `1024` to `5242880` (1KB to 5MB)
**Purpose:** Maximum size of message `data` field in bytes.

Separate limit for payload to prevent large data objects from consuming resources.

```html
<pan-bus max-payload-size="1048576"></pan-bus>
```

**Relationship to max-message-size:**
```
max-payload-size <= max-message-size
```

**Best Practice:**
Set `max-payload-size` to 50-70% of `max-message-size` to leave room for headers and metadata.

#### cleanup-interval

**Type:** Integer
**Default:** `30000` (30 seconds)
**Range:** `1000` to `300000` (1s to 5min)
**Purpose:** Interval in milliseconds between automatic cleanup cycles.

The bus periodically removes dead subscriptions (components removed from DOM) and stale rate limit data.

```html
<pan-bus cleanup-interval="60000"></pan-bus>
```

**Tuning:**
- Frequent cleanup (10-20s): Lower memory, higher CPU
- Infrequent cleanup (60-120s): Higher memory, lower CPU
- Default (30s): Balanced

**Monitoring:**
```javascript
const stats = await client.request('pan:sys.stats', {});
console.log('Cleaned up:', stats.data.subsCleanedUp);
```

#### rate-limit

**Type:** Integer
**Default:** `1000`
**Range:** `1` to `100000`
**Purpose:** Maximum messages per client per rate limit window.

Prevents a single client from overwhelming the bus.

```html
<pan-bus rate-limit="5000"></pan-bus>
```

**Calculation:**
```
messages_per_second = rate-limit / (rate-limit-window / 1000)

Default: 1000 / (1000 / 1000) = 1000 messages/second
```

**Rate Limit Exceeded:**
```javascript
// Message rejected
{
  topic: 'pan:sys.error',
  data: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many messages',
    details: { clientId: 'user-list#abc123' }
  }
}
```

**Recommendations:**
- Development: `1000-5000` (relaxed)
- Production: `1000-2000` (default)
- High-throughput apps: `5000-10000`

#### rate-limit-window

**Type:** Integer
**Default:** `1000` (1 second)
**Range:** `100` to `60000` (100ms to 1min)
**Purpose:** Time window in milliseconds for rate limiting.

Works together with `rate-limit` to determine messages per time window.

```html
<pan-bus rate-limit="2000" rate-limit-window="2000"></pan-bus>
```

This allows 2000 messages per 2 seconds = 1000 messages/second.

#### allow-global-wildcard

**Type:** Boolean
**Default:** `true`
**Purpose:** Allow or disallow global wildcard (`*`) subscriptions.

Global wildcard subscriptions match every message in the system. Disabling can improve security and performance.

```html
<pan-bus allow-global-wildcard="false"></pan-bus>
```

**When Disabled:**
```javascript
// Subscription rejected
client.subscribe('*', handler);
// Error: Global wildcard (*) subscriptions are disabled for security
```

**Recommendations:**
- Development: `true` (useful for debugging)
- Production: `false` (security/performance)

#### debug

**Type:** Boolean
**Default:** `false`
**Purpose:** Enable detailed console logging of bus operations.

```html
<pan-bus debug="true"></pan-bus>
```

**Output Examples:**
```
[PAN Bus] PAN Bus Enhanced ready { maxRetained: 1000, ... }
[PAN Bus] Client registered { id: 'user-list#abc', caps: ['client'] }
[PAN Bus] Subscription added { pattern: 'users.*', clientId: 'user-list#abc' }
[PAN Bus] Published { topic: 'users.updated', delivered: 3, routes: 0 }
[PAN Bus] Cleaned up 2 dead subscriptions
```

**Performance Impact:** Minimal (logging is cheap), but avoid in production.

#### enable-routing

**Type:** Boolean
**Default:** `false`
**Purpose:** Enable the advanced routing system for message transformation and filtering.

```html
<pan-bus enable-routing="true"></pan-bus>
```

**Features Enabled:**
- Declarative routing rules
- Message transformation
- Message filtering
- Topic aliasing
- Conditional routing

**Access Routing API:**
```javascript
// Routes available at window.pan.routes
window.pan.routes.add({
  name: 'user-events-to-analytics',
  match: 'users.item.*',
  transform: (msg) => ({
    topic: 'analytics.event',
    data: { entity: 'user', action: msg.topic, ...msg.data }
  })
});
```

**Performance Impact:** Slight overhead per message for route matching.

#### enable-tracing

**Type:** Boolean
**Default:** `false`
**Purpose:** Enable message tracing for debugging and monitoring.

```html
<pan-bus enable-tracing="true"></pan-bus>
```

**Features Enabled:**
- Message flow visualization
- Delivery tracking
- Route matching logs
- Performance metrics

**Access Tracing API:**
```javascript
// Debug manager available at window.pan.debug
const traces = window.pan.debug.getTraces();
console.log('Recent traces:', traces);
```

### Complete Configuration Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
</head>
<body>
  <pan-bus
    max-retained="2000"
    max-message-size="2097152"
    max-payload-size="1048576"
    cleanup-interval="60000"
    rate-limit="5000"
    rate-limit-window="1000"
    allow-global-wildcard="false"
    debug="false"
    enable-routing="false"
    enable-tracing="false">
  </pan-bus>

  <my-app></my-app>
</body>
</html>
```

## PanClient Configuration

The `PanClient` class accepts configuration through constructor parameters and method options.

### Constructor Options

```javascript
new PanClient(host?, busSelector?)
```

#### host

**Type:** `HTMLElement | Document`
**Default:** `document`
**Purpose:** Element to dispatch/receive events from.

```javascript
// Default: document-level client
const client = new PanClient();

// Component-scoped client
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
  }
}
```

**Use Cases:**
- Document-level (`document`): Most common, global communication
- Component-scoped (element): Isolated communication within subtree

#### busSelector

**Type:** `string`
**Default:** `'pan-bus'`
**Purpose:** CSS selector for bus element.

```javascript
// Default selector
const client = new PanClient(document, 'pan-bus');

// Custom selector
const client = new PanClient(document, '#my-custom-bus');
```

Rarely needed unless using multiple buses or custom naming.

### Subscription Options

```javascript
client.subscribe(topics, handler, options?)
```

#### retained

**Type:** `boolean`
**Default:** `false`
**Purpose:** Receive retained messages immediately upon subscription.

```javascript
// Get current state immediately
client.subscribe('app.theme.state', (msg) => {
  applyTheme(msg.data);
}, { retained: true });
```

**Behavior:**
- `true`: Receives retained message immediately (if exists), then future messages
- `false`: Only receives messages published after subscription

#### signal

**Type:** `AbortSignal`
**Default:** `undefined`
**Purpose:** Automatically unsubscribe when signal is aborted.

```javascript
const controller = new AbortController();

client.subscribe('users.*', handler, {
  signal: controller.signal
});

// Later: unsubscribe all at once
controller.abort();
```

**Use Case:** Clean up multiple subscriptions with single abort.

### Request Options

```javascript
client.request(topic, data, options?)
```

#### timeoutMs

**Type:** `number`
**Default:** `5000` (5 seconds)
**Range:** `100` to `300000` (100ms to 5min)
**Purpose:** Maximum time to wait for reply before timeout error.

```javascript
// Default timeout
const response = await client.request('users.item.get', { id: 123 });

// Custom timeout
const response = await client.request('slow.operation', { ... }, {
  timeoutMs: 30000  // 30 seconds
});
```

**Timeout Error:**
```javascript
try {
  await client.request('users.item.get', { id: 123 }, { timeoutMs: 1000 });
} catch (err) {
  console.error(err.message);  // "PAN request timeout"
}
```

**Recommendations:**
- Fast queries: `1000-2000ms`
- Standard requests: `5000ms` (default)
- Slow operations: `10000-30000ms`
- Long-running tasks: Consider async pattern instead

## Component Configuration

LARC components can be configured through attributes, properties, and data attributes.

### Standard Attributes

Most LARC components follow these conventions:

#### data-* Attributes

Use for configuration and initial values:

```html
<pan-user-list
  data-page-size="50"
  data-sort="name-asc"
  data-filter="active">
</pan-user-list>
```

#### Boolean Attributes

Use presence/absence for boolean flags:

```html
<!-- Feature enabled -->
<pan-data-grid sortable filterable paginated></pan-data-grid>

<!-- Feature disabled -->
<pan-data-grid></pan-data-grid>
```

#### Value Attributes

Use for string/number values:

```html
<pan-modal
  size="large"
  position="center"
  backdrop="true">
</pan-modal>
```

### Component-Specific Configuration

Configuration varies by component. Refer to component documentation for specifics.

**Example: pan-storage**

```html
<pan-storage
  key="my-app-state"
  storage="localStorage"
  sync="true"
  debounce="1000">
</pan-storage>
```

**Example: pan-routes**

```html
<pan-routes
  base-path="/app"
  hash-routing="false"
  scroll-restoration="true">
</pan-routes>
```

## Global Configuration

Global configuration affects all LARC components and clients.

### Window Configuration

Configure LARC globally before bus initialization:

```html
<script>
window.LARC_CONFIG = {
  bus: {
    maxRetained: 2000,
    debug: false
  },
  defaults: {
    requestTimeout: 10000,
    retainedSubscription: true
  }
};
</script>

<pan-bus></pan-bus>
```

**Note:** This is a proposed pattern. Current implementation uses attributes only.

### Feature Flags

Control experimental or optional features:

```javascript
window.LARC_FEATURES = {
  routing: false,
  tracing: false,
  devtools: true
};
```

## Environment Variables

For build-time configuration, use environment variables:

### NODE_ENV

**Values:** `development` | `production` | `test`
**Purpose:** Affects default behavior and optimizations.

```bash
NODE_ENV=production npm run build
```

**Impact:**
- `development`: Debug logging, dev warnings, relaxed limits
- `production`: Optimized, no debug output, strict limits
- `test`: Test-specific behavior, mocked services

### LARC_DEBUG

**Values:** `true` | `false`
**Purpose:** Override debug mode regardless of NODE_ENV.

```bash
LARC_DEBUG=true npm start
```

### LARC_MAX_RETAINED

**Values:** Integer
**Purpose:** Override default max retained messages.

```bash
LARC_MAX_RETAINED=5000 npm start
```

### LARC_RATE_LIMIT

**Values:** Integer
**Purpose:** Override default rate limit.

```bash
LARC_RATE_LIMIT=10000 npm start
```

## Configuration Profiles

Recommended configuration profiles for different scenarios:

### Development Profile

**Focus:** Developer experience, debugging, relaxed limits

```html
<pan-bus
  max-retained="500"
  max-message-size="1048576"
  max-payload-size="524288"
  cleanup-interval="30000"
  rate-limit="10000"
  allow-global-wildcard="true"
  debug="true"
  enable-routing="false"
  enable-tracing="true">
</pan-bus>
```

### Production Profile

**Focus:** Performance, security, resource limits

```html
<pan-bus
  max-retained="2000"
  max-message-size="1048576"
  max-payload-size="524288"
  cleanup-interval="60000"
  rate-limit="2000"
  allow-global-wildcard="false"
  debug="false"
  enable-routing="false"
  enable-tracing="false">
</pan-bus>
```

### High-Throughput Profile

**Focus:** Maximum message volume, relaxed limits

```html
<pan-bus
  max-retained="5000"
  max-message-size="2097152"
  max-payload-size="1048576"
  cleanup-interval="120000"
  rate-limit="10000"
  rate-limit-window="1000"
  allow-global-wildcard="false"
  debug="false"
  enable-routing="true"
  enable-tracing="false">
</pan-bus>
```

### Memory-Constrained Profile

**Focus:** Minimal memory footprint

```html
<pan-bus
  max-retained="100"
  max-message-size="262144"
  max-payload-size="131072"
  cleanup-interval="15000"
  rate-limit="500"
  allow-global-wildcard="false"
  debug="false"
  enable-routing="false"
  enable-tracing="false">
</pan-bus>
```

### Testing Profile

**Focus:** Predictable behavior, fast cleanup

```html
<pan-bus
  max-retained="50"
  max-message-size="1048576"
  max-payload-size="524288"
  cleanup-interval="5000"
  rate-limit="1000"
  allow-global-wildcard="true"
  debug="true"
  enable-routing="false"
  enable-tracing="true">
</pan-bus>
```

## Runtime Configuration

Some settings can be changed at runtime through the bus API.

### Get Current Configuration

```javascript
const stats = await client.request('pan:sys.stats', {});
console.log('Config:', stats.data.config);
```

### Clear Retained Messages

```javascript
// Clear all retained messages
client.publish({
  topic: 'pan:sys.clear-retained',
  data: {}
});

// Clear matching pattern
client.publish({
  topic: 'pan:sys.clear-retained',
  data: { pattern: 'users.*' }
});
```

### Get Statistics

```javascript
const stats = await client.request('pan:sys.stats', {});

console.log({
  published: stats.data.published,
  delivered: stats.data.delivered,
  dropped: stats.data.dropped,
  retained: stats.data.retained,
  retainedEvicted: stats.data.retainedEvicted,
  subsCleanedUp: stats.data.subsCleanedUp,
  errors: stats.data.errors,
  subscriptions: stats.data.subscriptions,
  clients: stats.data.clients
});
```

## Configuration Best Practices

### Start Conservative

Begin with default settings:

```html
<pan-bus></pan-bus>
```

Monitor with stats, adjust only when needed.

### Monitor and Tune

```javascript
// Periodic monitoring
setInterval(async () => {
  const stats = await client.request('pan:sys.stats', {});

  console.log('Bus Health:', {
    retained: `${stats.data.retained} / ${stats.data.config.maxRetained}`,
    dropped: stats.data.dropped,
    errors: stats.data.errors
  });

  // Alert if approaching limits
  if (stats.data.retained > stats.data.config.maxRetained * 0.8) {
    console.warn('Retained messages approaching limit');
  }
}, 60000);
```

### Environment-Specific Configuration

Use different profiles per environment:

```javascript
// config.js
export function getBusConfig() {
  if (process.env.NODE_ENV === 'production') {
    return {
      maxRetained: 2000,
      debug: false,
      rateLimit: 2000
    };
  }

  return {
    maxRetained: 500,
    debug: true,
    rateLimit: 10000
  };
}
```

```html
<script type="module">
import { getBusConfig } from './config.js';

const config = getBusConfig();

document.querySelector('pan-bus').setAttribute('max-retained', config.maxRetained);
document.querySelector('pan-bus').setAttribute('debug', config.debug);
document.querySelector('pan-bus').setAttribute('rate-limit', config.rateLimit);
</script>
```

### Document Your Configuration

```html
<!--
  PAN Bus Configuration

  Environment: Production
  Profile: High-availability

  max-retained: 2000
    - Expected state topics: ~500
    - Headroom: 4x expected

  rate-limit: 2000
    - Expected peak load: 1000 msg/s
    - Headroom: 2x peak

  Last tuned: 2024-11-01
  Next review: 2024-12-01
-->
<pan-bus
  max-retained="2000"
  rate-limit="2000"
  debug="false">
</pan-bus>
```

## Configuration Checklist

**Pre-Launch:**
- [ ] `debug="false"` in production
- [ ] `allow-global-wildcard="false"` for security
- [ ] `max-retained` appropriate for app state volume
- [ ] `rate-limit` appropriate for expected load
- [ ] Monitoring enabled for bus statistics
- [ ] Configuration documented in code comments

**Performance Tuning:**
- [ ] Monitor `retained` approaching `maxRetained`
- [ ] Monitor `dropped` messages (rate limiting)
- [ ] Monitor `errors` (validation, size limits)
- [ ] Monitor `subsCleanedUp` (memory leaks?)
- [ ] Adjust limits based on observed usage

**Security:**
- [ ] Global wildcard disabled in production
- [ ] Rate limits prevent DoS
- [ ] Message size limits prevent memory exhaustion
- [ ] Debug mode disabled in production

## Summary

**PAN Bus Core Settings:**
- `max-retained` - Retained message limit (default: 1000)
- `max-message-size` - Total message size limit (default: 1MB)
- `max-payload-size` - Payload size limit (default: 512KB)
- `cleanup-interval` - Cleanup cycle interval (default: 30s)
- `rate-limit` - Messages per window (default: 1000)
- `allow-global-wildcard` - Allow `*` subscriptions (default: true)
- `debug` - Enable debug logging (default: false)

**PAN Bus Features:**
- `enable-routing` - Enable routing system (default: false)
- `enable-tracing` - Enable message tracing (default: false)

**PanClient Settings:**
- `host` - Event dispatch element (default: document)
- `busSelector` - Bus element selector (default: 'pan-bus')
- `retained` - Receive retained messages (default: false)
- `timeoutMs` - Request timeout (default: 5000ms)

**Recommended Profiles:**
- Development: Debug enabled, relaxed limits
- Production: Debug disabled, strict limits
- High-throughput: Increased limits, routing enabled
- Memory-constrained: Minimal retained, frequent cleanup
- Testing: Fast cleanup, debug enabled

**Monitoring:**
- Use `pan:sys.stats` to monitor bus health
- Alert on approaching limits
- Tune based on observed behavior
- Document configuration decisions

For message envelope structure, see Appendix B. For topic conventions, see Appendix A.
