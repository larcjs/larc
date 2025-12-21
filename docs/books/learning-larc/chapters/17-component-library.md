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
