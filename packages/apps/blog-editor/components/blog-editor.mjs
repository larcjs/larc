/**
 * blog-editor
 *
 * Main orchestrator component for the blog entry editor.
 * Manages editing modes, content sync, and child component coordination.
 *
 * Features:
 * - Dual editing modes: source (markdown) and wysiwyg (contenteditable)
 * - Live preview panel
 * - Metadata editing (title, tags, excerpt)
 * - Auto-save support
 * - Progressive feature loading
 *
 * PAN Events:
 * - blog.content.changed: { markdown, html, wordCount }
 * - blog.mode.switch: { mode: 'source' | 'wysiwyg' }
 * - blog.content.set: { markdown }
 * - blog.save.request: Triggers save
 * - blog.draft.loaded: { markdown, metadata }
 */

export class BlogEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._mode = 'source'; // 'source' or 'wysiwyg'
    this._markdown = '';
    this._showPreview = true;
    this._isDirty = false;
    this._autoSaveTimer = null;
    this._panListenersSetup = false; // Prevent duplicate subscriptions
  }

  connectedCallback() {
    this.render();
    this._setupPanListeners();
    this._loadDraft();
  }

  disconnectedCallback() {
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface, #ffffff);
        }

        /* Toolbar Area */
        .toolbar-area {
          flex-shrink: 0;
        }

        /* Metadata Area */
        .metadata-area {
          flex-shrink: 0;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
        }

        /* Content Area */
        .content-area {
          flex: 1;
          display: flex;
          overflow: hidden;
          min-height: 0;
        }

        .editor-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .editor-pane.with-preview {
          border-right: 1px solid var(--color-border, #e2e8f0);
        }

        .preview-pane {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          min-width: 0;
        }

        .preview-pane.hidden {
          display: none;
        }

        /* Source Editor */
        blog-source-editor {
          flex: 1;
          display: block;
        }

        blog-source-editor.hidden {
          display: none;
        }

        /* WYSIWYG Editor */
        blog-wysiwyg-editor {
          flex: 1;
          display: block;
        }

        blog-wysiwyg-editor.hidden {
          display: none;
        }

        /* Preview */
        blog-preview {
          flex: 1;
          display: block;
        }

        /* Footer / Status Bar */
        .status-bar {
          flex-shrink: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 1rem;
          background: var(--color-bg-alt, #f8fafc);
          border-top: 1px solid var(--color-border, #e2e8f0);
          font-size: 0.75rem;
          color: var(--color-text-muted, #64748b);
        }

        .status-left {
          display: flex;
          gap: 1rem;
        }

        .status-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .dirty-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--color-warning, #f59e0b);
          display: none;
        }

        .dirty-indicator.show {
          display: block;
        }

        .save-status {
          color: var(--color-success, #10b981);
        }

        /* Responsive */
        @media (max-width: 900px) {
          .content-area {
            flex-direction: column;
          }

          .editor-pane.with-preview {
            border-right: none;
            border-bottom: 1px solid var(--color-border, #e2e8f0);
          }

          .editor-pane,
          .preview-pane {
            flex: none;
            height: 50%;
          }
        }
      </style>

      <div class="editor-container">
        <!-- Toolbar -->
        <div class="toolbar-area">
          <blog-toolbar></blog-toolbar>
        </div>

        <!-- Metadata -->
        <div class="metadata-area">
          <blog-metadata></blog-metadata>
        </div>

        <!-- Content Area -->
        <div class="content-area">
          <div class="editor-pane ${this._showPreview ? 'with-preview' : ''}">
            <blog-source-editor class="${this._mode === 'wysiwyg' ? 'hidden' : ''}"></blog-source-editor>
            <blog-wysiwyg-editor class="${this._mode === 'source' ? 'hidden' : ''}"></blog-wysiwyg-editor>
          </div>
          <div class="preview-pane ${!this._showPreview ? 'hidden' : ''}">
            <blog-preview></blog-preview>
          </div>
        </div>

        <!-- Status Bar -->
        <div class="status-bar">
          <div class="status-left">
            <span class="word-count">0 words</span>
            <span class="char-count">0 characters</span>
          </div>
          <div class="status-right">
            <span class="dirty-indicator ${this._isDirty ? 'show' : ''}"></span>
            <span class="save-status"></span>
          </div>
        </div>
      </div>
    `;

    this._cacheElements();
  }

  _cacheElements() {
    this._sourceEditor = this.shadowRoot.querySelector('blog-source-editor');
    this._wysiwygEditor = this.shadowRoot.querySelector('blog-wysiwyg-editor');
    this._preview = this.shadowRoot.querySelector('blog-preview');
    this._editorPane = this.shadowRoot.querySelector('.editor-pane');
    this._previewPane = this.shadowRoot.querySelector('.preview-pane');
    this._wordCount = this.shadowRoot.querySelector('.word-count');
    this._charCount = this.shadowRoot.querySelector('.char-count');
    this._dirtyIndicator = this.shadowRoot.querySelector('.dirty-indicator');
    this._saveStatus = this.shadowRoot.querySelector('.save-status');
  }

  _setupPanListeners() {
    // Prevent duplicate subscriptions
    if (this._panListenersSetup) return;

    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    this._panListenersSetup = true;

    // Mode switching
    bus.subscribe('blog.mode.switch', (envelope) => {
      const data = envelope.data || envelope;
      this._switchMode(data.mode);
    });

    // Preview toggle
    bus.subscribe('blog.preview.toggle', (envelope) => {
      const data = envelope.data || envelope;
      this._togglePreview(data.show);
    });

    // Content changes from editors
    bus.subscribe('blog.source.changed', (envelope) => {
      const data = envelope.data || envelope;
      this._markdown = data.markdown;
      this._updateStats(data.markdown);
      this._markDirty();
      this._updatePreview();
      this._scheduleAutoSave();
    });

    bus.subscribe('blog.wysiwyg.changed', (envelope) => {
      const data = envelope.data || envelope;
      this._markdown = data.markdown;
      this._updateStats(data.markdown);
      this._markDirty();
      this._updatePreview();
      this._scheduleAutoSave();
    });

    // Save request
    bus.subscribe('blog.save.request', () => {
      this._saveDraft();
    });

    // Draft loaded from storage
    bus.subscribe('blog.draft.loaded', (envelope) => {
      const data = envelope.data || envelope;
      this._markdown = data.markdown || '';
      this._setContent(this._markdown);
      this._isDirty = false;
      this._updateDirtyIndicator();
    });

    // Keyboard shortcut for save
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        this._saveDraft();
      }
    });
  }

  _switchMode(mode) {
    if (mode === this._mode) return;

    const oldMode = this._mode;
    this._mode = mode;

    // Sync content between modes
    if (oldMode === 'source' && mode === 'wysiwyg') {
      // Source -> WYSIWYG: get markdown from source, send to wysiwyg
      const bus = document.querySelector('pan-bus');
      bus?.publish('blog.wysiwyg.setContent', { markdown: this._markdown });
    } else if (oldMode === 'wysiwyg' && mode === 'source') {
      // WYSIWYG -> Source: get markdown from wysiwyg, send to source
      const bus = document.querySelector('pan-bus');
      bus?.publish('blog.source.setContent', { markdown: this._markdown });
    }

    // Update visibility
    if (this._sourceEditor) {
      this._sourceEditor.classList.toggle('hidden', mode === 'wysiwyg');
    }
    if (this._wysiwygEditor) {
      this._wysiwygEditor.classList.toggle('hidden', mode === 'source');
    }
  }

  _togglePreview(show) {
    this._showPreview = show !== undefined ? show : !this._showPreview;

    if (this._editorPane) {
      this._editorPane.classList.toggle('with-preview', this._showPreview);
    }
    if (this._previewPane) {
      this._previewPane.classList.toggle('hidden', !this._showPreview);
    }
  }

  _setContent(markdown) {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.source.setContent', { markdown });
    bus?.publish('blog.wysiwyg.setContent', { markdown });
    this._updatePreview();
    this._updateStats(markdown);
  }

  _updatePreview() {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.preview.update', { markdown: this._markdown });
  }

  _updateStats(text) {
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    const charCount = text.length;

    if (this._wordCount) {
      this._wordCount.textContent = `${wordCount} word${wordCount !== 1 ? 's' : ''}`;
    }
    if (this._charCount) {
      this._charCount.textContent = `${charCount} character${charCount !== 1 ? 's' : ''}`;
    }
  }

  _markDirty() {
    this._isDirty = true;
    this._updateDirtyIndicator();
  }

  _updateDirtyIndicator() {
    if (this._dirtyIndicator) {
      this._dirtyIndicator.classList.toggle('show', this._isDirty);
    }
  }

  _scheduleAutoSave() {
    if (this._autoSaveTimer) {
      clearTimeout(this._autoSaveTimer);
    }
    this._autoSaveTimer = setTimeout(() => {
      this._saveDraft();
    }, 2000);
  }

  _saveDraft() {
    const bus = document.querySelector('pan-bus');

    // Get metadata
    bus?.publish('blog.storage.save', {
      markdown: this._markdown,
      timestamp: Date.now()
    });

    this._isDirty = false;
    this._updateDirtyIndicator();
    this._showSaveStatus('Saved');
  }

  _loadDraft() {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.storage.load', {});
  }

  _showSaveStatus(message) {
    if (this._saveStatus) {
      this._saveStatus.textContent = message;
      setTimeout(() => {
        if (this._saveStatus) {
          this._saveStatus.textContent = '';
        }
      }, 2000);
    }
  }

  // Public API
  getMarkdown() {
    return this._markdown;
  }

  setMarkdown(markdown) {
    this._markdown = markdown;
    this._setContent(markdown);
  }
}

customElements.define('blog-editor', BlogEditor);
export default BlogEditor;
