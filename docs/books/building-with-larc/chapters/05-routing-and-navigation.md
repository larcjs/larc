# Routing and Navigation

Quick reference for client-side routing with LARC's `pan-routes` component. For detailed tutorials, see *Learning LARC* Chapter 9.

## Overview

Client-side routing updates the URL and renders components without full page reloads. LARC's `pan-routes` component matches URL patterns to components, enabling seamless navigation experiences.

**Key Concepts**:
- Route patterns: Map URLs to components
- Dynamic parameters: Extract values from URLs (`:id`, `:username`)
- Navigation guards: Control access to routes
- Deep linking: Encode application state in URLs
- History management: Push vs. replace navigation

## Quick Example

```html
<pan-app>
  <pan-routes>
    <pan-route path="/" component="home-view"></pan-route>
    <pan-route path="/products" component="product-list"></pan-route>
    <pan-route path="/products/:id" component="product-detail"></pan-route>
    <pan-route path="*" component="not-found-view"></pan-route>
  </pan-routes>
</pan-app>
```

```javascript
class ProductDetail extends LarcComponent {
  onRoute(params) {
    // params.id extracted from URL
    this.loadProduct(params.id);
  }

  async loadProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    this.product = await response.json();
    this.render();
  }
}
```

## Route Patterns

### Route Matching Order

Routes evaluate **top to bottom**. Place specific routes before general ones:

| Priority | Pattern | Description |
|----------|---------|-------------|
| 1 | `/login` | Exact static paths first |
| 2 | `/products/new` | Static before dynamic |
| 3 | `/products/:id` | Dynamic parameters |
| 4 | `/admin/:section` | General patterns |
| 5 | `*` | Catch-all (404) last |

### Dynamic Parameters

| Pattern | Example URL | Extracted Params |
|---------|-------------|------------------|
| `/products/:id` | `/products/123` | `{ id: '123' }` |
| `/users/:username` | `/users/alice` | `{ username: 'alice' }` |
| `/posts/:year/:month/:slug` | `/posts/2024/12/hello` | `{ year: '2024', month: '12', slug: 'hello' }` |
| `/store/:category/:subcategory/:id` | `/store/electronics/phones/456` | `{ category: 'electronics', subcategory: 'phones', id: '456' }` |

### Nested Routes

Use wildcard suffix (`*`) for nested route sections:

```html
<pan-routes>
  <pan-route path="/" component="home-view"></pan-route>
  <pan-route path="/products*" component="product-section"></pan-route>
  <pan-route path="/admin*" component="admin-section"></pan-route>
</pan-routes>
```

Product section contains its own sub-routes:

```javascript
class ProductSection extends LarcComponent {
  template() {
    return `
      <div class="product-section">
        <nav class="sidebar">...</nav>
        <main>
          <pan-routes>
            <pan-route path="/products" component="product-list"></pan-route>
            <pan-route path="/products/new" component="product-form"></pan-route>
            <pan-route path="/products/:id" component="product-detail"></pan-route>
          </pan-routes>
        </main>
      </div>
    `;
  }
}
```

## Programmatic Navigation

### navigate() Function

```javascript
import { navigate } from '@larc/core';

// Basic navigation
navigate('/products/123');

// Replace current history entry (don't add to back button)
navigate('/login', { replace: true });

// Navigate back/forward
navigate(-1);  // Back one page
navigate(1);   // Forward one page
navigate(-2);  // Back two pages

// Navigation after form submission
async handleLogin(event) {
  event.preventDefault();
  const response = await fetch('/api/login', { /*...*/ });
  
  if (response.ok) {
    navigate('/dashboard');
  } else {
    this.showError('Invalid credentials');
  }
}
```

### When to Use Replace

| Scenario | Use Replace |
|----------|-------------|
| Login redirects | Yes - Skip intermediate loading pages |
| Fixing invalid URLs | Yes - User shouldn't return to bad URL |
| Multi-step wizards | No - Allow back navigation between steps |
| Normal navigation | No - Default push behavior |

## Navigation Guards

Control access to routes based on authentication, roles, or state.

### Auth Guard Pattern

