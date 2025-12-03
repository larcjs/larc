# Chapters 11-19: Summary Outlines

## Chapter 11: Data Fetching and APIs

### Key Topics:

- **REST API Integration**: Using fetch() with proper error handling
- **GraphQL Support**: Query/mutation patterns with LARC
- **WebSocket Communication**: Real-time bi-directional communication
- **Server-Sent Events**: One-way server push for live updates
- **Caching Strategies**: Cache-first, network-first, stale-while-revalidate
- **Retry Logic**: Exponential backoff and circuit breakers

### Code Example - API Client:
```javascript
class ApiClient {
  async fetch(endpoint, options = {}) {
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) throw new Error(`API Error: ${response.status}`);
    return response.json();
  }

  async get(endpoint) {
    return this.fetch(endpoint);
  }

  async post(endpoint, data) {
    return this.fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

## Chapter 12: Authentication and Security

### Key Topics:

- **JWT Token Management**: Storing, refreshing, and validating tokens
- **The pan-auth Component**: Centralized authentication state
- **Protected Routes**: Route guards for authenticated pages
- **CORS Handling**: Cross-origin resource sharing configuration
- **XSS Prevention**: Sanitizing user input
- **CSRF Protection**: Token-based request validation

### Code Example - Auth Service:
```javascript
class AuthService {
  async login(credentials) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });

    const { token, user } = await response.json();

    localStorage.setItem('authToken', token);
    pan.publish('auth.login', { user });

    return { token, user };
  }

  async refresh() {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/auth/refresh', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const { token: newToken } = await response.json();
    localStorage.setItem('authToken', newToken);
  }

  logout() {
    localStorage.removeItem('authToken');
    pan.publish('auth.logout');
  }
}
```

## Chapter 13: Server Integration

### Key Topics:

- **Node.js/Express Backend**: RESTful API design for LARC
- **PHP Integration**: Connecting LARC to PHP backends
- **Python/Django**: Django REST framework integration
- **Database Patterns**: ORM usage and raw SQL
- **Real-Time**: WebSocket servers with Socket.io
- **File Serving**: Static assets and CDN integration

### Node.js Example:
```javascript
// server.js
const express = require('express');
const app = express();

app.use(express.json());
app.use(express.static('public'));

app.get('/api/users', async (req, res) => {
  const users = await db.users.findAll();
  res.json(users);
});

app.post('/api/users', async (req, res) => {
  const user = await db.users.create(req.body);
  res.json(user);
});

app.listen(3000);
```

## Chapter 14: Testing

### Key Topics:

- **Unit Testing**: Testing components in isolation with Web Test Runner
- **Integration Testing**: Testing component interactions
- **E2E Testing**: Playwright/Puppeteer for full user flows
- **Visual Regression**: Percy or BackstopJS for UI testing
- **Mocking**: Fetch mocks and PAN bus mocks
- **CI/CD**: GitHub Actions test automation

### Test Example:
```javascript
import { expect, fixture, html } from '@open-wc/testing';
import '../src/components/user-card.js';

describe('UserCard', () => {
  it('renders user data', async () => {
    const el = await fixture(html`
      <user-card .user=${{ name: 'John', email: 'john@example.com' }}>
      </user-card>
    `);

    expect(el.shadowRoot.querySelector('h2').textContent).to.equal('John');
    expect(el.shadowRoot.querySelector('.email').textContent).to.equal('john@example.com');
  });

  it('dispatches follow event on button click', async () => {
    const el = await fixture(html`<user-card></user-card>`);

    let eventData = null;
    el.addEventListener('follow', (e) => {
      eventData = e.detail;
    });

    el.shadowRoot.querySelector('button').click();

    expect(eventData).to.exist;
  });
});
```

## Chapter 15: Performance and Optimization

### Key Topics:

- **Code Splitting**: Dynamic imports for lazy loading
- **Tree Shaking**: Removing unused code
- **Lazy Loading**: Intersection Observer patterns
- **Image Optimization**: WebP, lazy loading, responsive images
- **Caching**: Service Worker caching strategies
- **Performance Monitoring**: Web Vitals and metrics

### Performance Patterns:
```javascript
// Lazy load on interaction
button.addEventListener('click', async () => {
  const { HeavyComponent } = await import('./heavy-component.js');
  // Use component
}, { once: true });

