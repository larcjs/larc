# LARC Core

[![Version](https://img.shields.io/npm/v/@larcjs/core.svg)](https://www.npmjs.com/package/@larcjs/core)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)](CHANGELOG.md)
[![Tests](https://img.shields.io/badge/tests-335%20passing-brightgreen.svg)](#)
[![npm](https://img.shields.io/npm/dm/@larcjs/core.svg)](https://www.npmjs.com/package/@larcjs/core)

> **Full-featured PAN messaging bus** — Complete messaging infrastructure with routing & debugging

LARC Core provides the foundational messaging infrastructure for building loosely-coupled, event-driven web applications. It implements the PAN (Page Area Network) protocol, enabling seamless communication between components, iframes, workers, and tabs.

## 📦 Package Options

| Package | Size | Use When |
|---------|------|----------|
| **[@larcjs/core-lite](../packages/core-lite)** | 9KB | ✅ You want the smallest bundle<br>✅ You only need pub/sub messaging |
| **@larcjs/core** (this package) | 40KB | ✅ You need routing or debugging<br>✅ You want batteries-included |
| **À la carte** | Custom | ✅ core-lite + [@larcjs/core-routing](../packages/core-routing)<br>✅ core-lite + [@larcjs/core-debug](../packages/core-debug) |

**💡 Recommendation:** Start with `@larcjs/core-lite` (9KB) and add routing/debug only if needed.

See [PACKAGES.md](../PACKAGES.md) for detailed comparison and migration guide.

## Features

- 🚀 **Zero build required** — Drop-in `<pan-bus>` element, communicate via CustomEvents
- 🔌 **Loose coupling** — Components depend on topic contracts, not imports
- 🌐 **Framework friendly** — Works *with* React, Vue, Angular - not as a replacement
- 📬 **Rich messaging** — Pub/sub, request/reply, retained messages, cross-tab mirroring
- 🎯 **Lightweight** — 40KB minified (128KB unminified), no dependencies (vs 400-750KB for typical React stack)
- ⚡ **Performance** — 300k+ messages/second, zero memory leaks
- 🔒 **Security** — Built-in message validation and sanitization
- 🔀 **Dynamic Routing** — Runtime-configurable message routing with transforms and actions

## Why PAN Messaging?

**The Web Component "silo problem" solved.**

Web Components give you encapsulation, but they're useless if they can't communicate. Without PAN, every component needs custom glue code:

```javascript
// Without PAN - tightly coupled nightmare ❌
const search = document.querySelector('search-box');
const results = document.querySelector('results-list');
search.addEventListener('change', (e) => {
  results.updateQuery(e.detail.query);  // Tight coupling!
});
```

**With PAN - loosely coupled, reusable** ✅

```javascript
// Components just work together via topics
// No custom integration code needed!
<search-box></search-box>     <!-- publishes "search:query" -->
<results-list></results-list> <!-- subscribes to "search:query" -->
```

This is why Web Components haven't replaced frameworks - **they lacked coordination**. PAN fixes that.

## Quick Start

### Installation

```bash
npm install @larcjs/core
```

### CDN Usage (No Build Required)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- Load the autoloader -->
  <script type="module" src="https://unpkg.com/@larcjs/core@2.0.0/src/pan.js"></script>
</head>
<body>
  <!-- The pan-bus is automatically created -->
  <script>
    // Publish a message
    document.dispatchEvent(new CustomEvent('pan:publish', {
      detail: {
        topic: 'greeting.message',
        payload: { text: 'Hello, PAN!' }
      }
    }));

    // Subscribe to messages
    document.addEventListener('pan:message', (e) => {
      if (e.detail.topic === 'greeting.message') {
        console.log('Received:', e.detail.payload.text);
      }
    });
  </script>
</body>
</html>
```

### Module Usage

```javascript
import { PanBus } from '@larcjs/core';

// Create a bus instance
const bus = new PanBus();

// Subscribe to a topic
bus.subscribe('user.login', (message) => {
  console.log('User logged in:', message.payload);
});

// Publish a message
bus.publish('user.login', { userId: 123, name: 'Alice' });

// Request/reply pattern
const response = await bus.request('user.get', { id: 123 });
console.log('User data:', response);
```

## Core Components

### `<pan-bus>`

The central message hub that routes all PAN messages.

```html
<pan-bus id="myBus" mirror="false"></pan-bus>
```

**Attributes:**
- `mirror` — Enable cross-tab message mirroring (default: false)
- `debug` — Enable debug logging (default: false)

### `<pan-client>`

Simplifies publishing and subscribing for components.

```html
<pan-client id="client"></pan-client>

<script>
  const client = document.getElementById('client');

  client.subscribe('data.changed', (msg) => {
    console.log('Data updated:', msg.payload);
  });

  client.publish('data.request', { id: 42 });
</script>
```

## Message Patterns

### Publish/Subscribe

```javascript
// Publisher
bus.publish('notifications.new', {
  type: 'info',
  message: 'Welcome!'
});

// Subscriber
bus.subscribe('notifications.new', (msg) => {
  showNotification(msg.payload);
});
```

### Request/Reply

```javascript
// Responder
bus.subscribe('user.get', async (msg) => {
  const user = await fetchUser(msg.payload.id);
  return { ok: true, user };
});

// Requester
const result = await bus.request('user.get', { id: 123 });
if (result.ok) {
  console.log('User:', result.user);
}
```

### Retained Messages (State)

```javascript
// Publish with retain flag
bus.publish('app.state', { theme: 'dark' }, { retain: true });

// Late subscribers immediately receive the retained message
bus.subscribe('app.state', (msg) => {
  applyTheme(msg.payload.theme);
});
```

## Topic Conventions

LARC uses hierarchical topic naming:

- `${resource}.list.get` — Request list of items
- `${resource}.list.state` — Current list state (retained)
- `${resource}.item.select` — User selected an item
- `${resource}.item.get` — Request single item
- `${resource}.item.save` — Save an item
- `${resource}.item.delete` — Delete an item
- `${resource}.changed` — Item(s) changed notification
- `${resource}.error` — Error occurred

Example:

```javascript
// Request list of products
await bus.request('products.list.get', {});

// Subscribe to product selection
bus.subscribe('products.item.select', (msg) => {
  loadProductDetails(msg.payload.id);
});

// Save a product
await bus.request('products.item.save', {
  item: { id: 1, name: 'Widget', price: 9.99 }
});
```

## Dynamic Message Routing 🔥

**NEW:** Configure message flows declaratively at runtime! PAN Routes lets you define routing rules that match, transform, and act on messages without hardcoding logic in your components.

### Why Routing Changes Everything

**Before (Tightly Coupled):**
```javascript
// Hardcoded message handling scattered across components ❌
bus.subscribe('sensor.temperature', (msg) => {
  if (msg.payload.value > 30) {
    const alert = { type: 'alert.highTemp', temp: msg.payload.value };
    bus.publish('alerts', alert);
    console.warn(`High temp: ${alert.temp}°C`);
  }
});
```

**After (Declarative Routes):**
```javascript
// Define routing rules once, reuse everywhere ✅
pan.routes.add({
  name: 'High Temperature Alert',
  match: {
    type: 'sensor.temperature',
    where: { op: 'gt', path: 'payload.value', value: 30 }
  },
  actions: [
    { type: 'EMIT', message: { type: 'alert.highTemp' }, inherit: ['payload'] },
    { type: 'LOG', level: 'warn', template: 'High temp: {{payload.value}}°C' }
  ]
});
```

### Enable Routing

```html
<pan-bus enable-routing="true"></pan-bus>
```

```javascript
// Access routing manager
const routes = window.pan.routes;
```

### Powerful Matching

Match messages by type, topic, tags, or complex predicates:

```javascript
// Match high-value VIP orders
routes.add({
  name: 'VIP Order Priority',
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
        payload: { priority: 'high', channels: ['email', 'sms'] }
      }
    },
    {
      type: 'LOG',
      level: 'info',
      template: '💎 VIP Order: ${{payload.total}}'
    }
  ]
});
```

### Transform Messages

Pick fields, map values, or apply custom transformations:

```javascript
// Register custom transform
routes.registerTransform('normalize-email', (email) => {
  return email.toLowerCase().trim();
});

// Use in route
routes.add({
  name: 'User Email Normalizer',
  match: { type: 'user.register' },
  transform: {
    op: 'map',
    path: 'payload.email',
    fnId: 'normalize-email'
  },
  actions: [
    { type: 'EMIT', message: { type: 'user.normalized' }, inherit: ['payload'] }
  ]
});
```

### Multiple Actions

Chain actions for complex workflows:

```javascript
routes.add({
  name: 'Critical Error Pipeline',
  match: {
    type: 'error',
    where: { op: 'eq', path: 'payload.severity', value: 'critical' }
  },
  actions: [
    { type: 'LOG', level: 'error', template: '🚨 CRITICAL: {{payload.message}}' },
    { type: 'EMIT', message: { type: 'alert.critical' }, inherit: ['payload'] },
    { type: 'FORWARD', topic: 'error-tracking.events' },
    { type: 'CALL', handlerId: 'send-slack-alert' }
  ]
});
```

### Runtime Configuration

Add, update, or remove routes on the fly:

```javascript
// Add route
const route = routes.add({ /* route config */ });

// Update route
routes.update(route.id, { enabled: false });

// Remove route
routes.remove(route.id);

// List all routes
console.table(routes.list());

// Get stats
console.log(routes.getStats());
// {
//   routesEvaluated: 1234,
//   routesMatched: 456,
//   actionsExecuted: 789
// }
```

### Real-World Use Cases

**🔍 Analytics Tracking**
```javascript
routes.add({
  name: 'Track User Events',
  match: { tagsAny: ['trackable'], type: ['user.click', 'user.view'] },
  actions: [{ type: 'FORWARD', topic: 'analytics.events' }]
});
```

**🔔 Smart Notifications**
```javascript
routes.add({
  name: 'Notification Router',
  match: { type: 'notification.send' },
  actions: [
    { type: 'CALL', handlerId: 'check-user-preferences' },
    { type: 'EMIT', message: { type: 'notification.queued' } }
  ]
});
```

**🚦 Feature Flags**
```javascript
routes.registerHandler('feature-router', (msg) => {
  const flags = getFeatureFlags();
  const topic = flags.newUI ? 'ui.v2' : 'ui.v1';
  window.pan.bus.publish(topic, msg.payload);
});

routes.add({
  name: 'Feature Flag Router',
  match: { type: 'app.init' },
  actions: [{ type: 'CALL', handlerId: 'feature-router' }]
});
```

**📊 Data Enrichment**
```javascript
routes.registerTransform('enrich-user', async (msg) => {
  const userData = await fetchUserProfile(msg.payload.userId);
  return {
    ...msg,
    payload: { ...msg.payload, user: userData }
  };
});

routes.add({
  name: 'Enrich Order Data',
  match: { type: 'order.created' },
  transform: { op: 'custom', fnId: 'enrich-user' },
  actions: [{ type: 'EMIT', message: { type: 'order.enriched' }, inherit: ['payload'] }]
});
```

### Why This Matters

- **🎯 Separation of Concerns** - Routing logic separate from business logic
- **🔄 Dynamic Reconfiguration** - Change message flows without code changes
- **📦 Reusable Rules** - Share and persist routing configurations
- **🐛 Debuggable** - See all routing rules in one place
- **🧪 Testable** - Test routing rules in isolation
- **⚡ Performant** - Sub-millisecond message evaluation

### Learn More

See [Dynamic Routing Documentation](docs/ROUTING.md) for complete API reference, predicates, transforms, actions, and advanced examples.

## Cross-Tab Communication

Enable the `mirror` attribute to sync messages across browser tabs:

```html
<pan-bus mirror="true"></pan-bus>
```

Only non-sensitive topics should be mirrored. Use topic filters:

```javascript
bus.setMirrorFilter((topic) => {
  // Don't mirror authentication tokens
  return !topic.startsWith('auth.');
});
```

## TypeScript Support

LARC Core is written in pure JavaScript with **zero build requirements**. TypeScript support is available via the optional **[@larcjs/core-types](https://github.com/larcjs/core-types)** package:

```bash
npm install @larcjs/core
npm install -D @larcjs/core-types
```

Full type definitions for all APIs:

```typescript
import { PanClient } from '@larcjs/core/pan-client.mjs';
import type { PanMessage, SubscribeOptions } from '@larcjs/core-types';

interface UserData {
  id: number;
  name: string;
}

const client = new PanClient();

// Fully typed publish
client.publish<UserData>({
  topic: 'user.updated',
  data: { id: 123, name: 'Alice' }
});

// Fully typed subscribe
client.subscribe<UserData>('user.updated', (msg: PanMessage<UserData>) => {
  console.log(msg.data.name); // TypeScript knows this is a string!
});
```

**Why separate types?** We keep runtime code lean (zero dependencies) and let TypeScript users opt-in to types. Best of both worlds!

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   Application                    │
├─────────────┬─────────────┬─────────────────────┤
│  Component  │  Component  │     Component       │
│      A      │      B      │         C           │
└──────┬──────┴──────┬──────┴──────┬──────────────┘
       │             │             │
       └─────────────┼─────────────┘
                     │
              ┌──────▼──────┐
              │  <pan-bus>  │  ← Central Message Hub
              └──────┬──────┘
                     │
       ┌─────────────┼─────────────┐
       │             │             │
┌──────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│   Worker    │ │ iframe │ │ Other Tabs  │
└─────────────┘ └────────┘ └─────────────┘
```

## Use With Your Framework

**PAN complements React/Vue/Angular - it doesn't replace them.**

### React Example

```jsx
import { usePanSubscribe, usePanPublish } from '@larcjs/react-adapter';

function Dashboard() {
  const theme = usePanSubscribe('theme:current');
  const { publish } = usePanPublish();

  return (
    <div>
      {/* React component */}
      <button onClick={() => publish('theme:toggle')}>
        Toggle Theme
      </button>

      {/* LARC components respond automatically */}
      <pan-card theme={theme}>
        <pan-data-table resource="users"></pan-data-table>
      </pan-card>
    </div>
  );
}
```

### Vue Example

```vue
<script setup>
import { usePanSubscribe, usePanPublish } from '@larcjs/vue-adapter';

const theme = usePanSubscribe('theme:current');
const { publish } = usePanPublish();
</script>

<template>
  <div>
    <!-- Vue component -->
    <button @click="publish('theme:toggle')">Toggle Theme</button>

    <!-- LARC components respond automatically -->
    <pan-card :theme="theme">
      <pan-data-table resource="users"></pan-data-table>
    </pan-card>
  </div>
</template>
```

**Keep your framework for complex UIs. Use LARC for cards, modals, tables, navigation - reduce bundle size by 60%+.**

## Related Packages

- **[@larcjs/core-types](https://github.com/larcjs/core-types)** — TypeScript type definitions (opt-in)
- **[@larcjs/components](https://github.com/larcjs/components)** — UI components built on LARC Core
- **[@larcjs/react-adapter](https://github.com/larcjs/react-adapter)** — React hooks for PAN messaging
- **[@larcjs/vue-adapter](https://github.com/larcjs/vue-adapter)** — Vue composables for PAN messaging
- **[@larcjs/devtools](https://github.com/larcjs/devtools)** — Chrome DevTools for debugging PAN messages
- **[@larcjs/examples](https://github.com/larcjs/examples)** — Demo applications and examples

## Documentation

- [API Reference](docs/API_REFERENCE.md)
- [LARC Specification](docs/LARC_SPEC.v0.md)
- [Roadmap](docs/LARC_ROADMAP.md)
- [Full Documentation](https://larcjs.github.io/site/)

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Performance

- **Throughput:** 300,000+ messages/second
- **Latency:** <1ms per message (local)
- **Memory:** Zero leaks, constant memory usage
- **Bundle size:** 40KB minified (128KB unminified source)
  - `pan.min.mjs`: 3.4KB (13KB unminified)
  - `pan-bus.min.mjs`: 12KB (23KB unminified)
  - `pan-client.min.mjs`: 8KB (15KB unminified)
  - `pan-routes.min.mjs`: 6KB (28KB unminified)
  - `pan-storage.min.mjs`: 5KB (18KB unminified)
  - `pan-debug.min.mjs`: 5KB (13KB unminified)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © Chris Robison

## Support

- 📖 [Documentation](https://larcjs.github.io/site/)
- 💬 [Discussions](https://github.com/larcjs/core/discussions)
- 🐛 [Issue Tracker](https://github.com/larcjs/core/issues)
