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
