# Real-World Applications

Theory only takes you so far. Let's examine how LARC principles apply to real applications.

## Case Study: E-Commerce Platform

An online store built with LARC demonstrates the architecture at scale.

### Architecture Overview

```
store/
├── index.html
├── components/
│   ├── product-card.js
│   ├── product-grid.js
│   ├── shopping-cart.js
│   ├── cart-item.js
│   ├── checkout-form.js
│   └── order-confirmation.js
├── services/
│   ├── cart-service.js
│   ├── product-service.js
│   └── order-service.js
└── styles/
    └── main.css
```

### Product Catalog

The product grid loads data and renders cards:

```javascript
// product-grid.js
class ProductGrid extends HTMLElement {
  async connectedCallback() {
    this.innerHTML = '<p>Loading products...</p>';

    try {
      const products = await productService.getAll();
      this.render(products);
    } catch (error) {
      this.innerHTML = `<p class="error">Failed to load products</p>`;
    }
  }

  render(products) {
    this.innerHTML = `
      <div class="grid">
        ${products.map(p => `
          <product-card
            product-id="${p.id}"
            name="${p.name}"
            price="${p.price}"
            image="${p.image}">
          </product-card>
        `).join('')}
      </div>
    `;
  }
}
```

### Shopping Cart

The cart subscribes to add-to-cart events and persists state:

```javascript
// shopping-cart.js
class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.items = JSON.parse(localStorage.getItem('cart')) || [];
  }

  connectedCallback() {
    pan.subscribe('cart.add', ({ product }) => {
      this.addItem(product);
    });

    pan.subscribe('cart.remove', ({ productId }) => {
      this.removeItem(productId);
    });

    this.render();
  }

  addItem(product) {
    const existing = this.items.find(i => i.id === product.id);
    if (existing) {
      existing.quantity++;
    } else {
      this.items.push({ ...product, quantity: 1 });
    }
    this.save();
    this.render();
  }

  removeItem(productId) {
    this.items = this.items.filter(i => i.id !== productId);
    this.save();
    this.render();
  }

  save() {
    localStorage.setItem('cart', JSON.stringify(this.items));
    pan.publish('cart.updated', { items: this.items, total: this.total });
  }

  get total() {
    return this.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  }

  render() {
    this.innerHTML = `
      <h2>Cart (${this.items.length} items)</h2>
      ${this.items.map(item => `
        <cart-item
          product-id="${item.id}"
          name="${item.name}"
          price="${item.price}"
          quantity="${item.quantity}">
        </cart-item>
      `).join('')}
      <p class="total">Total: $${this.total.toFixed(2)}</p>
      <button class="checkout-btn">Checkout</button>
    `;
  }
}
```

## Case Study: Dashboard Application

A data dashboard shows real-time metrics with role-based access.

### Real-Time Updates

WebSocket messages update charts automatically:

```javascript
// metrics-chart.js
class MetricsChart extends HTMLElement {
  connectedCallback() {
    this.data = [];

    pan.subscribe('ws.message.metrics', ({ value, timestamp }) => {
      this.data.push({ value, timestamp });
      if (this.data.length > 100) this.data.shift();
      this.render();
    });

    this.render();
  }

  render() {
    // Render chart using canvas or SVG
    const canvas = this.querySelector('canvas') || document.createElement('canvas');
    if (!this.contains(canvas)) this.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    // ... draw chart
  }
}
```

### Role-Based Views

Different users see different widgets:

```javascript
// dashboard-page.js
class DashboardPage extends HTMLElement {
  connectedCallback() {
    const user = auth.getCurrentUser();

    this.innerHTML = `
      <h1>Dashboard</h1>

      <div class="widgets">
        <metrics-chart></metrics-chart>
        <recent-activity></recent-activity>

        ${rbac.can(user, 'view-analytics') ? `
          <analytics-panel></analytics-panel>
        ` : ''}

        ${rbac.can(user, 'manage-users') ? `
          <user-management></user-management>
        ` : ''}
      </div>
    `;
  }
}
```

