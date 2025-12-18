# Recipes and Patterns

This appendix provides practical, copy-paste-ready solutions for common LARC development scenarios. Each recipe demonstrates a specific technique or pattern you'll encounter when building real applications. Use these as starting points, adapting them to your specific requirements.

## Recipe 1: Lazy-Loading Components

Defer component loading until needed, reducing initial bundle size.

```javascript
class LazyLoader extends HTMLElement {
  async connectedCallback() {
    const componentName = this.getAttribute('component');
    const modulePath = this.getAttribute('module');

    try {
      await import(modulePath);
      const element = document.createElement(componentName);
      Array.from(this.attributes).forEach(attr => {
        if (attr.name !== 'component' && attr.name !== 'module') {
          element.setAttribute(attr.name, attr.value);
        }
      });
      this.replaceWith(element);
    } catch (error) {
      this.innerHTML = `<div class="error">Failed to load component</div>`;
      console.error('Lazy load failed:', error);
    }
  }
}

customElements.define('lazy-loader', LazyLoader);
```

**Usage:**
```html
<lazy-loader
  component="data-table"
  module="/components/data-table.js"
  data-source="/api/users">
</lazy-loader>
```

**When to Use:**
- Large components used infrequently
- Route-based code splitting
- Conditional feature loading based on user permissions

## Recipe 2: Form Validation Component

Reusable form validation with real-time feedback.

