/**
 * pan-undo-redo - Time-travel debugging with undo/redo support
 *
 * Tracks state changes for specified topics and enables undo/redo operations.
 * Provides history management with configurable stack size.
 *
 * @example
 * <pan-undo-redo
 *   topics="editor.*,canvas.*"
 *   max-history="50"
 *   channel="history"
 *   debug>
 * </pan-undo-redo>
 *
 * Use:
 * panClient.publish('history.undo', null); // Undo last change
 * panClient.publish('history.redo', null); // Redo last undone change
 * panClient.publish('history.clear', null); // Clear history
 *
 * @attribute {string} topics - Comma-separated topic patterns to track
 * @attribute {number} max-history - Maximum history stack size (default: 50)
 * @attribute {string} channel - Channel name for control commands (default: 'history')
 * @attribute {boolean} auto-snapshot - Auto-snapshot on interval (default: false)
 * @attribute {number} snapshot-interval - Snapshot interval in ms (default: 5000)
 * @attribute {boolean} debug - Enable debug logging
 *
 * @topic {channel}.undo - Trigger undo
 * @topic {channel}.redo - Trigger redo
 * @topic {channel}.clear - Clear history
 * @topic {channel}.snapshot - Take manual snapshot
 * @topic {channel}.state - History state changes
 */

export class PanUndoRedo extends HTMLElement {
  static observedAttributes = ['topics', 'max-history', 'channel', 'auto-snapshot', 'snapshot-interval', 'debug'];

  constructor() {
    super();
    this._history = []; // Stack of state snapshots
    this._future = []; // Stack for redo
    this._currentState = new Map(); // topic -> current value
    this._subscriptions = new Map();
    this._controlSubs = [];
    this._panClient = null;
    this._autoSnapshotTimer = null;
    this._pendingChanges = new Map();
    this._batchTimer = null;
  }

