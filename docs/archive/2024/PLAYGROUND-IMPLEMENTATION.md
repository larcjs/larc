# LARC Playground - Implementation Plan

## Overview

Build an interactive component playground that serves as:
- 🔧 Development and testing tool
- 🎨 Visual component explorer
- 📖 Live documentation
- 🚀 Marketing/demo tool
- 🏗️ Foundation for future visual editor

**Timeline:** 7-10 days
**Priority:** HIGH - Accelerates all other development

## Core Features (MVP)

### 1. Component Palette (Sidebar)
- Browse components by category
- Search/filter components
- Component icons and descriptions
- Click or drag to add to canvas

### 2. Live Canvas (Center)
- Drop zone for components
- Real-time preview (no build step!)
- Component selection/highlighting
- Basic layout (flexbox-based)
- Responsive preview modes

### 3. Properties Panel (Right)
- Edit component attributes
- Live updates as you type
- Type-appropriate inputs (text, number, boolean, select)
- Reset to defaults

### 4. Code Export
- View generated HTML
- Copy to clipboard
- Download as file
- Clean, hand-editable output

### 5. PAN Bus Visualizer
- Show messages flowing between components
- Message details (topic, data)
- Filter by topic
- Clear log

## Architecture

```
playground/
├── index.html              # Main playground page
├── playground.mjs          # Main playground controller
├── components/
│   ├── pg-palette.mjs     # Component palette sidebar
│   ├── pg-canvas.mjs      # Live preview canvas
│   ├── pg-properties.mjs  # Properties panel
│   ├── pg-exporter.mjs    # Code export
│   └── pg-bus-monitor.mjs # PAN bus visualizer
├── component-registry.json # Generated component metadata
├── styles/
│   └── playground.css     # Playground styles
└── scripts/
    └── generate-registry.js # Registry generator
```

## Component Palette (pg-palette.mjs)

```javascript
/**
 * Component palette for selecting and adding components
 */
class PgPalette extends HTMLElement {
  connectedCallback() {
    this.loadRegistry();
    this.render();
  }

  async loadRegistry() {
    const response = await fetch('./component-registry.json');
    this.registry = await response.json();
  }

  render() {
    const categories = this.registry.categories;

    this.innerHTML = `
      <div class="palette">
        <input type="search" placeholder="Search components..." class="search">

        ${categories.map(cat => `
          <details open>
            <summary>${cat.icon} ${cat.name}</summary>
            <div class="components">
              ${this.getComponentsInCategory(cat.id).map(c => `
                <button class="component-item"
                        data-component='${JSON.stringify(c)}'
                        title="${c.description}">
                  <span class="icon">${c.icon}</span>
                  <span class="name">${c.displayName}</span>
                </button>
              `).join('')}
            </div>
          </details>
        `).join('')}
      </div>
    `;

    this.attachEventListeners();
  }

  getComponentsInCategory(categoryId) {
    return this.registry.components.filter(c => c.category === categoryId);
  }

  attachEventListeners() {
    // Click to add
    this.querySelectorAll('.component-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const component = JSON.parse(btn.dataset.component);
        this.dispatchEvent(new CustomEvent('component-selected', {
          detail: component,
          bubbles: true
        }));
      });
    });

    // Search
    const searchInput = this.querySelector('.search');
    searchInput.addEventListener('input', (e) => {
      this.filterComponents(e.target.value);
    });
  }

  filterComponents(query) {
    // Filter component items based on search
  }
}

customElements.define('pg-palette', PgPalette);
```

## Live Canvas (pg-canvas.mjs)

```javascript
/**
 * Live preview canvas where components are placed
 */
class PgCanvas extends HTMLElement {
  constructor() {
    super();
    this.components = [];
    this.selectedComponent = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="canvas">
        <div class="canvas-toolbar">
          <button class="btn-clear">Clear All</button>
          <select class="viewport-size">
            <option value="desktop">Desktop</option>
            <option value="tablet">Tablet</option>
            <option value="mobile">Mobile</option>
          </select>
        </div>
        <div class="canvas-content" id="preview-area">
          <div class="empty-state">
            Click a component from the sidebar to add it here
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for component additions
    document.addEventListener('component-selected', (e) => {
      this.addComponent(e.detail);
    });

    // Clear button
    this.querySelector('.btn-clear').addEventListener('click', () => {
      this.clearAll();
    });

    // Viewport size
    this.querySelector('.viewport-size').addEventListener('change', (e) => {
      this.setViewportSize(e.target.value);
    });
  }

  addComponent(componentMeta) {
    const previewArea = this.querySelector('#preview-area');

    // Remove empty state
    const emptyState = previewArea.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Create component instance
    const element = document.createElement(componentMeta.name);

    // Apply default attributes
    componentMeta.attributes?.forEach(attr => {
      if (attr.default !== undefined) {
        element.setAttribute(attr.name, attr.default);
      }
    });

    // Make it selectable
    element.classList.add('pg-component');
    element.dataset.componentId = crypto.randomUUID();
    element.dataset.componentMeta = JSON.stringify(componentMeta);

    // Click to select
    element.addEventListener('click', (e) => {
      e.stopPropagation();
      this.selectComponent(element);
    });

    previewArea.appendChild(element);
    this.components.push(element);
    this.selectComponent(element);
  }

  selectComponent(element) {
    // Remove previous selection
    this.querySelectorAll('.pg-component.selected').forEach(el => {
      el.classList.remove('selected');
    });

    // Select new component
    element.classList.add('selected');
    this.selectedComponent = element;

    // Notify properties panel
    this.dispatchEvent(new CustomEvent('component-selected-canvas', {
      detail: {
        element,
        meta: JSON.parse(element.dataset.componentMeta)
      },
      bubbles: true
    }));
  }

  clearAll() {
    const previewArea = this.querySelector('#preview-area');
    previewArea.innerHTML = `
      <div class="empty-state">
        Click a component from the sidebar to add it here
      </div>
    `;
    this.components = [];
    this.selectedComponent = null;
  }

  setViewportSize(size) {
    const previewArea = this.querySelector('#preview-area');
    previewArea.className = 'canvas-content viewport-' + size;
  }
}

customElements.define('pg-canvas', PgCanvas);
```