```javascript
class ValidatedForm extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.validators = new Map();
    this.errors = new Map();

    this.shadowRoot.innerHTML = `
      <style>
        .field { margin-bottom: 1rem; }
        .error { color: #d32f2f; font-size: 0.875rem; margin-top: 0.25rem; }
        .valid { border-color: #4caf50; }
        .invalid { border-color: #d32f2f; }
      </style>
      <form>
        <slot></slot>
        <div class="actions">
          <button type="submit">Submit</button>
        </div>
      </form>
    `;

    this.setupValidation();
  }

  setupValidation() {
    const form = this.shadowRoot.querySelector('form');
    const inputs = this.querySelectorAll('[data-validate]');

    inputs.forEach(input => {
      const rules = input.getAttribute('data-validate').split(',');
      this.validators.set(input, rules);

      input.addEventListener('blur', () => this.validateField(input));
      input.addEventListener('input', () => {
        if (this.errors.has(input)) {
          this.validateField(input);
        }
      });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (this.validateAll()) {
        this.handleSubmit();
      }
    });
  }

  validateField(input) {
    const rules = this.validators.get(input);
    const value = input.value.trim();
    let error = null;

    for (const rule of rules) {
      if (rule === 'required' && !value) {
        error = 'This field is required';
        break;
      }
      if (rule === 'email' && !this.isValidEmail(value)) {
        error = 'Invalid email address';
        break;
      }
      if (rule.startsWith('min:')) {
        const min = parseInt(rule.split(':')[1]);
        if (value.length < min) {
          error = `Minimum ${min} characters required`;
          break;
        }
      }
      if (rule.startsWith('max:')) {
        const max = parseInt(rule.split(':')[1]);
        if (value.length > max) {
          error = `Maximum ${max} characters allowed`;
          break;
        }
      }
    }

    this.updateFieldError(input, error);
    return !error;
  }

  updateFieldError(input, error) {
    input.classList.toggle('invalid', !!error);
    input.classList.toggle('valid', !error);

    let errorDiv = input.nextElementSibling;
    if (errorDiv && errorDiv.classList.contains('error')) {
      errorDiv.remove();
    }

    if (error) {
      this.errors.set(input, error);
      errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = error;
      input.after(errorDiv);
    } else {
      this.errors.delete(input);
    }
  }

  validateAll() {
    let isValid = true;
    this.validators.forEach((rules, input) => {
      if (!this.validateField(input)) {
        isValid = false;
      }
    });
    return isValid;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  handleSubmit() {
    const formData = new FormData(this.querySelector('form'));
    this.pan.dispatch('form:submitted', Object.fromEntries(formData));
  }
}

customElements.define('validated-form', ValidatedForm);
```

**Usage:**
```html
<validated-form>
  <div class="field">
    <label>Email</label>
    <input type="email" name="email" data-validate="required,email">
  </div>
  <div class="field">
    <label>Password</label>
    <input type="password" name="password" data-validate="required,min:8">
  </div>
</validated-form>
```

## Recipe 3: Infinite Scroll List

Load data progressively as user scrolls.

```javascript
class InfiniteList extends HTMLElement {
  constructor() {
    super();
    this.page = 1;
    this.loading = false;
    this.hasMore = true;
  }

  connectedCallback() {
    this.apiEndpoint = this.getAttribute('api');
    this.setupIntersectionObserver();
    this.loadMore();
  }

  setupIntersectionObserver() {
    const sentinel = document.createElement('div');
    sentinel.className = 'scroll-sentinel';
    this.appendChild(sentinel);

    this.observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !this.loading && this.hasMore) {
        this.loadMore();
      }
    }, { threshold: 0.1 });

    this.observer.observe(sentinel);
  }

  async loadMore() {
    this.loading = true;
    this.showLoadingIndicator();

    try {
      const response = await fetch(`${this.apiEndpoint}?page=${this.page}`);
      const data = await response.json();

      if (data.items.length === 0) {
        this.hasMore = false;
        this.hideLoadingIndicator();
        return;
      }

      this.renderItems(data.items);
      this.page++;
    } catch (error) {
      console.error('Failed to load items:', error);
      this.pan.dispatch('error', { message: 'Failed to load items' });
    } finally {
      this.loading = false;
      this.hideLoadingIndicator();
    }
  }

  renderItems(items) {
    const sentinel = this.querySelector('.scroll-sentinel');
    items.forEach(item => {
      const element = this.createItemElement(item);
      this.insertBefore(element, sentinel);
    });
  }

  createItemElement(item) {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.description}</p>
    `;
    return div;
  }

  showLoadingIndicator() {
    let loader = this.querySelector('.loader');
    if (!loader) {
      loader = document.createElement('div');
      loader.className = 'loader';
      loader.textContent = 'Loading...';
      this.appendChild(loader);
    }
  }

  hideLoadingIndicator() {
    const loader = this.querySelector('.loader');
    if (loader) loader.remove();
  }

  disconnectedCallback() {
    if (this.observer) {
      this.observer.disconnect();
    }
  }
}

customElements.define('infinite-list', InfiniteList);
```

## Recipe 4: Toast Notification System

Display temporary user notifications.

```javascript
class ToastContainer extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 1rem;
          right: 1rem;
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-width: 400px;
        }
        .toast {
          padding: 1rem 1.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          gap: 0.75rem;
          animation: slideIn 0.3s ease;
        }
        .toast.success { background: #4caf50; color: white; }
        .toast.error { background: #f44336; color: white; }
        .toast.info { background: #2196f3; color: white; }
        .toast.warning { background: #ff9800; color: white; }
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .close {
          margin-left: auto;
          cursor: pointer;
          font-size: 1.25rem;
          opacity: 0.8;
        }
        .close:hover { opacity: 1; }
      </style>
    `;

    this.pan.subscribe('toast:show', (event) => {
      this.showToast(event.detail);
    });
  }

  showToast({ message, type = 'info', duration = 3000 }) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="message">${message}</span>
      <span class="close">&times;</span>
    `;

    toast.querySelector('.close').addEventListener('click', () => {
      this.removeToast(toast);
    });

    this.shadowRoot.appendChild(toast);

    if (duration > 0) {
      setTimeout(() => this.removeToast(toast), duration);
    }
  }

  removeToast(toast) {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }
}

customElements.define('toast-container', ToastContainer);
```

**Usage:**
```javascript
// Anywhere in your app
this.pan.dispatch('toast:show', {
  message: 'Settings saved successfully',
  type: 'success',
  duration: 3000
});
```

## Recipe 5: Debounced Search Input

Optimize API calls by debouncing user input.

```javascript
class SearchInput extends HTMLElement {
  constructor() {
    super();
    this.debounceTimer = null;
    this.debounceDelay = parseInt(this.getAttribute('debounce')) || 300;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="search-wrapper">
        <input type="search" placeholder="Search...">
        <span class="spinner" style="display: none;">[hourglass]</span>
      </div>
      <div class="results"></div>
    `;

    this.input = this.querySelector('input');
    this.spinner = this.querySelector('.spinner');
    this.resultsContainer = this.querySelector('.results');

    this.input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });

    this.pan.subscribe('search:results', (event) => {
      this.displayResults(event.detail);
    });
  }

  handleInput(value) {
    clearTimeout(this.debounceTimer);

    if (!value.trim()) {
      this.resultsContainer.innerHTML = '';
      return;
    }

    this.showSpinner();

    this.debounceTimer = setTimeout(() => {
      this.performSearch(value);
    }, this.debounceDelay);
  }

  async performSearch(query) {
    try {
      const apiEndpoint = this.getAttribute('api');
      const response = await fetch(`${apiEndpoint}?q=${encodeURIComponent(query)}`);
      const results = await response.json();
      this.pan.dispatch('search:results', results);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      this.hideSpinner();
    }
  }

  displayResults(results) {
    if (results.length === 0) {
      this.resultsContainer.innerHTML = '<div class="no-results">No results found</div>';
      return;
    }

    this.resultsContainer.innerHTML = results
      .map(result => `<div class="result-item">${result.title}</div>`)
      .join('');
  }

  showSpinner() {
    this.spinner.style.display = 'inline';
  }

  hideSpinner() {
    this.spinner.style.display = 'none';
  }
}

customElements.define('search-input', SearchInput);
```

## Recipe 6: Modal Dialog

Accessible modal with focus trapping.

```javascript
class ModalDialog extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 9999;
        }
        :host([open]) { display: block; }
        .backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }
        .modal {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 0.5rem;
          padding: 2rem;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }
        .close {
          position: absolute;
          top: 1rem;
          right: 1rem;
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }
      </style>
      <div class="backdrop"></div>
      <div class="modal" role="dialog" aria-modal="true">
        <button class="close" aria-label="Close">&times;</button>
        <slot></slot>
      </div>
    `;

    this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => this.close());
    this.shadowRoot.querySelector('.close').addEventListener('click', () => this.close());

    this.pan.subscribe('modal:open', (event) => {
      if (event.detail.id === this.id) {
        this.open();
      }
    });
  }

  open() {
    this.setAttribute('open', '');
    this.previousFocus = document.activeElement;
    this.trapFocus();
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.removeAttribute('open');
    document.body.style.overflow = '';
    if (this.previousFocus) {
      this.previousFocus.focus();
    }
    this.pan.dispatch('modal:closed', { id: this.id });
  }

  trapFocus() {
    const focusableElements = this.shadowRoot.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    this.keydownHandler = (e) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    this.addEventListener('keydown', this.keydownHandler);
    firstElement?.focus();
  }

  disconnectedCallback() {
    if (this.keydownHandler) {
      this.removeEventListener('keydown', this.keydownHandler);
    }
  }
}

customElements.define('modal-dialog', ModalDialog);
```

## Recipe 7: State Persistence

Save and restore component state to localStorage.

```javascript
class StatefulComponent extends HTMLElement {
  constructor() {
    super();
    this.storageKey = this.getAttribute('storage-key') || 'component-state';
    this.state = this.loadState();
  }

  loadState() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : this.getDefaultState();
    } catch (error) {
      console.error('Failed to load state:', error);
      return this.getDefaultState();
    }
  }

  saveState() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      this.pan.dispatch('state:saved', { key: this.storageKey });
    } catch (error) {
      console.error('Failed to save state:', error);
      this.pan.dispatch('state:error', { error: error.message });
    }
  }

  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.saveState();
    this.render();
  }

  getDefaultState() {
    return {};
  }

  clearState() {
    localStorage.removeItem(this.storageKey);
    this.state = this.getDefaultState();
    this.render();
  }
}
```

## Recipe 8: Drag and Drop

Reorderable list with drag-and-drop.

```javascript
class DraggableList extends HTMLElement {
  connectedCallback() {
    this.addEventListener('dragstart', this.handleDragStart.bind(this));
    this.addEventListener('dragover', this.handleDragOver.bind(this));
    this.addEventListener('drop', this.handleDrop.bind(this));
    this.addEventListener('dragend', this.handleDragEnd.bind(this));

    this.makeItemsDraggable();
  }

