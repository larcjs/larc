/**
 * @fileoverview PAN Bus Lite - Lightweight message bus (essential features only)
 *
 * Essential features:
 * - Pub/sub with topic pattern matching
 * - Retained messages (simple Map, no LRU)
 * - Request/reply pattern
 * - Basic subscription management
 *
 * What's removed vs Enhanced:
 * - No routing system (12KB saved)
 * - No debug manager (4KB saved)
 * - No rate limiting
 * - No message size validation
 * - No statistics tracking
 * - No LRU eviction
 * - Minimal error handling
 *
 * Target: 5-7KB minified vs 12KB enhanced
 *
 * @example
 * <pan-bus></pan-bus>
 */

/**
 * PAN Bus Lite - Essential message bus
 *
 * @class
 * @extends HTMLElement
 */
class PanBusLite extends HTMLElement {
  constructor() {
    super();

    // Core data structures (minimal)
    this.subs = [];              // Subscriptions: { pattern, el, clientId }
    this.retained = new Map();   // Retained messages: topic -> msg
    this.clients = new Map();    // Registered clients: id -> { el, caps }
  }

  connectedCallback() {
    // Set up event listeners
    document.addEventListener('pan:publish', this.onPublish, true);
    document.addEventListener('pan:request', this.onPublish, true);
    document.addEventListener('pan:reply', this.onReply, true);
    document.addEventListener('pan:subscribe', this.onSubscribe, true);
    document.addEventListener('pan:unsubscribe', this.onUnsubscribe, true);
    document.addEventListener('pan:hello', this.onHello, true);

    // Announce readiness
    window.__panReady = true;
    document.dispatchEvent(
      new CustomEvent('pan:sys.ready', {
        bubbles: true,
        composed: true,
        detail: { lite: true }
      })
    );

    // Expose minimal global API
    if (typeof window !== 'undefined') {
      window.pan = window.pan || {};
      window.pan.bus = this;
    }
  }

  disconnectedCallback() {
    // Clean up listeners
    document.removeEventListener('pan:publish', this.onPublish, true);
    document.removeEventListener('pan:request', this.onPublish, true);
    document.removeEventListener('pan:reply', this.onReply, true);
    document.removeEventListener('pan:subscribe', this.onSubscribe, true);
    document.removeEventListener('pan:unsubscribe', this.onUnsubscribe, true);
    document.removeEventListener('pan:hello', this.onHello, true);

    // Clean up global API
    if (typeof window !== 'undefined' && window.pan) {
      delete window.pan.bus;
    }
  }

  onHello = (e) => {
    const d = e.detail || {};
    if (d.id) {
      this.clients.set(d.id, { el: this._et(e), caps: d.caps || [] });
    }
  };

  onSubscribe = (e) => {
    const { topics = [], options = {}, clientId } = e.detail || {};
    const el = this._et(e);

    // Add subscriptions
    for (const pattern of topics) {
      this.subs.push({ pattern, el, clientId });
    }

    // Deliver retained messages if requested
    if (options.retained) {
      for (const [topic, msg] of this.retained) {
        if (topics.some((p) => PanBusLite.matches(topic, p))) {
          this._deliver(el, msg);
        }
      }
    }
  };

  onUnsubscribe = (e) => {
    const { topics = [], clientId } = e.detail || {};
    const el = this._et(e);

    this.subs = this.subs.filter((s) => {
      const sameClient = clientId ? s.clientId === clientId : s.el === el;
      return !(sameClient && topics.includes(s.pattern));
    });
  };

  onPublish = (e) => {
    const base = e.detail || {};

    // Create message with minimal metadata
    const msg = {
      ts: Date.now(),
      id: crypto.randomUUID(),
      ...base
    };

    // Store retained message
    if (msg.retain) {
      this.retained.set(msg.topic, msg);
    }

    // Deliver to matching subscribers
    for (const s of this.subs) {
      if (PanBusLite.matches(msg.topic, s.pattern)) {
        this._deliver(s.el, msg);
      }
    }
  };

  onReply = (e) => {
    const msg = e.detail || {};

    // Deliver to matching subscribers
    for (const s of this.subs) {
      if (PanBusLite.matches(msg.topic, s.pattern)) {
        this._deliver(s.el, msg);
      }
    }
  };

  /**
   * Deliver message to target element
   * @private
   */
  _deliver(target, msg) {
    try {
      // Simplified check - just verify element exists
      if (!target || !target.dispatchEvent) return false;

      target.dispatchEvent(new CustomEvent('pan:deliver', {
        detail: msg,
        bubbles: true,
        composed: true
      }));
      return true;
    } catch (err) {
      return false;
    }
  }

  /**
   * Get event target
   * @private
   */
  _et(e) {
    return (typeof e.composedPath === 'function'
      ? e.composedPath()[0]
      : (e.target || document));
  }

  /**
   * Topic matching with wildcard support
   * @static
   */
  static matches(topic, pattern) {
    if (pattern === '*' || topic === pattern) return true;

    if (pattern && pattern.includes('*')) {
      const esc = (s) => s.replace(/[|\\{}()\[\]^$+?.]/g, '\\$&').replace(/\*/g, '[^.]+');
      const rx = new RegExp(`^${esc(pattern)}$`);
      return rx.test(topic);
    }

    return false;
  }

  /**
   * Convenience method: publish a message
   * @param {string} topic - Topic name
   * @param {*} data - Message payload
   * @param {Object} options - Additional options (retain, etc.)
   */
  publish(topic, data, options = {}) {
    document.dispatchEvent(new CustomEvent('pan:publish', {
      detail: { topic, data, ...options },
      bubbles: true,
      composed: true
    }));
  }

  /**
   * Convenience method: subscribe to a topic
   * @param {string|string[]} topics - Topic pattern(s) to subscribe to
   * @param {Function} handler - Callback function(msg)
   * @returns {Function} Unsubscribe function
   */
  subscribe(topics, handler) {
    topics = Array.isArray(topics) ? topics : [topics];
    const clientId = `bus-direct-${crypto.randomUUID()}`;

    // Listen for deliveries
    const onDeliver = (ev) => {
      const m = ev.detail;
      if (!m || !m.topic) return;

      // Check if message matches any of our topic patterns
      if (topics.some((t) => PanBusLite.matches(m.topic, t))) {
        handler(m);
      }
    };

    document.addEventListener('pan:deliver', onDeliver);

    // Subscribe on bus
    document.dispatchEvent(new CustomEvent('pan:subscribe', {
      detail: { clientId, topics, options: {} },
      bubbles: true,
      composed: true
    }));

    // Return unsubscribe function
    return () => {
      document.removeEventListener('pan:deliver', onDeliver);
      document.dispatchEvent(new CustomEvent('pan:unsubscribe', {
        detail: { clientId, topics },
        bubbles: true,
        composed: true
      }));
    };
  }
}

// Register as 'pan-bus' (lite version is default)
customElements.define('pan-bus', PanBusLite);
export { PanBusLite };
export default PanBusLite;