  connectedCallback() {
    this._waitForPanBus().then(() => {
      this._initialize();
    });
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'topics' || name === 'channel') {
      this._cleanup();
      this._initialize();
    } else if (name === 'auto-snapshot') {
      if (this.hasAttribute('auto-snapshot')) {
        this._startAutoSnapshot();
      } else {
        this._stopAutoSnapshot();
      }
    }
  }

  async _waitForPanBus() {
    let panBus = document.querySelector('pan-bus');

    if (panBus && panBus.panClient) {
      return;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        panBus = document.querySelector('pan-bus');
        if (panBus && panBus.panClient) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  _initialize() {
    this._panClient = this._getPanClient();
    if (!this._panClient) {
      console.error('pan-undo-redo could not find pan-client');
      return;
    }

    // Subscribe to topics
    const topics = this.getAttribute('topics');
    if (topics) {
      const topicPatterns = topics.split(',').map(t => t.trim());
      for (const pattern of topicPatterns) {
        this._subscribeToTopic(pattern);
      }
    }

    // Subscribe to control commands
    const channel = this.getAttribute('channel') || 'history';

    this._controlSubs.push(
      this._panClient.subscribe(`${channel}.undo`, () => this.undo())
    );
    this._controlSubs.push(
      this._panClient.subscribe(`${channel}.redo`, () => this.redo())
    );
    this._controlSubs.push(
      this._panClient.subscribe(`${channel}.clear`, () => this.clear())
    );
    this._controlSubs.push(
      this._panClient.subscribe(`${channel}.snapshot`, () => this.snapshot())
    );

    // Start auto-snapshot if enabled
    if (this.hasAttribute('auto-snapshot')) {
      this._startAutoSnapshot();
    }

    this._log('Initialized', {
      channel,
      maxHistory: this.getAttribute('max-history')
    });

    this._publishState();
  }

  _cleanup() {
    // Unsubscribe from topics
    for (const [topic, handler] of this._subscriptions.entries()) {
      this._panClient?.unsubscribe(topic, handler);
    }
    this._subscriptions.clear();

    // Unsubscribe from control commands
    for (const unsub of this._controlSubs) {
      if (typeof unsub === 'function') unsub();
    }
    this._controlSubs = [];

    this._stopAutoSnapshot();

    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }
  }

  _subscribeToTopic(topicPattern) {
    if (this._subscriptions.has(topicPattern)) return;

    const handler = (message) => {
      // Skip if message came from undo/redo
      if (message.meta?.source === 'undo-redo') {
        return;
      }

      this._trackChange(message.topic, message.data);
    };

    this._panClient.subscribe(topicPattern, handler);
    this._subscriptions.set(topicPattern, handler);

    this._log('Subscribed to topic', { pattern: topicPattern });
  }

  _trackChange(topic, data) {
    // Update current state
    const oldValue = this._currentState.get(topic);
    this._currentState.set(topic, data);

    // Batch changes together (debounce)
    this._pendingChanges.set(topic, { oldValue, newValue: data });

    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
    }

    this._batchTimer = setTimeout(() => {
      this._commitBatch();
    }, 100); // 100ms batch window
  }

  _commitBatch() {
    if (this._pendingChanges.size === 0) return;

    // Create snapshot with all pending changes
    const snapshot = {
      timestamp: Date.now(),
      changes: new Map(this._pendingChanges)
    };

    // Clear future (can't redo after new changes)
    this._future = [];

    // Add to history
    this._history.push(snapshot);

    // Limit history size
    const maxHistory = parseInt(this.getAttribute('max-history') || '50', 10);
    if (this._history.length > maxHistory) {
      this._history.shift();
    }

    this._pendingChanges.clear();
    this._publishState();

    this._log('Committed batch', {
      changes: snapshot.changes.size,
      historySize: this._history.length
    });
  }

  _startAutoSnapshot() {
    this._stopAutoSnapshot();

    const interval = parseInt(this.getAttribute('snapshot-interval') || '5000', 10);

    this._autoSnapshotTimer = setInterval(() => {
      if (this._pendingChanges.size > 0) {
        this._commitBatch();
      }
    }, interval);

    this._log('Auto-snapshot enabled', { interval });
  }

  _stopAutoSnapshot() {
    if (this._autoSnapshotTimer) {
      clearInterval(this._autoSnapshotTimer);
      this._autoSnapshotTimer = null;
    }
  }

  undo() {
    if (this._history.length === 0) {
      this._log('Nothing to undo');
      return false;
    }

    // Commit any pending changes first
    if (this._pendingChanges.size > 0) {
      this._commitBatch();
    }

    // Pop from history
    const snapshot = this._history.pop();

    // Push to future (for redo)
    this._future.push(snapshot);

    // Revert changes
    for (const [topic, { oldValue }] of snapshot.changes.entries()) {
      this._currentState.set(topic, oldValue);

      // Publish old value
      this._panClient.publish(topic, oldValue, {
        retain: true,
        meta: { source: 'undo-redo', action: 'undo', timestamp: snapshot.timestamp }
      });
    }

    this._publishState();

    this._log('Undo', {
      changes: snapshot.changes.size,
      historySize: this._history.length
    });

    return true;
  }

  redo() {
    if (this._future.length === 0) {
      this._log('Nothing to redo');
      return false;
    }

    // Pop from future
    const snapshot = this._future.pop();

    // Push back to history
    this._history.push(snapshot);

    // Reapply changes
    for (const [topic, { newValue }] of snapshot.changes.entries()) {
      this._currentState.set(topic, newValue);

      // Publish new value
      this._panClient.publish(topic, newValue, {
        retain: true,
        meta: { source: 'undo-redo', action: 'redo', timestamp: snapshot.timestamp }
      });
    }

    this._publishState();

    this._log('Redo', {
      changes: snapshot.changes.size,
      futureSize: this._future.length
    });

    return true;
  }

  clear() {
    this._history = [];
    this._future = [];
    this._pendingChanges.clear();

    if (this._batchTimer) {
      clearTimeout(this._batchTimer);
      this._batchTimer = null;
    }

    this._publishState();

    this._log('History cleared');
  }

  snapshot() {
    // Force commit current batch
    if (this._pendingChanges.size > 0) {
      this._commitBatch();
    }

    this._log('Manual snapshot');
  }

  _publishState() {
    const channel = this.getAttribute('channel') || 'history';

    this._panClient.publish(`${channel}.state`, {
      canUndo: this._history.length > 0,
      canRedo: this._future.length > 0,
      historySize: this._history.length,
      futureSize: this._future.length,
      maxHistory: parseInt(this.getAttribute('max-history') || '50', 10),
      timestamp: Date.now()
    }, { retain: true });
  }

  _getPanClient() {
    if (this._panClient) return this._panClient;

    const panBus = document.querySelector('pan-bus');
    const panClient = panBus?.panClient || document.querySelector('pan-client');

    if (panClient) {
      this._panClient = panClient.client || panClient;
    }

    return this._panClient;
  }

  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-undo-redo]', ...args);
    }
  }

  // Public API
  get canUndo() {
    return this._history.length > 0;
  }

  get canRedo() {
    return this._future.length > 0;
  }

  get historySize() {
    return this._history.length;
  }

  get futureSize() {
    return this._future.length;
  }

  getHistory() {
    return this._history.map(snapshot => ({
      timestamp: snapshot.timestamp,
      changes: Array.from(snapshot.changes.entries()).map(([topic, { oldValue, newValue }]) => ({
        topic,
        oldValue,
        newValue
      }))
    }));
  }

  getCurrentState() {
    return new Map(this._currentState);
  }

  goToTimestamp(timestamp) {
    // Find snapshot by timestamp and undo/redo to get there
    const targetIndex = this._history.findIndex(s => s.timestamp === timestamp);

    if (targetIndex === -1) {
      this._log('Snapshot not found', { timestamp });
      return false;
    }

    const currentIndex = this._history.length - 1;
    const steps = currentIndex - targetIndex;

    if (steps > 0) {
      // Undo multiple times
      for (let i = 0; i < steps; i++) {
        this.undo();
      }
    } else if (steps < 0) {
      // Redo multiple times
      for (let i = 0; i < Math.abs(steps); i++) {
        this.redo();
      }
    }

    return true;
  }
}

customElements.define('pan-undo-redo', PanUndoRedo);
