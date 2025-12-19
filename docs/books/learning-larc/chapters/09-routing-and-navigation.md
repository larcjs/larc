# Routing and Navigation

Client-side routing enables single-page applications (SPAs) to feel like multi-page websites without full page reloads. LARC provides routing through web standards and the PAN bus, keeping things simple and framework-free.

## Client-Side Routing Basics

Client-side routing intercepts link clicks and updates the URL without reloading:

```javascript
// lib/router.js
class Router {
  constructor() {
    this.routes = new Map();
    this.currentRoute = null;

    // Intercept link clicks
    document.addEventListener('click', (e) => {
      if (e.target.matches('a[href^="/"]')) {
        e.preventDefault();
        this.navigate(e.target.getAttribute('href'));
      }
    });

    // Handle browser back/forward
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });
  }

  register(path, handler) {
    this.routes.set(path, handler);
  }

  navigate(path, state = {}) {
    window.history.pushState(state, '', path);
    this.handleRoute(path);

    // Publish navigation event
    pan.publish('router.navigated', { path, state });
  }

  handleRoute(path) {
    // Find matching route
    for (const [pattern, handler] of this.routes) {
      const params = this.matchRoute(pattern, path);
      if (params) {
        this.currentRoute = { path, pattern, params };
        handler(params);
        return;
      }
    }

    // 404 - no match
    pan.publish('router.not-found', { path });
  }

  matchRoute(pattern, path) {
    // Simple pattern matching
    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) {
      return null;
    }

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      if (patternPart.startsWith(':')) {
        // Dynamic segment
        params[patternPart.slice(1)] = pathPart;
      } else if (patternPart !== pathPart) {
        // Mismatch
        return null;
      }
    }

    return params;
  }

  start() {
    this.handleRoute(window.location.pathname);
  }
}

export const router = new Router();
```

**Usage:**

```javascript
import { router } from './lib/router.js';

// Register routes
router.register('/', () => {
  document.getElementById('app').innerHTML = '<home-page></home-page>';
});

router.register('/about', () => {
  document.getElementById('app').innerHTML = '<about-page></about-page>';
});

router.register('/users/:id', (params) => {
  const page = document.createElement('user-page');
  page.setAttribute('user-id', params.id);
  document.getElementById('app').innerHTML = '';
  document.getElementById('app').appendChild(page);
});

// Start router
router.start();
```

## The pan-router Component

LARC provides a declarative router component:

```html
<pan-router>
  <pan-route path="/" component="home-page"></pan-route>
  <pan-route path="/about" component="about-page"></pan-route>
  <pan-route path="/users/:id" component="user-page"></pan-route>
  <pan-route path="/posts/:postId/comments/:commentId" component="comment-page"></pan-route>
  <pan-route path="*" component="not-found-page"></pan-route>
</pan-router>
```

**Implementation:**

```javascript
class PanRouter extends HTMLElement {
  connectedCallback() {
    this.routes = Array.from(this.querySelectorAll('pan-route')).map(route => ({
      path: route.getAttribute('path'),
      component: route.getAttribute('component'),
      guard: route.getAttribute('guard')
    }));

    // Create outlet
    this.outlet = document.createElement('div');
    this.outlet.className = 'router-outlet';
    this.appendChild(this.outlet);

    // Listen for navigation
    pan.subscribe('router.navigate', ({ path, params }) => {
      this.navigate(path, params);
    });

    // Handle browser navigation
    window.addEventListener('popstate', () => {
      this.handleRoute(window.location.pathname);
    });

    // Intercept links
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href^="/"]');
      if (link) {
        e.preventDefault();
        this.navigate(link.getAttribute('href'));
      }
    });

    // Initial route
    this.handleRoute(window.location.pathname);
  }

  navigate(path, params = {}) {
    window.history.pushState(params, '', path);
    this.handleRoute(path);
  }

  async handleRoute(path) {
    // Find matching route
    for (const route of this.routes) {
      const params = this.matchRoute(route.path, path);

      if (params) {
        // Check route guard
        if (route.guard) {
          const canActivate = await this.runGuard(route.guard, params);
          if (!canActivate) {
            return;
          }
        }

        // Render component
        await this.renderComponent(route.component, params);
        return;
      }
    }

    // 404
    pan.publish('router.not-found', { path });
  }

  matchRoute(pattern, path) {
    if (pattern === '*') return {};

    const patternParts = pattern.split('/').filter(Boolean);
    const pathParts = path.split('/').filter(Boolean);

    if (patternParts.length !== pathParts.length) return null;

    const params = {};

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i].startsWith(':')) {
        params[patternParts[i].slice(1)] = pathParts[i];
      } else if (patternParts[i] !== pathParts[i]) {
        return null;
      }
    }

    return params;
  }

  async runGuard(guardName, params) {
    const result = await pan.request(`guard.${guardName}`, params);
    return result !== false;
  }

  async renderComponent(componentName, params) {
    // Wait for component to be defined
    await customElements.whenDefined(componentName);

    // Create component
    const component = document.createElement(componentName);

    // Pass route params
    Object.entries(params).forEach(([key, value]) => {
      component.setAttribute(key, value);
    });

    // Clear outlet and add component
    this.outlet.innerHTML = '';
    this.outlet.appendChild(component);

    // Publish route change
    pan.publish('router.changed', { component: componentName, params });
  }
}

customElements.define('pan-router', PanRouter);
customElements.define('pan-route', class extends HTMLElement {});
```

