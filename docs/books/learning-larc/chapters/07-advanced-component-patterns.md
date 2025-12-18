# Chapter 7: Advanced Component Patterns

As your LARC applications grow, you'll encounter scenarios that require sophisticated component architectures. This chapter explores advanced patterns that enable code reuse, flexible composition, and optimal performance.

These patterns come from years of component-based development across frameworks. LARC implements them using web standards, making them portable and future-proof.

## Compound Components

Compound components work together as a set, sharing implicit state. Think of HTML's `<select>` and `<option>` elements—they form a cohesive unit.

### Basic Compound Component

```javascript
// tabs.js - Container component
class TabGroup extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.activeTab = 0;
  }

  connectedCallback() {
    this.render();
    this.setupTabs();
  }

  setupTabs() {
    // Get all tab headers
    const headers = this.querySelectorAll('tab-header');
    headers.forEach((header, index) => {
      header.addEventListener('click', () => {
        this.activeTab = index;
        this.updateTabs();
      });
    });

    this.updateTabs();
  }

  updateTabs() {
    // Update headers
    const headers = this.querySelectorAll('tab-header');
    headers.forEach((header, index) => {
      header.active = index === this.activeTab;
    });

    // Update panels
    const panels = this.querySelectorAll('tab-panel');
    panels.forEach((panel, index) => {
      panel.active = index === this.activeTab;
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .headers {
          display: flex;
          border-bottom: 2px solid #e2e8f0;
        }
        .panels {
          padding: 16px 0;
        }
      </style>
      <div class="headers">
        <slot name="headers"></slot>
      </div>
      <div class="panels">
        <slot name="panels"></slot>
      </div>
    `;
  }
}

// tab-header.js
class TabHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set active(value) {
    this._active = value;
    this.render();
  }

  connectedCallback() {
    this.render();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          padding: 12px 24px;
          border: none;
          background: ${this._active ? '#667eea' : 'transparent'};
          color: ${this._active ? 'white' : '#4a5568'};
          cursor: pointer;
          font-weight: ${this._active ? '600' : '400'};
          transition: all 0.2s;
        }
        button:hover {
          background: ${this._active ? '#5a67d8' : '#f7fafc'};
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}

