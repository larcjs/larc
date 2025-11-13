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
    // Hook into the PAN bus to intercept messages
    const bus = document.querySelector('pan-bus');
    if (!bus) {
      console.warn('PAN bus not found');
      return;
    }

    // Listen to all PAN messages by subscribing to wildcard
    this.originalDispatchEvent = bus.dispatchEvent.bind(bus);
    bus.dispatchEvent = (event) => {
      // Capture message events
      if (event.type === 'pan-message') {
        this.logMessage(event.detail);
      }
      return this.originalDispatchEvent(event);
    };
  }

  stopMonitoring() {
    const bus = document.querySelector('pan-bus');
    if (bus && this.originalDispatchEvent) {
      bus.dispatchEvent = this.originalDispatchEvent;
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

    container.innerHTML = this.messages.map(msg => `
      <div class="bus-message">
        <div class="bus-message-topic">${this.escapeHtml(msg.topic || 'unknown')}</div>
        <div class="bus-message-data">${this.formatData(msg.data)}</div>
        <div class="bus-message-time">${msg.timestamp}</div>
      </div>
    `).join('');
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
