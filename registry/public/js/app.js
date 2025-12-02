// LARC Component Registry Browser

let registry = null;
let filteredComponents = [];
let currentFilters = {
  search: '',
  category: 'all',
  status: 'all',
  quality: 'all'
};

// Load registry data
async function loadRegistry() {
  try {
    const response = await fetch('../registry.json');
    registry = await response.json();
    initializeUI();
    filterComponents();
  } catch (err) {
    console.error('Failed to load registry:', err);
    document.getElementById('loading').innerHTML = `
      <p style="color: var(--danger)">Failed to load component registry</p>
    `;
  }
}

// Initialize UI
function initializeUI() {
  // Update stats
  document.getElementById('totalComponents').textContent = registry.stats.totalComponents;
  document.getElementById('totalCategories').textContent = registry.categories.length;
  document.getElementById('verifiedCount').textContent =
    registry.components.filter(c => c.verified).length;

  // Create category filters
  const categoryFilters = document.getElementById('categoryFilters');
  registry.categories.forEach(category => {
    const button = document.createElement('button');
    button.className = 'filter-btn';
    button.dataset.category = category.id;
    button.textContent = `${category.icon} ${category.name}`;
    button.addEventListener('click', () => setFilter('category', category.id));
    categoryFilters.appendChild(button);
  });

  // Setup event listeners
  document.getElementById('search').addEventListener('input', e => {
    currentFilters.search = e.target.value.toLowerCase();
    filterComponents();
  });

  document.querySelectorAll('[data-status]').forEach(btn => {
    btn.addEventListener('click', () => setFilter('status', btn.dataset.status));
  });

  document.querySelectorAll('[data-quality]').forEach(btn => {
    btn.addEventListener('click', () => setFilter('quality', btn.dataset.quality));
  });

  document.querySelectorAll('[data-view]').forEach(btn => {
    btn.addEventListener('click', () => setView(btn.dataset.view));
  });

  // Modal close
  document.getElementById('modalClose').addEventListener('click', closeModal);
  document.querySelector('.modal-backdrop').addEventListener('click', closeModal);
}

// Set filter
function setFilter(type, value) {
  currentFilters[type] = value;

  // Update active button
  const container = type === 'category' ? 'categoryFilters' :
                   type === 'status' ? 'statusFilters' :
                   'qualityFilters';

  document.querySelectorAll(`#${container} .filter-btn`).forEach(btn => {
    btn.classList.remove('active');
  });

  const selector = type === 'category' ? `[data-category="${value}"]` :
                   type === 'status' ? `[data-status="${value}"]` :
                   `[data-quality="${value}"]`;

  document.querySelector(`#${container} ${selector}`).classList.add('active');

  filterComponents();
}

// Set view mode
function setView(view) {
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-view="${view}"]`).classList.add('active');

  const grid = document.getElementById('componentsGrid');
  if (view === 'list') {
    grid.classList.add('list-view');
  } else {
    grid.classList.remove('list-view');
  }
}

// Filter components
function filterComponents() {
  if (!registry) return;

  filteredComponents = registry.components.filter(component => {
    // Search filter
    if (currentFilters.search) {
      const searchText = [
        component.name,
        component.displayName,
        component.description,
        ...component.tags
      ].join(' ').toLowerCase();

      if (!searchText.includes(currentFilters.search)) {
        return false;
      }
    }

    // Category filter
    if (currentFilters.category !== 'all' && component.category !== currentFilters.category) {
      return false;
    }

    // Status filter
    if (currentFilters.status !== 'all' && component.status !== currentFilters.status) {
      return false;
    }

    // Quality filter
    if (currentFilters.quality !== 'all') {
      const quality = component.quality?.score || 'C';
      if (quality !== currentFilters.quality) {
        return false;
      }
    }

    return true;
  });

  renderComponents();
}

// Render components
function renderComponents() {
  const grid = document.getElementById('componentsGrid');
  const loading = document.getElementById('loading');
  const emptyState = document.getElementById('emptyState');

  loading.style.display = 'none';

  if (filteredComponents.length === 0) {
    grid.innerHTML = '';
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  grid.innerHTML = filteredComponents.map(component => {
    const category = registry.categories.find(c => c.id === component.category);
    const quality = component.quality?.score || 'C';

    return `
      <div class="component-card" onclick="showComponentDetail('${component.name}')">
        <div class="component-card-header">
          <div class="component-icon">${component.icon || '📦'}</div>
          <div class="component-info">
            <div class="component-name">${component.displayName}</div>
            <div class="component-display-name">&lt;${component.name}&gt;</div>
          </div>
        </div>

        <div class="component-description">
          ${component.description}
        </div>

        <div class="component-meta">
          <span class="badge badge-category">${category.icon} ${category.name}</span>
          <span class="badge badge-status ${component.status}">${component.status}</span>
          ${quality ? `<span class="badge badge-quality ${quality}">Grade ${quality}</span>` : ''}
          ${component.verified ? '<span class="badge badge-verified">✓ Verified</span>' : ''}
        </div>

        ${component.tags.length > 0 ? `
          <div class="component-tags">
            ${component.tags.slice(0, 4).map(tag => `
              <span class="tag">${tag}</span>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }).join('');
}

