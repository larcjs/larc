# Working with Components

> "Give a developer a component, and they'll build a page. Teach a developer to build components, and they'll build an empire—or at least a reasonably maintainable SPA."
>
> — Ancient Web Development Proverb (circa 2015)

If the PAN bus is the nervous system of a LARC application, components are the organs. They're the visible, interactive pieces that users actually see and touch. They render UI, respond to user input, and communicate with each other through the message bus we explored in Chapter 6.

But components in LARC aren't just any components—they're web components, which means they're built on browser standards rather than framework-specific abstractions. This gives them superpowers: they work anywhere, outlive framework churn, and compose beautifully with both LARC and non-LARC code.

In this chapter, we'll explore how to create web components in LARC applications, understand their lifecycle, work with Shadow DOM, connect components via the PAN bus, and design reusable components that stand the test of time.

## Web Components: A Brief Refresher

Before we dive into LARC-specific patterns, let's review the three web standards that comprise "web components":

1. **Custom Elements**: The API for defining new HTML elements with custom behavior
2. **Shadow DOM**: Encapsulated DOM trees that isolate styles and markup
3. **HTML Templates**: Reusable chunks of markup that can be cloned and inserted

LARC leans heavily on Custom Elements and uses Shadow DOM where appropriate. HTML Templates are less common in LARC applications because most components render dynamically based on message data, but they're available if you need them.

Here's the most basic custom element:

```javascript
class HelloWorld extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Hello, World!';
  }
}

customElements.define('hello-world', HelloWorld);
```

And here's how you use it:

```html
<hello-world></hello-world>
```

That's all there is to it. No build step, no framework, no magic. Just JavaScript and HTML.

## The Component Lifecycle

Custom elements have a well-defined lifecycle with four main callbacks:

1. **`constructor()`**: Called when an instance is created. Use this for initializing state, but don't manipulate the DOM or attributes here.

2. **`connectedCallback()`**: Called when the element is inserted into the DOM. This is where you should render content, set up subscriptions, and add event listeners.

3. **`disconnectedCallback()`**: Called when the element is removed from the DOM. Use this for cleanup: unsubscribe from messages, remove event listeners, and cancel any pending work.

4. **`attributeChangedCallback(name, oldValue, newValue)`**: Called when an observed attribute changes. Declare which attributes to observe with the static `observedAttributes` getter.

Here's a component that uses all four:

```javascript
class UserBadge extends HTMLElement {
  static get observedAttributes() {
    return ['user-id'];
  }

  constructor() {
    super();
    this.userData = null;
  }

  connectedCallback() {
    // Subscribe to user data updates
    this.unsubscribe = subscribe('user.data', (msg) => {
      if (msg.data.userId === this.getAttribute('user-id')) {
        this.userData = msg.data;
        this.render();
      }
    });

    // Initial render
    this.render();
  }

  disconnectedCallback() {
    // Clean up subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id' && oldValue !== newValue) {
      // Attribute changed, re-render
      this.render();
    }
  }

  render() {
    if (this.userData) {
      this.innerHTML = `
        <div class="user-badge">
          <img src="${this.userData.avatar}" alt="${this.userData.name}" />
          <span>${this.userData.name}</span>
        </div>
      `;
    } else {
      this.innerHTML = '<div class="user-badge loading">Loading...</div>';
    }
  }
}

customElements.define('user-badge', UserBadge);
```

Notice how the component follows a clear pattern:

- Initialize state in `constructor()`
- Set up subscriptions and render in `connectedCallback()`
- Clean up in `disconnectedCallback()`
- React to attribute changes in `attributeChangedCallback()`

This pattern is robust and works for most LARC components.

## Shadow DOM: To Use or Not to Use?

Shadow DOM is one of the more controversial features of web components. It provides encapsulation—styles inside the shadow tree don't leak out, and styles outside don't leak in—but this encapsulation comes with tradeoffs.

### When to Use Shadow DOM

Use Shadow DOM when:

1. **You need style isolation**: Your component should look consistent regardless of the page's CSS
2. **You're building a library**: If others will use your component, Shadow DOM prevents style conflicts
3. **You want internal complexity hidden**: The shadow tree's internal structure is hidden from external JavaScript

Here's a component using Shadow DOM:

