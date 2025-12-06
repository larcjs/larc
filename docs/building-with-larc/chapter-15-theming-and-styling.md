# Chapter 15: Theming and Styling

> "CSS is the only language where two plus two equals five, sometimes three, and occasionally 'align-items: center' doesn't actually center things."
>
> — Every web developer who's ever tried to center a div

Theming is the art of making your application look consistently beautiful (or at least consistently mediocre) across all components, all pages, and all user preferences. It's the difference between an application that feels like a cohesive product and one that looks like it was assembled by a committee that never met.

In this chapter, we'll build a robust theming system for LARC applications using CSS custom properties, explore light and dark mode implementations, create a theme provider component that broadcasts theme changes through the PAN bus, handle dynamic theme switching without page reloads, and implement responsive design patterns that adapt to any screen size.

Fair warning: we're going to spend quality time with CSS. If you thought JavaScript was weird, wait until you meet `:host-context()`, CSS cascade layers, and the eternal mystery of specificity. But by the end of this chapter, you'll have a theming system that's maintainable, performant, and doesn't require a PhD in CSS archaeology.

## CSS Custom Properties: Variables That Actually Work

CSS custom properties (often called CSS variables) are the foundation of modern theming. Unlike Sass variables that compile away at build time, CSS custom properties are live—change them at runtime, and everything updates instantly.

Here's the basic syntax:

```css
/* Define custom properties */
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --text-color: #333;
  --background-color: #fff;
}

/* Use custom properties */
button {
  background: var(--primary-color);
  color: var(--background-color);
}
```

Change `--primary-color` anywhere in your code, and all buttons update automatically. It's like magic, except it actually works consistently across browsers.

### Defining a Theme System

Let's build a comprehensive theme system with semantic tokens:

```css
/* theme/base.css */

/* Color primitives - raw colors */
:root {
  /* Blues */
  --blue-50: #eff6ff;
  --blue-100: #dbeafe;
  --blue-500: #3b82f6;
  --blue-600: #2563eb;
  --blue-900: #1e3a8a;

  /* Grays */
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-600: #4b5563;
  --gray-800: #1f2937;
  --gray-900: #111827;

  /* Status colors */
  --green-500: #10b981;
  --red-500: #ef4444;
  --yellow-500: #f59e0b;
}

/* Semantic tokens - what colors mean */
:root {
  /* Brand colors */
  --color-primary: var(--blue-600);
  --color-primary-hover: var(--blue-500);
  --color-primary-active: var(--blue-900);

  /* Text colors */
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);
  --color-text-inverse: var(--gray-50);

  /* Background colors */
  --color-bg-primary: #ffffff;
  --color-bg-secondary: var(--gray-50);
  --color-bg-tertiary: var(--gray-100);

  /* Border colors */
  --color-border: var(--gray-200);
  --color-border-focus: var(--blue-500);

  /* Status colors */
  --color-success: var(--green-500);
  --color-error: var(--red-500);
  --color-warning: var(--yellow-500);

  /* Typography */
  --font-family-base: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Courier New', Courier, monospace;

  --font-size-xs: 0.75rem;   /* 12px */
  --font-size-sm: 0.875rem;  /* 14px */
  --font-size-base: 1rem;    /* 16px */
  --font-size-lg: 1.125rem;  /* 18px */
  --font-size-xl: 1.25rem;   /* 20px */
  --font-size-2xl: 1.5rem;   /* 24px */
  --font-size-3xl: 1.875rem; /* 30px */

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  /* Spacing */
  --space-xs: 0.25rem;  /* 4px */
  --space-sm: 0.5rem;   /* 8px */
  --space-md: 1rem;     /* 16px */
  --space-lg: 1.5rem;   /* 24px */
  --space-xl: 2rem;     /* 32px */
  --space-2xl: 3rem;    /* 48px */
  --space-3xl: 4rem;    /* 64px */

  /* Borders */
  --border-width: 1px;
  --border-radius-sm: 0.25rem;  /* 4px */
  --border-radius-md: 0.5rem;   /* 8px */
  --border-radius-lg: 1rem;     /* 16px */
  --border-radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
  --transition-slow: 350ms ease-in-out;

  /* Z-index layers */
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

This gives us a two-tier system: primitives (the actual colors) and semantic tokens (what the colors mean). Components use semantic tokens, never primitives directly.

### Dark Mode: Inverting Without Inverting

Dark mode isn't just "make everything dark." Good dark mode is subtle, uses slightly muted colors, and maintains contrast ratios for accessibility.

```css
/* theme/dark.css */

