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

---

# Appendices

## Appendix A: Web Components API Reference

### Custom Elements

**Defining elements:**
```javascript
customElements.define('my-element', MyElement);
customElements.define('my-element', MyElement, { extends: 'button' });
```

**Retrieving definitions:**
```javascript
customElements.get('my-element');  // Returns constructor or undefined
await customElements.whenDefined('my-element');  // Resolves when defined
customElements.upgrade(element);  // Upgrade an element
```

### Lifecycle Callbacks

| Callback | When Called |
|----------|-------------|
| `constructor()` | Element created |
| `connectedCallback()` | Element added to DOM |
| `disconnectedCallback()` | Element removed from DOM |
| `attributeChangedCallback(name, oldVal, newVal)` | Observed attribute changed |
| `adoptedCallback()` | Element moved to new document |

### Shadow DOM

```javascript
// Attach shadow root
const shadow = element.attachShadow({ mode: 'open' });

// Access shadow root
element.shadowRoot  // null if mode is 'closed'

// Slots
const slot = shadow.querySelector('slot');
slot.assignedNodes();  // All assigned nodes
slot.assignedElements();  // Only element nodes
```

## Appendix B: PAN Bus API Reference

### Publishing

```javascript
// Simple publish
pan.publish('topic', data);

// With options
pan.publish('topic', data, { retained: true });
```

### Subscribing

```javascript
// Subscribe
const unsubscribe = pan.subscribe('topic', (data) => {
  console.log(data);
});

// Wildcard subscribe
pan.subscribe('user.*', (data, topic) => {
  console.log(topic, data);
});

// Unsubscribe
unsubscribe();
```

### Request/Response

```javascript
// Request with timeout
const result = await pan.request('service.getData', { id: 1 }, 5000);

// Respond to requests
pan.respond('service.getData', async ({ id }) => {
  return await fetchData(id);
});
```

## Appendix C: Component Quick Reference

| Component | Purpose | Key Attributes |
|-----------|---------|----------------|
| `pan-router` | Client-side routing | `base` |
| `pan-route` | Route definition | `path`, `component` |
| `pan-store` | State management | `persist`, `namespace` |
| `pan-fetch` | Data fetching | `url`, `method`, `auto` |

## Appendix D: Migration Cheat Sheet

### React → LARC

| React | LARC |
|-------|------|
| JSX | Template literals |
| `props` | Attributes/properties |
| `useState` | Instance properties |
| `useEffect` | `connectedCallback` |
| Context | PAN bus |
| Redux | `pan-store` |

### Vue → LARC

| Vue | LARC |
|-----|------|
| Templates | Template literals |
| `v-if` | Ternary in template |
| `v-for` | `array.map()` |
| `computed` | Getters |
| Vuex | `pan-store` |

## Appendix E: Resources

### Official

- Documentation: https://larcjs.com/docs
- GitHub: https://github.com/larcjs/larc
- Examples: https://github.com/larcjs/larc/tree/main/packages/examples

### Web Standards

- MDN Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- Custom Elements Spec: https://html.spec.whatwg.org/multipage/custom-elements.html
- Shadow DOM Spec: https://dom.spec.whatwg.org/#shadow-trees

### Community

- Discord: https://discord.gg/larc
- Forum: https://forum.larcjs.com