```javascript
class FancyButton extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: inline-block;
        }
        button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          font-size: 16px;
          border-radius: 8px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        button:hover {
          transform: scale(1.05);
        }
        button:active {
          transform: scale(0.95);
        }
      </style>
      <button><slot></slot></button>
    `;

    this.shadowRoot.querySelector('button').addEventListener('click', (e) => {
      this.dispatchEvent(new CustomEvent('fancy-click', {
        bubbles: true,
        composed: true
      }));
    });
  }
}

customElements.define('fancy-button', FancyButton);
```

The `:host` selector styles the component itself, and `<slot>` projects content from the light DOM into the shadow DOM. The button's styles are completely isolated—no external CSS can affect them.

### When to Avoid Shadow DOM

Avoid Shadow DOM when:

1. **You need global styles**: If your component should inherit the page's theme, Shadow DOM makes this harder
2. **You need simple DOM manipulation**: Shadow DOM adds complexity when you just want to insert some HTML
3. **You're building app-specific components**: For components that are tightly coupled to a single application, encapsulation is often overkill

Most LARC components don't use Shadow DOM. They rely on scoped CSS classes and BEM-style naming conventions instead:

```javascript
class UserProfile extends HTMLElement {
  connectedCallback() {
    this.className = 'user-profile';
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="user-profile__header">
        <h2 class="user-profile__name">Alice</h2>
      </div>
      <div class="user-profile__details">
        <p class="user-profile__email">alice@example.com</p>
      </div>
    `;
  }
}

customElements.define('user-profile', UserProfile);
```

This approach is simpler and allows global styles to influence the component, which is often desirable in application UIs.

## Connecting Components via the PAN Bus

This is where LARC shines. Components don't call methods on each other or pass data through complex prop chains. Instead, they communicate through the PAN bus by publishing and subscribing to messages.

Let's build a multi-component example: a simple shopping cart system.

### Component 1: Product Catalog

```javascript
class ProductCatalog extends HTMLElement {
  connectedCallback() {
    this.products = [
      { id: 1, name: 'Widget', price: 10 },
      { id: 2, name: 'Gadget', price: 20 },
      { id: 3, name: 'Doohickey', price: 30 }
    ];

    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="product-catalog">
        <h2>Products</h2>
        ${this.products.map(product => `
          <div class="product">
            <h3>${product.name}</h3>
            <p>$${product.price}</p>
            <button data-product-id="${product.id}">Add to Cart</button>
          </div>
        `).join('')}
      </div>
    `;

    this.querySelectorAll('button').forEach(button => {
      button.addEventListener('click', () => {
        const productId = parseInt(button.dataset.productId);
        const product = this.products.find(p => p.id === productId);

        // Publish a message when a product is added to the cart
        publish('cart.item.added', {
          productId: product.id,
          name: product.name,
          price: product.price,
          quantity: 1
        });
      });
    });
  }
}

customElements.define('product-catalog', ProductCatalog);
```

### Component 2: Shopping Cart

```javascript
class ShoppingCart extends HTMLElement {
  constructor() {
    super();
    this.items = [];
  }

  connectedCallback() {
    // Subscribe to cart events
    this.unsubscribe = subscribe('cart.item.added', (msg) => {
      this.addItem(msg.data);
    });

    this.render();
  }

  addItem(item) {
    const existing = this.items.find(i => i.productId === item.productId);

    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.items.push({ ...item });
    }

    // Publish updated cart state
    publish('cart.updated', {
      items: this.items,
      total: this.calculateTotal()
    });

