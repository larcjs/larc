/**
 * pan-state-sync - Cross-tab state synchronization component
 *
 * Synchronizes state across multiple browser tabs using BroadcastChannel.
 * Provides leader election to prevent sync loops and configurable conflict resolution.
 *
 * @example
 * <pan-state-sync
 *   channel="myapp-sync"
 *   topics="users.*,todos.*"
 *   strategy="last-write-wins"
 *   leader="auto">
 * </pan-state-sync>
 *
 * @attribute {string} channel - Name of the BroadcastChannel (default: 'pan-state-sync')
 * @attribute {string} topics - Comma-separated topic patterns to sync (supports wildcards)
 * @attribute {string} strategy - Conflict resolution: 'last-write-wins' | 'merge' | 'custom'
 * @attribute {string} leader - Leader election: 'auto' | 'always' | 'never'
 * @attribute {boolean} debug - Enable debug logging
 *
 * @topic {channel}.sync.message - Broadcast state changes to other tabs
 * @topic {channel}.sync.request-state - Request full state from leader
 * @topic {channel}.sync.leader-elected - Notify when new leader elected
 * @topic {channel}.sync.conflict - Conflict detected, resolution needed
 */

export class PanStateSync extends HTMLElement {
  static observedAttributes = ['channel', 'topics', 'strategy', 'leader', 'debug'];

  constructor() {
    super();
    this._channel = null;
    this._subscriptions = new Map();
    this._isLeader = false;
    this._leaderId = null;
    this._tabId = this._generateTabId();
    this._messageQueue = [];
    this._processing = false;
    this._stateCache = new Map();
    this._boundHandleMessage = this._handleBroadcastMessage.bind(this);
    this._boundHandleVisibilityChange = this._handleVisibilityChange.bind(this);
    this._heartbeatInterval = null;
    this._leaderTimeout = null;
  }

  connectedCallback() {
    this._initialize();
    document.addEventListener('visibilitychange', this._boundHandleVisibilityChange);

    // Start heartbeat for leader election
    if (this.getAttribute('leader') !== 'never') {
      this._startHeartbeat();
    }
  }

