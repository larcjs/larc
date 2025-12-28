# Theming and Styling

Quick reference for theming and styling patterns in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 15.

## Overview

LARC applications use CSS custom properties (variables) for themeable styling, supporting light/dark modes, system preferences, and dynamic theme switching via the PAN bus. The pan-theme-provider component manages global theme state.

**Key Concepts**:
- CSS custom properties: Runtime-modifiable variables (--color-primary)
- Semantic tokens: Meaningful names (--color-text-primary, not --gray-900)
- Theme provider: Component managing theme state via PAN bus
- System preference: Respect prefers-color-scheme media query
- Scoped themes: Component-specific styling independent of global theme

## Quick Example

```css
/* Define theme variables */
:root {
  --color-primary: #3b82f6;
  --color-text: #111827;
  --color-bg: #ffffff;
}

[data-theme="dark"] {
  --color-text: #f9fafb;
  --color-bg: #111827;
}

/* Use in components */
button {
  background: var(--color-primary);
  color: var(--color-bg);
}
```

```html
<pan-theme-provider theme="auto"></pan-theme-provider>
<pan-theme-toggle></pan-theme-toggle>
```

## Theme System Structure

### Two-Tier Token System

| Tier | Purpose | Example |
|------|---------|---------|
| **Primitives** | Raw color values | `--blue-500: #3b82f6` |
| **Semantic** | Meaningful tokens | `--color-primary: var(--blue-500)` |

Components use **semantic tokens only**, never primitives. This allows theme changes without updating components.

### Standard Theme Variables

```css
:root {
  /* Colors */
  --color-primary: #3b82f6;
  --color-text-primary: #111827;
  --color-text-secondary: #6b7280;
  --color-bg-primary: #ffffff;
  --color-bg-secondary: #f9fafb;
  --color-border: #e5e7eb;
  
  /* Typography */
  --font-family-base: system-ui, sans-serif;
  --font-size-base: 1rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;
  --line-height-normal: 1.5;
  
  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  
  /* Borders & Shadows */
  --border-radius: 0.5rem;
  --border-width: 1px;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.05);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.1);
  
  /* Transitions */
  --transition-fast: 150ms ease-in-out;
  --transition-base: 250ms ease-in-out;
}
```

## Dark Mode Implementation

### Manual Dark Mode Override

```css
[data-theme="dark"] {
  --color-text-primary: #f9fafb;
  --color-text-secondary: #d1d5db;
  --color-bg-primary: #111827;
  --color-bg-secondary: #1f2937;
  --color-border: #374151;
  --shadow-sm: 0 1px 2px 0 rgba(0,0,0,0.3);
  --shadow-lg: 0 10px 15px -3px rgba(0,0,0,0.5);
}
```

### System Preference Detection

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-text-primary: #f9fafb;
    --color-bg-primary: #111827;
    /* ... other dark mode overrides */
  }
}
```

## Theme Provider Component

See Chapter 17 for full API documentation of `pan-theme-provider`.

### Basic Usage

```html
<pan-theme-provider theme="auto"></pan-theme-provider>
```

### JavaScript API

```javascript
const provider = document.querySelector('pan-theme-provider');

// Set theme
provider.setTheme('dark'); // 'light', 'dark', or 'auto'

// Get current theme
const theme = provider.getTheme(); // Returns setting ('auto')
const effective = provider.getEffectiveTheme(); // Returns actual ('dark')

// Listen for changes
provider.addEventListener('theme-change', (e) => {
  console.log('Theme:', e.detail.theme);
});
```

### PAN Bus Integration

```javascript
import { bus } from '/core/pan-bus.mjs';

// Subscribe to theme changes
bus.subscribe('theme.changed', (msg) => {
  console.log('New theme:', msg.data.effective);
});

// Request theme change
bus.publish('theme.change', { theme: 'dark' });
```

## Theme Toggle Component

```html
<!-- Icon button (default) -->
<pan-theme-toggle></pan-theme-toggle>

<!-- Button with label -->
<pan-theme-toggle variant="button" label="Theme"></pan-theme-toggle>

<!-- Dropdown with all options -->
<pan-theme-toggle variant="dropdown"></pan-theme-toggle>
```

## Component-Specific Theming

### Shadow DOM Scoping

```javascript
class BrandedCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-bg: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          --card-text: #ffffff;
        }
        
        .card {
          background: var(--card-bg);
          color: var(--card-text);
          padding: var(--space-lg);
          border-radius: var(--border-radius);
        }
        
        /* Allow customization */
        :host([variant="flat"]) {
          --card-bg: var(--color-bg-secondary);
          --card-text: var(--color-text-primary);
        }
      </style>
      <div class="card"><slot></slot></div>
    `;
  }
}
```

