# Deployment and Production

Quick reference for deploying LARC applications to production. For detailed tutorials, see *Learning LARC* Chapter 16.

## Overview

LARC applications deploy as static files with optional build optimization. No complex pipelines required—serve vanilla JavaScript directly or optimize with minimal tooling.

**Key Concepts:**
- No-build deployment option
- Optional esbuild optimization
- CDN deployment strategies
- Caching policies
- Performance monitoring
- Production debugging tools

## Quick Example

```javascript
// Minimal esbuild configuration
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  outfile: 'dist/app.js',
  format: 'esm'
});
```

Deploy `dist/` folder to any static host (Cloudflare Pages, Netlify, Vercel).

## Build Options

| Approach | Use Case | Complexity |
|----------|----------|------------|
| **No Build** | Small apps, rapid prototyping | None |
| **esbuild** | Production optimization | Minimal |
| **Code Splitting** | Large apps with routing | Low |
| **TypeScript** | Type safety | Medium |

### Build Configuration Example

```json
{
  "scripts": {
    "build": "node build.js",
    "dev": "node build.js --watch"
  }
}
```

## CDN Deployment

### Platform Commands

| Platform | Command | Config File |
|----------|---------|-------------|
| **Cloudflare Pages** | `wrangler pages publish dist` | `_headers` |
| **Netlify** | `netlify deploy --dir=dist --prod` | `netlify.toml` |
| **Vercel** | `vercel --prod` | `vercel.json` |

### Cache Headers

```
# _headers (Cloudflare)
/*.js
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache

/service-worker.js
  Cache-Control: no-cache
```

## Common Patterns

### Pattern 1: Service Worker Caching

Offline support and faster loads.

```javascript
// service-worker.js
const CACHE_NAME = 'larc-app-v1';
const URLS_TO_CACHE = ['/', '/index.html', '/app.js', '/styles.css'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

// Register in app
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js');
}
```

### Pattern 2: Performance Monitoring

Track Core Web Vitals.

```javascript
class PerformanceMonitor extends HTMLElement {
  connectedCallback() {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lcp = entries[entries.length - 1];
      this.sendMetric('lcp', lcp.renderTime || lcp.loadTime);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = entry.processingStart - entry.startTime;
        this.sendMetric('fid', fid);
      }
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift
    let clsScore = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) clsScore += entry.value;
      }
      this.sendMetric('cls', clsScore);
    }).observe({ entryTypes: ['layout-shift'] });
  }

  sendMetric(name, value) {
    navigator.sendBeacon('/api/metrics', JSON.stringify({
      metric: name,
      value,
      url: location.pathname,
      timestamp: Date.now()
    }));
  }
}

customElements.define('perf-monitor', PerformanceMonitor);
```

### Pattern 3: Error Tracking

Production error monitoring.

```javascript
class ErrorTracker extends HTMLElement {
  connectedCallback() {
    // Global errors
    window.addEventListener('error', (e) => {
      this.trackError({
        message: e.message,
        stack: e.error?.stack,
        source: e.filename,
        line: e.lineno
      });
    });

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.trackError({
        message: e.reason?.message || 'Promise rejected',
        stack: e.reason?.stack
      });
    });
  }

  trackError(error) {
    navigator.sendBeacon('/api/errors', JSON.stringify({
      ...error,
      timestamp: new Date().toISOString(),
      url: location.href,
      userAgent: navigator.userAgent
    }));
  }
}

customElements.define('error-tracker', ErrorTracker);
```

### Pattern 4: Feature Flags

Control features without redeployment.