// Show component detail
window.showComponentDetail = function(componentName) {
  const component = registry.components.find(c => c.name === componentName);
  if (!component) return;

  const category = registry.categories.find(c => c.id === component.category);
  const quality = component.quality?.score || 'C';

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <div style="display: flex; align-items: start; gap: 1rem; margin-bottom: 1.5rem;">
      <div style="font-size: 3rem;">${component.icon || '📦'}</div>
      <div style="flex: 1;">
        <h2 style="margin: 0 0 0.5rem;">${component.displayName}</h2>
        <code style="background: var(--gray-100); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
          &lt;${component.name}&gt;
        </code>
      </div>
    </div>

    <p style="font-size: 1.125rem; color: var(--gray-700); margin-bottom: 1.5rem;">
      ${component.description}
    </p>

    <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem;">
      <span class="badge badge-category">${category.icon} ${category.name}</span>
      <span class="badge badge-status ${component.status}">${component.status}</span>
      ${quality ? `<span class="badge badge-quality ${quality}">Grade ${quality}</span>` : ''}
      ${component.verified ? '<span class="badge badge-verified">✓ Verified</span>' : ''}
    </div>

    ${component.npm ? `
      <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem;">Installation</h3>
        <pre style="background: var(--gray-900); color: white; padding: 1rem; border-radius: 0.25rem; overflow-x: auto;">npm install ${component.npm.package}</pre>
      </div>
    ` : ''}

    ${component.cdn ? `
      <div style="background: var(--gray-50); padding: 1rem; border-radius: var(--border-radius); margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 0.5rem;">CDN Usage</h3>
        <pre style="background: var(--gray-900); color: white; padding: 1rem; border-radius: 0.25rem; overflow-x: auto; font-size: 0.75rem;">&lt;script type="importmap"&gt;
{
  "imports": {
    "${component.npm?.package || component.name}": "${component.cdn.jsdelivr}"
  }
}
&lt;/script&gt;</pre>
      </div>
    ` : ''}

    ${component.examples && component.examples.length > 0 ? `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem;">Examples</h3>
        ${component.examples.map(example => `
          <div style="margin-bottom: 1rem;">
            <h4 style="margin: 0 0 0.5rem;">${example.title}</h4>
            ${example.description ? `<p style="color: var(--gray-600); margin-bottom: 0.5rem;">${example.description}</p>` : ''}
            <pre style="background: var(--gray-50); padding: 1rem; border-radius: 0.25rem; overflow-x: auto;">${escapeHtml(example.code)}</pre>
          </div>
        `).join('')}
      </div>
    ` : ''}

    ${component.attributes && component.attributes.length > 0 ? `
      <div style="margin-bottom: 1.5rem;">
        <h3 style="margin: 0 0 1rem;">Attributes</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 2px solid var(--gray-200);">
              <th style="text-align: left; padding: 0.5rem;">Name</th>
              <th style="text-align: left; padding: 0.5rem;">Type</th>
              <th style="text-align: left; padding: 0.5rem;">Default</th>
              <th style="text-align: left; padding: 0.5rem;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${component.attributes.map(attr => `
              <tr style="border-bottom: 1px solid var(--gray-100);">
                <td style="padding: 0.5rem;"><code>${attr.name}</code></td>
                <td style="padding: 0.5rem;"><code>${attr.type}</code></td>
                <td style="padding: 0.5rem;"><code>${attr.default || '-'}</code></td>
                <td style="padding: 0.5rem;">${attr.description}${attr.required ? ' <em>(required)</em>' : ''}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    ` : ''}

    <div style="display: flex; gap: 1rem; margin-top: 2rem;">
      ${component.demo ? `
        <a href="${component.demo}" target="_blank" style="padding: 0.75rem 1.5rem; background: var(--primary); color: white; text-decoration: none; border-radius: var(--border-radius); font-weight: 600;">
          View Demo
        </a>
      ` : ''}
      ${component.repository?.url ? `
        <a href="${component.repository.url}" target="_blank" style="padding: 0.75rem 1.5rem; background: var(--gray-900); color: white; text-decoration: none; border-radius: var(--border-radius); font-weight: 600;">
          GitHub
        </a>
      ` : ''}
      ${component.npm?.url ? `
        <a href="${component.npm.url}" target="_blank" style="padding: 0.75rem 1.5rem; background: white; color: var(--gray-900); border: 1px solid var(--gray-300); text-decoration: none; border-radius: var(--border-radius); font-weight: 600;">
          NPM
        </a>
      ` : ''}
    </div>
  `;

  document.getElementById('componentModal').classList.add('active');
  document.body.style.overflow = 'hidden';
};

// Close modal
function closeModal() {
  document.getElementById('componentModal').classList.remove('active');
  document.body.style.overflow = '';
}

// Escape HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize
loadRegistry();
