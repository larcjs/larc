# LARC Package Guide

Complete guide to choosing the right LARC Core package for your needs.

## 📊 Package Comparison

| Feature | @larcjs/core-lite | @larcjs/core | core-lite + routing + debug |
|---------|-------------------|--------------|----------------------------|
| **Bundle Size (minified)** | **9KB** ✅ | 40KB | 20KB |
| **Pub/Sub Messaging** | ✅ | ✅ | ✅ |
| **Retained Messages** | ✅ | ✅ | ✅ |
| **Request/Reply** | ✅ | ✅ | ✅ |
| **Dynamic Routing** | ❌ | ✅ | ✅ (8KB add-on) |
| **Debug/Tracing** | ❌ | ✅ | ✅ (3KB add-on) |
| **Rate Limiting** | ❌ | ✅ | ❌ |
| **Message Validation** | ❌ | ✅ | ❌ |
| **Statistics** | ❌ | ✅ | ❌ |
| **LRU Cache** | ❌ | ✅ | ❌ |
| **Zero Dependencies** | ✅ | ✅ | ✅ |

## 🎯 Which Package Should I Use?

### Use @larcjs/core-lite (9KB)

✅ **Perfect for:**
- Production applications prioritizing bundle size
- Simple pub/sub messaging needs
- Component communication without complex routing
- Projects that don't need debugging tools in production

✅ **Best practices:**
- Add `@larcjs/core-debug` only in development builds
- Upgrade to full version if routing becomes necessary
- 78% smaller than full version

**Example:**
```bash
npm install @larcjs/core-lite
```

```html
<script type="module" src="https://unpkg.com/@larcjs/core-lite@latest/src/pan.js"></script>
```

---

### Use @larcjs/core (40KB)

✅ **Perfect for:**
- Applications needing dynamic routing
- Development environments with debugging enabled
- Complex message flows with transforms and predicates
- Teams wanting batteries-included solution

✅ **Best practices:**
- Ideal for rapid prototyping
- Use when bundle size isn't the primary concern
- Includes all features out of the box

**Example:**
```bash
npm install @larcjs/core
```

```html
<pan-bus enable-routing="true" debug="true"></pan-bus>
```

---

### Use À La Carte (core-lite + add-ons)

✅ **Perfect for:**
- Fine-grained control over bundle size
- Need routing OR debug, but not both
- Conditional loading based on environment
- Optimizing production vs development builds

✅ **Best practices:**
- Use core-lite as base (9KB)
- Add `@larcjs/core-routing` (8KB) only if needed
- Add `@larcjs/core-debug` (3KB) only in dev builds

**Example:**
```bash
npm install @larcjs/core-lite
npm install --save-dev @larcjs/core-debug
npm install @larcjs/core-routing  # if routing needed
```

```javascript
// Production
import '@larcjs/core-lite';

// Development only
if (process.env.NODE_ENV === 'development') {
  await import('@larcjs/core-debug');
}
```

## 📦 Package Details

### @larcjs/core-lite

**Size:** 9KB minified (3KB gzipped)

**Includes:**
- `pan.mjs` (autoloader) - 3.6KB
- `pan-bus-lite.mjs` (message bus) - 3.0KB
- `pan-client.mjs` (client API) - 2.0KB
- `pan-storage.mjs` (optional persistence) - 3.2KB

**Use cases:**
- Landing pages with minimal JavaScript
- Component libraries
- Micro-frontends
- Mobile-first applications

**Limitations:**
- No dynamic routing
- No debug/tracing tools
- No rate limiting
- No message size validation
- Simple retained message storage (no LRU)

---

### @larcjs/core

**Size:** 40KB minified (12KB gzipped)

**Includes:**
- Everything in core-lite
- `pan-routes.mjs` (routing system) - 8.3KB
- `pan-debug.mjs` (debug manager) - 3.0KB
- Rate limiting & security features
- Message size validation
- Statistics tracking
- LRU cache for retained messages

**Use cases:**
- Complex applications
- Admin dashboards
- Development environments
- Applications with sophisticated message flows

**Advantages:**
- Batteries included
- No additional setup
- Full feature set
- Lazy-loads routing/debug when enabled

---

### @larcjs/core-routing

**Size:** 8.3KB minified (3KB gzipped)

**Add to:** core-lite

