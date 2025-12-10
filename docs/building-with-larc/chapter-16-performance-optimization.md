# Performance Optimization

> "Premature optimization is the root of all evil. But shipping a slow application is the root of losing all your users."
>
> — Donald Knuth (paraphrased by someone who's watched users abandon slow apps)

Performance isn't about making your application fast—it's about making it feel fast. Users don't care if your message bus can handle 10,000 messages per second if clicking a button takes three seconds to respond. They don't care if your virtual DOM is optimized if the initial page load shows a blank screen for five seconds.

In this chapter, we'll explore performance optimization strategies specific to LARC applications: efficient message filtering and routing, component lazy loading, virtual scrolling for massive lists, debouncing and throttling high-frequency events, memory management to prevent leaks, and bundle size optimization. By the end, you'll know how to build LARC applications that are not just correct, but fast.

## Message Filtering and Routing Efficiency

The PAN bus is central to LARC applications. Every publish triggers subscriptions, and inefficient patterns can create performance bottlenecks.

### Pattern: Specific Topic Subscriptions

Subscribe to specific topics, not wildcards, when possible:

```javascript
// Bad: too broad
subscribe('*', (msg) => {
  if (msg.topic.startsWith('user.')) {
    // Handle user messages
  }
});

// Good: specific subscription
subscribe('user.*', (msg) => {
  // Only receives user messages
});

// Better: most specific possible
subscribe('user.profile.updated', (msg) => {
  // Only receives profile updates
});
```

Specific subscriptions reduce unnecessary function calls.

### Pattern: Early Returns

Return early from subscription handlers when the message isn't relevant:

```javascript
subscribe('user.data', (msg) => {
  // Early return if not our user
  if (msg.data.userId !== this.currentUserId) {
    return;
  }

  // Expensive processing only for relevant messages
  this.processUserData(msg.data);
});
```

### Pattern: Unsubscribe Aggressively

Unsubscribe as soon as you no longer need messages:

```javascript
class TemporaryComponent extends HTMLElement {
  connectedCallback() {
    // Subscribe to one-time event
    this.unsubscribe = subscribe('data.loaded', (msg) => {
      this.render(msg.data);

      // Unsubscribe immediately after first message
      this.unsubscribe();
      this.unsubscribe = null;
    });
  }

  disconnectedCallback() {
    // Clean up if component removed before message received
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

### Implementing Message Throttling

Throttle high-frequency messages at the source:

```javascript
class MouseTracker extends HTMLElement {
  constructor() {
    super();
    this.lastPublishTime = 0;
    this.publishInterval = 50; // Publish at most every 50ms (20 FPS)
  }

  connectedCallback() {
    this.addEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  handleMouseMove(event) {
    const now = Date.now();

    // Throttle: only publish if enough time has passed
    if (now - this.lastPublishTime < this.publishInterval) {
      return;
    }

    this.lastPublishTime = now;

    publish('mouse.position', {
      x: event.clientX,
      y: event.clientY,
      timestamp: now
    });
  }
}

customElements.define('mouse-tracker', MouseTracker);
```

### Debouncing Message Publishers

For user input, debounce to reduce message frequency:

```javascript
class SearchInput extends HTMLElement {
  constructor() {
    super();
    this.debounceTimer = null;
    this.debounceDelay = 300; // Wait 300ms after last keystroke
  }

  connectedCallback() {
    this.innerHTML = `
      <input type="text" placeholder="Search..." />
    `;

    this.querySelector('input').addEventListener('input', (event) => {
      this.handleInput(event.target.value);
    });
  }

  handleInput(value) {
    // Clear previous timer
    clearTimeout(this.debounceTimer);

    // Set new timer
    this.debounceTimer = setTimeout(() => {
      publish('search.query', { query: value });
    }, this.debounceDelay);
  }
}

customElements.define('search-input', SearchInput);
```

### Batching Messages

When publishing multiple related messages, batch them:

```javascript
class BulkUpdater extends HTMLElement {
  updateMultipleItems(items) {
    // Bad: publish once per item
    // items.forEach(item => {
    //   publish('item.updated', item);
    // });

    // Good: batch into single message
    publish('items.updated', { items });
  }
}
```

Subscribers process the batch:

```javascript
class ItemList extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('items.updated', (msg) => {
      // Process entire batch at once
      this.updateItems(msg.data.items);
    });
  }

  updateItems(items) {
    // Batch DOM updates
    const fragment = document.createDocumentFragment();

    items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = item.name;
      fragment.appendChild(li);
    });

    this.querySelector('ul').innerHTML = '';
    this.querySelector('ul').appendChild(fragment);
  }
}
```

## Component Lazy Loading

Load components only when needed. LARC's autoloader already does this for components near the viewport, but you can optimize further.

### Lazy Loading Off-Screen Components

Use IntersectionObserver to load components when they approach the viewport:

```javascript
// components/lazy-loader.mjs

