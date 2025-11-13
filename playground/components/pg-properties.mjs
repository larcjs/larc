/**
 * Properties Panel
 * 
 * Edit attributes of selected component
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

    // Listen for deselection
    document.addEventListener('component-deselected', () => {
      this.showNoSelection();
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
      const currentValue = this.selectedElement.getAttribute(attr.name) || attr.default || '';

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
                       ${value === 'true' || value === true ? 'checked' : ''}>`;

      case 'number':
        return `<input type="number"
                       data-attr="${attr.name}"
                       value="${value}"
                       placeholder="${attr.default || ''}">`;

      case 'select':
        if (attr.options && Array.isArray(attr.options)) {
          return `<select data-attr="${attr.name}">
                    ${attr.options.map(opt =>
                      `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
                    ).join('')}
                  </select>`;
        }
        return `<input type="text"
                       data-attr="${attr.name}"
                       value="${value}"
                       placeholder="${attr.default || ''}">`;

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
      const eventType = input.type === 'checkbox' ? 'change' : 'input';
      
      input.addEventListener(eventType, (e) => {
        const attrName = e.target.dataset.attr;
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
        } else {
          value = e.target.value;
        }

        // Update the actual component
        if (this.selectedElement) {
          this.selectedElement.setAttribute(attrName, value);
          
          // Notify canvas that something changed
          document.dispatchEvent(new CustomEvent('canvas-changed', {
            bubbles: true
          }));
        }
      });
    });

    // Delete button
    this.querySelector('.btn-delete')?.addEventListener('click', () => {
      if (this.selectedElement) {
        this.selectedElement.remove();
        this.showNoSelection();
        
        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
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
    this.selectedElement = null;
    this.componentMeta = null;
  }
}

customElements.define('pg-properties', PgProperties);
