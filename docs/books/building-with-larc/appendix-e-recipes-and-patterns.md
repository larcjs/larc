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

## Recipe 11: File Upload with Progress

Multi-file upload with progress tracking and validation.

```javascript
class FileUpload extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.maxSize = parseInt(this.getAttribute('max-size')) || 5 * 1024 * 1024; // 5MB
    this.accept = this.getAttribute('accept') || '*/*';
    this.multiple = this.hasAttribute('multiple');

    this.shadowRoot.innerHTML = `
      <style>
        .upload-area {
          border: 2px dashed #ccc;
          border-radius: 0.5rem;
          padding: 2rem;
          text-align: center;
          cursor: pointer;
          transition: border-color 0.3s;
        }
        .upload-area:hover { border-color: #2196f3; }
        .upload-area.dragover { border-color: #4caf50; background: #f0f8f0; }
        .file-list { margin-top: 1rem; }
        .file-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .progress-bar {
          flex: 1;
          height: 8px;
          background: #e0e0e0;
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: #4caf50;
          transition: width 0.3s;
        }
        .remove-btn {
          background: #f44336;
          color: white;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          cursor: pointer;
        }
        .error { color: #f44336; font-size: 0.875rem; }
      </style>
      <div class="upload-area">
        <input type="file" style="display: none" accept="${this.accept}" ${this.multiple ? 'multiple' : ''}>
        <p>📁 Drag files here or click to browse</p>
      </div>
      <div class="file-list"></div>
    `;

    this.uploadArea = this.shadowRoot.querySelector('.upload-area');
    this.fileInput = this.shadowRoot.querySelector('input[type="file"]');
    this.fileList = this.shadowRoot.querySelector('.file-list');

    this.setupEvents();
  }

  setupEvents() {
    this.uploadArea.addEventListener('click', () => this.fileInput.click());
    this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));

    this.uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.uploadArea.classList.add('dragover');
    });

    this.uploadArea.addEventListener('dragleave', () => {
      this.uploadArea.classList.remove('dragover');
    });

    this.uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.uploadArea.classList.remove('dragover');
      this.handleFiles(e.dataTransfer.files);
    });
  }

  handleFiles(files) {
    Array.from(files).forEach(file => {
      if (file.size > this.maxSize) {
        this.showError(`${file.name} exceeds ${this.maxSize / 1024 / 1024}MB limit`);
        return;
      }
      this.uploadFile(file);
    });
  }

  async uploadFile(file) {
    const fileId = Date.now() + Math.random();
    const fileItem = this.createFileItem(file, fileId);
    this.fileList.appendChild(fileItem);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(this.getAttribute('upload-url') || '/api/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-File-Name': file.name
        }
      });

      if (!response.ok) throw new Error('Upload failed');

      const result = await response.json();
      this.updateProgress(fileId, 100);
      this.pan.dispatch('file:uploaded', { file: file.name, result });
    } catch (error) {
      this.showError(`Failed to upload ${file.name}`);
      fileItem.querySelector('.progress-bar').style.display = 'none';
      fileItem.querySelector('.error').textContent = error.message;
    }
  }

  createFileItem(file, id) {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.id = id;
    div.innerHTML = `
      <span>${file.name} (${(file.size / 1024).toFixed(1)}KB)</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: 0%"></div>
      </div>
      <button class="remove-btn">Remove</button>
      <div class="error"></div>
    `;

    div.querySelector('.remove-btn').addEventListener('click', () => {
      div.remove();
      this.pan.dispatch('file:removed', { file: file.name });
    });

    return div;
  }

  updateProgress(fileId, percent) {
    const item = this.fileList.querySelector(`[data-id="${fileId}"]`);
    if (item) {
      const fill = item.querySelector('.progress-fill');
      fill.style.width = `${percent}%`;
    }
  }

  showError(message) {
    const error = document.createElement('div');
    error.className = 'error';
    error.textContent = message;
    this.fileList.appendChild(error);
    setTimeout(() => error.remove(), 5000);
  }
}

customElements.define('file-upload', FileUpload);
```

## Recipe 12: Autocomplete Input

Dropdown suggestions with keyboard navigation.

```javascript
class AutocompleteInput extends HTMLElement {
  constructor() {
    super();
    this.selectedIndex = -1;
    this.suggestions = [];
  }

  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        .wrapper { position: relative; }
        input {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ccc;
          border-radius: 0.25rem;
        }
        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 1px solid #ccc;
          border-top: none;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
          display: none;
        }
        .suggestions.open { display: block; }
        .suggestion {
          padding: 0.5rem;
          cursor: pointer;
        }
        .suggestion:hover, .suggestion.selected {
          background: #f0f0f0;
        }
      </style>
      <div class="wrapper">
        <input type="text" placeholder="${this.getAttribute('placeholder') || 'Search...'}">
        <div class="suggestions"></div>
      </div>
    `;

    this.input = this.shadowRoot.querySelector('input');
    this.dropdown = this.shadowRoot.querySelector('.suggestions');

    this.setupEvents();
  }

  setupEvents() {
    this.input.addEventListener('input', (e) => this.handleInput(e.target.value));
    this.input.addEventListener('keydown', (e) => this.handleKeydown(e));
    this.input.addEventListener('blur', () => setTimeout(() => this.hideDropdown(), 200));

    this.dropdown.addEventListener('click', (e) => {
      if (e.target.classList.contains('suggestion')) {
        this.selectSuggestion(e.target.textContent);
      }
    });
  }

  async handleInput(value) {
    if (value.length < 2) {
      this.hideDropdown();
      return;
    }

    try {
      const apiUrl = this.getAttribute('api');
      const response = await fetch(`${apiUrl}?q=${encodeURIComponent(value)}`);
      this.suggestions = await response.json();
      this.renderSuggestions();
    } catch (error) {
      console.error('Autocomplete failed:', error);
    }
  }

  renderSuggestions() {
    if (this.suggestions.length === 0) {
      this.hideDropdown();
      return;
    }

    this.dropdown.innerHTML = this.suggestions
      .map(s => `<div class="suggestion">${s}</div>`)
      .join('');
    this.dropdown.classList.add('open');
    this.selectedIndex = -1;
  }

  handleKeydown(e) {
    const items = this.dropdown.querySelectorAll('.suggestion');

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, items.length - 1);
        this.updateSelection(items);
        break;
      case 'ArrowUp':
        e.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        this.updateSelection(items);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(items[this.selectedIndex].textContent);
        }
        break;
      case 'Escape':
        this.hideDropdown();
        break;
    }
  }

  updateSelection(items) {
    items.forEach((item, i) => {
      item.classList.toggle('selected', i === this.selectedIndex);
    });
  }

  selectSuggestion(value) {
    this.input.value = value;
    this.hideDropdown();
    this.pan.dispatch('autocomplete:selected', { value });
  }

  hideDropdown() {
    this.dropdown.classList.remove('open');
    this.selectedIndex = -1;
  }
}

