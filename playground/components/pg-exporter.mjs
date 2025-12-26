/**
 * Code Exporter / Live Markup Editor
 *
 * Generate, view, and edit HTML code from canvas with live sync
 * Uses contenteditable for inline editing with automatic rerendering
 */

class PgExporter extends HTMLElement {
  constructor() {
    super();
    this.updateTimeout = null;
    this.isUpdatingFromCanvas = false;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="exporter">
        <div class="exporter-header">
          <h3>HTML Markup</h3>
          <div class="exporter-actions">
            <span class="edit-hint">Click code to edit • Changes auto-apply</span>
            <button class="btn-copy" title="Copy to clipboard">📋 Copy</button>
            <button class="btn-download" title="Download as HTML">⬇️ Download</button>
          </div>
        </div>
        <div class="exporter-content">
          <pre class="code-display"><code id="code-output" contenteditable="true" spellcheck="false"></code></pre>
        </div>
        <div class="exporter-status"></div>
      </div>
    `;

    this.setupListeners();
    this.updateCode();
  }

  setupListeners() {
    // Update code when canvas changes (only if not from our own edit)
    document.addEventListener('component-selected', () => {
      if (!this.isUpdatingFromCanvas) {
        setTimeout(() => this.updateCode(), 100);
      }
    });

    document.addEventListener('canvas-changed', () => {
      if (!this.isUpdatingFromCanvas) {
        this.updateCode();
      }
    });

    // Copy button
    this.querySelector('.btn-copy').addEventListener('click', () => {
      this.copyCode();
    });

    // Download button
    this.querySelector('.btn-download').addEventListener('click', () => {
      this.downloadCode();
    });

    // Live editing with debounced apply
    const codeOutput = this.querySelector('#code-output');

    codeOutput.addEventListener('input', () => {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.applyCodeChanges();
      }, 800); // Debounce for smoother editing
    });

    // Prevent default paste and insert plain text
    codeOutput.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    });

    // Keyboard shortcuts
    codeOutput.addEventListener('keydown', (e) => {
      // Cmd/Ctrl+Enter to force apply
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        clearTimeout(this.updateTimeout);
        this.applyCodeChanges();
      }

      // Tab key inserts spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
      }
    });

    // Focus styling
    codeOutput.addEventListener('focus', () => {
      this.querySelector('.code-display').classList.add('editing');
    });

    codeOutput.addEventListener('blur', () => {
      this.querySelector('.code-display').classList.remove('editing');
      // Apply changes on blur
      clearTimeout(this.updateTimeout);
      this.applyCodeChanges();
    });
  }

  applyCodeChanges() {
    const codeOutput = this.querySelector('#code-output');
    // Get the plain text content (strip any HTML formatting)
    const code = this.getPlainTextFromElement(codeOutput).trim();

    if (!code || code === '<!-- No components yet -->') {
      return;
    }

    try {
      // Extract just the component markup (between body tags or the whole thing)
      let componentCode = code;

      // If it's a full HTML document, extract just the body content
      if (code.includes('<body>') || code.includes('<!DOCTYPE')) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(code, 'text/html');
        const body = doc.body;

        // Filter out pan-bus, scripts, etc.
        const elements = Array.from(body.children).filter(el => {
          const tag = el.tagName.toLowerCase();
          return tag !== 'pan-bus' &&
                 tag !== 'script' &&
                 tag !== 'style' &&
                 tag !== 'link';
        });

        componentCode = elements.map(el => el.outerHTML).join('\n');
      }

      // Sanitize the component code before parsing to prevent XSS
      const safeComponentCode = this.sanitizeHTML(componentCode);

      // Parse the component code
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${safeComponentCode}</div>`, 'text/xml');
      const wrapper = doc.documentElement;
      const parserErrors = doc.querySelector('parsererror');

      if (parserErrors) {
        this.showStatus('⚠️ Syntax error - fix and try again', 'warning');
        return;
      }

      // Get canvas and apply changes
      const canvas = document.querySelector('pg-canvas');
      if (!canvas) {
        this.showStatus('❌ Canvas not found', 'error');
        return;
      }

      const previewArea = canvas.querySelector('#preview-area');
      if (!previewArea) {
        this.showStatus('❌ Preview area not found', 'error');
        return;
      }

      // Mark that we're updating to prevent feedback loop
      this.isUpdatingFromCanvas = true;

      // Clear existing components
      while (previewArea.firstChild) {
        previewArea.removeChild(previewArea.firstChild);
      }
      canvas.components = [];

      // Clear badges
      const badgeContainer = canvas.querySelector('#non-ui-badges');
      if (badgeContainer) badgeContainer.innerHTML = '';