```javascript
class AuthGuard {
  constructor() {
    this.user = null;
    this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) this.user = JSON.parse(stored);
  }

  canActivate(route) {
    if (!this.user) {
      navigate('/login?redirect=' + encodeURIComponent(route.path));
      return false;
    }
    return true;
  }

  requiresRole(role) {
    return this.user && this.user.roles.includes(role);
  }
}

const authGuard = new AuthGuard();
```

### Component Guard Hooks

```javascript
class DashboardView extends LarcComponent {
  beforeRoute(params) {
    if (!authGuard.canActivate(this.route)) {
      return false; // Cancel navigation
    }
    return true; // Allow navigation
  }

  onRoute(params) {
    this.loadDashboardData();
  }
}

class AdminPanel extends LarcComponent {
  beforeRoute(params) {
    if (!authGuard.requiresRole('admin')) {
      navigate('/unauthorized');
      return false;
    }
    return true;
  }
}

class PostEditor extends LarcComponent {
  beforeRouteLeave(to, from) {
    if (this.isDirty) {
      return confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  }
}
```

## Query Parameters and Deep Linking

Encode filters, search, pagination in URLs for bookmarkable state.

```javascript
class ProductList extends LarcComponent {
  onRoute(params, query) {
    const {
      category = 'all',
      sort = 'name',
      page = 1,
      search = ''
    } = query;

    this.loadProducts({ category, sort, page, search });
  }

  handleFilterChange(category) {
    const currentQuery = this.getQueryParams();
    navigate(`/products?${new URLSearchParams({
      ...currentQuery,
      category,
      page: 1
    })}`);
  }

  getQueryParams() {
    return Object.fromEntries(
      new URLSearchParams(window.location.search)
    );
  }
}
```

## Hash Fragments

Use for section scrolling and anchors:

```javascript
class DocumentationView extends LarcComponent {
  afterRender() {
    const hash = window.location.hash;
    if (hash) {
      const element = this.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }

  template() {
    return `
      <article>
        <h1 id="introduction">Introduction</h1>
        <p>Content...</p>
        
        <h2 id="getting-started">Getting Started</h2>
        <p>More content...</p>
        
        <nav>
          <a href="#introduction">Introduction</a>
          <a href="#getting-started">Getting Started</a>
        </nav>
      </article>
    `;
  }
}
```

## History Management

### Push vs. Replace

```javascript
// Push (default): Adds to history, back button works
navigate('/products/123');

// Replace: Replaces current entry, skips this page on back
navigate('/login', { replace: true });
```

### Scroll Position Preservation

```javascript
class ScrollManager {
  constructor() {
    this.positions = new Map();
    this.setupListeners();
  }

  setupListeners() {
    window.addEventListener('beforeunload', () => {
      this.savePosition(window.location.pathname);
    });

    window.addEventListener('load', () => {
      this.restorePosition(window.location.pathname);
    });
  }

  savePosition(path) {
    this.positions.set(path, {
      x: window.scrollX,
      y: window.scrollY
    });
  }

  restorePosition(path) {
    const position = this.positions.get(path);
    if (position) {
      window.scrollTo(position.x, position.y);
    } else {
      window.scrollTo(0, 0);
    }
  }
}
```

### History Event Listener

```javascript
window.addEventListener('popstate', (event) => {
  // User clicked back/forward button
  this.handleNavigation(event.state);
});
```

## Active Link States

Highlight current route in navigation:

```javascript
class NavBar extends LarcComponent {
  constructor() {
    super();
    this.currentPath = window.location.pathname;

    window.addEventListener('popstate', () => {
      this.currentPath = window.location.pathname;
      this.render();
    });
  }

  isActive(path) {
    return this.currentPath === path;
  }

  isActivePrefix(prefix) {
    return this.currentPath.startsWith(prefix);
  }

  template() {
    return `
      <nav>
        <a href="/" class="${this.isActive('/') ? 'active' : ''}">Home</a>
        <a href="/products" class="${this.isActivePrefix('/products') ? 'active' : ''}">Products</a>
        <a href="/about" class="${this.isActive('/about') ? 'active' : ''}">About</a>
      </nav>
    `;
  }
}
```

## SEO Considerations

