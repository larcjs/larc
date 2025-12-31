# Deployment

Deploying LARC applications is refreshingly simple. No build artifacts to manage, no complex CI/CD pipelines required. Just static files that any web server can handle.

## Static Hosting Options

LARC apps are static files. Host them anywhere:

### GitHub Pages

Free hosting for public repositories:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./public
```

### Netlify

Drag and drop deployment or connect to Git:

```toml
# netlify.toml
[build]
  publish = "public"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Vercel

Zero-config deployment:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## CDN Configuration

Serve assets from a CDN for faster global delivery:

```html
<!-- Use CDN for LARC core -->
<script type="importmap">
{
  "imports": {
    "@aspect/pan-client": "https://cdn.jsdelivr.net/npm/@aspect/pan-client@latest/pan-client.mjs"
  }
}
</script>
```

Set proper cache headers:

```
# .htaccess for Apache
<IfModule mod_expires.c>
  ExpiresActive On

  # HTML - no cache (or short cache)
  ExpiresByType text/html "access plus 0 seconds"

  # CSS and JS - long cache (use versioned filenames)
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"

  # Images - long cache
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
```

## Environment Variables

Manage configuration across environments:

```javascript
// config.js
const configs = {
  development: {
    apiUrl: 'http://localhost:3000/api',
    debug: true
  },
  production: {
    apiUrl: 'https://api.example.com',
    debug: false
  }
};

const env = window.location.hostname === 'localhost' ? 'development' : 'production';
export const config = configs[env];
```

Or use a build-time approach:

```html
<!-- Injected by server/build -->
<script>
  window.CONFIG = {
    apiUrl: '%%API_URL%%',
    version: '%%VERSION%%'
  };
</script>
```

## Pre-Deployment Checklist

Before deploying to production:

- [ ] Test in all target browsers
- [ ] Verify all API endpoints use HTTPS
- [ ] Check for console errors
- [ ] Validate accessibility (keyboard navigation, screen readers)
- [ ] Test on slow network (Chrome DevTools throttling)
- [ ] Verify error handling works
- [ ] Check mobile responsiveness
- [ ] Set up error monitoring (Sentry, LogRocket)
- [ ] Configure analytics
- [ ] Enable HTTPS
- [ ] Set security headers

## Monitoring

Track errors in production:

```javascript
// error-tracking.js
window.addEventListener('error', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      stack: event.error?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
});

window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      userAgent: navigator.userAgent,
      url: window.location.href
    })
  });
});
```

## Netlify Deployment Walkthrough

Let's deploy a LARC app to Netlify step-by-step:

**1. Prepare your project:**

```bash
# Project structure
my-larc-app/
├── public/
│   ├── index.html
│   ├── app.js
│   ├── components/
│   └── styles/
├── netlify.toml
└── package.json
```

**2. Create `netlify.toml`:**

```toml
[build]
  publish = "public"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*.js"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/*.css"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"

[[headers]]
  for = "/index.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

**3. Deploy via Netlify CLI:**

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Initialize site
netlify init

# Deploy
netlify deploy --prod
```

**4. Set environment variables:**

```bash
# Via CLI
netlify env:set API_URL "https://api.example.com"
netlify env:set SENTRY_DSN "https://..."

# Or in Netlify UI: Site Settings → Environment Variables
```

**5. Access in your app:**

```javascript
// Access Netlify environment variables
const config = {
  apiUrl: window.ENV?.API_URL || 'http://localhost:3000',
  sentryDsn: window.ENV?.SENTRY_DSN
};
```

## Vercel Deployment Walkthrough

Deploy to Vercel with zero configuration:

**1. Install Vercel CLI:**

```bash
npm install -g vercel
```

**2. Create `vercel.json`:**

```json
{
  "version": 2,
  "builds": [
    {
      "src": "public/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    },
    {
      "src": "/.*",
      "dest": "/public/index.html"
    }
  ],
  "headers": [
    {
      "source": "/public/(.*\\.js|.*\\.css)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "API_URL": "@api-url",
    "NODE_ENV": "production"
  }
}
```