customElements.define('autocomplete-input', AutocompleteInput);
```

## Recipe 13: Sortable Data Table

Table with sortable columns and highlighting.

```javascript
class SortableTable extends HTMLElement {
  constructor() {
    super();
    this.sortColumn = null;
    this.sortDirection = 'asc';
  }

  connectedCallback() {
    this.data = JSON.parse(this.getAttribute('data') || '[]');
    this.columns = JSON.parse(this.getAttribute('columns') || '[]');
    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; }
        th {
          background: #f5f5f5;
          padding: 0.75rem;
          text-align: left;
          cursor: pointer;
          user-select: none;
        }
        th:hover { background: #e0e0e0; }
        th.sorted::after {
          content: '↑';
          margin-left: 0.5rem;
        }
        th.sorted.desc::after { content: '↓'; }
        td { padding: 0.75rem; border-top: 1px solid #ddd; }
        tr:hover { background: #f9f9f9; }
      </style>
      <table>
        <thead>
          <tr>
            ${this.columns.map(col => `
              <th data-key="${col.key}">${col.label}</th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${this.renderRows()}
        </tbody>
      </table>
    `;

    this.querySelectorAll('th').forEach(th => {
      th.addEventListener('click', () => this.handleSort(th.dataset.key));
    });
  }

  renderRows() {
    return this.data.map(row => `
      <tr>
        ${this.columns.map(col => `<td>${row[col.key] || ''}</td>`).join('')}
      </tr>
    `).join('');
  }

  handleSort(key) {
    if (this.sortColumn === key) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = key;
      this.sortDirection = 'asc';
    }

    this.data.sort((a, b) => {
      const aVal = a[key];
      const bVal = b[key];
      const modifier = this.sortDirection === 'asc' ? 1 : -1;

      if (typeof aVal === 'number') {
        return (aVal - bVal) * modifier;
      }
      return String(aVal).localeCompare(String(bVal)) * modifier;
    });

    this.render();
    this.updateSortIndicator();
  }

  updateSortIndicator() {
    this.querySelectorAll('th').forEach(th => {
      th.classList.remove('sorted', 'desc');
      if (th.dataset.key === this.sortColumn) {
        th.classList.add('sorted');
        if (this.sortDirection === 'desc') {
          th.classList.add('desc');
        }
      }
    });
  }
}

customElements.define('sortable-table', SortableTable);
```

## Recipe 14: Tabs Component

Accessible tabs with keyboard support.

```javascript
class TabsComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.currentTab = 0;
    this.render();
    this.setupKeyboardNav();
  }

  render() {
    const tabs = Array.from(this.querySelectorAll('[slot^="tab-"]'));
    const panels = Array.from(this.querySelectorAll('[slot^="panel-"]'));

    this.shadowRoot.innerHTML = `
      <style>
        .tabs {
          display: flex;
          border-bottom: 2px solid #ddd;
          gap: 0.5rem;
        }
        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          transition: all 0.3s;
        }
        .tab:hover { background: #f5f5f5; }
        .tab[aria-selected="true"] {
          border-bottom-color: #2196f3;
          color: #2196f3;
        }
        .panel {
          padding: 1.5rem 0;
          display: none;
        }
        .panel[aria-hidden="false"] { display: block; }
      </style>
      <div class="tabs" role="tablist">
        ${tabs.map((tab, i) => `
          <button
            class="tab"
            role="tab"
            aria-selected="${i === 0}"
            aria-controls="panel-${i}"
            id="tab-${i}"
            tabindex="${i === 0 ? 0 : -1}">
            ${tab.textContent}
          </button>
        `).join('')}
      </div>
      ${panels.map((panel, i) => `
        <div
          class="panel"
          role="tabpanel"
          id="panel-${i}"
          aria-labelledby="tab-${i}"
          aria-hidden="${i !== 0}">
          <slot name="panel-${i}"></slot>
        </div>
      `).join('')}
    `;

    this.shadowRoot.querySelectorAll('.tab').forEach((tab, i) => {
      tab.addEventListener('click', () => this.selectTab(i));
    });
  }

  selectTab(index) {
    this.currentTab = index;

    this.shadowRoot.querySelectorAll('.tab').forEach((tab, i) => {
      tab.setAttribute('aria-selected', i === index);
      tab.setAttribute('tabindex', i === index ? 0 : -1);
    });

    this.shadowRoot.querySelectorAll('.panel').forEach((panel, i) => {
      panel.setAttribute('aria-hidden', i !== index);
    });

    this.pan.dispatch('tab:changed', { index });
  }

  setupKeyboardNav() {
    this.shadowRoot.querySelector('.tabs').addEventListener('keydown', (e) => {
      const tabs = this.shadowRoot.querySelectorAll('.tab');
      let newIndex = this.currentTab;

      switch (e.key) {
        case 'ArrowLeft':
          newIndex = Math.max(0, this.currentTab - 1);
          break;
        case 'ArrowRight':
          newIndex = Math.min(tabs.length - 1, this.currentTab + 1);
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      this.selectTab(newIndex);
      tabs[newIndex].focus();
    });
  }
}

customElements.define('tabs-component', TabsComponent);
```

**Usage:**
```html
<tabs-component>
  <span slot="tab-0">Overview</span>
  <span slot="tab-1">Details</span>
  <span slot="tab-2">Reviews</span>
  
  <div slot="panel-0"><p>Overview content...</p></div>
  <div slot="panel-1"><p>Details content...</p></div>
  <div slot="panel-2"><p>Reviews content...</p></div>
</tabs-component>
```

## Recipe 15: Accordion Component

Expandable sections with smooth animations.

```javascript
class AccordionComponent extends HTMLElement {
  connectedCallback() {
    this.allowMultiple = this.hasAttribute('allow-multiple');
    this.render();
  }

  render() {
    const items = Array.from(this.querySelectorAll('[slot^="item-"]'));
    
    this.innerHTML = `
      <style>
        .accordion-item {
          border: 1px solid #ddd;
          margin-bottom: 0.5rem;
          border-radius: 0.25rem;
        }
        .accordion-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          background: #f5f5f5;
          cursor: pointer;
          user-select: none;
        }
        .accordion-header:hover { background: #e0e0e0; }
        .accordion-icon {
          transition: transform 0.3s;
        }
        .accordion-item.open .accordion-icon {
          transform: rotate(180deg);
        }
        .accordion-content {
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }
        .accordion-item.open .accordion-content {
          max-height: 500px;
        }
        .accordion-body {
          padding: 1rem;
        }
      </style>
      ${items.map((item, i) => {
        const title = item.querySelector('[slot="title"]')?.textContent || `Section ${i + 1}`;
        const content = item.querySelector('[slot="content"]')?.innerHTML || '';
        
        return `
          <div class="accordion-item" data-index="${i}">
            <div class="accordion-header">
              <span>${title}</span>
              <span class="accordion-icon">▼</span>
            </div>
            <div class="accordion-content">
              <div class="accordion-body">${content}</div>
            </div>
          </div>
        `;
      }).join('')}
    `;

    this.querySelectorAll('.accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const item = header.parentElement;
        this.toggleItem(item);
      });
    });
  }

  toggleItem(item) {
    const isOpen = item.classList.contains('open');

    if (!this.allowMultiple) {
      this.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
      });
    }

    if (!isOpen) {
      item.classList.add('open');
      this.pan.dispatch('accordion:opened', { index: item.dataset.index });
    } else {
      item.classList.remove('open');
      this.pan.dispatch('accordion:closed', { index: item.dataset.index });
    }
  }
}

