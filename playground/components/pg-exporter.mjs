/**
 * Code Exporter / Markup Editor
 *
 * Generate, view, and edit HTML code from canvas with live sync
 */

class PgExporter extends HTMLElement {
  constructor() {
    super();
    this.isEditMode = false;
    this.updateTimeout = null;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="exporter">
        <div class="exporter-header">
          <h3>HTML Markup</h3>
          <div class="exporter-actions">
            <button class="btn-edit" title="Toggle edit mode">✏️ Edit</button>
            <button class="btn-apply" style="display:none" title="Apply changes">✓ Apply</button>
            <button class="btn-copy" title="Copy to clipboard">📋 Copy</button>
            <button class="btn-download" title="Download as HTML">⬇️ Download</button>
          </div>
        </div>
        <div class="exporter-content">
          <pre class="code-display"><code id="code-output"></code></pre>
          <textarea class="code-editor" id="code-input" spellcheck="false" style="display:none"></textarea>
        </div>
        <div class="exporter-status"></div>
      </div>
    `;

    this.setupListeners();
    this.updateCode();
  }

  setupListeners() {
    // Update code when canvas changes (only if not in edit mode)
    document.addEventListener('component-selected', () => {
      if (!this.isEditMode) {
        setTimeout(() => this.updateCode(), 100);
      }
    });

    document.addEventListener('canvas-changed', () => {
      if (!this.isEditMode) {
        this.updateCode();
      }
    });

    // Edit button - toggle edit mode
    this.querySelector('.btn-edit').addEventListener('click', () => {
      this.toggleEditMode();
    });

    // Apply button - apply code changes to canvas
    this.querySelector('.btn-apply').addEventListener('click', () => {
      this.applyCodeChanges();
    });

    // Copy button
    this.querySelector('.btn-copy').addEventListener('click', () => {
      this.copyCode();
    });

    // Download button
    this.querySelector('.btn-download').addEventListener('click', () => {
      this.downloadCode();
    });

    // Live validation in edit mode (optional)
    this.querySelector('#code-input').addEventListener('input', () => {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = setTimeout(() => {
        this.validateCode();
      }, 500);
    });
  }

  toggleEditMode() {
    this.isEditMode = !this.isEditMode;
    const display = this.querySelector('.code-display');
    const editor = this.querySelector('.code-editor');
    const btnEdit = this.querySelector('.btn-edit');
    const btnApply = this.querySelector('.btn-apply');

    if (this.isEditMode) {
      // Switch to edit mode
      const currentCode = this.getComponentsOnlyHTML();
      editor.value = currentCode;
      display.style.display = 'none';
      editor.style.display = 'block';
      btnEdit.textContent = '👁️ View';
      btnEdit.title = 'View mode';
      btnApply.style.display = 'inline-block';
      editor.focus();
      this.showStatus('Edit mode: Make changes and click Apply', 'info');
    } else {
      // Switch to view mode
      display.style.display = 'block';
      editor.style.display = 'none';
      btnEdit.textContent = '✏️ Edit';
      btnEdit.title = 'Edit mode';
      btnApply.style.display = 'none';
      this.updateCode();
      this.showStatus('View mode', 'info');
    }
  }

  validateCode() {
    const editor = this.querySelector('#code-input');
    const code = editor.value.trim();

    try {
      // Basic validation - check if it's valid HTML structure
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'text/html');
      const parserErrors = doc.querySelector('parsererror');

      if (parserErrors) {
        this.showStatus('⚠️ Syntax error detected', 'warning');
      } else {
        this.showStatus('✓ Valid HTML', 'success');
      }
    } catch (err) {
      this.showStatus('⚠️ Syntax error: ' + err.message, 'error');
    }
  }

  applyCodeChanges() {
    const editor = this.querySelector('#code-input');
    const code = editor.value.trim();

    if (!code) {
      this.showStatus('❌ Code cannot be empty', 'error');
      return;
    }

    try {
      // Parse the HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(code, 'text/html');
      const parserErrors = doc.querySelector('parsererror');

      if (parserErrors) {
        this.showStatus('❌ Invalid HTML: Cannot parse', 'error');
        return;
      }

      // Get canvas and clear it
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

      // Clear existing components
      previewArea.innerHTML = '';
      canvas.components = [];

      // Extract body content (ignore <!DOCTYPE>, <html>, <head>, <pan-bus>)
      const bodyContent = doc.body;
      const elements = Array.from(bodyContent.children).filter(el => {
        return el.tagName.toLowerCase() !== 'pan-bus' &&
               el.tagName.toLowerCase() !== 'script';
      });

      // Load component registry for metadata
      this.loadComponentsFromHTML(elements, canvas, previewArea);

      this.showStatus('✓ Changes applied successfully', 'success');
      this.isEditMode = false;
      this.toggleEditMode(); // Switch back to view mode
    } catch (err) {
      console.error('Error applying changes:', err);
      this.showStatus('❌ Error: ' + err.message, 'error');
    }
  }

  async loadComponentsFromHTML(elements, canvas, previewArea) {
    // Load registry for component metadata
    const registryResponse = await fetch('./component-registry.json');
    const registry = await registryResponse.json();

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

        // Click to select
        newElement.addEventListener('click', (e) => {
          e.stopPropagation();
          canvas.selectComponent(newElement);
        });

        canvas.components.push(newElement);
      }

      previewArea.appendChild(newElement);
    }

    // Notify canvas changed
    canvas.dispatchEvent(new CustomEvent('canvas-changed', {
      bubbles: true
    }));
  }

  showStatus(message, type = 'info') {
    const status = this.querySelector('.exporter-status');
    status.textContent = message;
    status.className = 'exporter-status ' + type;

    // Auto-hide after 3 seconds
    setTimeout(() => {
      if (status.textContent === message) {
        status.textContent = '';
        status.className = 'exporter-status';
      }
    }, 3000);
  }

  updateCode() {
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return;

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      this.querySelector('#code-output').innerHTML = '<span class="comment">&lt;!-- No components yet --&gt;</span>';
      return;
    }

    // Generate clean HTML
    const html = this.generateHTML(components);
    const highlighted = this.highlightHTML(html);
    this.querySelector('#code-output').innerHTML = highlighted;
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

    // Highlight tags and attributes together to avoid conflicts
    code = code.replace(
      /(&lt;\/?)([\w-]+)((?:\s+[\w-]+(?:="[^"]*")?)*)\s*(\/?&gt;)/g,
      (match, openBracket, tagName, attrs, closeBracket) => {
        let result = openBracket + '<span class="tag">' + tagName + '</span>';

        // Highlight attributes if present
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

  getComponentsOnlyHTML() {
    // Get just the component markup (no full HTML structure)
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return '';

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      return '<!-- No components yet -->';
    }

    const lines = [];
    components.forEach(comp => {
      const tag = comp.tagName.toLowerCase();
      const attributes = Array.from(comp.attributes)
        .filter(attr => !attr.name.startsWith('data-') &&
                       attr.name !== 'class' &&
                       attr.name !== 'style')
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      // Get inner content, but strip out playground-specific elements
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
        // Indent inner content
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
      lines.push(''); // Empty line between components
    });

    return lines.join('\n').trim();
  }

  generateHTML(components) {
    const lines = [
      '<!DOCTYPE html>',
      '<html lang="en">',
      '<head>',
      '  <meta charset="utf-8">',
      '  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
      '  <title>LARC Playground Export</title>',
      '  <script type="module" src="https://unpkg.com/@larcjs/core/src/pan.mjs"></script>',
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

      // Get inner content, but strip out playground-specific elements
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
        // Indent inner content
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
    // Get the raw HTML code without syntax highlighting
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return '';

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      return '<!-- No components yet -->';
    }

    return this.generateHTML(components);
  }

  copyCode() {
    const code = this.getPlainCode();
    navigator.clipboard.writeText(code).then(() => {
      // Show feedback
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
