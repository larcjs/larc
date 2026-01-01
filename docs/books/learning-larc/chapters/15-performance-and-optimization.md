# Performance and Optimization

Performance is a feature. Slow applications frustrate users and hurt business metrics. LARC's no-build philosophy gives you a head start—no framework overhead, no transpilation artifacts—but there's more you can do.

## Lazy Loading Components

Don't load everything upfront. Load components when needed:

```javascript
// Lazy load on route change
pan.subscribe('router.navigate', async ({ path }) => {
  if (path === '/admin') {
    await import('./components/admin-panel.js');
  }
});

// Lazy load on user interaction
document.querySelector('.show-chart').addEventListener('click', async () => {
  const { ChartComponent } = await import('./components/chart.js');
  // Use component
}, { once: true });

// Lazy load when visible
const observer = new IntersectionObserver(async (entries) => {
  for (const entry of entries) {
    if (entry.isIntersecting) {
      const component = entry.target.dataset.component;
      await import(`./components/${component}.js`);
      observer.unobserve(entry.target);
    }
  }
});

document.querySelectorAll('[data-lazy]').forEach(el => observer.observe(el));
```

## Image Optimization

Images are often the largest assets. Optimize them:

```javascript
class LazyImage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <img
        loading="lazy"
        src="${this.getAttribute('placeholder') || 'placeholder.svg'}"
        data-src="${this.getAttribute('src')}"
        alt="${this.getAttribute('alt') || ''}"
      >
    `;

    const img = this.querySelector('img');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          img.src = img.dataset.src;
          observer.unobserve(img);
        }
      });
    });

    observer.observe(img);
  }
}

customElements.define('lazy-image', LazyImage);
```

Use responsive images with srcset:

```html
<img
  srcset="image-400.jpg 400w,
          image-800.jpg 800w,
          image-1200.jpg 1200w"
  sizes="(max-width: 400px) 400px,
         (max-width: 800px) 800px,
         1200px"
  src="image-800.jpg"
  alt="Responsive image"
  loading="lazy"
>
```

## Service Worker Caching

Service workers enable offline functionality and faster loads:

```javascript
// sw.js
const CACHE_NAME = 'app-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/app.js',
  '/components/header.js',
  '/components/footer.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Cache first, network fallback
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    })
  );
});
```

Register it in your app:

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

## Measuring Performance

You can't optimize what you don't measure. Use the Performance API:

```javascript
// Measure component render time
performance.mark('render-start');
this.render();
performance.mark('render-end');
performance.measure('render', 'render-start', 'render-end');

const measure = performance.getEntriesByName('render')[0];
console.log(`Render took ${measure.duration}ms`);
```

Track Web Vitals:

```javascript
import { getCLS, getFID, getLCP } from 'web-vitals';