## Route Parameters

Access route parameters in components:

```javascript
class UserPage extends HTMLElement {
  static get observedAttributes() {
    return ['user-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id' && newValue) {
      this.loadUser(newValue);
    }
  }

  async loadUser(id) {
    const response = await fetch(`/api/users/${id}`);
    const user = await response.json();
    this.render(user);
  }

  render(user) {
    this.innerHTML = `
      <h1>${user.name}</h1>
      <p>${user.email}</p>
    `;
  }
}

customElements.define('user-page', UserPage);
```

## Route Guards

Protect routes with authentication checks:

```javascript
// Respond to auth guard
pan.respond('guard.auth', async () => {
  const token = localStorage.getItem('authToken');

  if (!token) {
    // Redirect to login
    pan.publish('router.navigate', { path: '/login' });
    return false;
  }

  // Verify token
  try {
    const response = await fetch('/api/auth/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    return response.ok;
  } catch {
    return false;
  }
});

// Respond to admin guard
pan.respond('guard.admin', async () => {
  const user = await pan.request('auth.user.get');
  return user?.role === 'admin';
});
```

**Usage:**

```html
<pan-router>
  <pan-route path="/login" component="login-page"></pan-route>
  <pan-route path="/dashboard" component="dashboard-page" guard="auth"></pan-route>
  <pan-route path="/admin" component="admin-page" guard="admin"></pan-route>
</pan-router>
```

## Nested Routes

Support hierarchical routing:

```html
<pan-router>
  <pan-route path="/settings" component="settings-layout">
    <pan-route path="/settings/profile" component="profile-settings"></pan-route>
    <pan-route path="/settings/security" component="security-settings"></pan-route>
    <pan-route path="/settings/billing" component="billing-settings"></pan-route>
  </pan-route>
</pan-router>
```

## Programmatic Navigation

Navigate from JavaScript:

```javascript
// Navigate to a path
pan.publish('router.navigate', { path: '/users/123' });

// Navigate with state
pan.publish('router.navigate', {
  path: '/search',
  state: { query: 'web components' }
});

// Go back
pan.publish('router.back');

// Go forward
pan.publish('router.forward');

// Replace current route (no history entry)
pan.publish('router.replace', { path: '/new-path' });
```

## Query Parameters

Parse and use query parameters:

```javascript
class SearchPage extends HTMLElement {
  connectedCallback() {
    // Parse query params
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q');
    const page = parseInt(params.get('page') || '1');

    this.performSearch(query, page);

    // Listen for query changes
    pan.subscribe('router.changed', () => {
      const params = new URLSearchParams(window.location.search);
      const newQuery = params.get('q');
      const newPage = parseInt(params.get('page') || '1');

      if (newQuery !== query || newPage !== page) {
        this.performSearch(newQuery, newPage);
      }
    });
  }

  performSearch(query, page) {
    // Search implementation
  }
}
```

**Update query params:**

```javascript
function updateQuery(params) {
  const url = new URL(window.location);

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  pan.publish('router.navigate', { path: url.pathname + url.search });
}

// Usage
updateQuery({ q: 'web components', page: '2' });
```

## Summary

LARC routing provides:

- Client-side navigation without page reloads
- Declarative route configuration
- Route parameters and guards
- Nested routing support
- Browser history integration
- PAN bus integration

---

## Best Practices

1. **Use declarative routing** - Prefer `<pan-router>` over imperative API
2. **Implement route guards** - Protect sensitive routes
3. **Handle 404s gracefully** - Always include catch-all route
4. **Preserve scroll position** - Restore scroll on back navigation
5. **Use query params for filters** - Makes URLs shareable
