/**
 * LarcElement - Base class for PAN-compatible web components
 *
 * Provides convenient helpers for pub/sub messaging and automatic
 * subscription cleanup on disconnect.
 *
 * @example
 * import { LarcElement } from '@larcjs/core/larc-element.mjs';
 *
 * class MyWidget extends LarcElement {
 *   connected() {
 *     // Subscribe with auto-cleanup
 *     this.subscribe('data:updated', (data) => this.render(data));
 *
 *     // Publish events
 *     this.pub('widget:ready', { id: this.id });
 *   }
 *
 *   disconnected() {
 *     // Optional cleanup (subscriptions auto-cleaned)
 *   }
 * }
 * customElements.define('my-widget', MyWidget);
 */
export class LarcElement extends HTMLElement {
  /**
   * Get the pan-bus instance (lazy, cached)
   * @returns {HTMLElement|null} The pan-bus element
   */
  get bus() {
    if (!this._bus) {
      this._bus = document.querySelector('pan-bus');
    }
    return this._bus;
  }

  /**
   * Publish a message to the bus
   * @param {string} topic - Topic name
   * @param {*} data - Data payload
   * @param {Object} options - Optional pub options
   */
  pub(topic, data, options) {
    this.bus?.pub(topic, data, options);
  }

  /**
   * Subscribe to a topic (use `subscribe()` for auto-cleanup)
   * @param {string} topic - Topic name or pattern
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  sub(topic, handler) {
    return this.bus?.sub(topic, handler);
  }

  /**
   * Subscribe with automatic cleanup on disconnect
   * @param {string} topic - Topic name or pattern
   * @param {Function} handler - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(topic, handler) {
    const unsub = this.sub(topic, handler);
    if (unsub) {
      this._subs.push(unsub);
    }
    return unsub;
  }

  /**
   * Read a value from the bus state
   * @param {string} key - State key
   * @returns {*} The stored value
   */
  get(key) {
    return this.bus?.get(key);
  }

  /**
   * Write a value to the bus state
   * @param {string} key - State key
   * @param {*} value - Value to store
   */
  set(key, value) {
    this.bus?.set(key, value);
  }

  /**
   * Standard Web Component lifecycle - initializes subscription tracking
   * Override `connected()` instead of this method
   */
  connectedCallback() {
    this._subs = [];
    this._bus = null; // Reset bus reference on reconnect
    this.connected?.();
  }

  /**
   * Standard Web Component lifecycle - cleans up subscriptions
   * Override `disconnected()` instead of this method
   */
  disconnectedCallback() {
    // Clean up all tracked subscriptions
    if (this._subs) {
      this._subs.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      this._subs = [];
    }
    this.disconnected?.();
  }

  /**
   * Override this method for connection logic
   * Called after element is added to DOM
   */
  connected() {}

  /**
   * Override this method for disconnection logic
   * Called after element is removed from DOM (subscriptions already cleaned)
   */
  disconnected() {}

  /**
   * Helper to get a data attribute value
   * @param {string} name - Attribute name (without 'data-' prefix)
   * @param {*} defaultValue - Default if not set
   * @returns {string|*} Attribute value or default
   */
  data(name, defaultValue = null) {
    return this.dataset[name] ?? defaultValue;
  }

  /**
   * Helper to parse a JSON data attribute
   * @param {string} name - Attribute name (without 'data-' prefix)
   * @param {*} defaultValue - Default if parse fails
   * @returns {*} Parsed value or default
   */
  dataJson(name, defaultValue = null) {
    try {
      const val = this.dataset[name];
      return val ? JSON.parse(val) : defaultValue;
    } catch {
      return defaultValue;
    }
  }
}

export default LarcElement;
