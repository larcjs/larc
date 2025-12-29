# Component Library

As your application grows, you'll accumulate reusable components. A well-organized component library accelerates development and ensures consistency.

## Organizing Components

Structure your library logically:

```
components/
├── core/
│   ├── pan-button.js
│   ├── pan-input.js
│   └── pan-card.js
├── layout/
│   ├── pan-header.js
│   ├── pan-sidebar.js
│   └── pan-grid.js
├── data/
│   ├── pan-table.js
│   ├── pan-list.js
│   └── pan-pagination.js
└── index.js
```

Export from a single entry point:

```javascript
// components/index.js
export * from './core/pan-button.js';
export * from './core/pan-input.js';
export * from './core/pan-card.js';
export * from './layout/pan-header.js';
// ...
```

## Documentation

Document every component:

```javascript
/**
 * A customizable button component.
 *
 * @element pan-button
 *
 * @attr {string} variant - Button style: "primary", "secondary", "danger"
 * @attr {boolean} disabled - Disables the button
 * @attr {string} size - Button size: "small", "medium", "large"
 *
 * @fires click - Fired when button is clicked
 *
 * @slot - Button content
 *
 * @example
 * <pan-button variant="primary">Click me</pan-button>
 *
 * @example
 * <pan-button variant="danger" disabled>Delete</pan-button>
 */
class PanButton extends HTMLElement {
  // ...
}
```

Generate documentation automatically with tools like `web-component-analyzer`:

```bash
npx web-component-analyzer analyze components/**/*.js --outFile docs.json
```

## Design Tokens

Use CSS custom properties for theming:

```css
/* tokens.css */
:root {
  /* Colors */
  --color-primary: #0066cc;
  --color-secondary: #6c757d;
  --color-success: #28a745;
  --color-danger: #dc3545;

  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;

  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-size-sm: 0.875rem;
  --font-size-md: 1rem;
  --font-size-lg: 1.25rem;

  /* Borders */
  --border-radius: 4px;
  --border-width: 1px;
  --border-color: #dee2e6;
}
```

Components use these tokens:

```javascript
class PanButton extends HTMLElement {
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
          font-family: var(--font-family);
          font-size: var(--font-size-md);
          padding: var(--space-sm) var(--space-md);
          border-radius: var(--border-radius);
          border: var(--border-width) solid transparent;
          cursor: pointer;
        }

        :host([variant="primary"]) button {
          background: var(--color-primary);
          color: white;
        }

        :host([variant="secondary"]) button {
          background: var(--color-secondary);
          color: white;
        }

        :host([disabled]) button {
          opacity: 0.5;
          cursor: not-allowed;
        }
      </style>
      <button><slot></slot></button>
    `;
  }
}
```

## Versioning and Publishing

Use semantic versioning. Publish to npm or a private registry:

```json
{
  "name": "@myorg/components",
  "version": "1.2.0",
  "type": "module",
  "exports": {
    ".": "./index.js",
    "./button": "./core/pan-button.js",
    "./card": "./core/pan-card.js"
  }
}
```

```bash
npm publish --access public
```

## Building a Complete Component

Let's build a production-ready dialog component from scratch:

```javascript
// components/core/pan-dialog.js

/**
 * A modal dialog component with accessibility support.
 *
 * @element pan-dialog
 *
 * @attr {boolean} open - Controls dialog visibility
 * @attr {string} title - Dialog title
 * @attr {boolean} modal - Whether dialog is modal (blocks background)
 * @attr {boolean} close-on-escape - Close on Escape key (default: true)
 * @attr {boolean} close-on-backdrop - Close on backdrop click (default: true)
 *
 * @fires open - Fired when dialog opens
 * @fires close - Fired when dialog closes
 * @fires cancel - Fired when user tries to close (cancelable)
 *
 * @slot - Main dialog content
 * @slot header - Custom header content
 * @slot footer - Custom footer content
 *
 * @csspart dialog - The dialog container
 * @csspart header - The header section
 * @csspart body - The body section
 * @csspart footer - The footer section
 *
 * @cssprop --dialog-width - Dialog width (default: 500px)
 * @cssprop --dialog-max-width - Maximum dialog width (default: 90vw)
 * @cssprop --dialog-backdrop - Backdrop color (default: rgba(0,0,0,0.5))
 *
 * @example
 * <pan-dialog open title="Confirm Delete">
 *   <p>Are you sure you want to delete this item?</p>
 *   <div slot="footer">
 *     <button>Cancel</button>
 *     <button>Delete</button>
 *   </div>
 * </pan-dialog>
 */
