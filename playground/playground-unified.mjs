/**
 * LARC Playground - Unified System
 * Manages three modes: Gallery, Builder, and Editor
 */

// Import existing components (these will still work for Builder mode)
import './components/pg-palette.mjs';
import './components/pg-canvas.mjs';
import './components/pg-properties.mjs';
import './components/pg-exporter.mjs';
import './components/pg-bus-monitor.mjs';

// Import examples
import { getAllExamples, getExample } from './examples.mjs';

class PlaygroundUnified {
  constructor() {
    this.currentMode = 'gallery';
    this.examples = getAllExamples();
    this.currentExample = null;
    this.editorInitialized = false;
  }

  async init() {
    console.log('[Playground] Initializing unified playground...');

    // Wait for components to be defined
    await this.waitForComponents();

    // Setup mode switching
    this.setupModeSwitching();

    // Setup bus monitor
    this.setupBusMonitor();

    // Initialize each mode
    this.initGalleryMode();
    this.initBuilderMode();
    this.initEditorMode();

    console.log('[Playground] Initialization complete');
  }

  async waitForComponents() {
    const components = ['pg-canvas', 'pg-palette', 'pg-properties', 'pg-exporter', 'pg-bus-monitor'];

    for (const comp of components) {
      try {
        await customElements.whenDefined(comp);
        console.log(`[Playground] ${comp} defined`);
      } catch (err) {
        console.warn(`[Playground] Failed to wait for ${comp}:`, err);
      }
    }
  }