getCLS(console.log);  // Cumulative Layout Shift
getFID(console.log);  // First Input Delay
getLCP(console.log);  // Largest Contentful Paint
```

## Virtual Lists for Large Data

Rendering thousands of items kills performance. Virtualize:

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 40;
    this.visibleCount = 20;
    this.scrollTop = 0;
  }

  set data(items) {
    this.items = items;
    this.render();
  }

  connectedCallback() {
    this.style.cssText = `
      display: block;
      height: 400px;
      overflow-y: auto;
    `;

    this.addEventListener('scroll', () => {
      this.scrollTop = this.scrollTop;
      this.render();
    });

    this.render();
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const visibleItems = this.items.slice(startIndex, startIndex + this.visibleCount);

    this.innerHTML = `
      <div style="height: ${this.items.length * this.itemHeight}px; position: relative;">
        ${visibleItems.map((item, i) => `
          <div style="
            position: absolute;
            top: ${(startIndex + i) * this.itemHeight}px;
            height: ${this.itemHeight}px;
            width: 100%;
          ">
            ${item.name}
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('virtual-list', VirtualList);
```

## Code Splitting and Dynamic Imports

Break your code into smaller chunks that load on demand:

```javascript
// Route-based code splitting
class AppRouter extends HTMLElement {
  constructor() {
    super();
    this.routes = new Map([
      ['/', () => import('./pages/home.js')],
      ['/products', () => import('./pages/products.js')],
      ['/admin', () => import('./pages/admin.js')]
    ]);
  }

  async navigate(path) {
    // Show loading state
    this.innerHTML = '<div class="loading">Loading...</div>';

    try {
      const loader = this.routes.get(path);
      if (!loader) {
        throw new Error('Route not found');
      }

      // Load the module
      const module = await loader();

      // Render the page component
      this.innerHTML = `<${module.tagName}></${module.tagName}>`;

      // Track page load time
      performance.mark(`page-${path}-loaded`);
    } catch (error) {
      this.innerHTML = `<error-page message="${error.message}"></error-page>`;
    }
  }
}

// Feature-based code splitting
class DataGrid extends HTMLElement {
  async enableExport() {
    if (!this.exportModule) {
      // Only load export library when user needs it
      this.exportModule = await import('https://cdn.jsdelivr.net/npm/xlsx/+esm');
    }

    const worksheet = this.exportModule.utils.json_to_sheet(this.data);
    const workbook = this.exportModule.utils.book_new();
    this.exportModule.utils.book_append_sheet(workbook, worksheet, 'Data');
    this.exportModule.writeFile(workbook, 'export.xlsx');
  }
}
```

## Debouncing and Throttling

Control how often expensive operations run:

```javascript
// Debounce: Wait for user to stop typing
function debounce(fn, delay = 300) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), delay);
  };
}

class SearchBox extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <input type="text" placeholder="Search...">
      <div class="results"></div>
    `;

    const input = this.querySelector('input');
    const results = this.querySelector('.results');

    // Debounce search API calls
    const searchDebounced = debounce(async (query) => {
      if (query.length < 2) {
        results.innerHTML = '';
        return;
      }

      results.innerHTML = 'Searching...';

      const data = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        .then(r => r.json());

      results.innerHTML = data.map(item =>
        `<div class="result">${item.title}</div>`
      ).join('');
    }, 300);

    input.addEventListener('input', (e) => {
      searchDebounced(e.target.value);
    });
  }
}

// Throttle: Limit scroll handler frequency
function throttle(fn, delay = 100) {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      lastCall = now;
      fn.apply(this, args);
    }
  };
}

class InfiniteScroll extends HTMLElement {
  connectedCallback() {
    const loadMore = throttle(() => {
      const scrollBottom = this.scrollTop + this.clientHeight;
      const threshold = this.scrollHeight - 200;

      if (scrollBottom >= threshold && !this.loading) {
        this.loadNextPage();
      }
    }, 200);

    this.addEventListener('scroll', loadMore);
  }

  async loadNextPage() {
    this.loading = true;
    // Load more items...
    this.loading = false;
  }
}
```

## Memoization for Expensive Computations

Cache computed values to avoid redundant work:

```javascript
class DataTable extends HTMLElement {
  constructor() {
    super();
    this.cache = new Map();
  }

  // Memoize expensive sort operation
  getSortedData(data, sortKey, direction) {
    const cacheKey = `${sortKey}-${direction}`;

    if (this.cache.has(cacheKey)) {
      console.log('Using cached sort');
      return this.cache.get(cacheKey);
    }

    console.log('Computing sort');
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      const multiplier = direction === 'asc' ? 1 : -1;
      return aVal < bVal ? -multiplier : aVal > bVal ? multiplier : 0;
    });

    this.cache.set(cacheKey, sorted);
    return sorted;
  }

  // Clear cache when data changes
  set data(newData) {
    this._data = newData;
    this.cache.clear();
    this.render();
  }
}

// Memoize with WeakMap for object keys
const memoizedCalculations = new WeakMap();

