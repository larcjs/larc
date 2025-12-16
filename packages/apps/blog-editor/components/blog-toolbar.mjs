/**
 * blog-toolbar
 *
 * Toolbar component for the blog editor.
 * Provides mode switching, feature group toggles, and formatting buttons.
 *
 * Features:
 * - Source/WYSIWYG mode toggle
 * - Preview panel toggle
 * - Dynamic feature group buttons (loaded via PAN events)
 * - Feature enable/disable toggles
 *
 * PAN Events:
 * - blog.mode.switch: { mode: 'source' | 'wysiwyg' }
 * - blog.preview.toggle: { show: boolean }
 * - features.register: { group, buttons, handlers }
 * - features.toggle: { group, enabled }
 * - features.action: { action, selection? }
 */

export class BlogToolbar extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'source';
    this._showPreview = true;
    this._featureGroups = new Map(); // group -> { buttons, enabled }
    this._enabledFeatures = new Set(['formatting']); // Always-on features
    this._isToggling = false; // Re-entrancy guard
    this._panListenersSetup = false; // Prevent duplicate subscriptions
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
        }

        .toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          background: var(--color-bg-alt, #f8fafc);
          border-bottom: 1px solid var(--color-border, #e2e8f0);
        }

        /* Mode Switcher */
        .mode-switcher {
          display: flex;
          background: var(--color-surface, #ffffff);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.375rem;
          overflow: hidden;
        }

        .mode-btn {
          padding: 0.375rem 0.75rem;
          border: none;
          background: transparent;
          color: var(--color-text-muted, #64748b);
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .mode-btn:hover {
          background: var(--color-bg-alt, #f8fafc);
          color: var(--color-text, #1e293b);
        }

        .mode-btn.active {
          background: var(--color-primary, #0f766e);
          color: white;
        }

        .mode-btn:first-child {
          border-right: 1px solid var(--color-border, #e2e8f0);
        }

        /* Divider */
        .divider {
          width: 1px;
          height: 24px;
          background: var(--color-border, #e2e8f0);
          margin: 0 0.25rem;
        }

        /* Feature Toggles */
        .feature-toggles {
          display: flex;
          gap: 0.25rem;
        }

        .feature-toggle {
          padding: 0.375rem 0.625rem;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-muted, #64748b);
          font-size: 0.75rem;
          font-weight: 500;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .feature-toggle:hover {
          border-color: var(--color-primary, #0f766e);
          color: var(--color-primary, #0f766e);
        }

        .feature-toggle.enabled {
          background: var(--color-primary-soft, #ccfbf1);
          border-color: var(--color-primary, #0f766e);
          color: var(--color-primary, #0f766e);
        }

        /* Formatting Buttons */
        .formatting-buttons {
          display: flex;
          gap: 0.125rem;
        }

        .format-group {
          display: flex;
          gap: 0.125rem;
          padding-right: 0.5rem;
          margin-right: 0.25rem;
          border-right: 1px solid var(--color-border, #e2e8f0);
        }

        .format-group:last-child {
          border-right: none;
          padding-right: 0;
          margin-right: 0;
        }

        .format-group.hidden {
          display: none;
        }

        .format-btn {
          padding: 0.375rem 0.5rem;
          min-width: 32px;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #1e293b);
          font-size: 0.875rem;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .format-btn:hover {
          background: var(--color-primary-soft, #ccfbf1);
          border-color: var(--color-primary, #0f766e);
        }

        .format-btn:active {
          transform: scale(0.95);
        }

        .format-btn[title]::after {
          content: attr(title);
          position: absolute;
          display: none;
        }

        /* Preview Toggle */
        .preview-toggle {
          margin-left: auto;
        }

        .preview-btn {
          padding: 0.375rem 0.75rem;
          border: 1px solid var(--color-border, #e2e8f0);
          background: var(--color-surface, #ffffff);
          color: var(--color-text-muted, #64748b);
          font-size: 0.8125rem;
          font-weight: 500;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .preview-btn:hover {
          background: var(--color-bg-alt, #f8fafc);
          color: var(--color-text, #1e293b);
        }

        .preview-btn.active {
          background: var(--color-primary-soft, #ccfbf1);
          border-color: var(--color-primary, #0f766e);
          color: var(--color-primary, #0f766e);
        }

        /* Responsive */
        @media (max-width: 768px) {
          .toolbar {
            padding: 0.375rem 0.75rem;
          }

          .feature-toggles {
            display: none;
          }

          .format-btn {
            padding: 0.25rem 0.375rem;
            min-width: 28px;
          }
        }
      </style>

      <div class="toolbar">
        <!-- Mode Switcher -->
        <div class="mode-switcher">
          <button class="mode-btn ${this._mode === 'source' ? 'active' : ''}" data-mode="source">Source</button>
          <button class="mode-btn ${this._mode === 'wysiwyg' ? 'active' : ''}" data-mode="wysiwyg">Visual</button>
        </div>

        <div class="divider"></div>

        <!-- Feature Toggles -->
        <div class="feature-toggles">
          <button class="feature-toggle enabled" data-feature="formatting" disabled title="Always enabled">Formatting</button>
          <button class="feature-toggle" data-feature="lists">Lists</button>
          <button class="feature-toggle" data-feature="media">Media</button>
          <button class="feature-toggle" data-feature="code">Code</button>
          <button class="feature-toggle" data-feature="tables">Tables</button>
        </div>

        <div class="divider"></div>

        <!-- Formatting Buttons Container -->
        <div class="formatting-buttons" id="formatting-buttons">
          <!-- Dynamically populated by feature modules -->
        </div>

        <!-- Preview Toggle -->
        <div class="preview-toggle">
          <button class="preview-btn ${this._showPreview ? 'active' : ''}" id="preview-btn">
            <span>Preview</span>
          </button>
        </div>
      </div>
    `;
  }

  _setupEventListeners() {
    // Mode switching
    this.shadowRoot.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this._setMode(mode);
      });
    });

    // Feature toggles
    this.shadowRoot.querySelectorAll('.feature-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const feature = btn.dataset.feature;
        this._toggleFeature(feature);
      });
    });

    // Preview toggle
    this.shadowRoot.getElementById('preview-btn')?.addEventListener('click', () => {
      this._togglePreview();
    });

    // Formatting button delegation
    this.shadowRoot.getElementById('formatting-buttons')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.format-btn');
      if (btn) {
        const action = btn.dataset.action;
        if (action) {
          this._executeAction(action);
        }
      }
    });
  }

  _setupPanListeners() {
    // Prevent duplicate subscriptions
    if (this._panListenersSetup) return;

    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    this._panListenersSetup = true;

    // Feature registration
    bus.subscribe('features.register', (envelope) => {
      const data = envelope.data || envelope;
      this._registerFeature(data);
    });

    // Feature toggle from external source (don't re-broadcast)
    bus.subscribe('features.toggle', (envelope) => {
      // Skip if we're the one who published this
      if (this._isToggling) return;

      const data = envelope.data || envelope;
      this._setFeatureEnabled(data.group, data.enabled, false);
    });

    // Mode change from external
    bus.subscribe('blog.mode.changed', (envelope) => {
      const data = envelope.data || envelope;
      this._mode = data.mode;
      this._updateModeButtons();
    });
  }

  _setMode(mode) {
    this._mode = mode;
    this._updateModeButtons();

    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.mode.switch', { mode });
  }

  _updateModeButtons() {
    this.shadowRoot.querySelectorAll('.mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === this._mode);
    });
  }

  _toggleFeature(feature) {
    const isEnabled = this._enabledFeatures.has(feature);
    this._setFeatureEnabled(feature, !isEnabled, true);
  }

  _setFeatureEnabled(feature, enabled, broadcast = false) {
    // Check if state actually changed to prevent infinite loops
    const currentlyEnabled = this._enabledFeatures.has(feature);
    if (currentlyEnabled === enabled) return;

    if (enabled) {
      this._enabledFeatures.add(feature);
    } else {
      this._enabledFeatures.delete(feature);
    }

    // Update toggle button
    const btn = this.shadowRoot.querySelector(`.feature-toggle[data-feature="${feature}"]`);
    if (btn) {
      btn.classList.toggle('enabled', enabled);
    }

    // Update format group visibility
    const group = this.shadowRoot.querySelector(`.format-group[data-group="${feature}"]`);
    if (group) {
      group.classList.toggle('hidden', !enabled);
    }

    // Broadcast change (only if initiated locally)
    if (broadcast) {
      this._isToggling = true;
      try {
        const bus = document.querySelector('pan-bus');
        bus?.publish('features.toggle', { group: feature, enabled });
      } finally {
        this._isToggling = false;
      }
    }
  }

  _togglePreview() {
    this._showPreview = !this._showPreview;

    const btn = this.shadowRoot.getElementById('preview-btn');
    if (btn) {
      btn.classList.toggle('active', this._showPreview);
    }

    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.preview.toggle', { show: this._showPreview });
  }

  _registerFeature(data) {
    const { group, buttons } = data;

    // Store feature data
    this._featureGroups.set(group, { buttons, enabled: this._enabledFeatures.has(group) });

    // Create button group
    const container = this.shadowRoot.getElementById('formatting-buttons');
    if (!container) return;

    // Check if group already exists
    let groupEl = container.querySelector(`.format-group[data-group="${group}"]`);
    if (!groupEl) {
      groupEl = document.createElement('div');
      groupEl.className = `format-group ${this._enabledFeatures.has(group) ? '' : 'hidden'}`;
      groupEl.dataset.group = group;
      container.appendChild(groupEl);
    }

    // Add buttons
    groupEl.innerHTML = '';
    buttons.forEach(btn => {
      const buttonEl = document.createElement('button');
      buttonEl.className = 'format-btn';
      buttonEl.dataset.action = btn.action;
      buttonEl.title = btn.title || btn.action;
      buttonEl.innerHTML = btn.icon || btn.label || btn.action;
      groupEl.appendChild(buttonEl);
    });

    // Enable toggle button if feature registered
    const toggleBtn = this.shadowRoot.querySelector(`.feature-toggle[data-feature="${group}"]`);
    if (toggleBtn && !toggleBtn.disabled) {
      toggleBtn.disabled = false;
    }
  }

  _executeAction(action) {
    const bus = document.querySelector('pan-bus');
    bus?.publish('features.action', { action, mode: this._mode });
  }

  // Public API
  setMode(mode) {
    this._setMode(mode);
  }

  enableFeature(feature) {
    this._setFeatureEnabled(feature, true);
  }

  disableFeature(feature) {
    this._setFeatureEnabled(feature, false);
  }
}

customElements.define('blog-toolbar', BlogToolbar);
export default BlogToolbar;
