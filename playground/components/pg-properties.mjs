/**
 * Properties Panel
 *
 * Edit attributes, CSS, and actions of selected component
 */

class PgProperties extends HTMLElement {
  constructor() {
    super();
    this.selectedElement = null;
    this.componentMeta = null;
    this.activeTab = 'properties';
    this.customCSS = new Map(); // componentId -> CSS string
    this.customActions = new Map(); // componentId -> actions array
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="properties">
        <div class="properties-header">
          <h3>Component Panel</h3>
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
    const componentId = element.dataset.componentId;

    // Get custom CSS and actions for this component
    const css = this.customCSS.get(componentId) || '';
    const actions = this.customActions.get(componentId) || [];

    const content = this.querySelector('.properties-content');
    content.innerHTML = `
      <div class="component-info">
        <div class="component-icon">${meta.icon}</div>
        <div class="component-name">${meta.displayName}</div>
        <div class="component-desc">${meta.description}</div>
        ${meta.helpText ? `
          <details class="component-help" style="margin-top: 1rem; padding: 0.75rem; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px;">
            <summary style="cursor: pointer; font-weight: 500; color: #1e40af; font-size: 0.875rem;">
              💡 Usage Guide
            </summary>
            <div style="margin-top: 0.75rem; font-size: 0.875rem; color: #1e3a8a; line-height: 1.6;">
              ${meta.helpText}
            </div>
          </details>
        ` : ''}
      </div>

      <div class="properties-tabs">
        <button class="properties-tab active" data-tab="properties">
          📝 Properties
        </button>
        <button class="properties-tab" data-tab="css">
          🎨 CSS
        </button>
        <button class="properties-tab" data-tab="actions">
          ⚡ Actions
        </button>
      </div>

      <div class="tab-content active" data-tab-content="properties">
        ${this.renderPropertiesTab(meta.attributes || [])}
      </div>

      <div class="tab-content" data-tab-content="css">
        ${this.renderCSSTab(css)}
      </div>

      <div class="tab-content" data-tab-content="actions">
        ${this.renderActionsTab(actions, meta)}
      </div>
    `;

    this.attachListeners();
  }

  renderPropertiesTab(attributes) {
    return `
      <div class="properties-section">
        <h4>Attributes</h4>
        ${this.renderAttributes(attributes)}
      </div>

      <div class="properties-actions">
        <button class="btn-delete">Delete Component</button>
      </div>
    `;
  }

  renderCSSTab(css) {
    return `
      <div class="properties-section">
        <h4>Container Styles</h4>
        <p style="font-size: 0.875rem; color: #666; margin-bottom: 1rem;">
          Add custom CSS to style the component container. Changes apply immediately.
        </p>

        <div class="css-editor-wrapper">
          <textarea
            class="css-editor"
            placeholder="/* Add custom CSS */
padding: 2rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
border-radius: 12px;
box-shadow: 0 4px 20px rgba(0,0,0,0.1);"
            rows="10">${css}</textarea>
        </div>

        <div class="css-presets">
          <h5 style="font-size: 0.875rem; margin: 1rem 0 0.5rem 0; color: #666;">Quick Presets:</h5>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <button class="btn-preset" data-preset="card">Card Style</button>
            <button class="btn-preset" data-preset="gradient">Gradient BG</button>
            <button class="btn-preset" data-preset="shadow">Shadow Box</button>
            <button class="btn-preset" data-preset="bordered">Bordered</button>
          </div>
        </div>

        <div style="margin-top: 1rem;">
          <button class="btn-apply-css" style="width: 100%; padding: 0.75rem; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Apply Styles
          </button>
          <button class="btn-clear-css" style="width: 100%; padding: 0.5rem; margin-top: 0.5rem; background: #f5f5f5; color: #666; border: none; border-radius: 6px; cursor: pointer; font-size: 0.875rem;">
            Clear Styles
          </button>
        </div>
      </div>
    `;
  }

