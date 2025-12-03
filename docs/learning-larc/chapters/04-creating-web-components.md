# Chapter 4: Creating Web Components

Now that you've built your first LARC application, it's time to master the art of creating robust, reusable Web Components. This chapter covers everything from basic component anatomy to advanced patterns like composition, slots, and performance optimization.

By the end of this chapter, you'll be able to build production-quality components that are maintainable, testable, and performant.

## Anatomy of a LARC Component

Let's dissect a well-structured LARC component to understand its parts:

```javascript
// Import dependencies
import { pan } from '@larcjs/core';
import { formatDate } from '../lib/utils.js';

/**
 * A card component for displaying user information.
 *
 * @element user-card
 *
 * @attr {string} user-id - The ID of the user to display
 * @attr {boolean} compact - Display in compact mode
 *
 * @fires user-selected - Dispatched when card is clicked
 *
 * @slot - Default slot for additional content
 * @slot actions - Slot for action buttons
 */
class UserCard extends HTMLElement {
  // 1. Define observed attributes
  static get observedAttributes() {
    return ['user-id', 'compact'];
  }

  // 2. Constructor - initialize instance
  constructor() {
    super();

    // Attach shadow DOM
    this.attachShadow({ mode: 'open' });

    // Initialize private state
    this._user = null;
    this._loading = false;
    this._error = null;

    // Bind event handlers
    this.handleClick = this.handleClick.bind(this);
  }

  // 3. Lifecycle: connected to DOM
  connectedCallback() {
    this.render();

    // Load user data if ID is provided
    const userId = this.getAttribute('user-id');
    if (userId) {
      this.loadUser(userId);
    }

    // Subscribe to PAN events
    this.unsubscribe = pan.subscribe('user.updated', this.handleUserUpdate);

    // Add event listeners
    this.shadowRoot.addEventListener('click', this.handleClick);
  }

  // 4. Lifecycle: disconnected from DOM
  disconnectedCallback() {
    // Clean up subscriptions
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // Remove event listeners
    this.shadowRoot.removeEventListener('click', this.handleClick);
  }

  // 5. Lifecycle: attributes changed
  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'user-id' && newValue) {
      this.loadUser(newValue);
    } else if (name === 'compact') {
      this.render();
    }
  }

  // 6. Public properties with getters/setters
  get user() {
    return this._user;
  }

  set user(value) {
    this._user = value;
    this.render();
  }

  get loading() {
    return this._loading;
  }

  // 7. Public methods
  async loadUser(userId) {
    this._loading = true;
    this._error = null;
    this.render();

    try {
      const response = await fetch(`/api/users/${userId}`);
      if (!response.ok) throw new Error('Failed to load user');

      this._user = await response.json();
      this._loading = false;
      this.render();
    } catch (error) {
      this._error = error.message;
      this._loading = false;
      this.render();
    }
  }

  refresh() {
    const userId = this.getAttribute('user-id');
    if (userId) {
      this.loadUser(userId);
    }
  }

  // 8. Private methods
  handleClick(event) {
    if (!this._user) return;

    this.dispatchEvent(new CustomEvent('user-selected', {
      detail: { user: this._user },
      bubbles: true,
      composed: true
    }));
  }

  handleUserUpdate = (data) => {
    if (data.userId === this.getAttribute('user-id')) {
      this._user = data.user;
      this.render();
    }
  }

  // 9. Render method
  render() {
    const compact = this.hasAttribute('compact');

    if (this._loading) {
      this.shadowRoot.innerHTML = this.renderLoading();
      return;
    }

    if (this._error) {
      this.shadowRoot.innerHTML = this.renderError();
      return;
    }

    if (!this._user) {
      this.shadowRoot.innerHTML = this.renderEmpty();
      return;
    }

    this.shadowRoot.innerHTML = compact
      ? this.renderCompact()
      : this.renderFull();
  }

  renderLoading() {
    return `
      <style>${this.styles()}</style>
      <div class="card loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>
    `;
  }

  renderError() {
    return `
      <style>${this.styles()}</style>
      <div class="card error">
        <p class="error-message">${this._error}</p>
        <button class="retry">Retry</button>
      </div>
    `;
  }

  renderEmpty() {
    return `
      <style>${this.styles()}</style>
      <div class="card empty">
        <p>No user data</p>
      </div>
    `;
  }

  renderCompact() {
    return `
      <style>${this.styles()}</style>
      <div class="card compact">
        <img src="${this._user.avatar}" alt="${this._user.name}">
        <div class="info">
          <h3>${this._user.name}</h3>
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  renderFull() {
    return `
      <style>${this.styles()}</style>
      <div class="card">
        <div class="header">
          <img src="${this._user.avatar}" alt="${this._user.name}" class="avatar">
          <div class="header-content">
            <h2>${this._user.name}</h2>
            <p class="email">${this._user.email}</p>
          </div>
        </div>
        <div class="body">
          <p class="bio">${this._user.bio || 'No bio available'}</p>
          <div class="meta">
            <span>Joined ${formatDate(this._user.createdAt)}</span>
          </div>
          <slot></slot>
        </div>
        <div class="footer">
          <slot name="actions"></slot>
        </div>
      </div>
    `;
  }

  // 10. Styles
  styles() {
    return `
      :host {
        display: block;
        cursor: pointer;
      }

      .card {
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        padding: 16px;
        transition: box-shadow 0.2s;
      }

      .card:hover {
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }

      .header {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;
      }

      .avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        color: #333;
      }

      .email {
        margin: 4px 0 0 0;
        font-size: 14px;
        color: #666;
      }

      .bio {
        color: #444;
        line-height: 1.5;
      }

      .meta {
        font-size: 12px;
        color: #999;
        margin-top: 12px;
      }

      .loading, .error, .empty {
        text-align: center;
        padding: 40px 20px;
        color: #666;
      }

      .spinner {
        border: 3px solid #f3f3f3;
        border-top: 3px solid #667eea;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .error-message {
        color: #e53e3e;
      }

      .compact {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
      }

      .compact img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
      }

      .compact h3 {
        margin: 0;
        font-size: 14px;
      }
    `;
  }
}