customElements.define('accordion-component', AccordionComponent);
```

## Recipe 16: Context Menu

Right-click custom menu.

```javascript
class ContextMenu extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.items = JSON.parse(this.getAttribute('items') || '[]');
    this.render();
    this.setupTriggers();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          z-index: 10000;
          display: none;
        }
        :host(.visible) { display: block; }
        .menu {
          background: white;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-width: 150px;
        }
        .menu-item {
          padding: 0.5rem 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .menu-item:hover { background: #f5f5f5; }
        .menu-separator {
          height: 1px;
          background: #ddd;
          margin: 0.25rem 0;
        }
      </style>
      <div class="menu">
        ${this.items.map(item => 
          item.separator 
            ? '<div class="menu-separator"></div>'
            : `<div class="menu-item" data-action="${item.action}">
                 ${item.icon || ''} ${item.label}
               </div>`
        ).join('')}
      </div>
    `;

    this.shadowRoot.querySelectorAll('.menu-item').forEach(item => {
      item.addEventListener('click', () => {
        this.handleAction(item.dataset.action);
        this.hide();
      });
    });
  }

  setupTriggers() {
    const target = this.getAttribute('target');
    const elements = target ? document.querySelectorAll(target) : [document];

    elements.forEach(el => {
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.show(e.clientX, e.clientY, el);
      });
    });

    document.addEventListener('click', () => this.hide());
  }

  show(x, y, target) {
    this.style.left = `${x}px`;
    this.style.top = `${y}px`;
    this.classList.add('visible');
    this.currentTarget = target;
  }

  hide() {
    this.classList.remove('visible');
  }

  handleAction(action) {
    this.pan.dispatch('context-menu:action', {
      action,
      target: this.currentTarget
    });
  }
}

customElements.define('context-menu', ContextMenu);
```

**Usage:**
```html
<context-menu
  target=".list-item"
  items='[
    {"label": "Edit", "action": "edit", "icon": "✏️"},
    {"label": "Delete", "action": "delete", "icon": "🗑️"},
    {"separator": true},
    {"label": "Share", "action": "share", "icon": "🔗"}
  ]'>
</context-menu>
```

## Recipe 17: Copy to Clipboard

One-click copy with visual feedback.

```javascript
class CopyButton extends HTMLElement {
  connectedCallback() {
    this.text = this.getAttribute('text') || this.textContent;
    this.render();
  }

  render() {
    this.innerHTML = `
      <button class="copy-btn">
        <span class="icon">📋</span>
        <span class="label">Copy</span>
      </button>
      <style>
        .copy-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          background: white;
          cursor: pointer;
          transition: all 0.3s;
        }
        .copy-btn:hover {
          background: #f5f5f5;
          border-color: #2196f3;
        }
        .copy-btn.success {
          background: #4caf50;
          color: white;
          border-color: #4caf50;
        }
      </style>
    `;

    this.button = this.querySelector('.copy-btn');
    this.button.addEventListener('click', () => this.copyToClipboard());
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.text);
      this.showSuccess();
      this.pan.dispatch('clipboard:copied', { text: this.text });
    } catch (error) {
      console.error('Copy failed:', error);
      this.showError();
    }
  }

  showSuccess() {
    const icon = this.querySelector('.icon');
    const label = this.querySelector('.label');
    
    icon.textContent = '✓';
    label.textContent = 'Copied!';
    this.button.classList.add('success');

    setTimeout(() => {
      icon.textContent = '📋';
      label.textContent = 'Copy';
      this.button.classList.remove('success');
    }, 2000);
  }

  showError() {
    const label = this.querySelector('.label');
    label.textContent = 'Failed';
    setTimeout(() => {
      label.textContent = 'Copy';
    }, 2000);
  }
}

customElements.define('copy-button', CopyButton);
```

## Recipe 18: Dark Mode Toggle

Theme switching with system preference detection and persistence.

```javascript
class DarkModeToggle extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.initTheme();
    this.render();
  }

  initTheme() {
    const saved = localStorage.getItem('theme');
    const systemPrefers = window.matchMedia('(prefers-color-scheme: dark)').matches;
    this.theme = saved || (systemPrefers ? 'dark' : 'light');
    this.applyTheme();

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        this.theme = e.matches ? 'dark' : 'light';
        this.applyTheme();
      }
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: none;
          border: 1px solid var(--border-color, #ddd);
          border-radius: 2rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 1rem;
          transition: all 0.3s;
        }
        button:hover {
          background: var(--hover-bg, #f5f5f5);
        }
      </style>
      <button>
        <span class="icon">${this.theme === 'dark' ? '🌙' : '☀️'}</span>
        <span>${this.theme === 'dark' ? 'Dark' : 'Light'}</span>
      </button>
    `;

    this.shadowRoot.querySelector('button').addEventListener('click', () => this.toggle());
  }

  toggle() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    this.saveTheme();
    this.render();
  }

  applyTheme() {
    document.documentElement.setAttribute('data-theme', this.theme);
    document.documentElement.style.colorScheme = this.theme;
    this.pan.dispatch('theme:changed', { theme: this.theme });
  }

  saveTheme() {
    localStorage.setItem('theme', this.theme);
  }
}