## Properties Panel (pg-properties.mjs)

```javascript
/**
 * Properties panel for editing selected component
 */
class PgProperties extends HTMLElement {
  constructor() {
    super();
    this.selectedElement = null;
    this.componentMeta = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="properties">
        <div class="properties-header">
          <h3>Properties</h3>
        </div>
        <div class="properties-content">
          <div class="no-selection">
            Select a component to edit its properties
          </div>
        </div>
      </div>
    `;

    // Listen for component selection
    document.addEventListener('component-selected-canvas', (e) => {
      this.showProperties(e.detail.element, e.detail.meta);
    });
  }

  showProperties(element, meta) {
    this.selectedElement = element;
    this.componentMeta = meta;

    const content = this.querySelector('.properties-content');
    content.innerHTML = `
      <div class="component-info">
        <div class="component-icon">${meta.icon}</div>
        <div class="component-name">${meta.displayName}</div>
        <div class="component-desc">${meta.description}</div>
      </div>

      <div class="properties-section">
        <h4>Attributes</h4>
        ${this.renderAttributes(meta.attributes || [])}
      </div>

      <div class="properties-actions">
        <button class="btn-delete">Delete Component</button>
      </div>
    `;

    this.attachPropertyListeners();
  }

  renderAttributes(attributes) {
    if (attributes.length === 0) {
      return '<p class="no-attributes">No configurable attributes</p>';
    }

    return attributes.map(attr => {
      const currentValue = this.selectedElement.getAttribute(attr.name) || attr.default;

      return `
        <div class="property">
          <label>
            <span class="property-name">${attr.name}</span>
            <span class="property-type">${attr.type}</span>
          </label>
          ${this.renderInput(attr, currentValue)}
          <small class="property-desc">${attr.description}</small>
        </div>
      `;
    }).join('');
  }

  renderInput(attr, value) {
    switch (attr.type) {
      case 'boolean':
        return `<input type="checkbox"
                       data-attr="${attr.name}"
                       ${value === 'true' ? 'checked' : ''}>`;

      case 'number':
        return `<input type="number"
                       data-attr="${attr.name}"
                       value="${value}">`;

      case 'select':
        return `<select data-attr="${attr.name}">
                  ${attr.options.map(opt =>
                    `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                  ).join('')}
                </select>`;

      default:
        return `<input type="text"
                       data-attr="${attr.name}"
                       value="${value}"
                       placeholder="${attr.default || ''}">`;
    }
  }

  attachPropertyListeners() {
    // Listen for property changes
    this.querySelectorAll('[data-attr]').forEach(input => {
      input.addEventListener('input', (e) => {
        const attrName = e.target.dataset.attr;
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else {
          value = e.target.value;
        }

        // Update the actual component
        this.selectedElement.setAttribute(attrName, value);
      });
    });

    // Delete button
    this.querySelector('.btn-delete')?.addEventListener('click', () => {
      if (this.selectedElement) {
        this.selectedElement.remove();
        this.showNoSelection();
      }
    });
  }

  showNoSelection() {
    const content = this.querySelector('.properties-content');
    content.innerHTML = `
      <div class="no-selection">
        Select a component to edit its properties
      </div>
    `;
  }
}

customElements.define('pg-properties', PgProperties);
```

## Code Exporter (pg-exporter.mjs)

