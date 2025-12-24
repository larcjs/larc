# LARC Components

[![Version](https://img.shields.io/npm/v/@larcjs/ui.svg)](https://www.npmjs.com/package/@larcjs/ui)
[![UI Tests](https://github.com/larcjs/larc/actions/workflows/ui-tests.yml/badge.svg)](https://github.com/larcjs/larc/actions/workflows/ui-tests.yml)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Security](https://img.shields.io/badge/security-audited-brightgreen.svg)](docs/COMPONENT_SECURITY_AUDIT.md)

> **Production-ready UI web components** built on the PAN messaging bus

A comprehensive library of framework-agnostic UI components that communicate via the PAN (Page Area Network) messaging system. Build complex UIs with zero coupling between components.

## Features

- 🎨 **57+ Production Components** — Tables, forms, grids, charts, modals, and more
- 🔌 **Zero Coupling** — Components communicate only through PAN messages
- 🎯 **Framework Complement** — Use with React/Vue/Angular to reduce bundle size by 60%+
- 🚀 **Advanced State Management** — Cross-tab sync, offline-first, persistence, undo/redo
- 🔒 **Security Audited** — 0 critical vulnerabilities ([full audit](docs/COMPONENT_SECURITY_AUDIT.md))
- 🎨 **Themeable** — CSS custom properties for complete styling control
- ♿ **Accessible** — ARIA attributes and keyboard navigation
- 📦 **No Build Required** — Load components on demand via CDN

## 📊 Bundle Size Comparison

**Typical React Dashboard:**
```
React + ReactDOM:           172 KB
Material-UI or Ant Design:  300-500 KB
State Management:           20-50 KB
Router:                     20 KB
────────────────────────────────────
Total (before your code):   512-742 KB
```

**LARC Approach:**
```
PAN Core Lite:              9 KB minified (3 KB gzipped) ⭐
Components (on-demand):     ~7 KB each minified (~2 KB gzipped)
57 components total:        396 KB minified (110 KB gzipped)
Only load what you use:     9-100 KB typical (core-lite + components needed)
────────────────────────────────────
Savings:                    80-95% smaller
```

**Note:** Using [@larcjs/core-lite](../../packages/core-lite) instead of full @larcjs/core saves an additional 31KB!

**Real Example:**
A dashboard with sidebar, header, data table, charts, and modals:
- React + MUI: ~650 KB
- LARC Components: ~65 KB (core-lite + 8 components)
- **Result: 90% smaller bundle**

## Installation

```bash
npm install @larcjs/ui @larcjs/core
```

## Quick Start

### CDN Usage (Recommended)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- Load LARC Core autoloader -->
  <script type="module" src="https://unpkg.com/@larcjs/core@2.0.0/src/pan.js"></script>
</head>
<body>
  <!-- Components load automatically on demand -->
  <pan-data-table
    resource="users"
    columns='["id", "name", "email"]'>
  </pan-data-table>

  <!-- Inspector for debugging -->
  <pan-inspector></pan-inspector>
</body>
</html>
```

### Module Usage

```javascript
import '@larcjs/core';
import '@larcjs/ui/pan-data-table';
import '@larcjs/ui/pan-form';

// Components are now registered and ready to use
```

## Core Components

### Data Display

#### `<pan-data-table>`
Enterprise-grade data grid with sorting, filtering, pagination, and inline editing.

```html
<pan-data-table
  resource="products"
  columns='["id", "name", "price", "stock"]'
  sortable="true"
  filterable="true"
  editable="true">
</pan-data-table>
```

**Features:**
- Virtual scrolling for large datasets
- Inline editing with validation
- Multi-column sorting
- Advanced filtering
- Export to CSV/Excel
- Responsive design

#### `<pan-grid>`
Flexible data grid with drag-and-drop reordering and customizable layouts.

```html
<pan-grid
  resource="cards"
  layout="masonry"
  columns="3">
</pan-grid>
```

#### `<pan-chart>`
Interactive charts powered by Chart.js integration.

```html
<pan-chart
  type="line"
  topic="analytics.data"
  x-axis="date"
  y-axis="sales">
</pan-chart>
```

### Forms & Input

#### `<pan-form>`
Schema-driven form generator with validation and error handling.

```html
<pan-form
  resource="user"
  schema-topic="user.schema"
  submit-topic="user.save">
</pan-form>
```

**Features:**
- JSON Schema validation
- Auto-generated fields from schema
- Real-time validation
- File upload support
- Custom field templates

#### `<pan-dropdown>`
Searchable dropdown with keyboard navigation.

```html
<pan-dropdown
  topic="country.select"
  options-topic="countries.list.state"
  placeholder="Select country">
</pan-dropdown>
```

#### `<pan-date-picker>`
Accessible date/time picker with localization.

```html
<pan-date-picker
  topic="booking.date"
  min="2024-01-01"
  format="YYYY-MM-DD">
</pan-date-picker>
```

### Data Providers

#### `<pan-data-provider>`
Connects to REST APIs and manages data state.

```html
<pan-data-provider
  resource="users"
  endpoint="/api/users"
  auto-load="true">
</pan-data-provider>
```

**Features:**
- Automatic CRUD operations
- Request caching
- Optimistic updates
- Error handling
- Retry logic

#### `<pan-data-connector>`
Generic connector for any data source.

```html
<pan-data-connector
  resource="products"
  adapter="graphql"
  endpoint="https://api.example.com/graphql">
</pan-data-connector>
```

### UI Controls

#### `<pan-modal>`
Accessible modal dialogs with backdrop.

```html
<pan-modal id="confirmDialog" title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <button slot="footer">Confirm</button>
</pan-modal>
```

#### `<pan-tabs>`
Tab navigation with lazy loading.

```html
<pan-tabs>
  <pan-tab label="Overview" active>Content 1</pan-tab>
  <pan-tab label="Details">Content 2</pan-tab>
  <pan-tab label="Settings">Content 3</pan-tab>
</pan-tabs>
```

#### `<pan-toolbar>`
Action toolbar with responsive overflow menu.

```html
<pan-toolbar>
  <button data-action="save">Save</button>
  <button data-action="delete">Delete</button>
  <button data-action="export">Export</button>
</pan-toolbar>
```

### State Management

**NEW:** Advanced state management components for building offline-first, cross-tab synchronized applications with persistent state.

#### `<pan-state-sync>`
Cross-tab state synchronization using BroadcastChannel API.

```html
<pan-state-sync
  channel="myapp-sync"
  topics="users.*,todos.*"
  strategy="last-write-wins"
  leader="auto">
</pan-state-sync>
```

**Features:**
- Leader election for conflict prevention
- Automatic state sync across tabs
- Conflict resolution strategies
- Tab visibility handling

#### `<pan-computed-state>`
Derived/computed state with automatic dependency tracking.

```html
<pan-computed-state
  sources="cart.items,user.discount"
  output="cart.total"
  debounce="100"
  retain>
  <script>
    (items, discount) => {
      return items.reduce((sum, item) => sum + item.price, 0) - (discount || 0);
    }
  </script>
</pan-computed-state>
```

**Features:**
- Multi-source dependencies
- Async computation support
- Memoization strategies
- Debouncing for performance

#### `<pan-offline-sync>`
Offline-first support with automatic queue management and sync.

```html
<pan-offline-sync
  storage="offline-queue"
  retry-max="3"
  topics="todos.*,notes.*"
  endpoints='{"todos.*": "/api/todos"}'>
</pan-offline-sync>
```

**Features:**
- IndexedDB-based mutation queue
- Automatic retry with exponential backoff
- Network status monitoring
- Conflict resolution

#### `<pan-persistence-strategy>`
Declarative persistence routing to different storage backends.

```html
<pan-persistence-strategy auto-hydrate>
  <strategy topics="session.*" storage="memory" ttl="1800000"></strategy>
  <strategy topics="user.preferences.*" storage="localStorage"></strategy>
  <strategy topics="*.list.*" storage="indexedDB" database="app-data"></strategy>
</pan-persistence-strategy>
```

**Features:**
- Multiple storage backends (memory, localStorage, sessionStorage, IndexedDB)
- TTL support for cache expiration
- Automatic hydration on page load
- Size limits per topic

#### `<pan-schema-validator>`
Runtime JSON Schema validation without build tools.

```html
<pan-schema-validator topic="users.item.*" strict>
  <script type="application/json">
  {
    "type": "object",
    "properties": {
      "email": { "type": "string", "format": "email" },
      "age": { "type": "number", "minimum": 0 }
    },
    "required": ["email"]
  }
  </script>
</pan-schema-validator>
```

**Features:**
- Subset of JSON Schema Draft-07
- Strict and warning modes
- Built-in format validators
- Detailed error messages

#### `<pan-undo-redo>`
Time-travel debugging with undo/redo support.

```html
<pan-undo-redo
  topics="editor.*"
  max-history="50"
  channel="history"
  auto-snapshot>
</pan-undo-redo>
```

**Features:**
- Configurable history stack
- Automatic change batching
- Jump to timestamp
- Auto-snapshot support

See [State Management Patterns Guide](../STATE_MANAGEMENT_README.md) for complete documentation and examples.

### Developer Tools

#### `<pan-inspector>`
Enhanced real-time message inspector with state tree, metrics, and debugging tools.

```html
<pan-inspector></pan-inspector>
```

**Features:**
- **State Tree View** — Visualize all retained state
- **Metrics Dashboard** — Message rates, top topics, performance
- **Advanced Filtering** — Filter by topic patterns and type
- **Message Details** — Inspect full payloads and metadata
- **Export/Import** — Save and restore state snapshots
- **Performance Tracking** — Handler duration and message sizes

## Message Contracts

Components communicate via standardized topic patterns:

### List Operations
```javascript
// Request list
bus.publish('users.list.get', {});

// Receive list state
bus.subscribe('users.list.state', (msg) => {
  console.log('Users:', msg.payload.items);
});
```

### Item Operations
```javascript
// Select an item
bus.publish('users.item.select', { id: 123 });

// Request item details
await bus.request('users.item.get', { id: 123 });

// Save item
await bus.request('users.item.save', {
  item: { id: 123, name: 'Alice' }
});

// Delete item
await bus.request('users.item.delete', { id: 123 });
```

## Theming

Customize appearance using CSS custom properties:

```css
:root {
  /* Colors */
  --pan-primary-color: #007bff;
  --pan-secondary-color: #6c757d;
  --pan-success-color: #28a745;
  --pan-danger-color: #dc3545;

  /* Typography */
  --pan-font-family: system-ui, sans-serif;
  --pan-font-size: 14px;

  /* Spacing */
  --pan-spacing-sm: 8px;
  --pan-spacing-md: 16px;
  --pan-spacing-lg: 24px;

  /* Borders */
  --pan-border-radius: 4px;
  --pan-border-color: #dee2e6;
}
```

See [Theme System Documentation](docs/THEME_SYSTEM.md) for complete customization guide.

## Security

All components have been security audited:
- ✅ **0 critical vulnerabilities**
- ✅ **XSS protection** — Input sanitization on all user-editable fields
- ✅ **CSP compliant** — No inline scripts or styles
- ✅ **Safe defaults** — Secure configuration out of the box

See [Security Audit Report](docs/COMPONENT_SECURITY_AUDIT.md) for details.

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Component Catalog

View all components with live examples:
- [Gallery](https://larcjs.github.io/site/gallery.html)
- [Component Documentation](https://larcjs.github.io/site/docs/)
- [Interactive Demos](https://larcjs.github.io/examples/)

## 🎯 When to Use What

### Use LARC for:
- ✅ Cards, modals, dropdowns, tabs
- ✅ Data tables with sorting/filtering
- ✅ Forms (unless extremely complex)
- ✅ Navigation, breadcrumbs, pagination
- ✅ Theme switching, toasts, tooltips
- ✅ Authentication UI

### Keep React/Vue for:
- 🔧 Complex multi-step wizards
- 🔧 Rich text editors with live preview
- 🔧 Real-time collaborative features
- 🔧 Heavy client-side business logic

**Best practice:** Mix them! Use LARC for 80% of your UI, React/Vue for the 20% that needs framework power.

## Related Packages

- **[@larcjs/core](https://github.com/larcjs/core)** — Core PAN messaging bus
- **[@larcjs/react-adapter](https://github.com/larcjs/react-adapter)** — React hooks for PAN
- **[@larcjs/vue-adapter](https://github.com/larcjs/vue-adapter)** — Vue composables for PAN
- **[@larcjs/devtools](https://github.com/larcjs/devtools)** — Chrome DevTools extension
- **[@larcjs/examples](https://github.com/larcjs/examples)** — Demo applications including hybrid examples

## Testing

**Test Coverage:** ✅ **165 tests passing** (55 component specs × 3 browsers: Chromium, Firefox, WebKit)

Playwright exercises all major components end-to-end using the real PAN bus:

```bash
# Run all component specs headlessly
npm run test --workspace @larcjs/ui

# Watch mode with the Playwright UI
npm run test:ui --workspace @larcjs/ui
```

The tests load HTML fixtures from `tests/fixtures/` so you can iterate on components without any bundling step. Each component is tested for:
- Custom element registration
- Shadow DOM rendering
- Attribute reactivity
- PAN bus message handling
- Cross-browser compatibility

## Contributing

Contributions are welcome! Please see our [Contributing Guide](CONTRIBUTING.md).

## License

MIT © Chris Robison

## Support

- 📖 [Documentation](https://larcjs.github.io/site/)
- 💬 [Discussions](https://github.com/larcjs/components/discussions)
- 🐛 [Issue Tracker](https://github.com/larcjs/components/issues)
