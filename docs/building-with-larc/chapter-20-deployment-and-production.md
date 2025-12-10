# Deployment and Production

> "In development, everything works. In production, nothing works. In between is where your career is made." — Murphy's Law of Software Development

You've built your LARC application. It's beautiful. It's tested. It works perfectly on your machine. Now comes the moment of truth: deploying it to production, where real users with real problems will find real bugs you never knew existed.

The good news? LARC's simplicity makes deployment straightforward. The better news? We're about to make it even easier.

## Build Considerations (Or Lack Thereof)

One of LARC's most delightful features is that it doesn't require a build step. No webpack. No babel. No spending three days configuring bundlers. You can literally serve your `.js` files directly to browsers.

### The No-Build Approach

For small to medium applications, skip the build entirely:

```
my-app/
|-- index.html
|-- app.js
|-- components/
|   |-- header.js
|   |-- sidebar.js
|   `-- footer.js
`-- lib/
    `-- larc.js
```

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
  <script type="module" src="app.js"></script>
</head>
<body>
  <div id="app"></div>
</body>
</html>
```

```javascript
// app.js
import { createBus, Component, html } from './lib/larc.js';
import { Header } from './components/header.js';
import { Sidebar } from './components/sidebar.js';
import { Footer } from './components/footer.js';

const bus = createBus();

// Initialize components
new Header({ bus, target: document.querySelector('#header') });
new Sidebar({ bus, target: document.querySelector('#sidebar') });
new Footer({ bus, target: document.querySelector('#footer') });
```

Deploy this to any static file server. Done. Seriously. That's it.

### When You Actually Need a Build Step

Sometimes you want to optimize. Fair enough. Here's when a build makes sense:

1. **Minification**: Reduce file size for faster loading
2. **Code splitting**: Load only what's needed for each page
3. **Tree shaking**: Remove unused code
4. **Transpilation**: Support older browsers (if you must)
5. **Asset optimization**: Compress images, inline critical CSS

### Minimal Build with esbuild

esbuild is fast enough that you'll think it's broken:

```javascript
// build.js
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

console.log('Build complete!');
```

Run it:

```bash
node build.js
```

That's your entire build process. Add it to `package.json`:

```json
{
  "scripts": {
    "build": "node build.js",
    "dev": "node build.js --watch"
  }
}
```

### Code Splitting for Larger Apps

Split your code by route or feature:

```javascript
// build.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: [
    'src/app.js',
    'src/pages/home.js',
    'src/pages/about.js',
    'src/pages/contact.js'
  ],
  bundle: true,
  minify: true,
  splitting: true,
  format: 'esm',
  outdir: 'dist',
  chunkNames: 'chunks/[name]-[hash]'
});
```

Then lazy load pages:

```javascript
class Router extends Component {
  async loadPage(pageName) {
    this.state.loading = true;

    try {
      // Dynamic import
      const module = await import(`./pages/${pageName}.js`);
      const PageComponent = module.default;

      this.state.currentPage = new PageComponent({
        bus: this.bus,
        target: this.pageContainer
      });

      this.state.loading = false;

    } catch (error) {
      console.error('Failed to load page:', error);
      this.state.error = error.message;
    }
  }

  render() {
    if (this.state.loading) {
      return html`<div class="loading">Loading...</div>`;
    }

    if (this.state.error) {
      return html`<div class="error">Error: ${this.state.error}</div>`;
    }

    return html`<div ref=${el => this.pageContainer = el}></div>`;
  }
}
```

### TypeScript Integration (Optional)

If you're into type safety:

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
```

```bash
# Build
tsc && node build.js
```

Or use esbuild to handle TypeScript directly:

```javascript
await esbuild.build({
  entryPoints: ['src/app.ts'],
  bundle: true,
  minify: true,
  loader: { '.ts': 'ts' },
  outfile: 'dist/app.js'
});
```

## CDN Deployment

Content Delivery Networks make your app fast worldwide. Users in Tokyo load from Tokyo. Users in Paris load from Paris. Everyone's happy.

### Static File Hosting

Deploy to any CDN that serves static files:

**Cloudflare Pages**:
```bash
# Install Wrangler CLI
npm install -g wrangler

# Deploy
wrangler pages publish dist
```

**Netlify**:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --dir=dist --prod
```