**3. Deploy:**

```bash
# First deployment
vercel

# Production deployment
vercel --prod

# Set secrets
vercel secrets add api-url "https://api.example.com"
```

**4. Configure custom domain:**

```bash
vercel domains add www.example.com
vercel alias deployment-url.vercel.app www.example.com
```

## GitHub Pages Deployment

Deploy directly from your GitHub repository:

**1. Create GitHub Actions workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: true

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './public'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**2. Configure repository:**

1. Go to Settings → Pages
2. Source: "GitHub Actions"
3. Your site will be available at `https://username.github.io/repo-name/`

**3. Handle base path:**

```javascript
// config.js - Handle GitHub Pages subdirectory
const basePath = window.location.pathname.includes('repo-name')
  ? '/repo-name'
  : '';

export const config = {
  basePath,
  apiUrl: `${basePath}/api`
};

// Use in router
pan.publish('router.navigate', {
  path: `${config.basePath}/about`
});
```

## CI/CD Pipeline Example

Complete GitHub Actions workflow with testing and deployment:

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '18'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run linter
        run: npm run lint

      - name: Run tests
        run: npm test

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Create build info
        run: |
          echo "Build: ${{ github.sha }}" > public/build.txt
          echo "Date: $(date)" >> public/build.txt

      - name: Upload build artifact
        uses: actions/upload-artifact@v3
        with:
          name: public
          path: public/

  deploy-staging:
    needs: build
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    environment:
      name: staging
      url: https://staging.example.com
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: public
          path: public/

      - name: Deploy to staging
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_STAGING_SITE_ID }}
        with:
          args: deploy --dir=public --prod

  deploy-production:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://example.com
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v3
        with:
          name: public
          path: public/

      - name: Deploy to production
        uses: netlify/actions/cli@master
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_PROD_SITE_ID }}
        with:
          args: deploy --dir=public --prod

      - name: Notify deployment
        run: |
          curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ Deployed to production: ${{ github.sha }}"}'
```

## Docker Deployment

Package your app with Nginx for containerized deployment:

**Dockerfile:**

```dockerfile
# Use Nginx as base
FROM nginx:alpine

# Copy app files
COPY public/ /usr/share/nginx/html/

# Copy custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header X-XSS-Protection "1; mode=block" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_types text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  # Cache static assets
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # No cache for HTML
  location ~* \.html$ {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Health check endpoint
  location /health {
    access_log off;
    return 200 "healthy\n";
    add_header Content-Type text/plain;
  }
}
```

**Build and run:**

```bash
# Build image
docker build -t my-larc-app:latest .

# Run locally
docker run -p 8080:80 my-larc-app:latest

# Push to registry
docker tag my-larc-app:latest registry.example.com/my-larc-app:latest
docker push registry.example.com/my-larc-app:latest

# Deploy with docker-compose
cat > docker-compose.yml << EOF
version: '3.8'
services:
  app:
    image: my-larc-app:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
EOF

docker-compose up -d
```

## Security Headers

Protect your app with proper HTTP headers:

```javascript
// For Netlify (_headers file)
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.example.com

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate
```

Test security headers:

```bash
curl -I https://your-site.com | grep -E "X-Frame-Options|X-Content-Type"
```

Or use online tools:
- https://securityheaders.com
- https://observatory.mozilla.org

## Performance Optimization for Production

**1. Enable compression:**

```nginx
# Nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css text/xml text/javascript
           application/x-javascript application/xml+rss
           application/javascript application/json image/svg+xml;