/* Dark mode overrides */
[data-theme="dark"] {
  /* Text colors */
  --color-text-primary: var(--gray-50);
  --color-text-secondary: var(--gray-200);
  --color-text-inverse: var(--gray-900);

  /* Background colors */
  --color-bg-primary: var(--gray-900);
  --color-bg-secondary: var(--gray-800);
  --color-bg-tertiary: var(--gray-600);

  /* Border colors */
  --color-border: var(--gray-600);

  /* Adjust shadows for dark backgrounds */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
}
```

We override only semantic tokens, never primitives. This keeps dark mode maintainable—add a new component, and it automatically works in both themes.

### System Preference Detection

Respect the user's OS preference:

```css
/* theme/system.css */

/* Automatically use dark mode if system preference is dark */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-text-primary: var(--gray-50);
    --color-text-secondary: var(--gray-200);
    --color-text-inverse: var(--gray-900);
    --color-bg-primary: var(--gray-900);
    --color-bg-secondary: var(--gray-800);
    --color-bg-tertiary: var(--gray-600);
    --color-border: var(--gray-600);
    --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.3);
    --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
    --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.5);
    --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.6);
  }
}
```

This respects the system preference unless the user explicitly chooses a theme (via `data-theme` attribute).

## Theme Provider Component

Now let's build a component that manages theme state and publishes changes through the PAN bus:

```javascript
// components/theme-provider.mjs

import { publish, subscribe } from '../pan.js';

class ThemeProvider extends HTMLElement {
  constructor() {
    super();
    this.currentTheme = this.getInitialTheme();
  }

  connectedCallback() {
    // Apply initial theme
    this.applyTheme(this.currentTheme);

    // Subscribe to theme change requests
    this.subscriptions = [
      subscribe('theme.change', (msg) => {
        this.setTheme(msg.data.theme);
      }),

      subscribe('theme.toggle', () => {
        this.toggleTheme();
      }),

      subscribe('theme.query', () => {
        this.publishCurrentTheme();
      })
    ];

    // Listen for system preference changes
    this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.handleMediaChange = () => {
      if (this.currentTheme === 'system') {
        this.applyTheme('system');
        this.publishCurrentTheme();
      }
    };
    this.mediaQuery.addEventListener('change', this.handleMediaChange);

    // Publish initial theme
    this.publishCurrentTheme();
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
    this.mediaQuery?.removeEventListener('change', this.handleMediaChange);
  }

  /**
   * Get initial theme from localStorage or system preference
   */
  getInitialTheme() {
    const stored = localStorage.getItem('theme');
    if (stored && ['light', 'dark', 'system'].includes(stored)) {
      return stored;
    }
    return 'system';
  }

  /**
   * Set theme and persist preference
   */
  setTheme(theme) {
    if (!['light', 'dark', 'system'].includes(theme)) {
      console.error(`Invalid theme: ${theme}`);
      return;
    }

    this.currentTheme = theme;
    this.applyTheme(theme);
    localStorage.setItem('theme', theme);
    this.publishCurrentTheme();
  }