// 11. Register the custom element
customElements.define('user-card', UserCard);

// 12. Export for use in other modules
export default UserCard;
```

### Component Structure Breakdown

**1. Documentation:**

- JSDoc comments explain usage
- Attribute, property, event, and slot documentation
- Helps other developers understand the component

**2. Static Properties:**

- `observedAttributes` defines which attributes trigger `attributeChangedCallback`
- Keep this list minimal for performance

**3. Constructor:**

- Initialize instance variables
- Attach shadow DOM
- Bind methods (for event handlers)
- Don't access attributes or DOM here

**4. Lifecycle Methods:**

- `connectedCallback`: Setup when added to DOM
- `disconnectedCallback`: Cleanup when removed
- `attributeChangedCallback`: Respond to attribute changes

**5. Properties:**

- Use private fields (`_user`) for internal state
- Provide getters/setters for public API
- Setters can trigger re-renders

**6. Methods:**

- Public methods for external use
- Private methods (conventionally start with `_` or use `#` private fields)
- Keep methods focused and single-purpose

**7. Rendering:**

- Separate render logic from state management
- Multiple render methods for different states
- Extract styles to a separate method

## Shadow DOM Deep Dive

Shadow DOM is one of the most powerful features of Web Components. It provides true encapsulation for both markup and styles.

### Creating Shadow DOM

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();

    // Create shadow root
    this.attachShadow({ mode: 'open' });

    // mode: 'open' - shadow root accessible via element.shadowRoot
    // mode: 'closed' - shadow root not accessible (rarely used)
  }
}
```

### Shadow DOM vs Light DOM

```html
<my-component>
  <!-- This is Light DOM (regular DOM) -->
  <p>Visible content</p>
</my-component>

<script>
  class MyComponent extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' });

      // This is Shadow DOM
      this.shadowRoot.innerHTML = `
        <div class="shadow-content">
          <h2>Shadow DOM Content</h2>
          <slot></slot>
        </div>
      `;
    }
  }

  customElements.define('my-component', MyComponent);
</script>
```

**Result:**

- Light DOM (`<p>Visible content</p>`) is projected into the `<slot>`
- Shadow DOM provides the structure and styling
- Styles in shadow DOM don't leak out
- Styles from light DOM don't leak in

### Style Encapsulation

```javascript
class StyledButton extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        /* These styles only affect this component */
        button {
          background: blue;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
        }

        button:hover {
          background: darkblue;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}