  setupModeSwitching() {
    const modeTabs = document.querySelectorAll('.mode-tab');
    const modes = document.querySelectorAll('.pg-mode');

    modeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode;
        this.switchMode(mode);
      });
    });
  }

  switchMode(mode) {
    console.log(`[Playground] Switching to ${mode} mode`);

    this.currentMode = mode;

    // Update tabs
    document.querySelectorAll('.mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // Update mode panels
    document.querySelectorAll('.pg-mode').forEach(panel => {
      panel.classList.toggle('active', panel.id === `${mode}-mode`);
    });

    // Mode-specific logic
    if (mode === 'editor') {
      // Initialize editor content on first switch
      if (!this.editorInitialized) {
        if (this.currentExample) {
          this.loadExampleInEditor(this.currentExample);
        } else {
          this.loadDefaultEditorTemplate();
        }
        this.editorInitialized = true;
      }
      // Note: If already initialized, the gallery button handler will call loadExampleInEditor if needed
    }
  }

  setupBusMonitor() {
    const toggleBtn = document.getElementById('toggle-bus-monitor');
    const overlay = document.getElementById('bus-monitor-overlay');
    const closeBtn = document.getElementById('close-monitor');

    toggleBtn?.addEventListener('click', () => {
      overlay?.removeAttribute('hidden');
    });

    closeBtn?.addEventListener('click', () => {
      overlay?.setAttribute('hidden', '');
    });

    // Close on overlay click
    overlay?.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.setAttribute('hidden', '');
      }
    });
  }

  // ==================== GALLERY MODE ====================

  initGalleryMode() {
    console.log('[Gallery] Initializing gallery mode...');

    this.renderGallery();

    // Setup search and filter
    const searchInput = document.getElementById('gallery-search');
    const filterSelect = document.getElementById('gallery-filter');

    searchInput?.addEventListener('input', () => this.filterGallery());
    filterSelect?.addEventListener('change', () => this.filterGallery());
  }

  renderGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    grid.innerHTML = this.examples.map(example => this.createExampleCard(example)).join('');

    // Attach event listeners to cards
    this.attachGalleryListeners();
  }

  createExampleCard(example) {
    const componentNames = example.components.map(c => c.name).join(', ');

    return `
      <div class="example-card" data-example-id="${example.id}">
        <div class="example-preview">
          <div class="example-preview-content">
            ${this.generateExamplePreviewHTML(example)}
          </div>
        </div>

        <div class="example-info">
          <h3 class="example-title">${example.name}</h3>
          <p class="example-description">${example.description}</p>
          <div class="example-components">
            <span class="components-label">Components:</span>
            <code class="components-list">${componentNames}</code>
          </div>
        </div>

        <div class="example-actions">
          <button class="btn-example-action btn-primary" data-action="builder" data-example="${example.id}">
            🔨 Open in Builder
          </button>
          <button class="btn-example-action btn-secondary" data-action="editor" data-example="${example.id}">
            💻 Open in Editor
          </button>
          <button class="btn-example-action btn-secondary" data-action="preview" data-example="${example.id}">
            👁 Preview
          </button>
        </div>
      </div>
    `;
  }

  generateExamplePreviewHTML(example) {
    // Generate a miniature preview of the components
    return example.components.map(comp => {
      const attrs = Object.entries(comp.attributes || {})
        .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
        .join(' ');

      return `<${comp.name} ${attrs}>${comp.innerHTML || ''}</${comp.name}>`;
    }).join('');
  }

  attachGalleryListeners() {
    document.querySelectorAll('.btn-example-action').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        const exampleId = e.target.dataset.example;
        const example = getExample(exampleId);

        if (!example) return;

        this.currentExample = example;

        switch (action) {
          case 'builder':
            this.switchMode('builder');
            this.loadExampleInBuilder(example);
            break;

          case 'editor':
            this.switchMode('editor');
            this.loadExampleInEditor(example);
            break;

          case 'preview':
            this.openExamplePreview(example);
            break;
        }
      });
    });
  }

  filterGallery() {
    const searchTerm = document.getElementById('gallery-search')?.value.toLowerCase() || '';
    const category = document.getElementById('gallery-filter')?.value || '';

    document.querySelectorAll('.example-card').forEach(card => {
      const exampleId = card.dataset.exampleId;
      const example = getExample(exampleId);
      if (!example) return;

      const matchesSearch = example.name.toLowerCase().includes(searchTerm) ||
                           example.description.toLowerCase().includes(searchTerm);

      const matchesCategory = !category || example.category === category;

      card.style.display = (matchesSearch && matchesCategory) ? 'block' : 'none';
    });
  }

  openExamplePreview(example) {
    // Open in new window for fullscreen preview
    const html = this.generateExampleHTML(example);
    const previewWindow = window.open('', '_blank', 'width=1200,height=800');

    previewWindow.document.write(html);
    previewWindow.document.close();
  }

  // ==================== BUILDER MODE ====================

  initBuilderMode() {
    console.log('[Builder] Initializing builder mode...');

    // The existing pg-canvas, pg-palette, and pg-properties components handle most of this
    // We just need to ensure they communicate properly

    // Listen for canvas changes to update code export
    document.addEventListener('canvas-changed', () => {
      this.updateBuilderCodeExport();
    });
  }

  async loadExampleInBuilder(example) {
    console.log('[Builder] Loading example:', example.name);

    const canvas = document.querySelector('pg-canvas');
    if (!canvas) {
      console.error('[Builder] Canvas not found');
      return;
    }

    // Clear canvas first
    if (canvas.clearAll) {
      canvas.clearAll();
    }

    // Load each component
    for (const comp of example.components) {
      await canvas.addComponent({
        name: comp.name,
        displayName: this.getDisplayName(comp.name),
        description: `Loaded from ${example.name}`,
        icon: '📦',
        attributes: Object.entries(comp.attributes || {}).map(([name, defaultValue]) => ({
          name,
          type: this.inferAttributeType(defaultValue),
          default: defaultValue,
          description: ''
        })),
        innerHTML: comp.innerHTML
      });
    }
  }

  getDisplayName(componentName) {
    return componentName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  inferAttributeType(value) {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') return 'number';
    if (typeof value === 'object') return 'json';
    return 'string';
  }

  updateBuilderCodeExport() {
    const exporter = document.querySelector('pg-exporter');
    if (exporter && exporter.refresh) {
      exporter.refresh();
    }
  }

  // ==================== EDITOR MODE ====================

  initEditorMode() {
    console.log('[Editor] Initializing editor mode...');

    // Setup editor controls
    const runBtn = document.getElementById('run-code');
    const clearBtn = document.getElementById('clear-code');
    const formatBtn = document.getElementById('format-code');
    const exportBtn = document.getElementById('export-code');
    const refreshBtn = document.getElementById('refresh-preview');
    const fullscreenBtn = document.getElementById('fullscreen-preview');

    runBtn?.addEventListener('click', () => this.runEditorCode());
    clearBtn?.addEventListener('click', () => this.clearEditor());
    formatBtn?.addEventListener('click', () => this.formatEditorCode());
    exportBtn?.addEventListener('click', () => this.exportEditorCode());
    refreshBtn?.addEventListener('click', () => this.runEditorCode());
    fullscreenBtn?.addEventListener('click', () => this.toggleFullscreenPreview());

    // Setup tab switching
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const tabName = e.target.dataset.tab;
        this.switchEditorTab(tabName);
      });
    });

    // Auto-run on change (debounced)
    let debounceTimer;
    ['html-editor', 'css-editor', 'js-editor'].forEach(id => {
      const editor = document.getElementById(id);
      editor?.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => this.runEditorCode(), 1000);
      });
    });

    // Note: Default template is now loaded when user first switches to editor mode
  }

  switchEditorTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.editor-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.tab === tabName);
    });

    // Update editor areas
    document.querySelectorAll('.editor-area').forEach(area => {
      area.classList.toggle('active', area.dataset.editor === tabName);
    });
  }

  loadDefaultEditorTemplate() {
    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');

    if (htmlEditor) {
      htmlEditor.value = `<!-- LARC Component Demo -->
<div class="demo-container">
  <h2>Hello from LARC!</h2>

  <pan-card header="Welcome Card">
    <p>Try editing the HTML, CSS, or JavaScript to see live updates.</p>
    <button id="demo-btn">Click me!</button>
  </pan-card>
</div>`;
    }

    if (cssEditor) {
      cssEditor.value = `.demo-container {
  padding: 2rem;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #2563eb;
  margin-bottom: 1rem;
}

#demo-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: transform 0.2s;
}

#demo-btn:hover {
  transform: translateY(-2px);
}`;
    }

    if (jsEditor) {
      jsEditor.value = `// Add interactivity with PAN bus
document.getElementById('demo-btn')?.addEventListener('click', () => {
  alert('Button clicked! Try publishing to the PAN bus.');

  // Example: Publish to PAN bus
  document.dispatchEvent(new CustomEvent('pan:publish', {
    detail: {
      topic: 'button.clicked',
      data: { timestamp: Date.now() }
    }
  }));
});

console.log('Editor ready! 🚀');`;
    }

    this.runEditorCode();
  }

  loadExampleInEditor(example) {
    console.log('[Editor] Loading example:', example.name);

    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');

    if (htmlEditor) {
      htmlEditor.value = this.generateExampleHTML(example, false);
    }

    if (cssEditor) {
      cssEditor.value = this.generateExampleCSS(example);
    }

    this.runEditorCode();
  }

  generateExampleHTML(example, standalone = true) {
    const componentsHTML = example.components.map(comp => {
      const attrs = Object.entries(comp.attributes || {})
        .map(([key, val]) => `${key}="${this.escapeHtml(String(val))}"`)
        .join(' ');

      return `  <${comp.name} ${attrs}>${comp.innerHTML || ''}</${comp.name}>`;
    }).join('\n');

    if (!standalone) {
      return `<!-- ${example.name} -->\n<div class="example-container">\n${componentsHTML}\n</div>`;
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${example.name} - LARC Example</title>
  <script type="module">
    window.panAutoload = {
      paths: ['https://unpkg.com/@larcjs/ui@3.0.1/']
    };
  </script>
  <script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/pan.mjs"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      padding: 2rem;
      background: #f5f5f5;
    }
    .example-container {
      max-width: 1200px;
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="example-container">
${componentsHTML}
  </div>
  <pan-bus debug="true"></pan-bus>
</body>
</html>`;
  }

  generateExampleCSS(example) {
    return `.example-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Add your custom styles here */`;
  }

  runEditorCode() {
    console.log('[Editor] Running code...');

    const htmlEditor = document.getElementById('html-editor');
    const cssEditor = document.getElementById('css-editor');
    const jsEditor = document.getElementById('js-editor');
    const preview = document.getElementById('preview-frame');

    if (!preview) {
      console.error('[Editor] Preview frame not found!');
      return;
    }

    const html = htmlEditor?.value || '';
    const css = cssEditor?.value || '';
    const js = jsEditor?.value || '';

    console.log('[Editor] HTML length:', html.length);
    console.log('[Editor] CSS length:', css.length);
    console.log('[Editor] JS length:', js.length);

    const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script type="module">
    window.panAutoload = {
      paths: ['https://unpkg.com/@larcjs/ui@3.0.1/', '/packages/ui/']
    };
  </script>
  <script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/pan.mjs"></script>
  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    ${css}
  </style>
</head>
<body>
  ${html}
  <pan-bus debug="true"></pan-bus>
  <script type="module">
    ${js}
  </script>
</body>
</html>`;

    try {
      // Update preview iframe
      const previewDoc = preview.contentDocument || preview.contentWindow.document;
      previewDoc.open();
      previewDoc.write(fullHTML);
      previewDoc.close();
      console.log('[Editor] Preview updated successfully');
    } catch (err) {
      console.error('[Editor] Failed to update preview:', err);
    }
  }

  clearEditor() {
    if (confirm('Clear all code? This cannot be undone.')) {
      document.getElementById('html-editor').value = '';
      document.getElementById('css-editor').value = '';
      document.getElementById('js-editor').value = '';
      this.runEditorCode();
    }
  }

  formatEditorCode() {
    // Simple formatting - could be enhanced with a library
    const htmlEditor = document.getElementById('html-editor');
    if (htmlEditor) {
      try {
        // Basic indentation (simplified)
        htmlEditor.value = this.formatHTML(htmlEditor.value);
      } catch (err) {
        console.warn('Format failed:', err);
      }
    }
  }

  formatHTML(html) {
    // Very basic formatting
    return html
      .replace(/></g, '>\n<')
      .split('\n')
      .map(line => line.trim())
      .filter(line => line)
      .join('\n');
  }

  exportEditorCode() {
    const html = document.getElementById('html-editor')?.value || '';
    const css = document.getElementById('css-editor')?.value || '';
    const js = document.getElementById('js-editor')?.value || '';

    const fullHTML = this.generateStandaloneHTML(html, css, js);

    // Download as file
    const blob = new Blob([fullHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'larc-example.html';
    a.click();
    URL.revokeObjectURL(url);
  }

  generateStandaloneHTML(html, css, js) {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC Example</title>

  <!-- Configure LARC autoloader -->
  <script type="module">
    window.panAutoload = {
      paths: ['https://unpkg.com/@larcjs/ui@3.0.1/']
    };
  </script>

  <!-- Load LARC core -->
  <script type="module" src="https://unpkg.com/@larcjs/core@3.0.1/pan.mjs"></script>

  <style>
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    }

    ${css}
  </style>
</head>
<body>
  ${html}

  <pan-bus debug="true"></pan-bus>

  <script type="module">
    ${js}
  </script>
</body>
</html>`;
  }

  toggleFullscreenPreview() {
    const preview = document.getElementById('preview-frame');
    if (!preview) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      preview.requestFullscreen();
    }
  }

  // ==================== UTILITIES ====================

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    window.playground = new PlaygroundUnified();
    await window.playground.init();
  });
} else {
  window.playground = new PlaygroundUnified();
  window.playground.init();
}
