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

    // Add demo content for better visibility
    this.addDemoContent(element, componentMeta);

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

  addDemoContent(element, componentMeta) {
    const name = componentMeta.name;

    // Add a label showing the component name for easy identification
    const label = document.createElement('div');
    label.className = 'pg-component-label';
    label.textContent = componentMeta.displayName;
    label.style.cssText = 'padding: 8px; background: #f0f0f0; border-bottom: 1px solid #ddd; font-size: 12px; font-weight: 600; color: #666;';
    element.appendChild(label);

    // Add type-specific demo content
    if (name === 'pan-card') {
      element.setAttribute('header', 'Card Header');
      const content = document.createElement('p');
      content.textContent = 'This is card content. Edit attributes in the properties panel.';
      content.style.padding = '16px';
      element.appendChild(content);
    } else if (name === 'pan-table') {
      const placeholder = document.createElement('div');
      placeholder.innerHTML = '<p style="padding: 16px;">Table component - configure data source in properties</p>';
      element.appendChild(placeholder);
    } else if (name === 'pan-tabs') {
      const placeholder = document.createElement('div');
      placeholder.innerHTML = '<p style="padding: 16px;">Tabs component - add tab content as children</p>';
      element.appendChild(placeholder);
    } else if (name === 'pan-modal') {
      const placeholder = document.createElement('div');
      placeholder.innerHTML = '<p style="padding: 16px;">Modal component - set "open" attribute to show</p>';
      element.appendChild(placeholder);
    } else if (name === 'pan-form') {
      const placeholder = document.createElement('div');
      placeholder.innerHTML = '<p style="padding: 16px;">Form component - add form inputs as children</p>';
      element.appendChild(placeholder);
    } else {
      // Generic placeholder for other components
      const placeholder = document.createElement('div');
      placeholder.style.cssText = 'padding: 16px; min-height: 60px; background: #fafafa;';
      placeholder.innerHTML = `<p style="color: #999; font-size: 14px;">${componentMeta.displayName} component<br><small>${componentMeta.description}</small></p>`;
      element.appendChild(placeholder);
    }

    // Add minimum sizing so it's visible
    element.style.cssText = 'display: block; min-width: 200px; min-height: 80px; margin: 8px; border: 1px solid #ddd; border-radius: 4px; background: white;';
  }

  async ensureComponentLoaded(componentMeta) {
    // Check if component is already defined
    if (customElements.get(componentMeta.name)) {
      return;
    }

    // Try to load the component
    try {
      // Registry paths are relative to playground/ directory
      // We're in playground/components/, so add one more ../
      const componentPath = componentMeta.path.replace('../', '../../');
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

  async loadExample(example) {
    // Clear existing components first
    this.clearAll();

    // Load the component registry to get metadata
    const registryResponse = await fetch('./component-registry.json');
    const registry = await registryResponse.json();

    // Add each component from the example
    for (const exampleComp of example.components) {
      // Find the component metadata
      const componentMeta = registry.components.find(c => c.name === exampleComp.name);
      if (!componentMeta) {
        console.warn(`Component ${exampleComp.name} not found in registry`);
        continue;
      }

      // Wait for component to be added
      await this.ensureComponentLoaded(componentMeta);

      // Create the element
      const element = document.createElement(componentMeta.name);

      // Apply example-specific attributes
      Object.entries(exampleComp.attributes || {}).forEach(([key, value]) => {
        element.setAttribute(key, value);
      });

      // Add demo content
      this.addDemoContent(element, componentMeta);

      // Make it selectable
      element.classList.add('pg-component');
      element.dataset.componentId = crypto.randomUUID();
      element.dataset.componentMeta = JSON.stringify(componentMeta);

      // Click to select
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectComponent(element);
      });

      // Add to canvas
      const previewArea = this.querySelector('#preview-area');
      const emptyState = previewArea.querySelector('.empty-state');
      if (emptyState) emptyState.remove();

      previewArea.appendChild(element);
      this.components.push(element);
    }

    // Notify canvas changed
    this.dispatchEvent(new CustomEvent('canvas-changed', {
      bubbles: true
    }));
  }
}

customElements.define('pg-canvas', PgCanvas);
