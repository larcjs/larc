# LARC API Reference

> Comprehensive API documentation for LARC (Lightweight Autonomous Reactive Components)

## Table of Contents

- [Getting Started](#getting-started)
- [Core Package (@larcjs/core)](#core-package-larcjscore)
  - [PAN Autoloader](#pan-autoloader)
  - [PAN Bus](#pan-bus)
  - [PAN Client](#pan-client)
- [Configuration](#configuration)
- [Events Reference](#events-reference)
- [TypeScript Support](#typescript-support)
- [Best Practices](#best-practices)
- [Common Pitfalls](#common-pitfalls)

---

## Getting Started

### Installation

LARC can be used in two ways:

**1. Local Development (Zero Build)**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
</head>
<body>
  <!-- Load autoloader -->
  <script type="module" src="/core/pan.mjs"></script>

  <!-- Use components - they load automatically -->
  <my-widget></my-widget>
  <pan-card>Hello World</pan-card>
</body>
</html>
```

**2. CDN Usage**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
</head>
<body>
  <!-- Configure for CDN -->
  <script type="module">
    window.panAutoload = {
      baseUrl: 'https://unpkg.com/@larcjs/core@latest/',
      extension: '.js'
    };
  </script>

  <!-- Load autoloader from CDN -->
  <script type="module" src="https://unpkg.com/@larcjs/core@latest/src/pan.mjs"></script>

  <!-- Components load from CDN -->
  <my-widget></my-widget>
</body>
</html>
```

### Quick Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>Counter Demo</title>
</head>
<body>
  <script type="module" src="/core/pan.mjs"></script>

  <!-- Create a simple counter component -->
  <script type="module">
    import { PanClient } from '/core/pan-client.mjs';

    class CounterElement extends HTMLElement {
      constructor() {
        super();
        this.count = 0;
        this.client = new PanClient(this);
      }

      async connectedCallback() {
        await this.client.ready();

        // Subscribe to counter updates
        this.client.subscribe('counter.value', (msg) => {
          this.count = msg.data;
          this.render();
        }, { retained: true });

        this.render();

        // Publish initial value
        this.client.publish({
          topic: 'counter.value',
          data: this.count,
          retain: true
        });
      }

      increment() {
        this.count++;
        this.client.publish({
          topic: 'counter.value',
          data: this.count,
          retain: true
        });
      }

      render() {
        this.innerHTML = `
          <div>
            <h2>Count: ${this.count}</h2>
            <button onclick="this.parentElement.parentElement.increment()">
              Increment
            </button>
          </div>
        `;
      }
    }

    customElements.define('x-counter', CounterElement);
  </script>

  <x-counter></x-counter>
</body>
</html>
```

---

## Core Package (@larcjs/core)

The core package provides three main APIs:

1. **PAN Autoloader** - Automatic component loading
2. **PAN Bus** - Message bus for pub/sub communication
3. **PAN Client** - Simplified API for components

---

## PAN Autoloader

The autoloader automatically discovers and loads Web Components as they appear in the DOM, eliminating manual imports and `customElements.define()` calls.

### Overview

- Progressive loading with IntersectionObserver
- Automatic component discovery via MutationObserver
- Configurable paths and file extensions
- Support for custom component resolvers
- Zero-build development workflow

### Configuration

#### AutoloadConfig Interface

```typescript
interface AutoloadConfig {
  baseUrl?: string | null;        // Full CDN URL (e.g., 'https://unpkg.com/pan@latest/')
  componentsPath?: string;        // Relative path from baseUrl (default: './')
  extension?: string;             // File extension (default: '.mjs')
  rootMargin?: number;            // IntersectionObserver margin in px (default: 600)
  resolvedComponentsPath?: string; // Computed full path (readonly)
}
```

#### Configuration Examples

**Local Development**

```javascript
// Default configuration works out of the box
// Components loaded from ./components/ relative to pan.mjs
```

**CDN Usage**

```html
<script type="module">
  window.panAutoload = {
    baseUrl: 'https://unpkg.com/@larcjs/core@2.0.0/',
    componentsPath: 'src/components/',
    extension: '.js'
  };
</script>
<script type="module" src="https://unpkg.com/@larcjs/core@2.0.0/src/pan.mjs"></script>
```

**Custom Component Resolver**

```javascript
window.panAutoload = {
  resolveComponent(tagName) {
    // Custom logic to resolve component paths
    if (tagName.startsWith('my-')) {
      return `/custom/${tagName}.mjs`;
    }
    return null; // Use default resolution
  }
};
```

**Component Path Mapping**

```javascript
window.panAutoload = {
  componentPaths: {
    'my-widget': '/components/custom/widget.mjs',
    'special-card': '/vendor/card-component.mjs'
  }
};
```

### API Methods

#### `maybeLoadFor(el: HTMLElement): Promise<void>`

Manually loads a component module for a specific element.

**Parameters:**
- `el` (HTMLElement) - Element to load component for

**Returns:** Promise that resolves when loading completes or skips

**Example:**

```javascript
import { maybeLoadFor } from '/core/pan.mjs';

// Create element
const widget = document.createElement('my-widget');
document.body.appendChild(widget);

// Manually load component
await maybeLoadFor(widget);
// Component is now loaded and defined
```

**Notes:**
- Usually not needed - autoloader handles this automatically
- Checks if element is a custom tag (has dash in name)
- Prevents duplicate loads
- Auto-defines element if module exports a default class
- Errors are logged to console but don't throw

---

#### `observeTree(root?: Document | Element): void`

Observes a DOM tree for undefined custom elements and sets up progressive loading.

**Parameters:**
- `root` (Document | Element, optional) - Root element to observe. Defaults to `document`

**Returns:** void

**Example:**

```javascript
import { observeTree } from '/core/pan.mjs';

// Observe entire document (default)
observeTree();

// Observe specific subtree
const container = document.querySelector('#dynamic-content');
observeTree(container);

// Useful for dynamically added content
function addDynamicContent() {
  const div = document.createElement('div');
  div.innerHTML = '<my-widget></my-widget><another-component></another-component>';
  document.body.appendChild(div);

  // Ensure new components are observed
  observeTree(div);
}
```

**Notes:**
- Automatically called for `document` on initialization
- Finds all `:not(:defined)` elements
- Sets up IntersectionObserver for progressive loading
- Prevents duplicate observation with WeakSet
- Falls back to immediate loading if IntersectionObserver unavailable

---

#### `panAutoload` Object

Global API exposed on `window.panAutoload` and as module export.

**Properties:**

```typescript
{
  config: AutoloadConfig;           // Active configuration
  observeTree: Function;            // Manual tree observation
  maybeLoadFor: Function;           // Manual component loading
}
```

**Example:**

```javascript
// Access configuration
console.log(window.panAutoload.config);

// Manually observe new content
const newSection = document.querySelector('#ajax-loaded-content');
window.panAutoload.observeTree(newSection);

// Manually load component
const element = document.createElement('my-component');
await window.panAutoload.maybeLoadFor(element);
```

---

### Custom Module Path Override

Use the `data-module` attribute to override the default module path for a specific element:

```html
<!-- Default: loads from ./my-card.mjs -->
<my-card></my-card>

<!-- Override: loads from custom path -->
<my-card data-module="/custom/path/special-card.mjs"></my-card>
```

---

### How It Works

1. **Initialization**
   - Pan-bus is loaded first (backbone of messaging)
   - MutationObserver watches for new elements
   - IntersectionObserver set up for progressive loading

2. **Element Discovery**
   - All elements with dash in tag name are candidates
   - Checks if element is already defined in `customElements`
   - Adds to observation queue if undefined

3. **Progressive Loading**
   - Elements near viewport (600px margin by default) are loaded
   - As user scrolls, more components load automatically
   - Prevents loading off-screen components unnecessarily

4. **Module Loading**
   - Constructs module URL from tag name
   - Dynamically imports the module
   - Auto-defines element if module exports default class
   - Prevents duplicate loads with Set tracking

---

## PAN Bus

The central message bus for publish/subscribe communication between components. Provides memory-safe, secure message delivery with advanced features.

> **Note:** As of v1.1.1, the PAN bus is **automatically instantiated** when you load `pan.mjs`. You no longer need to include a `<pan-bus>` element in your HTML. The bus is created and ready to use as soon as the script loads.

### Overview

- Publish/subscribe messaging with topic patterns
- Retained messages with LRU eviction
- Memory-bounded message store
- Rate limiting per publisher
- Message size validation
- Automatic cleanup of dead subscriptions
- Debug mode with comprehensive logging
- Security policies for wildcard subscriptions
- **Automatic instantiation** — No manual setup required

### Automatic Instantiation

When you load `pan.mjs`, the PAN bus is automatically created and made available globally:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="/core/pan.mjs"></script>
</head>
<body>
  <!-- No <pan-bus> tag needed! -->
  <!-- Bus is automatically ready -->
  <my-component></my-component>
</body>
</html>
```

### HTML Element (Legacy)

The `<pan-bus>` element is still supported for backwards compatibility, but is no longer required:

```html
<!-- This still works, but is no longer necessary -->
<pan-bus></pan-bus>

<!-- With configuration -->
<pan-bus
  max-retained="1000"
  max-message-size="1048576"
  max-payload-size="524288"
  cleanup-interval="30000"
  rate-limit="1000"
  allow-global-wildcard="true"
  debug="true">
</pan-bus>
```

### Configuration Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-retained` | number | 1000 | Maximum retained messages |
| `max-message-size` | number | 1048576 | Max total message size (1MB) |
| `max-payload-size` | number | 524288 | Max data payload size (512KB) |
| `cleanup-interval` | number | 30000 | Cleanup interval in ms (30s) |
| `rate-limit` | number | 1000 | Max messages per client per second |
| `allow-global-wildcard` | boolean | true | Allow '*' subscriptions |
| `debug` | boolean | false | Enable debug logging |

### Message Format

```typescript
interface PanMessage<T = any> {
  topic: string;              // Topic name (required)
  data: T;                    // Message payload (required)
  id?: string;                // Unique message ID (auto-generated)
  ts?: number;                // Timestamp in ms (auto-generated)
  retain?: boolean;           // Retain for late subscribers
  replyTo?: string;           // Topic for replies
  correlationId?: string;     // Correlation ID for request/reply
  headers?: Record<string, string>; // Optional metadata
}
```

### Topic Patterns

**Exact Match**
```javascript
// Publisher
publish({ topic: 'users.updated', data: {...} });

// Subscriber
subscribe(['users.updated'], handler);
```

**Wildcard Match**
```javascript
// Matches users.created, users.updated, users.deleted
subscribe(['users.*'], handler);

// Matches all.messages.everywhere
subscribe(['*'], handler); // Only if allow-global-wildcard=true
```

**Pattern Examples**
- `users.created` - Exact topic
- `users.*` - All user events
- `users.*.admin` - User admin events
- `*` - Global wildcard (requires permission)

### Events

The bus communicates via CustomEvents:

#### `pan:publish`

Publish a message to the bus.

**Detail:**
```typescript
{
  topic: string;
  data: any;
  retain?: boolean;
  replyTo?: string;
  correlationId?: string;
  clientId?: string;
}
```

**Example:**
```javascript
document.dispatchEvent(new CustomEvent('pan:publish', {
  detail: {
    topic: 'users.list.state',
    data: { users: [...] },
    retain: true
  },
  bubbles: true,
  composed: true
}));
```

---

#### `pan:subscribe`

Subscribe to topic patterns.

**Detail:**
```typescript
{
  clientId: string;
  topics: string[];
  options: {
    retained?: boolean;
  };
}
```

**Example:**
```javascript
document.dispatchEvent(new CustomEvent('pan:subscribe', {
  detail: {
    clientId: 'my-component#123',
    topics: ['users.*', 'posts.*'],
    options: { retained: true }
  },
  bubbles: true,
  composed: true
}));
```

---

#### `pan:unsubscribe`

Unsubscribe from topics.

**Detail:**
```typescript
{
  clientId: string;
  topics: string[];
}
```

**Example:**
```javascript
document.dispatchEvent(new CustomEvent('pan:unsubscribe', {
  detail: {
    clientId: 'my-component#123',
    topics: ['users.*']
  },
  bubbles: true,
  composed: true
}));
```

---

#### `pan:deliver`

Message delivered to subscriber (received by subscriber).

**Detail:** PanMessage object

**Example:**
```javascript
element.addEventListener('pan:deliver', (e) => {
  const msg = e.detail;
  console.log('Received:', msg.topic, msg.data);
});
```

---

#### `pan:request`

Send a request message (like publish, but signals intent for reply).

**Detail:** Same as `pan:publish`

---

#### `pan:reply`

Send a reply to a request.

**Detail:** PanMessage with `replyTo` and `correlationId`

---

#### `pan:hello`

Announce client presence to the bus.

**Detail:**
```typescript
{
  id: string;
  caps?: string[];
}
```

---

#### `pan:sys.ready`

Bus is ready for use (dispatched on document).

**Detail:**
```typescript
{
  enhanced: boolean;
  config: object;
}
```

**Example:**
```javascript
document.addEventListener('pan:sys.ready', (e) => {
  console.log('Bus ready:', e.detail.config);
});
```

---

#### `pan:sys.stats`

Request bus statistics (dispatch on element).

**Response delivered as `pan:deliver` with:**
```typescript
{
  topic: 'pan:sys.stats',
  data: {
    published: number;
    delivered: number;
    dropped: number;
    retainedEvicted: number;
    subsCleanedUp: number;
    errors: number;
    subscriptions: number;
    clients: number;
    retained: number;
    config: object;
  }
}
```

**Example:**
```javascript
const getStats = () => {
  return new Promise((resolve) => {
    const handler = (e) => {
      if (e.detail.topic === 'pan:sys.stats') {
        document.removeEventListener('pan:deliver', handler);
        resolve(e.detail.data);
      }
    };

    document.addEventListener('pan:deliver', handler);
    document.dispatchEvent(new CustomEvent('pan:sys.stats', {
      bubbles: true,
      composed: true
    }));
  });
};

const stats = await getStats();
console.log('Bus stats:', stats);
```

---

#### `pan:sys.clear-retained`

Clear retained messages.

**Detail:**
```typescript
{
  pattern?: string; // Optional pattern to match (clears all if omitted)
}
```

**Example:**
```javascript
// Clear all retained messages
document.dispatchEvent(new CustomEvent('pan:sys.clear-retained', {
  bubbles: true,
  composed: true
}));

// Clear specific pattern
document.dispatchEvent(new CustomEvent('pan:sys.clear-retained', {
  detail: { pattern: 'users.*' },
  bubbles: true,
  composed: true
}));
```

---

#### `pan:sys.error`

Error event (dispatched globally).

**Detail:**
```typescript
{
  code: string;
  message: string;
  details: object;
}
```

**Error Codes:**
- `RATE_LIMIT_EXCEEDED` - Client exceeded rate limit
- `MESSAGE_INVALID` - Message validation failed
- `SUBSCRIPTION_INVALID` - Subscription pattern rejected

**Example:**
```javascript
document.addEventListener('pan:sys.error', (e) => {
  const { code, message, details } = e.detail;
  console.error('Bus error:', code, message, details);
});
```

---

### Direct API Methods

The bus element also provides convenience methods:

#### `publish(topic, data, options)`

Directly publish a message.

**Parameters:**
- `topic` (string) - Topic name
- `data` (any) - Message payload
- `options` (object) - Additional options (retain, etc.)

**Example:**
```javascript
const bus = document.querySelector('pan-bus');
bus.publish('users.created', { id: 123, name: 'Alice' }, { retain: true });
```

---

#### `subscribe(topics, handler)`

Directly subscribe to topics.

**Parameters:**
- `topics` (string | string[]) - Topic pattern(s)
- `handler` (function) - Callback function(msg)

**Returns:** Unsubscribe function

**Example:**
```javascript
const bus = document.querySelector('pan-bus');

const unsubscribe = bus.subscribe(['users.*', 'posts.*'], (msg) => {
  console.log('Message:', msg.topic, msg.data);
});

// Later: unsubscribe
unsubscribe();
```

---

### Static Method

#### `PanBus.matches(topic, pattern): boolean`

Check if a topic matches a pattern.

**Parameters:**
- `topic` (string) - Topic to test
- `pattern` (string) - Pattern to match against

**Returns:** boolean

**Example:**
```javascript
import { PanBusEnhanced } from '/core/pan-bus.mjs';

PanBusEnhanced.matches('users.created', 'users.*');  // true
PanBusEnhanced.matches('users.created', 'posts.*');  // false
PanBusEnhanced.matches('users.created', '*');        // true
```

---

### Security Features

**Message Validation**
- Checks topic is a non-empty string
- Validates data is JSON-serializable
- Enforces message size limits
- Enforces payload size limits

**Rate Limiting**
- Tracks messages per client per second
- Configurable limit (default: 1000/sec)
- Automatic cleanup of old tracking data

**Subscription Security**
- Can disable global wildcard (*)
- Validates subscription patterns
- Prevents malicious subscriptions

**Memory Management**
- LRU eviction for retained messages
- Bounded message store
- Automatic cleanup of dead subscriptions
- Prevents memory leaks

---

## PAN Client

A simplified, promise-based API for interacting with the PAN bus. Handles low-level CustomEvent details and provides convenient methods.

### Overview

- Clean, promise-based API
- Automatic correlation for request/reply
- Subscription management with AbortSignal
- Retained message support
- Type-safe with TypeScript

### Constructor

```typescript
new PanClient(host?: HTMLElement | Document, busSelector?: string)
```

**Parameters:**
- `host` (HTMLElement | Document) - Element to dispatch/receive events from (default: `document`)
- `busSelector` (string) - CSS selector for bus element (default: `'pan-bus'`)

**Example:**

```javascript
import { PanClient } from '/core/pan-client.mjs';

// Use document as host
const client = new PanClient();

// Use custom element
const myComponent = document.querySelector('my-component');
const client = new PanClient(myComponent);
```

---

### Methods

#### `ready(): Promise<void>`

Returns a promise that resolves when the PAN bus is ready.

**Returns:** Promise<void>

**Example:**

```javascript
const client = new PanClient();
await client.ready();

// Bus is ready, safe to publish/subscribe
client.publish({
  topic: 'app.started',
  data: { timestamp: Date.now() }
});
```

**Notes:**
- Always call this before using the client
- Safe to call multiple times
- Waits for `pan:sys.ready` event if bus not ready
- Automatically announces client presence to bus

---

#### `publish(message): void`

Publishes a message to the bus.

**Parameters:**

```typescript
{
  topic: string;              // Required
  data: any;                  // Required
  retain?: boolean;           // Optional
  replyTo?: string;           // Optional
  correlationId?: string;     // Optional
  headers?: Record<string, string>; // Optional
}
```

**Example:**

```javascript
// Simple publish
client.publish({
  topic: 'user.updated',
  data: { id: 123, name: 'Alice' }
});

// Retained message
client.publish({
  topic: 'users.list.state',
  data: { users: [...] },
  retain: true
});

// With headers
client.publish({
  topic: 'analytics.event',
  data: { action: 'click' },
  headers: { 'x-source': 'mobile-app' }
});
```

---

#### `subscribe(topics, handler, options): UnsubscribeFunction`

Subscribes to one or more topic patterns.

**Parameters:**
- `topics` (string | string[]) - Topic pattern(s) to subscribe to
- `handler` (function) - Callback function(msg)
- `options` (object) - Subscription options
  - `retained` (boolean) - Receive retained messages immediately
  - `signal` (AbortSignal) - AbortSignal for automatic cleanup

**Returns:** Function to unsubscribe

**Example:**

```javascript
// Subscribe to single topic
const unsub = client.subscribe('users.updated', (msg) => {
  console.log('User updated:', msg.data);
});

// Multiple topics with wildcard
client.subscribe(['users.*', 'posts.*'], (msg) => {
  console.log('Received:', msg.topic, msg.data);
});

// Get retained messages immediately
client.subscribe('app.state', (msg) => {
  console.log('Current state:', msg.data);
}, { retained: true });

// Automatic cleanup with AbortController
const controller = new AbortController();
client.subscribe('events.*', handler, {
  signal: controller.signal
});

// Later: controller.abort(); // Unsubscribes automatically

// Manual unsubscribe
const unsubscribe = client.subscribe('users.*', handler);
// Later: unsubscribe();
```

**Handler Function:**
```javascript
function handler(msg) {
  // msg.topic - Topic name
  // msg.data - Message payload
  // msg.id - Unique message ID
  // msg.ts - Timestamp
  // msg.retain - Whether message was retained
  // msg.correlationId - For request/reply correlation
}
```

---

#### `request(topic, data, options): Promise<PanMessage>`

Sends a request and waits for a reply (request/reply pattern).

**Parameters:**
- `topic` (string) - Request topic
- `data` (any) - Request payload
- `options` (object) - Request options
  - `timeoutMs` (number) - Timeout in milliseconds (default: 5000)

**Returns:** Promise that resolves with reply message

**Throws:** Error if request times out

**Example:**

```javascript
// Simple request
try {
  const response = await client.request('users.get', { id: 123 });
  console.log('User:', response.data);
} catch (err) {
  console.error('Request failed:', err);
}

// Custom timeout
const response = await client.request('slow.operation',
  { param: 'value' },
  { timeoutMs: 10000 }  // 10 second timeout
);

// Request with error handling
async function fetchUser(id) {
  try {
    const response = await client.request('users.get', { id });
    return response.data;
  } catch (err) {
    if (err.message === 'PAN request timeout') {
      console.error('Request timed out');
    } else {
      console.error('Request failed:', err);
    }
    return null;
  }
}
```

**Responding to Requests:**

```javascript
// Server component listens for requests
client.subscribe('users.get', (msg) => {
  const { id } = msg.data;
  const user = getUserById(id);

  // Reply to the request
  client.publish({
    topic: msg.replyTo,
    data: user,
    correlationId: msg.correlationId
  });
});
```

---

### Static Method

#### `PanClient.matches(topic, pattern): boolean`

Checks if a topic matches a pattern.

**Parameters:**
- `topic` (string) - Topic to test
- `pattern` (string) - Pattern to match against

**Returns:** boolean

**Example:**

```javascript
PanClient.matches('users.list.state', 'users.*');  // true
PanClient.matches('users.list.state', 'users.list.state');  // true
PanClient.matches('users.list.state', '*');  // true
PanClient.matches('users.list.state', 'posts.*');  // false
PanClient.matches('users.item.123', 'users.item.*');  // true
```

---

### Complete Example

```javascript
import { PanClient } from '/core/pan-client.mjs';

class UserListComponent extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(this);
    this.users = [];
  }

  async connectedCallback() {
    // Wait for bus to be ready
    await this.client.ready();

    // Subscribe to user events
    this.unsubscribe = this.client.subscribe(
      ['users.*'],
      (msg) => this.handleUserEvent(msg),
      { retained: true }  // Get current state immediately
    );

    this.render();
  }

  disconnectedCallback() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  handleUserEvent(msg) {
    switch (msg.topic) {
      case 'users.list.state':
        this.users = msg.data.users;
        this.render();
        break;

      case 'users.created':
        this.users.push(msg.data);
        this.render();
        break;

      case 'users.updated':
        const index = this.users.findIndex(u => u.id === msg.data.id);
        if (index !== -1) {
          this.users[index] = msg.data;
          this.render();
        }
        break;

      case 'users.deleted':
        this.users = this.users.filter(u => u.id !== msg.data.id);
        this.render();
        break;
    }
  }

  async deleteUser(id) {
    try {
      // Request/reply pattern
      await this.client.request('users.delete', { id });
      console.log('User deleted successfully');
    } catch (err) {
      console.error('Delete failed:', err);
    }
  }

  render() {
    this.innerHTML = `
      <ul>
        ${this.users.map(user => `
          <li>
            ${user.name}
            <button onclick="this.closest('user-list-component').deleteUser(${user.id})">
              Delete
            </button>
          </li>
        `).join('')}
      </ul>
    `;
  }
}

customElements.define('user-list-component', UserListComponent);
```

---

## Configuration

### Using larc-config.mjs

LARC supports a centralized configuration file for path resolution across your application.

**Basic Setup:**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Step 1: Load config -->
  <script type="module" src="/larc-config.mjs"></script>

  <!-- Step 2: Load autoloader -->
  <script type="module" src="/core/pan.mjs"></script>

  <!-- Step 3: Use components -->
  <pan-card>Hello World</pan-card>
</body>
</html>
```

**Configuration Structure:**

```javascript
// larc-config.mjs
export const aliases = {
  '@larc/core': '/core/src',
  '@larc/components': '/components',
  '@larc/examples': '/examples'
};

export const componentPaths = {
  'pan-bus': '@larc/core/pan-bus.mjs',
  'pan-client': '@larc/core/pan-client.mjs',
  'pan-card': '@larc/components/pan-card.mjs'
};

export const paths = {
  resolve(aliasOrPath, subpath = '') {
    // Resolve aliases to absolute paths
    // ...
  },

  component(componentName) {
    // Resolve component paths
    // ...
  }
};

export const autoloadConfig = {
  baseUrl: null,
  componentsPath: '/ui/',
  extension: '.mjs',
  rootMargin: 600,

  // Custom component resolver
  resolveComponent(tagName) {
    return paths.component(tagName);
  }
};

// Apply to window.panAutoload
if (typeof window !== 'undefined') {
  window.panAutoload = Object.assign(
    window.panAutoload || {},
    autoloadConfig,
    { paths, aliases, componentPaths }
  );

  window.larcResolve = paths.resolve.bind(paths);
}
```

**Using in Scripts:**

```javascript
import { paths } from '/larc-config.mjs';

// Resolve any alias
const clientPath = paths.resolve('@larc/core', 'components/pan-client.mjs');

// Import dynamically
const { PanClient } = await import(clientPath);

// Or use the global helper
const resolved = window.larcResolve('@larc/core', 'components/pan-bus.mjs');
```

---

## Events Reference

### Event Flow

```
Component                    Bus                      Component
    |                        |                           |
    |-- pan:publish -------->|                           |
    |                        |-- pan:deliver ----------->|
    |                        |                           |
    |-- pan:subscribe ------>|                           |
    |                        |-- pan:deliver (retained)->|
    |                        |                           |
    |-- pan:request -------->|                           |
    |                        |-- pan:deliver ----------->|
    |                        |<- pan:reply --------------|
    |<- pan:deliver ---------|                           |
```

### Event Summary

| Event | Direction | Purpose |
|-------|-----------|---------|
| `pan:publish` | Component → Bus | Publish a message |
| `pan:subscribe` | Component → Bus | Subscribe to topics |
| `pan:unsubscribe` | Component → Bus | Unsubscribe from topics |
| `pan:deliver` | Bus → Component | Deliver message to subscriber |
| `pan:request` | Component → Bus | Send request (signals reply expected) |
| `pan:reply` | Component → Bus | Send reply to request |
| `pan:hello` | Component → Bus | Announce presence |
| `pan:sys.ready` | Bus → Document | Bus is ready |
| `pan:sys.stats` | Component → Bus | Request statistics |
| `pan:sys.clear-retained` | Component → Bus | Clear retained messages |
| `pan:sys.error` | Bus → Document | Error occurred |

---

## TypeScript Support

LARC includes comprehensive TypeScript definitions for all APIs.

### Importing Types

```typescript
import {
  PanClient,
  PanMessage,
  SubscribeOptions,
  RequestOptions
} from '/core/pan-client.mjs';

import {
  PanAutoloadConfig,
  maybeLoadFor,
  observeTree
} from '/core/pan.mjs';

import { PanBusEnhanced } from '/core/pan-bus.mjs';
```

### Type Definitions

**PanMessage**

```typescript
interface PanMessage<T = unknown> {
  topic: string;
  data: T;
  id?: string;
  ts?: number;
  retain?: boolean;
  replyTo?: string;
  correlationId?: string;
  headers?: Record<string, string>;
}
```

**SubscribeOptions**

```typescript
interface SubscribeOptions {
  retained?: boolean;
  signal?: AbortSignal;
}
```

**RequestOptions**

```typescript
interface RequestOptions {
  timeoutMs?: number;
}
```

**PanAutoloadConfig**

```typescript
interface PanAutoloadConfig {
  baseUrl?: string | null;
  componentsPath?: string;
  extension?: string;
  rootMargin?: number;
  resolvedComponentsPath?: string;
}
```

### Generic Type Parameters

```typescript
// Typed message data
interface User {
  id: number;
  name: string;
}

// Publish with type
client.publish<User>({
  topic: 'users.created',
  data: { id: 123, name: 'Alice' }
});

// Subscribe with type
client.subscribe<User>('users.*', (msg) => {
  // msg.data is typed as User
  console.log(msg.data.name);
});

// Request with types
interface UserRequest {
  id: number;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
}

const response = await client.request<UserRequest, UserResponse>(
  'users.get',
  { id: 123 }
);

// response.data is typed as UserResponse
console.log(response.data.email);
```

### Component with TypeScript

```typescript
import { PanClient, PanMessage } from '/core/pan-client.mjs';

interface TodoItem {
  id: number;
  text: string;
  completed: boolean;
}

interface TodoState {
  todos: TodoItem[];
}

class TodoListElement extends HTMLElement {
  private client: PanClient;
  private unsubscribe?: () => void;
  private todos: TodoItem[] = [];

  constructor() {
    super();
    this.client = new PanClient(this);
  }

  async connectedCallback(): Promise<void> {
    await this.client.ready();

    this.unsubscribe = this.client.subscribe<TodoState>(
      'todos.state',
      (msg) => this.handleState(msg),
      { retained: true }
    );

    this.render();
  }

  disconnectedCallback(): void {
    this.unsubscribe?.();
  }

  private handleState(msg: PanMessage<TodoState>): void {
    this.todos = msg.data.todos;
    this.render();
  }

  private addTodo(text: string): void {
    this.client.publish<Partial<TodoItem>>({
      topic: 'todos.add',
      data: { text, completed: false }
    });
  }

  private render(): void {
    // Render implementation
  }
}

customElements.define('todo-list', TodoListElement);
```

---

## Best Practices

### 1. Always Wait for Bus Ready

```javascript
// Good
async connectedCallback() {
  await this.client.ready();
  this.client.subscribe('topic', handler);
}

// Bad - may miss messages or fail
connectedCallback() {
  this.client.subscribe('topic', handler); // Bus might not be ready
}
```

### 2. Clean Up Subscriptions

```javascript
// Good - cleanup in disconnectedCallback
class MyComponent extends HTMLElement {
  async connectedCallback() {
    await this.client.ready();
    this.unsubscribe = this.client.subscribe('topic', handler);
  }

  disconnectedCallback() {
    this.unsubscribe?.();
  }
}

// Or use AbortSignal for automatic cleanup
async connectedCallback() {
  const controller = new AbortController();
  this.client.subscribe('topic', handler, {
    signal: controller.signal
  });

  // Store controller to abort later
  this.abortController = controller;
}

disconnectedCallback() {
  this.abortController?.abort();
}
```

### 3. Use Retained Messages for State

```javascript
// Good - use retained messages for state
client.publish({
  topic: 'users.list.state',
  data: { users: [...] },
  retain: true  // New subscribers get current state
});

// Subscribe with retained option to get current state
client.subscribe('users.list.state', handler, { retained: true });
```

### 4. Namespace Your Topics

```javascript
// Good - clear hierarchy
'app.users.list.state'
'app.users.created'
'app.posts.updated'

// Bad - flat structure
'userList'
'newUser'
'updatePost'
```

### 5. Use Request/Reply for RPC

```javascript
// Good - request/reply for RPC-style operations
const result = await client.request('users.get', { id: 123 });

// Bad - publish and hope for response
client.publish({ topic: 'users.get', data: { id: 123 } });
// No way to correlate response
```

### 6. Validate Message Data

```javascript
// Good - validate incoming data
client.subscribe('users.*', (msg) => {
  if (!msg.data || typeof msg.data !== 'object') {
    console.error('Invalid message data');
    return;
  }

  const { id, name } = msg.data;
  if (!id || !name) {
    console.error('Missing required fields');
    return;
  }

  // Process valid data
  handleUser(msg.data);
});
```

### 7. Use Wildcards Wisely

```javascript
// Good - specific wildcards
client.subscribe('users.*', handler);
client.subscribe('users.*.admin', handler);

// Careful - global wildcard receives ALL messages
client.subscribe('*', handler); // Only for debugging/monitoring
```

### 8. Handle Request Timeouts

```javascript
// Good - handle timeouts gracefully
async function fetchUser(id) {
  try {
    const response = await client.request('users.get', { id }, {
      timeoutMs: 5000
    });
    return response.data;
  } catch (err) {
    if (err.message === 'PAN request timeout') {
      console.warn('Request timed out, using cached data');
      return getCachedUser(id);
    }
    throw err;
  }
}
```

### 9. Use Debug Mode During Development

```html
<!-- Enable debug logging -->
<pan-bus debug="true"></pan-bus>
```

```javascript
// Check bus statistics
document.dispatchEvent(new CustomEvent('pan:sys.stats', {
  bubbles: true,
  composed: true
}));
```

### 10. Organize Components by Feature

```
components/
  users/
    user-list.mjs
    user-detail.mjs
    user-form.mjs
  posts/
    post-list.mjs
    post-detail.mjs
  shared/
    loading-spinner.mjs
    error-message.mjs
```

---

## Common Pitfalls

### 1. Forgetting to Wait for Bus Ready

```javascript
// Wrong - bus might not be ready
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client.publish({ topic: 'test', data: {} }); // Might fail
  }
}

// Correct
class MyComponent extends HTMLElement {
  async connectedCallback() {
    await this.client.ready();
    this.client.publish({ topic: 'test', data: {} }); // Safe
  }
}
```

### 2. Memory Leaks from Uncleared Subscriptions

```javascript
// Wrong - subscription never cleaned up
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client.subscribe('topic', handler); // Leaks!
  }
}

// Correct
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = this.client.subscribe('topic', handler);
  }

  disconnectedCallback() {
    this.unsubscribe();
  }
}
```

### 3. Publishing Non-Serializable Data

```javascript
// Wrong - DOM nodes, functions, circular refs not allowed
client.publish({
  topic: 'test',
  data: {
    element: document.body,        // DOM node - fails
    callback: () => {},            // Function - fails
    circular: { ref: null }        // Circular ref - fails
  }
});

// Correct - use plain objects/arrays/primitives
client.publish({
  topic: 'test',
  data: {
    elementId: 'body',
    callbackName: 'handleClick',
    values: [1, 2, 3]
  }
});
```

### 4. Exceeding Message Size Limits

```javascript
// Wrong - huge payload
client.publish({
  topic: 'test',
  data: hugeArray // > 512KB - rejected
});

// Correct - paginate or chunk data
const chunks = chunkArray(hugeArray, 100);
chunks.forEach((chunk, i) => {
  client.publish({
    topic: `test.chunk.${i}`,
    data: chunk
  });
});
```

### 5. Rate Limiting Issues

```javascript
// Wrong - burst of messages
for (let i = 0; i < 10000; i++) {
  client.publish({ topic: 'test', data: i }); // Rate limited!
}

// Correct - batch or throttle
const batch = [];
for (let i = 0; i < 10000; i++) {
  batch.push(i);
  if (batch.length >= 100) {
    client.publish({ topic: 'test.batch', data: batch });
    batch.length = 0;
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}
```

### 6. Not Handling Request Timeouts

```javascript
// Wrong - uncaught timeout
async function getData() {
  const result = await client.request('data.get', {}); // Might timeout
  return result.data;
}

// Correct
async function getData() {
  try {
    const result = await client.request('data.get', {}, {
      timeoutMs: 5000
    });
    return result.data;
  } catch (err) {
    console.error('Request failed:', err);
    return null;
  }
}
```

### 7. Circular Message Loops

```javascript
// Wrong - infinite loop
client.subscribe('test', (msg) => {
  // Don't publish the same topic you're subscribed to!
  client.publish({ topic: 'test', data: msg.data }); // Infinite loop!
});

// Correct - use different topics
client.subscribe('test.request', (msg) => {
  // Respond on different topic
  client.publish({ topic: 'test.response', data: process(msg.data) });
});
```

### 8. Incorrect Topic Patterns

```javascript
// Wrong - patterns don't match
client.subscribe('users.*.admin', handler);
// Won't match: 'users.created' (only one segment after users)
// Won't match: 'users.list.admin.settings' (too many segments)

// Correct understanding
client.subscribe('users.*', handler);
// Matches: 'users.created', 'users.updated', 'users.deleted'
// Doesn't match: 'users.list.state' (two segments after users)

client.subscribe('users.*.*', handler);
// Matches: 'users.list.state', 'users.item.updated'
```

### 9. Missing Error Handlers

```javascript
// Wrong - errors go unhandled
document.addEventListener('pan:sys.error', (e) => {
  // No handler - errors silent
});

// Correct - log or handle errors
document.addEventListener('pan:sys.error', (e) => {
  const { code, message, details } = e.detail;
  console.error(`Bus error [${code}]:`, message, details);

  // Show to user if needed
  if (code === 'RATE_LIMIT_EXCEEDED') {
    showNotification('Too many requests, please slow down');
  }
});
```

### 10. Not Using TypeScript Types

```javascript
// Wrong - no type safety
const response = await client.request('users.get', { id: '123' }); // String instead of number
console.log(response.data.email); // Might not exist

// Correct - use TypeScript
interface UserRequest {
  id: number;
}

interface UserResponse {
  id: number;
  name: string;
  email: string;
}

const response = await client.request<UserRequest, UserResponse>(
  'users.get',
  { id: 123 } // Type checked
);

console.log(response.data.email); // Type safe
```

---

## Additional Resources

- **Repository**: [https://github.com/larcjs/larc](https://github.com/larcjs/larc)
- **Examples**: `/examples/` directory in the repository
- **Quick Start**: `/docs/QUICK-START-CONFIG.md`
- **Browser Compatibility**: `/docs/BROWSER-COMPATIBILITY.md`

---

## License

LARC is open source. Check the repository for license information.

---

**Last Updated**: 2025-11-24