function expensiveCalculation(obj) {
  if (memoizedCalculations.has(obj)) {
    return memoizedCalculations.get(obj);
  }

  const result = {
    total: obj.items.reduce((sum, item) => sum + item.price, 0),
    tax: obj.items.reduce((sum, item) => sum + item.price * 0.1, 0),
    // ... more expensive calculations
  };

  memoizedCalculations.set(obj, result);
  return result;
}
```

## Bundle Size Optimization

Keep your JavaScript small:

```javascript
// Use import maps to share dependencies
// In your HTML:
/*
<script type="importmap">
{
  "imports": {
    "lit": "https://cdn.jsdelivr.net/npm/lit@3/+esm",
    "lit/": "https://cdn.jsdelivr.net/npm/lit@3/"
  }
}
</script>
*/

// Multiple components can share the same lit import
import { LitElement, html, css } from 'lit';

// Tree-shake unused code by importing only what you need
// ❌ Bad: imports everything
import * as utils from './utils.js';

// ✅ Good: imports only what's needed
import { formatDate, formatCurrency } from './utils.js';

// Prefer native APIs over libraries
// ❌ Heavy date library (40KB+)
import dayjs from 'dayjs';
const formatted = dayjs(date).format('YYYY-MM-DD');

// ✅ Native Intl (0KB)
const formatted = new Intl.DateTimeFormat('en-US').format(date);