  renderActionsTab(actions, meta) {
    return `
      <div class="properties-section">
        <h4>Event Listeners & Actions</h4>
        <p style="font-size: 0.875rem; color: #666; margin-bottom: 1rem;">
          Configure custom event handlers for this component.
        </p>

        <div class="actions-list">
          ${actions.length > 0 ? actions.map((action, idx) => `
            <div class="action-item" data-action-idx="${idx}">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                <strong style="font-size: 0.875rem;">${action.event}</strong>
                <button class="btn-delete-action" data-action-idx="${idx}" style="padding: 0.25rem 0.5rem; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                  Remove
                </button>
              </div>
              <div style="font-size: 0.75rem; color: #666; font-family: monospace; background: #f5f5f5; padding: 0.5rem; border-radius: 4px; margin-bottom: 0.5rem;">
                ${action.type === 'publish' ? `Publish: ${action.topic}` : `Console: ${action.message}`}
              </div>
            </div>
          `).join('') : '<p style="color: #999; font-size: 0.875rem; text-align: center; padding: 1rem;">No actions configured</p>'}
        </div>

        <div class="add-action-form" style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid #e0e0e0;">
          <h5 style="font-size: 0.875rem; margin-bottom: 1rem; color: #666;">Add New Action</h5>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500;">Event</label>
            <select class="action-event" style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.875rem;">
              <option value="click">Click</option>
              <option value="dblclick">Double Click</option>
              <option value="mouseenter">Mouse Enter</option>
              <option value="mouseleave">Mouse Leave</option>
              <option value="focus">Focus</option>
              <option value="blur">Blur</option>
              <option value="change">Change</option>
              <option value="input">Input</option>
              <option value="submit">Submit</option>
            </select>
          </div>

          <div style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500;">Action Type</label>
            <select class="action-type" style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.875rem;">
              <option value="publish">Publish PAN Message</option>
              <option value="console">Console Log</option>
              <option value="alert">Alert Dialog</option>
            </select>
          </div>

          <div class="action-publish-options" style="margin-bottom: 1rem;">
            <label style="display: block; margin-bottom: 0.5rem; font-size: 0.875rem; font-weight: 500;">Topic/Message</label>
            <input type="text" class="action-value" placeholder="e.g., user.click or Hello World" style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.875rem;">
          </div>

          <button class="btn-add-action" style="width: 100%; padding: 0.75rem; background: #10b981; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;">
            Add Action
          </button>
        </div>

        <div style="margin-top: 1.5rem; padding: 1rem; background: #f0f9ff; border: 1px solid #bfdbfe; border-radius: 6px; font-size: 0.75rem; color: #1e40af;">
          <strong>💡 Tip:</strong> Actions are triggered when the event occurs on this component. Use PAN messages to communicate with other components.
        </div>
      </div>
    `;
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
          ${attr.helpText ? `
            <details class="attr-help" style="margin-top: 0.5rem;">
              <summary style="cursor: pointer; font-size: 0.75rem; color: #667eea;">Show example</summary>
              <div style="margin-top: 0.5rem; padding: 0.5rem; background: #f5f5f5; border-radius: 4px; font-family: monospace; font-size: 0.75rem; white-space: pre-wrap; overflow-x: auto;">
                ${this.escapeHtml(attr.helpText)}
              </div>
            </details>
          ` : ''}
        </div>
      `;
    }).join('');
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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

      case 'json':
      case 'object':
      case 'array':
        // Use textarea for complex JSON/object attributes
        return `<textarea
                  data-attr="${attr.name}"
                  rows="5"
                  placeholder="${attr.default || 'Enter JSON...'}"
                  style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px; font-family: monospace; font-size: 0.875rem;"
                >${this.escapeHtml(value)}</textarea>`;

      case 'textarea':
        return `<textarea
                  data-attr="${attr.name}"
                  rows="4"
                  placeholder="${attr.default || ''}"
                  style="width: 100%; padding: 0.5rem; border: 1px solid #e0e0e0; border-radius: 4px; font-size: 0.875rem;"
                >${this.escapeHtml(value)}</textarea>`;

      default:
        return `<input type="text"
                       data-attr="${attr.name}"
                       value="${this.escapeHtml(value)}"
                       placeholder="${attr.default || ''}">`;
    }
  }

  attachListeners() {
    // Tab switching
    this.querySelectorAll('.properties-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchTab(tabName);
      });
    });

    // Properties tab listeners
    this.attachPropertyListeners();

    // CSS tab listeners
    this.attachCSSListeners();

    // Actions tab listeners
    this.attachActionsListeners();
  }

  switchTab(tabName) {
    this.activeTab = tabName;

    // Update tab buttons
    this.querySelectorAll('.properties-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update tab content
    this.querySelectorAll('.tab-content').forEach(content => {
      content.classList.toggle('active', content.dataset.tabContent === tabName);
    });
  }

  attachPropertyListeners() {
    // Listen for property changes
    this.querySelectorAll('[data-attr]').forEach(input => {
      // Use 'change' for checkboxes and selects, 'blur' for textareas (to avoid too frequent updates), 'input' for text inputs
      let eventType = 'input';
      if (input.type === 'checkbox') {
        eventType = 'change';
      } else if (input.tagName === 'TEXTAREA') {
        eventType = 'blur'; // Update on blur for textareas to avoid constant updates while typing
      } else if (input.tagName === 'SELECT') {
        eventType = 'change';
      }

      input.addEventListener(eventType, (e) => {
        const attrName = e.target.dataset.attr;
        let value;

        if (e.target.type === 'checkbox') {
          value = e.target.checked;
          // For booleans, set/remove attribute
          if (this.selectedElement) {
            if (value) {
              this.selectedElement.setAttribute(attrName, '');
            } else {
              this.selectedElement.removeAttribute(attrName);
            }
          }
        } else {
          value = e.target.value;
          // Update the actual component
          if (this.selectedElement) {
            if (value === '') {
              this.selectedElement.removeAttribute(attrName);
            } else {
              this.selectedElement.setAttribute(attrName, value);
            }

            // For properties that might need explicit setter
            if (attrName in this.selectedElement) {
              try {
                this.selectedElement[attrName] = value;
              } catch (err) {
                // Some properties might be read-only, that's okay
              }
            }
          }
        }

        // Notify canvas that something changed
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      });
    });

    // Delete button
    this.querySelector('.btn-delete')?.addEventListener('click', () => {
      if (this.selectedElement) {
        const componentId = this.selectedElement.dataset.componentId;

        // Clean up stored data
        this.customCSS.delete(componentId);
        this.customActions.delete(componentId);

        this.selectedElement.remove();
        this.showNoSelection();

        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      }
    });
  }

  attachCSSListeners() {
    const cssEditor = this.querySelector('.css-editor');
    const applyBtn = this.querySelector('.btn-apply-css');
    const clearBtn = this.querySelector('.btn-clear-css');

    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        if (!this.selectedElement || !cssEditor) return;

        const css = cssEditor.value;
        const componentId = this.selectedElement.dataset.componentId;

        // Store CSS
        this.customCSS.set(componentId, css);

        // Apply CSS by setting style attribute
        this.selectedElement.style.cssText = css;

        // Show feedback
        this.showFeedback('Styles applied!', 'success');

        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (!this.selectedElement || !cssEditor) return;

        const componentId = this.selectedElement.dataset.componentId;

        // Clear stored CSS
        this.customCSS.delete(componentId);

        // Clear editor
        cssEditor.value = '';

        // Remove inline styles
        this.selectedElement.style.cssText = '';

        // Show feedback
        this.showFeedback('Styles cleared', 'info');

        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      });
    }

    // Preset buttons
    this.querySelectorAll('.btn-preset').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const preset = e.target.dataset.preset;
        if (cssEditor) {
          cssEditor.value = this.getCSSPreset(preset);
        }
      });
    });
  }

  getCSSPreset(preset) {
    const presets = {
      card: `padding: 1.5rem;
background: white;
border-radius: 8px;
box-shadow: 0 2px 8px rgba(0,0,0,0.1);`,
      gradient: `padding: 2rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
border-radius: 12px;`,
      shadow: `padding: 1.5rem;
box-shadow: 0 10px 40px rgba(0,0,0,0.2);
border-radius: 8px;`,
      bordered: `padding: 1.5rem;
border: 3px solid #667eea;
border-radius: 8px;
background: #f8f9ff;`
    };
    return presets[preset] || '';
  }

  attachActionsListeners() {
    const addBtn = this.querySelector('.btn-add-action');

    if (addBtn) {
      addBtn.addEventListener('click', () => {
        if (!this.selectedElement) return;

        const eventSelect = this.querySelector('.action-event');
        const typeSelect = this.querySelector('.action-type');
        const valueInput = this.querySelector('.action-value');

        const event = eventSelect?.value;
        const type = typeSelect?.value;
        const value = valueInput?.value;

        if (!event || !type || !value) {
          this.showFeedback('Please fill all fields', 'warning');
          return;
        }

        const componentId = this.selectedElement.dataset.componentId;
        const actions = this.customActions.get(componentId) || [];

        const newAction = {
          event,
          type,
          [type === 'publish' ? 'topic' : 'message']: value
        };

        actions.push(newAction);
        this.customActions.set(componentId, actions);

        // Apply the action
        this.applyAction(newAction);

        // Refresh the actions tab
        this.showProperties(this.selectedElement, this.componentMeta);
        this.switchTab('actions');

        this.showFeedback('Action added!', 'success');

        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      });
    }

    // Delete action buttons
    this.querySelectorAll('.btn-delete-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.target.dataset.actionIdx);
        const componentId = this.selectedElement.dataset.componentId;
        const actions = this.customActions.get(componentId) || [];

        actions.splice(idx, 1);
        this.customActions.set(componentId, actions);

        // Refresh the actions tab
        this.showProperties(this.selectedElement, this.componentMeta);
        this.switchTab('actions');

        this.showFeedback('Action removed', 'info');

        // Notify canvas
        document.dispatchEvent(new CustomEvent('canvas-changed', {
          bubbles: true
        }));
      });
    });
  }

  applyAction(action) {
    if (!this.selectedElement) return;

    this.selectedElement.addEventListener(action.event, (e) => {
      switch (action.type) {
        case 'publish':
          document.dispatchEvent(new CustomEvent('pan:publish', {
            detail: {
              topic: action.topic,
              data: {
                source: this.componentMeta?.name || 'component',
                timestamp: Date.now()
              }
            }
          }));
          break;

        case 'console':
          console.log(`[${this.componentMeta?.displayName}]`, action.message);
          break;

        case 'alert':
          alert(action.message);
          break;
      }
    });
  }

  showFeedback(message, type = 'info') {
    // Create temporary feedback element
    const feedback = document.createElement('div');
    feedback.style.cssText = `
      position: fixed;
      top: 1rem;
      right: 1rem;
      padding: 1rem 1.5rem;
      background: ${type === 'success' ? '#10b981' : type === 'warning' ? '#f59e0b' : '#667eea'};
      color: white;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 0.875rem;
      font-weight: 500;
      animation: slideIn 0.3s ease;
    `;
    feedback.textContent = message;

    document.body.appendChild(feedback);

    setTimeout(() => {
      feedback.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => feedback.remove(), 300);
    }, 2000);
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
