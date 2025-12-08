# LARC Quick Start Guide

> Choose your adventure: 9KB → 40KB depending on your needs

## 🎯 Which Package Do I Need?

### Just Starting? → Use Core Lite (9KB)

```bash
npm install @larcjs/core-lite
```

**You get:**
- ✅ Pub/sub messaging
- ✅ Retained messages
- ✅ Request/reply
- ✅ Auto-loading components
- ✅ 94% smaller than React

---

## 📦 Package Quick Reference

| Package | Size | Install | When to Use |
|---------|------|---------|-------------|
| **[@larcjs/core-lite](./packages/core-lite)** | **9KB** | `npm i @larcjs/core-lite` | ⭐ **Start here!** Most apps |
| [@larcjs/core](./core) | 40KB | `npm i @larcjs/core` | Full-featured, rapid prototyping |
| [@larcjs/core-routing](./packages/core-routing) | +8KB | Add to lite | Need message routing |
| [@larcjs/core-debug](./packages/core-debug) | +3KB | Add to lite (dev) | Debugging & tracing |

---

## ⚡ Quick Install Examples

### Minimal Setup (9KB)

```bash
npm install @larcjs/core-lite
```

```html
<script type="module" src="https://unpkg.com/@larcjs/core-lite@latest/src/pan.js"></script>

<script>
  document.addEventListener('pan:publish', { detail: { topic: 'hello', data: 'world' } });
</script>
```

---

### With Routing (17KB)

```bash
npm install @larcjs/core-lite @larcjs/core-routing
```

```html
<pan-bus enable-routing="true"></pan-bus>

<script type="module">
import '@larcjs/core-lite';
import '@larcjs/core-routing';

window.pan.routes.add({
  match: { type: 'user.login' },
  actions: [{ type: 'EMIT', message: { type: 'analytics.track' } }]
});
</script>
```

---

### With Debug (12KB in dev, 9KB in prod)

```bash
npm install @larcjs/core-lite
npm install --save-dev @larcjs/core-debug
```

```javascript
import '@larcjs/core-lite';

if (process.env.NODE_ENV === 'development') {
  await import('@larcjs/core-debug');
  window.pan.debug.enableTracing();
}
```

---

### Full Featured (40KB)

```bash
npm install @larcjs/core
```

```html
<pan-bus enable-routing="true" debug="true"></pan-bus>

<script type="module" src="https://unpkg.com/@larcjs/core@latest/src/pan.js"></script>
```

---

## 🚀 Basic Usage

### Publishing Messages

```javascript
// Simple publish
bus.publish('user.login', { userId: 123 });

// With retained message (like state)
bus.publish('theme.current', { theme: 'dark' }, { retain: true });
```

### Subscribing to Messages

```javascript
// Subscribe to specific topic
bus.subscribe('user.login', (msg) => {
  console.log('User logged in:', msg.data);
});

// Subscribe with wildcard
bus.subscribe('user.*', (msg) => {
  console.log('Any user event:', msg);
});

// Unsubscribe
const unsub = bus.subscribe('topic', handler);
unsub(); // Clean up later
```

### Request/Reply Pattern

```javascript
// Responder
bus.subscribe('user.get', async (msg) => {
  const user = await fetchUser(msg.data.id);
  return { ok: true, user };
});

// Requester
const response = await bus.request('user.get', { id: 123 });
console.log(response.user);
```

---

## 📊 Size Comparison Chart

```
React (140KB)     ████████████████████████████████████████
Vue (90KB)        █████████████████████████
@larcjs/core (40) ████████████
@larcjs/core-lite ███  (9KB) ← You are here! ⭐
```

---

## 🔄 Migration Path

### Already using @larcjs/core?

Downgrade to save 31KB:

```bash
npm uninstall @larcjs/core
npm install @larcjs/core-lite
```

No code changes needed! Same API.

### Need a feature back?

Add it à la carte:

```bash
npm install @larcjs/core-routing  # +8KB
npm install @larcjs/core-debug    # +3KB
```

---

## 📚 Learn More

- **[Package Selection Guide](./PACKAGES.md)** - Detailed comparison
- **[Migration Guide](./packages/core-lite/MIGRATION.md)** - From full to lite
- **[Full Docs](https://larcjs.github.io/site/)** - Complete documentation

---

## 💡 Pro Tips

1. **Start small** - Begin with core-lite, add features later
2. **Dev vs Prod** - Use debug in dev only
3. **Measure first** - Profile before adding routing
4. **Stay modular** - Don't pay for what you don't use

---

## ❓ FAQ

### Q: Will core-lite work with my existing code?

**A:** Yes! Same API as full version. Drop-in replacement.

### Q: Can I upgrade from lite to full later?

**A:** Yes, just `npm install @larcjs/core`. Zero code changes.

### Q: What if I need routing?

**A:** Add `@larcjs/core-routing` (8KB) to core-lite (9KB) = 17KB total.

### Q: Is 9KB the minified or gzipped size?

**A:** 9KB minified, ~3KB gzipped. Load time is based on gzipped.

---

**TL;DR:** Use `@larcjs/core-lite` unless you know you need more. 9KB of pure messaging goodness. 🎉
