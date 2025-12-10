# @larcjs/core-lite

[![Version](https://img.shields.io/npm/v/@larcjs/core-lite.svg)](https://www.npmjs.com/package/@larcjs/core-lite)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-9KB%20minified-brightgreen.svg)](#)

> **Lightweight PAN messaging bus** - Essential features only, 78% smaller than full version

LARC Core Lite provides the essential PAN (Page Area Network) messaging infrastructure for building loosely-coupled web applications. This is the lightweight version with routing and debugging features removed.

## 📦 Bundle Size Comparison

| Package | Minified | Features |
|---------|----------|----------|
| **@larcjs/core-lite** | **~9KB** | ✅ Pub/sub, retained messages, request/reply |
| @larcjs/core | ~40KB | ✅ Everything + routing + debug + advanced features |

**Use core-lite when:**
- ✅ You want the smallest possible bundle
- ✅ You only need pub/sub messaging
- ✅ You don't need dynamic routing
- ✅ You don't need advanced debugging

**Use full @larcjs/core when:**
- 🔧 You need dynamic message routing
- 🔧 You need advanced debugging/tracing
- 🔧 You need rate limiting & security features
- 🔧 You want batteries-included

## Features

- 🚀 **Zero build required** — Drop-in `<pan-bus>` element, communicate via CustomEvents
- 🔌 **Loose coupling** — Components depend on topic contracts, not imports
- 🌐 **Framework friendly** — Works with React, Vue, Angular
- 📬 **Core messaging** — Pub/sub, request/reply, retained messages
- 🎯 **Lightweight** — 9KB minified vs 40KB full version (78% reduction)
- ⚡ **Performance** — 300k+ messages/second, zero memory leaks
- 🔒 **Secure** — Zero dependencies, minimal attack surface

## Installation

```bash
npm install @larcjs/core-lite
```

## Quick Start

### CDN Usage (No Build Required)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- Load the lite autoloader -->
  <script type="module" src="https://unpkg.com/@larcjs/core-lite@latest/src/pan.js"></script>
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
import { PanBusLite } from '@larcjs/core-lite/pan-bus';

// The bus is automatically created by the autoloader
// Or create manually:
const bus = new PanBusLite();
document.body.appendChild(bus);

// Subscribe to a topic
bus.subscribe('user.login', (message) => {
  console.log('User logged in:', message.payload);
});

// Publish a message
bus.publish('user.login', { userId: 123, name: 'Alice' });
```

## Core Components

### `<pan-bus>` (Lite Version)

The lightweight message hub.

```html
<pan-bus></pan-bus>
```

No configuration needed - it just works!

### `<pan-client>`

Simplifies publishing and subscribing.

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

## What's NOT Included (vs Full Version)

❌ **Dynamic Message Routing** - Use [@larcjs/core-routing](../core-routing) if needed
❌ **Debug/Tracing Tools** - Use [@larcjs/core-debug](../core-debug) if needed
❌ **Rate Limiting** - Not available in lite
❌ **Message Size Validation** - Not available in lite
❌ **Statistics Tracking** - Not available in lite
❌ **LRU Cache Eviction** - Simple Map instead

These features add **31KB** to the bundle. If you need them, use [@larcjs/core](../../core) instead.

## Upgrading to Full Version

Need more features? Switch to the full version:

```bash
npm uninstall @larcjs/core-lite
npm install @larcjs/core
```

Or add routing/debug separately:

```bash
npm install @larcjs/core-routing @larcjs/core-debug
```

## Performance

- **Throughput:** 300,000+ messages/second
- **Latency:** <1ms per message (local)
- **Memory:** Zero leaks, constant memory usage
- **Bundle size:** 9KB minified
  - `pan.min.mjs`: 3.6KB (autoloader)
  - `pan-bus.min.mjs`: 3.0KB (lite bus)
  - `pan-client.min.mjs`: 2.0KB (client API)

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Related Packages

- **[@larcjs/core](../../core)** — Full-featured version (40KB with routing/debug)
- **[@larcjs/core-routing](../core-routing)** — Dynamic routing add-on (8KB)
- **[@larcjs/core-debug](../core-debug)** — Debug tools add-on (3KB)
- **[@larcjs/ui](https://github.com/larcjs/components)** — UI components built on PAN
- **[@larcjs/core-types](../core-types)** — TypeScript type definitions

## Documentation

- [Full Documentation](https://larcjs.github.io/site/)
- [Migration from Full Version](./MIGRATION.md)
- [API Reference](./API.md)

## Contributing

Contributions are welcome! Please see our [Contributing Guide](../../CONTRIBUTING.md).

## License

MIT © Chris Robison

## Support

- 📖 [Documentation](https://larcjs.github.io/site/)
- 💬 [Discussions](https://github.com/larcjs/larc/discussions)
- 🐛 [Issue Tracker](https://github.com/larcjs/larc/issues)
