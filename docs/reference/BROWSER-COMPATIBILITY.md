# Browser Compatibility Guide

**Last Updated:** November 2025
**Version:** LARC v1.0+

This document provides comprehensive browser compatibility information for LARC/PAN, including feature support matrices, polyfill recommendations, and graceful degradation strategies.

---

## Quick Reference

### Minimum Browser Versions

| Browser | Minimum Version | Released | Market Share |
|---------|----------------|----------|--------------|
| **Chrome** | 90+ | April 2021 | ~65% |
| **Edge** | 90+ | April 2021 | ~5% |
| **Firefox** | 88+ | April 2021 | ~3% |
| **Safari** | 14+ | September 2020 | ~20% |
| **Opera** | 76+ | April 2021 | ~2% |
| **Samsung Internet** | 15+ | April 2021 | ~3% |

**Total Coverage:** ~98% of global browser usage (as of 2025)

### Mobile Browser Support

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| **Chrome Mobile** | 90+ | Full support |
| **Safari iOS** | 14+ | Full support |
| **Samsung Internet** | 15+ | Full support |
| **Firefox Mobile** | 88+ | Full support |
| **Opera Mobile** | 76+ | Full support |

---

## Core Feature Support

### Essential Features (Required)

These features are **required** for LARC to function. All supported browsers include these features.

| Feature | Chrome | Firefox | Safari | Edge | Notes |
|---------|--------|---------|--------|------|-------|
| **Custom Elements v1** | 67+ | 63+ | 10.1+ | 79+ | ✅ Native support |
| **Shadow DOM v1** | 53+ | 63+ | 10+ | 79+ | ✅ Native support |
| **ES Modules** | 61+ | 60+ | 10.1+ | 16+ | ✅ Native support |
| **CustomEvent** | 15+ | 11+ | 6+ | 12+ | ✅ Native support |
| **Promise** | 32+ | 29+ | 8+ | 12+ | ✅ Native support |
| **Async/Await** | 55+ | 52+ | 10.1+ | 15+ | ✅ Native support |
| **IntersectionObserver** | 51+ | 55+ | 12.1+ | 15+ | ✅ Used for auto-loading |
| **MutationObserver** | 26+ | 14+ | 6+ | 12+ | ✅ Used for component discovery |

**Status:** ✅ All essential features supported in minimum browser versions.

---

### Optional Features

These features enhance functionality but are **not required**. Components gracefully degrade if unavailable.

#### 1. Origin Private File System (OPFS)

**Used by:** `<pan-files>`, file manager components

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | 102+ ✅ | Full support (April 2022) |
| **Edge** | 102+ ✅ | Full support (April 2022) |
| **Firefox** | 111+ ✅ | Full support (March 2023) |
| **Safari** | ❌ Not yet | Available in Technology Preview |
| **Opera** | 88+ ✅ | Full support |

**Fallback Strategy:**
```javascript
// Check OPFS availability
if ('storage' in navigator && 'getDirectory' in navigator.storage) {
  // Use OPFS
  this._storageType = 'opfs';
} else {
  // Fallback to IndexedDB or localStorage
  this._storageType = 'indexeddb';
  console.warn('OPFS not available, using IndexedDB fallback');
}
```

**Polyfill:** Not available (browser API)
**Recommendation:** Implement IndexedDB fallback for Safari users

---

#### 2. BroadcastChannel API

**Used by:** Cross-tab message mirroring

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | 54+ ✅ | Full support |
| **Edge** | 79+ ✅ | Full support |
| **Firefox** | 38+ ✅ | Full support |
| **Safari** | 15.4+ ✅ | Added April 2022 |
| **Opera** | 41+ ✅ | Full support |

**Safari Note:** Requires iOS 15.4+, macOS 12.3+

**Fallback Strategy:**
```javascript
// Check BroadcastChannel availability
if (typeof BroadcastChannel !== 'undefined') {
  this._channel = new BroadcastChannel('pan-bus');
} else {
  // Fallback to localStorage events
  this._channel = null;
  window.addEventListener('storage', this._handleStorageEvent.bind(this));
}
```