// Intersection Observer for images
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.src = entry.target.dataset.src;
      observer.unobserve(entry.target);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  observer.observe(img);
});
```

## Chapter 16: Deployment

### Key Topics:

- **Static Hosting**: Netlify, Vercel, GitHub Pages
- **CDN Configuration**: CloudFlare, AWS CloudFront
- **Environment Variables**: Managing config across environments
- **Build Scripts**: Optional production optimization
- **CI/CD Pipelines**: Automated deployment workflows
- **Monitoring**: Error tracking and analytics

### Deployment Checklist:

- [ ] Minify JavaScript (optional but recommended)
- [ ] Optimize images
- [ ] Set up CDN for assets
- [ ] Configure caching headers
- [ ] Enable HTTPS
- [ ] Set up error monitoring (Sentry)
- [ ] Configure analytics (Plausible, Fathom)
- [ ] Test in all target browsers
- [ ] Set up automated deployments

## Chapter 17: Component Library

### Key Topics:

- **Using the Registry**: Finding and installing components
- **Contributing Components**: Publishing to the registry
- **Component Quality**: Tests, types, documentation
- **Versioning**: Semantic versioning and changelogs
- **Documentation**: API docs and usage examples
- **Design Systems**: Building consistent component libraries

### Registry Integration:
```bash
# Install component from registry
larc add @larcjs/ui

# Publish component to registry
larc publish ./components/my-component.js
```

## Chapter 18: Tooling

### Key Topics:

- **LARC CLI**: create-larc-app, dev server, generators
- **VS Code Extension**: Snippets, IntelliSense, commands
- **Browser DevTools**: Debugging Web Components and Shadow DOM
- **Hot Module Reload**: Live updates without full refresh
- **Linting**: ESLint configuration for LARC
- **Formatting**: Prettier setup

### VS Code Snippets:
```json
{
  "LARC Component": {
    "prefix": "larc-component",
    "body": [
      "class ${1:ComponentName} extends HTMLElement {",
      "  constructor() {",
      "    super();",
      "    this.attachShadow({ mode: 'open' });",
      "  }",
      "  ",
      "  connectedCallback() {",
      "    this.render();",
      "  }",
      "  ",
      "  render() {",
      "    this.shadowRoot.innerHTML = \\`",
      "      <style>",
      "        :host { display: block; }",
      "      </style>",
      "      $2",
      "    \\`;",
      "  }",
      "}",
      "",
      "customElements.define('${3:component-name}', ${1:ComponentName});"
    ]
  }
}
```

## Chapter 19: Real-World Applications

### Case Study 1: E-Commerce Platform
**Features:**

- Product catalog with search and filters
- Shopping cart with persistence
- Checkout flow with payment integration
- User authentication and profiles
- Order history and tracking

**Architecture:**

- Components: product-card, cart-widget, checkout-form
- State: IndexedDB for cart, localStorage for preferences
- API: REST backend with Stripe integration
- Routing: /products, /cart, /checkout, /orders

### Case Study 2: Dashboard Application
**Features:**

- Real-time data visualization
- User permissions and roles
- Data export functionality
- Responsive layout
- Dark mode support

**Architecture:**

- Components: chart-widget, data-table, filter-bar
- State: Reactive store with WebSocket updates
- API: GraphQL for flexible queries
- Real-time: WebSocket for live updates

### Case Study 3: Blog/CMS
**Features:**

- Markdown editor
- Draft auto-save
- Media library
- SEO optimization
- Static site generation

**Architecture:**

- Components: markdown-editor, media-upload, post-list
- State: IndexedDB for drafts
- API: Headless CMS (Contentful/Strapi)
- Build: Optional SSG for production

### Lessons Learned:

1. Start simple, add complexity as needed
2. Use the PAN bus for cross-component communication
3. Implement offline-first for better UX
4. Test early and often
5. Profile before optimizing
6. Document your components
7. Use TypeScript for larger projects
8. Implement error boundaries
9. Monitor performance in production
10. Build progressively

---

# Appendices

## Appendix A: Web Components API Reference

### Custom Elements

- `customElements.define(name, constructor, options)`
- `customElements.get(name)`
- `customElements.whenDefined(name)`
- `customElements.upgrade(root)`

### Lifecycle Callbacks

- `constructor()`
- `connectedCallback()`
- `disconnectedCallback()`
- `attributeChangedCallback(name, oldValue, newValue)`
- `adoptedCallback()`

### Shadow DOM

- `element.attachShadow({ mode: 'open'|'closed' })`
- `element.shadowRoot`
- `slot.assignedNodes()`
- `slot.assignedElements()`

## Appendix B: PAN Bus API Reference

### Core Methods
```javascript
// Publish
pan.publish(topic, data)