```

**2. Set cache headers:**

```javascript
// For Cloudflare Workers
export default {
  async fetch(request) {
    const url = new URL(request.url);
    const response = await fetch(request);

    // Clone response so we can modify headers
    const newResponse = new Response(response.body, response);

    if (url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff2?)$/)) {
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (url.pathname.endsWith('.html')) {
      newResponse.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return newResponse;
  }
};
```

**3. Preload critical resources:**

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Preload critical resources -->
  <link rel="preload" href="/app.js" as="script">
  <link rel="preload" href="/styles/main.css" as="style">

  <!-- Preconnect to external domains -->
  <link rel="preconnect" href="https://api.example.com">
  <link rel="preconnect" href="https://cdn.jsdelivr.net">

  <!-- DNS prefetch for third-party domains -->
  <link rel="dns-prefetch" href="https://analytics.example.com">
</head>
</html>
```

## Rollback Strategies

Prepare for when deployments go wrong:

**1. Keep previous versions:**

```bash
# With Netlify CLI
netlify deploy --prod  # Deploys new version

# Rollback to previous deploy
netlify rollback

# Or via UI: Deploys tab → Click on previous deploy → "Publish deploy"
```

**2. Blue-green deployment:**

```yaml
# Deploy to staging (green), then swap with production (blue)
name: Blue-Green Deployment

on:
  workflow_dispatch:

jobs:
  deploy-green:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to green environment
        run: |
          netlify deploy --site=${{ secrets.GREEN_SITE_ID }} --prod

      - name: Run smoke tests
        run: npm run test:smoke -- --url=https://green.example.com

      - name: Swap blue and green
        if: success()
        run: |
          # Update DNS or load balancer to point to green
          # This is provider-specific
          echo "Swapping environments..."
```

**3. Feature flags for gradual rollout:**

```javascript
// feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = {};
    this.loadFlags();
  }

  async loadFlags() {
    try {
      const response = await fetch('/api/feature-flags');
      this.flags = await response.json();
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  isEnabled(feature, userId = null) {
    const flag = this.flags[feature];
    if (!flag) return false;

    // Global enable/disable
    if (flag.enabled === false) return false;

    // Percentage rollout
    if (flag.percentage && userId) {
      const hash = this.hashUserId(userId);
      return (hash % 100) < flag.percentage;
    }

    // Whitelist
    if (flag.whitelist && userId) {
      return flag.whitelist.includes(userId);
    }

    return flag.enabled;
  }

  hashUserId(userId) {
    // Simple hash for percentage rollout
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash) + userId.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }
}

export const featureFlags = new FeatureFlags();

// Usage
if (featureFlags.isEnabled('new-dashboard', user.id)) {
  await import('./components/new-dashboard.js');
} else {
  await import('./components/old-dashboard.js');
}
```

## Complete Deployment Example

Let's deploy a complete app with monitoring and error tracking:

**1. Project structure:**

```
my-app/
├── public/
│   ├── index.html
│   ├── app.js
│   ├── config.js
│   └── components/
├── scripts/
│   └── deploy.sh
├── .github/workflows/
│   └── deploy.yml
├── netlify.toml
└── package.json
```

**2. Environment-aware config:**

```javascript
// public/config.js
const environments = {
  local: {
    apiUrl: 'http://localhost:3000',
    sentryDsn: null,
    analytics: null
  },
  staging: {
    apiUrl: 'https://staging-api.example.com',
    sentryDsn: 'https://...@sentry.io/staging',
    analytics: 'UA-STAGING'
  },
  production: {
    apiUrl: 'https://api.example.com',
    sentryDsn: 'https://...@sentry.io/prod',
    analytics: 'UA-PROD'
  }
};

function detectEnvironment() {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'local';
  }
  if (hostname.includes('staging')) {
    return 'staging';
  }
  return 'production';
}

export const config = environments[detectEnvironment()];
```

**3. Error tracking setup:**