// tab-panel.js
class TabPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  set active(value) {
    this._active = value;
    this.style.display = value ? 'block' : 'none';
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
      </style>
      <slot></slot>
    `;
  }
}

customElements.define('tab-group', TabGroup);
customElements.define('tab-header', TabHeader);
customElements.define('tab-panel', TabPanel);
```

**Usage:**

```html
<tab-group>
  <tab-header slot="headers">Profile</tab-header>
  <tab-header slot="headers">Settings</tab-header>
  <tab-header slot="headers">Billing</tab-header>

  <tab-panel slot="panels">
    <h2>Profile Content</h2>
    <p>User profile information...</p>
  </tab-panel>

  <tab-panel slot="panels">
    <h2>Settings Content</h2>
    <p>Application settings...</p>
  </tab-panel>

  <tab-panel slot="panels">
    <h2>Billing Content</h2>
    <p>Billing information...</p>
  </tab-panel>
</tab-group>
```

### Context API for Compound Components

Share state without prop drilling:

```javascript
// lib/context.js
const contexts = new WeakMap();

export function createContext(defaultValue) {
  return {
    Provider: class extends HTMLElement {
      constructor() {
        super();
        this.value = defaultValue;
        contexts.set(this, this.value);
      }

      provide(value) {
        this.value = value;
        contexts.set(this, value);
        this.notifyConsumers();
      }

      notifyConsumers() {
        const consumers = this.querySelectorAll('[data-context-consumer]');
        consumers.forEach(consumer => {
          if (consumer.onContextChange) {
            consumer.onContextChange(this.value);
          }
        });
      }

      connectedCallback() {
        this.innerHTML = `<slot></slot>`;
      }
    },

    Consumer: class extends HTMLElement {
      connectedCallback() {
        this.setAttribute('data-context-consumer', '');

        // Find provider up the tree
        let provider = this.closest('[data-context-provider]');
        if (provider && contexts.has(provider)) {
          this.onContextChange(contexts.get(provider));
        }
      }

      onContextChange(value) {
        // Override in subclasses
      }
    }
  };
}
```

**Usage:**

```javascript
// Create context
const ThemeContext = createContext({ theme: 'light' });

// Provider component
class ThemeProvider extends ThemeContext.Provider {
  connectedCallback() {
    super.connectedCallback();
    this.setAttribute('data-context-provider', '');

    this.provide({
      theme: 'light',
      toggleTheme: () => {
        const newTheme = this.value.theme === 'light' ? 'dark' : 'light';
        this.provide({ ...this.value, theme: newTheme });
      }
    });
  }
}

// Consumer component
class ThemedButton extends ThemeContext.Consumer {
  onContextChange(context) {
    this.context = context;
    this.render();
  }

  render() {
    const { theme } = this.context || { theme: 'light' };

    this.innerHTML = `
      <button style="
        background: ${theme === 'dark' ? '#333' : '#fff'};
        color: ${theme === 'dark' ? '#fff' : '#333'};
      ">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('theme-provider', ThemeProvider);
customElements.define('themed-button', ThemedButton);
```

```html
<theme-provider>
  <themed-button>Light/Dark</themed-button>
  <themed-button>Another Button</themed-button>
</theme-provider>
```

## Higher-Order Components

Higher-order components (HOCs) wrap other components to add functionality.

### Mixin Pattern

JavaScript mixins add functionality to classes:

```javascript
// mixins/observable.js
export const ObservableMixin = (Base) => class extends Base {
  constructor() {
    super();
    this._observers = new Map();
  }

  observe(property, callback) {
    if (!this._observers.has(property)) {
      this._observers.set(property, new Set());
    }
    this._observers.get(property).add(callback);

    // Return unobserve function
    return () => {
      this._observers.get(property)?.delete(callback);
    };
  }

  notify(property, value) {
    this._observers.get(property)?.forEach(callback => {
      callback(value);
    });
  }

  set(property, value) {
    this[`_${property}`] = value;
    this.notify(property, value);
  }

  get(property) {
    return this[`_${property}`];
  }
};

// mixins/resizable.js
export const ResizableMixin = (Base) => class extends Base {
  connectedCallback() {
    super.connectedCallback?.();

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.onResize?.(entry.contentRect);
      }
    });

    this.resizeObserver.observe(this);
  }

  disconnectedCallback() {
    super.disconnectedCallback?.();
    this.resizeObserver?.disconnect();
  }
};

// mixins/loading.js
export const LoadingMixin = (Base) => class extends Base {
  constructor() {
    super();
    this._loading = false;
  }

  startLoading() {
    this._loading = true;
    this.setAttribute('loading', '');
    this.onLoadingChange?.(true);
  }

  stopLoading() {
    this._loading = false;
    this.removeAttribute('loading');
    this.onLoadingChange?.(false);
  }

  get loading() {
    return this._loading;
  }
};
```

**Usage:**

```javascript
import { ObservableMixin } from './mixins/observable.js';
import { ResizableMixin } from './mixins/resizable.js';
import { LoadingMixin } from './mixins/loading.js';

// Compose multiple mixins
class DataTable extends LoadingMixin(ResizableMixin(ObservableMixin(HTMLElement))) {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    super.connectedCallback();

    // Use Observable mixin
    this.observe('data', (data) => {
      console.log('Data changed:', data);
      this.render();
    });

    // Use Loading mixin
    this.startLoading();
    const data = await this.fetchData();
    this.set('data', data);
    this.stopLoading();
  }

  // Use Resizable mixin
  onResize(rect) {
    console.log('Component resized:', rect.width, rect.height);
    this.updateLayout();
  }

  onLoadingChange(loading) {
    this.render();
  }

  async fetchData() {
    const response = await fetch('/api/data');
    return response.json();
  }

  render() {
    // Render based on state
  }
}

