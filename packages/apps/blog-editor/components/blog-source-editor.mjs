/**
 * blog-source-editor
 *
 * Markdown source code editor component.
 * Provides a textarea-based editor for raw markdown editing.
 *
 * Features:
 * - Monospace font for code editing
 * - Keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)
 * - Auto-indent for lists
 * - Tab support
 * - Selection-aware formatting
 *
 * PAN Events:
 * - blog.source.changed: { markdown }
 * - blog.source.setContent: { markdown }
 * - features.action: { action }
 */

export class BlogSourceEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._markdown = '';
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
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .pane-header {
          padding: 0.5rem 1rem;
          background: var(--color-bg-alt, #f8fafc);
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--color-text-muted, #64748b);
        }

        .editor-textarea {
          flex: 1;
          width: 100%;
          padding: 1rem;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-mono, 'SF Mono', 'Fira Code', 'Consolas', monospace);
          font-size: 0.9rem;
          line-height: 1.7;
          background: var(--color-surface, #ffffff);
          color: var(--color-text, #1e293b);
          tab-size: 2;
        }

        .editor-textarea::placeholder {
          color: var(--color-text-subtle, #94a3b8);
        }

        .editor-textarea:focus {
          outline: none;
        }
      </style>

      <div class="editor-container">
        <div class="pane-header">Markdown</div>
        <textarea
          class="editor-textarea"
          placeholder="Start writing in markdown..."
          spellcheck="true"
        ></textarea>
      </div>
    `;

    this._textarea = this.shadowRoot.querySelector('.editor-textarea');
  }

  _setupEventListeners() {
    if (!this._textarea) return;

    // Input handling
    this._textarea.addEventListener('input', () => {
      this._markdown = this._textarea.value;
      this._broadcastChange();
    });

    // Keyboard shortcuts
    this._textarea.addEventListener('keydown', (e) => {
      this._handleKeydown(e);
    });
  }

  _setupPanListeners() {
    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    // Set content from external source
    bus.subscribe('blog.source.setContent', (envelope) => {
      const data = envelope.data || envelope;
      this._setContent(data.markdown || '');
    });

    // Handle formatting actions
    bus.subscribe('features.action', (envelope) => {
      const data = envelope.data || envelope;
      if (data.mode === 'source' || !data.mode) {
        this._handleAction(data.action);
      }
    });
  }

  _handleKeydown(e) {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault();
      this._insertText('  ');
      return;
    }

    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this._handleAction('bold');
          break;
        case 'i':
          e.preventDefault();
          this._handleAction('italic');
          break;
        case 'k':
          e.preventDefault();
          this._handleAction('link');
          break;
      }
    }

    // Auto-continue lists on Enter
    if (e.key === 'Enter') {
      this._handleEnter(e);
    }
  }

  _handleEnter(e) {
    const pos = this._textarea.selectionStart;
    const text = this._textarea.value;

    // Get current line
    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = text.indexOf('\n', pos);
    const line = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

    // Check for list patterns
    const ulMatch = line.match(/^(\s*)[*+-]\s(.*)$/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s(.*)$/);
    const taskMatch = line.match(/^(\s*)- \[([ x])\]\s(.*)$/);

    // If line is empty list item, remove it
    if (ulMatch && !ulMatch[2].trim()) {
      e.preventDefault();
      const newText = text.substring(0, lineStart) + text.substring(pos);
      this._textarea.value = newText;
      this._textarea.setSelectionRange(lineStart, lineStart);
      this._markdown = this._textarea.value;
      this._broadcastChange();
      return;
    }

    if (olMatch && !olMatch[3].trim()) {
      e.preventDefault();
      const newText = text.substring(0, lineStart) + text.substring(pos);
      this._textarea.value = newText;
      this._textarea.setSelectionRange(lineStart, lineStart);
      this._markdown = this._textarea.value;
      this._broadcastChange();
      return;
    }

    if (taskMatch && !taskMatch[3].trim()) {
      e.preventDefault();
      const newText = text.substring(0, lineStart) + text.substring(pos);
      this._textarea.value = newText;
      this._textarea.setSelectionRange(lineStart, lineStart);
      this._markdown = this._textarea.value;
      this._broadcastChange();
      return;
    }

    // Continue list
    if (ulMatch) {
      e.preventDefault();
      this._insertText(`\n${ulMatch[1]}* `);
    } else if (olMatch) {
      e.preventDefault();
      const nextNum = parseInt(olMatch[2]) + 1;
      this._insertText(`\n${olMatch[1]}${nextNum}. `);
    } else if (taskMatch) {
      e.preventDefault();
      this._insertText(`\n${taskMatch[1]}- [ ] `);
    }
  }

  _handleAction(action) {
    const actions = {
      // Formatting
      bold: () => this._wrapSelection('**', '**'),
      italic: () => this._wrapSelection('*', '*'),
      strikethrough: () => this._wrapSelection('~~', '~~'),

      // Headings
      h1: () => this._prefixLine('# '),
      h2: () => this._prefixLine('## '),
      h3: () => this._prefixLine('### '),
      h4: () => this._prefixLine('#### '),

      // Lists
      ul: () => this._prefixLine('* '),
      ol: () => this._prefixLine('1. '),
      task: () => this._prefixLine('- [ ] '),

      // Media
      link: () => this._insertLink(),
      image: () => this._insertImage(),

      // Code
      code: () => this._wrapSelection('`', '`'),
      codeblock: () => this._insertCodeBlock(),

      // Other
      quote: () => this._prefixLine('> '),
      hr: () => this._insertText('\n---\n'),
      table: () => this._insertTable()
    };

    const fn = actions[action];
    if (fn) {
      fn();
      this._textarea.focus();
    }
  }

  _wrapSelection(before, after) {
    const start = this._textarea.selectionStart;
    const end = this._textarea.selectionEnd;
    const text = this._textarea.value;
    const selected = text.substring(start, end);

    const newText = text.substring(0, start) + before + selected + after + text.substring(end);
    this._textarea.value = newText;

    // Position cursor
    if (selected) {
      this._textarea.setSelectionRange(start + before.length, end + before.length);
    } else {
      this._textarea.setSelectionRange(start + before.length, start + before.length);
    }

    this._markdown = this._textarea.value;
    this._broadcastChange();
  }

  _prefixLine(prefix) {
    const pos = this._textarea.selectionStart;
    const text = this._textarea.value;

    const lineStart = text.lastIndexOf('\n', pos - 1) + 1;

    // Check if line already has this prefix
    const lineText = text.substring(lineStart);
    if (lineText.startsWith(prefix)) {
      // Remove prefix
      const newText = text.substring(0, lineStart) + lineText.substring(prefix.length);
      this._textarea.value = newText;
      this._textarea.setSelectionRange(pos - prefix.length, pos - prefix.length);
    } else {
      // Add prefix
      const newText = text.substring(0, lineStart) + prefix + text.substring(lineStart);
      this._textarea.value = newText;
      this._textarea.setSelectionRange(pos + prefix.length, pos + prefix.length);
    }

    this._markdown = this._textarea.value;
    this._broadcastChange();
  }

  _insertText(text) {
    const pos = this._textarea.selectionStart;
    const value = this._textarea.value;

    this._textarea.value = value.substring(0, pos) + text + value.substring(pos);
    this._textarea.setSelectionRange(pos + text.length, pos + text.length);

    this._markdown = this._textarea.value;
    this._broadcastChange();
  }

  _insertLink() {
    const start = this._textarea.selectionStart;
    const end = this._textarea.selectionEnd;
    const selected = this._textarea.value.substring(start, end);

    if (selected) {
      // Wrap selection as link text
      this._wrapSelection('[', '](url)');
      // Select 'url' for easy replacement
      const newPos = end + 3;
      this._textarea.setSelectionRange(newPos, newPos + 3);
    } else {
      this._insertText('[link text](url)');
      // Select 'link text'
      this._textarea.setSelectionRange(start + 1, start + 10);
    }
  }

  _insertImage() {
    const start = this._textarea.selectionStart;
    const selected = this._textarea.value.substring(start, this._textarea.selectionEnd);

    if (selected) {
      this._wrapSelection('![', '](image-url)');
    } else {
      this._insertText('![alt text](image-url)');
      this._textarea.setSelectionRange(start + 2, start + 10);
    }
  }

  _insertCodeBlock() {
    const start = this._textarea.selectionStart;
    const end = this._textarea.selectionEnd;
    const selected = this._textarea.value.substring(start, end);

    if (selected) {
      this._wrapSelection('\n```\n', '\n```\n');
    } else {
      this._insertText('\n```\ncode here\n```\n');
      this._textarea.setSelectionRange(start + 5, start + 14);
    }
  }

  _insertTable() {
    const table = `
| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |
`;
    this._insertText(table);
  }

  _setContent(markdown) {
    this._markdown = markdown;
    if (this._textarea) {
      this._textarea.value = markdown;
    }
  }

  _broadcastChange() {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.source.changed', { markdown: this._markdown });
  }

  // Public API
  getValue() {
    return this._markdown;
  }

  setValue(markdown) {
    this._setContent(markdown);
  }

  focus() {
    this._textarea?.focus();
  }

  getSelection() {
    if (!this._textarea) return null;
    return {
      start: this._textarea.selectionStart,
      end: this._textarea.selectionEnd,
      text: this._textarea.value.substring(
        this._textarea.selectionStart,
        this._textarea.selectionEnd
      )
    };
  }
}

customElements.define('blog-source-editor', BlogSourceEditor);
export default BlogSourceEditor;