## Responsive Theming

### Viewport-Based Variables

```css
:root {
  --space-page: var(--space-md);
  --font-display: var(--font-size-2xl);
}

@media (min-width: 768px) {
  :root {
    --space-page: var(--space-xl);
    --font-display: var(--font-size-3xl);
  }
}

@media (min-width: 1024px) {
  :root {
    --space-page: var(--space-2xl);
    --font-display: 2.5rem;
  }
}

.container {
  padding: var(--space-page);
}
```

## Smooth Theme Transitions

```css
* {
  transition:
    background-color var(--transition-base),
    border-color var(--transition-base),
    color var(--transition-base);
}

/* Disable on page load */
.no-transitions * {
  transition: none !important;
}

/* Respect user preference */
@media (prefers-reduced-motion: reduce) {
  * {
    transition: none !important;
  }
}
```

```javascript
// Disable transitions during initial theme apply
document.documentElement.classList.add('no-transitions');
applyTheme(theme);
requestAnimationFrame(() => {
  document.documentElement.classList.remove('no-transitions');
});
```

## Multi-Brand Support

```css
:root {
  --brand-primary: #667eea;
  --brand-logo: url('/logos/default.svg');
}

[data-brand="acme"] {
  --brand-primary: #10b981;
  --brand-logo: url('/logos/acme.svg');
}

[data-brand="techstart"] {
  --brand-primary: #f59e0b;
  --brand-logo: url('/logos/techstart.svg');
}

.brand-button {
  background: var(--brand-primary);
}
```

```javascript
// Switch brands
document.documentElement.setAttribute('data-brand', 'acme');
```

## Accessibility

### Contrast Requirements

Maintain WCAG contrast ratios:
- **AA Normal text**: 4.5:1 minimum
- **AA Large text**: 3:1 minimum  
- **AAA Normal text**: 7:1 minimum

```css
/* Good contrast */
:root {
  --color-text-primary: #111827; /* 16.3:1 on white */
  --color-bg-primary: #ffffff;
}

[data-theme="dark"] {
  --color-text-primary: #f9fafb; /* 17.5:1 on dark */
  --color-bg-primary: #111827;
}
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### High Contrast Mode

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

### Screen Reader Announcements

```javascript
function announceThemeChange(theme) {
  const announcement = document.createElement('div');
  announcement.setAttribute('role', 'status');
  announcement.setAttribute('aria-live', 'polite');
  announcement.className = 'sr-only';
  announcement.textContent = `Theme changed to ${theme} mode`;
  document.body.appendChild(announcement);
  
  setTimeout(() => announcement.remove(), 1000);
}
```

## Performance Tips

| Optimization | Benefit |
|--------------|---------|
| Use data attributes for theme switching | Single change triggers all updates |
| Avoid deep custom property nesting | Reduces lookup cost |
| Transition specific properties only | Better performance than `all` |
| Use CSS containment | Helps browser optimize rendering |

### Efficient Theme Switching

```javascript
// Good - single attribute change
document.documentElement.setAttribute('data-theme', 'dark');

// Bad - multiple property changes
document.documentElement.style.setProperty('--color-text', '#fff');
document.documentElement.style.setProperty('--color-bg', '#000');
// ... dozens more
```

## Component Reference

See Chapter 17 for complete API documentation:
- **pan-theme-provider**: Global theme management
- **pan-theme-toggle**: Theme switcher UI control

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 15 (Theming and Styling)
- **Components**: Chapter 17 (pan-theme-provider, pan-theme-toggle)
- **Patterns**: Appendix E (Theming Patterns)
- **Related**: Chapter 19 (UI Components)

## Common Issues

### Issue: Theme not applying on load
**Problem**: Flash of unstyled content
**Solution**: Apply theme in inline `<script>` before loading components; add `no-transitions` class during initial load

### Issue: Custom properties not inheriting
**Problem**: Shadow DOM doesn't inherit all properties
**Solution**: Explicitly pass needed properties through; use CSS `:host` context

### Issue: Theme transition lag
**Problem**: Too many properties transitioning
**Solution**: Transition only color-related properties; use `prefers-reduced-motion` to disable

### Issue: Dark mode colors look washed out
**Problem**: Using same colors as light mode
**Solution**: Use slightly desaturated colors in dark mode; adjust shadows to be darker

### Issue: System preference not detected
**Problem**: `prefers-color-scheme` not working
**Solution**: Ensure HTTPS context; check browser support; verify media query syntax

See *Learning LARC* Chapter 15 for complete theming strategies, advanced CSS patterns, and design system integration.
