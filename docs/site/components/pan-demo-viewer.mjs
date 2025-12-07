/**
 * <pan-demo-viewer>
 * Viewer component for displaying demo pages in an iframe
 *
 * Attributes:
 * - mode: "iframe" (default)
 * - base: base path for demo URLs
 */

import { PanClient } from '../../core/src/components/pan-client.mjs';

class PanDemoViewer extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(document, 'pan-bus');
    this._currentDemo = null;
    this._mode = 'iframe';
    this._base = '.';
  }

  connectedCallback() {
    this._mode = this.getAttribute('mode') || 'iframe';
    this._base = this.getAttribute('base') || '.';

    this.render();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.client.subscribe('demo.selected', (msg) => {
      this._currentDemo = msg.data;
      this.loadDemo();
    });
  }

  loadDemo() {
    if (!this._currentDemo || !this._currentDemo.href) {
      return;
    }

    const url = this._base === '.'
      ? this._currentDemo.href
      : `${this._base}/${this._currentDemo.href}`;

    if (this._mode === 'iframe') {
      const iframe = this.querySelector('iframe');
      if (iframe) {
        iframe.src = url;
      }
    }
  }

  render() {
    if (this._mode === 'iframe') {
      this.innerHTML = `
        <iframe
          src="about:blank"
          frameborder="0"
          style="width: 100%; height: 100%; border: none;"
          sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
        ></iframe>
      `;
    }
  }
}

customElements.define('pan-demo-viewer', PanDemoViewer);