  makeItemsDraggable() {
    this.querySelectorAll('.draggable-item').forEach(item => {
      item.setAttribute('draggable', 'true');
    });
  }

  handleDragStart(e) {
    if (!e.target.classList.contains('draggable-item')) return;
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.innerHTML);
  }

  handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const dragging = this.querySelector('.dragging');
    const afterElement = this.getDragAfterElement(e.clientY);

    if (afterElement == null) {
      this.appendChild(dragging);
    } else {
      this.insertBefore(dragging, afterElement);
    }
  }

  handleDrop(e) {
    e.stopPropagation();
    this.dispatchReorderEvent();
  }

  handleDragEnd(e) {
    e.target.classList.remove('dragging');
  }

  getDragAfterElement(y) {
    const draggableElements = [
      ...this.querySelectorAll('.draggable-item:not(.dragging)')
    ];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;

      if (offset < 0 && offset > closest.offset) {
        return { offset: offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  dispatchReorderEvent() {
    const order = Array.from(this.querySelectorAll('.draggable-item'))
      .map((item, index) => ({ index, id: item.dataset.id }));
    this.pan.dispatch('list:reordered', order);
  }
}

customElements.define('draggable-list', DraggableList);
```

## Recipe 9: Responsive Image

Automatically load appropriate image sizes.

```javascript
class ResponsiveImage extends HTMLElement {
  connectedCallback() {
    this.sources = JSON.parse(this.getAttribute('sources'));
    this.alt = this.getAttribute('alt') || '';

    this.render();
    window.addEventListener('resize', () => this.handleResize());
  }

  render() {
    const src = this.selectSource();
    this.innerHTML = `<img src="${src}" alt="${this.alt}" loading="lazy">`;
  }

  selectSource() {
    const width = window.innerWidth;
    const sorted = Object.entries(this.sources)
      .sort(([a], [b]) => parseInt(a) - parseInt(b));

    for (const [breakpoint, url] of sorted) {
      if (width <= parseInt(breakpoint)) {
        return url;
      }
    }

    return sorted[sorted.length - 1][1];
  }

  handleResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      const currentSrc = this.querySelector('img').src;
      const newSrc = this.selectSource();
      if (currentSrc !== newSrc) {
        this.render();
      }
    }, 250);
  }
}

