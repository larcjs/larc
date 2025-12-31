/**
 * <pan-static-connector> - Inline static data connector
 *
 * Provides data from inline JSON for demos, prototypes, and testing.
 * No network requests - data is embedded directly in the component.
 *
 * Attributes:
 * - resource: logical resource name for PAN topics (e.g., "users")
 * - key: identifier field for items (default: "id")
 *
 * Data can be provided via:
 * 1. Child <script type="application/json"> element
 * 2. JavaScript: element.setData([...])
 *
 * Topics Published:
 * - `${resource}.list.state` (retained): { items: [] }
 * - `${resource}.item.state.${id}` (retained): { item: {} }
 *
 * Topics Subscribed:
 * - `${resource}.list.get`: Returns current data
 * - `${resource}.item.get`: Returns single item by id
 * - `${resource}.item.save`: Add/update item (in-memory only)
 * - `${resource}.item.delete`: Remove item (in-memory only)
 *
 * Example:
 * <pan-static-connector resource="users">
 *   <script type="application/json">
 *   [
 *     { "id": 1, "name": "Alice", "email": "alice@example.com" },
 *     { "id": 2, "name": "Bob", "email": "bob@example.com" }
 *   ]
 *   </script>
 * </pan-static-connector>
 */

import { PanClient } from '../core/pan-client.mjs';

export class PanStaticConnector extends HTMLElement {
  constructor() {
    super();
    this.pc = new PanClient(this);
    this._offs = [];
    this._items = [];
    this._nextId = 1;
  }

  static get observedAttributes() {
    return ['resource', 'key'];
  }

  connectedCallback() {
    this._loadInlineData();
    this._init();
  }

  disconnectedCallback() {
    this._offs.forEach(f => f?.());
    this._offs = [];
  }

  attributeChangedCallback() {
    if (this.isConnected) {
      this._init();
    }
  }

  get resource() {
    return (this.getAttribute('resource') || 'items').trim();
  }

  get key() {
    return (this.getAttribute('key') || 'id').trim();
  }

  /**
   * Set data programmatically
   * @param {Array} items - Array of data items
   */
  setData(items) {
    this._items = Array.isArray(items) ? [...items] : [];
    this._updateNextId();
    this._publishListState();
  }

  /**
   * Get current data
   * @returns {Array} Current items
   */
  getData() {
    return [...this._items];
  }

  _loadInlineData() {
    const script = this.querySelector('script[type="application/json"]');
    if (script?.textContent?.trim()) {
      try {
        const data = JSON.parse(script.textContent.trim());
        this._items = Array.isArray(data) ? data : (data.items || data.data || []);
        this._updateNextId();
      } catch (e) {
        console.warn('[pan-static-connector] Failed to parse inline JSON:', e);
        this._items = [];
      }
    }
  }

  _updateNextId() {
    // Find highest numeric ID to set nextId
    const maxId = this._items.reduce((max, item) => {
      const id = item[this.key];
      return typeof id === 'number' && id > max ? id : max;
    }, 0);
    this._nextId = maxId + 1;
  }

  _init() {
    // Clean up existing subscriptions
    this._offs.forEach(f => f?.());
    this._offs = [];

    const r = this.resource;

    this._offs.push(this.pc.subscribe(`${r}.list.get`, (m) => this._onListGet(m)));
    this._offs.push(this.pc.subscribe(`${r}.item.get`, (m) => this._onItemGet(m)));
    this._offs.push(this.pc.subscribe(`${r}.item.save`, (m) => this._onItemSave(m)));
    this._offs.push(this.pc.subscribe(`${r}.item.delete`, (m) => this._onItemDelete(m)));

    // Publish initial state
    this._publishListState();
  }

  _publishListState() {
    this.pc.publish({
      topic: `${this.resource}.list.state`,
      data: { items: [...this._items] },
      retain: true
    });
  }

  _publishItemState(item, opts = {}) {
    const id = item?.[this.key] ?? item?.id ?? item;
    if (id == null) return;

    if (opts.deleted) {
      this.pc.publish({
        topic: `${this.resource}.item.state.${id}`,
        data: { id, deleted: true }
      });
    } else {
      this.pc.publish({
        topic: `${this.resource}.item.state.${id}`,
        data: { item },
        retain: true
      });
    }
  }

  _onListGet(m) {
    const items = [...this._items];

    // Apply simple filtering if provided
    const filters = m?.data?.filters || m?.data?.filter;
    let filtered = items;

    if (filters && typeof filters === 'object') {
      filtered = items.filter(item => {
        return Object.entries(filters).every(([key, value]) => {
          if (value === '' || value == null) return true;
          const itemValue = String(item[key] || '').toLowerCase();
          return itemValue.includes(String(value).toLowerCase());
        });
      });
    }

    if (m?.replyTo) {
      this.pc.publish({
        topic: m.replyTo,
        correlationId: m.correlationId,
        data: { ok: true, items: filtered }
      });
    }

    // Re-publish state
    this._publishListState();
  }

  _onItemGet(m) {
    const id = m?.data?.[this.key] ?? m?.data?.id ?? m?.data;
    const item = this._items.find(i => i[this.key] == id);

    if (item) {
      this._publishItemState(item);
    }

    if (m?.replyTo) {
      this.pc.publish({
        topic: m.replyTo,
        correlationId: m.correlationId,
        data: { ok: !!item, item: item || null }
      });
    }
  }

  _onItemSave(m) {
    let item = m?.data?.item ?? m?.data;
    if (!item || typeof item !== 'object') {
      if (m?.replyTo) {
        this.pc.publish({
          topic: m.replyTo,
          correlationId: m.correlationId,
          data: { ok: false, error: 'Invalid item data' }
        });
      }
      return;
    }

    const existingId = item[this.key];
    const existingIndex = existingId != null
      ? this._items.findIndex(i => i[this.key] == existingId)
      : -1;

    if (existingIndex >= 0) {
      // Update existing
      this._items[existingIndex] = { ...this._items[existingIndex], ...item };
      item = this._items[existingIndex];
    } else {
      // Create new
      if (item[this.key] == null) {
        item = { ...item, [this.key]: this._nextId++ };
      }
      this._items.push(item);
      this._updateNextId();
    }

    this._publishItemState(item);
    this._publishListState();

    if (m?.replyTo) {
      this.pc.publish({
        topic: m.replyTo,
        correlationId: m.correlationId,
        data: { ok: true, item }
      });
    }
  }

  _onItemDelete(m) {
    const id = m?.data?.[this.key] ?? m?.data?.id ?? m?.data;
    const index = this._items.findIndex(i => i[this.key] == id);

    if (index >= 0) {
      this._items.splice(index, 1);
      this._publishItemState(id, { deleted: true });
      this._publishListState();
    }

    if (m?.replyTo) {
      this.pc.publish({
        topic: m.replyTo,
        correlationId: m.correlationId,
        data: { ok: index >= 0, id }
      });
    }
  }
}

customElements.define('pan-static-connector', PanStaticConnector);
export default PanStaticConnector;
