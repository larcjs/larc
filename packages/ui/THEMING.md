# PAN Theming System

## Problem
Shadow DOM components are isolated from global styles, but CSS custom properties (variables) DO inherit through shadow boundaries. However, inconsistent variable naming across components meant each component needed manual dark mode support.

## Solution
A centralized theme system with standardized CSS variable names that all components use.

## Setup (for HTML pages)

Include the global theme CSS in your `<head>`:

```html
<link rel="stylesheet" href="/packages/ui/theme.css">
```

Or if you have custom styling, ensure your CSS defines these variables at `:root` level and responds to `[data-theme="dark"]` and `[data-theme="light"]` attributes.

Add the theme provider to enable theme switching:

```html
<pan-theme-provider></pan-theme-provider>
```

That's it! All PAN components will now automatically respect dark mode.

## Standard CSS Variables

All PAN components MUST use these variable names:

### Backgrounds
- `--color-bg` - Main page background
- `--color-surface` - Component background (cards, panels)
- `--color-surface-alt` - Alternate surface (headers, hover states)

### Borders
- `--color-border` - Standard borders
- `--color-border-strong` - Emphasized borders

### Text
- `--color-text` - Primary text color
- `--color-muted` - Secondary/muted text

### Interactive
- `--color-accent` - Primary interactive color (buttons, links, highlights)
- `--color-accent-soft` - Soft accent background

### Semantic
- `--color-warning-light` - Warning background tint
- `--color-code-bg` - Code block background
- `--color-inspector-bg` - Inspector/debug background

## Component Development

When creating a new PAN component, use these variables in your styles:

```javascript
render() {
  this.shadowRoot.innerHTML = `
    <style>
      :host {
        display: block;
        background: var(--color-surface, white);
        color: var(--color-text, #333);
        border: 1px solid var(--color-border, #ddd);
      }
      button {
        background: var(--color-accent, #2563eb);
        color: white;
      }
    </style>
    <div>Your content</div>
  `;
}
```

The variables will automatically inherit from the document's `:root` and update when the theme changes.

## Legacy Variable Names (DEPRECATED)

These old variable names should be replaced:

- `--bg` → `--color-surface`
- `--fg` → `--color-text`
- `--border` → `--color-border`
- `--card` → `--color-surface-alt`
- `--accent` → `--color-accent`
- `--muted` → `--color-muted`
- `--primary` → `--color-accent`
- `--text-muted` → `--color-muted`

## Troubleshooting

**Q: My component doesn't respect dark mode**
- Ensure `/packages/ui/theme.css` is loaded in your HTML
- Check that your component uses `var(--color-*)` variable names
- Verify `<pan-theme-provider>` is present on the page

**Q: Can I override theme colors for a specific component?**
Yes! Set the CSS variable on the component itself:
```html
<pan-data-table style="--color-accent: red;"></pan-data-table>
```

**Q: Do I need to import anything in my component?**
No! CSS variables inherit automatically. Just use the standard variable names.
