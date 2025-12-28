# Core Concepts Quick Reference

This chapter provides quick lookup for LARC's core concepts. For tutorials and detailed explanations, see *Learning LARC* Chapters 2-5.

## Architecture Overview

LARC applications consist of:

1. **PAN Bus** (`<pan-bus>`) — Message routing system
2. **Components** — Web Components that publish/subscribe to messages
3. **PanClient** — Helper library for working with the bus
4. **Message Topics** — Hierarchical namespaces for routing

```html
<!DOCTYPE html>
<html>
<body>
  <pan-bus></pan-bus>
  <my-app></my-app>

  <script type="module" src="/app.mjs"></script>
</body>
</html>
```

## Message Bus

**What**: DOM-based pub/sub system for component communication
**Element**: `<pan-bus>`
**Tutorial**: *Learning LARC* Chapter 5
**Reference**: Chapter 17

### Basic Usage

```javascript
import { PanClient } from '@larc/core';

const client = new PanClient();
await client.ready();

// Publish
client.publish({
  topic: 'user.login',
  data: { userId: 123 }
});

// Subscribe
client.subscribe('user.login', (msg) => {
  console.log('User logged in:', msg.data.userId);
});
```

### Configuration

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-retained` | number | 1000 | Maximum retained messages |
| `max-message-size` | number | 1MB | Maximum message size in bytes |
| `debug` | boolean | false | Enable debug logging |
| `allow-global-wildcard` | boolean | true | Allow `*` wildcard subscriptions |

See Chapter 17 for complete pan-bus documentation.

## Pub/Sub Pattern

**What**: Decoupled component communication via topics
**Tutorial**: *Learning LARC* Chapter 5

### Message Flow

```
Publisher → PAN Bus → Subscribers
```

1. Component publishes message to topic
2. Bus routes message to all subscribers of that topic
3. Subscribers receive message and react

### Wildcards

| Pattern | Matches | Example |
|---------|---------|---------|
| `user.*` | All user events | `user.login`, `user.logout` |
| `*.error` | All error events | `api.error`, `db.error` |
| `*` | All events | Everything (use sparingly) |

## Message Topics

**Convention**: `namespace.entity.action`

### Examples

```
user.auth.login
user.profile.update
cart.items.add
cart.checkout.start
api.users.error
theme.changed
```

### Best Practices

- Use lowercase with dots as separators
- Past tense for events: `user.logged-in` not `user.login`
- Present for commands: `cart.checkout.start`
- Namespace by domain: `api.*`, `user.*`, `cart.*`

See Appendix A for complete topic registry.

## Components

**What**: Web Components that use PAN bus for communication
**Tutorial**: *Learning LARC* Chapter 4
**Reference**: Chapters 17-21

### Basic Component

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    // Subscribe to messages
    this.client.subscribe('data.updated', (msg) => {
      this.render(msg.data);
    });

    // Publish messages
    this.dispatchAction();
  }

  dispatchAction() {
    this.client.publish({
      topic: 'action.triggered',
      data: { componentId: this.id }
    });
  }

  disconnectedCallback() {
    // PanClient automatically cleans up subscriptions
  }
}

customElements.define('my-component', MyComponent);
```

### Lifecycle

| Callback | When Called | Use For |
|----------|-------------|---------|
| `constructor()` | Element created | Initialize properties |
| `connectedCallback()` | Added to DOM | Subscribe, render, fetch data |
| `disconnectedCallback()` | Removed from DOM | Cleanup (automatic with PanClient) |
| `attributeChangedCallback()` | Attribute changes | Re-render on attribute updates |

## PanClient

**What**: Helper library for working with PAN bus
**Import**: `import { PanClient } from '@larc/core'`
**Tutorial**: *Learning LARC* Chapter 5
**Reference**: Chapter 17

### API Summary

```javascript
const client = new PanClient(element);

// Wait for bus ready
await client.ready();

// Publish message
client.publish({ topic, data, ...options });

// Subscribe to topic
client.subscribe(topic, handler);

// Request/response pattern
const response = await client.request(topic, data);

// Respond to requests
client.respond(topic, handler);

// Unsubscribe (usually automatic)
const unsubscribe = client.subscribe(topic, handler);
unsubscribe();
```

### Constructor Options

```javascript
new PanClient(element, options)
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `element` | HTMLElement | null | Owner element (auto-cleanup) |
| `timeout` | number | 5000 | Request timeout (ms) |
| `debug` | boolean | false | Enable debug logging |

## State Management

**What**: Reactive data stores for shared state
**Tutorial**: *Learning LARC* Chapter 6
**Reference**: Chapter 18

### Options

| Approach | Use For | Component |
|----------|---------|-----------|
| Component-local | UI state, temp values | N/A |
| Shared objects | App config, settings | N/A |
| `pan-store` | Reactive shared state | Chapter 18 |
| `pan-idb` | Persistent IndexedDB | Chapter 18 |
| LocalStorage | Simple persistence | N/A |

## Routing

**What**: URL-based navigation
**Tutorial**: *Learning LARC* Chapter 9
**Reference**: Chapter 18

```javascript
// Message-based routing
client.publish({
  topic: 'app.navigate',
  data: { path: '/users/123' }
});
```

See Chapter 18 for `pan-router` component documentation.

## Forms

**What**: Form handling and validation
**Tutorial**: *Learning LARC* Chapter 10
**Reference**: Chapter 19

```html
<pan-form submit-topic="form.submitted">
  <pan-input name="email" type="email" required></pan-input>
  <pan-button type="submit">Submit</pan-button>
</pan-form>
```

See Chapter 19 for form component documentation.

## Data Fetching

**What**: API integration patterns
**Tutorial**: *Learning LARC* Chapter 11
**Reference**: Chapter 20

```javascript
// Via PanClient
const response = await client.request('api.users.list', {});

// Via pan-fetch component
client.publish({
  topic: 'api.fetch',
  data: {
    url: '/api/users',
    method: 'GET'
  }
});
```

See Chapter 20 for integration components.

## ES Modules

LARC uses standard ES modules:

```javascript
// Import from CDN
import { PanClient } from 'https://cdn.jsdelivr.net/npm/@larcjs/core/pan-client.mjs';

// Import from local
import { PanClient } from '/core/pan-client.mjs';

// Use import maps (recommended)
<script type="importmap">
{
  "imports": {
    "@larc/core": "/core/pan-client.mjs"
  }
}
</script>
```

## Cross-References

- **Tutorials**: *Learning LARC* Chapters 2-5
- **PAN Bus API**: Chapter 17 (pan-bus)
- **Component Reference**: Chapters 17-21
- **Message Topics**: Appendix A
- **Configuration**: Appendix C
- **Patterns & Recipes**: Appendix E

## Quick Start

```bash
# Install
npm install @larcjs/core

# Or use CDN
https://cdn.jsdelivr.net/npm/@larcjs/core@latest/pan-bus.mjs
```

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "@larc/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@latest/pan-client.mjs"
    }
  }
  </script>
</head>
<body>
  <pan-bus debug="true"></pan-bus>
  <my-app></my-app>

  <script type="module">
    import { PanClient } from '@larc/core';

    class MyApp extends HTMLElement {
      connectedCallback() {
        this.client = new PanClient(this);
        this.innerHTML = '<h1>Hello LARC!</h1>';
      }
    }
    customElements.define('my-app', MyApp);
  </script>
</body>
</html>
```

For detailed tutorials, see *Learning LARC* Chapter 3 (Getting Started).