```javascript
class FeatureFlags extends HTMLElement {
  async connectedCallback() {
    const bus = document.querySelector('pan-bus');
    
    // Load flags from server
    const response = await fetch('/api/feature-flags');
    this.flags = await response.json();
    
    bus.publish('flags.loaded', this.flags);
    
    // Check flags
    bus.subscribe('flags.check', (msg) => {
      const { flag, defaultValue } = msg.data;
      const enabled = this.flags[flag] ?? defaultValue;
      bus.publish('flags.result', { flag, enabled });
    });
  }
}

// Usage in components
bus.publish('flags.check', { flag: 'new-feature', defaultValue: false });
bus.subscribe('flags.result', (msg) => {
  if (msg.data.flag === 'new-feature' && msg.data.enabled) {
    // Show new feature
  }
});
```

## Caching Strategies

| Resource Type | Cache Duration | Strategy |
|---------------|----------------|----------|
| **HTML** | No cache | `no-cache, must-revalidate` |
| **JavaScript/CSS** | 1 year | `public, max-age=31536000, immutable` |
| **Images** | 30 days | `public, max-age=2592000` |
| **API Responses** | 5 minutes | Client-side cache with invalidation |

### API Response Caching

```javascript
class CachedAPIClient extends HTMLElement {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutes
  }

  async fetch(method, endpoint, data) {
    const cacheKey = `${method}:${endpoint}`;
    
    // Check cache for GET
    if (method === 'GET') {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
      }
    }
    
    // Fetch from API
    const response = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    });
    
    const result = await response.json();
    
    // Cache GET responses
    if (method === 'GET') {
      this.cache.set(cacheKey, {
        data: result,
        expiresAt: Date.now() + this.cacheDuration
      });
    } else {
      // Invalidate cache on mutations
      this.cache.clear();
    }
    
    return result;
  }
}
```

## Performance Metrics

### Core Web Vitals Targets

| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| **LCP** (Largest Contentful Paint) | ≤2.5s | 2.5-4s | >4s |
| **FID** (First Input Delay) | ≤100ms | 100-300ms | >300ms |
| **CLS** (Cumulative Layout Shift) | ≤0.1 | 0.1-0.25 | >0.25 |
| **TTFB** (Time to First Byte) | ≤800ms | 800-1800ms | >1800ms |

### Custom Performance Marks

```javascript
// Track specific operations
performance.mark('load-start');
await fetchData();
performance.mark('load-end');
performance.measure('data-load', 'load-start', 'load-end');

const measurement = performance.getEntriesByName('data-load')[0];
console.log(`Data load: ${measurement.duration}ms`);
```

## Complete Example

Production-ready deployment with monitoring.

```javascript
// build.js - Build script with optimization
import * as esbuild from 'esbuild';
import { statSync } from 'fs';

const result = await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  sourcemap: 'external',
  target: ['es2020'],
  outfile: 'dist/app.js',
  metafile: true
});

// Check bundle size
const stats = statSync('dist/app.js');
const sizeKB = (stats.size / 1024).toFixed(2);
console.log(`Bundle: ${sizeKB} KB`);

if (parseFloat(sizeKB) > 500) {
  throw new Error(`Bundle too large: ${sizeKB} KB`);
}

// index.html - Production HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC App</title>
  <script type="module" src="/app.js"></script>
</head>
<body>
  <!-- Core components -->
  <pan-bus debug="false"></pan-bus>
  <error-tracker></error-tracker>
  <perf-monitor></perf-monitor>
  <feature-flags></feature-flags>
  
  <!-- App root -->
  <div id="app"></div>
</body>
</html>

// netlify.toml - Netlify configuration
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "no-cache"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

// app.js - Application entry
import './core/pan-bus.mjs';
import './components/error-tracker.js';
import './components/perf-monitor.js';
import './components/feature-flags.js';

const bus = document.querySelector('pan-bus');

// Wait for initialization
bus.addEventListener('pan:sys.ready', () => {
  console.log('LARC app initialized');
  
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
      .then(() => console.log('Service worker registered'))
      .catch(err => console.error('SW registration failed:', err));
  }
  
  // Load main app
  import('./main.js').then(module => {
    module.init(bus);
  });
});
```

## Deployment Checklist

Pre-deployment verification:

- [ ] Tests pass
- [ ] Bundle minified and under size limit
- [ ] Source maps generated (protected in production)
- [ ] Cache headers configured
- [ ] Service worker registered (if using)
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Feature flags configured
- [ ] Environment variables set
- [ ] SSL certificate valid
- [ ] CDN configured
- [ ] Monitoring alerts set up
- [ ] Rollback plan documented

## Component Reference

- Performance monitoring: Use native PerformanceObserver API
- Error tracking: Integrate with Sentry, Rollbar, or custom backend
- Feature flags: Server-side control with client-side caching

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 16 (Deployment)
- **Performance**: Chapter 12 (Performance Optimization)
- **Testing**: Chapter 13 (Testing Strategies)
- **Error Handling**: Chapter 14 (Error Handling and Debugging)
- **Configuration**: Appendix C (Build and Deploy Configuration)

## Common Issues

### Service Worker Not Updating
**Problem**: Users see stale cached content  
**Solution**: Implement cache versioning and force update

```javascript
const CACHE_NAME = 'larc-app-v2'; // Increment version

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});
```

### Source Maps Exposed to Public
**Problem**: Source maps leak implementation details  
**Solution**: Serve source maps only to authenticated users

```javascript
// Edge function
export default {
  async fetch(request) {
    const url = new URL(request.url);
    
    if (url.pathname.endsWith('.map')) {
      const token = request.headers.get('Authorization');
      if (!isValidDevToken(token)) {
        return new Response('Unauthorized', { status: 401 });
      }
    }
    
    return fetch(request);
  }
};
```

### Cache Invalidation After Deploy
**Problem**: Users load old cached assets with new HTML  
**Solution**: Use cache busting with content hashes

```javascript
// build.js - Add hash to filenames
import { createHash } from 'crypto';

const content = readFileSync('dist/app.js');
const hash = createHash('sha256')
  .update(content)
  .digest('hex')
  .slice(0, 8);

renameSync('dist/app.js', `dist/app.${hash}.js`);

// Update HTML references
let html = readFileSync('src/index.html', 'utf-8');
html = html.replace('app.js', `app.${hash}.js`);
writeFileSync('dist/index.html', html);
```

### Performance Metrics Not Reporting
**Problem**: sendBeacon blocked by CORS or content blockers  
**Solution**: Use fallback and proper CORS headers

```javascript
sendMetric(name, value) {
  const payload = JSON.stringify({ metric: name, value });
  
  // Try sendBeacon first
  const sent = navigator.sendBeacon('/api/metrics', payload);
  
  // Fallback to fetch
  if (!sent) {
    fetch('/api/metrics', {
      method: 'POST',
      body: payload,
      keepalive: true
    }).catch(err => console.error('Metric send failed:', err));
  }
}
```

### Bundle Size Exceeds Limits
**Problem**: Build fails due to large bundle  
**Solution**: Implement code splitting and lazy loading

```javascript
// Router with lazy loading
async loadRoute(route) {
  const module = await import(`./routes/${route}.js`);
  return new module.default();
}

// esbuild with splitting
await esbuild.build({
  entryPoints: ['src/app.js', 'src/routes/*.js'],
  bundle: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist'
});
```

### Update Notifications Not Showing
**Problem**: Users miss version updates  
**Solution**: Implement version check with notification

```javascript
class UpdateChecker extends HTMLElement {
  async connectedCallback() {
    const currentVersion = '1.2.3';
    
    const response = await fetch('/version.json', { cache: 'no-cache' });
    const { version } = await response.json();
    
    if (version !== currentVersion) {
      this.innerHTML = `
        <div class="update-banner">
          New version available!
          <button onclick="location.reload()">Refresh</button>
        </div>
      `;
    }
  }
}

customElements.define('update-checker', UpdateChecker);
```

**See Also**: *Learning LARC* Chapter 16 for step-by-step deployment tutorials.