customElements.define('data-table', DataTable);
```

### Decorator Pattern

Wrap components to enhance them:

```javascript
// decorators/with-loading.js
export function withLoading(ComponentClass) {
  return class extends ComponentClass {
    constructor() {
      super();
      this._originalConnectedCallback = this.connectedCallback;
    }

    connectedCallback() {
      // Inject loading overlay
      const loadingOverlay = document.createElement('div');
      loadingOverlay.className = 'loading-overlay';
      loadingOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255,255,255,0.8);
        display: none;
        align-items: center;
        justify-content: center;
      `;
      loadingOverlay.innerHTML = '<div class="spinner"></div>';

      this.appendChild(loadingOverlay);
      this._loadingOverlay = loadingOverlay;

      // Call original
      if (this._originalConnectedCallback) {
        this._originalConnectedCallback.call(this);
      }
    }

    showLoading() {
      if (this._loadingOverlay) {
        this._loadingOverlay.style.display = 'flex';
      }
    }

    hideLoading() {
      if (this._loadingOverlay) {
        this._loadingOverlay.style.display = 'none';
      }
    }
  };
}

// Usage
class UserProfile extends HTMLElement {
  async connectedCallback() {
    this.showLoading();

    const user = await fetch('/api/user').then(r => r.json());
    this.render(user);

    this.hideLoading();
  }

  render(user) {
    this.innerHTML = `<h1>${user.name}</h1>`;
  }
}

// Apply decorator
const UserProfileWithLoading = withLoading(UserProfile);
customElements.define('user-profile', UserProfileWithLoading);
```

## Component Composition

Build complex UIs from simple, focused components.

### Container/Presentational Pattern

Separate logic from presentation:

```javascript
// Presentational - no logic, just rendering
class UserCard extends HTMLElement {
  set user(value) {
    this._user = value;
    this.render();
  }

  render() {
    if (!this._user) return;

    this.innerHTML = `
      <div class="card">
        <img src="${this._user.avatar}" alt="${this._user.name}">
        <h3>${this._user.name}</h3>
        <p>${this._user.email}</p>
        <button class="follow-btn">Follow</button>
      </div>
    `;

    // Emit events, don't handle logic
    this.querySelector('.follow-btn').addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('follow', {
        detail: { userId: this._user.id }
      }));
    });
  }
}

// Container - handles logic and data
class UserCardContainer extends HTMLElement {
  async connectedCallback() {
    const userId = this.getAttribute('user-id');

    // Fetch data
    this.user = await this.fetchUser(userId);

    // Create presentational component
    const card = document.createElement('user-card');
    card.user = this.user;

    // Handle events
    card.addEventListener('follow', (e) => {
      this.followUser(e.detail.userId);
    });

    this.appendChild(card);
  }

  async fetchUser(id) {
    const response = await fetch(`/api/users/${id}`);
    return response.json();
  }

  async followUser(userId) {
    await fetch(`/api/users/${userId}/follow`, { method: 'POST' });
    pan.publish('user.followed', { userId });
  }
}

customElements.define('user-card', UserCard);
customElements.define('user-card-container', UserCardContainer);
```

### Render Props Pattern

Pass rendering logic as a slot:

```javascript
class DataProvider extends HTMLElement {
  async connectedCallback() {
    const url = this.getAttribute('url');

    // Render loading state
    this.innerHTML = '<slot name="loading">Loading...</slot>';

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Render with data
      const renderSlot = this.querySelector('[slot="render"]');
      if (renderSlot) {
        renderSlot.data = data;
        this.innerHTML = '';
        this.appendChild(renderSlot);
      }
    } catch (error) {
      // Render error state
      this.innerHTML = `<slot name="error">Error: ${error.message}</slot>`;
    }
  }
}

customElements.define('data-provider', DataProvider);
```

**Usage:**

```html
<data-provider url="/api/users">
  <div slot="loading">
    <spinner-component></spinner-component>
  </div>

  <user-list slot="render"></user-list>

  <div slot="error">
    <error-message></error-message>
  </div>
</data-provider>
```

## Slots and Content Projection

Slots are powerful for flexible component composition.

### Named Slots

```javascript
class CardComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          overflow: hidden;
        }
        .header {
          background: #f7fafc;
          padding: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        .body {
          padding: 16px;
        }
        .footer {
          background: #f7fafc;
          padding: 12px 16px;
          border-top: 1px solid #e2e8f0;
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }
      </style>

      <div class="card">
        <div class="header">
          <slot name="header">Default Header</slot>
        </div>
        <div class="body">
          <slot></slot>
        </div>
        <div class="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('card-component', CardComponent);
```

**Usage:**

```html
<card-component>
  <h2 slot="header">User Profile</h2>

  <!-- Default slot -->
  <p>User profile content goes here...</p>

  <div slot="footer">
    <button>Save</button>
    <button>Cancel</button>
  </div>
</card-component>
```

### Slot Change Detection

React to slot content changes:

```javascript
class DynamicList extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        .count { font-weight: bold; color: #667eea; }
      </style>
      <div class="count"></div>
      <slot></slot>
    `;

    // Listen for slot changes
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', () => {
      this.updateCount();
    });

    this.updateCount();
  }

  updateCount() {
    const slot = this.shadowRoot.querySelector('slot');
    const elements = slot.assignedElements();

    const count = this.shadowRoot.querySelector('.count');
    count.textContent = `${elements.length} items`;
  }
}