customElements.define('responsive-image', ResponsiveImage);
```

**Usage:**
```html
<responsive-image
  sources='{"480": "/img/small.jpg", "1024": "/img/medium.jpg", "1920": "/img/large.jpg"}'
  alt="Product photo">
</responsive-image>
```

## Recipe 10: Event Bus Bridge

Bridge LARC PAN bus events to external systems.

```javascript
class EventBridge extends HTMLElement {
  connectedCallback() {
    this.externalSystem = this.getAttribute('target');
    this.eventMap = JSON.parse(this.getAttribute('event-map') || '{}');

    Object.keys(this.eventMap).forEach(panEvent => {
      this.pan.subscribe(panEvent, (event) => {
        this.bridgeEvent(panEvent, event.detail);
      });
    });
  }

  bridgeEvent(panEvent, data) {
    const externalEvent = this.eventMap[panEvent];

    switch (this.externalSystem) {
      case 'analytics':
        this.sendToAnalytics(externalEvent, data);
        break;
      case 'websocket':
        this.sendToWebSocket(externalEvent, data);
        break;
      case 'postmessage':
        this.sendToParent(externalEvent, data);
        break;
    }
  }

  sendToAnalytics(event, data) {
    if (window.gtag) {
      window.gtag('event', event, data);
    }
  }

  sendToWebSocket(event, data) {
    if (this.websocket?.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify({ type: event, payload: data }));
    }
  }

  sendToParent(event, data) {
    window.parent.postMessage({ type: event, payload: data }, '*');
  }
}

customElements.define('event-bridge', EventBridge);
```

## Common Patterns

### Pattern: Component Composition

Build complex components from simpler ones.

```javascript
class UserProfile extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <user-avatar user-id="${this.getAttribute('user-id')}"></user-avatar>
      <user-details user-id="${this.getAttribute('user-id')}"></user-details>
      <user-actions user-id="${this.getAttribute('user-id')}"></user-actions>
    `;
  }
}
```

### Pattern: Higher-Order Components

Wrap components with additional functionality.

```javascript
function withLoading(ComponentClass) {
  return class extends ComponentClass {
    connectedCallback() {
      this.showLoader();
      super.connectedCallback();
    }

    showLoader() {
      this.innerHTML = '<div class="loader">Loading...</div>';
    }
  };
}

customElements.define('user-card', withLoading(UserCard));
```

### Pattern: Singleton Services

Share a single instance across components.

```javascript
class DataCache {
  static instance = null;

  static getInstance() {
    if (!DataCache.instance) {
      DataCache.instance = new DataCache();
    }
    return DataCache.instance;
  }

  constructor() {
    this.cache = new Map();
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, value) {
    this.cache.set(key, value);
  }
}
```

## Anti-Patterns to Avoid

### Anti-Pattern: Tight Coupling

**Bad:**
```javascript
class ComponentA extends HTMLElement {
  connectedCallback() {
    document.querySelector('component-b').doSomething();
  }
}
```

**Good:**
```javascript
class ComponentA extends HTMLElement {
  connectedCallback() {
    this.pan.dispatch('action:requested', { data });
  }
}
```

### Anti-Pattern: Massive Components

**Bad:** 500-line components handling everything.

**Good:** Break into focused, single-responsibility components.

### Anti-Pattern: Ignoring Lifecycle

**Bad:**
```javascript
class BadComponent extends HTMLElement {
  constructor() {
    super();
    this.innerHTML = '<div>Content</div>'; // Too early!
  }
}
```

**Good:**
```javascript
class GoodComponent extends HTMLElement {
  connectedCallback() {
    this.innerHTML = '<div>Content</div>';
  }
}
```

### Anti-Pattern: Manual Memory Leaks

**Bad:**
```javascript
connectedCallback() {
  this.pan.subscribe('event', handler);
  // Never unsubscribed!
}
```

**Good:**
```javascript
connectedCallback() {
  this.unsubscribe = this.pan.subscribe('event', handler);
}

disconnectedCallback() {
  this.unsubscribe();
}
```

These recipes provide battle-tested solutions for common scenarios. Adapt them to your needs, understanding the principles behind each pattern. The best code is readable, maintainable, and solves the problem at hand without unnecessary complexity.
