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