**Provides:**
- Declarative route definitions
- Pattern matching with predicates
- Message transformations
- Multiple action types (EMIT, LOG, FORWARD, CALL)
- Runtime route management
- Performance statistics

**When to add:**
- Need conditional message routing
- Want to decouple routing logic from components
- Implementing feature flags via routing
- Building analytics pipelines
- Need transform/enrich messages

**Example:**
```javascript
import '@larcjs/core-lite';
import '@larcjs/core-routing';

window.pan.routes.add({
  name: 'Route VIP Orders',
  match: {
    type: 'order.created',
    where: { op: 'gte', path: 'payload.total', value: 1000 }
  },
  actions: [
    { type: 'EMIT', message: { type: 'alert.vip-order' } }
  ]
});
```

---

### @larcjs/core-debug

**Size:** 3.0KB minified (1KB gzipped)

**Add to:** core-lite

**Provides:**
- Message tracing and history
- Performance metrics
- State snapshots (export/import)
- Timeline visualization
- Filtering by topic patterns

**When to add:**
- Development environment
- Debugging complex message flows
- Profiling performance
- Capturing state for bug reports
- Integration with `<pan-inspector>`

**Example:**
```javascript
// Only in development
if (process.env.NODE_ENV === 'development') {
  await import('@larcjs/core-debug');
  window.pan.debug.enableTracing();
}
```

## 🔄 Migration Between Packages

### From core-lite to core

```bash
npm uninstall @larcjs/core-lite
npm install @larcjs/core
```

**Code changes:** None required! API is identical.

### From core to core-lite

```bash
npm uninstall @larcjs/core
npm install @larcjs/core-lite
```

**Check for:**
- Remove `enable-routing` attribute if present
- Remove routing-specific code
- Remove debug-specific code
- Verify no dependencies on rate limiting or validation

### Adding routing to core-lite

```bash
npm install @larcjs/core-routing
```

```html
<pan-bus enable-routing="true"></pan-bus>

<script type="module">
import '@larcjs/core-lite';
import '@larcjs/core-routing';

// Now you have window.pan.routes
</script>
```

### Adding debug to core-lite

```bash
npm install --save-dev @larcjs/core-debug
```

```html
<pan-bus debug="true" enable-tracing="true"></pan-bus>

<script type="module">
import '@larcjs/core-lite';
import '@larcjs/core-debug';

// Now you have window.pan.debug
</script>
```

## 💰 Cost-Benefit Analysis

### Scenario 1: Simple SPA

**Need:** Pub/sub between 10-20 components

**Recommendation:** @larcjs/core-lite (9KB)
- **Savings:** 31KB vs full version
- **Trade-off:** None (don't need routing/debug)
- **ROI:** ⭐⭐⭐⭐⭐

### Scenario 2: Admin Dashboard

**Need:** Complex routing, debugging, analytics

**Recommendation:** @larcjs/core (40KB)
- **Savings:** None, but worth it for features
- **Trade-off:** Larger bundle, more capabilities
- **ROI:** ⭐⭐⭐⭐ (worth the features)

### Scenario 3: E-commerce Site

**Need:** Pub/sub + routing for feature flags

**Recommendation:** core-lite + routing (17KB)
- **Savings:** 23KB vs full version
- **Trade-off:** No debug in production (good!)
- **ROI:** ⭐⭐⭐⭐⭐

### Scenario 4: Component Library

**Need:** Minimal messaging, distributed to many apps

**Recommendation:** @larcjs/core-lite (9KB)
- **Savings:** 31KB, critical for libraries
- **Trade-off:** Users can add routing if needed
- **ROI:** ⭐⭐⭐⭐⭐

## 📚 Additional Resources

- **[@larcjs/core](./core/README.md)** - Full-featured version
- **[@larcjs/core-lite](./packages/core-lite/README.md)** - Lightweight version
- **[@larcjs/core-routing](./packages/core-routing/README.md)** - Routing add-on
- **[@larcjs/core-debug](./packages/core-debug/README.md)** - Debug add-on

## 🤔 Still Unsure?

**Start with @larcjs/core-lite** (9KB). You can always upgrade later if you need routing or debugging. The API is identical across all packages.

```bash
npm install @larcjs/core-lite
```

If you later need routing:
```bash
npm install @larcjs/core-routing
```

If you later need everything:
```bash
npm uninstall @larcjs/core-lite
npm install @larcjs/core
```

**The modular approach saves 78% bundle size while maintaining full flexibility.**
