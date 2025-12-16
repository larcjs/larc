/**
 * blog-feature-panel
 *
 * Production mode demo panel.
 * Shows how features can be progressively loaded without a build step.
 *
 * Features:
 * - Lists available feature modules
 * - Toggle checkboxes to load/unload features dynamically
 * - Shows "script tags" visualization
 * - Explains the progressive enhancement pattern
 *
 * PAN Events:
 * - features.toggle: { group, enabled }
 * - features.available: { group, name, description }
 */

export class BlogFeaturePanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._isToggling = false; // Re-entrancy guard
    this._panListenersSetup = false; // Prevent duplicate subscriptions

    this._features = [
      {
        group: 'formatting',
        name: 'Formatting',
        description: 'Bold, italic, headings',
        file: 'feature-formatting.mjs',
        loaded: true,
        enabled: true,
        required: true
      },
      {
        group: 'lists',
        name: 'Lists',
        description: 'Bullet, numbered, task lists',
        file: 'feature-lists.mjs',
        loaded: false,
        enabled: false
      },
      {
        group: 'media',
        name: 'Media',
        description: 'Links and images',
        file: 'feature-media.mjs',
        loaded: false,
        enabled: false
      },
      {
        group: 'code',
        name: 'Code',
        description: 'Code blocks, quotes, rules',
        file: 'feature-code.mjs',
        loaded: false,
        enabled: false
      },
      {
        group: 'tables',
        name: 'Tables',
        description: 'Markdown tables',
        file: 'feature-tables.mjs',
        loaded: false,
        enabled: false
      }
    ];
  }

  connectedCallback() {
    this.render();
    this._setupEventListeners();
    this._setupPanListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
        }

        .panel-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          padding: 1rem;
        }

        .panel-header {
          margin-bottom: 1rem;
        }

        .panel-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--color-text, #1e293b);
          margin: 0 0 0.25rem 0;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .panel-title-icon {
          font-size: 1.25rem;
        }

        .panel-subtitle {
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .info-box {
          background: var(--color-primary-soft, #ccfbf1);
          border: 1px solid var(--color-primary, #0f766e);
          border-radius: 0.5rem;
          padding: 0.75rem;
          margin-bottom: 1rem;
        }

        .info-box-title {
          font-size: 0.8125rem;
          font-weight: 600;
          color: var(--color-primary, #0f766e);
          margin-bottom: 0.375rem;
        }

        .info-box-text {
          font-size: 0.75rem;
          color: var(--color-text, #1e293b);
          line-height: 1.5;
        }

        .features-section {
          flex: 1;
          overflow-y: auto;
        }

        .section-title {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #64748b);
          margin-bottom: 0.75rem;
        }

        .feature-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .feature-item {
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.5rem;
          padding: 0.75rem;
          transition: all 0.15s;
        }

        .feature-item:hover {
          border-color: var(--color-border-strong, #cbd5e1);
        }

        .feature-item.loaded {
          border-color: var(--color-primary, #0f766e);
          background: var(--color-surface, #ffffff);
        }

        .feature-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .feature-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;
          accent-color: var(--color-primary, #0f766e);
        }

        .feature-checkbox:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .feature-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-text, #1e293b);
          flex: 1;
        }

        .feature-badge {
          font-size: 0.625rem;
          padding: 0.125rem 0.375rem;
          border-radius: 9999px;
          font-weight: 500;
          text-transform: uppercase;
        }

        .feature-badge.required {
          background: var(--color-text-muted, #64748b);
          color: white;
        }

        .feature-badge.loaded {
          background: var(--color-success, #10b981);
          color: white;
        }

        .feature-description {
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
          margin-top: 0.25rem;
          margin-left: 1.5rem;
        }

        /* Code Preview Section */
        .code-section {
          margin-top: 1rem;
          padding-top: 1rem;
          border-top: 1px solid var(--color-border, #e2e8f0);
        }

        .code-preview {
          background: var(--color-code-bg, #1e293b);
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-family: var(--font-mono, monospace);
          font-size: 0.6875rem;
          line-height: 1.6;
          overflow-x: auto;
        }

        .code-line {
          color: var(--color-code-text, #e2e8f0);
          white-space: nowrap;
        }

        .code-line.comment {
          color: #6b7280;
        }

        .code-line.loaded {
          color: #34d399;
        }

        .code-line.pending {
          color: #fbbf24;
          opacity: 0.6;
        }

        .code-tag {
          color: #f472b6;
        }

        .code-attr {
          color: #a5f3fc;
        }

        .code-string {
          color: #a5b4fc;
        }

        /* Stats */
        .stats-section {
          margin-top: 1rem;
          padding: 0.75rem;
          background: var(--color-bg-alt, #f8fafc);
          border-radius: 0.5rem;
          display: flex;
          justify-content: space-around;
          text-align: center;
        }

        .stat-item {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--color-primary, #0f766e);
        }

        .stat-label {
          font-size: 0.625rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #64748b);
        }
      </style>

      <div class="panel-container">
        <div class="panel-header">
          <h2 class="panel-title">
            <span class="panel-title-icon">&#9881;</span>
            Production Mode
          </h2>
          <p class="panel-subtitle">Progressive Enhancement Demo</p>
        </div>

        <div class="info-box">
          <div class="info-box-title">No Build Required!</div>
          <div class="info-box-text">
            Toggle features below to dynamically load/unload modules.
            Each feature is a separate <code>.mjs</code> file loaded via
            standard ES modules.
          </div>
        </div>

        <div class="features-section">
          <div class="section-title">Feature Modules</div>
          <div class="feature-list" id="feature-list">
            ${this._features.map(f => this._renderFeatureItem(f)).join('')}
          </div>
        </div>

        <div class="code-section">
          <div class="section-title">Script Tags</div>
          <div class="code-preview" id="code-preview">
            ${this._renderCodePreview()}
          </div>
        </div>

        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-value" id="stat-loaded">${this._features.filter(f => f.loaded).length}</span>
            <span class="stat-label">Loaded</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-enabled">${this._features.filter(f => f.enabled).length}</span>
            <span class="stat-label">Enabled</span>
          </div>
          <div class="stat-item">
            <span class="stat-value" id="stat-total">${this._features.length}</span>
            <span class="stat-label">Total</span>
          </div>
        </div>
      </div>
    `;
  }

  _renderFeatureItem(feature) {
    return `
      <div class="feature-item ${feature.loaded ? 'loaded' : ''}" data-group="${feature.group}">
        <div class="feature-header">
          <input
            type="checkbox"
            class="feature-checkbox"
            data-group="${feature.group}"
            ${feature.enabled ? 'checked' : ''}
            ${feature.required ? 'disabled' : ''}
          >
          <span class="feature-name">${feature.name}</span>
          ${feature.required ? '<span class="feature-badge required">Required</span>' : ''}
          ${feature.loaded && !feature.required ? '<span class="feature-badge loaded">Loaded</span>' : ''}
        </div>
        <div class="feature-description">${feature.description}</div>
      </div>
    `;
  }

  _renderCodePreview() {
    const lines = [
      '<span class="comment">&lt;!-- Feature modules --&gt;</span>'
    ];

    for (const feature of this._features) {
      const lineClass = feature.loaded ? 'loaded' : 'pending';
      const commentPrefix = feature.loaded ? '' : '&lt;!-- ';
      const commentSuffix = feature.loaded ? '' : ' --&gt;';

      lines.push(
        `<span class="code-line ${lineClass}">${commentPrefix}&lt;<span class="code-tag">script</span> <span class="code-attr">type</span>=<span class="code-string">"module"</span> <span class="code-attr">src</span>=<span class="code-string">"./features/${feature.file}"</span>&gt;&lt;/<span class="code-tag">script</span>&gt;${commentSuffix}</span>`
      );
    }

    return lines.map(l => `<div class="code-line">${l}</div>`).join('');
  }

  _setupEventListeners() {
    const featureList = this.shadowRoot.getElementById('feature-list');

    featureList?.addEventListener('change', (e) => {
      const checkbox = e.target.closest('.feature-checkbox');
      if (checkbox) {
        const group = checkbox.dataset.group;
        const enabled = checkbox.checked;
        this._toggleFeature(group, enabled);
      }
    });
  }

  _setupPanListeners() {
    // Prevent duplicate subscriptions
    if (this._panListenersSetup) return;

    const bus = document.querySelector('pan-bus');
    if (!bus) {
      setTimeout(() => this._setupPanListeners(), 100);
      return;
    }

    this._panListenersSetup = true;

    // Listen for feature toggle from toolbar (update UI only, don't re-broadcast)
    bus.subscribe('features.toggle', (envelope) => {
      // Skip if we're the one who published this
      if (this._isToggling) return;

      const data = envelope.data || envelope;
      const feature = this._features.find(f => f.group === data.group);
      if (feature && feature.enabled !== data.enabled) {
        feature.enabled = data.enabled;
        this._updateStats();
      }
    });

    // Listen for feature availability
    bus.subscribe('features.available', (envelope) => {
      const data = envelope.data || envelope;
      const feature = this._features.find(f => f.group === data.group);
      if (feature) {
        feature.loaded = true;
        this._updateFeatureUI(feature);
      }
    });
  }

  async _toggleFeature(group, enabled) {
    // Re-entrancy guard
    if (this._isToggling) return;

    const feature = this._features.find(f => f.group === group);
    if (!feature || feature.required) return;

    // Check if state actually changed
    if (feature.enabled === enabled) return;

    this._isToggling = true;

    try {
      feature.enabled = enabled;

      // Load module if not loaded
      if (enabled && !feature.loaded) {
        try {
          await import(`../features/${feature.file}`);
          feature.loaded = true;
        } catch (error) {
          console.error(`Failed to load feature: ${feature.file}`, error);
          feature.enabled = false;
        }
      }

      this._updateFeatureUI(feature);

      // Broadcast to toolbar
      const bus = document.querySelector('pan-bus');
      bus?.publish('features.toggle', { group, enabled: feature.enabled });
    } finally {
      this._isToggling = false;
    }
  }

  _updateFeatureUI(feature) {
    // Update feature item visual state (but NOT checkbox - that's handled by event flow)
    const item = this.shadowRoot.querySelector(`.feature-item[data-group="${feature.group}"]`);
    if (item) {
      item.classList.toggle('loaded', feature.loaded);

      // Update badge
      const existingBadge = item.querySelector('.feature-badge.loaded');
      if (feature.loaded && !feature.required && !existingBadge) {
        const header = item.querySelector('.feature-header');
        const badge = document.createElement('span');
        badge.className = 'feature-badge loaded';
        badge.textContent = 'Loaded';
        header.appendChild(badge);
      }
    }

    // Update code preview
    const codePreview = this.shadowRoot.getElementById('code-preview');
    if (codePreview) {
      codePreview.innerHTML = this._renderCodePreview();
    }

    // Update stats
    this._updateStats();
  }

  _updateStats() {
    const loadedEl = this.shadowRoot.getElementById('stat-loaded');
    const enabledEl = this.shadowRoot.getElementById('stat-enabled');

    if (loadedEl) {
      loadedEl.textContent = this._features.filter(f => f.loaded).length;
    }
    if (enabledEl) {
      enabledEl.textContent = this._features.filter(f => f.enabled).length;
    }
  }
}

customElements.define('blog-feature-panel', BlogFeaturePanel);
export default BlogFeaturePanel;
