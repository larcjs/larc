# Routing and Navigation

*In which we learn to guide users through our applications without getting lost in the woods (or the browser's back button)*

Navigation is to web applications what hallways are to buildings: theoretically simple, but surprisingly easy to get wrong. You've probably experienced the horror of clicking the back button only to be ejected from the application entirely, or the confusion of bookmarking a URL that leads nowhere meaningful. LARC's routing system aims to prevent these digital disasters by making client-side navigation feel as natural as walking through a well-designed building.

In this chapter, we'll explore LARC's routing architecture, which leverages the `pan-routes` component to create seamless navigation experiences. We'll cover route definitions, pattern matching, navigation guards, deep linking, history management, and even touch on SEO considerations because, let's face it, even the most beautiful application is useless if no one can find it.

## Understanding Client-Side Routing

Before we dive into LARC's implementation, let's establish what client-side routing actually means. In the ancient days of the web (circa 2005), every navigation triggered a full page reload. Click a link, wait for the server, watch the screen flash white, and finally see your new content. It was like rebooting your computer every time you wanted to switch applications.

Client-side routing changes this paradigm. Instead of requesting new HTML from the server for each navigation, the JavaScript application intercepts link clicks, updates the URL, and renders the appropriate component—all without reloading the page. It's like having a building where rooms can instantly rearrange themselves rather than making you walk outside and back in through a different door.

LARC implements client-side routing through the `pan-routes` component, which acts as a traffic controller for your application's navigation. It watches for URL changes, matches them against defined route patterns, and renders the corresponding components.

## The pan-routes Component

The `pan-routes` component is your application's navigation hub. It sits in your main application component and declares all the routes your application recognizes. Here's a basic example:

```html
<pan-app id="app">
  <pan-routes>
    <pan-route path="/" component="home-view"></pan-route>
    <pan-route path="/about" component="about-view"></pan-route>
    <pan-route path="/products" component="product-list"></pan-route>
    <pan-route path="/products/:id" component="product-detail"></pan-route>
    <pan-route path="/user/:username" component="user-profile"></pan-route>
    <pan-route path="*" component="not-found-view"></pan-route>
  </pan-routes>
</pan-app>
```

Each `pan-route` element defines a mapping between a URL path and a component. When the URL matches a route's path, LARC renders the corresponding component. Think of it as a telephone switchboard operator from the 1950s, connecting callers to the right extension—except digital and without the period-appropriate hairstyle.

### Route Matching Order

Routes are evaluated in the order they're defined, which means specificity matters. The wildcard route (`path="*"`) should always come last, as it matches everything. If you put it first, your users will only ever see your 404 page, which is a bold design choice but probably not what you intended.

Here's a more realistic example showing route organization:

```html
<pan-routes>
  <!-- Exact matches first -->
  <pan-route path="/" component="home-view"></pan-route>
  <pan-route path="/login" component="login-view"></pan-route>
  <pan-route path="/logout" component="logout-view"></pan-route>

  <!-- Static paths before dynamic ones -->
  <pan-route path="/products/new" component="product-create"></pan-route>
  <pan-route path="/products/:id" component="product-detail"></pan-route>

  <!-- More specific patterns before general ones -->
  <pan-route path="/admin/users/:id" component="admin-user-detail"></pan-route>
  <pan-route path="/admin/:section" component="admin-section"></pan-route>

  <!-- Catch-all last -->
  <pan-route path="*" component="not-found-view"></pan-route>
</pan-routes>
```

## Route Parameters and Pattern Matching

Dynamic route parameters are where routing gets interesting. Instead of defining a separate route for every product, user, or blog post, you use parameter placeholders prefixed with a colon (`:parameter`). LARC extracts these values and makes them available to your components.

### Basic Parameters

The most common pattern is a single dynamic segment:

```html
<pan-route path="/products/:id" component="product-detail"></pan-route>
<pan-route path="/users/:username" component="user-profile"></pan-route>
<pan-route path="/posts/:year/:month/:slug" component="blog-post"></pan-route>
```

In your component, access these parameters through the route context:

```javascript
class ProductDetail extends LarcComponent {
  constructor() {
    super();
    this.product = null;
  }

  onRoute(params) {
    // params.id contains the value from the URL
    this.loadProduct(params.id);
  }

  async loadProduct(id) {
    const response = await fetch(`/api/products/${id}`);
    this.product = await response.json();
    this.render();
  }

  template() {
    if (!this.product) {
      return '<div>Loading...</div>';
    }

    return `
      <div class="product-detail">
        <h1>${this.product.name}</h1>
        <p>${this.product.description}</p>
        <span class="price">$${this.product.price}</span>
      </div>
    `;
  }
}
```

### Multiple Parameters

Routes can contain multiple parameters, which is useful for hierarchical data:

```html
<pan-route path="/store/:category/:subcategory/:productId"
           component="product-view"></pan-route>
```

```javascript
class ProductView extends LarcComponent {
  onRoute(params) {
    // params = { category: 'electronics', subcategory: 'phones', productId: '123' }
    this.loadProduct(params.category, params.subcategory, params.productId);
  }
}
```

### Optional Parameters

Sometimes you want a route to work with or without certain parameters. While LARC doesn't have built-in optional parameter syntax, you can achieve this with multiple route definitions:

```html
<pan-routes>
  <pan-route path="/blog/:year/:month/:day" component="blog-archive"></pan-route>
  <pan-route path="/blog/:year/:month" component="blog-archive"></pan-route>
  <pan-route path="/blog/:year" component="blog-archive"></pan-route>
  <pan-route path="/blog" component="blog-archive"></pan-route>
</pan-routes>
```

```javascript
class BlogArchive extends LarcComponent {
  onRoute(params) {
    const { year, month, day } = params;

    if (day) {
      this.loadPostsForDay(year, month, day);
    } else if (month) {
      this.loadPostsForMonth(year, month);
    } else if (year) {
      this.loadPostsForYear(year);
    } else {
      this.loadAllPosts();
    }
  }
}
```

## Programmatic Navigation

Clicking links is great, but sometimes you need to navigate programmatically—after form submissions, authentication changes, or when playing a game of "redirect the user until they give up and close the tab."

LARC provides the `navigate()` function for programmatic navigation:

```javascript
import { navigate } from '@larc/core';

class LoginForm extends LarcComponent {
  async handleLogin(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    const credentials = {
      username: formData.get('username'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        // Success! Navigate to dashboard
        navigate('/dashboard');
      } else {
        this.showError('Invalid credentials');
      }
    } catch (error) {
      this.showError('Network error');
    }
  }

  template() {
    return `
      <form onsubmit="this.handleLogin(event)">
        <input name="username" type="text" required>
        <input name="password" type="password" required>
        <button type="submit">Login</button>
      </form>
    `;
  }
}
```

### Navigation Options

The `navigate()` function accepts an options object for controlling navigation behavior:

```javascript
// Replace current history entry instead of pushing a new one
navigate('/login', { replace: true });

// Prevent navigation if user has unsaved changes
if (this.hasUnsavedChanges()) {
  const confirmed = confirm('You have unsaved changes. Leave anyway?');
  if (!confirmed) {
    return; // Don't navigate
  }
}
navigate('/other-page');

// Navigate back and forward
navigate(-1); // Go back
navigate(1);  // Go forward
navigate(-2); // Go back two pages
```

## Navigation Guards

Navigation guards are like bouncers at an exclusive club—they decide who gets in and who gets redirected to the login page. Guards let you intercept navigation attempts and redirect, cancel, or allow them based on application state.

### Implementing Auth Guards

A common use case is protecting routes that require authentication:

```javascript
class AuthGuard {
  constructor() {
    this.user = null;
    this.loadUserFromStorage();
  }

  loadUserFromStorage() {
    const stored = localStorage.getItem('user');
    if (stored) {
      this.user = JSON.parse(stored);
    }
  }

  canActivate(route) {
    if (!this.user) {
      // Not logged in, redirect to login
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

Now integrate this guard into your components:

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
```

### Route Transition Guards

Sometimes you need to prevent users from leaving a page—usually because they have unsaved changes and you're trying to save them from themselves:

```javascript
class PostEditor extends LarcComponent {
  constructor() {
    super();
    this.isDirty = false;
    this.originalContent = '';
  }

  beforeRouteLeave(to, from) {
    if (this.isDirty) {
      const answer = confirm(
        'You have unsaved changes. Are you sure you want to leave?'
      );
      return answer; // true = allow navigation, false = cancel
    }
    return true;
  }

  handleContentChange(event) {
    this.isDirty = event.target.value !== this.originalContent;
  }

  async handleSave() {
    await this.savePost();
    this.isDirty = false;
    this.originalContent = this.getEditorContent();
  }
}
```

## Deep Linking and URL State

Deep linking is the practice of encoding application state in the URL so users can bookmark, share, or return to specific states. It's the difference between sharing "myapp.com" and sharing "myapp.com/products?category=electronics&sort=price&page=3"—one is helpful, the other is a digital shrug.

### Query Parameters

Query parameters are perfect for filters, search terms, pagination, and other non-hierarchical state:

```javascript
class ProductList extends LarcComponent {
  onRoute(params, query) {
    // params from route pattern, query from ?key=value
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
      page: 1 // Reset to first page when filter changes
    })}`);
  }

  handleSortChange(sort) {
    const currentQuery = this.getQueryParams();
    navigate(`/products?${new URLSearchParams({
      ...currentQuery,
      sort
    })}`);
  }

  getQueryParams() {
    return Object.fromEntries(
      new URLSearchParams(window.location.search)
    );
  }
}
```

### Hash Fragments

Hash fragments (`#section-name`) are useful for scrolling to specific sections and maintaining scroll position:

```javascript
class DocumentationView extends LarcComponent {
  onRoute(params) {
    this.loadDocument(params.docId);
  }

  afterRender() {
    // Scroll to hash target if present
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
        <p>Content here...</p>

        <h2 id="getting-started">Getting Started</h2>
        <p>More content...</p>

        <nav class="table-of-contents">
          <a href="#introduction">Introduction</a>
          <a href="#getting-started">Getting Started</a>
        </nav>
      </article>
    `;
  }
}
```

## History Management

The browser's history API is like a time machine, but one that only goes to boring places like "the page you were just on." LARC wraps this API to make history management more pleasant.

### Push vs. Replace

When navigating, you can either push a new entry onto the history stack or replace the current entry:

```javascript
// Push new entry (default behavior)
// User can click back to return to previous page
navigate('/products/123');

// Replace current entry
// User clicks back and skips this page entirely
navigate('/login', { replace: true });
```

Replace is useful for:

- Redirect chains (login -> loading -> dashboard)
- Temporary states (splash screens, loading views)
- Fixing invalid URLs (redirect /old-path to /new-path)

### Listening to History Changes

Sometimes you need to react to back/forward button clicks:

```javascript
class App extends LarcComponent {
  constructor() {
    super();
    this.setupHistoryListener();
  }