    this.render();
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  render() {
    this.innerHTML = `
      <div class="shopping-cart">
        <h2>Cart</h2>
        ${this.items.length === 0 ? '<p>Cart is empty</p>' : `
          <ul>
            ${this.items.map(item => `
              <li>
                ${item.name} x ${item.quantity} - $${item.price * item.quantity}
              </li>
            `).join('')}
          </ul>
          <p><strong>Total: $${this.calculateTotal()}</strong></p>
        `}
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('shopping-cart', ShoppingCart);
```

### Component 3: Cart Badge

```javascript
class CartBadge extends HTMLElement {
  constructor() {
    super();
    this.itemCount = 0;
  }

  connectedCallback() {
    // Subscribe to cart updates
    this.unsubscribe = subscribe('cart.updated', (msg) => {
      this.itemCount = msg.data.items.reduce((sum, item) => sum + item.quantity, 0);
      this.render();
    });

    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="cart-badge">
        [cart] ${this.itemCount}
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('cart-badge', CartBadge);
```

### Putting It All Together

```html
<!DOCTYPE html>
<html>
<head>
  <title>Shopping Demo</title>
  <script type="module" src="./app.js"></script>
</head>
<body>
  <header>
    <h1>My Store</h1>
    <cart-badge></cart-badge>
  </header>
  <main>
    <product-catalog></product-catalog>
    <shopping-cart></shopping-cart>
  </main>
</body>
</html>
```

Notice how these components have zero direct dependencies on each other. The `product-catalog` doesn't know about `shopping-cart`. The `cart-badge` doesn't know about either. They're completely decoupled, yet they work together seamlessly through the PAN bus.

This is the power of message-based architecture: you can add, remove, or replace components without touching existing code. Want to add a "Cart Saved" notification? Just create a component that subscribes to `cart.updated`. Want to log analytics when items are added? Subscribe to `cart.item.added`. The existing components don't care.

## Component Communication Patterns

Let's explore some common patterns for component communication in LARC.

### Pattern: Request-Response

Sometimes a component needs data from another component or service. Use a request-response pattern:

```javascript
class DataLoader extends HTMLElement {
  connectedCallback() {
    // Subscribe to data requests
    this.unsubscribe = subscribe('data.request', async (msg) => {
      const { requestId, url } = msg.data;

      try {
        const response = await fetch(url);
        const data = await response.json();

        // Publish response
        publish('data.response', {
          requestId,
          data,
          error: null
        });
      } catch (error) {
        // Publish error
        publish('data.response', {
          requestId,
          data: null,
          error: error.message
        });
      }
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('data-loader', DataLoader);
```

A component that needs data publishes a request:

```javascript
class DataConsumer extends HTMLElement {
  connectedCallback() {
    const requestId = `request-${Date.now()}-${Math.random()}`;

    // Subscribe to the response
    this.unsubscribe = subscribe('data.response', (msg) => {
      if (msg.data.requestId === requestId) {
        if (msg.data.error) {
          this.showError(msg.data.error);
        } else {
          this.showData(msg.data.data);
        }

        // Unsubscribe after receiving response
        this.unsubscribe();
      }
    });

    // Publish the request
    publish('data.request', {
      requestId,
      url: '/api/data'
    });
  }
}
```

The `requestId` ensures that the requester only processes its own response, not responses to other requests.

### Pattern: Command Pattern

Use commands to trigger actions without caring who handles them:

```javascript
// Component that issues commands
class CommandIssuer extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <button id="save-btn">Save</button>
      <button id="cancel-btn">Cancel</button>
    `;

    this.querySelector('#save-btn').addEventListener('click', () => {
      publish('command.save', { timestamp: Date.now() });
    });

    this.querySelector('#cancel-btn').addEventListener('click', () => {
      publish('command.cancel', { timestamp: Date.now() });
    });
  }
}

// Component that handles commands
class CommandHandler extends HTMLElement {
  connectedCallback() {
    this.subscriptions = [
      subscribe('command.save', () => this.handleSave()),
      subscribe('command.cancel', () => this.handleCancel())
    ];
  }

  handleSave() {
    console.log('Saving...');
    // Perform save operation
  }