**Vercel**:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

### Configuration Files

Most CDN providers want a config file:

**Cloudflare Pages** (`_headers`):
```
/*
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: no-cache

/app.js
  Cache-Control: public, max-age=31536000, immutable

/service-worker.js
  Cache-Control: no-cache
```

**Netlify** (`netlify.toml`):
```toml
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
```

**Vercel** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "routes": [
    {
      "src": "/(.*\\.js)",
      "headers": {
        "Cache-Control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/index.html",
      "headers": {
        "Cache-Control": "no-cache"
      }
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

### Asset Fingerprinting

Add content hashes to filenames for cache busting:

```javascript
// build.js
import * as esbuild from 'esbuild';
import { createHash } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';

// Build
await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  metafile: true,
  outfile: 'dist/app.js'
});

// Add hash to filename
const content = readFileSync('dist/app.js');
const hash = createHash('sha256').update(content).digest('hex').slice(0, 8);
const hashedFilename = `app.${hash}.js`;

// Rename file
renameSync('dist/app.js', `dist/${hashedFilename}`);

// Update index.html
let html = readFileSync('src/index.html', 'utf-8');
html = html.replace('app.js', hashedFilename);
writeFileSync('dist/index.html', html);

console.log(`Built: ${hashedFilename}`);
```

## Caching Strategies

Caching is the art of remembering things so you don't have to fetch them again. Get it right, and your app is lightning fast. Get it wrong, and users see stale content for months.

### Browser Cache Headers

Set appropriate cache headers for different file types:

```javascript
// Edge function (Cloudflare Workers example)
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const response = await fetch(request);

    // Clone response so we can modify headers
    const newResponse = new Response(response.body, response);

    if (url.pathname.endsWith('.js') || url.pathname.endsWith('.css')) {
      // Cache JavaScript and CSS for 1 year
      newResponse.headers.set(
        'Cache-Control',
        'public, max-age=31536000, immutable'
      );
    } else if (url.pathname.endsWith('.html')) {
      // Don't cache HTML
      newResponse.headers.set(
        'Cache-Control',
        'no-cache, must-revalidate'
      );
    } else if (url.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg)$/)) {
      // Cache images for 30 days
      newResponse.headers.set(
        'Cache-Control',
        'public, max-age=2592000'
      );
    }

    return newResponse;
  }
};
```

### Service Worker Caching

Implement offline support and faster loads:

```javascript
// service-worker.js
const CACHE_NAME = 'larc-app-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/lib/larc.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(URLS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        if (response) {
          return response;
        }

        return fetch(event.request).then(response => {
          // Cache new responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

self.addEventListener('activate', (event) => {
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
```

Register the service worker:

```javascript
// app.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registered:', registration.scope);
      })
      .catch(error => {
        console.error('Service Worker registration failed:', error);
      });
  });
}
```

### API Response Caching

Cache API responses intelligently:

```javascript
class CachedAPIClient extends Component {
  init() {
    this.state = {
      cache: new Map(),
      cacheDurations: {
        'GET': 5 * 60 * 1000, // 5 minutes
        'POST': 0, // Don't cache
        'PUT': 0,
        'DELETE': 0
      }
    };

    this.on('api-request', this.handleRequest);
  }

  async handleRequest({ method, endpoint, data, requestId, bypassCache }) {
    const cacheKey = `${method}:${endpoint}:${JSON.stringify(data || {})}`;

    // Check cache for GET requests
    if (method === 'GET' && !bypassCache) {
      const cached = this.state.cache.get(cacheKey);

      if (cached && Date.now() < cached.expiresAt) {
        this.emit('api-success', {
          requestId,
          result: cached.data,
          cached: true
        });
        return;
      }
    }

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: data ? JSON.stringify(data) : undefined
      });

      const result = await response.json();

      // Cache GET responses
      if (method === 'GET') {
        this.state.cache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + this.state.cacheDurations[method]
        });
      } else {
        // Invalidate cache on mutations
        this.invalidateCache(endpoint);
      }

      this.emit('api-success', {
        requestId,
        result,
        cached: false
      });

    } catch (error) {
      this.emit('api-error', {
        requestId,
        error: error.message
      });
    }
  }

  invalidateCache(pattern) {
    // Remove cache entries matching pattern
    for (const key of this.state.cache.keys()) {
      if (key.includes(pattern)) {
        this.state.cache.delete(key);
      }
    }
  }

  render() {
    return null;
  }
}
```

## Performance Monitoring

You can't improve what you don't measure. Let's measure everything.

### Real User Monitoring (RUM)

Track actual user experience:

```javascript
class PerformanceMonitor extends Component {
  init() {
    this.state = {
      metrics: {}
    };

    // Capture Core Web Vitals
    this.measureWebVitals();

    // Monitor component render times
    this.monitorComponents();

    // Track custom metrics
    this.on('track-metric', this.trackMetric);
  }

  measureWebVitals() {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];

      this.state.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
      this.sendMetric('lcp', this.state.metrics.lcp);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        this.state.metrics.fid = entry.processingStart - entry.startTime;
        this.sendMetric('fid', this.state.metrics.fid);
      });
    }).observe({ entryTypes: ['first-input'] });

    // Cumulative Layout Shift (CLS)
    let clsScore = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsScore += entry.value;
        }
      }
      this.state.metrics.cls = clsScore;
      this.sendMetric('cls', clsScore);
    }).observe({ entryTypes: ['layout-shift'] });

    // Time to First Byte (TTFB)
    const navigationEntry = performance.getEntriesByType('navigation')[0];
    if (navigationEntry) {
      this.state.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      this.sendMetric('ttfb', this.state.metrics.ttfb);
    }
  }

  monitorComponents() {
    // Wrap component render methods to track timing
    const originalRender = Component.prototype.render;

    Component.prototype.render = function(...args) {
      const start = performance.now();
      const result = originalRender.apply(this, args);
      const duration = performance.now() - start;

      if (duration > 16) { // Slower than 60fps
        this.bus.emit('slow-render', {
          component: this.constructor.name,
          duration
        });
      }

      return result;
    };

    this.on('slow-render', (data) => {
      this.sendMetric('slow-render', data);
    });
  }

  trackMetric({ name, value, tags }) {
    this.state.metrics[name] = value;
    this.sendMetric(name, value, tags);
  }

  sendMetric(name, value, tags = {}) {
    // Send to analytics service
    const payload = {
      metric: name,
      value,
      tags: {
        ...tags,
        url: window.location.pathname,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      }
    };

    // Use sendBeacon for reliability
    navigator.sendBeacon('/api/metrics', JSON.stringify(payload));
  }

  render() {
    // Optional: Display metrics in dev mode
    if (process.env.NODE_ENV === 'development') {
      return html`
        <div class="perf-monitor">
          <h4>Performance Metrics</h4>
          <dl>
            <dt>LCP</dt>
            <dd>${this.state.metrics.lcp?.toFixed(2)}ms</dd>
            <dt>FID</dt>
            <dd>${this.state.metrics.fid?.toFixed(2)}ms</dd>
            <dt>CLS</dt>
            <dd>${this.state.metrics.cls?.toFixed(3)}</dd>
            <dt>TTFB</dt>
            <dd>${this.state.metrics.ttfb?.toFixed(2)}ms</dd>
          </dl>
        </div>
      `;
    }

    return null;
  }
}
```

### Custom Performance Marks

Track specific operations:

```javascript
class DataLoader extends Component {
  async loadUserData(userId) {
    performance.mark('load-user-start');

    try {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      performance.mark('load-user-end');
      performance.measure('load-user', 'load-user-start', 'load-user-end');

      const measurement = performance.getEntriesByName('load-user')[0];

      this.emit('track-metric', {
        name: 'user-load-time',
        value: measurement.duration,
        tags: { userId }
      });

      this.state.user = data;

    } catch (error) {
      performance.mark('load-user-error');
      this.emit('track-metric', {
        name: 'user-load-error',
        value: 1,
        tags: { userId, error: error.message }
      });
    }
  }
}
```

### Bundle Size Monitoring

Track your bundle size over time:

```javascript
// build.js
import * as esbuild from 'esbuild';
import { statSync, writeFileSync } from 'fs';

const result = await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  metafile: true,
  outfile: 'dist/app.js'
});

// Analyze bundle
const stats = statSync('dist/app.js');
const bundleSize = stats.size;
const bundleSizeKB = (bundleSize / 1024).toFixed(2);

console.log(`Bundle size: ${bundleSizeKB} KB`);

// Save to history
const history = {
  timestamp: new Date().toISOString(),
  size: bundleSize,
  sizeKB: bundleSizeKB
};

writeFileSync('build-stats.json', JSON.stringify(history, null, 2));

// Fail build if bundle is too large
const MAX_SIZE_KB = 500;
if (parseFloat(bundleSizeKB) > MAX_SIZE_KB) {
  throw new Error(`Bundle size ${bundleSizeKB} KB exceeds limit of ${MAX_SIZE_KB} KB`);
}
```

## Production Debugging

Debugging production is like debugging with one hand tied behind your back and the lights off. Here's how to see in the dark.

### Source Maps

Always deploy source maps (but protect them):

```javascript
// build.js
await esbuild.build({
  entryPoints: ['src/app.js'],
  bundle: true,
  minify: true,
  sourcemap: 'external', // Creates separate .map file
  outfile: 'dist/app.js'
});
```

Serve source maps only to authenticated users:

```javascript
// Edge function
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Protect source maps
    if (url.pathname.endsWith('.map')) {
      const authToken = request.headers.get('Authorization');

      if (!isValidDevToken(authToken)) {
        return new Response('Unauthorized', { status: 401 });
      }
    }

    return fetch(request);
  }
};
```

### Remote Error Tracking

Integrate with error tracking services:

```javascript
class ErrorTracker extends Component {
  init() {
    // Initialize error tracking (e.g., Sentry)
    if (window.Sentry) {
      window.Sentry.init({
        dsn: 'YOUR_SENTRY_DSN',
        environment: process.env.NODE_ENV,
        release: process.env.APP_VERSION,
        beforeSend(event, hint) {
          // Add custom context
          event.contexts = {
            ...event.contexts,
            app: {
              userId: localStorage.getItem('userId'),
              sessionId: sessionStorage.getItem('sessionId')
            }
          };
          return event;
        }
      });
    }

    // Catch global errors
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        source: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    // Catch promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack
      });
    });

    // Listen for application errors
    this.on('app-error', this.trackError);
  }

  trackError(error) {
    if (window.Sentry) {
      window.Sentry.captureException(error);
    }

    // Also log to our own service
    navigator.sendBeacon('/api/errors', JSON.stringify({
      ...error,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }));
  }

  render() {
    return null;
  }
}
```

### Feature Flags

Control features in production without deploying:

```javascript
class FeatureFlags extends Component {
  init() {
    this.state = {
      flags: {},
      loading: true
    };

    this.loadFlags();
    this.on('check-flag', this.checkFlag);
  }

  async loadFlags() {
    try {
      const response = await fetch('/api/feature-flags');
      this.state.flags = await response.json();
      this.state.loading = false;
      this.emit('flags-loaded');
    } catch (error) {
      console.error('Failed to load feature flags:', error);
      this.state.loading = false;
    }
  }

  checkFlag({ flag, defaultValue = false }) {
    if (this.state.loading) {
      return defaultValue;
    }

    return this.state.flags[flag] ?? defaultValue;
  }

  render() {
    return null;
  }
}

// Usage
class NewFeature extends Component {
  init() {
    this.state = { enabled: false };

    this.on('flags-loaded', () => {
      this.emit('check-flag', { flag: 'new-feature-enabled' });
    });

    this.on('flag-result', ({ flag, value }) => {
      if (flag === 'new-feature-enabled') {
        this.state.enabled = value;
      }
    });
  }

  render() {
    if (!this.state.enabled) {
      return html`<div>Coming soon!</div>`;
    }

    return html`<div class="new-feature">New feature content</div>`;
  }
}
```

## Versioning and Upgrades

Manage versions without breaking production.

### Semantic Versioning

Track your app version:

```javascript
// version.js
export const VERSION = '1.2.3';
export const BUILD_DATE = '2025-12-04T10:30:00Z';
```

Display in your app:

```javascript
class AppFooter extends Component {
  render() {
    return html`
      <footer>
        <span>v${VERSION}</span>
        <span>Built: ${new Date(BUILD_DATE).toLocaleString()}</span>
      </footer>
    `;
  }
}
```

### Update Notifications

Notify users when a new version is available:

```javascript
class UpdateChecker extends Component {
  init() {
    this.state = {
      currentVersion: VERSION,
      latestVersion: VERSION,
      updateAvailable: false
    };

    this.checkForUpdates();

    // Check every 30 minutes
    setInterval(() => this.checkForUpdates(), 30 * 60 * 1000);
  }

  async checkForUpdates() {
    try {
      const response = await fetch('/version.json', {
        cache: 'no-cache'
      });
      const data = await response.json();

      if (data.version !== this.state.currentVersion) {
        this.state.latestVersion = data.version;
        this.state.updateAvailable = true;
        this.emit('update-available', {
          current: this.state.currentVersion,
          latest: data.version
        });
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    }
  }

  render() {
    if (!this.state.updateAvailable) {
      return null;
    }

    return html`
      <div class="update-banner">
        <p>A new version (${this.state.latestVersion}) is available!</p>
        <button onclick=${() => window.location.reload()}>
          Refresh Now
        </button>
        <button onclick=${() => this.state.updateAvailable = false}>
          Later
        </button>
      </div>
    `;
  }
}
```

### Rolling Deployments

Deploy gradually to minimize risk:

```javascript
// Edge function for gradual rollout
export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Determine which version to serve
    const userId = getUserIdFromRequest(request);
    const rolloutPercent = 10; // Serve v2 to 10% of users

    const hash = hashString(userId);
    const bucket = hash % 100;

    if (bucket < rolloutPercent) {
      // Serve new version
      return fetch(`${url.origin}/v2${url.pathname}`);
    } else {
      // Serve current version
      return fetch(request);
    }
  }
};

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
```

## Deployment Checklist

Before you deploy to production, verify:

- [ ] All tests pass
- [ ] Bundle is minified and gzipped
- [ ] Source maps are generated (and protected)
- [ ] Cache headers are configured correctly
- [ ] Service worker is registered (if using)
- [ ] Error tracking is enabled
- [ ] Performance monitoring is active
- [ ] Feature flags are configured
- [ ] API endpoints point to production
- [ ] Environment variables are set
- [ ] Database migrations are applied (if applicable)
- [ ] SSL certificate is valid
- [ ] CDN is configured with correct origins
- [ ] Monitoring alerts are configured
- [ ] Rollback plan is documented
- [ ] Team is notified of deployment

## Monitoring Production Health

Set up health checks and dashboards:

```javascript
class HealthCheck extends Component {
  init() {
    this.state = {
      status: 'unknown',
      checks: {}
    };

    this.runHealthChecks();

    // Run checks every 60 seconds
    setInterval(() => this.runHealthChecks(), 60000);
  }

  async runHealthChecks() {
    const checks = {
      api: await this.checkAPI(),
      websocket: await this.checkWebSocket(),
      localStorage: this.checkLocalStorage(),
      serviceWorker: await this.checkServiceWorker()
    };

    this.state.checks = checks;

    const allHealthy = Object.values(checks).every(c => c.status === 'ok');
    this.state.status = allHealthy ? 'healthy' : 'degraded';

    if (!allHealthy) {
      this.emit('health-check-failed', { checks });
    }
  }

  async checkAPI() {
    try {
      const response = await fetch('/api/health', { timeout: 5000 });
      return { status: response.ok ? 'ok' : 'error' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async checkWebSocket() {
    // Check if WebSocket connection is alive
    return { status: 'ok' }; // Simplified
  }

  checkLocalStorage() {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  async checkServiceWorker() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      return { status: registration ? 'ok' : 'not-registered' };
    }
    return { status: 'not-supported' };
  }

  render() {
    return null;
  }
}
```

## Conclusion

Deploying a LARC application is refreshingly simple. No complex build pipelines. No Docker orchestration. No Kubernetes manifests that would make a Vogon poet proud. Just clean, modern JavaScript that runs anywhere.

But simplicity doesn't mean carelessness. Monitor your app. Cache intelligently. Track errors. Use feature flags. Version carefully. And always have a rollback plan.

Your LARC application is now live, serving real users, solving real problems. You've built something with vanilla JavaScript that's faster, simpler, and more maintainable than most framework-heavy applications. That's worth celebrating.

Now go forth and deploy. And when something breaks (it will), you'll have the tools to fix it quickly. That's the LARC way.

**Congratulations—you've completed Building with LARC: A Reference Manual!**