customElements.define('dynamic-list', DynamicList);
```

**Usage:**

```html
<dynamic-list>
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</dynamic-list>

<script>
  const list = document.querySelector('dynamic-list');

  // Add item dynamically
  const newItem = document.createElement('div');
  newItem.textContent = 'Item 4';
  list.appendChild(newItem);
  // Count automatically updates!
</script>
```

### Conditional Slots

Show/hide content based on slot presence:

```javascript
class ConditionalCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    const hasHeader = this.querySelector('[slot="header"]') !== null;
    const hasFooter = this.querySelector('[slot="footer"]') !== null;

    this.shadowRoot.innerHTML = `
      <style>
        .card { border: 1px solid #ddd; border-radius: 8px; }
        .header, .footer { background: #f5f5f5; padding: 16px; }
        .body { padding: 16px; }
        .hidden { display: none; }
      </style>

      <div class="card">
        <div class="header ${hasHeader ? '' : 'hidden'}">
          <slot name="header"></slot>
        </div>
        <div class="body">
          <slot></slot>
        </div>
        <div class="footer ${hasFooter ? '' : 'hidden'}">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }
}

customElements.define('conditional-card', ConditionalCard);
```

## Dynamic Component Loading

Load components on demand for better performance.

### Lazy Loading

```javascript
class LazyLoader extends HTMLElement {
  async connectedCallback() {
    const component = this.getAttribute('component');
    const src = this.getAttribute('src');

    // Show placeholder
    this.innerHTML = '<div>Loading component...</div>';

    try {
      // Dynamically import component
      await import(src);

      // Wait for component to be defined
      await customElements.whenDefined(component);

      // Create and append component
      const element = document.createElement(component);

      // Copy attributes
      Array.from(this.attributes).forEach(attr => {
        if (attr.name !== 'component' && attr.name !== 'src') {
          element.setAttribute(attr.name, attr.value);
        }
      });

      this.innerHTML = '';
      this.appendChild(element);
    } catch (error) {
      this.innerHTML = `<div class="error">Failed to load component: ${error.message}</div>`;
    }
  }
}

customElements.define('lazy-loader', LazyLoader);
```

**Usage:**

```html
<!-- Component loads when added to DOM -->
<lazy-loader
  component="heavy-chart"
  src="/components/heavy-chart.js"
  data-url="/api/chart-data">
</lazy-loader>
```

### Intersection Observer for Viewport Loading

Load components when they enter the viewport:

```javascript
class ViewportLoader extends HTMLElement {
  connectedCallback() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !this.loaded) {
          this.load();
        }
      });
    }, {
      rootMargin: '50px'  // Start loading 50px before visible
    });

    this.observer.observe(this);
  }

  disconnectedCallback() {
    this.observer?.disconnect();
  }

  async load() {
    this.loaded = true;
    const component = this.getAttribute('component');
    const src = this.getAttribute('src');

    await import(src);
    await customElements.whenDefined(component);

    const element = document.createElement(component);
    Array.from(this.attributes).forEach(attr => {
      if (!['component', 'src'].includes(attr.name)) {
        element.setAttribute(attr.name, attr.value);
      }
    });

    this.appendChild(element);
  }
}

customElements.define('viewport-loader', ViewportLoader);
```

**Usage:**

```html
<!-- Heavy image gallery - only loads when scrolled into view -->
<viewport-loader
  component="image-gallery"
  src="/components/image-gallery.js"
  album-id="123">
</viewport-loader>
```

## Performance Optimization

### Virtual Scrolling

Render only visible items in long lists:

```javascript
class VirtualList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

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
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          overflow-y: auto;
          position: relative;
        }
        .viewport {
          position: relative;
        }
        .item {
          position: absolute;
          left: 0;
          right: 0;
          height: ${this.itemHeight}px;
          display: flex;
          align-items: center;
          padding: 0 16px;
          border-bottom: 1px solid #eee;
        }
      </style>
      <div class="viewport"></div>
    `;

    this.viewport = this.shadowRoot.querySelector('.viewport');

    this.addEventListener('scroll', () => {
      this.scrollTop = this.scrollTop;
      this.renderVisibleItems();
    });
  }

  render() {
    if (!this.viewport) return;

    // Set total height
    const totalHeight = this.items.length * this.itemHeight;
    this.viewport.style.height = `${totalHeight}px`;

    this.renderVisibleItems();
  }

  renderVisibleItems() {
    const startIndex = Math.floor(this.scrollTop / this.itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount,
      this.items.length
    );

    // Clear existing items
    this.viewport.innerHTML = '';

    // Render only visible items
    for (let i = startIndex; i < endIndex; i++) {
      const item = document.createElement('div');
      item.className = 'item';
      item.style.top = `${i * this.itemHeight}px`;
      item.textContent = this.items[i];

      this.viewport.appendChild(item);
    }
  }
}

customElements.define('virtual-list', VirtualList);
```

**Usage:**

```javascript
const list = document.createElement('virtual-list');
list.data = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);
list.style.height = '400px';
document.body.appendChild(list);
```

### Memoization

Cache expensive computations:

```javascript
class MemoizedComponent extends HTMLElement {
  constructor() {
    super();
    this.cache = new Map();
  }

  memoize(fn, keyFn) {
    return (...args) => {
      const key = keyFn ? keyFn(...args) : JSON.stringify(args);

      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const result = fn(...args);
      this.cache.set(key, result);

      return result;
    };
  }

  computeExpensiveValue = this.memoize(
    (data) => {
      // Expensive computation
      console.log('Computing...');
      return data.reduce((acc, val) => acc + val.price, 0);
    },
    (data) => data.map(d => d.id).join(',')
  );

  connectedCallback() {
    const data = [
      { id: 1, price: 100 },
      { id: 2, price: 200 }
    ];

    // First call - computes
    console.log(this.computeExpensiveValue(data));

    // Second call - cached
    console.log(this.computeExpensiveValue(data));
  }
}
```

### Debouncing and Throttling

Limit expensive operations:

```javascript
// lib/performance.js
export function debounce(fn, delay) {
  let timeoutId;

  return function(...args) {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;

  return function(...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;

      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// Usage
class SearchBox extends HTMLElement {
  constructor() {
    super();

    // Debounce search - wait for user to stop typing
    this.handleSearch = debounce(this.search.bind(this), 300);

    // Throttle scroll - limit updates
    this.handleScroll = throttle(this.onScroll.bind(this), 100);
  }

  connectedCallback() {
    this.innerHTML = '<input type="search" placeholder="Search...">';

    this.querySelector('input').addEventListener('input', (e) => {
      this.handleSearch(e.target.value);
    });

    window.addEventListener('scroll', this.handleScroll);
  }

  search(query) {
    console.log('Searching for:', query);
    // Perform search
  }

  onScroll() {
    console.log('Scrolled');
    // Update UI based on scroll
  }
}
```

## Summary

This chapter explored advanced component patterns:

- **Compound Components**: Components that work together as a cohesive unit
- **Higher-Order Components**: Mixins and decorators for code reuse
- **Component Composition**: Container/presentational pattern and render props
- **Slots**: Named slots, slot change detection, and conditional rendering
- **Dynamic Loading**: Lazy loading and viewport-based loading
- **Performance**: Virtual scrolling, memoization, debouncing, and throttling

These patterns enable you to build sophisticated, performant applications while keeping code maintainable and testable.

---

## Best Practices

1. **Favor composition over inheritance**
   - Build complex components from simple ones
   - Use slots for flexibility
   - Keep components focused

2. **Use mixins for cross-cutting concerns**
   - Observable behavior
   - Resize handling
   - Loading states

3. **Separate logic from presentation**
   - Container components handle data
   - Presentational components handle UI
   - Easier to test and reuse

4. **Lazy load heavy components**
   - Reduce initial bundle size
   - Load on demand or when visible
   - Show loading states

5. **Optimize expensive operations**
   - Memoize pure functions
   - Debounce user input
   - Throttle scroll/resize handlers
   - Use virtual scrolling for long lists

6. **Keep performance in mind**
   - Profile before optimizing
   - Measure impact of changes
   - Don't over-optimize prematurely