  handleCancel() {
    console.log('Canceling...');
    // Perform cancel operation
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
  }
}
```

### Pattern: State Projection

Components can subscribe to state changes and project that state into the UI:

```javascript
class CurrentUser extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('user.current', (msg) => {
      this.render(msg.data);
    });

    // Trigger initial render with retained message
    this.render(null);
  }

  render(user) {
    if (user) {
      this.innerHTML = `
        <div class="current-user">
          <img src="${user.avatar}" alt="${user.name}" />
          <span>${user.name}</span>
        </div>
      `;
    } else {
      this.innerHTML = '<div class="current-user">Not logged in</div>';
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

This component is purely presentational—it projects state into UI without managing any state itself.

### Pattern: Event Aggregation

Some components aggregate events from multiple sources:

```javascript
class ActivityFeed extends HTMLElement {
  constructor() {
    super();
    this.activities = [];
  }

  connectedCallback() {
    // Subscribe to multiple event types
    this.unsubscribe = subscribe('*.*.success', (msg) => {
      this.addActivity({
        type: 'success',
        topic: msg.topic,
        data: msg.data,
        timestamp: Date.now()
      });
    });

    this.render();
  }

  addActivity(activity) {
    this.activities.unshift(activity);

    // Keep only the most recent 20 activities
    if (this.activities.length > 20) {
      this.activities.pop();
    }

    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="activity-feed">
        <h2>Recent Activity</h2>
        <ul>
          ${this.activities.map(activity => `
            <li>
              <span class="activity-time">${new Date(activity.timestamp).toLocaleTimeString()}</span>
              <span class="activity-type">${activity.topic}</span>
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('activity-feed', ActivityFeed);
```

## Reusable Component Design

Creating reusable components is an art. Here are principles to guide your design:

### Principle 1: Single Responsibility

Each component should do one thing well. Don't create a `UserProfileWithEditorAndNotifications` component—create `UserProfile`, `UserEditor`, and `UserNotifications` components that work together.

### Principle 2: Clear API

A component's API consists of:

1. **Attributes**: Configuration that rarely changes
2. **Published messages**: Events or state changes the component announces
3. **Subscribed messages**: Messages the component reacts to

Document all three:

```javascript
/**
 * UserAvatar Component
 *
 * Displays a user's avatar image with optional fallback to initials.
 *
 * Attributes:

 *   - user-id: Required. The ID of the user to display.
 *   - size: Optional. Size in pixels (default: 40).
 *
 * Subscribes to:

 *   - user.data: Updates avatar when user data changes.
 *
 * Publishes:

 *   - user.avatar.clicked: When the avatar is clicked.
 */
class UserAvatar extends HTMLElement {
  // Implementation...
}
```

### Principle 3: Composition Over Configuration

Rather than making components configurable with dozens of attributes, make them composable:

```html
<!-- Bad: too many configuration options -->
<data-table
  show-header="true"
  show-footer="true"
  enable-sorting="true"
  enable-filtering="true"
  enable-pagination="true"
></data-table>

<!-- Good: compose smaller components -->
<data-table>
  <table-header></table-header>
  <table-body></table-body>
  <table-footer></table-footer>
</data-table>
```

### Principle 4: Progressive Enhancement

Design components to work without JavaScript when possible, and enhance them progressively:

```javascript
class ProgressiveForm extends HTMLElement {
  connectedCallback() {
    // The form works without JS (regular form submission)
    const form = this.querySelector('form');

    // Enhance with AJAX submission if JS is available
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const response = await fetch(form.action, {
        method: form.method,
        body: formData
      });

      if (response.ok) {
        publish('form.submitted', { formId: form.id });
      }
    });
  }
}
```

### Principle 5: Accessibility First

Always consider keyboard navigation, screen readers, and ARIA attributes:

```javascript
class AccessibleDialog extends HTMLElement {
  connectedCallback() {
    this.setAttribute('role', 'dialog');
    this.setAttribute('aria-modal', 'true');

    this.innerHTML = `
      <div class="dialog-overlay">
        <div class="dialog-content">
          <button class="dialog-close" aria-label="Close dialog">x</button>
          <slot></slot>
        </div>
      </div>
    `;

    // Close on Escape key
    this.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.close();
      }
    });

    // Trap focus within dialog
    this.trapFocus();
  }

  trapFocus() {
    const focusableElements = this.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (focusableElements.length === 0) return;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.addEventListener('keydown', (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    });

    firstElement.focus();
  }

  close() {
    publish('dialog.closed', { dialogId: this.id });
    this.remove();
  }
}