```javascript
// public/monitoring.js
import { config } from './config.js';

class ErrorTracker {
  constructor() {
    if (config.sentryDsn) {
      this.initSentry();
    }
    this.setupErrorHandlers();
  }

  async initSentry() {
    const Sentry = await import('https://cdn.jsdelivr.net/npm/@sentry/browser@7/+esm');

    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.environment,
      beforeSend(event) {
        // Filter out noise
        if (event.message?.includes('ResizeObserver')) {
          return null;
        }
        return event;
      }
    });
  }

  setupErrorHandlers() {
    window.addEventListener('error', (event) => {
      this.captureError(event.error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'unhandledrejection'
      });
    });
  }

  captureError(error, context = {}) {
    console.error('Error captured:', error, context);

    // Send to your error tracking service
    if (config.sentryDsn && window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    }
  }
}

export const errorTracker = new ErrorTracker();
```

**4. Deployment script:**

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENV=${1:-staging}

echo "🚀 Deploying to $ENV..."

# Run tests
echo "🧪 Running tests..."
npm test

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo "❌ Uncommitted changes detected. Commit or stash them first."
  exit 1
fi

# Get current version
VERSION=$(git rev-parse --short HEAD)
echo "📦 Version: $VERSION"

# Create build info
cat > public/build-info.json << EOF
{
  "version": "$VERSION",
  "environment": "$ENV",
  "buildDate": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "branch": "$(git rev-parse --abbrev-ref HEAD)"
}
EOF

# Deploy based on environment
if [ "$ENV" = "production" ]; then
  echo "🌍 Deploying to production..."
  netlify deploy --prod --site=$NETLIFY_PROD_SITE_ID
elif [ "$ENV" = "staging" ]; then
  echo "🔧 Deploying to staging..."
  netlify deploy --prod --site=$NETLIFY_STAGING_SITE_ID
fi

echo "✅ Deployment complete!"
echo "🔗 Check deployment: https://$ENV.example.com"
```

## Troubleshooting Deployment Issues

### Problem 1: 404 on Refresh (SPA Routing)

**Symptoms**: Navigating directly to `/about` returns 404, but clicking links works.

**Cause**: Server doesn't know about client-side routes.

**Solution**:

```toml
# netlify.toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

# vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}

# Apache .htaccess
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### Problem 2: CORS Errors in Production

**Symptoms**: API calls work locally but fail in production with CORS errors.

**Cause**: API server not configured to allow your production domain.

**Solution**:

```javascript
// Backend CORS configuration
app.use(cors({
  origin: [
    'https://example.com',
    'https://www.example.com',
    'https://staging.example.com'
  ],
  credentials: true
}));

// Or use environment variable
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true
}));
```

**Alternative**: Use a proxy in your deployment config:

```toml
# netlify.toml
[[redirects]]
  from = "/api/*"
  to = "https://api.example.com/:splat"
  status = 200
  force = true
```

### Problem 3: Environment Variables Not Working

**Symptoms**: App can't read environment variables, falls back to defaults.

**Cause**: Build-time vs. runtime configuration confusion.

**Solution**:

For runtime configuration, inject variables into HTML:

```html
<!-- Injected by build process or server -->
<script>
  window.ENV = {
    API_URL: "%%API_URL%%",
    SENTRY_DSN: "%%SENTRY_DSN%%"
  };
</script>
```

Or load from a config endpoint:

```javascript
async function loadConfig() {
  try {
    const response = await fetch('/config.json');
    return await response.json();
  } catch (error) {
    console.error('Failed to load config:', error);
    return {
      apiUrl: 'http://localhost:3000',
      // fallback values
    };
  }
}

export const config = await loadConfig();
```

### Problem 4: Slow Initial Load

**Symptoms**: First visit takes several seconds to show content.

**Diagnosis**:

