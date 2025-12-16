/**
 * blog-preview
 *
 * Live preview panel for rendered markdown content.
 * Uses pan-markdown-renderer for rendering.
 *
 * Features:
 * - Real-time markdown preview
 * - Scrollable content area
 * - Styled markdown output
 *
 * PAN Events:
 * - blog.preview.update: { markdown }
 */

export class BlogPreview extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._markdown = '';
  }

  connectedCallback() {
    this.render();
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

        .preview-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-surface, #ffffff);
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

        .preview-content {
          flex: 1;
          padding: 1rem 1.5rem;
          overflow-y: auto;
        }

        /* Markdown Styles */
        .markdown-body {
          color: var(--color-text, #1e293b);
          line-height: 1.7;
          font-size: 1rem;
        }

        .markdown-body > *:first-child {
          margin-top: 0;
        }

        .markdown-body > *:last-child {
          margin-bottom: 0;
        }

        /* Headers */
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          margin: 1.5em 0 0.75em 0;
          font-weight: 600;
          line-height: 1.3;
          color: var(--color-text, #1e293b);
        }

        .markdown-body h1 {
          font-size: 2em;
          border-bottom: 2px solid var(--color-border, #e2e8f0);
          padding-bottom: 0.3em;
        }

        .markdown-body h2 {
          font-size: 1.5em;
          border-bottom: 1px solid var(--color-border, #e2e8f0);
          padding-bottom: 0.3em;
        }

        .markdown-body h3 { font-size: 1.25em; }
        .markdown-body h4 { font-size: 1.1em; }
        .markdown-body h5 { font-size: 1em; }
        .markdown-body h6 { font-size: 0.9em; color: var(--color-text-muted, #64748b); }

        /* Paragraphs */
        .markdown-body p {
          margin: 1em 0;
        }

        /* Links */
        .markdown-body a {
          color: var(--color-primary, #0f766e);
          text-decoration: none;
        }

        .markdown-body a:hover {
          text-decoration: underline;
        }

        /* Lists */
        .markdown-body ul,
        .markdown-body ol {
          margin: 1em 0;
          padding-left: 2em;
        }

        .markdown-body li {
          margin: 0.25em 0;
        }

        .markdown-body li > p {
          margin: 0.5em 0;
        }

        /* Task lists */
        .markdown-body input[type="checkbox"] {
          margin-right: 0.5em;
        }

        /* Code */
        .markdown-body code {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 0.2em 0.4em;
          border-radius: 0.25em;
          font-family: var(--font-mono, 'SF Mono', monospace);
          font-size: 0.9em;
        }

        .markdown-body pre {
          background: var(--color-code-bg, #1e293b);
          color: var(--color-code-text, #e2e8f0);
          padding: 1em;
          border-radius: 0.5em;
          overflow-x: auto;
          margin: 1em 0;
        }

        .markdown-body pre code {
          background: none;
          padding: 0;
          font-size: 0.875em;
          line-height: 1.6;
        }

        /* Blockquotes */
        .markdown-body blockquote {
          border-left: 4px solid var(--color-primary, #0f766e);
          padding: 0.5em 1em;
          margin: 1em 0;
          background: var(--color-bg-alt, #f8fafc);
          color: var(--color-text-muted, #64748b);
        }

        .markdown-body blockquote p {
          margin: 0.5em 0;
        }

        /* Horizontal rule */
        .markdown-body hr {
          border: none;
          border-top: 2px solid var(--color-border, #e2e8f0);
          margin: 2em 0;
        }

        /* Tables */
        .markdown-body table {
          border-collapse: collapse;
          width: 100%;
          margin: 1em 0;
        }

        .markdown-body th,
        .markdown-body td {
          border: 1px solid var(--color-border, #e2e8f0);
          padding: 0.5em 0.75em;
          text-align: left;
        }

        .markdown-body th {
          background: var(--color-bg-alt, #f8fafc);
          font-weight: 600;
        }

        .markdown-body tr:nth-child(even) {
          background: var(--color-bg-alt, #f8fafc);
        }

        /* Images */
        .markdown-body img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5em;
          margin: 1em 0;
        }

        /* Strong and emphasis */
        .markdown-body strong {
          font-weight: 600;
        }

        .markdown-body em {
          font-style: italic;
        }

        /* Strikethrough */
        .markdown-body del {
          text-decoration: line-through;
          color: var(--color-text-muted, #64748b);
        }

        /* Empty state */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: var(--color-text-subtle, #94a3b8);
          text-align: center;
          padding: 2rem;
        }

        .empty-state-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
          opacity: 0.5;
        }

        .empty-state-text {
          font-size: 0.875rem;
        }
      </style>

      <div class="preview-container">
        <div class="pane-header">Preview</div>
        <div class="preview-content">
          <div class="markdown-body" id="markdown-body">
            <div class="empty-state">
              <div class="empty-state-icon">&#128221;</div>
              <div class="empty-state-text">Start writing to see the preview</div>
            </div>
          </div>
        </div>
      </div>
    `;

    this._markdownBody = this.shadowRoot.getElementById('markdown-body');
  }

  _setupPanListeners() {
    const bus = document.querySelector('pan-bus');
    if (!bus) return;

    bus.subscribe('blog.preview.update', (envelope) => {
      const data = envelope.data || envelope;
      this._updatePreview(data.markdown || '');
    });
  }

  _updatePreview(markdown) {
    this._markdown = markdown;

    if (!this._markdownBody) return;

    if (!markdown.trim()) {
      this._markdownBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">&#128221;</div>
          <div class="empty-state-text">Start writing to see the preview</div>
        </div>
      `;
      return;
    }

    // Parse and render markdown
    const html = this._parseMarkdown(markdown);
    this._markdownBody.innerHTML = html;
  }

  _parseMarkdown(markdown) {
    if (!markdown) return '';

    let html = markdown;

    // Escape HTML
    html = this._escapeHtml(html);

    // Code blocks (must be before inline code)
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (match, lang, code) => {
      return `<pre><code class="language-${lang || 'text'}">${code.trim()}</code></pre>`;
    });

    // Headers
    html = html.replace(/^######\s+(.+)$/gm, '<h6>$1</h6>');
    html = html.replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>');
    html = html.replace(/^####\s+(.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');

    // Horizontal rules
    html = html.replace(/^(---|\*\*\*|___)$/gm, '<hr>');

    // Process lists
    html = this._parseLists(html);

    // Blockquotes
    html = html.replace(/^&gt;\s+(.+)$/gm, '<blockquote><p>$1</p></blockquote>');
    html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

    // Tables
    html = this._parseTables(html);

    // Bold (must be before italic)
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');

    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
    html = html.replace(/_(.+?)_/g, '<em>$1</em>');

    // Strikethrough
    html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

    // Inline code
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // Images (before links)
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

    // Links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

    // Paragraphs
    html = this._wrapParagraphs(html);

    return html;
  }

  _parseLists(html) {
    const lines = html.split('\n');
    const result = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Task list
      if (line.match(/^- \[([ x])\]/)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^- \[([ x])\]/)) {
          const match = lines[i].match(/^- \[([ x])\]\s*(.*)$/);
          if (match) {
            const checked = match[1] === 'x' ? 'checked' : '';
            items.push(`<li><input type="checkbox" ${checked} disabled>${match[2]}</li>`);
          }
          i++;
        }
        result.push('<ul>' + items.join('\n') + '</ul>');
        continue;
      }

      // Unordered list
      if (line.match(/^[*+-]\s+/)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^[*+-]\s+/)) {
          const match = lines[i].match(/^[*+-]\s+(.+)$/);
          if (match) {
            items.push(`<li>${match[1]}</li>`);
          }
          i++;
        }
        result.push('<ul>' + items.join('\n') + '</ul>');
        continue;
      }

      // Ordered list
      if (line.match(/^\d+\.\s+/)) {
        const items = [];
        while (i < lines.length && lines[i].match(/^\d+\.\s+/)) {
          const match = lines[i].match(/^\d+\.\s+(.+)$/);
          if (match) {
            items.push(`<li>${match[1]}</li>`);
          }
          i++;
        }
        result.push('<ol>' + items.join('\n') + '</ol>');
        continue;
      }

      result.push(line);
      i++;
    }

    return result.join('\n');
  }

  _parseTables(html) {
    const lines = html.split('\n');
    const result = [];
    let inTable = false;
    let tableRows = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.match(/^\|.+\|$/)) {
        const nextLine = lines[i + 1]?.trim() || '';
        const isSeparator = nextLine.match(/^\|[\s:-]+\|$/);

        if (!inTable && isSeparator) {
          inTable = true;
          const cells = line.slice(1, -1).split('|').map(c => c.trim());
          tableRows.push('<thead><tr>' + cells.map(c => `<th>${c}</th>`).join('') + '</tr></thead>');
          tableRows.push('<tbody>');
          i++;
        } else if (inTable) {
          const cells = line.slice(1, -1).split('|').map(c => c.trim());
          tableRows.push('<tr>' + cells.map(c => `<td>${c}</td>`).join('') + '</tr>');
        } else {
          result.push(line);
        }
      } else {
        if (inTable) {
          tableRows.push('</tbody>');
          result.push('<table>' + tableRows.join('\n') + '</table>');
          tableRows = [];
          inTable = false;
        }
        result.push(line);
      }
    }

    if (inTable) {
      tableRows.push('</tbody>');
      result.push('<table>' + tableRows.join('\n') + '</table>');
    }

    return result.join('\n');
  }

  _wrapParagraphs(html) {
    const lines = html.split('\n');
    const result = [];
    const blockTags = /^<(h[1-6]|ul|ol|blockquote|pre|table|hr|div)/;
    let paragraphBuffer = [];

    const flushParagraph = () => {
      if (paragraphBuffer.length > 0) {
        const text = paragraphBuffer.join(' ').trim();
        if (text) {
          result.push(`<p>${text}</p>`);
        }
        paragraphBuffer = [];
      }
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        flushParagraph();
        continue;
      }

      if (trimmed.match(blockTags) || trimmed.match(/^<\/(ul|ol|blockquote|pre|table)/)) {
        flushParagraph();
        result.push(line);
      } else if (trimmed.startsWith('<li>') || trimmed.startsWith('</')) {
        flushParagraph();
        result.push(line);
      } else {
        paragraphBuffer.push(trimmed);
      }
    }

    flushParagraph();
    return result.join('\n');
  }

  _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Public API
  setContent(markdown) {
    this._updatePreview(markdown);
  }

  getContent() {
    return this._markdown;
  }
}

customElements.define('blog-preview', BlogPreview);
export default BlogPreview;
