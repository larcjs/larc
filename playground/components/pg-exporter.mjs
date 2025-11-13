/**
 * Code Exporter
 * 
 * Generate and export HTML code from canvas
 */

class PgExporter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="exporter">
        <div class="exporter-header">
          <h3>HTML Code</h3>
          <div class="exporter-actions">
            <button class="btn-copy">Copy</button>
            <button class="btn-download">Download</button>
          </div>
        </div>
        <pre><code id="code-output"></code></pre>
      </div>
    `;

    this.setupListeners();
    this.updateCode();
  }

  setupListeners() {
    // Update code when canvas changes
    document.addEventListener('component-selected', () => {
      setTimeout(() => this.updateCode(), 100);
    });

    document.addEventListener('canvas-changed', () => {
      this.updateCode();
    });

    // Copy button
    this.querySelector('.btn-copy').addEventListener('click', () => {
      this.copyCode();
    });

    // Download button
    this.querySelector('.btn-download').addEventListener('click', () => {
      this.downloadCode();
    });
  }

  updateCode() {
    const canvas = document.querySelector('pg-canvas');
    if (!canvas) return;

    const previewArea = canvas.querySelector('#preview-area');
    const components = Array.from(previewArea.querySelectorAll('.pg-component'));

    if (components.length === 0) {
      this.querySelector('#code-output').textContent = '<!-- No components yet -->';
      return;
    }

    // Generate clean HTML
    const html = this.generateHTML(components);
    this.querySelector('#code-output').textContent = html;
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
        .filter(attr => !attr.name.startsWith('data-') && attr.name !== 'class')
        .map(attr => `${attr.name}="${attr.value}"`)
        .join(' ');

      const content = comp.innerHTML.trim();

      if (content) {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}>`);
        // Indent inner content
        content.split('\n').forEach(line => {
          lines.push(`    ${line}`);
        });
        lines.push(`  </${tag}>`);
      } else {
        lines.push(`  <${tag}${attributes ? ' ' + attributes : ''}></${tag}>`);
      }
    });

    lines.push('', '</body>', '</html>');
    return lines.join('\n');
  }

  copyCode() {
    const code = this.querySelector('#code-output').textContent;
    navigator.clipboard.writeText(code).then(() => {
      // Show feedback
      const btn = this.querySelector('.btn-copy');
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => btn.textContent = originalText, 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  }

  downloadCode() {
    const code = this.querySelector('#code-output').textContent;
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