  setupHistoryListener() {
    window.addEventListener('popstate', (event) => {
      // User clicked back or forward
      this.handleNavigation(event.state);
    });
  }

  handleNavigation(state) {
    // Restore application state from history state
    if (state && state.scrollPosition) {
      window.scrollTo(0, state.scrollPosition);
    }
  }

  saveScrollPosition() {
    history.replaceState({
      scrollPosition: window.scrollY
    }, '');
  }
}
```

### Preserving Scroll Position

Nothing frustrates users more than losing their scroll position when navigating. Here's a pattern for preserving it:

```javascript
class ScrollManager {
  constructor() {
    this.positions = new Map();
    this.setupListeners();
  }

  setupListeners() {
    // Save scroll position before navigating away
    window.addEventListener('beforeunload', () => {
      this.savePosition(window.location.pathname);
    });

    // Restore scroll position after navigation
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
      window.scrollTo(0, 0); // Default to top
    }
  }
}
```

## Nested Routes and Layouts

Real applications have hierarchical navigation structures. You might have a main layout with a header and sidebar, then nested views that change based on the route. LARC supports this through component composition:

```html
<pan-app id="app">
  <app-layout>
    <pan-routes>
      <pan-route path="/" component="home-view"></pan-route>
      <pan-route path="/products*" component="product-section"></pan-route>
      <pan-route path="/admin*" component="admin-section"></pan-route>
    </pan-routes>
  </app-layout>
