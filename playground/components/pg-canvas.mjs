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

    // Add a subtle badge showing the component name for easy identification
    const badge = document.createElement('div');
    badge.className = 'pg-component-badge';
    badge.textContent = `${componentMeta.icon} ${componentMeta.displayName}`;
    element.appendChild(badge);

    // Add sensible default content for common components
    if (name === 'pan-card') {
      if (!element.getAttribute('header')) {
        element.setAttribute('header', 'Card Title');
      }
      const content = document.createElement('div');
      content.style.padding = '1rem';
      content.innerHTML = '<p>Card content goes here. Select this component to edit its properties.</p>';
      element.appendChild(content);
    } else if (name === 'pan-button' || name.includes('button')) {
      if (!element.textContent.trim()) {
        element.textContent = 'Button';
      }
    } else if (name === 'pan-input' || name.includes('input')) {
      if (!element.getAttribute('placeholder')) {
        element.setAttribute('placeholder', 'Enter text...');
      }
    } else if (name === 'pan-tabs') {
      const content = document.createElement('div');
      content.style.padding = '1rem';
      content.innerHTML = `
        <div style="display: flex; gap: 0.5rem; border-bottom: 2px solid #e0e0e0; padding-bottom: 0.5rem; margin-bottom: 1rem;">
          <button style="padding: 0.5rem 1rem; border: none; background: #667eea; color: white; border-radius: 4px; cursor: pointer;">Tab 1</button>
          <button style="padding: 0.5rem 1rem; border: none; background: #f0f0f0; color: #666; border-radius: 4px; cursor: pointer;">Tab 2</button>
          <button style="padding: 0.5rem 1rem; border: none; background: #f0f0f0; color: #666; border-radius: 4px; cursor: pointer;">Tab 3</button>
        </div>
        <div style="padding: 1rem;">
          <p>Tab content will appear here.</p>
        </div>
      `;
      element.appendChild(content);
    } else if (name === 'pan-table' || name === 'pan-data-table') {
      const table = document.createElement('div');
      table.style.padding = '1rem';
      table.innerHTML = `
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f5f5f5; border-bottom: 2px solid #e0e0e0;">
              <th style="padding: 0.75rem; text-align: left;">Column 1</th>
              <th style="padding: 0.75rem; text-align: left;">Column 2</th>
              <th style="padding: 0.75rem; text-align: left;">Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 0.75rem;">Data 1</td>
              <td style="padding: 0.75rem;">Data 2</td>
              <td style="padding: 0.75rem;">Data 3</td>
            </tr>
            <tr style="border-bottom: 1px solid #f0f0f0;">
              <td style="padding: 0.75rem;">Data 4</td>
              <td style="padding: 0.75rem;">Data 5</td>
              <td style="padding: 0.75rem;">Data 6</td>
            </tr>
          </tbody>
        </table>
      `;
      element.appendChild(table);
    } else if (name === 'pan-form') {
      const form = document.createElement('div');
      form.style.padding = '1rem';
      form.innerHTML = `
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Name</label>
          <input type="text" placeholder="Enter name" style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px;">
        </div>
        <div style="margin-bottom: 1rem;">
          <label style="display: block; margin-bottom: 0.5rem; font-weight: 500;">Email</label>
          <input type="email" placeholder="Enter email" style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px;">
        </div>
        <button style="padding: 0.5rem 1.5rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
      `;
      element.appendChild(form);
    } else if (name === 'pan-modal') {
      const modal = document.createElement('div');
      modal.style.cssText = 'border: 2px solid #667eea; border-radius: 8px; padding: 1.5rem; background: white;';
      modal.innerHTML = `
        <h3 style="margin: 0 0 1rem 0; color: #333;">Modal Title</h3>
        <p style="margin: 0 0 1rem 0; color: #666;">This is a modal dialog. Set the "open" attribute to show it.</p>
        <button style="padding: 0.5rem 1rem; background: #667eea; color: white; border: none; border-radius: 4px; cursor: pointer;">Close</button>
      `;
      element.appendChild(modal);
    } else {
      // For components without specific content, just add a hint
      const hint = document.createElement('div');
      hint.className = 'pg-component-hint';
      hint.style.cssText = 'padding: 1.5rem; color: #999; font-size: 0.875rem; text-align: center; min-height: 60px; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.5rem;';
      hint.innerHTML = `
        <div style="font-weight: 500;">${componentMeta.displayName}</div>
        <div style="font-size: 0.75rem; color: #bbb;">${componentMeta.description}</div>
        <div style="font-size: 0.75rem; color: #bbb;">Configure in properties panel →</div>
      `;
      element.appendChild(hint);
    }
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