## Lessons Learned

Building real applications with LARC teaches valuable lessons:

1. **Start simple**: Begin with basic components and add complexity as needed.

2. **Use the PAN bus liberally**: It's cheap and powerful. When in doubt, publish an event.

3. **Embrace the platform**: Native APIs are well-optimized. Use fetch, not axios. Use template literals, not a template library.

4. **Think in components**: Small, focused components are easier to test, reuse, and understand.

5. **Test early**: Writing tests as you build prevents painful debugging later.

6. **Profile before optimizing**: Measure performance before assuming where bottlenecks are.

7. **Document as you go**: Future you will thank present you.

8. **Progressive enhancement**: Build core functionality first, then enhance for modern browsers.

### Complete Checkout Flow

Let's implement the full checkout process:

```javascript
// checkout-form.js
class CheckoutForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        form {
          max-width: 600px;
          margin: 0 auto;
        }

        .section {
          margin-bottom: 2rem;
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .field {
          margin-bottom: 1rem;
        }

        label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
        }

        input, select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 4px;
        }

        .error {
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        button {
          width: 100%;
          padding: 1rem;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }

        button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>

      <form id="checkout-form">
        <div class="section">
          <h2>Shipping Information</h2>
          <div class="field">
            <label for="email">Email</label>
            <input type="email" id="email" required>
            <div class="error" id="email-error"></div>
          </div>
          <div class="field">
            <label for="name">Full Name</label>
            <input type="text" id="name" required>
          </div>
          <div class="field">
            <label for="address">Address</label>
            <input type="text" id="address" required>
          </div>
          <div class="field">
            <label for="city">City</label>
            <input type="text" id="city" required>
          </div>
          <div class="field">
            <label for="zip">ZIP Code</label>
            <input type="text" id="zip" pattern="[0-9]{5}" required>
          </div>
        </div>

        <div class="section">
          <h2>Payment Information</h2>
          <div class="field">
            <label for="card-number">Card Number</label>
            <input type="text" id="card-number" pattern="[0-9]{16}" required>
          </div>
          <div class="field">
            <label for="expiry">Expiry Date</label>
            <input type="text" id="expiry" placeholder="MM/YY" required>
          </div>
          <div class="field">
            <label for="cvv">CVV</label>
            <input type="text" id="cvv" pattern="[0-9]{3}" required>
          </div>
        </div>

        <button type="submit" id="submit-btn">Place Order</button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.getElementById('checkout-form');
    const submitBtn = this.shadowRoot.getElementById('submit-btn');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (!this.validate()) {
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Processing...';

      try {
        const order = this.getFormData();
        const result = await orderService.submit(order);

        pan.publish('order.completed', { orderId: result.id });
        pan.publish('router.navigate', { path: `/order-confirmation/${result.id}` });
      } catch (error) {
        alert('Order failed: ' + error.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Place Order';
      }
    });
  }

  validate() {
    // Implement validation logic
    return true;
  }

  getFormData() {
    const form = this.shadowRoot.getElementById('checkout-form');
    return {
      email: form.email.value,
      name: form.name.value,
      address: form.address.value,
      city: form.city.value,
      zip: form.zip.value,
      payment: {
        cardNumber: form['card-number'].value,
        expiry: form.expiry.value,
        cvv: form.cvv.value
      }
    };
  }
}

customElements.define('checkout-form', CheckoutForm);
```

### Inventory Management

Admin panel for managing products:

```javascript
// admin-inventory.js
class AdminInventory extends HTMLElement {
  async connectedCallback() {
    this.products = await productService.getAll();
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="admin-panel">
        <h1>Inventory Management</h1>
        <button class="add-product-btn">Add New Product</button>

        <table class="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${this.products.map(p => `
              <tr>
                <td>${p.id}</td>
                <td>${p.name}</td>
                <td>$${p.price}</td>
                <td>${p.stock}</td>
                <td>
                  <span class="badge ${p.stock > 0 ? 'in-stock' : 'out-of-stock'}">
                    ${p.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </td>
                <td>
                  <button onclick="this.getRootNode().host.editProduct(${p.id})">
                    Edit
                  </button>
                  <button onclick="this.getRootNode().host.deleteProduct(${p.id})">
                    Delete
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async editProduct(id) {
    const product = this.products.find(p => p.id === id);
    // Show edit dialog
    pan.publish('dialog.open', {
      component: 'product-edit-form',
      data: product
    });
  }

  async deleteProduct(id) {
    if (!confirm('Are you sure?')) return;

    await productService.delete(id);
    this.products = this.products.filter(p => p.id !== id);
    this.render();
  }
}

customElements.define('admin-inventory', AdminInventory);
```

## Case Study: Blog/CMS Application

A content management system demonstrates LARC's flexibility for content-heavy applications.

### Architecture

```
blog/
├── index.html
├── components/
│   ├── article-editor.js
│   ├── article-list.js
│   ├── article-card.js
│   ├── markdown-renderer.js
│   └── tag-selector.js
├── services/
│   ├── content-service.js
│   └── media-service.js
└── admin/
    ├── dashboard.js
    ├── editor.js
    └── settings.js
