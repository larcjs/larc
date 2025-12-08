# Migration Guide: @larcjs/core → @larcjs/core-lite

Quick guide for migrating from the full `@larcjs/core` package to the lightweight `@larcjs/core-lite`.

## Why Migrate?

- ✅ **78% smaller bundle** - 9KB vs 40KB
- ✅ **Faster load times** - Essential features only
- ✅ **Same API** - Drop-in replacement
- ✅ **Add features later** - Routing and debug available as add-ons

## Quick Migration

### Step 1: Update package.json

```bash
npm uninstall @larcjs/core
npm install @larcjs/core-lite
```

### Step 2: Update imports

No changes needed! The API is identical:

```javascript
// Before (with @larcjs/core)
import '@larcjs/core';

// After (with @larcjs/core-lite)
import '@larcjs/core-lite';
// Everything works the same!
```

### Step 3: Test

Your code should work without any changes. The core messaging API is identical.

## What Changes?

### Features Removed from Lite

| Feature | Available in | Alternative |
|---------|-------------|-------------|
| **Dynamic Routing** | Full version only | Add `@larcjs/core-routing` |
| **Debug/Tracing** | Full version only | Add `@larcjs/core-debug` |
| **Rate Limiting** | Full version only | Not available |
| **Message Validation** | Full version only | Not available |
| **Statistics** | Full version only | Not available |
| **LRU Cache** | Full version only | Simple Map instead |

### Features Kept in Lite ✅

- ✅ Pub/sub messaging
- ✅ Retained messages
- ✅ Request/reply pattern
- ✅ Topic pattern matching with wildcards
- ✅ Custom element autoloading
- ✅ Zero dependencies

## API Compatibility

### 100% Compatible

These APIs work identically in both versions:

```javascript
// Publishing
bus.publish('topic', data);
bus.publish('topic', data, { retain: true });

// Subscribing
bus.subscribe('topic', handler);
bus.subscribe('topic.*', handler); // Wildcards work!

// Request/reply
const result = await bus.request('topic', data);

// Unsubscribe
const unsub = bus.subscribe('topic', handler);
unsub(); // Cleanup
```

### Not Available in Lite

```javascript
// ❌ These require full version or add-ons:

// Routing (requires @larcjs/core-routing)
window.pan.routes.add({ /* ... */ });

// Debug (requires @larcjs/core-debug)
window.pan.debug.enableTracing();

// Configuration (not in lite)
<pan-bus
  max-retained="1000"
  rate-limit="100"
  enable-routing="true"
></pan-bus>
```

## Migration Scenarios

### Scenario 1: You Only Use Pub/Sub

✅ **Perfect candidate for lite!**

```javascript
// Your code
bus.publish('user.login', { userId: 123 });
bus.subscribe('user.*', (msg) => {
  console.log('User event:', msg);
});
```

**Action:** Switch to core-lite immediately. Zero code changes.

---

### Scenario 2: You Use Routing

⚠️ **Need routing add-on**

```javascript
// You have routing code
window.pan.routes.add({
  match: { type: 'user.login' },
  actions: [{ type: 'EMIT', message: { type: 'analytics.track' } }]
});
```

**Options:**
1. Keep using `@larcjs/core` (40KB)
2. Use `core-lite` + `@larcjs/core-routing` (17KB)

**To add routing:**
```bash
npm install @larcjs/core-lite @larcjs/core-routing
```

```html
<pan-bus enable-routing="true"></pan-bus>

<script type="module">
import '@larcjs/core-lite';
import '@larcjs/core-routing';
// Now window.pan.routes is available
</script>
```

---

### Scenario 3: You Use Debug Tools

⚠️ **Need debug add-on (dev only)**

```javascript
// You use debugging
window.pan.debug.enableTracing();
const snapshot = window.pan.debug.captureSnapshot();
```

**Best practice:** Add debug only in development:

```javascript
// Production
import '@larcjs/core-lite';

// Development only
if (process.env.NODE_ENV === 'development') {
  await import('@larcjs/core-debug');
  window.pan.debug.enableTracing();
}
```

**Install:**
```bash
npm install @larcjs/core-lite
npm install --save-dev @larcjs/core-debug
```

---

### Scenario 4: You Use Both Routing and Debug

⚠️ **Consider your priorities**

**Option A: Stay with full version (simplest)**
```bash
# No changes needed
npm install @larcjs/core  # 40KB
```

**Option B: À la carte (optimized)**
```bash
npm install @larcjs/core-lite @larcjs/core-routing
npm install --save-dev @larcjs/core-debug
```

Result: 17KB in production, 20KB in dev (vs 40KB for full)

## Performance Impact

### Bundle Size

| Configuration | Size | Savings |
|--------------|------|---------|
| @larcjs/core (full) | 40KB | Baseline |
| @larcjs/core-lite | 9KB | **-31KB (78%)** |
| core-lite + routing | 17KB | -23KB (57%) |
| core-lite + debug | 12KB | -28KB (70%) |
| core-lite + both | 20KB | -20KB (50%) |

### Load Time Impact

Assuming 3G connection (750KB/s):

| Package | Download Time |
|---------|---------------|
| @larcjs/core | ~53ms |
| @larcjs/core-lite | ~12ms |

**Result:** 41ms faster initial load!

## Checklist

Before migrating, verify:

- [ ] You don't use `window.pan.routes.*` (or add routing package)
- [ ] You don't use `window.pan.debug.*` (or add debug package)
- [ ] You don't rely on rate limiting
- [ ] You don't rely on message size validation
- [ ] You don't rely on statistics tracking

If all checked, you're ready to migrate! 🎉

## Rollback Plan

If you need to go back:

```bash
npm uninstall @larcjs/core-lite
npm install @larcjs/core
```

No code changes needed - the API is identical.

## Need Help?

- 📖 [Package Comparison](../../PACKAGES.md)
- 💬 [Discussions](https://github.com/larcjs/larc/discussions)
- 🐛 [Issues](https://github.com/larcjs/larc/issues)

## Summary

**TL;DR:**
- Same API, 78% smaller
- Drop-in replacement if you only use pub/sub
- Add routing/debug as separate packages if needed
- Can always switch back with zero code changes

**Recommended approach:** Migrate to lite and add features only if you need them. Start small, grow as needed.
