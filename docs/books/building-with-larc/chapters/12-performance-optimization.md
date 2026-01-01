# Performance Optimization

Quick reference for performance optimization in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 15.

## Overview

Optimize LARC applications through efficient message patterns, lazy loading, virtual scrolling, and memory management. Performance optimization focuses on user-perceived speed: initial load time, interaction responsiveness, and smooth animations.

**Key Concepts**:

- Message filtering and throttling to reduce bus overhead
- Lazy loading components and routes for faster initial load
- Virtual scrolling to handle large data sets efficiently
- Debouncing/throttling high-frequency events
- Memory leak prevention through proper cleanup
- Bundle size optimization with tree shaking and code splitting

## Quick Example

```javascript
import { debounce, throttle } from '../utils/timing.js';

class OptimizedSearch extends HTMLElement {
  connectedCallback() {
    // Debounce search input (wait for typing to stop)
    const debouncedSearch = debounce((value) => {
      bus.publish('search.query', { query: value });
    }, 300);
    
    this.querySelector('input').addEventListener('input', (e) => {
      debouncedSearch(e.target.value);
    });
    
    // Throttle scroll tracking (limit frequency)
    const throttledScroll = throttle(() => {
      bus.publish('scroll.position', { y: window.scrollY });
    }, 100);
    
    window.addEventListener('scroll', throttledScroll);
  }
}
```

## Message Bus Optimization

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Specific subscriptions | Subscribe to `user.*` not `*` | Reduce handler invocations |
| Early returns | Check message relevance first | Skip expensive processing |
| Unsubscribe aggressively | Unsubscribe when done | Reduce memory and CPU overhead |
| Throttle publishers | Limit publish frequency (50-100ms) | Mouse/scroll events |
| Debounce publishers | Wait for pause (300ms) | User input, search |
| Batch messages | Publish array not individual items | Bulk updates |

**Throttle vs Debounce**:

- **Throttle**: Guarantees function runs at most once per interval (good for scroll)
- **Debounce**: Waits for pause before running (good for search input)

## Timing Utilities

### Debounce

```javascript
// utils/debounce.js
export function debounce(fn, delay) {
  let timeoutId = null;
  
  const debounced = function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
  
  debounced.cancel = () => clearTimeout(timeoutId);
  return debounced;
}
```

### Throttle

```javascript
// utils/throttle.js
export function throttle(fn, interval) {
  let lastCall = 0;
  
  return function(...args) {
    const now = Date.now();
    if (now - lastCall >= interval) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}
```

### RAF Throttle

```javascript
// utils/raf-throttle.js
export class RAFThrottle {
  constructor(callback) {
    this.callback = callback;
    this.rafId = null;
  }
  
  trigger(...args) {
    if (this.rafId === null) {
      this.rafId = requestAnimationFrame(() => {
        this.callback(...args);
        this.rafId = null;
      });
    }
  }
  
  cancel() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
}
```

## Lazy Loading Patterns

### Component Lazy Loading

```javascript
// Load component when near viewport
class LazyLoader extends HTMLElement {
  connectedCallback() {
    const componentName = this.getAttribute('component');
    const margin = this.getAttribute('load-distance') || '600px';
    
    this.observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting) {
          await import(`./components/${componentName}.mjs`);
          const component = document.createElement(componentName);
          this.replaceWith(component);
        }
      },
      { rootMargin: margin }
    );
    
    this.observer.observe(this);
  }
}
```

**Usage**:
```html
<lazy-loader component="heavy-chart" load-distance="400px"></lazy-loader>
```

### Route-Based Code Splitting

```javascript
// app-router.mjs
const routeMap = {
  '/': () => import('./pages/home-page.mjs'),
  '/profile': () => import('./pages/profile-page.mjs'),
  '/settings': () => import('./pages/settings-page.mjs')
};

class AppRouter extends HTMLElement {
  async loadRoute(route) {
    const loader = routeMap[route];
    if (loader) {
      await loader();
      this.innerHTML = `<${this.getComponentName(route)}></>`;
    }
  }
}
```

## Virtual Scrolling

For lists with 1,000+ items, render only visible rows:

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 50;
    this.containerHeight = 600;
    this.scrollTop = 0;
  }
  
  render() {
    const visibleCount = Math.ceil(this.containerHeight / this.itemHeight) + 2;
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(this.items.length, startIndex + visibleCount);
    
    const visibleItems = this.items.slice(startIndex, endIndex);
    const totalHeight = this.items.length * this.itemHeight;
    const offsetY = startIndex * this.itemHeight;
    
    this.innerHTML = `
      <div style="height: ${this.containerHeight}px; overflow-y: auto;">
        <div style="height: ${totalHeight}px; position: relative;">
          <div style="position: absolute; top: ${offsetY}px;">
            ${visibleItems.map(item => this.renderItem(item)).join('')}
          </div>
        </div>
      </div>
    `;
    
    this.querySelector('div').addEventListener('scroll', (e) => {
      this.scrollTop = e.target.scrollTop;
      this.render();
    });
  }
  
  renderItem(item) {
    return `<div style="height: ${this.itemHeight}px;">${item.name}</div>`;
  }
}
```

**Usage**:
```html
<virtual-list item-height="60" container-height="600"></virtual-list>
```

See **pan-virtual-list** (Chapter 19) for production-ready virtual list component.

## Memory Management

| Pattern | Description | Example |
|---------|-------------|---------|
| Unsubscribe in `disconnectedCallback` | Clean up PAN subscriptions | `this.unsubscribe()` |
| Remove event listeners | Clean up DOM listeners | `removeEventListener()` |
| Clear timers/intervals | Stop periodic tasks | `clearInterval()` |
| Cancel pending fetches | Abort ongoing requests | `AbortController.abort()` |
| Use WeakMap for caches | Auto-cleanup with GC | `new WeakMap()` |

### Cleanup Example

```javascript
class LeakFreeComponent extends HTMLElement {
  connectedCallback() {
    // Subscribe to bus
    this.unsubscribe = bus.subscribe('data.updated', this.handleData);
    
    // Add event listener
    this.handleClick = this.handleClick.bind(this);
    this.addEventListener('click', this.handleClick);
    
    // Set interval
    this.intervalId = setInterval(() => this.update(), 5000);
    
    // Fetch with abort controller
    this.abortController = new AbortController();
    fetch('/api/data', { signal: this.abortController.signal });
  }
  