```

### Rich Text Editor

```javascript
// article-editor.js
class ArticleEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.article = { title: '', content: '', tags: [] };
  }

  connectedCallback() {
    pan.subscribe('article.load', ({ article }) => {
      this.article = article;
      this.render();
    });

    this.render();
    this.setupAutoSave();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .editor {
          max-width: 900px;
          margin: 0 auto;
          padding: 2rem;
        }

        .title-input {
          width: 100%;
          font-size: 2rem;
          font-weight: bold;
          border: none;
          border-bottom: 2px solid #e0e0e0;
          padding: 0.5rem 0;
          margin-bottom: 2rem;
        }

        .content-editor {
          min-height: 400px;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 1rem;
          font-family: monospace;
        }

        .toolbar {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
          padding: 0.5rem;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .toolbar button {
          padding: 0.5rem 1rem;
          background: white;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }

        .save-status {
          text-align: right;
          color: #666;
          font-size: 0.875rem;
          margin-top: 1rem;
        }
      </style>

      <div class="editor">
        <input
          type="text"
          class="title-input"
          placeholder="Article Title"
          value="${this.article.title}"
        >

        <div class="toolbar">
          <button data-action="bold">Bold</button>
          <button data-action="italic">Italic</button>
          <button data-action="link">Link</button>
          <button data-action="image">Image</button>
          <button data-action="code">Code Block</button>
        </div>

        <textarea
          class="content-editor"
          placeholder="Write your article in Markdown..."
        >${this.article.content}</textarea>

        <div class="save-status">
          <span class="status-text">All changes saved</span>
        </div>

        <div class="actions">
          <button class="preview-btn">Preview</button>
          <button class="publish-btn">Publish</button>
          <button class="save-draft-btn">Save Draft</button>
        </div>
      </div>
    `;

    this.setupEditorEvents();
  }

  setupEditorEvents() {
    const titleInput = this.shadowRoot.querySelector('.title-input');
    const contentEditor = this.shadowRoot.querySelector('.content-editor');

    titleInput.addEventListener('input', (e) => {
      this.article.title = e.target.value;
      this.markDirty();
    });

    contentEditor.addEventListener('input', (e) => {
      this.article.content = e.target.value;
      this.markDirty();
    });

    // Toolbar actions
    this.shadowRoot.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyFormatting(btn.dataset.action);
      });
    });
  }

  setupAutoSave() {
    setInterval(() => {
      if (this.dirty) {
        this.save();
      }
    }, 10000); // Auto-save every 10 seconds
  }

  markDirty() {
    this.dirty = true;
    this.shadowRoot.querySelector('.status-text').textContent = 'Unsaved changes';
  }

  async save() {
    try {
      await contentService.save(this.article);
      this.dirty = false;
      this.shadowRoot.querySelector('.status-text').textContent = 'All changes saved';
    } catch (error) {
      this.shadowRoot.querySelector('.status-text').textContent = 'Save failed';
    }
  }

  applyFormatting(action) {
    const textarea = this.shadowRoot.querySelector('.content-editor');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);

    let formattedText;
    switch (action) {
      case 'bold':
        formattedText = `**${selectedText}**`;
        break;
      case 'italic':
        formattedText = `*${selectedText}*`;
        break;
      case 'code':
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``;
        break;
      case 'link':
        formattedText = `[${selectedText}](url)`;
        break;
      case 'image':
        formattedText = `![${selectedText}](image-url)`;
        break;
    }

    textarea.value =
      textarea.value.substring(0, start) +
      formattedText +
      textarea.value.substring(end);

    this.article.content = textarea.value;
    this.markDirty();
  }
}

customElements.define('article-editor', ArticleEditor);
```

### Content Preview

```javascript
// markdown-renderer.js
class MarkdownRenderer extends HTMLElement {
  static observedAttributes = ['content'];

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'content' && oldValue !== newValue) {
      this.render();
    }
  }

  async render() {
    const markdown = this.getAttribute('content') || '';

    // Use marked.js for markdown parsing
    const { marked } = await import('https://cdn.jsdelivr.net/npm/marked@12/+esm');

    this.innerHTML = `
      <div class="markdown-content">
        ${marked.parse(markdown)}
      </div>
    `;
  }
}

customElements.define('markdown-renderer', MarkdownRenderer);
```

## Architecture Decisions and Tradeoffs

### When to Use LARC

**✅ Great for:**
- Progressive web apps
- Content-heavy sites (blogs, documentation)
- Dashboards and admin panels
- Internal tools
- Prototypes and MVPs
- Projects with long maintenance horizons

**❌ Consider alternatives for:**
- Apps requiring server-side rendering for SEO
- Highly interactive games (use Canvas/WebGL directly)
- Apps requiring React Native for mobile
- Teams deeply invested in React/Vue ecosystem

### State Management Patterns

**Local State (Component Properties):**
```javascript
class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0; // Local state
  }

  increment() {
    this.count++;
    this.render();
  }
}
```

**Shared State (PAN Bus):**
```javascript
// One component publishes
pan.publish('user.login', { userId, name });

// Many components subscribe
pan.subscribe('user.login', ({ name }) => {
  this.userName = name;
  this.render();
});
```

**Persistent State (LocalStorage + PAN):**
```javascript
class AppState {
  constructor() {
    this.state = JSON.parse(localStorage.getItem('app-state')) || {};

    pan.subscribe('state.*', (data, topic) => {
      const key = topic.split('.')[1];
      this.state[key] = data;
      localStorage.setItem('app-state', JSON.stringify(this.state));
    });
  }

  get(key) {
    return this.state[key];
  }

  set(key, value) {
    pan.publish(`state.${key}`, value);
  }
}

export const appState = new AppState();
```

### Scaling Considerations

**Code Organization:**

```
large-app/
├── index.html
├── app.js
├── features/
│   ├── auth/
│   │   ├── components/
│   │   ├── services/
│   │   └── index.js
│   ├── products/
│   │   ├── components/
│   │   ├── services/
│   │   └── index.js
│   └── checkout/
│       ├── components/
│       ├── services/
│       └── index.js
├── shared/
│   ├── components/
│   ├── services/
│   └── utils/
└── config/
    ├── router.js
    └── pan.js
```

**Lazy Loading Features:**

```javascript
// app.js - Load features on demand
const features = {
  'auth': () => import('./features/auth/index.js'),
  'products': () => import('./features/products/index.js'),
  'checkout': () => import('./features/checkout/index.js')
};

pan.subscribe('feature.load', async ({ name }) => {
  if (features[name]) {
    await features[name]();
    pan.publish('feature.loaded', { name });
  }
});

// Auto-load on route change
pan.subscribe('router.navigate', ({ path }) => {
  const feature = path.split('/')[1];
  pan.publish('feature.load', { name: feature });
});
```

### Performance at Scale

**Virtual Scrolling for Large Lists:**

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 50;
    this.visibleCount = 20;
    this.scrollTop = 0;
  }

  set data(items) {
    this.items = items;
    this.render();
  }

  connectedCallback() {
    this.addEventListener('scroll', () => {
      this.scrollTop = this.scrollTop;
      requestAnimationFrame(() => this.render());
    });
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(startIndex + this.visibleCount, this.items.length);
    const visibleItems = this.items.slice(startIndex, endIndex);

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
```

**Memoization and Caching:**

```javascript
class ProductCatalog extends HTMLElement {
  constructor() {
    super();
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getProducts(category) {
    const cacheKey = `products-${category}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const data = await productService.getByCategory(category);

    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

## Maintenance and Evolution

### Versioning Components

```javascript
// v1/button.js
class ButtonV1 extends HTMLElement {
  // Original implementation
}
customElements.define('app-button-v1', ButtonV1);

// v2/button.js
class ButtonV2 extends HTMLElement {
  // New implementation with breaking changes
}
customElements.define('app-button', ButtonV2);

// Migration path: Both versions coexist
// Old code uses app-button-v1
// New code uses app-button
// Gradual migration over time
```

### Feature Flags

```javascript
// feature-flags.js
class FeatureFlags {
  constructor() {
    this.flags = {
      'new-checkout': false,
      'beta-dashboard': true,
      'experimental-editor': false
    };
  }

  isEnabled(feature) {
    return this.flags[feature] ?? false;
  }

  enable(feature) {
    this.flags[feature] = true;
    pan.publish('feature-flag.changed', { feature, enabled: true });
  }
}

export const featureFlags = new FeatureFlags();

// Usage in component
class Checkout extends HTMLElement {
  connectedCallback() {
    if (featureFlags.isEnabled('new-checkout')) {
      this.innerHTML = '<new-checkout-flow></new-checkout-flow>';
    } else {
      this.innerHTML = '<legacy-checkout-flow></legacy-checkout-flow>';
    }
  }
}
```

### Migration from React

Here's how to migrate a React app to LARC:

**React Component:**
```javascript
function TodoItem({ todo, onComplete }) {
  return (
    <div className="todo-item">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onComplete(todo.id)}
      />
      <span>{todo.text}</span>
    </div>
  );
}
```

**LARC Equivalent:**
```javascript
class TodoItem extends HTMLElement {
  static observedAttributes = ['completed'];

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const completed = this.hasAttribute('completed');
    const text = this.getAttribute('text') || '';

    this.innerHTML = `
      <div class="todo-item">
        <input
          type="checkbox"
          ${completed ? 'checked' : ''}
        >
        <span>${text}</span>
      </div>
    `;

    this.querySelector('input').addEventListener('change', () => {
      pan.publish('todo.complete', { id: this.getAttribute('todo-id') });
    });
  }
}

customElements.define('todo-item', TodoItem);
```

### Migration from Vue

**Vue Component:**
```vue
<template>
  <div class="user-card">
    <img :src="user.avatar" :alt="user.name">
    <h3>{{ user.name }}</h3>
    <p>{{ user.email }}</p>
    <button @click="viewProfile">View Profile</button>
  </div>
</template>

<script>
export default {
  props: ['user'],
  methods: {
    viewProfile() {
      this.$router.push(`/user/${this.user.id}`);
    }
  }
}
</script>
```

**LARC Equivalent:**
```javascript
class UserCard extends HTMLElement {
  static observedAttributes = ['user-id'];

  async connectedCallback() {
    const userId = this.getAttribute('user-id');
    this.user = await userService.get(userId);
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="user-card">
        <img src="${this.user.avatar}" alt="${this.user.name}">
        <h3>${this.user.name}</h3>
        <p>${this.user.email}</p>
        <button class="view-btn">View Profile</button>
      </div>
    `;

    this.querySelector('.view-btn').addEventListener('click', () => {
      pan.publish('router.navigate', { path: `/user/${this.user.id}` });
    });
  }
}

customElements.define('user-card', UserCard);
```

## Real-World Challenges and Solutions

### Challenge 1: SEO for Content Sites

**Problem**: Client-side rendering isn't indexed by search engines.

**Solution**: Pre-render static content

```javascript
// build-static.js - Pre-render pages at build time
import { JSDOM } from 'jsdom';
import { writeFileSync } from 'fs';

async function prerender(url, outputPath) {
  const dom = new JSDOM(html);
  global.window = dom.window;
  global.document = dom.window.document;

  // Load and execute components
  await import('./components/article-page.js');

  // Wait for async content to load
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Write rendered HTML
  writeFileSync(outputPath, dom.serialize());
}

// Pre-render all blog posts
const posts = await contentService.getAllPosts();
for (const post of posts) {
  await prerender(`/blog/${post.slug}`, `dist/blog/${post.slug}.html`);
}
```

### Challenge 2: Complex State Synchronization

**Problem**: Multiple components need to stay in sync with complex state.

**Solution**: Centralized state manager

```javascript
// state-manager.js
class StateManager {
  constructor() {
    this.state = {};
    this.subscribers = new Map();
  }

  get(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => {
      if (!obj[key]) obj[key] = {};
      return obj[key];
    }, this.state);

    target[lastKey] = value;

    // Notify subscribers
    pan.publish(`state.${path}`, value);
  }

  subscribe(path, callback) {
    return pan.subscribe(`state.${path}`, callback);
  }
}

export const state = new StateManager();
```

### Challenge 3: Testing Async Component Behavior

**Problem**: Components with async data loading are hard to test.

**Solution**: Dependency injection and mocking

```javascript
// product-list.test.js
import { fixture, html } from '@open-wc/testing';
import './product-list.js';

// Mock service
const mockProductService = {
  getAll: () => Promise.resolve([
    { id: 1, name: 'Product 1', price: 10 },
    { id: 2, name: 'Product 2', price: 20 }
  ])
};

describe('ProductList', () => {
  it('renders products after loading', async () => {
    // Inject mock
    window.productService = mockProductService;

    const el = await fixture(html`<product-list></product-list>`);

    // Wait for async render
    await new Promise(resolve => setTimeout(resolve, 100));

    const products = el.querySelectorAll('product-card');
    expect(products.length).to.equal(2);
  });
});
```

## Team Practices and Workflows

### Code Review Checklist

- [ ] Component follows single responsibility principle
- [ ] Shadow DOM used for encapsulation
- [ ] Event listeners cleaned up in `disconnectedCallback`
- [ ] Attributes declared in `observedAttributes`
- [ ] JSDoc comments for public API
- [ ] Tests cover happy path and error cases
- [ ] Accessible (keyboard navigation, ARIA)
- [ ] Performance profiled (if rendering > 100 items)

### Component Design Guidelines

1. **Keep components small**: If a component is > 200 lines, split it
2. **Prefer composition**: Use slots and nested components
3. **Clear naming**: `<user-profile-card>` not `<component-5>`
4. **Consistent patterns**: All similar components follow same structure
5. **Document props**: JSDoc with type information
6. **Handle errors gracefully**: Show user-friendly error messages

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/user-authentication

# 2. Write component with tests
npm run test:watch

# 3. Run linter
npm run lint

# 4. Create PR
git push origin feature/user-authentication

# 5. CI runs tests and linter
# 6. Code review
# 7. Merge to main
# 8. Deploy to production
npm run deploy
```

## Troubleshooting Real-World Applications

### Problem 1: Component State Gets Out of Sync

**Symptoms**: UI shows stale data, actions don't reflect in other parts of the app

**Cause**: Multiple sources of truth, missed PAN bus updates

**Solution**:
```javascript
// Bad: Duplicated state
class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.product = null;  // Local copy
  }
}

// Good: Single source of truth
class ProductCard extends HTMLElement {
  connectedCallback() {
    // Subscribe to state changes
    this.unsub = pan.subscribe('products.*.updated', (data, topic) => {
      const productId = topic.split('.')[1];
      if (productId === this.productId) {
        this.render();
      }
    });
  }
}
```

### Problem 2: Memory Leaks in Long-Running Apps

**Symptoms**: App slows down over time, browser tab uses increasing memory

**Cause**: Event listeners not cleaned up, retained references

**Solution**:
```javascript
class Dashboard extends HTMLElement {
  connectedCallback() {
    // Track subscriptions for cleanup
    this.subscriptions = [
      pan.subscribe('metrics.updated', this.handleMetrics),
      pan.subscribe('alerts.new', this.handleAlert)
    ];

    // Track intervals
    this.updateInterval = setInterval(() => this.fetchUpdates(), 5000);
  }

  disconnectedCallback() {
    // Clean up all subscriptions
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];

    // Clear intervals
    clearInterval(this.updateInterval);
  }
}
```

### Problem 3: Performance Degrades with Large Datasets

**Symptoms**: Slow rendering, laggy interactions when displaying many items

**Cause**: Rendering all items at once, no virtualization

**Solution**:
```javascript
// Use virtual scrolling for large lists
class VirtualProductList extends HTMLElement {
  render() {
    const viewportHeight = this.clientHeight;
    const scrollTop = this.scrollTop;
    const itemHeight = 100;

    // Calculate visible range
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + viewportHeight) / itemHeight);

    // Only render visible items
    const visibleItems = this.products.slice(startIndex, endIndex + 1);

    this.innerHTML = `
      <div style="height: ${this.products.length * itemHeight}px">
        <div style="transform: translateY(${startIndex * itemHeight}px)">
          ${visibleItems.map(product => this.renderItem(product)).join('')}
        </div>
      </div>
    `;
  }
}
```

### Problem 4: Race Conditions with Async Operations

**Symptoms**: Wrong data displayed, operations complete out of order

**Cause**: Multiple async requests, no cancellation or ordering

**Solution**:
```javascript
class SearchBox extends HTMLElement {
  constructor() {
    super();
    this.abortController = null;
    this.requestId = 0;
  }

