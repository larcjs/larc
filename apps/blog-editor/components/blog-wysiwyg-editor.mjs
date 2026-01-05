/**
 * blog-wysiwyg-editor
 *
 * WYSIWYG editor using contenteditable.
 * Provides rich text editing with live formatting.
 *
 * Features:
 * - contenteditable div for live editing
 * - Toolbar integration for formatting
 * - HTML to/from Markdown conversion
 * - Selection-aware formatting
 * - Keyboard shortcuts
 *
 * PAN Events:
 * - blog.wysiwyg.changed: { markdown, html }
 * - blog.wysiwyg.setContent: { markdown }
 * - features.action: { action }
 */

export class BlogWysiwygEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._markdown = '';
    this._html = '';
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
          flex-shrink: 0;
        }

        .editor-content {
          flex: 1;
          padding: 1rem 1.5rem;
          overflow-y: auto;
          outline: none;
          font-size: 1rem;
          line-height: 1.7;
          color: var(--color-text, #1e293b);
          background: var(--color-surface, #ffffff);
        }

        .editor-content:focus {
          outline: none;
        }

        .editor-content:empty::before {
          content: attr(data-placeholder);
          color: var(--color-text-subtle, #94a3b8);
          pointer-events: none;
        }

        /* Typography */
        .editor-content h1,
        .editor-content h2,
        .editor-content h3,
        .editor-content h4,
        .editor-content h5,
        .editor-content h6 {
          margin: 1em 0 0.5em 0;
          font-weight: 600;
          line-height: 1.3;
        }

        .editor-content h1 { font-size: 2em; }
        .editor-content h2 { font-size: 1.5em; }
        .editor-content h3 { font-size: 1.25em; }
        .editor-content h4 { font-size: 1.1em; }

        .editor-content p {
          margin: 1em 0;
        }

        .editor-content ul,
        .editor-content ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .editor-content li {
          margin: 0.25em 0;
        }

        .editor-content a {
          color: var(--color-primary, #0f766e);
          text-decoration: underline;
        }

        .editor-content code {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: var(--font-mono, monospace);
          font-size: 0.9em;
        }

        .editor-content pre {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 1em 0;
          font-family: var(--font-mono, monospace);
          font-size: 0.875em;
          line-height: 1.6;
        }

        .editor-content pre code {
          background: none;
          padding: 0;
        }

        .editor-content blockquote {
          border-left: 4px solid var(--color-primary, #0f766e);
          padding: 0.5em 1em;
          margin: 1em 0;
          background: var(--color-bg-alt, #f8fafc);
          color: var(--color-text-muted, #64748b);
        }

        .editor-content hr {
          border: none;
          border-top: 2px solid var(--color-border, #e2e8f0);
          margin: 2em 0;
        }

        .editor-content table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        .editor-content th,
        .editor-content td {
          border: 1px solid var(--color-border, #e2e8f0);
          padding: 0.5em 0.75em;
          text-align: left;
        }

        .editor-content th {
          background: var(--color-bg-alt, #f8fafc);
          font-weight: 600;
        }

        .editor-content img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
        }
      </style>

      <div class="editor-container">
        <div class="pane-header">Visual Editor</div>
        <div
          class="editor-content"
          contenteditable="true"
          data-placeholder="Start writing..."
          spellcheck="true"
        ></div>
      </div>
    `;

    this._editor = this.shadowRoot.querySelector('.editor-content');
  }

  _setupEventListeners() {
    if (!this._editor) return;

    // Input handling
    this._editor.addEventListener('input', () => {
      this._html = this._editor.innerHTML;
      this._markdown = this._htmlToMarkdown(this._html);
      this._broadcastChange();
    });

    // Keyboard shortcuts
    this._editor.addEventListener('keydown', (e) => {
      this._handleKeydown(e);
    });

    // Paste handling - clean up pasted content
    this._editor.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });
  }

  _setupPanListeners() {
    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    // Set content from external source
    bus.subscribe('blog.wysiwyg.setContent', (envelope) => {
      const data = envelope.data || envelope;
      this._setContent(data.markdown || '');
    });

    // Handle formatting actions
    bus.subscribe('features.action', (envelope) => {
      const data = envelope.data || envelope;
      if (data.mode === 'wysiwyg') {
        this._handleAction(data.action);
      }
    });
  }

  _handleKeydown(e) {
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

    // Handle Enter in certain contexts
    if (e.key === 'Enter' && !e.shiftKey) {
      const selection = this.shadowRoot.getSelection ? this.shadowRoot.getSelection() : window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const parentTag = range.startContainer.parentElement?.tagName?.toLowerCase();

        // In a heading, exit to paragraph
        if (parentTag && /^h[1-6]$/.test(parentTag)) {
          e.preventDefault();
          document.execCommand('formatBlock', false, 'p');
        }
      }
    }
  }

  _handleAction(action) {
    const actions = {
      // Formatting
      bold: () => document.execCommand('bold', false, null),
      italic: () => document.execCommand('italic', false, null),
      strikethrough: () => document.execCommand('strikeThrough', false, null),

      // Headings
      h1: () => document.execCommand('formatBlock', false, 'h1'),
      h2: () => document.execCommand('formatBlock', false, 'h2'),
      h3: () => document.execCommand('formatBlock', false, 'h3'),
      h4: () => document.execCommand('formatBlock', false, 'h4'),

      // Lists
      ul: () => document.execCommand('insertUnorderedList', false, null),
      ol: () => document.execCommand('insertOrderedList', false, null),
      task: () => this._insertTaskList(),

      // Media
      link: () => this._insertLink(),
      image: () => this._insertImage(),

      // Code
      code: () => this._wrapInCode(),
      codeblock: () => this._insertCodeBlock(),

      // Other
      quote: () => document.execCommand('formatBlock', false, 'blockquote'),
      hr: () => document.execCommand('insertHorizontalRule', false, null),
      table: () => this._insertTable()
    };

    const fn = actions[action];
    if (fn) {
      fn();
      this._editor.focus();
      this._html = this._editor.innerHTML;
      this._markdown = this._htmlToMarkdown(this._html);
      this._broadcastChange();
    }
  }

  _insertLink() {
    const selection = window.getSelection();
    const selectedText = selection.toString();
    const url = prompt('Enter URL:', 'https://');

    if (url) {
      if (selectedText) {
        document.execCommand('createLink', false, url);
      } else {
        const text = prompt('Enter link text:', 'Link');
        if (text) {
          const link = `<a href="${url}">${text}</a>`;
          document.execCommand('insertHTML', false, link);
        }
      }
    }
  }

  _insertImage() {
    const url = prompt('Enter image URL:', 'https://');
    if (url) {
      const alt = prompt('Enter alt text:', 'Image');
      const img = `<img src="${url}" alt="${alt || 'Image'}">`;
      document.execCommand('insertHTML', false, img);
    }
  }

  _wrapInCode() {
    const selection = window.getSelection();
    const selectedText = selection.toString();

    if (selectedText) {
      document.execCommand('insertHTML', false, `<code>${selectedText}</code>`);
    } else {
      document.execCommand('insertHTML', false, '<code>code</code>');
    }
  }

  _insertCodeBlock() {
    const code = prompt('Enter code:', '');
    if (code !== null) {
      const pre = `<pre><code>${this._escapeHtml(code || 'code here')}</code></pre>`;
      document.execCommand('insertHTML', false, pre);
    }
  }

  _insertTaskList() {
    const html = `<ul><li><input type="checkbox"> Task item</li></ul>`;
    document.execCommand('insertHTML', false, html);
  }

  _insertTable() {
    const table = `
      <table>
        <thead>
          <tr><th>Header 1</th><th>Header 2</th><th>Header 3</th></tr>
        </thead>
        <tbody>
          <tr><td>Cell 1</td><td>Cell 2</td><td>Cell 3</td></tr>
          <tr><td>Cell 4</td><td>Cell 5</td><td>Cell 6</td></tr>
        </tbody>
      </table>
    `;
    document.execCommand('insertHTML', false, table);
  }

  _setContent(markdown) {
    this._markdown = markdown;
    this._html = this._markdownToHtml(markdown);
    if (this._editor) {
      this._editor.innerHTML = this._html;
    }
  }

  _broadcastChange() {
    const bus = document.querySelector('pan-bus');
    bus?.publish('blog.wysiwyg.changed', {
      markdown: this._markdown,
      html: this._html
    });
  }

  // HTML to Markdown conversion
  _htmlToMarkdown(html) {
    if (!html) return '';

    const temp = document.createElement('div');
    temp.innerHTML = html;

    return this._nodeToMarkdown(temp).trim();
  }

  _nodeToMarkdown(node) {
    let result = '';

    for (const child of node.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        const tag = child.tagName.toLowerCase();

        switch (tag) {
          case 'p':
            result += this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'br':
            result += '\n';
            break;
          case 'h1':
            result += '# ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'h2':
            result += '## ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'h3':
            result += '### ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'h4':
            result += '#### ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'h5':
            result += '##### ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'h6':
            result += '###### ' + this._nodeToMarkdown(child) + '\n\n';
            break;
          case 'strong':
          case 'b':
            result += '**' + this._nodeToMarkdown(child) + '**';
            break;
          case 'em':
          case 'i':
            result += '*' + this._nodeToMarkdown(child) + '*';
            break;
          case 'del':
          case 's':
          case 'strike':
            result += '~~' + this._nodeToMarkdown(child) + '~~';
            break;
          case 'code':
            if (child.parentElement?.tagName.toLowerCase() !== 'pre') {
              result += '`' + child.textContent + '`';
            } else {
              result += child.textContent;
            }
            break;
          case 'pre':
            result += '```\n' + this._nodeToMarkdown(child) + '\n```\n\n';
            break;
          case 'a':
            const href = child.getAttribute('href') || '';
            result += '[' + this._nodeToMarkdown(child) + '](' + href + ')';
            break;
          case 'img':
            const src = child.getAttribute('src') || '';
            const alt = child.getAttribute('alt') || '';
            result += '![' + alt + '](' + src + ')';
            break;
          case 'ul':
            result += this._listToMarkdown(child, '*') + '\n';
            break;
          case 'ol':
            result += this._listToMarkdown(child, '1.') + '\n';
            break;
          case 'li':
            // Handled by list parent
            break;
          case 'blockquote':
            const quoteLines = this._nodeToMarkdown(child).split('\n');
            result += quoteLines.map(l => '> ' + l).join('\n') + '\n\n';
            break;
          case 'hr':
            result += '\n---\n\n';
            break;
          case 'table':
            result += this._tableToMarkdown(child) + '\n\n';
            break;
          case 'div':
            result += this._nodeToMarkdown(child) + '\n';
            break;
          default:
            result += this._nodeToMarkdown(child);
        }
      }
    }

    return result;
  }

  _listToMarkdown(listNode, marker) {
    let result = '';
    let index = 1;

    for (const li of listNode.children) {
      if (li.tagName.toLowerCase() === 'li') {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const prefix = marker === '1.' ? `${index++}.` : marker;

        if (checkbox) {
          const checked = checkbox.checked ? 'x' : ' ';
          const text = li.textContent.trim();
          result += `- [${checked}] ${text}\n`;
        } else {
          result += `${prefix} ${this._nodeToMarkdown(li).trim()}\n`;
        }
      }
    }

    return result;
  }

  _tableToMarkdown(table) {
    let result = '';
    const rows = table.querySelectorAll('tr');

    rows.forEach((row, rowIndex) => {
      const cells = row.querySelectorAll('th, td');
      const cellTexts = Array.from(cells).map(c => c.textContent.trim());

      result += '| ' + cellTexts.join(' | ') + ' |\n';

      // Add separator after header row
      if (rowIndex === 0 && row.querySelector('th')) {
        result += '|' + cellTexts.map(() => '---').join('|') + '|\n';
      }
    });

    return result;
  }

  // Markdown to HTML conversion (reuse from preview)
  _markdownToHtml(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML
    html = this._escapeHtml(html);

    // Code blocks
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // HR
    html = html.replace(/^(---|\*\*\*|___)$/gm, '<hr>');

    // Lists (simplified)
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // Paragraphs
    const lines = html.split('\n\n');
    html = lines.map(line => {
      line = line.trim();
      if (!line) return '';
      if (line.startsWith('<h') || line.startsWith('<ul') || line.startsWith('<ol') ||
          line.startsWith('<pre') || line.startsWith('<blockquote') ||
          line.startsWith('<hr') || line.startsWith('<table')) {
        return line;
      }
      return `<p>${line.replace(/\n/g, '<br>')}</p>`;
    }).join('\n');

    return html;
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  getValue() {
    return this._markdown;
  }

  setValue(markdown) {
    this._setContent(markdown);
  }

  getHtml() {
    return this._html;
  }

  focus() {
    this._editor?.focus();
  }
}

customElements.define('blog-wysiwyg-editor', BlogWysiwygEditor);
export default BlogWysiwygEditor;