class LazyLoader extends HTMLElement {
  constructor() {
    super();
    this.loaded = false;
  }

  connectedCallback() {
    const componentName = this.getAttribute('component');
    const loadDistance = parseInt(this.getAttribute('load-distance') || '600');

    if (!componentName) {
      console.error('LazyLoader: component attribute required');
      return;
    }

    // Observe element
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !this.loaded) {
            this.loadComponent(componentName);
          }
        });
      },
      { rootMargin: `${loadDistance}px` }
    );

    this.observer.observe(this);
  }

  async loadComponent(componentName) {
    this.loaded = true;
    this.observer.disconnect();

    try {
      // Show loading state
      this.innerHTML = '<div class="loading">Loading...</div>';

      // Dynamically import component
      await import(`./components/${componentName}.mjs`);

      // Replace loader with actual component
      const component = document.createElement(componentName);

      // Copy attributes to component
      for (const attr of this.attributes) {
        if (attr.name !== 'component' && attr.name !== 'load-distance') {
          component.setAttribute(attr.name, attr.value);
        }
      }

      this.innerHTML = '';
      this.appendChild(component);
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
      this.innerHTML = '<div class="error">Failed to load component</div>';
    }
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

customElements.define('lazy-loader', LazyLoader);
```

Use it:

```html
<!-- Component loads when it approaches viewport -->
<lazy-loader component="heavy-chart" load-distance="400"></lazy-loader>

<!-- Multiple lazy components -->
<lazy-loader component="user-profile"></lazy-loader>
<lazy-loader component="activity-feed"></lazy-loader>
<lazy-loader component="notifications-panel"></lazy-loader>
```

### Code Splitting Routes

Split application by routes:

```javascript
// components/app-router.mjs

import { subscribe } from '../pan.js';

class AppRouter extends HTMLElement {
  constructor() {
    super();
    this.currentRoute = null;
    this.loadedComponents = new Set();
  }

  connectedCallback() {
    this.unsubscribe = subscribe('route.change', async (msg) => {
      await this.loadRoute(msg.data.route);
    });
  }

  async loadRoute(route) {
    if (this.currentRoute === route) {
      return;
    }

    this.currentRoute = route;

    // Show loading state
    this.innerHTML = '<div class="route-loading">Loading page...</div>';

    try {
      // Lazy load route component
      const componentName = this.getComponentForRoute(route);

      if (!this.loadedComponents.has(componentName)) {
        await import(`./pages/${componentName}.mjs`);
        this.loadedComponents.add(componentName);
      }

      // Render route component
      this.innerHTML = `<${componentName}></${componentName}>`;
    } catch (error) {
      console.error(`Failed to load route ${route}:`, error);
      this.innerHTML = '<div class="error">Page not found</div>';
    }
  }

  getComponentForRoute(route) {
    const routeMap = {
      '/': 'home-page',
      '/profile': 'profile-page',
      '/settings': 'settings-page',
      '/dashboard': 'dashboard-page'
    };

    return routeMap[route] || 'not-found-page';
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('app-router', AppRouter);
```

## Virtual Scrolling for Large Lists

Rendering thousands of DOM elements is slow. Virtual scrolling renders only visible items.

Here's a robust virtual list implementation:

```javascript
// components/virtual-list.mjs

import { subscribe } from '../pan.js';

class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 50; // Default height
    this.visibleCount = 20;
    this.scrollTop = 0;
    this.startIndex = 0;
    this.endIndex = 20;
    this.containerHeight = 800;
  }

  static get observedAttributes() {
    return ['item-height', 'container-height'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'item-height') {
      this.itemHeight = parseInt(newValue);
    } else if (name === 'container-height') {
      this.containerHeight = parseInt(newValue);
    }

    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    const topic = this.getAttribute('topic') || 'list.items';

    this.unsubscribe = subscribe(topic, (msg) => {
      this.items = msg.data.items || [];
      this.render();
    });

    this.render();
  }

  render() {
    // Calculate visible range
    this.visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 2; // Buffer
    this.startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - 1);
    this.endIndex = Math.min(this.items.length, this.startIndex + this.visibleCount);

    const visibleItems = this.items.slice(this.startIndex, this.endIndex);
    const totalHeight = this.items.length * this.itemHeight;
    const offsetY = this.startIndex * this.itemHeight;

    this.innerHTML = `
      <div class="virtual-list-container" style="height: ${this.containerHeight}px; overflow-y: auto; position: relative;">
        <div class="virtual-list-spacer" style="height: ${totalHeight}px; position: relative;">
          <div class="virtual-list-content" style="position: absolute; top: ${offsetY}px; width: 100%;">
            ${this.renderItems(visibleItems)}
          </div>
        </div>
      </div>
    `;

    // Attach scroll handler
    const container = this.querySelector('.virtual-list-container');
    container.addEventListener('scroll', this.handleScroll.bind(this));

    // Restore scroll position
    container.scrollTop = this.scrollTop;
  }

  renderItems(items) {
    return items.map((item, index) => {
      const globalIndex = this.startIndex + index;
      return `
        <div class="virtual-list-item" style="height: ${this.itemHeight}px;" data-index="${globalIndex}">
          ${this.renderItem(item, globalIndex)}
        </div>
      `;
    }).join('');
  }

  renderItem(item, index) {
    // Override this method to customize item rendering
    return `
      <div style="padding: 12px; border-bottom: 1px solid #ddd;">
        <strong>#${index + 1}</strong>: ${item.name || item.title || JSON.stringify(item)}
      </div>
    `;
  }

  handleScroll(event) {
    const newScrollTop = event.target.scrollTop;

    // Only re-render if we've scrolled enough
    if (Math.abs(newScrollTop - this.scrollTop) > this.itemHeight) {
      this.scrollTop = newScrollTop;
      this.render();
    } else {
      this.scrollTop = newScrollTop;
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('virtual-list', VirtualList);
```

Use it:

```html
<virtual-list
  topic="users.list"
  item-height="60"
  container-height="600"
></virtual-list>
```

Publish items:

```javascript
import { publish } from './pan.js';

// Generate 10,000 items
const items = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  email: `user${i}@example.com`
}));