customElements.define('accessible-dialog', AccessibleDialog);
```

## Advanced Component Techniques

### Technique: Lazy Rendering

For components that manage large datasets, render lazily:

```javascript
class LazyList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.visibleCount = 20;
  }

  connectedCallback() {
    this.unsubscribe = subscribe('list.items', (msg) => {
      this.items = msg.data.items;
      this.render();
    });

    this.render();
  }

  render() {
    const visibleItems = this.items.slice(0, this.visibleCount);

    this.innerHTML = `
      <div class="lazy-list">
        <ul>
          ${visibleItems.map(item => `
            <li>${item.name}</li>
          `).join('')}
        </ul>
        ${this.items.length > this.visibleCount ? `
          <button id="load-more">Load More</button>
        ` : ''}
      </div>
    `;

    const loadMoreBtn = this.querySelector('#load-more');
    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        this.visibleCount += 20;
        this.render();
      });
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('lazy-list', LazyList);
```

### Technique: Virtual Scrolling

For truly massive lists, implement virtual scrolling:

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.items = [];
    this.itemHeight = 50;
    this.visibleCount = 20;
    this.scrollTop = 0;
  }

  connectedCallback() {
    this.unsubscribe = subscribe('list.items', (msg) => {
      this.items = msg.data.items;
      this.render();
    });

    this.render();
  }

  render() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.items.length
    );

    const visibleItems = this.items.slice(startIndex, endIndex);
    const totalHeight = this.items.length * this.itemHeight;
    const offsetY = startIndex * this.itemHeight;

    this.innerHTML = `
      <div class="virtual-list" style="height: 400px; overflow-y: auto;">
        <div style="height: ${totalHeight}px; position: relative;">
          <div style="transform: translateY(${offsetY}px);">
            ${visibleItems.map(item => `
              <div style="height: ${this.itemHeight}px;">${item.name}</div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    this.querySelector('.virtual-list').addEventListener('scroll', (e) => {
      this.scrollTop = e.target.scrollTop;
      this.render();
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('virtual-list', VirtualList);
```

### Technique: Memoization

Avoid re-rendering when nothing has changed:

```javascript
class MemoizedComponent extends HTMLElement {
  constructor() {
    super();
    this.lastData = null;
  }

  connectedCallback() {
    this.unsubscribe = subscribe('data.updated', (msg) => {
      // Only re-render if data actually changed
      if (JSON.stringify(msg.data) !== JSON.stringify(this.lastData)) {
        this.lastData = msg.data;
        this.render();
      }
    });

    this.render();
  }

  render() {
    // Expensive rendering logic...
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

## Testing Components

Components built with web standards are easy to test. Here's a simple test using a standard test framework:

```javascript
import { expect } from 'chai';
import { publish, subscribe } from '@larc/core';
import './shopping-cart.js';

describe('ShoppingCart', () => {
  let cart;

  beforeEach(() => {
    cart = document.createElement('shopping-cart');
    document.body.appendChild(cart);
  });

  afterEach(() => {
    cart.remove();
  });

  it('starts empty', () => {
    expect(cart.items).to.have.length(0);
  });

  it('adds items when cart.item.added is published', (done) => {
    subscribe('cart.updated', (msg) => {
      expect(msg.data.items).to.have.length(1);
      expect(msg.data.items[0].name).to.equal('Widget');
      done();
    });

    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });
  });

  it('calculates total correctly', (done) => {
    subscribe('cart.updated', (msg) => {
      expect(msg.data.total).to.equal(30);
      done();
    });

    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 3
    });
  });
});
```

Because components communicate through messages, testing is straightforward: publish messages, subscribe to responses, and assert the results.

## Wrapping Up

You've now mastered the art of building components in LARC. You understand the component lifecycle, when to use Shadow DOM, how to connect components via the PAN bus, and how to design reusable, composable components that stand the test of time.

The key insight is this: components in LARC are independent, loosely-coupled modules that communicate through messages. They don't know about each other, don't depend on each other, and can be added, removed, or replaced without touching existing code. This architecture scales beautifully from tiny prototypes to massive applications.

In the next chapter, we'll tackle state management—one of the thorniest problems in modern web development. You'll learn how to manage local and shared state, persist data to IndexedDB and OPFS, synchronize state across components, and handle conflicts gracefully. Get ready—state management is where LARC's architecture truly shines.

But first, take a break. Build a few components. Connect them through the PAN bus. Watch them interact. The best way to internalize these patterns is to use them. And when you inevitably build a component that's too big, too complex, or too tightly coupled, you'll feel the pain firsthand—and you'll understand why the principles in this chapter matter.

See you in Chapter 8.