**Polyfill:** [`pubkey/broadcast-channel`](https://github.com/pubkey/broadcast-channel) (uses localStorage fallback)

---

#### 3. Web Workers

**Used by:** `<pan-worker>`, background processing

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | All ✅ | Full support since Chrome 4 |
| **Edge** | All ✅ | Full support |
| **Firefox** | All ✅ | Full support since Firefox 3.5 |
| **Safari** | All ✅ | Full support since Safari 4 |
| **Opera** | All ✅ | Full support since Opera 10.6 |

**Status:** ✅ Universal support, no polyfill needed

---

#### 4. Constructable Stylesheets

**Used by:** Dynamic theme injection

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | 73+ ✅ | Full support |
| **Edge** | 79+ ✅ | Full support |
| **Firefox** | 101+ ✅ | Full support (May 2022) |
| **Safari** | 16.4+ ⚠️ | Added March 2023 |
| **Opera** | 60+ ✅ | Full support |

**Safari Note:** Requires iOS 16.4+, macOS 13.3+

**Fallback Strategy:**
```javascript
// Check for constructable stylesheets
if ('adoptedStyleSheets' in Document.prototype) {
  // Use constructable stylesheets (faster)
  const sheet = new CSSStyleSheet();
  sheet.replaceSync(cssText);
  this.shadowRoot.adoptedStyleSheets = [sheet];
} else {
  // Fallback to <style> tag
  const style = document.createElement('style');
  style.textContent = cssText;
  this.shadowRoot.appendChild(style);
}
```

**Polyfill:** [`calebdwilliams/construct-style-sheets`](https://github.com/calebdwilliams/construct-style-sheets-polyfill)

---

#### 5. ResizeObserver

**Used by:** Responsive components, virtual scrolling

| Browser | Support | Notes |
|---------|---------|-------|
| **Chrome** | 64+ ✅ | Full support |
| **Edge** | 79+ ✅ | Full support |
| **Firefox** | 69+ ✅ | Full support |
| **Safari** | 13.1+ ✅ | Full support |
| **Opera** | 51+ ✅ | Full support |

**Status:** ✅ Well-supported

**Polyfill:** [`que-etc/resize-observer-polyfill`](https://github.com/que-etc/resize-observer-polyfill)

---

## Polyfill Recommendations

### Strategy 1: Selective Polyfills (Recommended)

Only load polyfills for browsers that need them:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>LARC App</title>

  <!-- Feature detection and selective polyfills -->
  <script>
    // Check for essential features
    if (!('customElements' in window) ||
        !('attachShadow' in Element.prototype)) {
      // Load webcomponents polyfill for older browsers
      document.write('<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-loader.js"><\/script>');
    }

    // Check for optional features
    if (typeof BroadcastChannel === 'undefined') {
      // Load BroadcastChannel polyfill
      document.write('<script src="https://unpkg.com/broadcast-channel@4.20.2/dist/bundle.js"><\/script>');
    }

    if (typeof ResizeObserver === 'undefined') {
      // Load ResizeObserver polyfill
      document.write('<script src="https://unpkg.com/resize-observer-polyfill@1.5.1/dist/ResizeObserver.js"><\/script>');
    }
  </script>

  <!-- Load LARC after polyfills -->
  <script type="module" src="https://unpkg.com/@larcjs/core/pan.js"></script>
</head>
<body>
  <!-- Your app here -->
</body>
</html>
```

### Strategy 2: Polyfill.io (CDN-based)

Automatically serve only needed polyfills:

```html
<script crossorigin="anonymous"
        src="https://polyfill.io/v3/polyfill.min.js?features=CustomEvent,IntersectionObserver,ResizeObserver,BroadcastChannel">
</script>
```

**Pros:** Automatic detection, minimal payload
**Cons:** Requires external service

### Strategy 3: Bundle All Polyfills

For maximum compatibility (larger payload):

```html
<!-- All polyfills (increases initial load) -->
<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2.8.0/webcomponents-bundle.js"></script>
<script src="https://unpkg.com/broadcast-channel@4.20.2/dist/bundle.js"></script>
<script src="https://unpkg.com/resize-observer-polyfill@1.5.1/dist/ResizeObserver.js"></script>
```

**Size Impact:** ~80 KB gzipped
**Use Case:** Maximum compatibility, intranet apps

---

## Polyfill Package Recommendations

### Core Polyfills

```json
{
  "dependencies": {
    "@webcomponents/webcomponentsjs": "^2.8.0",
    "broadcast-channel": "^4.20.2",
    "resize-observer-polyfill": "^1.5.1",
    "construct-style-sheets-polyfill": "^3.1.0"
  }
}
```

### NPM Installation

```bash
npm install @webcomponents/webcomponentsjs \
            broadcast-channel \
            resize-observer-polyfill \
            construct-style-sheets-polyfill
```

---

## Feature Detection Utilities

### Utility Function

```javascript
/**
 * Feature detection utilities for LARC
 */
export const Features = {
  /**
   * Check if all core features are supported
   */
  hasCoreFeatuers() {
    return (
      'customElements' in window &&
      'attachShadow' in Element.prototype &&
      'Promise' in window &&
      'IntersectionObserver' in window &&
      'MutationObserver' in window
    );
  },

  /**
   * Check specific features
   */
  has: {
    customElements: () => 'customElements' in window,
    shadowDOM: () => 'attachShadow' in Element.prototype,
    esModules: () => 'noModule' in document.createElement('script'),
    opfs: () => 'storage' in navigator && 'getDirectory' in navigator.storage,
    broadcastChannel: () => typeof BroadcastChannel !== 'undefined',
    resizeObserver: () => typeof ResizeObserver !== 'undefined',
    constructableStylesheets: () => 'adoptedStyleSheets' in Document.prototype,
    intersectionObserver: () => typeof IntersectionObserver !== 'undefined',
    webWorkers: () => typeof Worker !== 'undefined'
  },

  /**
   * Get compatibility report
   */
  getReport() {
    return {
      core: this.hasCoreFeatuers(),
      optional: {
        opfs: this.has.opfs(),
        broadcastChannel: this.has.broadcastChannel(),
        resizeObserver: this.has.resizeObserver(),
        constructableStylesheets: this.has.constructableStylesheets(),
        webWorkers: this.has.webWorkers()
      },
      browser: this.detectBrowser()
    };
  },

  /**
   * Detect browser and version
   */
  detectBrowser() {
    const ua = navigator.userAgent;
    let browser = 'unknown';
    let version = 0;

    if (/Chrome\/(\d+)/.test(ua) && !/Edge/.test(ua)) {
      browser = 'chrome';
      version = parseInt(RegExp.$1);
    } else if (/Firefox\/(\d+)/.test(ua)) {
      browser = 'firefox';
      version = parseInt(RegExp.$1);
    } else if (/Safari\//.test(ua) && !/Chrome/.test(ua)) {
      browser = 'safari';
      const match = ua.match(/Version\/(\d+)/);
      version = match ? parseInt(match[1]) : 0;
    } else if (/Edge\/(\d+)/.test(ua)) {
      browser = 'edge';
      version = parseInt(RegExp.$1);
    }

    return { browser, version };
  }
};
```

### Usage Example

```javascript
import { Features } from './features.js';

// Check before initializing
if (!Features.hasCoreFeatuers()) {
  console.error('Browser does not support core features');
  // Show upgrade message
  showBrowserUpgradeMessage();
} else {
  // Initialize app
  initializeApp();
}

// Get full report
const report = Features.getReport();
console.log('Feature Support:', report);

// Optional: Send to analytics
if (window.analytics) {
  analytics.track('Browser Features', report);
}
```

---

## Graceful Degradation Strategies

### Pattern 1: Progressive Enhancement

Start with basic functionality, enhance if features available:

```javascript
class PanDataTable extends HTMLElement {
  connectedCallback() {
    // Basic table always works
    this.renderBasicTable();

    // Enhance if IntersectionObserver available
    if (typeof IntersectionObserver !== 'undefined') {
      this.enableVirtualScrolling();
    }

    // Enhance if ResizeObserver available
    if (typeof ResizeObserver !== 'undefined') {
      this.enableResponsiveColumns();
    }
  }
}
```

### Pattern 2: Feature Flags

Use attributes to control feature usage:

```html
<!-- Disable features not supported in current browser -->
<pan-data-table
  resource="users"
  virtual-scroll="auto"     <!-- auto-detect -->
  responsive="auto">        <!-- auto-detect -->
</pan-data-table>
```

```javascript
// In component
get virtualScrollEnabled() {
  const attr = this.getAttribute('virtual-scroll');
  if (attr === 'auto') {
    return typeof IntersectionObserver !== 'undefined';
  }
  return attr !== 'false';
}
```

### Pattern 3: Fallback Components

Provide alternative components for unsupported features:

```html
<!-- Use OPFS file manager if available, otherwise fallback -->
<pan-files id="fileManager"></pan-files>

<script type="module">
  const features = Features.getReport();
  const fileManager = document.getElementById('fileManager');

  if (!features.optional.opfs) {
    // Replace with fallback component
    const fallback = document.createElement('pan-files-indexeddb');
    fallback.id = 'fileManager';
    fileManager.replaceWith(fallback);
  }
</script>
```

---

## Legacy Browser Support

### IE11 Support (Not Recommended)

IE11 **is not officially supported**, but can work with extensive polyfills:

**Required Polyfills:**
- @webcomponents/webcomponentsjs (full bundle)
- core-js (ES6+ features)
- fetch polyfill
- Promise polyfill
- URL/URLSearchParams polyfill

**Bundle Size Impact:** +150 KB

**Recommendation:** Display upgrade message instead:

```html
<!--[if IE]>
<div class="browser-upgrade-notice">
  <h2>Browser Update Required</h2>
  <p>This application requires a modern browser. Please upgrade to:</p>
  <ul>
    <li>Chrome 90+</li>
    <li>Firefox 88+</li>
    <li>Edge 90+</li>
    <li>Safari 14+</li>
  </ul>
</div>
<style>
  .browser-upgrade-notice {
    padding: 2rem;
    background: #fff3cd;
    border: 2px solid #ffc107;
    margin: 2rem;
  }
</style>
<![endif]-->
```

---

## Mobile Browser Considerations

### iOS Safari Quirks

1. **OPFS Not Available**
   - Use IndexedDB fallback
   - localStorage as last resort

2. **Service Worker Registration**
   - Requires HTTPS or localhost
   - Must be registered on page load

3. **100vh Issue**
   - Use `100dvh` (dynamic viewport height) or JavaScript

```css
/* Use dynamic viewport height for mobile */
.full-height {
  height: 100vh;
  height: 100dvh; /* Safari 15.4+ */
}
```

### Android Chrome

- Full support for all features
- Excellent Web Components support
- OPFS available on Android 11+

### Samsung Internet

- Based on Chromium (good compatibility)
- Slightly behind Chrome in updates
- Test on real devices if targeting Samsung users

---

## Testing Matrix

### Recommended Testing Strategy

**Tier 1 (Critical) - Test Every Release:**
- Chrome 90+ (Desktop + Android)
- Safari 14+ (Desktop + iOS)
- Firefox 88+ (Desktop)

**Tier 2 (Important) - Test Major Releases:**
- Edge 90+ (Desktop)
- Samsung Internet 15+ (Mobile)
- Opera 76+ (Desktop)

**Tier 3 (Optional) - Test Quarterly:**
- Older versions (within 2 years)
- Less common browsers

### Automated Testing

```javascript
// Playwright test for cross-browser compatibility
import { test, expect } from '@playwright/test';

test.describe('Browser Compatibility', () => {
  test('works in Chrome', async ({ page }) => {
    await page.goto('http://localhost:8080');
    const features = await page.evaluate(() => Features.getReport());
    expect(features.core).toBe(true);
  });

  test('works in Firefox', async ({ page, browserName }) => {
    test.skip(browserName !== 'firefox');
    await page.goto('http://localhost:8080');
    const features = await page.evaluate(() => Features.getReport());
    expect(features.core).toBe(true);
  });

  test('works in Safari', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit');
    await page.goto('http://localhost:8080');
    const features = await page.evaluate(() => Features.getReport());
    expect(features.core).toBe(true);
  });
});
```

---

## Compatibility Checklist

Use this checklist when deploying LARC applications:

### Before Launch

- [ ] Test on Chrome 90+
- [ ] Test on Firefox 88+
- [ ] Test on Safari 14+
- [ ] Test on mobile (iOS Safari, Chrome Android)
- [ ] Verify polyfills load correctly
- [ ] Check feature detection works
- [ ] Test fallback behaviors
- [ ] Verify error messages for unsupported browsers
- [ ] Test on slow connections (throttled)
- [ ] Check console for warnings

### Production Checklist

- [ ] Polyfills loaded conditionally (not always)
- [ ] Feature detection implemented
- [ ] Graceful degradation in place
- [ ] User-facing error messages clear
- [ ] Analytics tracking browser support
- [ ] Documentation includes browser requirements
- [ ] Support team aware of compatibility issues

---

## Getting Help

### Compatibility Issues

If you encounter browser compatibility issues:

1. **Check this document** - Verify feature support
2. **Enable debug mode** - Add `?debug=true` to URL
3. **Check browser console** - Look for feature warnings
4. **Run feature report** - Use `Features.getReport()`
5. **Open an issue** - [GitHub Issues](https://github.com/larcjs/core/issues)

### Reporting Bugs

Include in bug reports:
- Browser name and version
- Operating system
- Feature report output (`Features.getReport()`)
- Console errors/warnings
- Steps to reproduce

---

## Resources

### Official Compatibility Databases

- [Can I Use](https://caniuse.com) - Web feature compatibility
- [MDN Browser Compatibility](https://developer.mozilla.org/en-US/docs/Web/API) - API support
- [Web Platform Tests](https://wpt.fyi) - Standards compliance

### Polyfill Libraries

- [Polyfill.io](https://polyfill.io) - CDN-based polyfills
- [Core-js](https://github.com/zloirock/core-js) - JavaScript polyfills
- [webcomponents.js](https://github.com/webcomponents/polyfills) - Web Components polyfills

### Testing Tools

- [Playwright](https://playwright.dev) - Cross-browser testing
- [BrowserStack](https://browserstack.com) - Real device testing
- [Can I Use Embed](https://caniuse.bitsofco.de) - Embed compatibility tables

---

**Last Updated:** November 2025
**Document Version:** 1.0
**Maintainer:** LARC Core Team