```

**Key Points:**

- Styles inside shadow DOM are scoped
- No conflicts with global styles
- No CSS class name collisions
- True component encapsulation

### The :host Selector

Style the component itself:

```css
:host {
  display: block;
  margin: 16px 0;
}

/* Style host when it has a class */
:host(.highlighted) {
  border: 2px solid gold;
}

/* Style host when it has an attribute */
:host([disabled]) {
  opacity: 0.5;
  pointer-events: none;
}

/* Style host in specific contexts */
:host-context(.dark-theme) {
  background: #333;
  color: white;
}
```

### CSS Custom Properties (Variables)

CSS variables pierce the shadow DOM boundary:

```javascript
// Component defines and uses variables
class ThemedCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          background: var(--card-bg, white);
          color: var(--card-text, black);
          border: 1px solid var(--card-border, #ddd);
          border-radius: var(--card-radius, 8px);
          padding: var(--card-padding, 16px);
        }
      </style>
      <slot></slot>
    `;
  }
}
```

**Usage:**
```html
<style>
  /* Override component variables from outside */
  themed-card {
    --card-bg: #f0f0f0;
    --card-text: #333;
    --card-border: #ccc;
    --card-radius: 12px;
  }

  themed-card.dark {
    --card-bg: #333;
    --card-text: #fff;
    --card-border: #555;
  }
</style>

<themed-card>Normal theme</themed-card>
<themed-card class="dark">Dark theme</themed-card>
```

This pattern allows theming while maintaining encapsulation.

### Parts and ::part()

Expose specific shadow DOM elements for styling:

```javascript
class FancyButton extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        button { /* default styles */ }
        .icon { /* icon styles */ }
      </style>
      <button part="button">
        <span part="icon" class="icon">→</span>
        <slot></slot>
      </button>
    `;
  }
}
```

**Style from outside:**
```css
fancy-button::part(button) {
  background: linear-gradient(135deg, #667eea, #764ba2);
}

fancy-button::part(icon) {
  color: gold;
}
```

This gives consumers more control while maintaining encapsulation.

## Attributes and Properties

Understanding the difference between attributes and properties is crucial for component design.

### Attributes vs Properties

**Attributes:**

- HTML attributes (`<my-el foo="bar">`)
- Always strings
- Visible in HTML
- Trigger `attributeChangedCallback`

**Properties:**

- JavaScript properties (`element.foo = 123`)
- Any type (string, number, object, etc.)
- Not visible in HTML
- Direct access, no callback

### Reflecting Properties to Attributes

```javascript
class ToggleButton extends HTMLElement {
  static get observedAttributes() {
    return ['checked'];
  }

  constructor() {
    super();
    this._checked = false;
  }

  // Property getter
  get checked() {
    return this._checked;
  }

  // Property setter - reflects to attribute
  set checked(value) {
    const isChecked = Boolean(value);

    if (isChecked) {
      this.setAttribute('checked', '');
    } else {
      this.removeAttribute('checked');
    }
  }

  // Attribute changed - updates property
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'checked') {
      this._checked = newValue !== null;
      this.render();
    }
  }

  render() {
    this.innerHTML = `
      <button class="${this._checked ? 'checked' : ''}">
        ${this._checked ? '✓' : '○'}
      </button>
    `;
  }
}
```

**Usage:**
```html
<!-- Set via attribute -->
<toggle-button checked></toggle-button>

<script>
  const toggle = document.querySelector('toggle-button');

  // Set via property
  toggle.checked = true;

  // Get property
  console.log(toggle.checked); // true

  // Check attribute
  console.log(toggle.hasAttribute('checked')); // true
</script>
```

### When to Use Each

**Use Attributes for:**

- Simple configuration (strings, numbers, booleans)
- Values that should be visible in HTML
- Initial configuration from HTML
- Values that need to work with CSS selectors

**Use Properties for:**

- Complex data (objects, arrays, functions)
- Data that changes frequently
- Large data that shouldn't serialize to HTML
- Callback functions

### Type Conversion

Attributes are always strings, so convert appropriately:

```javascript
attributeChangedCallback(name, oldValue, newValue) {
  if (name === 'count') {
    this._count = Number(newValue) || 0;
  } else if (name === 'enabled') {
    this._enabled = newValue !== null; // Boolean attribute
  } else if (name === 'options') {
    try {
      this._options = JSON.parse(newValue);
    } catch {
      this._options = {};
    }
  }
}
```

### Boolean Attributes

Follow HTML conventions:

```javascript
// Boolean attribute: presence = true, absence = false
if (this.hasAttribute('disabled')) {
  // Is disabled
}