```javascript
// Add timing to index.html
<script>
  window.perfMetrics = {
    navigationStart: performance.timing.navigationStart,
    fetchStart: performance.timing.fetchStart,
    domainLookupEnd: performance.timing.domainLookupEnd,
    connectEnd: performance.timing.connectEnd,
    responseEnd: performance.timing.responseEnd,
    domContentLoadedEventEnd: performance.timing.domContentLoadedEventEnd,
    loadEventEnd: performance.timing.loadEventEnd
  };

  window.addEventListener('load', () => {
    const metrics = window.perfMetrics;
    console.log('DNS lookup:', metrics.domainLookupEnd - metrics.fetchStart);
    console.log('TCP connection:', metrics.connectEnd - metrics.domainLookupEnd);
    console.log('Response time:', metrics.responseEnd - metrics.connectEnd);
    console.log('DOM processing:', metrics.domContentLoadedEventEnd - metrics.responseEnd);
    console.log('Total load time:', metrics.loadEventEnd - metrics.navigationStart);
  });
</script>
```

**Solutions**:
- Enable compression (gzip/brotli)
- Use CDN for static assets
- Preload critical resources
- Lazy load non-critical components
- Optimize images
- Minify JavaScript and CSS

## Deployment Best Practices

1. **Automate Everything**: Use CI/CD pipelines for consistent, reliable deployments.

2. **Test Before Deploying**: Run linters, unit tests, and E2E tests in your pipeline.

3. **Use Staging Environments**: Test production builds in a staging environment first.

4. **Monitor Deployments**: Track errors, performance, and user behavior after each deploy.

5. **Enable Rollbacks**: Keep previous versions and be ready to rollback quickly.

6. **Version Your Releases**: Tag releases in Git and track which version is deployed where.

7. **Secure Your Secrets**: Never commit API keys or secrets. Use environment variables or secret managers.

8. **Set Cache Headers Properly**: Long cache for assets (with versioned filenames), no cache for HTML.

9. **Use Health Checks**: Implement `/health` endpoints to verify deployments succeeded.

10. **Document Your Process**: Maintain runbooks for common deployment scenarios and troubleshooting.

## Hands-On Exercises

### Exercise 1: Deploy to Netlify

Deploy your LARC app to Netlify:
- Set up a free Netlify account
- Connect your Git repository
- Configure build settings and environment variables
- Set up a custom domain (or use Netlify subdomain)
- Configure security headers

**Bonus**: Set up preview deployments for pull requests.

### Exercise 2: Create a CI/CD Pipeline

Build a complete GitHub Actions workflow that:
- Runs tests on every push
- Deploys to staging on merge to `develop`
- Deploys to production on merge to `main`
- Sends notifications on deployment success/failure

**Bonus**: Add automated performance testing with Lighthouse CI.

### Exercise 3: Implement Feature Flags

Create a feature flag system that:
- Loads flags from a remote config
- Supports percentage-based rollouts
- Allows user whitelisting
- Caches flags locally
- Has a UI to toggle features

**Bonus**: Add A/B testing with analytics integration.

### Exercise 4: Set Up Error Tracking

Implement production error tracking:
- Integrate Sentry or similar service
- Capture unhandled errors and promise rejections
- Track custom errors with context
- Filter out noise (ResizeObserver, etc.)
- Set up alerts for critical errors

**Bonus**: Add user session replay for debugging.

## Summary

Deploying LARC applications is straightforward—no build process means fewer things to go wrong. Key takeaways:

- **Static hosting is simple**: Use Netlify, Vercel, GitHub Pages, or any static host
- **Automate with CI/CD**: Let GitHub Actions handle testing and deployment
- **Security matters**: Set proper headers, use HTTPS, configure CSP
- **Monitor production**: Track errors, performance, and user experience
- **Be ready to rollback**: Keep previous versions and have a rollback plan

Start with simple deployments and add sophistication as needed. The beauty of LARC's no-build approach is that deployment remains simple even as your app grows.

## Further Reading

- **Building with LARC - Chapter 18 (Deployment)**: Advanced deployment patterns and strategies
- **Building with LARC - Chapter 19 (Performance)**: Production optimization techniques
- **Building with LARC - Chapter 11 (Best Practices)**: Security and reliability patterns
