/**
 * blog-metadata
 *
 * Metadata editor component for blog posts.
 * Provides title, excerpt, tags, and status editing.
 *
 * Features:
 * - Title input
 * - Excerpt textarea
 * - Tag management (add/remove)
 * - Status dropdown (draft/published)
 *
 * PAN Events:
 * - blog.meta.changed: { title, excerpt, tags, status }
 * - blog.meta.set: { title?, excerpt?, tags?, status? }
 */

export class BlogMetadata extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._title = '';
    this._excerpt = '';
    this._tags = [];
    this._status = 'draft';
    this._expanded = false;
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

        .metadata-container {
          background: var(--color-surface, #ffffff);
        }

        .metadata-header {
          display: flex;
          align-items: center;
          padding: 0.75rem 1rem;
          cursor: pointer;
          user-select: none;
        }

        .metadata-header:hover {
          background: var(--color-bg-alt, #f8fafc);
        }

        .expand-icon {
          margin-right: 0.5rem;
          transition: transform 0.2s;
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .expand-icon.expanded {
          transform: rotate(90deg);
        }

        .title-input {
          flex: 1;
          border: none;
          background: transparent;
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--color-text, #1e293b);
          outline: none;
          padding: 0;
        }

        .title-input::placeholder {
          color: var(--color-text-subtle, #94a3b8);
          font-weight: 400;
        }

        .status-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.025em;
        }

        .status-badge.draft {
          background: var(--color-warning, #f59e0b);
          color: white;
        }

        .status-badge.published {
          background: var(--color-success, #10b981);
          color: white;
        }

        .metadata-details {
          display: none;
          padding: 0 1rem 1rem 1rem;
          border-top: 1px solid var(--color-border, #e2e8f0);
        }

        .metadata-details.expanded {
          display: block;
        }

        .field-group {
          margin-top: 0.75rem;
        }

        .field-label {
          display: block;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #64748b);
          margin-bottom: 0.375rem;
        }

        .field-input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #1e293b);
          transition: border-color 0.15s;
        }

        .field-input:focus {
          outline: none;
          border-color: var(--color-primary, #0f766e);
        }

        .field-textarea {
          resize: vertical;
          min-height: 60px;
        }

        .field-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2364748b' d='M6 8L2 4h8z'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 0.75rem center;
          padding-right: 2rem;
        }

        /* Tags */
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-top: 0.375rem;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.25rem 0.5rem;
          background: var(--color-bg-alt, #f8fafc);
          border: 1px solid var(--color-border, #e2e8f0);
          border-radius: 0.25rem;
          font-size: 0.8125rem;
          color: var(--color-text, #1e293b);
        }

        .tag-remove {
          cursor: pointer;
          color: var(--color-text-muted, #64748b);
          font-size: 1rem;
          line-height: 1;
        }

        .tag-remove:hover {
          color: var(--color-error, #ef4444);
        }

        .tag-input-wrapper {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.5rem;
        }

        .tag-input {
          flex: 1;
        }

        .tag-add-btn {
          padding: 0.5rem 0.75rem;
          background: var(--color-primary, #0f766e);
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: background 0.15s;
        }

        .tag-add-btn:hover {
          background: var(--color-primary-dark, #0d5d56);
        }

        .two-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }

        @media (max-width: 640px) {
          .two-columns {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="metadata-container">
        <div class="metadata-header" id="metadata-header">
          <span class="expand-icon ${this._expanded ? 'expanded' : ''}" id="expand-icon">&#9654;</span>
          <input
            type="text"
            class="title-input"
            id="title-input"
            placeholder="Post Title..."
            value="${this._escapeAttr(this._title)}"
          >
          <span class="status-badge ${this._escapeAttr(this._status)}" id="status-badge">${this._escapeHtml(this._status)}</span>
        </div>

        <div class="metadata-details ${this._expanded ? 'expanded' : ''}" id="metadata-details">
          <div class="field-group">
            <label class="field-label">Excerpt</label>
            <textarea
              class="field-input field-textarea"
              id="excerpt-input"
              placeholder="Brief description of your post..."
            >${this._escapeHtml(this._excerpt)}</textarea>
          </div>

          <div class="two-columns">
            <div class="field-group">
              <label class="field-label">Tags</label>
              <div class="tags-container" id="tags-container">
                ${this._tags.map(tag => `
                  <span class="tag" data-tag="${this._escapeAttr(tag)}">
                    ${this._escapeHtml(tag)}
                    <span class="tag-remove" data-remove="${this._escapeAttr(tag)}">&times;</span>
                  </span>
                `).join('')}
              </div>
              <div class="tag-input-wrapper">
                <input
                  type="text"
                  class="field-input tag-input"
                  id="tag-input"
                  placeholder="Add tag..."
                >
                <button class="tag-add-btn" id="tag-add-btn">Add</button>
              </div>
            </div>

            <div class="field-group">
              <label class="field-label">Status</label>
              <select class="field-input field-select" id="status-select">
                <option value="draft" ${this._status === 'draft' ? 'selected' : ''}>Draft</option>
                <option value="published" ${this._status === 'published' ? 'selected' : ''}>Published</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _setupEventListeners() {
    const header = this.shadowRoot.getElementById('metadata-header');
    const expandIcon = this.shadowRoot.getElementById('expand-icon');
    const titleInput = this.shadowRoot.getElementById('title-input');
    const excerptInput = this.shadowRoot.getElementById('excerpt-input');
    const statusSelect = this.shadowRoot.getElementById('status-select');
    const tagInput = this.shadowRoot.getElementById('tag-input');
    const tagAddBtn = this.shadowRoot.getElementById('tag-add-btn');
    const tagsContainer = this.shadowRoot.getElementById('tags-container');

    // Toggle expand on icon click only (not title)
    expandIcon?.addEventListener('click', (e) => {
      e.stopPropagation();
      this._toggleExpand();
    });

    // Prevent title input from toggling expand
    titleInput?.addEventListener('click', (e) => {
      e.stopPropagation();
    });

    // Title changes
    titleInput?.addEventListener('input', () => {
      this._title = titleInput.value;
      this._broadcastChange();
    });

    // Excerpt changes
    excerptInput?.addEventListener('input', () => {
      this._excerpt = excerptInput.value;
      this._broadcastChange();
    });

    // Status changes
    statusSelect?.addEventListener('change', () => {
      this._status = statusSelect.value;
      this._updateStatusBadge();
      this._broadcastChange();
    });

    // Add tag
    tagAddBtn?.addEventListener('click', () => {
      this._addTag();
    });

    tagInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this._addTag();
      }
    });

    // Remove tag
    tagsContainer?.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.tag-remove');
      if (removeBtn) {
        const tag = removeBtn.dataset.remove;
        this._removeTag(tag);
      }
    });
  }

  _setupPanListeners() {
    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    bus.subscribe('blog.meta.set', (envelope) => {
      const data = envelope.data || envelope;
      if (data.title !== undefined) this._title = data.title;
      if (data.excerpt !== undefined) this._excerpt = data.excerpt;
      if (data.tags !== undefined) this._tags = data.tags;
      if (data.status !== undefined) this._status = data.status;
      this.render();
      this._setupEventListeners();
    });

    bus.subscribe('blog.draft.loaded', (envelope) => {
      const data = envelope.data || envelope;
      if (data.metadata) {
        if (data.metadata.title) this._title = data.metadata.title;
        if (data.metadata.excerpt) this._excerpt = data.metadata.excerpt;
        if (data.metadata.tags) this._tags = data.metadata.tags;
        if (data.metadata.status) this._status = data.metadata.status;
        this.render();
        this._setupEventListeners();
      }
    });
  }

  _toggleExpand() {
    this._expanded = !this._expanded;

    const icon = this.shadowRoot.getElementById('expand-icon');
    const details = this.shadowRoot.getElementById('metadata-details');

    icon?.classList.toggle('expanded', this._expanded);
    details?.classList.toggle('expanded', this._expanded);
  }

  _addTag() {
    const tagInput = this.shadowRoot.getElementById('tag-input');
    const tag = tagInput?.value.trim();

    if (tag && !this._tags.includes(tag)) {
      this._tags.push(tag);
      tagInput.value = '';
      this._renderTags();
      this._broadcastChange();
    }
  }

  _removeTag(tag) {
    this._tags = this._tags.filter(t => t !== tag);
    this._renderTags();
    this._broadcastChange();
  }

  _renderTags() {
    const container = this.shadowRoot.getElementById('tags-container');
    if (!container) return;

    container.innerHTML = this._tags.map(tag => `
      <span class="tag" data-tag="${this._escapeAttr(tag)}">
        ${this._escapeHtml(tag)}
        <span class="tag-remove" data-remove="${this._escapeAttr(tag)}">&times;</span>
      </span>
    `).join('');
  }

  _updateStatusBadge() {
    const badge = this.shadowRoot.getElementById('status-badge');
    if (badge) {
      badge.textContent = this._status;
      badge.className = `status-badge ${this._status}`;
    }
  }

  _broadcastChange() {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.meta.changed', {
      title: this._title,
      excerpt: this._excerpt,
      tags: this._tags,
      status: this._status
    });
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  _escapeAttr(text) {
    return text.replace(/"/g, '&quot;');
  }

  // Public API
  getMetadata() {
    return {
      title: this._title,
      excerpt: this._excerpt,
      tags: this._tags,
      status: this._status
    };
  }

  setMetadata(metadata) {
    if (metadata.title !== undefined) this._title = metadata.title;
    if (metadata.excerpt !== undefined) this._excerpt = metadata.excerpt;
    if (metadata.tags !== undefined) this._tags = metadata.tags;
    if (metadata.status !== undefined) this._status = metadata.status;
    this.render();
    this._setupEventListeners();
  }
}

customElements.define('blog-metadata', BlogMetadata);
export default BlogMetadata;
