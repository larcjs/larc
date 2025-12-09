/**
 * <pan-invoice-items>
 * Editable grid for invoice line items
 *
 * PAN Events:
 * - Publishes: invoice.items.changed, invoice.totals.changed
 * - Subscribes: invoice.load, invoice.clear
 */

import { PanClient } from '../../core/src/components/pan-client.mjs';

class PanInvoiceItems extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(document, 'pan-bus');
    this._items = [];
    this._nextId = 1;
  }

  connectedCallback() {
    this.render();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.client.subscribe('invoice.load', (msg) => {
      if (msg.data.items) {
        this._items = msg.data.items;
        this._nextId = Math.max(0, ...this._items.map(i => i.id)) + 1;
        this.render();
      }
    });

    this.client.subscribe('invoice.clear', () => {
      this._items = [];
      this._nextId = 1;
      this.render();
    });
  }

  addItem() {
    const newItem = {
      id: this._nextId++,
      date: new Date().toISOString().split('T')[0],
      description: '',
      hours: '',
      rate: '',
      total: 0
    };
    this._items.push(newItem);
    this.render();
    this.publishChanges();
  }

  removeItem(id) {
    this._items = this._items.filter(item => item.id !== id);
    this.render();
    this.publishChanges();
  }

  handleCellChange(id, field, value) {
    const item = this._items.find(i => i.id === id);
    if (!item) return;

    item[field] = value;

    // Calculate line total
    if (field === 'hours' || field === 'rate') {
      const hours = parseFloat(item.hours) || 0;
      const rate = parseFloat(item.rate) || 0;
      item.total = hours * rate;
    }

    this.render();
    this.publishChanges();
  }

  publishChanges() {
    this.client.publish('invoice.items.changed', this._items);

    // Calculate and publish totals
    const subtotal = this._items.reduce((sum, item) => sum + (item.total || 0), 0);
    this.client.publish('invoice.totals.changed', { subtotal });
  }

  render() {
    this.innerHTML = `
      <div class="invoice-items">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Hours</th>
              <th>Rate</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${this._items.map(item => `
              <tr data-id="${item.id}">
                <td>
                  <input
                    type="date"
                    value="${item.date || ''}"
                    onchange="this.closest('pan-invoice-items').handleCellChange(${item.id}, 'date', this.value)"
                  />
                </td>
                <td>
                  <div
                    contenteditable="true"
                    data-placeholder="Description"
                    onblur="this.closest('pan-invoice-items').handleCellChange(${item.id}, 'description', this.textContent)"
                  >${item.description || ''}</div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.25"
                    value="${item.hours || ''}"
                    placeholder="0"
                    oninput="this.closest('pan-invoice-items').handleCellChange(${item.id}, 'hours', this.value)"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    value="${item.rate || ''}"
                    placeholder="0.00"
                    oninput="this.closest('pan-invoice-items').handleCellChange(${item.id}, 'rate', this.value)"
                  />
                </td>
                <td class="total">$${(item.total || 0).toFixed(2)}</td>
                <td>
                  <button
                    class="btn-remove"
                    onclick="this.closest('pan-invoice-items').removeItem(${item.id})"
                    title="Remove item"
                  >×</button>
                </td>
              </tr>
            `).join('')}
            <tr class="add-row">
              <td colspan="6">
                <button
                  class="btn-add"
                  onclick="this.closest('pan-invoice-items').addItem()"
                >+ Click to add line item</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    `;
  }
}

customElements.define('pan-invoice-items', PanInvoiceItems);