</pan-app>
```

The `product-section` component contains its own nested routes:

```javascript
class ProductSection extends LarcComponent {
  template() {
    return `
      <div class="product-section">
        <nav class="sidebar">
          <a href="/products">All Products</a>
          <a href="/products/categories">Categories</a>
          <a href="/products/new">Add New</a>
        </nav>

        <main class="content">
          <pan-routes>
            <pan-route path="/products" component="product-list"></pan-route>
            <pan-route path="/products/categories" component="category-list"></pan-route>
            <pan-route path="/products/new" component="product-form"></pan-route>
            <pan-route path="/products/:id" component="product-detail"></pan-route>
          </pan-routes>
        </main>
      </div>
    `;
  }
}
```

## Link Handling and Active States

Navigation links should indicate which page is currently active. LARC provides utilities for this:

```javascript
class NavBar extends LarcComponent {
  constructor() {
    super();
    this.currentPath = window.location.pathname;

    // Update active state when route changes
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
      <nav class="navbar">
        <a href="/" class="${this.isActive('/') ? 'active' : ''}">
          Home
        </a>
        <a href="/products" class="${this.isActivePrefix('/products') ? 'active' : ''}">
          Products
        </a>
        <a href="/about" class="${this.isActive('/about') ? 'active' : ''}">
          About
        </a>
      </nav>
    `;
  }
}
```

## SEO Considerations

Client-side routing can be problematic for search engines if not handled properly. While modern search crawlers can execute JavaScript, it's still wise to follow best practices:

### Server-Side Rendering (SSR)

For maximum SEO, consider implementing server-side rendering:

```javascript
// server.js
import { renderToString } from '@larc/ssr';
import { App } from './app.js';

app.get('*', async (req, res) => {
  const html = await renderToString(App, {
    path: req.path,
    query: req.query
  });

  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${getTitle(req.path)}</title>
        <meta name="description" content="${getDescription(req.path)}">
      </head>
      <body>
        <div id="app">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});
```

### Meta Tags and Titles

Update document title and meta tags when routes change:

```javascript
class SEOManager {
  updateMeta(route, data) {
    // Update title
    document.title = data.title || 'Default Title';

    // Update description
    this.setMetaTag('description', data.description || '');

    // Update Open Graph tags for social sharing
    this.setMetaTag('og:title', data.title);
    this.setMetaTag('og:description', data.description);
    this.setMetaTag('og:url', window.location.href);

    // Update canonical URL
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

### Prerendering

For static content, consider prerendering routes at build time:

```javascript
// build-prerender.js
import { prerender } from '@larc/prerender';

const routes = [
  '/',
  '/about',
  '/products',
  '/contact'
];

async function buildPrerenderedPages() {
  for (const route of routes) {
    const html = await prerender(route);
    const filename = route === '/' ? 'index.html' : `${route}/index.html`;
    await fs.writeFile(`dist/${filename}`, html);
  }
}

buildPrerenderedPages();
```

## Putting It All Together

Let's create a complete example that demonstrates all these concepts:

```javascript
// app.js
import { LarcComponent, navigate } from '@larc/core';

class MainApp extends LarcComponent {
  constructor() {
    super();
    this.authGuard = new AuthGuard();
    this.seoManager = new SEOManager();
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
        <pan-routes>
          <pan-route path="/" component="home-view"></pan-route>
          <pan-route path="/products" component="product-list"></pan-route>
          <pan-route path="/products/:id" component="product-detail"></pan-route>
          <pan-route path="/cart" component="shopping-cart"></pan-route>
          <pan-route path="/checkout" component="checkout-view"></pan-route>
          <pan-route path="/account*" component="account-section"></pan-route>
          <pan-route path="*" component="not-found-view"></pan-route>
        </pan-routes>
        <app-footer></app-footer>
      </div>
    `;
  }
}

customElements.define('main-app', MainApp);
```

Routing in LARC transforms your application from a collection of disconnected pages into a cohesive, navigable experience. With proper route organization, parameter handling, navigation guards, and SEO considerations, you can build applications that feel responsive, intelligent, and easy to use—even when users inevitably click the back button seventeen times trying to find that one product they saw earlier.

In the next chapter, we'll tackle forms and user input, which is where users finally get to talk back to your application (and boy, do they have opinions).