```javascript
/**
 * Code exporter for copying/downloading generated HTML
 */
class PgExporter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="exporter">
        <div class="exporter-header">
          <h3>HTML Code</h3>
          <div class="exporter-actions">
            <button class="btn-copy">Copy</button>
            <button class="btn-download">Download</button>
          </div>
        </div>
        <pre><code id="code-output"></code></pre>
      </div>
    `;

    this.setupListeners();
    this.updateCode();
  }

  setupListeners() {
    // Update code when canvas changes
    document.addEventListener('component-selected', () => {
      setTimeout(() => this.updateCode(), 100);
    });

    document.addEventListener('component-selected-canvas', () => {
      this.updateCode();
    });

    // Copy button
    this.querySelector('.btn-copy').addEventListener('click', () => {
      this.copyCode();
    });

    // Download button
    this.querySelector('.btn-download').addEventListener('click', () => {
      this.downloadCode();
    });
  }

  updateCode() {
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return;

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      this.querySelector('#code-output').textContent = '<!-- No components yet -->';
      return;
    }

    // Generate clean HTML
    const html = this.generateHTML(components);
    this.querySelector('#code-output').textContent = html;
  }

  generateHTML(components) {
    const lines = ['<!DOCTYPE html>', '<html>', '<head>',
      '  <meta charset="utf-8">',
      '  <title>LARC Playground Export</title>',
      '  <script type="module" src="https://unpkg.com/@larcjs/core/pan.mjs"></script>',
      '</head>', '<body>', '  <pan-bus></pan-bus>', ''];

    components.forEach(comp => {
      const tag = comp.tagName.toLowerCase();
      const attributes = Array.from(comp.attributes)
        .filter(attr => !attr.name.startsWith('data-') && attr.name !== 'class')
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      const content = comp.innerHTML.trim();

      if (content) {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}>`);
        lines.push(`    ${content}`);
        lines.push(`  </${tag}>`);
      } else {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}></${tag}>`);
      }
    });

    lines.push('', '</body>', '</html>');
    return lines.join('\n');
  }

  copyCode() {
    const code = this.querySelector('#code-output').textContent;
    navigator.clipboard.writeText(code).then(() => {
      // Show feedback
      const btn = this.querySelector('.btn-copy');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = originalText, 2000);
    });
  }

  downloadCode() {
    const code = this.querySelector('#code-output').textContent;
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'larc-playground-export.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}

customElements.define('pg-exporter', PgExporter);
```

## Main Layout (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC Playground</title>
  <link rel="stylesheet" href="./styles/playground.css">
  <script type="module" src="./playground.mjs"></script>
</head>
<body>
  <div class="playground">
    <!-- Header -->
    <header class="pg-header">
      <h1>🎨 LARC Playground</h1>
      <div class="pg-actions">
        <button id="toggle-bus-monitor">PAN Monitor</button>
        <button id="toggle-code">View Code</button>
      </div>
    </header>

    <!-- Main Layout -->
    <div class="pg-main">
      <!-- Left: Component Palette -->
      <aside class="pg-sidebar">
        <pg-palette></pg-palette>
      </aside>

      <!-- Center: Canvas -->
      <main class="pg-canvas-area">
        <pg-canvas></pg-canvas>
      </main>

      <!-- Right: Properties Panel -->
      <aside class="pg-properties-area">
        <pg-properties></pg-properties>
      </aside>
    </div>

    <!-- Bottom: Code Export / Bus Monitor (toggleable) -->
    <div class="pg-bottom" id="bottom-panel" hidden>
      <pg-exporter id="code-panel"></pg-exporter>
      <pg-bus-monitor id="bus-panel" hidden></pg-bus-monitor>
    </div>
  </div>

  <pan-bus debug="true"></pan-bus>
</body>
</html>
```

## Implementation Order

1. **Component Registry** (Day 1)
   - Create generator script
   - Add JSDoc to 5-10 key components
   - Generate registry.json

2. **Base Structure** (Day 1)
   - Create playground directory
   - Basic HTML layout
   - CSS framework (flexbox grid)

3. **Component Palette** (Day 2)
   - Load registry.json
   - Render categorized components
   - Search functionality
   - Click to add

4. **Live Canvas** (Day 2-3)
   - Component instantiation
   - Selection handling
   - Basic layout
   - Clear functionality

5. **Properties Panel** (Day 3-4)
   - Attribute editing
   - Type-specific inputs
   - Live updates
   - Delete component

6. **Code Export** (Day 4)
   - HTML generation
   - Copy to clipboard
   - Download file

7. **PAN Bus Monitor** (Day 5)
   - Message logging
   - Topic filtering
   - Message details

8. **Polish & Testing** (Day 6-7)
   - Responsive design
   - Error handling
   - Edge cases
   - Documentation

## Success Criteria

✅ Can browse and add 10+ components
✅ Can edit component properties live
✅ Can see components working together
✅ Can export clean HTML
✅ Can visualize PAN messages
✅ Zero build step (runs directly in browser)
✅ Built WITH LARC components (dogfooding)

## Future Enhancements (Post-MVP)

- Drag-and-drop reordering
- Component nesting/children
- Save/load projects (localStorage)
- Share via URL
- Undo/redo
- Responsive preview modes
- CSS editor
- Component templates/presets
- Keyboard shortcuts
- Dark mode