customElements.define('dark-mode-toggle', DarkModeToggle);
```

**CSS Variables:**
```css
:root {
  --bg-color: white;
  --text-color: #333;
  --border-color: #ddd;
}

[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #f0f0f0;
  --border-color: #444;
}

body {
  background: var(--bg-color);
  color: var(--text-color);
  transition: background 0.3s, color 0.3s;
}
```

## Recipe 19: Skeleton Loader

Loading placeholders for better perceived performance.

```javascript
class SkeletonLoader extends HTMLElement {
  connectedCallback() {
    this.type = this.getAttribute('type') || 'text';
    this.lines = parseInt(this.getAttribute('lines')) || 3;
    this.render();
  }

  render() {
    const templates = {
      text: this.renderTextSkeleton(),
      card: this.renderCardSkeleton(),
      list: this.renderListSkeleton(),
      profile: this.renderProfileSkeleton()
    };

    this.innerHTML = `
      <style>
        .skeleton {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .skeleton-line {
          height: 1rem;
          background: #e0e0e0;
          border-radius: 0.25rem;
          margin-bottom: 0.5rem;
        }
        .skeleton-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #e0e0e0;
        }
        .skeleton-rect {
          height: 200px;
          background: #e0e0e0;
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
      </style>
      ${templates[this.type] || templates.text}
    `;
  }

