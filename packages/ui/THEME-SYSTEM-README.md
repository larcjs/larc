# PAN Theme System - Complete Solution

## The Problem You Experienced

Every time you added a PAN component to a page, it didn't respect dark mode because:

1. **Shadow DOM isolation**: Web components use shadow DOM, which isolates their styles
2. **Inconsistent variable names**: Different components used different CSS variable names (`--bg` vs `--color-bg`, `--primary` vs `--color-accent`, etc.)
3. **No central theme source**: Each component had its own theme definitions

This meant you had to manually add dark mode support to every single component and every single page. **That's terrible DX!**

## The Solution

A **centralized theme system** with standardized variable names that automatically works everywhere.

### How It Works

1. **Global theme CSS** (`/packages/ui/theme.css`) defines all color variables at the `:root` level
2. **CSS variables inherit** through shadow DOM automatically
3. **All components use the same variable names** (enforced by convention and tooling)
4. **Theme responds to both** `@media (prefers-color-scheme)` AND `[data-theme]` attribute

### What Was Created

#### 1. `/packages/ui/theme.css`
The centralized theme definition that all pages should include:

```html
<link rel="stylesheet" href="/packages/ui/theme.css">
```

This file defines standard variables and responds to:
- System dark mode preference (`@media (prefers-color-scheme: dark)`)
- Explicit theme setting (`[data-theme="dark"]` set by `pan-theme-provider`)

#### 2. Standard Variable Names
All PAN components now use these standardized names:

| Variable | Purpose |
|----------|---------|
| `--color-bg` | Main page background |
| `--color-surface` | Component backgrounds |
| `--color-surface-alt` | Alternate surfaces (headers, hover) |
| `--color-border` | Standard borders |
| `--color-text` | Primary text |
| `--color-muted` | Secondary text |
| `--color-accent` | Interactive elements (buttons, links) |
| `--color-code-bg` | Code block backgrounds |

#### 3. `/packages/ui/scripts/fix-theme-vars.mjs`
A script that automatically updates components to use standard variable names:

```bash
# Check what needs updating
node packages/ui/scripts/fix-theme-vars.mjs --dry-run

# Fix all components
node packages/ui/scripts/fix-theme-vars.mjs

# Fix specific file
node packages/ui/scripts/fix-theme-vars.mjs --file=path/to/component.mjs
```

#### 4. `/packages/ui/THEMING.md`
Complete documentation for developers on how to use the theme system.

### Updated Files

- ✅ `packages/ui/pan-data-table.mjs` - Uses standard variables
- ✅ `packages/ui/pan-form.mjs` - Uses standard variables
- ✅ `packages/ui/pan-inspector.mjs` - Uses standard variables
- ✅ `packages/ui/pan-toast.mjs` - Auto-fixed by script
- ✅ `examples/tutorials/assets/grail.css` - Now imports from theme.css

### What This Means For You

#### For Existing Pages
**Nothing!** They automatically work now because:
- `grail.css` imports from `theme.css`
- All components were updated to use standard variable names
- Variables inherit through shadow DOM automatically

#### For New Pages
Just include the theme CSS:

```html
<!doctype html>
<html lang="en">
<head>
  <link rel="stylesheet" href="/packages/ui/theme.css">
</head>
<body>
  <!-- Your components will automatically respect dark mode -->
  <pan-data-table resource="items"></pan-data-table>

  <!-- Optional: enable theme switching -->
  <pan-theme-provider></pan-theme-provider>
</body>
</html>
```

#### For New Components
Use the standard variable names:

```javascript
class MyComponent extends HTMLElement {
  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          background: var(--color-surface, white);
          color: var(--color-text, #333);
          border: 1px solid var(--color-border, #ddd);
        }
        button {
          background: var(--color-accent, #2563eb);
          color: white;
        }
      </style>
      <div>Content</div>
    `;
  }
}
```

**That's it!** Dark mode works automatically. No shadow DOM style injection needed. No per-component theme logic. No manual updates.

## Why This Works

CSS custom properties (variables) are **inherited** properties. When you define them at `:root`, they inherit through shadow boundaries automatically. The key was:

1. **Define once** - Variables at `:root` in a global stylesheet
2. **Use everywhere** - Components reference these variables
3. **Update once** - Change `[data-theme]` attribute, all components update

This is the standard web platform approach. We just needed to standardize the variable names and ensure all components use them consistently.

## Future-Proofing

The `fix-theme-vars.mjs` script ensures new components follow the standard. Run it periodically:

```bash
npm run fix-theme-vars  # If added to package.json scripts
```

Or add a pre-commit hook to check for non-standard variable names.

## No More Manual Fixes!

This was the last time you need to manually add dark mode support to components. The system is now **centralized** and **automatic**. 🎉