  disconnectedCallback() {
    this._cleanup();
    document.removeEventListener('visibilitychange', this._boundHandleVisibilityChange);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'topics' || name === 'channel') {
      this._cleanup();
      this._initialize();
    }
  }

  _generateTabId() {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  _initialize() {
    const channelName = this.getAttribute('channel') || 'pan-state-sync';
    const topics = this.getAttribute('topics') || '*';
    const leaderMode = this.getAttribute('leader') || 'auto';

    if (!window.BroadcastChannel) {
      console.error('BroadcastChannel not supported in this browser');
      this._publishEvent('sync.error', {
        error: 'BroadcastChannel not supported',
        tabId: this._tabId
      });
      return;
    }

    // Create broadcast channel
    this._channel = new BroadcastChannel(channelName);
    this._channel.addEventListener('message', this._boundHandleMessage);

    // Subscribe to PAN topics
    this._subscribeToTopics(topics.split(',').map(t => t.trim()));

    // Leader election
    if (leaderMode === 'always') {
      this._becomeLeader();
    } else if (leaderMode === 'auto') {
      this._requestLeaderStatus();
    }

    this._log('Initialized', { tabId: this._tabId, channel: channelName, topics });
  }

  _cleanup() {
    if (this._channel) {
      this._channel.removeEventListener('message', this._boundHandleMessage);
      this._channel.close();
      this._channel = null;
    }

    // Unsubscribe from all PAN topics
    for (const [topic, handler] of this._subscriptions.entries()) {
      this._panClient?.unsubscribe(topic, handler);
    }
    this._subscriptions.clear();

    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    if (this._leaderTimeout) {
      clearTimeout(this._leaderTimeout);
      this._leaderTimeout = null;
    }

    this._stateCache.clear();
  }

  _subscribeToTopics(topics) {
    const panClient = this._getPanClient();
    if (!panClient) return;

    for (const topicPattern of topics) {
      if (this._subscriptions.has(topicPattern)) continue;

      const handler = (message) => {
        this._handleLocalStateChange(topicPattern, message);
      };

      panClient.subscribe(topicPattern, handler);
      this._subscriptions.set(topicPattern, handler);
    }
  }

  async _handleLocalStateChange(topicPattern, message) {
    // Don't broadcast messages that came from other tabs
    if (message.meta?.source === 'broadcast-channel') {
      return;
    }

    const topic = message.topic;
    const data = message.data;

    // Cache the state
    this._stateCache.set(topic, {
      data,
      timestamp: Date.now(),
      tabId: this._tabId
    });

    // Broadcast to other tabs
    this._broadcastMessage({
      type: 'state-change',
      topic,
      data,
      timestamp: Date.now(),
      tabId: this._tabId
    });

    this._log('Broadcasting state change', { topic, tabId: this._tabId });
  }

  _handleBroadcastMessage(event) {
    const message = event.data;

    switch (message.type) {
      case 'state-change':
        this._handleRemoteStateChange(message);
        break;

      case 'request-state':
        this._handleStateRequest(message);
        break;

      case 'state-snapshot':
        this._handleStateSnapshot(message);
        break;

      case 'heartbeat':
        this._handleHeartbeat(message);
        break;

      case 'leader-claim':
        this._handleLeaderClaim(message);
        break;

      default:
        this._log('Unknown message type', message);
    }
  }

  _handleRemoteStateChange(message) {
    const { topic, data, timestamp, tabId } = message;

    // Don't process our own messages
    if (tabId === this._tabId) return;

    const strategy = this.getAttribute('strategy') || 'last-write-wins';
    const cachedState = this._stateCache.get(topic);

    // Conflict detection
    if (cachedState && cachedState.timestamp > timestamp) {
      if (strategy === 'last-write-wins') {
        this._log('Ignoring older state', { topic, remoteTime: timestamp, localTime: cachedState.timestamp });
        return;
      } else {
        this._publishEvent('sync.conflict', {
          topic,
          local: cachedState,
          remote: { data, timestamp, tabId },
          strategy
        });
      }
    }

    // Update cache
    this._stateCache.set(topic, { data, timestamp, tabId });

    // Publish to local PAN bus
    const panClient = this._getPanClient();
    if (panClient) {
      panClient.publish(topic, data, {
        retain: true,
        meta: { source: 'broadcast-channel', tabId }
      });
      this._log('Applied remote state', { topic, tabId });
    }
  }

  _handleStateRequest(message) {
    // Only leader responds
    if (!this._isLeader) return;

    const snapshot = {};
    for (const [topic, state] of this._stateCache.entries()) {
      snapshot[topic] = state;
    }

    this._broadcastMessage({
      type: 'state-snapshot',
      snapshot,
      timestamp: Date.now(),
      tabId: this._tabId
    });

    this._log('Sent state snapshot', { requestor: message.tabId, topics: Object.keys(snapshot).length });
  }

  _handleStateSnapshot(message) {
    const { snapshot, tabId } = message;

    // Don't process our own snapshots
    if (tabId === this._tabId) return;

    const panClient = this._getPanClient();
    if (!panClient) return;

    // Apply all state from snapshot
    for (const [topic, state] of Object.entries(snapshot)) {
      this._stateCache.set(topic, state);
      panClient.publish(topic, state.data, {
        retain: true,
        meta: { source: 'broadcast-channel', tabId: state.tabId }
      });
    }

    this._log('Applied state snapshot', { from: tabId, topics: Object.keys(snapshot).length });
  }

  _startHeartbeat() {
    // Send heartbeat every 5 seconds
    this._heartbeatInterval = setInterval(() => {
      this._broadcastMessage({
        type: 'heartbeat',
        tabId: this._tabId,
        isLeader: this._isLeader,
        timestamp: Date.now()
      });
    }, 5000);

    // Check for leader timeout every 10 seconds
    this._checkLeaderTimeout();
  }

  _handleHeartbeat(message) {
    const { tabId, isLeader, timestamp } = message;

    if (isLeader) {
      this._leaderId = tabId;
      this._leaderLastSeen = timestamp;

      // If someone else is leader, we're not
      if (this._isLeader && tabId !== this._tabId) {
        this._isLeader = false;
        this._log('Demoted from leader', { newLeader: tabId });
      }
    }
  }

  _handleLeaderClaim(message) {
    const { tabId, timestamp } = message;

    // If claim is from a tab with earlier ID, defer
    if (tabId < this._tabId) {
      if (this._isLeader) {
        this._isLeader = false;
        this._log('Deferred leadership', { to: tabId });
      }
      this._leaderId = tabId;
    }
  }

  _checkLeaderTimeout() {
    const timeout = 15000; // 15 seconds

    setInterval(() => {
      if (!this._isLeader && this._leaderLastSeen) {
        const elapsed = Date.now() - this._leaderLastSeen;

        if (elapsed > timeout) {
          this._log('Leader timeout detected', { lastSeen: elapsed });
          this._requestLeaderStatus();
        }
      }
    }, 10000);
  }

  _requestLeaderStatus() {
    // Wait a random interval to avoid collisions
    const delay = Math.random() * 1000;

    setTimeout(() => {
      if (!this._leaderId || this._leaderId === this._tabId) {
        this._becomeLeader();
      } else {
        // Request state from leader
        this._broadcastMessage({
          type: 'request-state',
          tabId: this._tabId,
          timestamp: Date.now()
        });
      }
    }, delay);
  }

  _becomeLeader() {
    this._isLeader = true;
    this._leaderId = this._tabId;

    this._broadcastMessage({
      type: 'leader-claim',
      tabId: this._tabId,
      timestamp: Date.now()
    });

    this._publishEvent('sync.leader-elected', {
      tabId: this._tabId,
      timestamp: Date.now()
    });

    this._log('Became leader', { tabId: this._tabId });
  }

  _handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      // Request fresh state when tab becomes visible
      this._broadcastMessage({
        type: 'request-state',
        tabId: this._tabId,
        timestamp: Date.now()
      });
      this._log('Tab visible, requesting state');
    }
  }

  _broadcastMessage(message) {
    if (!this._channel) return;

    try {
      this._channel.postMessage(message);
    } catch (error) {
      this._log('Broadcast error', { error: error.message, message });
    }
  }

  _publishEvent(eventTopic, data) {
    const panClient = this._getPanClient();
    if (!panClient) return;

    const channel = this.getAttribute('channel') || 'pan-state-sync';
    const topic = `${channel}.${eventTopic}`;

    panClient.publish(topic, data, { retain: false });
  }

  _getPanClient() {
    if (this._panClient) return this._panClient;

    // Find pan-client or pan-bus
    const panBus = document.querySelector('pan-bus');
    const panClient = panBus?.panClient || document.querySelector('pan-client');

    if (panClient) {
      this._panClient = panClient.client || panClient;
    }

    return this._panClient;
  }

  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-state-sync]', ...args);
    }
  }

  // Public API
  get tabId() {
    return this._tabId;
  }

  get isLeader() {
    return this._isLeader;
  }

  get channel() {
    return this.getAttribute('channel') || 'pan-state-sync';
  }

  async requestFullSync() {
    this._broadcastMessage({
      type: 'request-state',
      tabId: this._tabId,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this._stateCache.clear();
    this._log('Cache cleared');
  }

  getStateCache() {
    return new Map(this._stateCache);
  }
}

customElements.define('pan-state-sync', PanStateSync);
