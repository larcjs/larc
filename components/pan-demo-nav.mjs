/**
 * <pan-demo-nav>
 * Navigation component for demo browser
 * Renders a list of demos from JSON configuration
 *
 * Attributes:
 * - sync-url: "hash" to sync with URL hash
 */

import { PanClient } from '../../core/src/components/pan-client.mjs';

class PanDemoNav extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(document, 'pan-bus');
    this._demos = [];
    this._selectedId = null;
  }

  connectedCallback() {
    this.parseConfig();
    this.render();
    this.attachListeners();

    // Handle initial hash
    if (this.getAttribute('sync-url') === 'hash') {
      this.syncFromHash();
      window.addEventListener('hashchange', () => this.syncFromHash());
    }
  }

  parseConfig() {
    const script = this.querySelector('script[type="application/json"]');
    if (script) {
      try {
        this._demos = JSON.parse(script.textContent);
      } catch (e) {
        console.error('Failed to parse demo config:', e);
      }
    }
  }

  syncFromHash() {
    const hash = window.location.hash.substring(1);
    if (hash) {
      const demo = this._demos.find(d => d.id === hash);
      if (demo) {
        this.selectDemo(demo);
      }
    } else if (this._demos.length > 0) {
      this.selectDemo(this._demos[0]);
    }
  }

  selectDemo(demo) {
    this._selectedId = demo.id;
    this.render();

    // Update hash
    if (this.getAttribute('sync-url') === 'hash') {
      window.location.hash = demo.id;
    }

    // Publish to PAN
    this.client.publish('demo.selected', demo);
  }

  attachListeners() {
    this.addEventListener('click', (e) => {
      const item = e.target.closest('[data-demo-id]');
      if (item) {
        const demoId = item.dataset.demoId;
        const demo = this._demos.find(d => d.id === demoId);
        if (demo) {
          this.selectDemo(demo);
        }
      }
    });
  }

  render() {
    const navHtml = this._demos.map(demo => `
      <div
        class="nav-item ${demo.id === this._selectedId ? 'active' : ''}"
        data-demo-id="${demo.id}"
        title="${demo.title}"
      >
        ${demo.hint ? `<span class="hint">${demo.hint}</span>` : ''}
        <span class="title">${demo.title}</span>
      </div>
    `).join('');

    this.innerHTML = `<div class="nav-list">${navHtml}</div>`;
  }
}

customElements.define('pan-demo-nav', PanDemoNav);
