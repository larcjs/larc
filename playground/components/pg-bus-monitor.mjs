/**
 * PAN Bus Monitor
 * 
 * Visualize PAN messages flowing between components
 */

class PgBusMonitor extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
    this.maxMessages = 100;
  }

  connectedCallback() {
    this.innerHTML = `
      <div class="bus-monitor">
        <div class="bus-monitor-header">
          <h3>PAN Bus Monitor</h3>
          <button class="btn-clear-logs">Clear Logs</button>
        </div>
        <div class="bus-messages" id="messages-container">
          <p style="text-align: center; color: #999; padding: 2rem;">
            No messages yet. Interact with components to see PAN messages.
          </p>
        </div>
      </div>
    `;

    this.setupListeners();
    this.startMonitoring();
  }

  disconnectedCallback() {
    this.stopMonitoring();
  }

  setupListeners() {
    this.querySelector('.btn-clear-logs').addEventListener('click', () => {
      this.clearLogs();
    });
  }

  startMonitoring() {
    console.log('[pg-bus-monitor] Starting monitoring...');

    // Listen to pan:publish events to catch all published messages
    this.publishHandler = (event) => {
      console.log('[pg-bus-monitor] pan:publish event received:', event.detail);
      if (event.detail && event.detail.topic) {
        this.logMessage({
          topic: event.detail.topic,
          data: event.detail.data,
          type: 'publish'
        });
      }
    };

    // Listen to pan:deliver events to catch all delivered messages
    this.deliverHandler = (event) => {
      console.log('[pg-bus-monitor] pan:deliver event received:', event.detail);
      if (event.detail && event.detail.topic) {
        this.logMessage({
          topic: event.detail.topic,
          data: event.detail.data,
          type: 'deliver'
        });
      }
    };

    document.addEventListener('pan:publish', this.publishHandler, true);
    document.addEventListener('pan:deliver', this.deliverHandler, true);

    console.log('[pg-bus-monitor] Event listeners attached');
  }

  stopMonitoring() {
    if (this.publishHandler) {
      document.removeEventListener('pan:publish', this.publishHandler, true);
    }
    if (this.deliverHandler) {
      document.removeEventListener('pan:deliver', this.deliverHandler, true);
    }
  }

  logMessage(message) {
    const timestamp = new Date().toLocaleTimeString();
    
    this.messages.unshift({
      ...message,
      timestamp
    });

    // Limit message history
    if (this.messages.length > this.maxMessages) {
      this.messages = this.messages.slice(0, this.maxMessages);
    }

    this.render();
  }

  render() {
    const container = this.querySelector('#messages-container');

    if (this.messages.length === 0) {
      container.innerHTML = `
        <p style="text-align: center; color: #999; padding: 2rem;">
          No messages yet. Interact with components to see PAN messages.
        </p>
      `;
      return;
    }

    container.innerHTML = this.messages.map(msg => {
      const typeIcon = msg.type === 'publish' ? '📤' : '📥';
      const typeClass = msg.type === 'publish' ? 'publish' : 'deliver';
      return `
        <div class="bus-message bus-message-${typeClass}">
          <div class="bus-message-header">
            <span class="bus-message-type">${typeIcon} ${msg.type || 'message'}</span>
            <span class="bus-message-time">${msg.timestamp}</span>
          </div>
          <div class="bus-message-topic">${this.escapeHtml(msg.topic || 'unknown')}</div>
          <div class="bus-message-data">${this.formatData(msg.data)}</div>
        </div>
      `;
    }).join('');
  }

  formatData(data) {
    if (data === undefined || data === null) {
      return '<em>no data</em>';
    }
    
    try {
      if (typeof data === 'object') {
        return this.escapeHtml(JSON.stringify(data, null, 2));
      }
      return this.escapeHtml(String(data));
    } catch (err) {
      return '<em>unable to serialize data</em>';
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  clearLogs() {
    this.messages = [];
    this.render();
  }
}

customElements.define('pg-bus-monitor', PgBusMonitor);