publish('users.list', { items });
```

The virtual list renders only ~22 items at a time, regardless of whether there are 100 or 100,000 items.

### Dynamic Item Heights

For variable-height items, maintain a height cache:

```javascript
class DynamicVirtualList extends VirtualList {
  constructor() {
    super();
    this.itemHeights = new Map(); // Cache of measured heights
    this.averageHeight = 50;
  }

  render() {
    // Calculate positions using cached heights
    let offsetY = 0;
    let startIndex = 0;

    for (let i = 0; i < this.items.length; i++) {
      const height = this.itemHeights.get(i) || this.averageHeight;

      if (offsetY + height < this.scrollTop) {
        offsetY += height;
        startIndex = i + 1;
      } else if (offsetY > this.scrollTop + this.containerHeight) {
        break;
      }
    }

    this.startIndex = startIndex;
    this.endIndex = Math.min(this.items.length, startIndex + this.visibleCount);

    // Rest of rendering...
    // After rendering, measure actual heights and cache them
    this.measureItemHeights();
  }

  measureItemHeights() {
    requestAnimationFrame(() => {
      const items = this.querySelectorAll('.virtual-list-item');
      items.forEach((item, index) => {
        const globalIndex = this.startIndex + index;
        const height = item.offsetHeight;
        this.itemHeights.set(globalIndex, height);
      });
    });
  }
}

customElements.define('dynamic-virtual-list', DynamicVirtualList);
```

## Debouncing and Throttling

We've seen throttling and debouncing briefly. Let's explore them deeply.

### Debounce Utility

Create a reusable debounce utility:

```javascript
// utils/debounce.js

/**
 * Debounce function - waits for delay after last call
 * @param {Function} fn - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(fn, delay) {
  let timeoutId = null;

  const debounced = function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };

  // Add cancel method
  debounced.cancel = function() {
    clearTimeout(timeoutId);
  };

  return debounced;
}
```

Use it:

```javascript
import { debounce } from '../utils/debounce.js';

class SearchBox extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<input type="text" placeholder="Search..." />`;

    const input = this.querySelector('input');

    // Debounce search
    const debouncedSearch = debounce((value) => {
      publish('search.query', { query: value });
    }, 300);

    input.addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
  }
}
```

### Throttle Utility

Create a reusable throttle utility:

```javascript
// utils/throttle.js

/**
 * Throttle function - ensures function runs at most once per interval
 * @param {Function} fn - Function to throttle
 * @param {number} interval - Minimum interval between calls
 * @returns {Function} Throttled function
 */