      // Extract elements
      const elements = Array.from(wrapper.children).filter(el => {
        const tag = el.tagName.toLowerCase();
        return tag !== 'pan-bus' &&
               tag !== 'script' &&
               tag !== 'style' &&
               tag !== 'link' &&
               tag !== 'iframe' &&
               tag !== 'object' &&
               tag !== 'embed';
      });

      // Load components
      this.loadComponentsFromHTML(elements, canvas, previewArea).then(() => {
        this.showStatus('✓ Applied', 'success');
        setTimeout(() => {
          this.isUpdatingFromCanvas = false;
        }, 100);
      });

    } catch (err) {
      console.error('Error applying changes:', err);
      this.showStatus('⚠️ ' + err.message, 'error');
      this.isUpdatingFromCanvas = false;
    }
  }

  /**
   * Simple native HTML sanitizer - removes dangerous elements and attributes
   * No external dependencies required
   */
  sanitizeHTML(html) {
    const temp = document.createElement('template');
    temp.innerHTML = html;

    const dangerousElements = ['script', 'iframe', 'object', 'embed', 'link', 'style', 'base', 'meta'];
    const dangerousAttrs = ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout',
                           'onmousemove', 'onmousedown', 'onmouseup', 'onfocus', 'onblur',
                           'onchange', 'onsubmit', 'onkeypress', 'onkeydown', 'onkeyup',
                           'formaction', 'action'];

    // Remove dangerous elements
    dangerousElements.forEach(tag => {
      const elements = temp.content.querySelectorAll(tag);
      elements.forEach(el => el.remove());
    });

    // Remove dangerous attributes from all elements
    const allElements = temp.content.querySelectorAll('*');
    allElements.forEach(el => {
      dangerousAttrs.forEach(attr => {
        if (el.hasAttribute(attr)) {
          el.removeAttribute(attr);
        }
      });

      // Also remove any attribute that starts with "on"
      Array.from(el.attributes).forEach(attr => {
        if (attr.name.toLowerCase().startsWith('on')) {
          el.removeAttribute(attr.name);
        }
      });

      // Sanitize href and src to prevent javascript: protocol
      if (el.hasAttribute('href')) {
        const href = el.getAttribute('href');
        if (href.toLowerCase().trim().startsWith('javascript:')) {
          el.removeAttribute('href');
        }
      }
      if (el.hasAttribute('src')) {
        const src = el.getAttribute('src');
        if (src.toLowerCase().trim().startsWith('javascript:')) {
          el.removeAttribute('src');
        }
      }
    });

    return temp.innerHTML;
  }

  getPlainTextFromElement(element) {
    // Use DOM parsing to reliably extract plain text from the HTML content.
    // This avoids regex-based stripping of tags, which can be incomplete
    // for multi-character patterns and malformed markup.
    const temp = document.createElement('div');
    temp.innerHTML = element.innerHTML;
    // innerText preserves visual line breaks from <br> and block elements.
    return temp.innerText;
  }

  async loadComponentsFromHTML(elements, canvas, previewArea) {
    // Load registry for component metadata
    const registryResponse = await fetch('./component-registry.json');
    const registry = await registryResponse.json();

    const nonUICategories = ['state', 'routing', 'data', 'devtools', 'advanced', 'auth'];

    for (const element of elements) {
      const tagName = element.tagName.toLowerCase();
      const componentMeta = registry.components.find(c => c.name === tagName);

      // Create new element
      const newElement = document.createElement(tagName);

      // Copy all attributes
      Array.from(element.attributes).forEach(attr => {
        newElement.setAttribute(attr.name, attr.value);
      });

      // Copy inner content if any
      if (element.innerHTML.trim()) {
        newElement.innerHTML = element.innerHTML;
      }

      // If we have component metadata, make it selectable
      if (componentMeta) {
        await canvas.ensureComponentLoaded(componentMeta);
        newElement.classList.add('pg-component');
        newElement.dataset.componentId = crypto.randomUUID();
        newElement.dataset.componentMeta = JSON.stringify(componentMeta);

        // Check if non-UI component
        const isNonUIComponent = nonUICategories.includes(componentMeta.category);
        if (isNonUIComponent) {
          canvas.addNonUIBadge(newElement, componentMeta);
          newElement.style.display = 'none';
        }

        // Click to select
        newElement.addEventListener('click', (e) => {
          e.stopPropagation();
          canvas.selectComponent(newElement);
        });

        canvas.components.push(newElement);
      }

      previewArea.appendChild(newElement);
    }

    // Show empty state if no components
    if (elements.length === 0) {
      previewArea.innerHTML = `
        <div class="empty-state">
          Click a component from the sidebar to add it here
        </div>
      `;
    }

    // Notify canvas changed (without triggering our own update)
    canvas.dispatchEvent(new CustomEvent('canvas-changed', {
      bubbles: true
    }));
  }

  showStatus(message, type = 'info') {
    const status = this.querySelector('.exporter-status');
    status.textContent = message;
    status.className = 'exporter-status ' + type;

    // Auto-hide after 2 seconds
    setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = '';
        status.className = 'exporter-status';
      }
    }, 2000);
  }

  updateCode() {
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return;

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    const codeOutput = this.querySelector('#code-output');

    if (components.length === 0) {
      codeOutput.innerHTML = '<span class="comment">&lt;!-- No components yet --&gt;</span>';
      return;
    }

    // Generate clean HTML (just components, no full document)
    const html = this.getComponentsOnlyHTML(components);
    const highlighted = this.highlightHTML(html);
    codeOutput.innerHTML = highlighted;
  }

  highlightHTML(code) {
    // Escape HTML first
    code = code
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Highlight comments
    code = code.replace(
      /(&lt;!--.*?--&gt;)/g,
      '<span class="comment">$1</span>'
    );

    // Highlight DOCTYPE
    code = code.replace(
      /(&lt;!DOCTYPE[^&]*&gt;)/gi,
      '<span class="doctype">$1</span>'
    );

    // Highlight tags and attributes
    code = code.replace(
      /(&lt;\/?)([\w-]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(\/?&gt;)/g,
      (match, openBracket, tagName, attrs, closeBracket) => {
        let result = openBracket + '<span class="tag">' + tagName + '</span>';

        if (attrs) {
          result += attrs.replace(
            /([\w-]+)(=)(")(.*?)(")/g,
            ' <span class="attr-name">$1</span><span class="punctuation">$2$3</span><span class="attr-value">$4</span><span class="punctuation">$5</span>'
          );
        }

        result += '<span class="punctuation">' + closeBracket + '</span>';
        return result;
      }
    );

    return code;
  }

  getComponentsOnlyHTML(components) {
    const lines = [];

    components.forEach(comp => {
      const tag = comp.tagName.toLowerCase();
      const attributes = Array.from(comp.attributes)
        .filter(attr => !attr.name.startsWith('data-') &&
                       attr.name !== 'class' &&
                       attr.name !== 'style')
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      // Get inner content, stripping playground-specific elements
      const clone = comp.cloneNode(true);
      const label = clone.querySelector('.pg-component-label');
      if (label) label.remove();
      const badge = clone.querySelector('.pg-component-badge');
      if (badge) badge.remove();
      const hint = clone.querySelector('.pg-component-hint');
      if (hint) hint.remove();
      const content = clone.innerHTML.trim();

      if (content) {
        lines.push(`<${tag}${attributes ? ' ' + attributes : ''}>`);
        const contentLines = content.split('\n');
        contentLines.forEach(line => {
          if (line.trim()) {
            lines.push(`  ${line}`);
          }
        });
        lines.push(`</${tag}>`);
      } else {
        lines.push(`<${tag}${attributes ? ' ' + attributes : ''}></${tag}>`);
      }
      lines.push('');
    });

    return lines.join('\n').trim();
  }

  generateFullHTML(components) {
    const lines = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>LARC Playground Export</title>',
      '  <script type="module" src="https://unpkg.com/@larcjs/core/pan.mjs"></script>',
      '</head>',
      '<body>',
      '  <pan-bus></pan-bus>',
      ''
    ];

    components.forEach(comp => {
      const tag = comp.tagName.toLowerCase();
      const attributes = Array.from(comp.attributes)
        .filter(attr => !attr.name.startsWith('data-') &&
                       attr.name !== 'class' &&
                       attr.name !== 'style')
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      const clone = comp.cloneNode(true);
      const label = clone.querySelector('.pg-component-label');
      if (label) label.remove();
      const badge = clone.querySelector('.pg-component-badge');
      if (badge) badge.remove();
      const hint = clone.querySelector('.pg-component-hint');
      if (hint) hint.remove();
      const content = clone.innerHTML.trim();

      if (content) {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}>`);
        content.split('\n').forEach(line => {
          if (line.trim()) {
            lines.push(`    ${line}`);
          }
        });
        lines.push(`  </${tag}>`);
      } else {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}></${tag}>`);
      }
    });

    lines.push('', '</body>', '</html>');
    return lines.join('\n');
  }

  getPlainCode() {
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return '';

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      return '<!-- No components yet -->';
    }

    return this.generateFullHTML(components);
  }

  copyCode() {
    const code = this.getPlainCode();
    navigator.clipboard.writeText(code).then(() => {
      const btn = this.querySelector('.btn-copy');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied!';
      setTimeout(() => btn.textContent = originalText, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  }

  downloadCode() {
    const code = this.getPlainCode();
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'larc-playground-export.html';
    a.click();
    URL.revokeObjectURL(url);
  }
}

customElements.define('pg-exporter', PgExporter);
