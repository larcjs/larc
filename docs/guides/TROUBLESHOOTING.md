# LARC Troubleshooting Guide

**Version:** 1.0
**Last Updated:** November 2024
**Status:** Production Ready

Comprehensive troubleshooting guide for LARC (Lightweight Asynchronous Relay Core). This guide provides practical solutions to common issues, debugging techniques, and step-by-step diagnostic workflows.

---

## Table of Contents

1. [Quick Reference: Common Issues](#1-quick-reference-common-issues)
2. [Components Not Loading](#2-components-not-loading)
3. [Messages Not Being Delivered](#3-messages-not-being-delivered)
4. [Bus Not Ready Errors](#4-bus-not-ready-errors)
5. [Module Resolution Failures](#5-module-resolution-failures)
6. [Memory Leaks and Performance](#6-memory-leaks-and-performance)
7. [CORS and CDN Issues](#7-cors-and-cdn-issues)
8. [CSP Violations](#8-csp-violations)
9. [Debugging Tools and Techniques](#9-debugging-tools-and-techniques)
10. [Error Messages Reference](#10-error-messages-reference)
11. [Browser Compatibility Issues](#11-browser-compatibility-issues)
12. [Integration Issues](#12-integration-issues)
13. [Development vs Production Issues](#13-development-vs-production-issues)
14. [Diagnostic Workflows](#14-diagnostic-workflows)
15. [Getting Help](#15-getting-help)

---

## 1. Quick Reference: Common Issues

### 1.1 Most Common Problems

| Problem | Quick Fix | Section |
|---------|-----------|---------|
| Component not loading | Check `data-module` attribute, verify path | [2.1](#21-component-not-defined) |
| Messages not received | Wait for `bus.ready()`, check topic pattern | [3.1](#31-subscriber-not-receiving-messages) |
| Bus not ready | Ensure `<pan-bus>` element exists in DOM | [4.1](#41-pan-bus-element-missing) |
| CDN 404 error | Pin CDN version, check URL format | [7.1](#71-cdn-resources-not-loading) |
| CSP blocking scripts | Add CDN to `script-src` directive | [8.1](#81-scripts-blocked-by-csp) |
| Retained messages not working | Use `{ retained: true }` in subscribe options | [3.3](#33-retained-messages-not-delivered) |
| Memory growing | Unsubscribe when done, avoid circular refs | [6.1](#61-memory-leaks) |
| Request timeout | Verify responder is subscribed, increase timeout | [3.5](#35-request-timeout) |

### 1.2 Emergency Checklist

If LARC isn't working at all, check these in order:

1. [ ] Is `<pan-bus>` in the DOM?
2. [ ] Are browser DevTools showing any console errors?
3. [ ] Is the browser modern enough? (Chrome 90+, Firefox 88+, Safari 14+)
4. [ ] Are module scripts loading? (Check Network tab)
5. [ ] Is CSP blocking resources?
6. [ ] Is CDN accessible? (Try loading URL directly)

---

## 2. Components Not Loading

### 2.1 Component Not Defined

**Problem:** Custom element appears but doesn't render. Console shows: `Uncaught DOMException: Failed to execute 'define' on 'CustomElementRegistry'`

**Symptoms:**
- Element shows as `:not(:defined)` in DevTools
- Component appears as plain text in DOM
- No functionality

**Common Causes:**

#### 2.1.1 Component File Not Found

```html
<!-- Wrong: File doesn't exist -->
<my-component></my-component>
<!-- Autoloader looks for: ./components/my-component.mjs -->
```

**Solution:**
```bash
# Verify file exists
ls ./components/my-component.mjs

# Or specify explicit path
<my-component data-module="/path/to/component.mjs"></my-component>
```

#### 2.1.2 Component Path Configuration

```javascript
// Check autoloader configuration
console.log(window.panAutoload.config);
// Should show:
// {
//   baseUrl: "...",
//   componentsPath: "./components/",
//   extension: ".mjs"
// }

// Fix configuration before loading pan.mjs
window.panAutoload = {
  baseUrl: '/static/',
  componentsPath: './components/',
  extension: '.mjs'
};
```

#### 2.1.3 Component Not Exported Properly

```javascript
// ❌ WRONG: No export
class MyComponent extends HTMLElement {
  // ...
}
customElements.define('my-component', MyComponent);

// ✅ CORRECT: Export as default
class MyComponent extends HTMLElement {
  // ...
}
export default MyComponent;
```

#### 2.1.4 Naming Mismatch

```javascript
// ❌ WRONG: Tag name doesn't match class
<my-widget></my-widget>
// File: my-component.mjs (name doesn't match tag)

// ✅ CORRECT: Match tag name to filename
<my-widget></my-widget>
// File: my-widget.mjs
```

**Debugging Steps:**

1. **Check console for errors**
   ```javascript
   // Look for module loading errors
   // Open DevTools Console and check for 404s or import errors
   ```

2. **Verify autoloader saw the element**
   ```javascript
   // Check if element was observed
   const el = document.querySelector('my-component');
   console.log('Is custom tag:', el.tagName.includes('-'));
   console.log('Is defined:', customElements.get(el.localName));
   ```

3. **Manually load component**
   ```javascript
   // Force load to see error
   await window.panAutoload.maybeLoadFor(
     document.querySelector('my-component')
   );
   ```

4. **Check Network tab**
   - Look for 404 errors on `.mjs` files
   - Verify correct URL is being requested
   - Check CORS headers if loading from CDN

### 2.2 Module Import Errors

**Problem:** Component file loads but import fails

**Symptoms:**
```
Uncaught SyntaxError: Cannot use import statement outside a module
```

**Solutions:**

#### 2.2.1 Missing `type="module"`

```html
<!-- ❌ WRONG -->
<script src="./pan.mjs"></script>

<!-- ✅ CORRECT -->
<script type="module" src="./pan.mjs"></script>
```

#### 2.2.2 Relative Import Path Issues

```javascript
// ❌ WRONG: Relative import without extension
import { PanClient } from './pan-client';

// ✅ CORRECT: Include extension
import { PanClient } from './pan-client.mjs';

// ✅ ALSO CORRECT: Absolute or CDN URL
import { PanClient } from 'https://unpkg.com/@larcjs/core@3.0.1/pan-client.mjs';
```

### 2.3 Autoloader Not Running

**Problem:** Components never load, no errors in console

**Symptoms:**
- Elements remain `:not(:defined)`
- Network tab shows no component requests
- `window.panAutoload` is undefined

**Solutions:**

#### 2.3.1 Check Autoloader Loaded

```javascript
// Verify autoloader is present
if (!window.panAutoload) {
  console.error('Autoloader not loaded!');
  // Check if pan.mjs was loaded correctly
}
```

#### 2.3.2 Check IntersectionObserver Support

```javascript
// Verify browser support
if (!('IntersectionObserver' in window)) {
  console.error('IntersectionObserver not supported');
  // Load polyfill or manually load components
}
```

#### 2.3.3 Manually Trigger Observation

```javascript
// Force observation of element
const container = document.querySelector('#dynamic-content');
window.panAutoload.observeTree(container);
```

### 2.4 Dynamic Components Not Loading

**Problem:** Components added via JavaScript don't auto-load

**Solution:**

```javascript
// After adding elements dynamically, trigger observation
const container = document.querySelector('#app');
container.innerHTML = '<my-component></my-component>';

// Trigger autoloader
window.panAutoload.observeTree(container);

// OR manually load
const el = container.querySelector('my-component');
await window.panAutoload.maybeLoadFor(el);
```

---

## 3. Messages Not Being Delivered

### 3.1 Subscriber Not Receiving Messages

**Problem:** Published messages don't reach subscriber

**Debugging Steps:**

#### 3.1.1 Verify Bus is Ready

```javascript
// ❌ WRONG: Publish before bus ready
const client = new PanClient();
client.publish({ topic: 'test', data: {} }); // May be lost

// ✅ CORRECT: Wait for ready
const client = new PanClient();
await client.ready();
client.publish({ topic: 'test', data: {} });
```

#### 3.1.2 Check Topic Matching

```javascript
// Debug topic matching
const topic = 'users.item.updated';
const pattern = 'users.*';

// Check if pattern matches
console.log('Matches:', PanClient.matches(topic, pattern));
// false - pattern only matches one segment

// Fix: Use correct pattern
const correctPattern = 'users.item.*'; // or 'users.*.updated'
console.log('Matches:', PanClient.matches(topic, correctPattern)); // true
```

#### 3.1.3 Verify Subscription

```javascript
// Add debug logging to subscription
client.subscribe('users.*', (msg) => {
  console.log('Received message:', msg);
  // If you see this, subscription works
});

// Test with a publish
client.publish({
  topic: 'users.test',
  data: { test: true }
});
```

#### 3.1.4 Check Element Still in DOM

```javascript
// If subscribing from a component, ensure it's still connected
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    this.unsub = this.client.subscribe('data.*', (msg) => {
      if (!this.isConnected) {
        console.warn('Component disconnected but still receiving messages!');
        this.unsub(); // Clean up
      }
    });
  }

  disconnectedCallback() {
    // IMPORTANT: Unsubscribe when component removed
    if (this.unsub) this.unsub();
  }
}
```

### 3.2 Wildcard Subscriptions Not Working

**Problem:** Wildcard patterns don't match expected topics

**Pattern Rules:**

```javascript
// Single segment wildcard
'users.*'         // Matches: users.list, users.item
                  // NOT: users.item.updated (2 segments after users)

// Multiple wildcards
'*.updated'       // Matches: users.updated, posts.updated
'users.*.state'   // Matches: users.list.state, users.item.state

// Global wildcard
'*'               // Matches: ALL topics (use carefully!)
```

**Testing Patterns:**

```javascript
// Test your patterns
const testPatterns = [
  ['users.item.updated', 'users.*'],           // false
  ['users.item.updated', 'users.item.*'],      // true
  ['users.item.updated', '*.updated'],         // false
  ['users.item.updated', '*.*.updated'],       // true
  ['users.item.updated', 'users.*.updated'],   // true
  ['users.item.updated', '*'],                 // true
];

testPatterns.forEach(([topic, pattern]) => {
  console.log(`${topic} ~ ${pattern} = ${PanClient.matches(topic, pattern)}`);
});
```

### 3.3 Retained Messages Not Delivered

**Problem:** New subscriber doesn't receive retained message

**Solutions:**

#### 3.3.1 Enable Retained Option

```javascript
// ❌ WRONG: No retained option
client.subscribe('app.state', (msg) => {
  // Won't receive retained message
});

// ✅ CORRECT: Request retained messages
client.subscribe('app.state', (msg) => {
  // Will receive current state immediately
}, { retained: true });
```

#### 3.3.2 Verify Message Was Published with Retain

```javascript
// ❌ WRONG: No retain flag
client.publish({
  topic: 'app.state',
  data: { theme: 'dark' }
  // Missing: retain: true
});

// ✅ CORRECT: Set retain flag
client.publish({
  topic: 'app.state',
  data: { theme: 'dark' },
  retain: true  // Store for late subscribers
});
```

#### 3.3.3 Check Retention Limits

```javascript
// If using pan-bus with memory limits
// Check if retained message was evicted
document.querySelector('pan-bus').dispatchEvent(
  new CustomEvent('pan:sys.stats', { bubbles: true })
);

// Listen for stats
document.addEventListener('pan:deliver', (e) => {
  if (e.detail.topic === 'pan:sys.stats') {
    console.log('Retained messages:', e.detail.data.retained);
    console.log('Evicted count:', e.detail.data.retainedEvicted);
  }
}, { once: true });
```

### 3.4 Messages Delayed or Out of Order

**Problem:** Messages arrive late or in wrong order

**Causes & Solutions:**

#### 3.4.1 Heavy Processing in Handler

```javascript
// ❌ PROBLEM: Blocking handler
client.subscribe('data.*', (msg) => {
  // Expensive synchronous operation blocks other messages
  const result = processHeavyData(msg.data); // Takes 100ms
  updateUI(result);
});

// ✅ SOLUTION: Use async processing
client.subscribe('data.*', async (msg) => {
  // Process asynchronously
  const result = await processHeavyDataAsync(msg.data);
  updateUI(result);
});

// OR: Defer processing
client.subscribe('data.*', (msg) => {
  setTimeout(() => {
    const result = processHeavyData(msg.data);
    updateUI(result);
  }, 0);
});
```

#### 3.4.2 Race Conditions

```javascript
// ❌ PROBLEM: Race condition
let userData = null;
client.subscribe('user.loaded', (msg) => {
  userData = msg.data; // May arrive after other messages
});

client.subscribe('user.action', (msg) => {
  // userData might still be null!
  processAction(userData, msg.data);
});

// ✅ SOLUTION: Use retained messages
client.publish({
  topic: 'user.loaded',
  data: currentUser,
  retain: true  // Late subscribers get it immediately
});

client.subscribe('user.loaded', (msg) => {
  userData = msg.data;
}, { retained: true }); // Get current user immediately
```

### 3.5 Request Timeout

**Problem:** `client.request()` times out

**Symptoms:**
```
Error: PAN request timeout
```

**Solutions:**

#### 3.5.1 Verify Responder is Subscribed

```javascript
// Make sure someone is listening!
// Responder side:
client.subscribe('api.user.get', (msg) => {
  if (!msg.replyTo) return; // Not a request

  // Process and reply
  const user = getUser(msg.data.id);
  client.publish({
    topic: msg.replyTo,
    data: { ok: true, item: user },
    correlationId: msg.correlationId
  });
});

// Requester side:
try {
  const response = await client.request('api.user.get', { id: 123 });
  console.log('User:', response.data.item);
} catch (err) {
  console.error('No responder available');
}
```

#### 3.5.2 Increase Timeout

```javascript
// Default timeout is 5000ms
const response = await client.request('api.slow.operation', data, {
  timeoutMs: 10000  // Increase to 10 seconds
});
```

#### 3.5.3 Check for Reply Errors

```javascript
// Responder: Always send a reply, even on error
client.subscribe('api.user.get', async (msg) => {
  if (!msg.replyTo) return;

  try {
    const user = await getUser(msg.data.id);
    client.publish({
      topic: msg.replyTo,
      data: { ok: true, item: user },
      correlationId: msg.correlationId
    });
  } catch (err) {
    // Send error reply instead of silence
    client.publish({
      topic: msg.replyTo,
      data: { ok: false, error: err.message },
      correlationId: msg.correlationId
    });
  }
});
```

---

## 4. Bus Not Ready Errors

### 4.1 PAN Bus Element Missing

**Problem:** `window.__panReady` is undefined, `pan:sys.ready` event never fires

**Symptoms:**
```javascript
await client.ready(); // Never resolves
```

**Solutions:**

#### 4.1.1 Add Bus Element

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="./src/pan.mjs"></script>
</head>
<body>
  <!-- ✅ Add this -->
  <pan-bus></pan-bus>

  <my-app></my-app>
</body>
</html>
```

#### 4.1.2 Ensure Bus Loads First

```javascript
// If creating bus programmatically
import { ensureBus } from './src/pan.mjs';

// Create bus before using client
ensureBus();

const client = new PanClient();
await client.ready();
```

#### 4.1.3 Check Bus is Defined

```javascript
// Verify bus custom element is defined
if (!customElements.get('pan-bus')) {
  console.error('pan-bus not defined!');
  // Check if pan.mjs loaded correctly
}

// Check if bus exists in DOM
const bus = document.querySelector('pan-bus');
if (!bus) {
  console.error('pan-bus element not in DOM!');
}
```

### 4.2 Bus Ready Race Condition

**Problem:** Client created before bus is ready

**Solution:**

```javascript
// ❌ PROBLEM: Create client too early
const client = new PanClient(); // Bus might not exist yet

// ✅ SOLUTION 1: Wait for DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  const client = new PanClient();
  await client.ready();
  // Now safe to use
});

// ✅ SOLUTION 2: Wait for bus ready event
document.addEventListener('pan:sys.ready', () => {
  const client = new PanClient();
  // Bus is guaranteed ready
}, { once: true });

// ✅ SOLUTION 3: Always await ready()
const client = new PanClient();
await client.ready(); // Waits for bus if needed
client.publish({ topic: 'app.started', data: {} });
```

### 4.3 Multiple Bus Elements

**Problem:** Multiple `<pan-bus>` elements in DOM

**Symptoms:**
- Duplicate message delivery
- Unexpected behavior
- Messages delivered multiple times

**Solution:**

```javascript
// Check for multiple buses
const buses = document.querySelectorAll('pan-bus');
if (buses.length > 1) {
  console.error(`Found ${buses.length} bus elements! Should be 1.`);
  // Remove extras
  buses.forEach((bus, i) => {
    if (i > 0) bus.remove();
  });
}
```

---

## 5. Module Resolution Failures

### 5.1 Relative Path Issues

**Problem:** Module imports fail with 404

**Symptoms:**
```
GET http://localhost/pan-client.mjs 404 (Not Found)
```

**Solutions:**

#### 5.1.1 Always Include Extension

```javascript
// ❌ WRONG: Missing .mjs extension
import { PanClient } from './components/pan-client';

// ✅ CORRECT: Include extension
import { PanClient } from './components/pan-client.mjs';
```

#### 5.1.2 Use Absolute Paths or Import Maps

```html
<!-- Import map for cleaner imports -->
<script type="importmap">
{
  "imports": {
    "larc": "/static/larc/pan.mjs",
    "larc/": "/static/larc/"
  }
}
</script>

<script type="module">
import { PanClient } from 'larc';
import { PanBus } from 'larc/components/pan-bus.mjs';
</script>
```

### 5.2 CDN Module Resolution

**Problem:** Components can't load when using CDN for core

**Solution:**

```html
<script type="module">
  // Configure autoloader for CDN
  window.panAutoload = {
    baseUrl: 'https://unpkg.com/@larcjs/core@3.0.1/',
    componentsPath: './',
    extension: '.mjs'
  };
</script>
<script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>
```

### 5.3 Path Resolution with data-module

**Problem:** Custom component paths not resolving

**Solutions:**

```html
<!-- Relative to current page -->
<my-component data-module="./widgets/my-component.mjs"></my-component>

<!-- Absolute path -->
<my-component data-module="/static/components/my-component.mjs"></my-component>

<!-- CDN URL -->
<my-component data-module="https://unpkg.com/my-package/component.mjs"></my-component>
```

---

## 6. Memory Leaks and Performance

### 6.1 Memory Leaks

**Problem:** Memory usage grows over time

**Common Causes:**

#### 6.1.1 Subscriptions Not Cleaned Up

```javascript
// ❌ PROBLEM: Subscriptions leak
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    this.client.subscribe('data.*', this.handleData);
    // No cleanup when component removed!
  }

  handleData = (msg) => {
    this.render(msg.data);
  }
}

// ✅ SOLUTION: Always unsubscribe
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    // Store unsubscribe function
    this.unsub = this.client.subscribe('data.*', this.handleData);
  }

  disconnectedCallback() {
    // Clean up subscription
    if (this.unsub) this.unsub();
  }

  handleData = (msg) => {
    this.render(msg.data);
  }
}

// ✅ BETTER: Use AbortSignal
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    this.abortController = new AbortController();

    // Auto-cleanup with signal
    this.client.subscribe('data.*', this.handleData, {
      signal: this.abortController.signal
    });
  }

  disconnectedCallback() {
    // Unsubscribe all at once
    this.abortController.abort();
  }

  handleData = (msg) => {
    this.render(msg.data);
  }
}
```

#### 6.1.2 Circular References in Messages

```javascript
// ❌ PROBLEM: Circular reference
const obj = { name: 'test' };
obj.self = obj; // Circular!

client.publish({
  topic: 'data.update',
  data: obj // Will fail validation
});

// ✅ SOLUTION: Only send serializable data
client.publish({
  topic: 'data.update',
  data: { name: 'test' } // Plain object
});
```

#### 6.1.3 Large Retained Messages

```javascript
// ❌ PROBLEM: Retaining huge datasets
client.publish({
  topic: 'users.list',
  data: { users: largeArrayOf10000Users },
  retain: true // Stored in memory!
});

// ✅ SOLUTION: Paginate or use pagination topic
client.publish({
  topic: 'users.list.page.1',
  data: { users: first100Users, total: 10000 },
  retain: true
});
```

### 6.2 Performance Issues

#### 6.2.1 Too Many Subscribers

**Problem:** Performance degrades with many subscribers

**Solution:**

```javascript
// ❌ PROBLEM: Each element subscribes individually
class ListItem extends HTMLElement {
  connectedCallback() {
    // 1000 items = 1000 subscriptions!
    this.unsub = client.subscribe('item.update', this.handleUpdate);
  }
}

// ✅ SOLUTION: Subscribe once at parent level
class ItemList extends HTMLElement {
  connectedCallback() {
    // One subscription for all items
    this.unsub = client.subscribe('item.update', (msg) => {
      const item = this.querySelector(`[data-id="${msg.data.id}"]`);
      if (item) item.update(msg.data);
    });
  }
}
```

#### 6.2.2 Message Rate Limiting

**Problem:** Publishing too many messages causes performance issues

**Solution:**

```javascript
// ❌ PROBLEM: Publish on every input event
input.addEventListener('input', (e) => {
  client.publish({
    topic: 'search.query',
    data: { query: e.target.value }
  }); // Publishes hundreds of times per second!
});

// ✅ SOLUTION: Debounce
let debounceTimer;
input.addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    client.publish({
      topic: 'search.query',
      data: { query: e.target.value }
    });
  }, 300); // Only publish after 300ms of no input
});
```

#### 6.2.3 Heavy Message Processing

**Problem:** Message handlers block UI

**Solution:**

```javascript
// ❌ PROBLEM: Synchronous heavy processing
client.subscribe('data.process', (msg) => {
  const result = heavyComputation(msg.data); // Blocks UI!
  updateUI(result);
});

// ✅ SOLUTION: Use Web Workers
const worker = new Worker('/workers/process.js');

client.subscribe('data.process', (msg) => {
  worker.postMessage(msg.data);
});

worker.onmessage = (e) => {
  updateUI(e.data);
};
```

### 6.3 Monitoring Memory Usage

```javascript
// Monitor memory usage
function logMemoryUsage() {
  if (performance.memory) {
    const { usedJSHeapSize, totalJSHeapSize } = performance.memory;
    console.log('Memory:', {
      used: `${(usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      percentage: `${((usedJSHeapSize / totalJSHeapSize) * 100).toFixed(1)}%`
    });
  }
}

// Check periodically
setInterval(logMemoryUsage, 10000);

// Check PAN bus stats
function checkBusStats() {
  const bus = document.querySelector('pan-bus');
  if (bus && bus.stats) {
    console.log('Bus stats:', bus.stats);
  }
}
```

---

## 7. CORS and CDN Issues

### 7.1 CDN Resources Not Loading

**Problem:** CDN modules fail to load with CORS or 404 errors

**Symptoms:**
```
Access to script at 'https://unpkg.com/...' from origin 'http://localhost' has been blocked by CORS policy
```

**Solutions:**

#### 7.1.1 Pin CDN Versions

```html
<!-- ❌ WRONG: Unpinned version can break -->
<script type="module" src="https://unpkg.com/@larcjs/core/pan.mjs"></script>

<!-- ✅ CORRECT: Pinned version -->
<script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>
```

#### 7.1.2 CDN Failover

```javascript
// Implement automatic failover
const CDN_SOURCES = [
  'https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs',
  'https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/src/pan.mjs',
  '/static/larc/pan.mjs' // Local fallback
];

async function loadWithFailover(sources) {
  for (const src of sources) {
    try {
      await import(src);
      console.log(`Loaded from: ${src}`);
      return;
    } catch (err) {
      console.warn(`Failed to load from ${src}:`, err);
    }
  }
  throw new Error('Failed to load from all sources');
}

await loadWithFailover(CDN_SOURCES);
```

#### 7.1.3 Check CDN Status

```javascript
// Test CDN availability
async function testCDN(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (err) {
    return false;
  }
}

const cdnAvailable = await testCDN('https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs');
console.log('CDN available:', cdnAvailable);
```

### 7.2 Mixed Content Errors

**Problem:** HTTPS page loading HTTP resources

**Symptoms:**
```
Mixed Content: The page at 'https://example.com' was loaded over HTTPS, but requested an insecure script 'http://unpkg.com/...'
```

**Solution:**

```html
<!-- ❌ WRONG: HTTP URL -->
<script type="module" src="http://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>

<!-- ✅ CORRECT: HTTPS URL -->
<script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>

<!-- ✅ BETTER: Protocol-relative (not recommended for modules) -->
<script type="module" src="//unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>
```

### 7.3 CDN Cache Issues

**Problem:** Old version cached, new version not loading

**Solutions:**

```javascript
// Clear service worker cache
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(reg => reg.unregister());
  });

  caches.keys().then(names => {
    names.forEach(name => caches.delete(name));
  });
}

// Force reload bypassing cache
location.reload(true);

// Or use cache-busting query param
const timestamp = Date.now();
const script = document.createElement('script');
script.type = 'module';
script.src = `./pan.mjs?v=${timestamp}`;
document.head.appendChild(script);
```

---

## 8. CSP Violations

### 8.1 Scripts Blocked by CSP

**Problem:** Console shows CSP violation errors

**Symptoms:**
```
Refused to load the script 'https://unpkg.com/...' because it violates the following Content Security Policy directive: "script-src 'self'"
```

**Solutions:**

#### 8.1.1 Update CSP Header

```html
<!-- Add CDN to allowed sources -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;
  script-src-elem 'self' https://unpkg.com;
  connect-src 'self';
  style-src 'self' 'unsafe-inline';
">
```

#### 8.1.2 Nginx CSP Configuration

```nginx
add_header Content-Security-Policy "
  default-src 'self';
  script-src 'self' https://unpkg.com https://cdn.jsdelivr.net;
  script-src-elem 'self' https://unpkg.com;
  connect-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  font-src 'self' data:;
  worker-src 'self' blob:;
" always;
```

#### 8.1.3 Test CSP Locally

```javascript
// Check what's being blocked
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    directive: e.violatedDirective,
    blocked: e.blockedURI,
    document: e.documentURI
  });
});
```

### 8.2 Unsafe-inline Required

**Problem:** Inline event handlers or styles blocked

**Solution:**

```javascript
// ❌ AVOID: Inline event handlers
<button onclick="handleClick()">Click</button>

// ✅ USE: Proper event listeners
<button id="myBtn">Click</button>
<script type="module">
  document.getElementById('myBtn').addEventListener('click', handleClick);
</script>
```

### 8.3 Worker CSP Issues

**Problem:** Web Workers blocked by CSP

**Solution:**

```html
<meta http-equiv="Content-Security-Policy" content="
  worker-src 'self' blob:;
">
```

---

## 9. Debugging Tools and Techniques

### 9.1 Enable Debug Mode

```html
<!-- Enable debug logging -->
<pan-bus debug="true"></pan-bus>
```

```javascript
// Or enable programmatically
const bus = document.querySelector('pan-bus');
if (bus) {
  bus.setAttribute('debug', 'true');
}

// Check debug output in console
// [PAN Bus] Published {topic: "test", retain: false, delivered: 2}
```

### 9.2 Browser DevTools

#### 9.2.1 Check Component Registration

```javascript
// In DevTools Console:

// List all defined custom elements
customElements.getName(MyComponent); // Returns tag name

// Check if element is defined
customElements.get('my-component'); // Returns constructor or undefined

// Get all custom elements in page
document.querySelectorAll('*').forEach(el => {
  if (el.tagName.includes('-')) {
    console.log(el.tagName, customElements.get(el.localName) ? '✅' : '❌');
  }
});
```

#### 9.2.2 Monitor Network Requests

```javascript
// Enable verbose logging for module loads
// Chrome DevTools: Network tab
// Filter: .mjs
// Look for:
// - Status codes (404 = not found, 200 = OK)
// - Timing (slow loading?)
// - Size (large modules?)
// - CORS headers
```

#### 9.2.3 Inspect Event Listeners

```javascript
// Get event listeners on bus
getEventListeners(document.querySelector('pan-bus'));

// Check message deliveries
monitorEvents(document, 'pan:deliver');
// Now see all pan:deliver events in console
```

### 9.3 Message Logging

```javascript
// Log all messages
const client = new PanClient();

client.subscribe('*', (msg) => {
  console.log(`[${msg.topic}]`, msg.data, {
    id: msg.id,
    ts: new Date(msg.ts).toISOString(),
    retain: msg.retain,
    correlationId: msg.correlationId
  });
});
```

### 9.4 Performance Profiling

```javascript
// Profile message throughput
let messageCount = 0;
let startTime = Date.now();

client.subscribe('*', () => {
  messageCount++;
});

setInterval(() => {
  const elapsed = (Date.now() - startTime) / 1000;
  const rate = (messageCount / elapsed).toFixed(2);
  console.log(`Message rate: ${rate} msg/sec (${messageCount} total)`);
}, 5000);
```

### 9.5 Check Bus Statistics

```javascript
// Request bus stats
function getBusStats() {
  return new Promise((resolve) => {
    const listener = (e) => {
      if (e.detail.topic === 'pan:sys.stats') {
        document.removeEventListener('pan:deliver', listener);
        resolve(e.detail.data);
      }
    };

    document.addEventListener('pan:deliver', listener);
    document.dispatchEvent(
      new CustomEvent('pan:sys.stats', { bubbles: true })
    );
  });
}

// Use it
const stats = await getBusStats();
console.log('Bus Stats:', stats);
// {
//   published: 1234,
//   delivered: 5678,
//   dropped: 0,
//   subscriptions: 12,
//   clients: 3,
//   retained: 5
// }
```

### 9.6 Test Component Loading

```javascript
// Test component load
async function testComponentLoad(tagName) {
  console.log(`Testing: ${tagName}`);

  const el = document.createElement(tagName);
  document.body.appendChild(el);

  try {
    await window.panAutoload.maybeLoadFor(el);

    if (customElements.get(tagName)) {
      console.log(`✅ ${tagName} loaded successfully`);
      return true;
    } else {
      console.error(`❌ ${tagName} failed to define`);
      return false;
    }
  } catch (err) {
    console.error(`❌ ${tagName} load error:`, err);
    return false;
  } finally {
    el.remove();
  }
}

// Test multiple components
await testComponentLoad('my-component');
await testComponentLoad('my-widget');
```

---

## 10. Error Messages Reference

### 10.1 Bus Error Codes

| Code | Message | Cause | Solution |
|------|---------|-------|----------|
| `RATE_LIMIT_EXCEEDED` | Too many messages | Client exceeded rate limit | Reduce publish frequency or increase limit |
| `MESSAGE_INVALID` | Message validation failed | Data not serializable or too large | Check message data, avoid circular refs |
| `SUBSCRIPTION_INVALID` | Subscription rejected | Invalid pattern or global wildcard disabled | Fix pattern or enable global wildcards |
| `PAYLOAD_SIZE_EXCEEDED` | Payload too large | Data exceeds maxPayloadSize | Reduce data size or increase limit |

### 10.2 Component Loading Errors

```javascript
// "Failed to load module"
// Cause: 404 on component file
// Solution: Check file path, verify file exists

// "Uncaught SyntaxError: Cannot use import statement outside a module"
// Cause: Missing type="module"
// Solution: Add type="module" to script tag

// "Failed to execute 'define' on 'CustomElementRegistry'"
// Cause: Element already defined or invalid name
// Solution: Check for duplicate definitions, verify tag name has dash

// "The provided value is not of type 'Function'"
// Cause: Component didn't export a class
// Solution: Export class as default

// "Uncaught TypeError: Cannot read property 'prototype' of undefined"
// Cause: Module didn't load correctly
// Solution: Check network tab, verify import path
```

### 10.3 Message Errors

```javascript
// "PAN request timeout"
// Cause: No responder or responder too slow
// Solution: Verify responder subscribed, increase timeout

// "Data must be JSON-serializable"
// Cause: Circular reference or function in data
// Solution: Only send plain objects, arrays, primitives

// "Message size exceeds limit"
// Cause: Message too large (default 1MB)
// Solution: Reduce data size or increase maxMessageSize

// "Topic must be a non-empty string"
// Cause: Missing or invalid topic
// Solution: Provide valid topic string
```

### 10.4 Browser-Specific Errors

#### Safari

```javascript
// "ReferenceError: Can't find variable: customElements"
// Cause: Safari < 10.1
// Solution: Update Safari or load polyfill

// "TypeError: IntersectionObserver is not a constructor"
// Cause: Safari < 12.1
// Solution: Load IntersectionObserver polyfill
```

#### Firefox

```javascript
// "Import declarations may only appear at top level of a module"
// Cause: Dynamic import() in wrong context
// Solution: Use static imports or ensure module context
```

---

## 11. Browser Compatibility Issues

### 11.1 Check Browser Support

```javascript
import { Features } from './src/utils/features.mjs';

// Check if browser is compatible
if (!Features.hasCoreFeatuers()) {
  console.error('Browser not supported!');

  // Show upgrade message
  const report = Features.getReport();
  console.log('Missing features:', report.core);
  console.log('Recommendations:', report.recommendations);
}

// Check specific features
if (!Features.has.intersectionObserver()) {
  console.warn('IntersectionObserver not supported, components will load immediately');
}
```

### 11.2 Safari-Specific Issues

#### 11.2.1 Module Caching

**Problem:** Safari aggressively caches modules

**Solution:**

```javascript
// Add cache-busting to avoid stale modules
const version = '1.0.2';
const script = document.createElement('script');
script.type = 'module';
script.src = `./pan.mjs?v=${version}`;
```

#### 11.2.2 Private File System

**Problem:** Safari doesn't support OPFS

**Solution:**

```javascript
// Check support and use fallback
if (!Features.has.opfs()) {
  console.log('OPFS not available, using IndexedDB fallback');
  // Use alternative storage
}
```

### 11.3 Firefox Issues

#### 11.3.1 Dynamic Imports

**Problem:** Firefox strict about dynamic imports

**Solution:**

```javascript
// Use static imports when possible
import { PanClient } from './pan-client.mjs';

// Or ensure dynamic imports are properly contextualized
async function loadComponent(name) {
  const module = await import(`./components/${name}.mjs`);
  return module.default;
}
```

### 11.4 Older Browser Support

**Problem:** Need to support older browsers

**Solution:**

```html
<!-- Load polyfills for older browsers -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"></script>
<script src="https://unpkg.com/intersection-observer@0.12.2/intersection-observer.js"></script>

<!-- Then load LARC -->
<script type="module" src="./pan.mjs"></script>
```

---

## 12. Integration Issues

### 12.1 React Integration

**Problem:** Components not rendering in React

**Solution:**

```javascript
import { useEffect, useRef } from 'react';

function MyReactComponent() {
  const ref = useRef();

  useEffect(() => {
    // Wait for custom element to be defined
    if (customElements.get('my-component')) {
      ref.current.setAttribute('data', JSON.stringify({ value: 'test' }));
    } else {
      customElements.whenDefined('my-component').then(() => {
        ref.current.setAttribute('data', JSON.stringify({ value: 'test' }));
      });
    }
  }, []);

  return <my-component ref={ref}></my-component>;
}
```

### 12.2 Vue Integration

**Problem:** Vue tries to parse custom elements

**Solution:**

```javascript
// vue.config.js or vite.config.js
export default {
  compilerOptions: {
    isCustomElement: tag => tag.includes('-')
  }
}

// Or in Vue 3 app
app.config.compilerOptions.isCustomElement = tag => tag.includes('-');
```

### 12.3 Shadow DOM Conflicts

**Problem:** Styles don't apply to custom elements

**Solution:**

```javascript
// Custom element with open shadow DOM
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    // Add styles to shadow root
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        /* Component styles */
      </style>
      <div>Content</div>
    `;
  }
}
```

---

## 13. Development vs Production Issues

### 13.1 Works in Dev, Not in Production

#### 13.1.1 CDN Version Mismatch

```javascript
// Development
<script type="module" src="./pan.mjs"></script>

// Production - ensure version matches!
<script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs"></script>
```

#### 13.1.2 Path Resolution

```javascript
// Dev: Relative paths work
import { PanClient } from './components/pan-client.mjs';

// Prod: May need absolute paths or import map
import { PanClient } from '/static/larc/components/pan-client.mjs';
```

#### 13.1.3 Caching Issues

```javascript
// Clear production cache
// Add cache-busting headers
// Nginx:
add_header Cache-Control "public, max-age=0, must-revalidate";

// Or use versioned URLs
<script type="module" src="/static/pan.mjs?v=1.0.2"></script>
```

### 13.2 Minification Breaking Code

**Problem:** Minified code doesn't work

**Solution:**

```javascript
// Ensure minifier preserves ES modules
// Using esbuild:
esbuild.build({
  entryPoints: ['src/pan.mjs'],
  outfile: 'dist/pan.min.mjs',
  bundle: false,
  minify: true,
  format: 'esm',  // Keep as ES module
  target: 'es2020'
});
```

### 13.3 Source Maps Missing

**Problem:** Can't debug production issues

**Solution:**

```javascript
// Generate source maps
esbuild.build({
  entryPoints: ['src/pan.mjs'],
  outfile: 'dist/pan.min.mjs',
  minify: true,
  sourcemap: true,
  sourcesContent: true
});

// Deploy source maps
// Nginx: Serve .map files with correct headers
location ~ \.map$ {
  add_header Content-Type application/json;
}
```

---

## 14. Diagnostic Workflows

### 14.1 Component Not Appearing

```
1. Is component in DOM?
   ├─ No → Check HTML, verify element added
   └─ Yes → Continue

2. Is component :defined?
   ├─ No → Continue to step 3
   └─ Yes → Check component's connectedCallback, styles

3. Check console for errors
   ├─ 404 error → Fix file path (step 4)
   ├─ CORS error → Fix CDN/headers (section 7)
   ├─ CSP error → Update CSP (section 8)
   └─ No errors → Continue to step 4

4. Check component file path
   ├─ Has data-module? → Verify path exists
   └─ No data-module → Check autoloader config

5. Check autoloader configuration
   └─ console.log(window.panAutoload.config)

6. Manually load component
   └─ await window.panAutoload.maybeLoadFor(element)

7. Check Network tab
   └─ Look for .mjs requests, check status codes
```

### 14.2 Messages Not Flowing

```
1. Is bus ready?
   ├─ No → Wait for pan:sys.ready event
   └─ Yes → Continue

2. Check publisher
   ├─ await client.ready() called? → Yes/Continue
   └─ No → Add await client.ready()

3. Check subscriber
   ├─ Subscription before publish? → Yes/Continue
   ├─ Pattern matches topic? → Test with PanClient.matches()
   └─ Element still in DOM? → Check isConnected

4. Enable debug mode
   └─ <pan-bus debug="true"></pan-bus>

5. Log all messages
   └─ client.subscribe('*', msg => console.log(msg))

6. Check bus stats
   └─ await getBusStats()

7. Verify no errors in console
```

### 14.3 Performance Degradation

```
1. Check memory usage
   └─ console.log(performance.memory)

2. Check subscription count
   └─ await getBusStats() → Check subscriptions count

3. Profile message rate
   └─ Monitor msg/sec (section 9.4)

4. Check for subscription leaks
   └─ Are components cleaning up? (section 6.1.1)

5. Check message size
   └─ Log message size, check for large payloads

6. Check handler performance
   └─ Profile handlers with Performance tab

7. Consider rate limiting
   └─ Debounce frequent publishes (section 6.2.2)
```

### 14.4 Minimal Reproduction

To report a bug, create minimal reproduction:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LARC Issue Reproduction</title>
</head>
<body>
  <pan-bus debug="true"></pan-bus>

  <script type="module">
    import { PanClient } from 'https://unpkg.com/@larcjs/core@3.0.1/src/pan.mjs';

    const client = new PanClient();
    await client.ready();

    // Minimal code to reproduce issue
    client.subscribe('test', msg => {
      console.log('Received:', msg);
    });

    client.publish({
      topic: 'test',
      data: { value: 123 }
    });

    // Expected: See message in console
    // Actual: [describe what happens]
  </script>
</body>
</html>
```

---

## 15. Getting Help

### 15.1 Before Asking for Help

- [ ] Check this troubleshooting guide
- [ ] Search [GitHub Issues](https://github.com/larcjs/core/issues)
- [ ] Read [API Reference](./API_REFERENCE.md)
- [ ] Read [Production Deployment Guide](./PRODUCTION-DEPLOYMENT.md)
- [ ] Create minimal reproduction (section 14.4)
- [ ] Check browser console for errors
- [ ] Test in different browser

### 15.2 Information to Include

When reporting an issue, include:

1. **LARC Version**
   ```javascript
   // Check version
   // From CDN URL or package.json
   ```

2. **Browser & Version**
   ```javascript
   // Copy from DevTools
   console.log(navigator.userAgent);

   // Or use feature detection
   const report = Features.getReport();
   console.log(report.browser);
   ```

3. **Error Messages**
   ```
   Copy exact error from console, including stack trace
   ```

4. **Reproduction Steps**
   ```
   1. Create component with...
   2. Subscribe to topic...
   3. Publish message...
   4. Error occurs
   ```

5. **Expected vs Actual Behavior**
   ```
   Expected: Message delivered to subscriber
   Actual: Subscriber never receives message
   ```

6. **Configuration**
   ```javascript
   // Copy your config
   console.log(window.panAutoload.config);
   ```

### 15.3 Resources

- **Documentation:** [https://larcjs.github.io/site/](https://larcjs.github.io/site/)
- **GitHub:** [https://github.com/larcjs/core](https://github.com/larcjs/core)
- **Issues:** [https://github.com/larcjs/core/issues](https://github.com/larcjs/core/issues)
- **Discussions:** [https://github.com/larcjs/core/discussions](https://github.com/larcjs/core/discussions)

### 15.4 Community Guidelines

- Search before posting
- Be specific and provide details
- Include minimal reproduction
- Be respectful and patient
- Help others when you can

---

## Appendix: Quick Debugging Snippets

### A1. Test Everything

```javascript
// Comprehensive test script
// Paste in browser console

console.log('=== LARC Debug Report ===');

// 1. Check bus
const bus = document.querySelector('pan-bus');
console.log('Bus exists:', !!bus);
console.log('Bus ready:', window.__panReady);

// 2. Check autoloader
console.log('Autoloader:', !!window.panAutoload);
if (window.panAutoload) {
  console.log('Config:', window.panAutoload.config);
}

// 3. Check features
if (window.Features) {
  const report = window.Features.getReport();
  console.log('Browser:', report.browser);
  console.log('Compatible:', report.compatible);
  console.log('Recommendations:', report.recommendations);
}

// 4. List custom elements
const customElements = [];
document.querySelectorAll('*').forEach(el => {
  if (el.tagName.includes('-')) {
    customElements.push({
      tag: el.tagName,
      defined: !!window.customElements.get(el.localName),
      connected: el.isConnected
    });
  }
});
console.log('Custom elements:', customElements);

// 5. Test message flow
const testClient = new PanClient();
await testClient.ready();

let received = false;
testClient.subscribe('debug.test', () => {
  received = true;
  console.log('✅ Message flow working!');
});

testClient.publish({ topic: 'debug.test', data: {} });

setTimeout(() => {
  if (!received) {
    console.error('❌ Message flow broken!');
  }
}, 100);

console.log('=== End Debug Report ===');
```

### A2. Monitor All Activity

```javascript
// Log everything LARC does
const client = new PanClient();
await client.ready();

// Log all messages
client.subscribe('*', (msg) => {
  console.log(`📨 [${msg.topic}]`, msg);
});

// Monitor bus events
['pan:publish', 'pan:subscribe', 'pan:unsubscribe', 'pan:deliver'].forEach(type => {
  document.addEventListener(type, (e) => {
    console.log(`🚌 ${type}:`, e.detail);
  }, true);
});

// Monitor custom element definitions
const originalDefine = customElements.define;
customElements.define = function(name, constructor, options) {
  console.log(`📦 Defined: ${name}`);
  return originalDefine.call(this, name, constructor, options);
};

console.log('Monitoring enabled');
```

### A3. Performance Monitor

```javascript
// Track performance metrics
const metrics = {
  messages: 0,
  requests: 0,
  errors: 0,
  startTime: Date.now()
};

client.subscribe('*', (msg) => {
  metrics.messages++;
  if (msg.replyTo) metrics.requests++;
});

window.addEventListener('error', () => {
  metrics.errors++;
});

setInterval(() => {
  const elapsed = (Date.now() - metrics.startTime) / 1000;
  console.log('Performance:', {
    uptime: `${elapsed.toFixed(0)}s`,
    messageRate: `${(metrics.messages / elapsed).toFixed(2)}/s`,
    totalMessages: metrics.messages,
    requests: metrics.requests,
    errors: metrics.errors
  });
}, 10000);
```

---

**Last Updated:** November 2024
**Version:** 1.0

For the latest documentation, visit: [https://larcjs.github.io/site/](https://larcjs.github.io/site/)