export function throttle(fn, interval) {
  let lastCall = 0;
  let timeoutId = null;

  const throttled = function(...args) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // Schedule call for end of interval
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, interval - timeSinceLastCall);
    }
  };

  // Add cancel method
  throttled.cancel = function() {
    clearTimeout(timeoutId);
  };

  return throttled;
}
```

Use it:

```javascript
import { throttle } from '../utils/throttle.js';

class ScrollTracker extends HTMLElement {
  connectedCallback() {
    // Throttle scroll events to 100ms (10 FPS)
    const throttledScroll = throttle(() => {
      publish('scroll.position', {
        x: window.scrollX,
        y: window.scrollY
      });
    }, 100);

    window.addEventListener('scroll', throttledScroll);

    this.cleanup = () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }

  disconnectedCallback() {
    if (this.cleanup) {
      this.cleanup();
    }
  }
}
```

### RequestAnimationFrame Throttling

For animation-related events, use requestAnimationFrame:

```javascript
class RAFThrottle {
  constructor(callback) {
    this.callback = callback;
    this.rafId = null;
    this.lastArgs = null;
  }

  trigger(...args) {
    this.lastArgs = args;

    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.callback.apply(null, this.lastArgs);
        this.rafId = null;
      });
    }
  }

  cancel() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }
}
```

Use it:

```javascript
class SmoothScroller extends HTMLElement {
  connectedCallback() {
    this.rafThrottle = new RAFThrottle(() => {
      publish('scroll.position', {
        x: window.scrollX,
        y: window.scrollY
      });
    });

    window.addEventListener('scroll', () => {
      this.rafThrottle.trigger();
    });
  }

  disconnectedCallback() {
    if (this.rafThrottle) {
      this.rafThrottle.cancel();
    }
  }
}
```

## Memory Management

JavaScript has garbage collection, but you can still leak memory. Here's how to avoid it.

### Pattern: Clean Up Subscriptions

Always unsubscribe in `disconnectedCallback`:

```javascript
class LeakFreeComponent extends HTMLElement {
  connectedCallback() {
    this.subscriptions = [
      subscribe('topic.one', this.handleOne.bind(this)),
      subscribe('topic.two', this.handleTwo.bind(this)),
      subscribe('topic.three', this.handleThree.bind(this))
    ];
  }

