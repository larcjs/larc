/**
 * Component Palette
 *
 * Displays available components organized by category
 * with search functionality and expandable component details
 */

class PgPalette extends HTMLElement {
  constructor() {
    super();
    this.registry = null;
    this.filteredComponents = [];
    this.expandedComponent = null;
  }

  async connectedCallback() {
    await this.loadRegistry();
    this.render();
  }

  async loadRegistry() {
    try {
      const response = await fetch('./component-registry.json');
      this.registry = await response.json();
      this.filteredComponents = this.registry.components;
    } catch (err) {
      console.error('Failed to load component registry:', err);
    }
  }

  render() {
    if (!this.registry) {
      this.innerHTML = '<div class="palette"><p>Loading components...</p></div>';
      return;
    }

    const categories = this.registry.categories;

    this.innerHTML = `
      <div class="palette">
        <input type="search"
               placeholder="Search components..."
               class="search"
               aria-label="Search components">

        ${categories.map(cat => {
          const componentsInCategory = this.getComponentsInCategory(cat.id);
          if (componentsInCategory.length === 0) return '';

          return `
            <details open>
              <summary>${cat.icon} ${cat.name}</summary>
              <div class="components">
                ${componentsInCategory.map(c => this.renderComponentItem(c)).join('')}
              </div>
            </details>
          `;
        }).join('')}
      </div>
    `;

    this.attachEventListeners();
  }

  renderComponentItem(c) {
    const isExpanded = this.expandedComponent === c.name;
    const hasAttributes = c.attributes && c.attributes.length > 0;
    const hasHelpText = c.helpText || c.description;

    return `
      <div class="component-wrapper ${isExpanded ? 'expanded' : ''}">
        <div class="component-item-row">
          <button class="component-item"
                  data-component='${JSON.stringify(c).replace(/'/g, '&apos;')}'
                  title="Click to add ${c.displayName}">
            <span class="icon">${c.icon}</span>
            <span class="name">${c.displayName}</span>
          </button>
          ${hasAttributes || hasHelpText ? `
            <button class="component-info-btn"
                    data-component-name="${c.name}"
                    title="View options and info"
                    aria-label="Show component info">
              <span class="info-icon">${isExpanded ? '▼' : 'ℹ️'}</span>
            </button>
          ` : ''}
        </div>
        ${isExpanded ? this.renderComponentDetails(c) : ''}
      </div>
    `;
  }

  renderComponentDetails(c) {
    const attributes = c.attributes || [];
    const hasAttributes = attributes.length > 0;

    return `
      <div class="component-details">
        ${c.description ? `<p class="component-desc">${c.description}</p>` : ''}

        ${hasAttributes ? `
          <div class="component-attrs">
            <h5>Attributes</h5>
            <div class="attrs-list">
              ${attributes.slice(0, 8).map(attr => `
                <div class="attr-item">
                  <code class="attr-name">${attr.name}</code>
                  <span class="attr-type">${attr.type || 'string'}</span>
                  ${attr.required ? '<span class="attr-required">required</span>' : ''}
                  ${attr.description && attr.description !== `${attr.name} attribute`
                    ? `<span class="attr-desc">${attr.description}</span>`
                    : ''}
                  ${attr.helpText ? `<span class="attr-example">e.g. ${attr.helpText}</span>` : ''}
                </div>
              `).join('')}
              ${attributes.length > 8 ? `
                <div class="attr-more">+${attributes.length - 8} more attributes</div>
              ` : ''}
            </div>
          </div>
        ` : '<p class="no-attrs">No configurable attributes</p>'}

        ${c.helpText ? `
          <div class="component-help">
            <h5>Usage</h5>
            <div class="help-content">${c.helpText}</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  getComponentsInCategory(categoryId) {
    return this.filteredComponents.filter(c => c.category === categoryId);
  }

  attachEventListeners() {
    // Click to add component
    this.querySelectorAll('.component-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const component = JSON.parse(btn.dataset.component.replace(/&apos;/g, "'"));
        this.dispatchEvent(new CustomEvent('component-selected', {
          detail: component,
          bubbles: true
        }));
      });
    });

    // Click info button to expand/collapse details
    this.querySelectorAll('.component-info-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const componentName = btn.dataset.componentName;
        if (this.expandedComponent === componentName) {
          this.expandedComponent = null;
        } else {
          this.expandedComponent = componentName;
        }
        this.render();
      });
    });

    // Search functionality
    const searchInput = this.querySelector('.search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterComponents(e.target.value);
      });
    }
  }

  filterComponents(query) {
    const lowerQuery = query.toLowerCase().trim();

    if (!lowerQuery) {
      this.filteredComponents = this.registry.components;
    } else {
      this.filteredComponents = this.registry.components.filter(c => {
        return c.name.toLowerCase().includes(lowerQuery) ||
               c.displayName.toLowerCase().includes(lowerQuery) ||
               c.description.toLowerCase().includes(lowerQuery) ||
               c.tags.some(tag => tag.toLowerCase().includes(lowerQuery));
      });
    }

    this.render();
  }
}

customElements.define('pg-palette', PgPalette);