// Set boolean attribute
this.setAttribute('disabled', ''); // value doesn't matter

// Remove boolean attribute
this.removeAttribute('disabled');
```

## Component Styling

### Internal Styles

Most styles should be in shadow DOM:

```javascript
styles() {
  return `
    :host {
      display: block;
    }

    .container {
      padding: 16px;
    }

    /* All your component styles */
  `;
}
```

### External Stylesheets

For larger components, link external styles:

```javascript
connectedCallback() {
  this.attachShadow({ mode: 'open' });

  this.shadowRoot.innerHTML = `
    <link rel="stylesheet" href="/styles/components/user-card.css">
    <div class="user-card">
      <!-- content -->
    </div>
  `;
}
```

### Adoptable Stylesheets

Share styles between component instances:

```javascript
// Create shared stylesheet once
const sheet = new CSSStyleSheet();
sheet.replaceSync(`
  .card {
    padding: 16px;
    border-radius: 8px;
    background: white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
`);

class CardComponent extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    // Adopt shared stylesheet (very fast)
    this.shadowRoot.adoptedStyleSheets = [sheet];

    this.shadowRoot.innerHTML = `
      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}
```

**Benefits:**

- Styles parsed once, shared across instances
- Better performance with many components
- Modify shared styles dynamically

### Theming Strategies

**Strategy 1: CSS Custom Properties**

```javascript
class ThemedComponent extends HTMLElement {
  styles() {
    return `
      :host {
        --primary-color: var(--app-primary, #667eea);
        --background: var(--app-bg, white);
        --text: var(--app-text, #333);
      }

      .content {
        background: var(--background);
        color: var(--text);
      }

      button {
        background: var(--primary-color);
      }
    `;
  }
}
```

**Strategy 2: Class-Based Themes**

```javascript
class ThemeAwareComponent extends HTMLElement {
  connectedCallback() {
    // Observe theme changes on documentElement
    const observer = new MutationObserver(() => {
      this.updateTheme();
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    this.updateTheme();
  }

  updateTheme() {
    const theme = document.documentElement.dataset.theme || 'light';
    this.setAttribute('theme', theme);
  }

  styles() {
    return `
      :host([theme="light"]) {
        background: white;
        color: black;
      }

      :host([theme="dark"]) {
        background: #333;
        color: white;
      }
    `;
  }
}
```

**Strategy 3: PAN-Based Themes**

```javascript
import { pan } from '@larcjs/core';

class PanThemedComponent extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = pan.subscribe('app.theme.changed', ({ theme }) => {
      this.applyTheme(theme);
    });

    // Request current theme
    pan.request('app.theme.get').then(theme => {
      this.applyTheme(theme);
    });
  }

  applyTheme(theme) {
    this.setAttribute('data-theme', theme);
  }
}
```

## Lifecycle Methods (Advanced Patterns)

### Deferred Rendering

Wait for dependencies before rendering:

```javascript
class DataDisplay extends HTMLElement {
  async connectedCallback() {
    // Wait for dependencies to load
    await customElements.whenDefined('loading-spinner');
    await customElements.whenDefined('error-message');

    // Now render
    this.render();
  }
}
```

### Preventing Memory Leaks

```javascript
class WebSocketComponent extends HTMLElement {
  connectedCallback() {
    this.ws = new WebSocket('wss://api.example.com');

    this.ws.onmessage = (event) => {
      this.handleMessage(event.data);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  disconnectedCallback() {
    // Clean up WebSocket connection
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}
```

### Handling Rapid Reconnection

Components can be disconnected and reconnected quickly:

```javascript
class RobustComponent extends HTMLElement {
  connectedCallback() {
    // Might be called multiple times
    // Use a guard to prevent duplicate setup
    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this.setup();
  }

  disconnectedCallback() {
    // Use setTimeout to debounce
    this._cleanupTimer = setTimeout(() => {
      this.cleanup();
      this._initialized = false;
    }, 100);
  }

  connectedCallback() {
    // Cancel cleanup if reconnected quickly
    if (this._cleanupTimer) {
      clearTimeout(this._cleanupTimer);
      this._cleanupTimer = null;
    }

    if (this._initialized) {
      return;
    }

    this._initialized = true;
    this.setup();
  }
}
```

## Testing Components

### Unit Testing

Test components in isolation:

```javascript
// tests/user-card.test.js
import { expect } from '@open-wc/testing';
import '../src/components/user-card.js';

describe('UserCard', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('user-card');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it('renders empty state by default', () => {
    const emptyText = element.shadowRoot.querySelector('.empty');
    expect(emptyText).to.exist;
  });

  it('loads user when user-id attribute is set', async () => {
    // Mock fetch
    global.fetch = async () => ({
      ok: true,
      json: async () => ({ id: 1, name: 'John Doe', email: 'john@example.com' })
    });

    element.setAttribute('user-id', '1');

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 100));

    const name = element.shadowRoot.querySelector('h2');
    expect(name.textContent).to.equal('John Doe');
  });

  it('handles loading state', async () => {
    element.setAttribute('user-id', '1');

    const spinner = element.shadowRoot.querySelector('.spinner');
    expect(spinner).to.exist;
  });

  it('dispatches user-selected event on click', async () => {
    element._user = { id: 1, name: 'John' };
    element.render();

    let eventData = null;
    element.addEventListener('user-selected', (e) => {
      eventData = e.detail;
    });

    element.shadowRoot.querySelector('.card').click();

    expect(eventData).to.deep.equal({ user: { id: 1, name: 'John' } });
  });
});
```

### Integration Testing

Test components working together:

```javascript
// tests/counter-integration.test.js
describe('Counter Integration', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <counter-display></counter-display>
      <counter-controls></counter-controls>
    `;
  });

  it('updates display when controls are clicked', async () => {
    const display = document.querySelector('counter-display');
    const controls = document.querySelector('counter-controls');

    const incrementBtn = controls.shadowRoot.querySelector('#increment');
    incrementBtn.click();

    await new Promise(resolve => setTimeout(resolve, 50));

    const displayValue = display.shadowRoot.querySelector('.display').textContent;
    expect(displayValue).to.equal('1');
  });
});
```

### Visual Regression Testing

Catch visual bugs:

```javascript
// tests/visual.test.js
import puppeteer from 'puppeteer';
import pixelmatch from 'pixelmatch';