  disconnectedCallback() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

### Pattern: Remove Event Listeners

Always remove event listeners:

```javascript
class ClickTracker extends HTMLElement {
  connectedCallback() {
    this.handleClick = this.handleClick.bind(this);
    this.addEventListener('click', this.handleClick);
  }

  handleClick(event) {
    publish('click.tracked', { x: event.clientX, y: event.clientY });
  }

  disconnectedCallback() {
    this.removeEventListener('click', this.handleClick);
  }
}
```

### Pattern: Clear Timers

Clear all timers and intervals:

```javascript
class PeriodicUpdater extends HTMLElement {
  connectedCallback() {
    this.intervalId = setInterval(() => {
      this.update();
    }, 5000);
  }

  disconnectedCallback() {
    clearInterval(this.intervalId);
  }
}
```

### Pattern: Cancel Pending Promises

Track and cancel pending async operations:

```javascript
class DataFetcher extends HTMLElement {
  constructor() {
    super();
    this.abortController = null;
  }

  async connectedCallback() {
    await this.fetchData();
  }

  async fetchData() {
    // Cancel previous request if still pending
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();

    try {
      const response = await fetch('/api/data', {
        signal: this.abortController.signal
      });

      const data = await response.json();
      this.render(data);
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch cancelled');
      } else {
        console.error('Fetch failed:', error);
      }
    }
  }

  disconnectedCallback() {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
```

### Pattern: Weak References for Caches

Use WeakMap for caches tied to object lifetimes:

```javascript
class ComponentCache {
  constructor() {
    this.cache = new WeakMap();
  }

  get(element) {
    return this.cache.get(element);
  }

  set(element, data) {
    this.cache.set(element, data);
  }

  // No need for cleanup - garbage collected automatically
}

const componentCache = new ComponentCache();
```

## Bundle Size Optimization

Smaller bundles load faster. Here's how to minimize size.

### 1. Tree Shaking

Ensure your modules are tree-shakeable by using ES6 imports/exports:

```javascript
// Good: named exports (tree-shakeable)
export function used() { /* ... */ }
export function unused() { /* ... */ }

// Consumer imports only what they need
import { used } from './utils.js';
```

### 2. Dynamic Imports

Load code on demand:

```javascript
class FeatureToggle extends HTMLElement {
  async enableFeature() {
    // Load feature code only when enabled
    const { AdvancedFeature } = await import('./advanced-feature.js');

    const feature = new AdvancedFeature();
    feature.activate();
  }
}
```

### 3. Avoid Large Dependencies

Check dependency sizes before adding them:

```bash
# Use bundlephobia to check size
npm install -g bundle-phobia-cli
bundle-phobia moment  # Shows: 231 kB minified
```

Consider alternatives:

```javascript
// Heavy: moment.js (231 kB)
import moment from 'moment';
const date = moment().format('YYYY-MM-DD');

// Light: native Intl API (0 kB)
const date = new Intl.DateTimeFormat('en-CA').format(new Date());
```

### 4. Code Splitting by Route

We saw this earlier—split by route:

```javascript
// pages/index.js - loads only home page code
export { default as HomePage } from './home-page.js';

// pages/dashboard.js - loads only dashboard code
export { default as DashboardPage } from './dashboard-page.js';
```

### 5. Minification

Use a minifier for production:

```json
{
  "scripts": {
    "build": "esbuild src/app.js --bundle --minify --outfile=dist/app.js"
  }
}
```

### 6. Compression

Enable gzip or brotli compression on your server:

```javascript
// server.js (Express example)
import compression from 'compression';
import express from 'express';

const app = express();

// Enable compression
app.use(compression());

app.use(express.static('dist'));
```

## Performance Monitoring

Measure performance to know what to optimize:

```javascript
// components/performance-monitor.mjs

class PerformanceMonitor extends HTMLElement {
  connectedCallback() {
    // Monitor navigation timing
    this.reportNavigationTiming();

    // Monitor long tasks
    this.observeLongTasks();

    // Monitor message bus performance
    this.monitorMessageBus();
  }

  reportNavigationTiming() {
    window.addEventListener('load', () => {
      const timing = performance.getEntriesByType('navigation')[0];

      console.log('Performance Metrics:', {
        'DNS Lookup': `${timing.domainLookupEnd - timing.domainLookupStart}ms`,
        'TCP Connection': `${timing.connectEnd - timing.connectStart}ms`,
        'Request': `${timing.responseStart - timing.requestStart}ms`,
        'Response': `${timing.responseEnd - timing.responseStart}ms`,
        'DOM Processing': `${timing.domComplete - timing.domLoading}ms`,
        'Total Load Time': `${timing.loadEventEnd - timing.fetchStart}ms`
      });

      publish('performance.navigation', {
        dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
        connection: timing.connectEnd - timing.connectStart,
        request: timing.responseStart - timing.requestStart,
        response: timing.responseEnd - timing.responseStart,
        domProcessing: timing.domComplete - timing.domLoading,
        totalLoadTime: timing.loadEventEnd - timing.fetchStart
      });
    });
  }

  observeLongTasks() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.warn('Long Task Detected:', {
            duration: `${entry.duration}ms`,
            startTime: entry.startTime
          });

          publish('performance.long-task', {
            duration: entry.duration,
            startTime: entry.startTime
          });
        }
      });

      observer.observe({ entryTypes: ['longtask'] });
    }
  }

  monitorMessageBus() {
    // Wrap publish to measure performance
    const originalPublish = window.publish;

    window.publish = function(topic, data) {
      const start = performance.now();
      const result = originalPublish.call(this, topic, data);
      const duration = performance.now() - start;

      if (duration > 16) { // More than one frame
        console.warn(`Slow message publish: ${topic} took ${duration.toFixed(2)}ms`);
      }

      return result;
    };
  }
}

customElements.define('performance-monitor', PerformanceMonitor);
```

## Wrapping Up

Performance optimization in LARC applications comes down to a few key principles:

1. **Message efficiency**: Subscribe specifically, unsubscribe aggressively, throttle/debounce high-frequency events
2. **Lazy loading**: Load components and routes only when needed
3. **Virtual scrolling**: Render only visible items for large lists
4. **Memory management**: Clean up subscriptions, listeners, timers, and pending operations
5. **Bundle optimization**: Tree shake, dynamic import, minimize dependencies, compress output

Performance isn't a one-time task—it's ongoing. Profile regularly, measure what matters (user-perceived performance), and optimize the bottlenecks, not the code you think might be slow.

In the next chapter, we'll tackle testing strategies—unit tests, integration tests, E2E tests, and how to test message-driven architectures without losing your mind. Because fast code that doesn't work is still useless.

Now go forth and optimize. And remember: the fastest code is code that never runs. But users expect your app to do something, so optimize the code that does run.