// Use dynamic imports for conditional features
if (user.isAdmin) {
  const { AdminPanel } = await import('./admin.js');
  // Use AdminPanel
}
```

Check your bundle size:

```bash
# Analyze what's being loaded
ls -lh dist/*.js

# Use browser DevTools Network tab to see:
# - Total KB transferred
# - Uncompressed size
# - Number of requests
```

## Web Vitals Monitoring

Monitor real user experience:

```javascript
// web-vitals-tracker.js
class WebVitalsTracker {
  constructor() {
    this.metrics = {};
  }

  async track() {
    // Import web-vitals library only when needed
    const { onCLS, onFID, onLCP, onFCP, onTTFB } = await import(
      'https://cdn.jsdelivr.net/npm/web-vitals@3/+esm'
    );

    onCLS((metric) => this.reportMetric(metric));
    onFID((metric) => this.reportMetric(metric));
    onLCP((metric) => this.reportMetric(metric));
    onFCP((metric) => this.reportMetric(metric));
    onTTFB((metric) => this.reportMetric(metric));
  }

  reportMetric(metric) {
    this.metrics[metric.name] = metric.value;

    // Send to analytics
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/analytics', JSON.stringify({
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        page: window.location.pathname
      }));
    }

    // Log for development
    console.log(`${metric.name}: ${metric.value} (${metric.rating})`);
  }

  getScores() {
    return {
      cls: this.metrics.CLS || 0,
      fid: this.metrics.FID || 0,
      lcp: this.metrics.LCP || 0,
      fcp: this.metrics.FCP || 0,
      ttfb: this.metrics.TTFB || 0
    };
  }
}

// Use in your app
const vitals = new WebVitalsTracker();
vitals.track();
```

Display performance scores to users:

```javascript
class PerformanceWidget extends HTMLElement {
  async connectedCallback() {
    const { onLCP, onFID, onCLS } = await import(
      'https://cdn.jsdelivr.net/npm/web-vitals@3/+esm'
    );

    this.innerHTML = `
      <div class="vitals">
        <div class="metric">
          <span class="label">LCP</span>
          <span class="value lcp">...</span>
        </div>
        <div class="metric">
          <span class="label">FID</span>
          <span class="value fid">...</span>
        </div>
        <div class="metric">
          <span class="label">CLS</span>
          <span class="value cls">...</span>
        </div>
      </div>
    `;

    onLCP(({ value, rating }) => {
      this.querySelector('.lcp').textContent = `${Math.round(value)}ms`;
      this.querySelector('.lcp').className = `value lcp ${rating}`;
    });

    onFID(({ value, rating }) => {
      this.querySelector('.fid').textContent = `${Math.round(value)}ms`;
      this.querySelector('.fid').className = `value fid ${rating}`;
    });

    onCLS(({ value, rating }) => {
      this.querySelector('.cls').textContent = value.toFixed(3);
      this.querySelector('.cls').className = `value cls ${rating}`;
    });
  }
}

customElements.define('performance-widget', PerformanceWidget);
```

## Real-World Example: Optimized Dashboard

Here's a complete dashboard with all optimization techniques applied:

```javascript
class OptimizedDashboard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cache = new Map();
    this.loadedWidgets = new Set();
  }

  async connectedCallback() {
    // 1. Render shell immediately (FCP)
    this.renderShell();

    // 2. Load critical data
    await this.loadCriticalData();

    // 3. Set up lazy loading for below-fold widgets
    this.setupLazyLoading();

    // 4. Track performance
    this.trackPerformance();
  }

  renderShell() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          container-type: inline-size;
        }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
          padding: 1rem;
        }

        .widget {
          background: white;
          border-radius: 8px;
          padding: 1rem;
          min-height: 200px;
        }

        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      </style>

      <div class="grid">
        <div class="widget" data-widget="revenue">
          <div class="skeleton"></div>
        </div>
        <div class="widget" data-widget="users">
          <div class="skeleton"></div>
        </div>
        <div class="widget" data-widget="chart" data-lazy>
          <div class="skeleton"></div>
        </div>
        <div class="widget" data-widget="table" data-lazy>
          <div class="skeleton"></div>
        </div>
      </div>
    `;
  }

  async loadCriticalData() {
    // Load above-the-fold widgets in parallel
    const criticalWidgets = ['revenue', 'users'];

    await Promise.all(
      criticalWidgets.map(widget => this.loadWidget(widget))
    );
  }

  setupLazyLoading() {
    const lazyWidgets = this.shadowRoot.querySelectorAll('[data-lazy]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const widgetName = entry.target.dataset.widget;
            this.loadWidget(widgetName);
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '50px' }
    );

    lazyWidgets.forEach(widget => observer.observe(widget));
  }

  async loadWidget(name) {
    if (this.loadedWidgets.has(name)) return;

    performance.mark(`widget-${name}-start`);

    try {
      // Check cache first
      let data = this.cache.get(name);

      if (!data) {
        // Load data with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        data = await fetch(`/api/widgets/${name}`, {
          signal: controller.signal
        }).then(r => r.json());

        clearTimeout(timeoutId);

        // Cache for 5 minutes
        this.cache.set(name, data);
        setTimeout(() => this.cache.delete(name), 5 * 60 * 1000);
      }

      // Render widget
      const widget = this.shadowRoot.querySelector(`[data-widget="${name}"]`);
      widget.innerHTML = this.renderWidget(name, data);

      this.loadedWidgets.add(name);

      performance.mark(`widget-${name}-end`);
      performance.measure(
        `widget-${name}`,
        `widget-${name}-start`,
        `widget-${name}-end`
      );
    } catch (error) {
      console.error(`Failed to load widget ${name}:`, error);

      const widget = this.shadowRoot.querySelector(`[data-widget="${name}"]`);
      widget.innerHTML = `
        <div class="error">
          <p>Failed to load ${name}</p>
          <button onclick="this.getRootNode().host.loadWidget('${name}')">
            Retry
          </button>
        </div>
      `;
    }
  }

  renderWidget(name, data) {
    switch (name) {
      case 'revenue':
        return `
          <h3>Revenue</h3>
          <div class="value">$${data.total.toLocaleString()}</div>
          <div class="change ${data.change >= 0 ? 'positive' : 'negative'}">
            ${data.change >= 0 ? '↑' : '↓'} ${Math.abs(data.change)}%
          </div>
        `;

      case 'users':
        return `
          <h3>Active Users</h3>
          <div class="value">${data.count.toLocaleString()}</div>
        `;

      case 'chart':
        // Lazy load chart library only when needed
        return `<canvas id="chart-${name}"></canvas>`;

      case 'table':
        return `
          <h3>Recent Activity</h3>
          <virtual-list></virtual-list>
        `;

      default:
        return `<div>Unknown widget: ${name}</div>`;
    }
  }

  trackPerformance() {
    // Track load time
    window.addEventListener('load', () => {
      const loadTime = performance.timing.loadEventEnd -
                      performance.timing.navigationStart;
      console.log(`Dashboard loaded in ${loadTime}ms`);
    });

    // Track widget render times
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.name.startsWith('widget-')) {
          console.log(`${entry.name}: ${entry.duration}ms`);
        }
      });
    });

    observer.observe({ entryTypes: ['measure'] });
  }
}

customElements.define('optimized-dashboard', OptimizedDashboard);
```

## Troubleshooting Performance Issues

### Problem 1: Memory Leaks

**Symptoms**: Page gets slower over time, browser tab uses increasing memory.

**Common causes**:

- Event listeners not removed
- Setters/intervals not cleared
- Large objects cached indefinitely

**Solution**:

```javascript
class LeakyComponent extends HTMLElement {
  connectedCallback() {
    // ❌ Memory leak: handler never removed
    window.addEventListener('resize', this.onResize);

    // ❌ Memory leak: interval never cleared
    this.intervalId = setInterval(() => this.update(), 1000);

    // ❌ Memory leak: cache grows forever
    this.cache = new Map();
  }
}

class FixedComponent extends HTMLElement {
  connectedCallback() {
    // ✅ Store handler reference
    this.onResize = () => this.handleResize();
    window.addEventListener('resize', this.onResize);

    // ✅ Store interval ID
    this.intervalId = setInterval(() => this.update(), 1000);

    // ✅ Use LRU cache with size limit
    this.cache = new Map();
    this.maxCacheSize = 100;
  }

  disconnectedCallback() {
    // ✅ Clean up listener
    window.removeEventListener('resize', this.onResize);

    // ✅ Clear interval
    clearInterval(this.intervalId);

    // ✅ Clear cache
    this.cache.clear();
  }

  addToCache(key, value) {
    if (this.cache.size >= this.maxCacheSize) {
      // Remove oldest entry
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}
```

Use browser DevTools to detect leaks:
1. Open Performance Monitor (Cmd/Ctrl + Shift + P → "Performance Monitor")
2. Watch JS heap size over time
3. Take heap snapshots to find retained objects

### Problem 2: Slow Initial Render

**Symptoms**: Long time before page shows content, poor LCP score.

**Common causes**:

- Loading too much JavaScript upfront
- Synchronous data fetching
- Rendering everything at once

**Solution**:

```javascript
// ❌ Bad: Wait for everything
class SlowApp extends HTMLElement {
  async connectedCallback() {
    const data = await fetch('/api/data').then(r => r.json());
    this.render(data);
  }
}

// ✅ Good: Progressive rendering
class FastApp extends HTMLElement {
  connectedCallback() {
    // 1. Show shell immediately
    this.innerHTML = '<div class="shell">Loading...</div>';

    // 2. Load data asynchronously
    this.loadData();
  }

  async loadData() {
    try {
      const data = await fetch('/api/data').then(r => r.json());
      this.render(data);
    } catch (error) {
      this.renderError(error);
    }
  }
}
```

### Problem 3: Large Bundle Size

**Symptoms**: Slow initial load, poor First Contentful Paint.

**Diagnosis**:

```javascript
// Analyze what's in your bundle
console.table(
  performance.getEntriesByType('resource')
    .filter(r => r.initiatorType === 'script')
    .map(r => ({
      name: r.name.split('/').pop(),
      size: `${(r.transferSize / 1024).toFixed(2)} KB`,
      time: `${r.duration.toFixed(2)}ms`
    }))
);
```

**Solutions**:

- Use import maps to share dependencies
- Lazy load non-critical features
- Use native APIs instead of libraries
- Tree-shake unused code

### Problem 4: Layout Thrashing

**Symptoms**: Janky scrolling, slow animations, poor FPS.

**Cause**: Reading and writing DOM in the same frame.

```javascript
// ❌ Bad: Forces multiple reflows
items.forEach(item => {
  const height = item.offsetHeight;  // Read (reflow)
  item.style.height = height * 2 + 'px';  // Write (reflow)
});

// ✅ Good: Batch reads and writes
const heights = items.map(item => item.offsetHeight);  // Batch reads
items.forEach((item, i) => {
  item.style.height = heights[i] * 2 + 'px';  // Batch writes
});

// ✅ Better: Use requestAnimationFrame
function updateLayout() {
  // All reads first
  const measurements = elements.map(el => ({
    width: el.offsetWidth,
    height: el.offsetHeight
  }));

  // Then all writes
  elements.forEach((el, i) => {
    el.style.width = measurements[i].width * 2 + 'px';
    el.style.height = measurements[i].height * 2 + 'px';
  });
}

requestAnimationFrame(updateLayout);
```

## Performance Best Practices

1. **Load Critical Resources First**: Prioritize above-the-fold content and user-interactive elements.

2. **Lazy Load Everything Else**: Use Intersection Observer for images, components, and heavy features.

3. **Cache Aggressively**: Use service workers, HTTP caching, and in-memory caches appropriately.

4. **Measure Real Users**: Track Web Vitals for actual user experiences, not just lab tests.

5. **Debounce User Input**: Don't make API calls on every keystroke—wait for users to finish typing.

6. **Virtualize Long Lists**: Never render more than ~50-100 items at once.

7. **Code Split by Route**: Load only the JavaScript needed for the current page.

8. **Optimize Images**: Use modern formats (WebP, AVIF), lazy loading, and responsive images.

9. **Clean Up Resources**: Always remove event listeners and clear intervals in `disconnectedCallback`.

10. **Profile Before Optimizing**: Use DevTools to find actual bottlenecks—don't guess.

## Hands-On Exercises

### Exercise 1: Optimize an Image Gallery

Create an image gallery that:

- Lazy loads images as they scroll into view
- Uses Intersection Observer
- Shows a loading placeholder
- Tracks LCP for the first visible image

**Bonus**: Add a "Load All" button that prefetches remaining images.

### Exercise 2: Build a Virtual List

Implement a virtual list component that:

- Renders only visible items
- Handles variable-height items
- Supports smooth scrolling
- Works with 10,000+ items

**Bonus**: Add keyboard navigation and accessibility.

### Exercise 3: Implement Request Deduplication

Create a data service that:

- Prevents duplicate API calls for the same resource
- Shares pending requests between components
- Caches responses for 1 minute
- Provides a cache invalidation API

**Bonus**: Add optimistic updates with rollback on error.

### Exercise 4: Performance Dashboard

Build a performance monitoring dashboard that:

- Tracks all Core Web Vitals
- Shows performance over time
- Highlights performance regressions
- Exports data to CSV

**Bonus**: Add alerts when metrics exceed thresholds.

## Summary

Performance optimization is about making smart tradeoffs:

- **Load less**: Code split, lazy load, tree shake
- **Cache more**: Service workers, HTTP cache, memory cache
- **Render efficiently**: Virtual lists, debouncing, memoization
- **Measure everything**: Web Vitals, Performance API, DevTools

Start with the low-hanging fruit (lazy loading, caching) and use DevTools to find the real bottlenecks. Remember: premature optimization is the root of all evil—measure first, then optimize.

## Further Reading

- **Building with LARC - Chapter 17 (Performance)**: Deep dive into LARC-specific optimization techniques
- **Building with LARC - Chapter 8 (Lifecycle)**: Component cleanup and resource management
- **Building with LARC - Chapter 11 (Best Practices)**: Performance patterns and anti-patterns