  renderTextSkeleton() {
    return Array(this.lines)
      .fill(0)
      .map((_, i) => {
        const width = i === this.lines - 1 ? '60%' : '100%';
        return `<div class="skeleton skeleton-line" style="width: ${width}"></div>`;
      })
      .join('');
  }

  renderCardSkeleton() {
    return `
      <div class="skeleton skeleton-rect"></div>
      ${this.renderTextSkeleton()}
    `;
  }

  renderListSkeleton() {
    return Array(this.lines)
      .fill(0)
      .map(() => `
        <div style="display: flex; gap: 1rem; margin-bottom: 1rem;">
          <div class="skeleton skeleton-circle"></div>
          <div style="flex: 1;">
            <div class="skeleton skeleton-line"></div>
            <div class="skeleton skeleton-line" style="width: 70%"></div>
          </div>
        </div>
      `)
      .join('');
  }

  renderProfileSkeleton() {
    return `
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div class="skeleton skeleton-circle" style="width: 80px; height: 80px;"></div>
        <div style="flex: 1;">
          <div class="skeleton skeleton-line" style="width: 200px;"></div>
          <div class="skeleton skeleton-line" style="width: 150px;"></div>
        </div>
      </div>
    `;
  }
}

customElements.define('skeleton-loader', SkeletonLoader);
```

**Usage:**
```html
<skeleton-loader type="card" lines="3"></skeleton-loader>
<skeleton-loader type="list" lines="5"></skeleton-loader>
<skeleton-loader type="profile"></skeleton-loader>
```

## Recipe 20: Countdown Timer

Countdown timer with custom formatting.

```javascript
class CountdownTimer extends HTMLElement {
  connectedCallback() {
    this.targetDate = new Date(this.getAttribute('target')).getTime();
    this.format = this.getAttribute('format') || 'dhms'; // days, hours, minutes, seconds
    this.render();
    this.startCountdown();
  }

