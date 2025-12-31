/**
 * <pan-open-data-connector> - Read-only connector for public JSON APIs
 *
 * A lightweight connector for consuming open data APIs that return JSON arrays.
 * Perfect for demos and read-only data displays with pan-data-table or pan-grid.
 *
 * Attributes:
 * - resource: logical resource name for PAN topics (e.g., "earthquakes")
 * - url: API endpoint URL (required)
 * - path: dot-notation path to extract array from response (e.g., "features" or "data.items")
 * - refresh-interval: auto-refresh interval in seconds (optional, 0 = disabled)
 * - transform: name of a global function to transform each item (optional)
 *
 * Topics Published:
 * - `${resource}.list.state` (retained): { items: [], loading: bool, error: string|null, lastUpdated: timestamp }
 *
 * Topics Subscribed:
 * - `${resource}.list.get`: Trigger a refresh (data payload passed as query params if flat object)
 *
 * Example:
 * <pan-open-data-connector
 *   resource="earthquakes"
 *   url="https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson"
 *   path="features"
 *   refresh-interval="60">
 * </pan-open-data-connector>
 */

import { PanClient } from '../core/pan-client.mjs';

export class PanOpenDataConnector extends HTMLElement {
  constructor() {
    super();
    this.pc = new PanClient(this);
    this._offs = [];
    this._refreshTimer = null;
    this._items = [];
    this._loading = false;
    this._error = null;
    this._lastUpdated = null;
  }

  static get observedAttributes() {
    return ['resource', 'url', 'path', 'refresh-interval', 'transform'];
  }

  connectedCallback() {
    this._init();
  }

  disconnectedCallback() {
    this._offs.forEach(f => f?.());
    this._offs = [];
    this._stopAutoRefresh();
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._init();
    }
  }

  get resource() {
    return (this.getAttribute('resource') || 'items').trim();
  }

  get url() {
    return (this.getAttribute('url') || '').trim();
  }

  get path() {
    return (this.getAttribute('path') || '').trim();
  }

  get refreshInterval() {
    return parseInt(this.getAttribute('refresh-interval') || '0', 10);
  }

  get transformFn() {
    const name = (this.getAttribute('transform') || '').trim();
    return name && typeof window[name] === 'function' ? window[name] : null;
  }

  _init() {
    // Clean up existing subscriptions
    this._offs.forEach(f => f?.());
    this._offs = [];
    this._stopAutoRefresh();

    // Subscribe to list.get requests
    this._offs.push(
      this.pc.subscribe(`${this.resource}.list.get`, (m) => this._onListGet(m))
    );

    // Initial fetch
    this._fetch();

    // Set up auto-refresh if configured
    if (this.refreshInterval > 0) {
      this._startAutoRefresh();
    }
  }

  _startAutoRefresh() {
    this._stopAutoRefresh();
    this._refreshTimer = setInterval(() => {
      this._fetch();
    }, this.refreshInterval * 1000);
  }

  _stopAutoRefresh() {
    if (this._refreshTimer) {
      clearInterval(this._refreshTimer);
      this._refreshTimer = null;
    }
  }

  _extractPath(obj, path) {
    if (!path) return obj;
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current == null) return undefined;
      current = current[part];
    }
    return current;
  }

  _buildUrl(params) {
    let url = this.url;
    if (!url) return '';

    // If params is a flat object, append as query string
    if (params && typeof params === 'object' && !Array.isArray(params)) {
      const entries = Object.entries(params).filter(([_, v]) => v != null && v !== '');
      if (entries.length > 0) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of entries) {
          searchParams.append(key, String(value));
        }
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}${searchParams.toString()}`;
      }
    }

    return url;
  }

  async _fetch(params = {}) {
    const url = this._buildUrl(params);
    if (!url) {
      this._publishState({ error: 'No URL configured' });
      return;
    }

    this._loading = true;
    this._error = null;
    this._publishState();

    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();

      // Extract array from path
      let items = this._extractPath(json, this.path);

      if (!Array.isArray(items)) {
        // Try common array locations
        items = json.data || json.items || json.results || json.records || [];
        if (!Array.isArray(items)) {
          items = Array.isArray(json) ? json : [];
        }
      }

      // Apply transform function if configured
      const transform = this.transformFn;
      if (transform) {
        items = items.map((item, index) => {
          try {
            return transform(item, index);
          } catch (e) {
            console.warn(`[pan-open-data-connector] Transform error for item ${index}:`, e);
            return item;
          }
        });
      }

      this._items = items;
      this._loading = false;
      this._lastUpdated = Date.now();
      this._publishState();

      return items;
    } catch (err) {
      this._loading = false;
      this._error = err.message || String(err);
      this._publishState();
      return [];
    }
  }

  _publishState(overrides = {}) {
    this.pc.publish({
      topic: `${this.resource}.list.state`,
      data: {
        items: this._items,
        loading: this._loading,
        error: this._error,
        lastUpdated: this._lastUpdated,
        ...overrides
      },
      retain: true
    });
  }

  async _onListGet(m) {
    const params = m?.data || {};
    const items = await this._fetch(params);

    // Send reply if requested
    if (m?.replyTo) {
      this.pc.publish({
        topic: m.replyTo,
        correlationId: m.correlationId,
        data: {
          ok: !this._error,
          items,
          error: this._error
        }
      });
    }
  }
}

customElements.define('pan-open-data-connector', PanOpenDataConnector);
export default PanOpenDataConnector;
