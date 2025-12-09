/**
 * <pan-invoice-header>
 * Manages invoice header with from/to customer information
 *
 * PAN Events:
 * - Publishes: invoice.header.changed
 * - Subscribes: invoice.load, invoice.clear, contact.selected
 */

import { PanClient } from '../../core/src/components/pan-client.mjs';

class PanInvoiceHeader extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(document, 'pan-bus');
    this._data = {
      from: { name: '', address: '', city: '', phone: '', email: '' },
      to: { name: '', address: '', city: '', phone: '', email: '' },
      invoiceNumber: '',
      invoiceDate: '',
      dueDate: ''
    };
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.client.subscribe('invoice.load', (msg) => {
      if (msg.data.header) {
        this._data = { ...this._data, ...msg.data.header };
        this.render();
      }
    });

    this.client.subscribe('invoice.clear', () => {
      this._data = {
        from: { name: '', address: '', city: '', phone: '', email: '' },
        to: { name: '', address: '', city: '', phone: '', email: '' },
        invoiceNumber: '',
        invoiceDate: '',
        dueDate: ''
      };
      this.render();
    });

    this.client.subscribe('contact.selected', (msg) => {
      this._data.to = { ...this._data.to, ...msg.data };
      this.render();
    });
  }

  attachEventListeners() {
    this.addEventListener('blur', (e) => {
      if (e.target.hasAttribute('contenteditable')) {
        this.handleFieldChange(e);
      }
    }, true);

    this.addEventListener('input', (e) => {
      if (e.target.type === 'date') {
        this.handleFieldChange(e);
      }
    });
  }

  handleFieldChange(e) {
    const field = e.target.dataset.field;
    const section = e.target.dataset.section;
    const value = e.target.textContent || e.target.value;

    if (section && field) {
      this._data[section][field] = value;
    } else if (field) {
      this._data[field] = value;
    }

    this.client.publish('invoice.header.changed', this._data);
  }

  render() {
    this.innerHTML = `
      <div class="invoice-header">
        <div class="header-row">
          <div class="from-section">
            <h3>From</h3>
            <div contenteditable="true" data-section="from" data-field="name" data-placeholder="Company Name">${this._data.from.name || ''}</div>
            <div contenteditable="true" data-section="from" data-field="address" data-placeholder="Address">${this._data.from.address || ''}</div>
            <div contenteditable="true" data-section="from" data-field="city" data-placeholder="City, State ZIP">${this._data.from.city || ''}</div>
            <div contenteditable="true" data-section="from" data-field="phone" data-placeholder="Phone">${this._data.from.phone || ''}</div>
            <div contenteditable="true" data-section="from" data-field="email" data-placeholder="Email">${this._data.from.email || ''}</div>
          </div>
          <div class="to-section">
            <h3>Bill To</h3>
            <div contenteditable="true" data-section="to" data-field="name" data-placeholder="Client Name">${this._data.to.name || ''}</div>
            <div contenteditable="true" data-section="to" data-field="address" data-placeholder="Address">${this._data.to.address || ''}</div>
            <div contenteditable="true" data-section="to" data-field="city" data-placeholder="City, State ZIP">${this._data.to.city || ''}</div>
            <div contenteditable="true" data-section="to" data-field="phone" data-placeholder="Phone">${this._data.to.phone || ''}</div>
            <div contenteditable="true" data-section="to" data-field="email" data-placeholder="Email">${this._data.to.email || ''}</div>
          </div>
        </div>
        <div class="invoice-meta">
          <div class="field">
            <label>Invoice #</label>
            <input type="text" data-field="invoiceNumber" value="${this._data.invoiceNumber || ''}" />
          </div>
          <div class="field">
            <label>Date</label>
            <input type="date" data-field="invoiceDate" value="${this._data.invoiceDate || ''}" />
          </div>
          <div class="field">
            <label>Due Date</label>
            <input type="date" data-field="dueDate" value="${this._data.dueDate || ''}" />
          </div>
        </div>
      </div>
    `;
  }
}

customElements.define('pan-invoice-header', PanInvoiceHeader);