  /**
   * Toggle between light and dark (ignoring system preference)
   */
  toggleTheme() {
    const resolvedTheme = this.getResolvedTheme();
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  /**
   * Apply theme to document
   */
  applyTheme(theme) {
    const resolvedTheme = this.resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }

  /**
   * Resolve 'system' theme to actual theme
   */
  resolveTheme(theme) {
    if (theme === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return theme;
  }

  /**
   * Get the currently resolved theme (not 'system')
   */
  getResolvedTheme() {
    return document.documentElement.getAttribute('data-theme') || 'light';
  }

  /**
   * Publish current theme state
   */
  publishCurrentTheme() {
    const resolvedTheme = this.getResolvedTheme();
    publish('theme.current', {
      theme: this.currentTheme,
      resolvedTheme,
      isSystemPreference: this.currentTheme === 'system'
    });
  }
}

customElements.define('theme-provider', ThemeProvider);
```

Add it to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
  <link rel="stylesheet" href="./theme/base.css">
  <link rel="stylesheet" href="./theme/dark.css">
  <script type="module" src="./src/pan.js"></script>
</head>
<body>
  <theme-provider></theme-provider>

  <!-- Your app content -->
  <main>
    <h1>Hello, World!</h1>
  </main>
</body>
</html>
```

Now any component can change the theme:

```javascript
import { publish } from '../pan.js';

// Set theme explicitly
publish('theme.change', { theme: 'dark' });

// Toggle theme
publish('theme.toggle', {});

// Query current theme
publish('theme.query', {});
```

## Theme-Aware Components

Components should respond to theme changes by subscribing to `theme.current`:

```javascript
// components/theme-display.mjs

import { subscribe } from '../pan.js';

class ThemeDisplay extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('theme.current', (msg) => {
      this.render(msg.data);
    });
  }

  render({ theme, resolvedTheme, isSystemPreference }) {
    this.innerHTML = `
      <div class="theme-display">
        <p>Current theme: <strong>${theme}</strong></p>
        ${isSystemPreference ? `
          <p>Resolved from system: <strong>${resolvedTheme}</strong></p>
        ` : ''}
        <p>Active theme: <strong>${resolvedTheme}</strong></p>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('theme-display', ThemeDisplay);
```

## Theme Switcher Component

Let's build a polished theme switcher with three options: light, dark, and system:

```javascript
// components/theme-switcher.mjs

import { publish, subscribe } from '../pan.js';

class ThemeSwitcher extends HTMLElement {
  constructor() {
    super();
    this.currentTheme = 'system';
  }

  connectedCallback() {
    this.className = 'theme-switcher';

    // Subscribe to theme updates
    this.unsubscribe = subscribe('theme.current', (msg) => {
      this.currentTheme = msg.data.theme;
      this.render();
    });

    // Request current theme
    publish('theme.query', {});
  }

  render() {
    this.innerHTML = `
      <div class="theme-switcher__container">
        <button
          class="theme-switcher__button ${this.currentTheme === 'light' ? 'active' : ''}"
          data-theme="light"
          aria-label="Light theme"
        >
          ☀️ Light
        </button>
        <button
          class="theme-switcher__button ${this.currentTheme === 'dark' ? 'active' : ''}"
          data-theme="dark"
          aria-label="Dark theme"
        >
          🌙 Dark
        </button>
        <button
          class="theme-switcher__button ${this.currentTheme === 'system' ? 'active' : ''}"
          data-theme="system"
          aria-label="System theme"
        >
          💻 System
        </button>
      </div>
    `;

    // Attach event listeners
    this.querySelectorAll('[data-theme]').forEach(button => {
      button.addEventListener('click', () => {
        const theme = button.dataset.theme;
        publish('theme.change', { theme });
      });
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('theme-switcher', ThemeSwitcher);
```

And the styles:

```css
/* components/theme-switcher.css */

.theme-switcher__container {
  display: flex;
  gap: var(--space-xs);
  padding: var(--space-xs);
  background: var(--color-bg-secondary);
  border-radius: var(--border-radius-lg);
}

.theme-switcher__button {
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid transparent;
  border-radius: var(--border-radius-md);
  background: transparent;
  color: var(--color-text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-switcher__button:hover {
  background: var(--color-bg-tertiary);
  color: var(--color-text-primary);
}

.theme-switcher__button.active {
  background: var(--color-primary);
  color: var(--color-text-inverse);
  border-color: var(--color-primary);
}

.theme-switcher__button:focus-visible {
  outline: 2px solid var(--color-border-focus);
  outline-offset: 2px;
}
```

## Smooth Transitions Between Themes

Switching themes can be jarring. Let's add smooth transitions:

```css
/* theme/transitions.css */

/* Transition all themed properties */
* {
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    color var(--transition-base),
    box-shadow var(--transition-base);
}

/* Disable transitions during page load */
.no-transitions * {
  transition: none !important;
}

/* Respect user preference for reduced motion */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

Update the theme provider to disable transitions during initial load:

```javascript
class ThemeProvider extends HTMLElement {
  connectedCallback() {
    // Disable transitions during initial load
    document.documentElement.classList.add('no-transitions');

    this.applyTheme(this.currentTheme);

    // Re-enable transitions after a frame
    requestAnimationFrame(() => {
      document.documentElement.classList.remove('no-transitions');
    });

    // ... rest of connectedCallback
  }
}
```

## Scoped Themes for Components

Sometimes a component needs its own theme, independent of the global theme:

```javascript
// components/branded-card.mjs

class BrandedCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;

          /* Define local theme */
          --card-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --card-text: #ffffff;
          --card-border-radius: 1rem;
          --card-padding: 2rem;
        }

        .card {
          background: var(--card-bg);
          color: var(--card-text);
          border-radius: var(--card-border-radius);
          padding: var(--card-padding);
          box-shadow: var(--shadow-xl);
        }

        /* Allow customization via CSS custom properties */
        :host([variant="flat"]) {
          --card-bg: var(--color-bg-secondary);
          --card-text: var(--color-text-primary);
        }
      </style>

      <div class="card">
        <slot></slot>
      </div>
    `;
  }
}

customElements.define('branded-card', BrandedCard);
```

Use it:

```html
<!-- Uses gradient background -->
<branded-card>
  <h2>Premium Feature</h2>
  <p>This card has its own theme!</p>
</branded-card>

<!-- Uses flat background -->
<branded-card variant="flat">
  <h2>Standard Feature</h2>
  <p>This one inherits from global theme.</p>
</branded-card>
```

## Responsive Design with Custom Properties

CSS custom properties can adapt to viewport size:

```css
/* theme/responsive.css */

:root {
  /* Base spacing */
  --space-page-horizontal: var(--space-md);
  --space-page-vertical: var(--space-lg);

  /* Base font sizes */
  --font-size-display: var(--font-size-2xl);
}

/* Tablet and up */
@media (min-width: 768px) {
  :root {
    --space-page-horizontal: var(--space-xl);
    --space-page-vertical: var(--space-2xl);
    --font-size-display: var(--font-size-3xl);
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  :root {
    --space-page-horizontal: var(--space-2xl);
    --space-page-vertical: var(--space-3xl);
    --font-size-display: 2.5rem;
  }
}

/* Container */
.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: var(--space-page-vertical) var(--space-page-horizontal);
}

/* Display text */
.display {
  font-size: var(--font-size-display);
  line-height: var(--line-height-tight);
  font-weight: var(--font-weight-bold);
}
```

Components automatically adapt to these responsive tokens.

## Multiple Brand Themes

Support multiple brands with theme switching:

```css
/* theme/brands.css */

/* Default brand (Acme Corp) */
:root {
  --brand-primary: #667eea;
  --brand-secondary: #764ba2;
  --brand-logo-url: url('/logos/acme.svg');
}

/* Brand: TechStart */
[data-brand="techstart"] {
  --brand-primary: #10b981;
  --brand-secondary: #059669;
  --brand-logo-url: url('/logos/techstart.svg');
}

/* Brand: Creative Co */
[data-brand="creative"] {
  --brand-primary: #f59e0b;
  --brand-secondary: #d97706;
  --brand-logo-url: url('/logos/creative.svg');
}

/* Apply brand colors to components */
.button-primary {
  background: var(--brand-primary);
}

.button-secondary {
  background: var(--brand-secondary);
}

.logo {
  content: var(--brand-logo-url);
}
```

Switch brands dynamically:

```javascript
// Set brand via data attribute
document.documentElement.setAttribute('data-brand', 'techstart');
```

Or extend the theme provider to manage brands:

```javascript
class ThemeProvider extends HTMLElement {
  setBrand(brand) {
    document.documentElement.setAttribute('data-brand', brand);
    publish('theme.brand.changed', { brand });
  }
}
```

## Performance Considerations

CSS custom properties are fast, but here are tips to keep themes performant:

### 1. Minimize Transitions

Don't transition everything:

```css
/* Bad: transitions on every property */
* {
  transition: all var(--transition-base);
}

/* Good: transition only themed properties */
* {
  transition:
    background-color var(--transition-base),
    color var(--transition-base);
}
```

### 2. Use CSS Containment

Help browsers optimize rendering:

```css
.card {
  contain: layout style;
}
```

### 3. Avoid Deep Custom Property Lookups

Custom properties have inheritance cost. Don't nest too deeply:

```css
/* Bad: deep nesting */
:root {
  --color-1: #333;
  --color-2: var(--color-1);
  --color-3: var(--color-2);
  --color-4: var(--color-3);
}

/* Good: direct references */
:root {
  --base-gray: #333;
  --color-text: var(--base-gray);
  --color-border: var(--base-gray);
}
```

### 4. Batch Theme Changes

If changing multiple properties, use a data attribute rather than individual properties:

```javascript
// Bad: multiple property changes
document.documentElement.style.setProperty('--color-primary', '#fff');
document.documentElement.style.setProperty('--color-secondary', '#000');
document.documentElement.style.setProperty('--color-text', '#333');

// Good: single attribute change
document.documentElement.setAttribute('data-theme', 'dark');
```

## Accessibility in Theming

Ensure your themes are accessible:

### 1. Maintain Contrast Ratios

Use tools like WebAIM's contrast checker. Aim for:

- **4.5:1** for normal text (WCAG AA)
- **7:1** for normal text (WCAG AAA)
- **3:1** for large text (WCAG AA)

```css
/* Good contrast */
:root {
  --color-text-primary: #111827;  /* Dark on light */
  --color-bg-primary: #ffffff;
}

[data-theme="dark"] {
  --color-text-primary: #f9fafb;  /* Light on dark */
  --color-bg-primary: #111827;
}
```

### 2. Respect Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### 3. Provide High Contrast Mode

```css
@media (prefers-contrast: high) {
  :root {
    --color-text-primary: #000000;
    --color-bg-primary: #ffffff;
    --color-border: #000000;
    --border-width: 2px;
  }
}
```

### 4. Test with Screen Readers

Ensure theme changes are announced:

```javascript
class ThemeProvider extends HTMLElement {
  applyTheme(theme) {
    const resolvedTheme = this.resolveTheme(theme);
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Announce theme change to screen readers
    this.announceThemeChange(resolvedTheme);
  }

  announceThemeChange(theme) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = `Theme changed to ${theme} mode`;
    document.body.appendChild(announcement);

    setTimeout(() => announcement.remove(), 1000);
  }
}
```

With screen-reader-only CSS:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

## Wrapping Up

You now have a robust theming system for LARC applications. You understand CSS custom properties, how to implement light and dark modes that respect system preferences, how to build a theme provider that broadcasts changes through the PAN bus, and how to create accessible, performant themes.

The key insights:

- Use two-tier token system: primitives and semantic tokens
- Components use semantic tokens, never raw colors
- Theme provider manages state and publishes to PAN bus
- Respect system preferences but allow explicit overrides
- Smooth transitions make theme switching delightful
- Accessibility isn't optional—contrast, reduced motion, and screen readers matter
- CSS custom properties are fast; use them liberally

In the next chapter, we'll tackle performance optimization—making LARC applications fast through message filtering, lazy loading, virtual scrolling, and careful memory management. Because a beautiful theme doesn't matter if your app takes ten seconds to load.

Now go forth and theme your application. And remember: if users complain about your color choices, you can always blame it on "brand guidelines."