class PanDialog extends HTMLElement {
  static observedAttributes = ['open', 'title'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._previouslyFocused = null;
  }

  connectedCallback() {
    this.render();
    this.setupAccessibility();
    this.setupEventListeners();
  }

  disconnectedCallback() {
    this.removeEventListeners();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'open') {
      newValue !== null ? this.show() : this.hide();
    } else if (name === 'title') {
      this.updateTitle();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1000;
        }

        :host([open]) {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .backdrop {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: var(--dialog-backdrop, rgba(0, 0, 0, 0.5));
          animation: fadeIn 0.2s ease-out;
        }

        .dialog {
          position: relative;
          width: var(--dialog-width, 500px);
          max-width: var(--dialog-max-width, 90vw);
          max-height: 90vh;
          background: var(--dialog-bg, white);
          border-radius: var(--border-radius, 8px);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s ease-out;
        }

        .header {
          padding: var(--space-md, 16px);
          border-bottom: 1px solid var(--border-color, #e0e0e0);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .title {
          font-size: var(--font-size-lg, 1.25rem);
          font-weight: 600;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          color: var(--color-text-secondary, #666);
        }

        .close-button:hover {
          background: var(--color-hover, #f0f0f0);
        }

        .body {
          padding: var(--space-md, 16px);
          overflow-y: auto;
          flex: 1;
        }

        .footer {
          padding: var(--space-md, 16px);
          border-top: 1px solid var(--border-color, #e0e0e0);
          display: flex;
          justify-content: flex-end;
          gap: var(--space-sm, 8px);
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      </style>

      <div class="backdrop" part="backdrop"></div>
      <div class="dialog" part="dialog" role="dialog" aria-modal="true">
        <div class="header" part="header">
          <slot name="header">
            <h2 class="title" id="dialog-title">${this.getAttribute('title') || ''}</h2>
          </slot>
          <button class="close-button" aria-label="Close dialog" type="button">
            ×
          </button>
        </div>
        <div class="body" part="body">
          <slot></slot>
        </div>
        <div class="footer" part="footer">
          <slot name="footer"></slot>
        </div>
      </div>
    `;
  }

  setupAccessibility() {
    const dialog = this.shadowRoot.querySelector('.dialog');
    dialog.setAttribute('aria-labelledby', 'dialog-title');

    // Set focus trap
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    this._firstFocusable = focusableElements[0];
    this._lastFocusable = focusableElements[focusableElements.length - 1];
  }

  setupEventListeners() {
    // Close button
    this.shadowRoot.querySelector('.close-button').addEventListener('click', () => {
      this.close();
    });

    // Backdrop click
    if (this.hasAttribute('close-on-backdrop') || !this.hasAttribute('close-on-backdrop')) {
      this.shadowRoot.querySelector('.backdrop').addEventListener('click', () => {
        this.close();
      });
    }

    // Escape key
    this._keydownHandler = (e) => {
      if (e.key === 'Escape' && (this.hasAttribute('close-on-escape') || !this.hasAttribute('close-on-escape'))) {
        this.close();
      }

      // Focus trap
      if (e.key === 'Tab' && this.hasAttribute('open')) {
        if (e.shiftKey) {
          if (document.activeElement === this._firstFocusable) {
            e.preventDefault();
            this._lastFocusable?.focus();
          }
        } else {
          if (document.activeElement === this._lastFocusable) {
            e.preventDefault();
            this._firstFocusable?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', this._keydownHandler);
  }

  removeEventListeners() {
    document.removeEventListener('keydown', this._keydownHandler);
  }

  show() {
    // Store previously focused element
    this._previouslyFocused = document.activeElement;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Focus first focusable element
    setTimeout(() => {
      this._firstFocusable?.focus();
    }, 100);

    // Fire event
    this.dispatchEvent(new CustomEvent('open'));
  }

  hide() {
    // Restore body scroll
    document.body.style.overflow = '';

    // Restore focus
    this._previouslyFocused?.focus();

    // Fire event
    this.dispatchEvent(new CustomEvent('close'));
  }

  close() {
    // Fire cancelable event
    const event = new CustomEvent('cancel', {
      cancelable: true
    });

    this.dispatchEvent(event);

    if (!event.defaultPrevented) {
      this.removeAttribute('open');
    }
  }

  updateTitle() {
    const titleEl = this.shadowRoot.getElementById('dialog-title');
    if (titleEl) {
      titleEl.textContent = this.getAttribute('title') || '';
    }
  }
}

customElements.define('pan-dialog', PanDialog);
```

## Component Showcase

Build a documentation page to showcase components:

```javascript
// docs/showcase.js
class ComponentShowcase extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .showcase {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .component-demo {
          margin: 2rem 0;
          padding: 2rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }

        .demo-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
        }

        .demo-example {
          padding: 1rem;
          background: #f8f8f8;
          border-radius: 4px;
          margin: 1rem 0;
        }

        .demo-code {
          background: #282c34;
          color: #abb2bf;
          padding: 1rem;
          border-radius: 4px;
          overflow-x: auto;
        }

        .demo-props {
          margin-top: 1rem;
        }

        .prop-table {
          width: 100%;
          border-collapse: collapse;
        }

        .prop-table th,
        .prop-table td {
          text-align: left;
          padding: 0.5rem;
          border-bottom: 1px solid #e0e0e0;
        }
      </style>

      <div class="showcase">
        <h1>Component Library</h1>

        <div class="component-demo">
          <h2 class="demo-title">Dialog</h2>
          <p>A modal dialog with accessibility features.</p>

          <div class="demo-example">
            <button id="open-dialog">Open Dialog</button>
            <pan-dialog id="demo-dialog" title="Example Dialog">
              <p>This is a sample dialog with default settings.</p>
              <div slot="footer">
                <button id="cancel-btn">Cancel</button>
                <button id="confirm-btn" style="background: #0066cc; color: white; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer;">Confirm</button>
              </div>
            </pan-dialog>
          </div>

          <div class="demo-code">
<pre>&lt;pan-dialog open title="Example Dialog"&gt;
  &lt;p&gt;This is a sample dialog.&lt;/p&gt;
  &lt;div slot="footer"&gt;
    &lt;button&gt;Cancel&lt;/button&gt;
    &lt;button&gt;Confirm&lt;/button&gt;
  &lt;/div&gt;
&lt;/pan-dialog&gt;</pre>
          </div>

          <div class="demo-props">
            <h3>Properties</h3>
            <table class="prop-table">
              <thead>
                <tr>
                  <th>Attribute</th>
                  <th>Type</th>
                  <th>Default</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><code>open</code></td>
                  <td>boolean</td>
                  <td>false</td>
                  <td>Controls dialog visibility</td>
                </tr>
                <tr>
                  <td><code>title</code></td>
                  <td>string</td>
                  <td>""</td>
                  <td>Dialog title</td>
                </tr>
                <tr>
                  <td><code>close-on-escape</code></td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Close on Escape key</td>
                </tr>
                <tr>
                  <td><code>close-on-backdrop</code></td>
                  <td>boolean</td>
                  <td>true</td>
                  <td>Close on backdrop click</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    // Setup demo interactivity
    this.setupDemos();
  }

  setupDemos() {
    const openBtn = this.querySelector('#open-dialog');
    const dialog = this.querySelector('#demo-dialog');
    const cancelBtn = this.querySelector('#cancel-btn');
    const confirmBtn = this.querySelector('#confirm-btn');

    openBtn.addEventListener('click', () => {
      dialog.setAttribute('open', '');
    });

    cancelBtn.addEventListener('click', () => {
      dialog.removeAttribute('open');
    });

    confirmBtn.addEventListener('click', () => {
      alert('Confirmed!');
      dialog.removeAttribute('open');
    });
  }
}

customElements.define('component-showcase', ComponentShowcase);
```

## Testing Components

Write comprehensive tests for your components:

```javascript
// components/core/pan-dialog.test.js
import { expect, fixture, html, oneEvent } from '@open-wc/testing';
import './pan-dialog.js';

describe('PanDialog', () => {
  it('should render with default attributes', async () => {
    const el = await fixture(html`<pan-dialog></pan-dialog>`);
    expect(el).to.exist;
    expect(el.hasAttribute('open')).to.be.false;
  });

  it('should show when open attribute is set', async () => {
    const el = await fixture(html`<pan-dialog open></pan-dialog>`);
    const computedStyle = window.getComputedStyle(el);
    expect(computedStyle.display).to.equal('flex');
  });

  it('should hide when open attribute is removed', async () => {
    const el = await fixture(html`<pan-dialog open></pan-dialog>`);
    el.removeAttribute('open');
    await el.updateComplete;
    const computedStyle = window.getComputedStyle(el);
    expect(computedStyle.display).to.equal('none');
  });

  it('should fire open event when opened', async () => {
    const el = await fixture(html`<pan-dialog></pan-dialog>`);
    setTimeout(() => el.setAttribute('open', ''));
    const { detail } = await oneEvent(el, 'open');
    expect(detail).to.exist;
  });

  it('should fire close event when closed', async () => {
    const el = await fixture(html`<pan-dialog open></pan-dialog>`);
    setTimeout(() => el.removeAttribute('open'));
    const { detail } = await oneEvent(el, 'close');
    expect(detail).to.exist;
  });

  it('should close on backdrop click', async () => {
    const el = await fixture(html`<pan-dialog open close-on-backdrop></pan-dialog>`);
    const backdrop = el.shadowRoot.querySelector('.backdrop');

    setTimeout(() => backdrop.click());
    await oneEvent(el, 'cancel');

    expect(el.hasAttribute('open')).to.be.false;
  });

  it('should close on Escape key', async () => {
    const el = await fixture(html`<pan-dialog open close-on-escape></pan-dialog>`);

    setTimeout(() => {
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(event);
    });

    await oneEvent(el, 'cancel');
    expect(el.hasAttribute('open')).to.be.false;
  });

  it('should trap focus within dialog', async () => {
    const el = await fixture(html`
      <pan-dialog open>
        <button id="btn1">Button 1</button>
        <button id="btn2">Button 2</button>
      </pan-dialog>
    `);

    const btn1 = el.querySelector('#btn1');
    const btn2 = el.querySelector('#btn2');

    btn2.focus();
    expect(document.activeElement).to.equal(btn2);

    // Simulate Tab key on last focusable element
    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true });
    document.dispatchEvent(tabEvent);

    // Should wrap to first focusable element
    expect(document.activeElement).to.equal(btn1);
  });

  it('should support custom CSS parts', async () => {
    const el = await fixture(html`<pan-dialog open></pan-dialog>`);
    const dialog = el.shadowRoot.querySelector('[part="dialog"]');
    const header = el.shadowRoot.querySelector('[part="header"]');
    const body = el.shadowRoot.querySelector('[part="body"]');

    expect(dialog).to.exist;
    expect(header).to.exist;
    expect(body).to.exist;
  });

  it('should render slotted content', async () => {
    const el = await fixture(html`
      <pan-dialog open>
        <p>Custom content</p>
        <button slot="footer">Action</button>
      </pan-dialog>
    `);

    const paragraph = el.querySelector('p');
    const footerButton = el.querySelector('[slot="footer"]');

    expect(paragraph.textContent).to.equal('Custom content');
    expect(footerButton.textContent).to.equal('Action');
  });
});
```

## Theming System

Create a comprehensive theming system:

```javascript
// themes/theme-manager.js
class ThemeManager {
  constructor() {
    this.themes = new Map();
    this.currentTheme = 'default';
  }

  registerTheme(name, tokens) {
    this.themes.set(name, tokens);
  }

  applyTheme(name) {
    const theme = this.themes.get(name);
    if (!theme) {
      console.warn(`Theme "${name}" not found`);
      return;
    }

    // Apply CSS custom properties to :root
    Object.entries(theme).forEach(([key, value]) => {
      document.documentElement.style.setProperty(key, value);
    });

    this.currentTheme = name;

    // Store preference
    localStorage.setItem('theme', name);

    // Dispatch event
    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { theme: name }
    }));
  }

  getCurrentTheme() {
    return this.currentTheme;
  }

  getAvailableThemes() {
    return Array.from(this.themes.keys());
  }
}

export const themeManager = new ThemeManager();

// Register default theme
themeManager.registerTheme('default', {
  '--color-primary': '#0066cc',
  '--color-secondary': '#6c757d',
  '--color-success': '#28a745',
  '--color-danger': '#dc3545',
  '--color-warning': '#ffc107',
  '--color-info': '#17a2b8',

  '--color-text': '#212529',
  '--color-text-secondary': '#6c757d',
  '--color-bg': '#ffffff',
  '--color-bg-secondary': '#f8f9fa',

  '--space-xs': '4px',
  '--space-sm': '8px',
  '--space-md': '16px',
  '--space-lg': '24px',
  '--space-xl': '32px',

  '--font-family': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  '--font-size-sm': '0.875rem',
  '--font-size-md': '1rem',
  '--font-size-lg': '1.25rem',
  '--font-size-xl': '1.5rem',

  '--border-radius': '4px',
  '--border-radius-lg': '8px',
  '--border-width': '1px',
  '--border-color': '#dee2e6',

  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
  '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.1)',
  '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
});

// Register dark theme
themeManager.registerTheme('dark', {
  '--color-primary': '#4d9fff',
  '--color-secondary': '#6c757d',
  '--color-success': '#28a745',
  '--color-danger': '#dc3545',
  '--color-warning': '#ffc107',
  '--color-info': '#17a2b8',

  '--color-text': '#e9ecef',
  '--color-text-secondary': '#adb5bd',
  '--color-bg': '#212529',
  '--color-bg-secondary': '#343a40',

  '--border-color': '#495057',

  '--shadow-sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
  '--shadow-md': '0 4px 6px rgba(0, 0, 0, 0.4)',
  '--shadow-lg': '0 10px 15px rgba(0, 0, 0, 0.4)',
});

// Apply saved theme or default
const savedTheme = localStorage.getItem('theme') || 'default';
themeManager.applyTheme(savedTheme);
```

**Theme switcher component:**

```javascript
class ThemeSwitcher extends HTMLElement {
  connectedCallback() {
    import('./theme-manager.js').then(({ themeManager }) => {
      this.themeManager = themeManager;
      this.render();
    });
  }

  render() {
    const themes = this.themeManager.getAvailableThemes();
    const current = this.themeManager.getCurrentTheme();

    this.innerHTML = `
      <style>
        .theme-switcher {
          display: inline-flex;
          gap: 0.5rem;
        }

        .theme-button {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border-color);
          border-radius: var(--border-radius);
          background: var(--color-bg);
          color: var(--color-text);
          cursor: pointer;
        }

        .theme-button.active {
          background: var(--color-primary);
          color: white;
          border-color: var(--color-primary);
        }
      </style>

      <div class="theme-switcher">
        ${themes.map(theme => `
          <button
            class="theme-button ${theme === current ? 'active' : ''}"
            data-theme="${theme}"
          >
            ${theme}
          </button>
        `).join('')}
      </div>
    `;

    // Add event listeners
    this.querySelectorAll('.theme-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.themeManager.applyTheme(theme);
        this.render();
      });
    });
  }
}

customElements.define('theme-switcher', ThemeSwitcher);
```

## Publishing to npm

Prepare your library for npm:

**1. package.json configuration:**

```json
{
  "name": "@myorg/larc-components",
  "version": "1.0.0",
  "description": "LARC component library",
  "type": "module",
  "main": "./index.js",
  "exports": {
    ".": {
      "import": "./index.js",
      "types": "./index.d.ts"
    },
    "./dialog": {
      "import": "./components/core/pan-dialog.js",
      "types": "./components/core/pan-dialog.d.ts"
    },
    "./button": {
      "import": "./components/core/pan-button.js"
    },
    "./themes/*": "./themes/*"
  },
  "files": [
    "components/",
    "themes/",
    "index.js",
    "README.md"
  ],
  "keywords": [
    "web-components",
    "larc",
    "components",
    "ui"
  ],
  "customElements": "custom-elements.json",
  "scripts": {
    "test": "web-test-runner \"components/**/*.test.js\"",
    "analyze": "wca analyze \"components/**/*.js\" --outFile custom-elements.json",
    "prepublishOnly": "npm test && npm run analyze"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/myorg/larc-components"
  },
  "license": "MIT"
}
```

**2. Create README.md:**

```markdown
# @myorg/larc-components

A collection of accessible, themeable web components built with LARC.

## Installation

```bash
npm install @myorg/larc-components
```

## Usage

### Import all components

```javascript
import '@myorg/larc-components';
```

### Import specific components

```javascript
import '@myorg/larc-components/dialog';
import '@myorg/larc-components/button';
```

### Use in HTML

```html
<pan-dialog open title="Example">
  <p>Dialog content</p>
</pan-dialog>
```

## Theming

```javascript
import { themeManager } from '@myorg/larc-components/themes/theme-manager.js';

// Apply dark theme
themeManager.applyTheme('dark');

// Register custom theme
themeManager.registerTheme('custom', {
  '--color-primary': '#ff0000',
  // ...more tokens
});
```

## Components

- `<pan-dialog>` - Modal dialog
- `<pan-button>` - Button component
- `<pan-card>` - Card container
- More coming soon...

## License

MIT
```

**3. Publish:**

```bash
# Login to npm
npm login

# Publish (first time)
npm publish --access public

# Publish update
npm version patch  # or minor, major
npm publish
```

## Version Management

Follow semantic versioning and maintain a changelog:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.2.0] - 2024-01-15

### Added
- New `<pan-dialog>` component with full accessibility support
- Dark theme support
- CSS parts for style customization

### Changed
- Improved button component focus styles
- Updated default theme colors

### Fixed
- Fixed focus trap in dialog component
- Fixed memory leak in theme manager

## [1.1.0] - 2024-01-01

### Added
- New `<pan-card>` component
- Theme switcher component

### Changed
- Breaking: Renamed `variant` to `type` in button component

### Migration Guide

Update button variant attribute:
```html
<!-- Before -->
<pan-button variant="primary">Click</pan-button>

<!-- After -->
<pan-button type="primary">Click</pan-button>
```

## [1.0.0] - 2023-12-01

- Initial release
```

## Component API Design Patterns

Design consistent, predictable component APIs:

**1. Boolean attributes:**

```javascript
// ✅ Good: Use presence/absence
<pan-dialog open></pan-dialog>
<pan-button disabled></pan-button>

// ❌ Bad: Use string values
<pan-dialog open="true"></pan-dialog>
```

**2. Enum attributes:**

```javascript
// ✅ Good: Use lowercase, hyphenated
<pan-button variant="primary"></pan-button>
<pan-input type="email"></pan-input>

// ❌ Bad: Use camelCase or weird casing
<pan-button variant="Primary"></pan-button>
```

**3. Event naming:**

```javascript
// ✅ Good: Use present tense for state changes
element.addEventListener('open', () => {});
element.addEventListener('close', () => {});

// ✅ Good: Use past tense for completed actions
element.addEventListener('loaded', () => {});
element.addEventListener('changed', () => {});
```

**4. CSS custom properties:**

```javascript
// ✅ Good: Namespace and descriptive
--dialog-width
--button-primary-bg
--card-border-radius

// ❌ Bad: Generic or unclear
--width
--bg
--radius
```

**5. Slots:**

```javascript
// ✅ Good: Named slots for specific content
<slot name="header"></slot>
<slot name="footer"></slot>
<slot></slot>  // default slot

// ❌ Bad: Too many unnamed slots
```

## Troubleshooting Component Libraries

### Problem 1: Styles Bleeding Between Components

**Symptoms**: Components inherit unwanted styles from global CSS or other components.

**Cause**: Not using Shadow DOM or improperly scoped styles.

**Solution**:

```javascript
// ✅ Always use Shadow DOM for encapsulation
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });  // ← Critical!
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        /* These styles won't leak out */
        :host {
          display: block;
        }
      </style>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
}
```

### Problem 2: Components Not Updating When Attributes Change

**Symptoms**: Changing attributes doesn't update the component.

**Cause**: Not implementing `observedAttributes` or `attributeChangedCallback`.

**Solution**:

```javascript
class MyComponent extends HTMLElement {
  // ✅ Declare which attributes to watch
  static observedAttributes = ['value', 'disabled'];

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    // Handle attribute change
    if (name === 'value') {
      this.updateValue(newValue);
    } else if (name === 'disabled') {
      this.updateDisabledState(newValue !== null);
    }
  }
}
```

### Problem 3: Memory Leaks in Components

**Symptoms**: Memory usage grows over time, especially when components are added/removed.

**Cause**: Event listeners not cleaned up.

**Solution**:

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    // Store handler reference
    this._resizeHandler = () => this.handleResize();
    window.addEventListener('resize', this._resizeHandler);

    this._panSubscriptionId = pan.subscribe('data.updated', () => {
      this.refresh();
    });
  }

  disconnectedCallback() {
    // ✅ Clean up everything
    window.removeEventListener('resize', this._resizeHandler);

    if (this._panSubscriptionId) {
      pan.unsubscribe(this._panSubscriptionId);
    }
  }
}
```

### Problem 4: Slow Component Registration

**Symptoms**: Initial page load is slow when many components are imported.

**Cause**: Importing all components upfront.

**Solution**:

```javascript
// ❌ Bad: Import everything upfront
import './components/dialog.js';
import './components/button.js';
import './components/card.js';
// ... 50 more imports

// ✅ Good: Lazy load on demand
const componentRegistry = new Map([
  ['pan-dialog', () => import('./components/dialog.js')],
  ['pan-button', () => import('./components/button.js')],
  ['pan-card', () => import('./components/card.js')]
]);

// Auto-load when component is used
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    mutation.addedNodes.forEach(node => {
      if (node.nodeType === 1) {
        const tagName = node.tagName.toLowerCase();
        if (componentRegistry.has(tagName)) {
          componentRegistry.get(tagName)();
          componentRegistry.delete(tagName);  // Load once
        }
      }
    });
  });
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});
```

## Component Library Best Practices

1. **Always Use Shadow DOM**: Encapsulate styles and prevent leakage.

2. **Document Everything**: Use JSDoc comments for all public APIs.

3. **Test Thoroughly**: Unit tests, accessibility tests, and visual regression tests.

4. **Follow Web Standards**: Use standard HTML attributes and patterns when possible.

5. **Make Components Composable**: Small, focused components that work well together.

6. **Provide Customization**: CSS parts, custom properties, and slots for flexibility.

7. **Accessibility First**: Always include ARIA attributes, keyboard navigation, and focus management.

8. **Version Carefully**: Follow semantic versioning and provide migration guides for breaking changes.

9. **Optimize Performance**: Lazy load components, clean up resources, avoid unnecessary re-renders.

10. **Maintain Consistency**: Use consistent naming, patterns, and behaviors across all components.

## Hands-On Exercises

### Exercise 1: Build a Toast Notification Component

Create a `<pan-toast>` component that:
- Shows temporary notifications
- Supports different types (success, error, warning, info)
- Auto-dismisses after a timeout
- Stacks multiple toasts
- Has accessible announcements (aria-live)

**Bonus**: Add slide-in animations and a queue system.

### Exercise 2: Create a Component Documentation Site

Build an interactive documentation site for your components that:
- Shows live examples with editable code
- Displays component API (props, events, slots)
- Includes accessibility information
- Has a theme switcher
- Provides copy-paste code snippets

**Bonus**: Generate documentation from JSDoc comments automatically.

### Exercise 3: Implement a Component Testing Suite

Set up comprehensive testing for a component:
- Unit tests for all functionality
- Accessibility tests (keyboard nav, screen readers)
- Visual regression tests with screenshots
- Performance tests (render time)
- Cross-browser testing

**Bonus**: Integrate tests into CI/CD pipeline.

### Exercise 4: Publish a Component Package

Package and publish a component library:
- Set up proper package.json with exports
- Create comprehensive README
- Write CHANGELOG.md
- Publish to npm
- Set up automated versioning and releases

**Bonus**: Create a landing page with examples and documentation.

## Summary

Building a component library is about more than just writing components—it's about creating a sustainable system:

- **Organize logically**: Group related components, use consistent naming
- **Document thoroughly**: Every component, prop, event, and slot
- **Test comprehensively**: Unit, integration, accessibility, visual
- **Theme consistently**: Design tokens and CSS custom properties
- **Version carefully**: Semantic versioning with clear changelogs
- **Distribute effectively**: npm, CDN, or monorepo

A well-maintained component library accelerates development and ensures consistency across your applications.

## Further Reading

- **Building with LARC - Chapter 15 (Component Patterns)**: Advanced component architecture
- **Building with LARC - Chapter 5 (Shadow DOM)**: Deep dive into encapsulation
- **Building with LARC - Chapter 10 (Accessibility)**: Making components accessible