// Subscribe
const unsubscribe = pan.subscribe(topic, handler)

// Request/Response
const result = await pan.request(topic, data, timeout)
pan.respond(topic, handler)

// Unsubscribe
unsubscribe()
```

### Topic Patterns

- `user.login` - Specific event
- `user.*` - All user events
- `*.error` - All error events
- `*` - All events (debugging)

## Appendix C: Component API Reference

### Built-in Components

**pan-store**
- Attributes: `persist`, `namespace`
- Methods: `getState()`, `setState(updates)`, `subscribe(path, handler)`
- Events: `state-changed`

**pan-router**
- Child: `<pan-route path="" component="" guard="">`
- Events: `router.navigated`, `router.not-found`
- PAN Topics: `router.navigate`, `router.back`, `router.forward`

**pan-fetch**
- Attributes: `url`, `method`, `auto`
- Properties: `data`, `loading`, `error`
- Events: `data-loaded`, `fetch-error`

**pan-auth**
- Methods: `login(credentials)`, `logout()`, `refresh()`
- Properties: `user`, `authenticated`
- Events: `auth-changed`

## Appendix D: Migration Guides

### From React

**Concepts:**

- JSX → Template literals
- Props → Attributes/properties
- State → Instance properties
- Context → PAN bus or Context API pattern
- Hooks → Lifecycle callbacks
- Redux → pan-store or custom store

**Example:**
```javascript
// React
function UserCard({ user }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div onClick={() => setExpanded(!expanded)}>
      <h2>{user.name}</h2>
      {expanded && <p>{user.bio}</p>}
    </div>
  );
}

// LARC
class UserCard extends HTMLElement {
  constructor() {
    super();
    this.expanded = false;
  }

  set user(value) {
    this._user = value;
    this.render();
  }

  connectedCallback() {
    this.addEventListener('click', () => {
      this.expanded = !this.expanded;
      this.render();
    });
    this.render();
  }

  render() {
    this.innerHTML = `
      <div>
        <h2>${this._user.name}</h2>
        ${this.expanded ? `<p>${this._user.bio}</p>` : ''}
      </div>
    `;
  }
}
```

### From Vue

**Concepts:**

- Templates → Template literals
- v-model → Two-way binding patterns
- Computed → Getters
- Watch → Observe patterns
- Vuex → pan-store

### From Angular

**Concepts:**

- Decorators → Static properties
- Dependency Injection → Constructor patterns
- Services → Modules
- RxJS → PAN bus observables
- NgRx → pan-store

## Appendix E: Resources

### Official Documentation

- LARC Docs: https://larcjs.com/docs
- Component Registry: https://components.larcjs.com
- GitHub: https://github.com/larcjs

### Web Standards

- MDN Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- Custom Elements Spec: https://html.spec.whatwg.org/multipage/custom-elements.html
- Shadow DOM Spec: https://dom.spec.whatwg.org/#shadow-trees

### Community

- Discord: https://discord.gg/larcjs
- Forum: https://forum.larcjs.com
- Twitter: @larcjs

### Learning Resources

- Web Components Tutorial: https://webcomponents.org
- ES Modules Guide: https://javascript.info/modules
- IndexedDB Tutorial: https://javascript.info/indexeddb

### Tools

- LARC CLI: https://www.npmjs.com/package/create-larc-app
- VS Code Extension: Search "LARC" in marketplace
- Component Analyzer: https://github.com/larcjs/analyzer

### Example Projects

- TodoMVC: https://github.com/larcjs/todomvc
- E-Commerce: https://github.com/larcjs/ecommerce-example
- Dashboard: https://github.com/larcjs/dashboard-example
