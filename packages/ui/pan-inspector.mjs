// Enhanced PAN Inspector with state tree, filtering, and performance metrics

import { PanClient } from '../core/pan-client.mjs';

class PanInspector extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pc = new PanClient(this);
    this.events = []; // { ts, topic, msg, size, duration }
    this.retainedMessages = new Map(); // topic -> latest retained message
    this.subscriptions = new Map(); // topic -> subscriber count
    this.paused = false;
    this.filter = '';
    this.viewMode = 'messages'; // 'messages' | 'state' | 'metrics'
    this.messageTypeFilter = 'all'; // 'all' | 'retained' | 'transient'
    this.stats = {
      totalMessages: 0,
      messagesByTopic: new Map(),
      averageSize: 0,
      totalSize: 0
    };
  }

  // Escape HTML special characters to prevent XSS
  escapeHTML(text) {
    if (!text || typeof text !== 'string') return '';
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  connectedCallback() {
    this.render();

    // Subscribe to all messages
    this.off = this.pc.subscribe('*', (m) => {
      const startTime = performance.now();

      if (!this.paused) {
        const rec = {
          ts: Date.now(),
          topic: m.topic,
          msg: m,
          size: JSON.stringify(m).length,
          retained: m.retained || false,
          duration: 0
        };

        this.events.push(rec);
        if (this.events.length > 1000) this.events.shift();

        // Track retained messages for state tree
        if (m.retained) {
          this.retainedMessages.set(m.topic, rec);
        }

        // Update statistics
        this.stats.totalMessages++;
        const topicCount = this.stats.messagesByTopic.get(m.topic) || 0;
        this.stats.messagesByTopic.set(m.topic, topicCount + 1);
        this.stats.totalSize += rec.size;
        this.stats.averageSize = this.stats.totalSize / this.stats.totalMessages;

        rec.duration = performance.now() - startTime;

        if (this.viewMode === 'messages') {
          this.renderRows();
        } else if (this.viewMode === 'state') {
          this.renderStateTree();
        } else if (this.viewMode === 'metrics') {
          this.renderMetrics();
        }
      }
    });

    // Track subscriptions (approximate)
    this._trackSubscriptions();

    // Event listeners
    this.shadowRoot.addEventListener('input', (e) => {
      const t = e.target;
      if (t && t.id === 'filter') {
        this.filter = t.value;
        this._updateView();
      }
      if (t && t.id === 'messageTypeFilter') {
        this.messageTypeFilter = t.value;
        this._updateView();
      }
    });

    this.shadowRoot.addEventListener('click', (e) => {
      const el = e.target;

      if (el && el.id === 'pause') {
        this.paused = !this.paused;
        this.renderControls();
      }

      if (el && el.id === 'clear') {
        this.events = [];
        this.stats = {
          totalMessages: 0,
          messagesByTopic: new Map(),
          averageSize: 0,
          totalSize: 0
        };
        this._updateView();
      }

      if (el && el.id === 'clearState') {
        this.retainedMessages.clear();
        this.renderStateTree();
      }

      if (el && el.id === 'export') {
        this._exportState();
      }

      if (el && el.id === 'import') {
        this._importState();
      }

      if (el && el.classList && el.classList.contains('replay')) {
        const i = Number(el.getAttribute('data-i'));
        const rec = this.events[i];
        if (rec) this.pc.publish(rec.topic, rec.msg.data, { retain: rec.retained });
      }

      if (el && el.classList && el.classList.contains('inspect-msg')) {
        const i = Number(el.getAttribute('data-i'));
        const rec = this.events[i];
        if (rec) this._showMessageDetails(rec);
      }

      if (el && el.classList && el.classList.contains('inspect-state')) {
        const topic = el.getAttribute('data-topic');
        const rec = this.retainedMessages.get(topic);
        if (rec) this._showMessageDetails(rec);
      }

      if (el && el.classList && el.classList.contains('tab-btn')) {
        const mode = el.getAttribute('data-mode');
        this.viewMode = mode;
        this._updateView();
      }

      if (el && el.id === 'closeDetails') {
        this._hideMessageDetails();
      }

      // State tree expand/collapse
      if (el && el.classList && el.classList.contains('tree-toggle')) {
        const row = el.closest('tr');
        if (row) {
          row.classList.toggle('expanded');
          this.renderStateTree();
        }
      }
    });
  }

  disconnectedCallback() {
    this.off && this.off();
  }

  _trackSubscriptions() {
    // This is approximate - we track based on message patterns
    // In a real implementation, we'd need pan-bus to expose subscription info
    setInterval(() => {
      // Update subscription counts based on message activity
      const recentTopics = new Set(
        this.events
          .slice(-100)
          .map(e => e.topic)
      );

      for (const topic of recentTopics) {
        if (!this.subscriptions.has(topic)) {
          this.subscriptions.set(topic, 1);
        }
      }
    }, 5000);
  }

  _updateView() {
    this.render();
  }

  render() {
    const h = String.raw;
    this.shadowRoot.innerHTML = h`
      <style>
        :host{display:block; font:12px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; height: 100%; display: flex; flex-direction: column; color: var(--color-text, #1e293b);}
        header{display:flex; gap:8px; align-items:center; padding: 8px; background: var(--color-surface-alt, #f8f8f8); border-bottom: 1px solid var(--color-border, #ddd);}
        .tabs {display: flex; gap: 4px; margin-right: auto;}
        .tab-btn {padding: 6px 12px; border: none; background: transparent; cursor: pointer; border-bottom: 2px solid transparent; color: var(--color-text, inherit);}
        .tab-btn.active {border-bottom-color: var(--color-accent, #007bff); font-weight: 600;}
        input[type=text], select{padding:4px 6px; border: 1px solid var(--color-border, #ddd); border-radius: 3px; background: var(--color-surface, white); color: var(--color-text, inherit);}
        input[type=text] {min-width: 200px;}
        button{padding:4px 8px; border: 1px solid var(--color-border, #ddd); background: var(--color-surface, white); color: var(--color-text, inherit); cursor: pointer; border-radius: 3px;}
        button:hover {background: var(--color-surface-alt, #f0f0f0);}
        .content {flex: 1; overflow: auto; padding: 8px; background: var(--color-bg, white);}
        table{width:100%; border-collapse: collapse;}
        th,td{ padding:6px 8px; border-bottom:1px solid var(--color-border, #eee); text-align:left; font-size: 11px; }
        th{ position:sticky; top:0; background: var(--color-surface-alt, #f8f8f8); font-weight: 600; z-index: 1; }
        .muted{ color: var(--color-muted, #888) }
        .retained { background: var(--color-warning-light, #fffbf0); }
        .action-btn {padding: 2px 6px; font-size: 10px; margin-left: 4px;}
        .state-tree {font-family: ui-monospace, monospace;}
        .tree-node {padding: 4px 0;}
        .tree-topic {font-weight: 600; color: var(--color-accent, #0066cc); cursor: pointer;}
        .tree-topic:hover {text-decoration: underline;}
        .tree-data {margin-left: 20px; color: var(--color-muted, #666);}
        .tree-toggle {cursor: pointer; user-select: none; display: inline-block; width: 12px;}
        tr.expanded .tree-data {display: table-row;}
        tr:not(.expanded) .tree-data {display: none;}
        .metrics-grid {display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;}
        .metric-card {background: var(--color-surface, white); border: 1px solid var(--color-border, #ddd); border-radius: 4px; padding: 12px;}
        .metric-value {font-size: 24px; font-weight: 600; color: var(--color-accent, #007bff);}
        .metric-label {font-size: 11px; color: var(--color-muted, #666); text-transform: uppercase; margin-top: 4px;}
        .metric-list {margin-top: 8px; max-height: 200px; overflow: auto;}
        .metric-list-item {display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid var(--color-border, #f0f0f0);}
        #detailsModal {position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                       background: var(--color-surface, white); border: 1px solid var(--color-border, #ddd); border-radius: 4px;
                       padding: 16px; max-width: 600px; max-height: 80vh; overflow: auto;
                       box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; display: none;}
        #detailsModal.show {display: block;}
        #detailsOverlay {position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                         background: rgba(0,0,0,0.3); z-index: 999; display: none;}
        #detailsOverlay.show {display: block;}
        .details-header {display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;}
        .details-title {font-weight: 600; font-size: 14px;}
        pre {background: var(--color-code-bg, #f5f5f5); color: var(--color-text, inherit); padding: 8px; border-radius: 3px; overflow: auto; max-height: 400px;}
      </style>
      <header>
        <div class="tabs">
          <button class="tab-btn ${this.viewMode === 'messages' ? 'active' : ''}" data-mode="messages">Messages</button>
          <button class="tab-btn ${this.viewMode === 'state' ? 'active' : ''}" data-mode="state">State Tree</button>
          <button class="tab-btn ${this.viewMode === 'metrics' ? 'active' : ''}" data-mode="metrics">Metrics</button>
        </div>
        ${this.viewMode === 'messages' ? h`
          <input id="filter" type="text" placeholder="Filter by topic…" value="${this.filter}" />
          <select id="messageTypeFilter">
            <option value="all" ${this.messageTypeFilter === 'all' ? 'selected' : ''}>All</option>
            <option value="retained" ${this.messageTypeFilter === 'retained' ? 'selected' : ''}>Retained</option>
            <option value="transient" ${this.messageTypeFilter === 'transient' ? 'selected' : ''}>Transient</option>
          </select>
        ` : ''}
        ${this.viewMode === 'state' ? h`
          <input id="filter" type="text" placeholder="Filter topics…" value="${this.filter}" />
          <button id="export">Export</button>
          <button id="import">Import</button>
          <button id="clearState">Clear</button>
        ` : ''}
        <button id="pause">${this.paused ? 'Resume' : 'Pause'}</button>
        <button id="clear">Clear</button>
      </header>
      <div class="content" id="content"></div>
      <div id="detailsOverlay"></div>
      <div id="detailsModal">
        <div class="details-header">
          <div class="details-title">Message Details</div>
          <button id="closeDetails">Close</button>
        </div>
        <div id="detailsContent"></div>
      </div>
    `;

    if (this.viewMode === 'messages') {
      this.renderRows();
    } else if (this.viewMode === 'state') {
      this.renderStateTree();
    } else if (this.viewMode === 'metrics') {
      this.renderMetrics();
    }
  }

  renderControls() {
    const btn = this.shadowRoot.getElementById('pause');
    if (btn) btn.textContent = this.paused ? 'Resume' : 'Pause';
  }

  renderRows() {
    const content = this.shadowRoot.getElementById('content');
    if (!content) return;

    const f = (this.filter || '').toLowerCase();
    let visible = this.events.filter((r) => !f || r.topic.toLowerCase().includes(f));

    // Apply message type filter
    if (this.messageTypeFilter === 'retained') {
      visible = visible.filter(r => r.retained);
    } else if (this.messageTypeFilter === 'transient') {
      visible = visible.filter(r => !r.retained);
    }

    content.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Topic</th>
            <th>Type</th>
            <th>Size</th>
            <th>Duration</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${visible.slice(-500).map((r, i) => `
            <tr class="${r.retained ? 'retained' : ''}">
              <td class="muted">${new Date(r.ts).toLocaleTimeString()}</td>
              <td>${this.escapeHTML(r.topic)}</td>
              <td class="muted">${r.retained ? 'Retained' : 'Transient'}</td>
              <td class="muted">${this._formatBytes(r.size)}</td>
              <td class="muted">${r.duration ? r.duration.toFixed(2) + 'ms' : '-'}</td>
              <td>
                <button class="action-btn replay" data-i="${i}">Replay</button>
                <button class="action-btn inspect-msg" data-i="${i}">Inspect</button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderStateTree() {
    const content = this.shadowRoot.getElementById('content');
    if (!content) return;

    const f = (this.filter || '').toLowerCase();
    const filtered = Array.from(this.retainedMessages.entries())
      .filter(([topic]) => !f || topic.toLowerCase().includes(f))
      .sort(([a], [b]) => a.localeCompare(b));

    if (filtered.length === 0) {
      content.innerHTML = '<div style="padding: 20px; text-align: center; color: #999;">No retained state available</div>';
      return;
    }

    content.innerHTML = `
      <table class="state-tree">
        <thead>
          <tr>
            <th>Topic</th>
            <th>Size</th>
            <th>Last Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map(([topic, rec]) => `
            <tr class="tree-node">
              <td>
                <span class="tree-toggle">▶</span>
                <span class="tree-topic">${topic}</span>
              </td>
              <td class="muted">${this._formatBytes(rec.size)}</td>
              <td class="muted">${new Date(rec.ts).toLocaleTimeString()}</td>
              <td>
                <button class="action-btn inspect-state" data-topic="${topic}">Inspect</button>
              </td>
            </tr>
            <tr class="tree-data">
              <td colspan="4">
                <pre>${JSON.stringify(rec.msg.data, null, 2)}</pre>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Add click handlers for tree toggles
    content.querySelectorAll('.tree-toggle, .tree-topic').forEach(el => {
      el.addEventListener('click', (e) => {
        const row = e.target.closest('tr');
        if (row) {
          row.classList.toggle('expanded');
          const toggle = row.querySelector('.tree-toggle');
          if (toggle) {
            toggle.textContent = row.classList.contains('expanded') ? '▼' : '▶';
          }
        }
      });
    });
  }

  renderMetrics() {
    const content = this.shadowRoot.getElementById('content');
    if (!content) return;

    const topTopics = Array.from(this.stats.messagesByTopic.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const avgMessageRate = this.stats.totalMessages / ((Date.now() - (this.events[0]?.ts || Date.now())) / 1000);

    content.innerHTML = `
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${this.stats.totalMessages}</div>
          <div class="metric-label">Total Messages</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.retainedMessages.size}</div>
          <div class="metric-label">Retained Messages</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this._formatBytes(this.stats.averageSize)}</div>
          <div class="metric-label">Avg Message Size</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${avgMessageRate.toFixed(1)}/s</div>
          <div class="metric-label">Message Rate</div>
        </div>
        <div class="metric-card">
          <div class="metric-label" style="margin-bottom: 8px;">Top Topics by Volume</div>
          <div class="metric-list">
            ${topTopics.map(([topic, count]) => `
              <div class="metric-list-item">
                <span>${topic}</span>
                <span>${count}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${this.stats.messagesByTopic.size}</div>
          <div class="metric-label">Unique Topics</div>
        </div>
      </div>
    `;
  }

  _showMessageDetails(rec) {
    const modal = this.shadowRoot.getElementById('detailsModal');
    const overlay = this.shadowRoot.getElementById('detailsOverlay');
    const detailsContent = this.shadowRoot.getElementById('detailsContent');

    if (!modal || !overlay || !detailsContent) return;

    detailsContent.innerHTML = `
      <div style="margin-bottom: 12px;">
        <strong>Topic:</strong> ${this.escapeHTML(rec.topic)}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Timestamp:</strong> ${new Date(rec.ts).toLocaleString()}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Size:</strong> ${this._formatBytes(rec.size)}
      </div>
      <div style="margin-bottom: 12px;">
        <strong>Type:</strong> ${rec.retained ? 'Retained' : 'Transient'}
      </div>
      ${rec.duration ? `<div style="margin-bottom: 12px;"><strong>Duration:</strong> ${rec.duration.toFixed(2)}ms</div>` : ''}
      <div style="margin-bottom: 8px;">
        <strong>Data:</strong>
      </div>
      <pre>${JSON.stringify(rec.msg.data, null, 2)}</pre>
      ${rec.msg.meta ? `
        <div style="margin-top: 12px; margin-bottom: 8px;">
          <strong>Metadata:</strong>
        </div>
        <pre>${JSON.stringify(rec.msg.meta, null, 2)}</pre>
      ` : ''}
    `;

    modal.classList.add('show');
    overlay.classList.add('show');

    // Close on overlay click
    overlay.onclick = () => this._hideMessageDetails();
  }

  _hideMessageDetails() {
    const modal = this.shadowRoot.getElementById('detailsModal');
    const overlay = this.shadowRoot.getElementById('detailsOverlay');

    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
  }

  _exportState() {
    const state = {};
    for (const [topic, rec] of this.retainedMessages.entries()) {
      state[topic] = rec.msg.data;
    }

    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pan-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  _importState() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const state = JSON.parse(event.target.result);

          // Publish all state to PAN
          for (const [topic, data] of Object.entries(state)) {
            this.pc.publish(topic, data, { retain: true });
          }

          alert(`Imported ${Object.keys(state).length} state entries`);
        } catch (error) {
          alert('Failed to import state: ' + error.message);
        }
      };

      reader.readAsText(file);
    };

    input.click();
  }

  _formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
}

customElements.define('pan-inspector', PanInspector);
export { PanInspector };
export default PanInspector;
