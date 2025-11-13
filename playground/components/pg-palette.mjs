/**
 * Component Palette
 * 
 * Displays available components organized by category
 * with search functionality
 */

class PgPalette extends HTMLElement {
  constructor() {
    super();
    this.registry = null;
    this.filteredComponents = [];
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
                ${componentsInCategory.map(c => `
                  <button class="component-item"
                          data-component='${JSON.stringify(c).replace(/'/g, '&apos;')}'
                          title="${c.description}">
                    <span class="icon">${c.icon}</span>
                    <span class="name">${c.displayName}</span>
                  </button>
                `).join('')}
              </div>
            </details>
          `;
        }).join('')}
      </div>
    `;

    this.attachEventListeners();
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
