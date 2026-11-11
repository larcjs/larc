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
    document.addEventListener('pan:bye', this.onBye, true);

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
    document.removeEventListener('pan:bye', this.onBye, true);

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

  /**
   * Handle client teardown (PanClient.dispose): forget the client and every subscription it owns
   * @param {CustomEvent} e - Event whose detail is `{ id: clientId }`
   */
  onBye = (e) => {
    const id = (e.detail || {}).id;
    if (!id) return;
    this.clients.delete(id);
    this.subs = this.subs.filter((s) => s.clientId !== id);
  };

  onSubscribe = (e) => {
    const { topics = [], options = {}, clientId, subId } = e.detail || {};
    const el = this._et(e);

    // Add subscriptions
    for (const pattern of topics) {
      this.subs.push({ pattern, el, clientId, subId });
    }

    // Deliver retained messages if requested
    if (options.retained) {
      for (const [topic, msg] of this.retained) {
        if (topics.some((p) => PanBusLite.matches(topic, p))) {
          this._deliver(el, msg, subId);
        }
      }
    }
  };

  onUnsubscribe = (e) => {
    const { topics = [], clientId, subId } = e.detail || {};
    const el = this._et(e);

    this.subs = this.subs.filter((s) => {
      if (subId) return s.subId !== subId; // exact: only that subscription
      // no subId (older client): legacy behaviour, match by client (or element) and pattern
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
    this._route(msg);
  };

  onReply = (e) => {
    const msg = e.detail || {};

    // Deliver to matching subscribers
    this._route(msg);
  };

  /**
   * Deliver a message to every matching subscription, once per subscription: a subscription that
   * lists several matching patterns still gets a single delivery. Entries without a subId
   * (older clients) keep the legacy one-delivery-per-matching-pattern behaviour.
   * @param {Object} msg - Message to route
   * @returns {number} Number of deliveries made
   * @private
   */
  _route(msg) {
    this._prune();
    const sent = new Set();
    let delivered = 0;
    for (const s of this.subs) {
      if (!PanBusLite.matches(msg.topic, s.pattern)) continue;
      if (s.subId) { if (sent.has(s.subId)) continue; sent.add(s.subId); }
      if (this._deliver(s.el, msg, s.subId) !== false) delivered++;
    }
    return delivered;
  }

  /**
   * Drop subscriptions and clients whose host element has been removed from the DOM.
   *
   * Runs at delivery time only (never on a timer or on disconnect), so an element that is
   * detached and re-attached within one task (a DOM move) keeps its subscriptions. The trade-off:
   * if a message is published while a host is detached (e.g. mid-move, from another handler),
   * that host's subscriptions are dropped and it must subscribe again. `document` and
   * non-Element targets are never considered disconnected.
   * @private
   */
  _prune() {
    const dead = (el) => el && el.nodeType === 1 && el.isConnected === false;
    if (this.subs.some((s) => dead(s.el))) this.subs = this.subs.filter((s) => !dead(s.el));
    for (const [id, c] of this.clients) if (dead(c.el)) this.clients.delete(id);
  }

  /**
   * Deliver message to target element
   * @private
   */
  _deliver(target, msg, subId) {
    try {
      // Simplified check - just verify element exists
      if (!target || !target.dispatchEvent) return false;

      const ev = new CustomEvent('pan:deliver', { detail: msg, bubbles: true, composed: true });
      if (subId) ev.panSubId = subId;
      target.dispatchEvent(ev);
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
    const subId = `${clientId}/1`;

    // Listen for deliveries
    const onDeliver = (ev) => {
      const m = ev.detail;
      if (!m || !m.topic) return;

      // Tagged delivery: only ours. Untagged (older bus / hand-made event): filter by our patterns.
      if (ev.panSubId !== undefined ? ev.panSubId !== subId : !topics.some((t) => PanBusLite.matches(m.topic, t))) return;
      handler(m);
    };

    document.addEventListener('pan:deliver', onDeliver);

    // Subscribe on bus
    document.dispatchEvent(new CustomEvent('pan:subscribe', {
      detail: { clientId, subId, topics, options: {} },
      bubbles: true,
      composed: true
    }));

    // Return unsubscribe function
    return () => {
      document.removeEventListener('pan:deliver', onDeliver);
      document.dispatchEvent(new CustomEvent('pan:unsubscribe', {
        detail: { clientId, subId, topics },
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