  render() {
    this.innerHTML = `
      <style>
        .countdown {
          display: flex;
          gap: 1rem;
          font-family: monospace;
        }
        .time-unit {
          text-align: center;
        }
        .value {
          display: block;
          font-size: 2rem;
          font-weight: bold;
        }
        .label {
          display: block;
          font-size: 0.875rem;
          color: #666;
          text-transform: uppercase;
        }
        .expired {
          color: #f44336;
          font-size: 1.5rem;
        }
      </style>
      <div class="countdown"></div>
    `;

    this.container = this.querySelector('.countdown');
  }

  startCountdown() {
    this.updateDisplay();
    this.interval = setInterval(() => this.updateDisplay(), 1000);
  }

  updateDisplay() {
    const now = Date.now();
    const distance = this.targetDate - now;

    if (distance < 0) {
      this.container.innerHTML = '<div class="expired">Time expired!</div>';
      clearInterval(this.interval);
      this.pan.dispatch('countdown:expired', { target: this.targetDate });
      return;
    }

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    const parts = [];
    if (this.format.includes('d')) parts.push({ value: days, label: 'Days' });
    if (this.format.includes('h')) parts.push({ value: hours, label: 'Hours' });
    if (this.format.includes('m')) parts.push({ value: minutes, label: 'Minutes' });
    if (this.format.includes('s')) parts.push({ value: seconds, label: 'Seconds' });

    this.container.innerHTML = parts
      .map(p => `
        <div class="time-unit">
          <span class="value">${String(p.value).padStart(2, '0')}</span>
          <span class="label">${p.label}</span>
        </div>
      `)
      .join('');
  }

  disconnectedCallback() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}

customElements.define('countdown-timer', CountdownTimer);
```

**Usage:**
```html
<countdown-timer target="2024-12-31T23:59:59" format="dhms"></countdown-timer>
```

## Recipe 21: Progress Bar

Visual progress indicator with customization.

```javascript
class ProgressBar extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.value = parseFloat(this.getAttribute('value')) || 0;
    this.max = parseFloat(this.getAttribute('max')) || 100;
    this.showLabel = this.hasAttribute('show-label');
    this.render();

    this.pan.subscribe('progress:update', (event) => {
      if (event.detail.id === this.id) {
        this.updateProgress(event.detail.value);
      }
    });
  }

  render() {
    const percent = (this.value / this.max) * 100;

    this.shadowRoot.innerHTML = `
      <style>
        .progress-container {
          width: 100%;
          background: #e0e0e0;
          border-radius: 1rem;
          overflow: hidden;
          position: relative;
        }
        .progress-bar {
          height: 2rem;
          background: linear-gradient(90deg, #4caf50, #8bc34a);
          border-radius: 1rem;
          transition: width 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
        .label {
          position: absolute;
          width: 100%;
          text-align: center;
          line-height: 2rem;
          color: ${percent > 50 ? 'white' : '#333'};
          z-index: 1;
        }
      </style>
      <div class="progress-container">
        ${this.showLabel ? `<div class="label">${percent.toFixed(0)}%</div>` : ''}
        <div class="progress-bar" style="width: ${percent}%">
        </div>
      </div>
    `;
  }

  updateProgress(value) {
    this.value = value;
    this.setAttribute('value', value);
    this.render();

    if (this.value >= this.max) {
      this.pan.dispatch('progress:complete', { id: this.id });
    }
  }

  static get observedAttributes() {
    return ['value'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'value' && oldValue !== newValue) {
      this.value = parseFloat(newValue);
      this.render();
    }
  }
}

customElements.define('progress-bar', ProgressBar);
```

**Usage:**
```html
<progress-bar id="upload-progress" value="45" max="100" show-label></progress-bar>

<script>
// Update progress
pc.publish('progress:update', { id: 'upload-progress', value: 75 });
</script>
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