describe('Visual Regression', () => {
  let browser, page;

  beforeAll(async () => {
    browser = await puppeteer.launch();
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  it('user-card matches snapshot', async () => {
    await page.goto('http://localhost:3000/tests/user-card.html');

    const screenshot = await page.screenshot({ fullPage: true });
    const baseline = fs.readFileSync('tests/snapshots/user-card.png');

    const diff = pixelmatch(screenshot, baseline, null, 800, 600, {
      threshold: 0.1
    });

    expect(diff).to.be.lessThan(100); // Allow small differences
  });
});
```

## Summary

This chapter covered:

- **Component Anatomy**: Structure, lifecycle, and organization
- **Shadow DOM**: Encapsulation, slots, and styling
- **Attributes vs Properties**: When to use each and how to reflect them
- **Component Styling**: Internal styles, theming, and CSS custom properties
- **Lifecycle Patterns**: Memory management and robust connection handling
- **Testing**: Unit, integration, and visual regression testing

You now know how to build production-quality Web Components. The next chapter explores the PAN bus in depth, showing you how to orchestrate component communication at scale.

---

## Best Practices

1. **Always clean up in `disconnectedCallback`**
   - Remove event listeners
   - Cancel pending operations
   - Unsubscribe from events

2. **Use Shadow DOM for encapsulation**
   - Keep styles scoped
   - Avoid global style pollution
   - Use `:host` and CSS custom properties for theming

3. **Reflect important properties to attributes**
   - Makes state visible in HTML
   - Enables CSS selectors
   - Improves debugging

4. **Keep components focused**
   - Single responsibility principle
   - Compose larger components from smaller ones
   - Extract shared logic to utilities

5. **Test early and often**
   - Write tests as you build components
   - Test both happy paths and error cases
   - Use integration tests for component interaction