  disconnectedCallback() {
    // Clean up everything
    if (this.unsubscribe) this.unsubscribe();
    this.removeEventListener('click', this.handleClick);
    clearInterval(this.intervalId);
    this.abortController.abort();
  }
}
```

## Bundle Size Optimization

| Technique | Description | Savings |
|-----------|-------------|---------|
| Tree shaking | Remove unused exports | 20-40% |
| Dynamic imports | Load code on demand | Initial: 50-70% |
| Minification | Compress code | 30-50% |
| Gzip/Brotli | Server compression | 70-80% |
| Dependency auditing | Replace heavy libs | Varies |

### Bundle Optimization Example

```javascript
// Before: import everything
import moment from 'moment'; // 231 kB

// After: use native APIs
const formatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});
formatter.format(new Date()); // 0 kB
```

### Build Configuration

```json
{
  "scripts": {
    "build": "esbuild src/app.js --bundle --minify --splitting --outdir=dist"
  }
}
```

## Performance Monitoring

```javascript
class PerformanceMonitor extends HTMLElement {
  connectedCallback() {
    // Navigation timing
    window.addEventListener('load', () => {
      const nav = performance.getEntriesByType('navigation')[0];
      console.log({
        'DNS': nav.domainLookupEnd - nav.domainLookupStart,
        'TCP': nav.connectEnd - nav.connectStart,
        'Request': nav.responseStart - nav.requestStart,
        'Response': nav.responseEnd - nav.responseStart,
        'DOM': nav.domComplete - nav.domLoading,
        'Total': nav.loadEventEnd - nav.fetchStart
      });
    });
    
    // Long task detection
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          console.warn(`Long task: ${entry.duration}ms`);
        }
      }
    }).observe({ entryTypes: ['longtask'] });
    
    // Core Web Vitals
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        console.log(`${entry.name}: ${entry.value}`);
      }
    }).observe({ entryTypes: ['largest-contentful-paint', 'first-input'] });
  }
}
```

## Component Reference

See Chapter 19 for performance-optimized UI components:

- **pan-virtual-list**: Production virtual scrolling
- **pan-lazy-image**: Lazy image loading with IntersectionObserver
- **pan-suspense**: Loading states and code splitting

## Complete Example

```javascript
// Optimized data table with virtual scrolling and search
class OptimizedDataTable extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.filteredItems = [];
  }
  
  connectedCallback() {
    // Subscribe to data
    this.unsubscribe = bus.subscribe('table.data', (msg) => {
      this.items = msg.data.items;
      this.filteredItems = this.items;
      this.render();
    });
    
    // Debounced search
    const debouncedFilter = debounce((query) => {
      this.filteredItems = this.items.filter(item =>
        item.name.toLowerCase().includes(query.toLowerCase())
      );
      this.render();
    }, 300);
    
    this.innerHTML = `
      <input type="text" placeholder="Search..." />
      <virtual-list item-height="50" container-height="600"></virtual-list>
    `;
    
    this.querySelector('input').addEventListener('input', (e) => {
      debouncedFilter(e.target.value);
    });
  }
  
  render() {
    const list = this.querySelector('virtual-list');
    bus.publish('virtual-list.items', { items: this.filteredItems });
  }
  
  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

customElements.define('optimized-data-table', OptimizedDataTable);
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 15 (Performance)
- **Components**: Chapter 19 (pan-virtual-list, pan-lazy-image)
- **Patterns**: Appendix E (Message patterns, optimization strategies)
- **Related**: Chapter 13 (Testing), Chapter 14 (Debugging)

## Common Issues

### High CPU usage from message bus
**Problem**: Too many subscriptions or wildcard patterns  
**Solution**: Use specific topics, unsubscribe aggressively, profile with `pan-debug`

### Memory leaks in SPAs
**Problem**: Components not cleaning up subscriptions/listeners  
**Solution**: Always implement `disconnectedCallback()` cleanup pattern

### Slow initial load
**Problem**: Loading all code upfront  
**Solution**: Lazy load routes/components, code split with dynamic imports

### Janky scrolling
**Problem**: Heavy computations on scroll events  
**Solution**: Use RAF throttle, virtual scrolling for lists, passive event listeners

### Large bundle size
**Problem**: Including entire libraries for small features  
**Solution**: Tree shake, use native APIs, check bundlephobia.com before adding dependencies