  async search(query) {
    // Cancel previous request
    if (this.abortController) {
      this.abortController.abort();
    }

    this.abortController = new AbortController();
    const currentRequestId = ++this.requestId;

    try {
      const results = await fetch(`/api/search?q=${query}`, {
        signal: this.abortController.signal
      });

      // Only update if this is still the latest request
      if (currentRequestId === this.requestId) {
        this.displayResults(await results.json());
      }
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    }
  }
}
```

## Real-World Application Best Practices

1. **Design for Scale from Day One**
   - Plan component boundaries before coding
   - Use lazy loading for routes and heavy components
   - Profile performance early and often

2. **Establish Clear State Management Patterns**
   - Single source of truth for shared state
   - Local state for component-specific data
   - Document state flow in architecture diagrams

3. **Implement Comprehensive Error Handling**
   - Catch errors at component boundaries
   - Display user-friendly error messages
   - Log errors for debugging and monitoring

4. **Write Tests for Critical Paths**
   - Test user journeys end-to-end
   - Cover edge cases and error scenarios
   - Maintain test coverage above 80%

5. **Optimize for Production**
   - Minify and compress assets
   - Enable HTTP/2 and compression
   - Use CDN for static assets
   - Implement service worker caching

6. **Monitor and Measure**
   - Track Core Web Vitals
   - Set up error tracking (Sentry, etc.)
   - Monitor real user metrics
   - Set up alerts for performance regressions

7. **Plan for Evolution**
   - Version your components
   - Use feature flags for gradual rollouts
   - Keep dependencies up to date
   - Document breaking changes

8. **Prioritize Developer Experience**
   - Set up linting and formatting
   - Create component templates/generators
   - Document common patterns
   - Maintain example implementations

9. **Focus on Accessibility**
   - Test with screen readers
   - Support keyboard navigation
   - Follow ARIA best practices
   - Include accessibility in code review checklist

10. **Build for the Long Term**
    - Prefer web standards over frameworks
    - Keep dependencies minimal
    - Write clear, self-documenting code
    - Invest in comprehensive documentation

## Hands-On Exercises

### Exercise 1: Build a Multi-Page E-Commerce App

Build a complete e-commerce application with:

- Product listing with filters and sorting
- Individual product pages
- Shopping cart with persistence
- Checkout flow with form validation
- Admin panel for inventory management

**Requirements:**
- Use PAN bus for state management
- Implement lazy loading for routes
- Add comprehensive error handling
- Include unit and E2E tests
- Deploy to production hosting

**Bonus Challenge:** Add user authentication with JWT tokens and implement role-based access control for admin features.

### Exercise 2: Create a Real-Time Dashboard

Build a dashboard application that displays:

- Real-time metrics (using WebSocket)
- Interactive charts and graphs
- Data filtering and time range selection
- Alert notifications
- User preferences and saved views

**Requirements:**
- Virtual scrolling for large datasets
- Optimistic UI updates
- Service worker for offline functionality
- Performance profiled (60fps interactions)
- Responsive design for mobile/desktop

**Bonus Challenge:** Implement data export (CSV, PDF), scheduled reports, and email notifications for alerts.

### Exercise 3: Build a Blog CMS

Create a complete content management system with:

- Rich text editor for articles
- Draft/publish workflow
- Tag and category management
- SEO optimization (meta tags, sitemaps)
- Media library for images
- Comment moderation

**Requirements:**
- Server integration (Node.js or your choice)
- Client-side routing with SSR for SEO
- Form validation and error handling
- Auto-save functionality
- Search functionality
- User roles (admin, editor, author)

**Bonus Challenge:** Add markdown support with live preview, scheduled publishing, and content analytics (views, engagement).

### Exercise 4: Migrate an Existing Application

Take an existing React or Vue application and migrate it to LARC:

- Audit current architecture and dependencies
- Create migration plan with phases
- Implement hybrid approach (gradual migration)
- Maintain feature parity during migration
- Compare bundle sizes and performance

**Requirements:**
- Document migration process
- Create mapping guide (React/Vue → LARC)
- Identify and solve migration challenges
- Set up automated tests to prevent regressions
- Deploy both versions and compare metrics

**Bonus Challenge:** Create a migration tool/CLI that automates conversion of common component patterns.

## Summary

Building real applications with LARC teaches you to:

- **Think in components**: Break UI into small, reusable pieces
- **Leverage web standards**: Use what browsers provide
- **Embrace simplicity**: No build step means faster development
- **Scale thoughtfully**: Lazy load, virtualize, cache strategically
- **Test continuously**: Catch bugs early with comprehensive tests
- **Profile performance**: Measure before optimizing
- **Plan for evolution**: Version components, use feature flags

LARC's no-build philosophy and standards-based approach make it ideal for long-lived projects that need maintainability and performance at scale.

## Further Reading

- **Building with LARC - All Chapters**: Complete API reference and advanced patterns
- **MDN Web Components**: Deep dive into the platform
- **Open-wc**: Testing and tooling best practices for web components
