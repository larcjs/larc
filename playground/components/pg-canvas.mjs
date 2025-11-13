/**
 * Live Canvas
 * 
 * Preview area where components are placed and rendered
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
          <select class="viewport-size" aria-label="Viewport size">
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

    // Click outside to deselect
    this.querySelector('#preview-area').addEventListener('click', (e) => {
      if (e.target.id === 'preview-area') {
        this.deselectAll();
      }
    });
  }

  async addComponent(componentMeta) {
    const previewArea = this.querySelector('#preview-area');

    // Remove empty state
    const emptyState = previewArea.querySelector('.empty-state');
    if (emptyState) emptyState.remove();

    // Dynamically import the component if needed
    await this.ensureComponentLoaded(componentMeta);

    // Create component instance
    const element = document.createElement(componentMeta.name);

    // Apply default attributes
    componentMeta.attributes?.forEach(attr => {
      if (attr.default !== undefined && attr.default !== '') {
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

    // Notify that canvas changed
    this.dispatchEvent(new CustomEvent('canvas-changed', {
      bubbles: true
    }));
  }

  async ensureComponentLoaded(componentMeta) {
    // Check if component is already defined
    if (customElements.get(componentMeta.name)) {
      return;
    }

    // Try to load the component
    try {
      const componentPath = componentMeta.path.replace('../components/src/components/', '../components/src/components/');
      await import(componentPath);
    } catch (err) {
      console.warn(`Failed to load component ${componentMeta.name}:`, err);
    }
  }

  selectComponent(element) {
    // Remove previous selection
    this.deselectAll();

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

  deselectAll() {
    this.querySelectorAll('.pg-component.selected').forEach(el => {
      el.classList.remove('selected');
    });
    this.selectedComponent = null;

    // Notify properties panel
    this.dispatchEvent(new CustomEvent('component-deselected', {
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

    // Notify that canvas changed
    this.dispatchEvent(new CustomEvent('canvas-changed', {
      bubbles: true
    }));
  }

  setViewportSize(size) {
    const previewArea = this.querySelector('#preview-area');
    previewArea.className = 'canvas-content';
    if (size !== 'desktop') {
      previewArea.classList.add('viewport-' + size);
    }
  }

  getComponents() {
    return this.components;
  }
}

customElements.define('pg-canvas', PgCanvas);
