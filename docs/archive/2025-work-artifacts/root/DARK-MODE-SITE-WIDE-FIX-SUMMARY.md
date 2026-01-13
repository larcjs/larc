# Dark Mode Site-Wide Fix Summary

## Overview
Fixed dark mode support across the entire LARC website to properly honor system preferences and allow manual theme switching.

## Changes Made

### 1. **Home Page Links Updated** (`/docs/site/index.html`)
   - **Navigation Menu:**
     - Docs: Changed from `/site/docs/index.html` → `/docs/` (better documentation explorer)
     - Wiki: Changed from `/docs/` → `https://github.com/larcjs/larc/wiki` (external GitHub wiki)
   - **Footer:**
     - Updated "Documentation Explorer" link to `/docs/`
     - Added "GitHub Wiki →" link to `https://github.com/larcjs/larc/wiki`

### 2. **Examples Page** (`/docs/site/examples.html`)
   - Fixed hardcoded `background: white` on `.example-card` → `background: var(--color-surface)`
   - Now properly displays dark backgrounds in dark mode

### 3. **CSS Files with Dark Mode Fixes**

#### `/docs/site/assets/docs.css`
   - **Before:** `@media (prefers-color-scheme: dark) { :root { ... } }`
   - **After:** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
   - Added proper specificity to allow manual light mode override

#### `/docs/site/examples/assets/grail.css`
   - **Before:** `@media (prefers-color-scheme: dark) { :root { ... } }`
   - **After:** `@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { ... } }`
   - Added `[data-theme="dark"]` and `[data-theme="light"]` manual override rules
   - Ensures demo pages respect manual theme choices

#### `/docs/index.html` (Wiki Explorer)
   - Added comprehensive CSS custom properties for theming
   - Changed header gradient from bright purple to subtle slate-gray
   - Light mode: `#1e293b` → `#334155`
   - Dark mode: `#0f172a` → `#1e293b`
   - Added `pan-theme-provider` component for theme persistence
   - Loaded `theme-init.js` before CSS to prevent flash

#### `/docs/site/wiki-explorer.html` (Alternative Wiki Explorer)
   - Same dark mode fixes as `/docs/index.html`
   - Synchronized header colors with main wiki explorer

### 4. **Header Color Changes**
Changed from vibrant purple/blue gradients to professional slate-gray:
   - **Light Mode:** `linear-gradient(135deg, #1e293b 0%, #334155 100%)`
   - **Dark Mode:** `linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`
   - Applied to both wiki explorer pages

## How Dark Mode Works Now

### Theme Priority System
1. **Manual override** (via theme toggle) takes highest priority
2. **System preference** (OS dark mode) is second
3. **Default** (light mode) is fallback

### Technical Implementation
```css
/* Default (light) */
:root {
  --color-bg: #f9fafb;
  --color-text: #111827;
}

/* System preference (only if not manually overridden) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-bg: #0f172a;
    --color-text: #f1f5f9;
  }
}

/* Manual dark mode override */
[data-theme="dark"] {
  --color-bg: #0f172a;
  --color-text: #f1f5f9;
}

/* Manual light mode override */
[data-theme="light"] {
  --color-bg: #f9fafb;
  --color-text: #111827;
}
```

### Page Load Sequence
1. `theme-init.js` runs **before CSS** (blocking script)
2. Checks localStorage for saved theme preference
3. Applies `data-theme` attribute immediately (no flash!)
4. CSS loads and sees correct theme attribute
5. `pan-theme-provider` component hydrates and syncs state
6. Theme changes persist across page loads

## Files Modified

### HTML Files
- `/docs/site/index.html` - Updated navigation links
- `/docs/site/examples.html` - Fixed card backgrounds
- `/docs/index.html` - Added complete dark mode support
- `/docs/site/wiki-explorer.html` - Added complete dark mode support

### CSS Files
- `/docs/site/assets/docs.css` - Fixed theme specificity
- `/docs/site/examples/assets/grail.css` - Added manual theme overrides

## Verification Checklist

✅ System dark mode detection works
✅ Manual theme toggle persists across pages
✅ No flash of wrong colors on page load
✅ Header colors are subtle and professional
✅ All cards/panels adapt to dark mode
✅ Text is readable in both modes
✅ Links updated correctly (Docs → /docs/, Wiki → GitHub)

## Pages with Dark Mode Support

### Fully Tested & Working
- ✅ Home page (`/docs/site/index.html`)
- ✅ Wiki Explorer (`/docs/index.html`)
- ✅ Examples page (`/docs/site/examples.html`)
- ✅ Apps page (`/docs/site/apps.html`)
- ✅ Books page (`/docs/site/books.html`)
- ✅ Gallery page (`/docs/site/gallery.html`)
- ✅ Theme Demo (`/docs/site/theme-demo.html`)
- ✅ Demo pages (`/docs/site/demo.html`, `/docs/site/demos.html`)

### Using External CSS (Already Supported)
- ✅ All pages using `docs.css`
- ✅ All pages using `grail.css`

## Browser Support
- ✅ Chrome/Edge
- ✅ Firefox
- ✅ Safari
- ✅ All browsers supporting `prefers-color-scheme`

## Maintenance Notes

### When Adding New Pages
1. Include `theme-init.js` in `<head>` (before CSS)
2. Use CSS custom properties for all colors
3. Add `<pan-theme-provider>` component to body
4. Test with `data-theme="dark"` in DevTools

### When Updating Styles
1. Always use `var(--color-*)` instead of hardcoded colors
2. Test both light and dark modes
3. Verify no flash on page load

---

**Last Updated:** 2026-01-12
**Status:** ✅ Complete
