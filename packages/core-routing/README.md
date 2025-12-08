# @larcjs/core-routing

[![Version](https://img.shields.io/npm/v/@larcjs/core-routing.svg)](https://www.npmjs.com/package/@larcjs/core-routing)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-8KB%20minified-blue.svg)](#)

> **Dynamic message routing system** - Declarative routing rules for PAN messages

Add powerful message routing capabilities to LARC Core or Core Lite. Configure message flows declaratively at runtime without hardcoding logic in components.

## Installation

```bash
# Requires @larcjs/core or @larcjs/core-lite
npm install @larcjs/core-routing
```

## Quick Start

```html
<pan-bus enable-routing="true"></pan-bus>

<script type="module">
import '@larcjs/core-routing';

// Access routing manager
const routes = window.pan.routes;

// Add a route
routes.add({
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
</script>
```

## Features

- 🎯 **Declarative Routing** - Define message flows as configuration
- 🔀 **Multiple Actions** - Chain EMIT, LOG, FORWARD, CALL actions
- 🔍 **Powerful Matching** - Pattern matching with complex predicates
- 🔄 **Transform Messages** - Pick, map, or custom transformations
- ⚡ **Runtime Configuration** - Add/update/remove routes on the fly
- 📊 **Statistics** - Track routing performance and matches

## Use Cases

### Analytics Tracking

```javascript
routes.add({
  name: 'Track User Events',
  match: { tagsAny: ['trackable'], type: ['user.click', 'user.view'] },
  actions: [{ type: 'FORWARD', topic: 'analytics.events' }]
});
```

### Smart Notifications

```javascript
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
    }
  ]
});
```

### Feature Flags

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

## API Reference

### routes.add(config)

Add a new route.

```javascript
const route = routes.add({
  name: 'My Route',
  match: { /* matching rules */ },
  transform: { /* optional transform */ },
  actions: [ /* actions to execute */ ]
});
```

### routes.update(id, changes)

Update an existing route.

```javascript
routes.update(route.id, { enabled: false });
```

### routes.remove(id)

Remove a route.

```javascript
routes.remove(route.id);
```

### routes.list()

Get all routes.

```javascript
const allRoutes = routes.list();
console.table(allRoutes);
```

### routes.getStats()

Get routing statistics.

```javascript
console.log(routes.getStats());
// {
//   routesEvaluated: 1234,
//   routesMatched: 456,
//   actionsExecuted: 789
// }
```

## Predicates

Available operators for matching:

- **Comparison:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`
- **String:** `startsWith`, `endsWith`, `contains`, `matches` (regex)
- **Logic:** `and`, `or`, `not`
- **Membership:** `in`, `notIn`
- **Existence:** `exists`, `notExists`

## Actions

- **EMIT** - Publish a new message
- **FORWARD** - Forward to another topic
- **LOG** - Log message (console.log/warn/error)
- **CALL** - Call a registered handler function

## Performance

- Sub-millisecond message evaluation
- Efficient predicate matching
- Minimal overhead when no routes match

## Bundle Size

- **Minified:** 8.3KB
- **Gzipped:** ~3KB

## Related Packages

- **[@larcjs/core](../../core)** — Full-featured PAN bus (includes routing)
- **[@larcjs/core-lite](../core-lite)** — Lightweight bus (use this package to add routing)
- **[@larcjs/core-debug](../core-debug)** — Debug tools

## License

MIT © Chris Robison