### Update Meta Tags on Route Change

```javascript
class SEOManager {
  updateMeta(route, data) {
    document.title = data.title || 'Default Title';
    this.setMetaTag('description', data.description || '');
    this.setMetaTag('og:title', data.title);
    this.setMetaTag('og:description', data.description);
    this.setMetaTag('og:url', window.location.href);
    this.setLinkTag('canonical', window.location.href);
  }

  setMetaTag(name, content) {
    let element = document.querySelector(`meta[name="${name}"]`) ||
                  document.querySelector(`meta[property="${name}"]`);

    if (!element) {
      element = document.createElement('meta');
      const attr = name.startsWith('og:') ? 'property' : 'name';
      element.setAttribute(attr, name);
      document.head.appendChild(element);
    }

    element.setAttribute('content', content);
  }

  setLinkTag(rel, href) {
    let element = document.querySelector(`link[rel="${rel}"]`);
    if (!element) {
      element = document.createElement('link');
      element.setAttribute('rel', rel);
      document.head.appendChild(element);
    }
    element.setAttribute('href', href);
  }
}

const seoManager = new SEOManager();

class ProductDetail extends LarcComponent {
  async onRoute(params) {
    const product = await this.loadProduct(params.id);
    
    seoManager.updateMeta(this.route, {
      title: `${product.name} - Our Store`,
      description: product.description,
      image: product.imageUrl
    });
  }
}
```

### SSR and Prerendering

For maximum SEO, consider:
- **Server-side rendering (SSR)**: Render initial HTML on server
- **Static prerendering**: Generate HTML at build time for static routes
- **Dynamic rendering**: Serve prerendered HTML to crawlers, SPA to users

See Appendix C (Deployment) for SSR and prerendering strategies.

## Component Reference

See Chapter 18 for pan-routes API documentation and message patterns.

## Complete Example: E-commerce App Routing

```javascript
import { LarcComponent, navigate } from '@larc/core';

class MainApp extends LarcComponent {
  constructor() {
    super();
    this.authGuard = new AuthGuard();
    this.seoManager = new SEOManager();
    this.scrollManager = new ScrollManager();
    this.setupNavigation();
  }

  setupNavigation() {
    window.addEventListener('popstate', () => {
      this.render();
    });
  }

  template() {
    return `
      <div class="app">
        <app-header></app-header>
        <main>
          <pan-routes>
            <pan-route path="/" component="home-view"></pan-route>
            <pan-route path="/products" component="product-list"></pan-route>
            <pan-route path="/products/:id" component="product-detail"></pan-route>
            <pan-route path="/cart" component="shopping-cart"></pan-route>
            <pan-route path="/checkout" component="checkout-view"></pan-route>
            <pan-route path="/account*" component="account-section"></pan-route>
            <pan-route path="*" component="not-found-view"></pan-route>
          </pan-routes>
        </main>
        <app-footer></app-footer>
      </div>
    `;
  }
}

customElements.define('main-app', MainApp);
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 9 (Routing and Navigation)
- **Components**: Chapter 18 (pan-routes API)
- **Patterns**: Appendix E (Navigation Patterns)
- **Related**: Chapter 4 (State Management), Chapter 16 (Deployment/SEO)

## Common Issues

### Issue: Routes not matching
**Problem**: URL changes but component doesn't render
**Solution**: Check route order (specific before general), ensure pan-routes is in DOM

### Issue: Back button breaks app
**Problem**: Clicking back causes errors or blank page
**Solution**: Implement proper cleanup in `disconnectedCallback()`, save/restore scroll position

### Issue: Parameters not updating
**Problem**: Component doesn't re-render when URL params change
**Solution**: Implement `onRoute(params)` lifecycle hook to react to param changes

### Issue: SEO crawlers not indexing pages
**Problem**: Search engines see empty content
**Solution**: Implement SSR or prerendering, ensure meta tags update correctly

### Issue: Nested routes conflict
**Problem**: Child routes override parent routes
**Solution**: Use wildcard suffix (`*`) in parent route pattern, ensure child patterns are more specific

See *Learning LARC* Chapter 9 for detailed troubleshooting and advanced routing patterns.
