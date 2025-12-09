/**
 * <pan-invoice-totals>
 * Displays and calculates invoice totals
 *
 * PAN Events:
 * - Publishes: invoice.total.calculated
 * - Subscribes: invoice.totals.changed, invoice.load, invoice.clear
 */

import { PanClient } from '../../core/src/components/pan-client.mjs';

class PanInvoiceTotals extends HTMLElement {
  constructor() {
    super();
    this.client = new PanClient(document, 'pan-bus');
    this._subtotal = 0;
    this._taxRate = 0;
    this._tax = 0;
    this._total = 0;
    this._notes = '';
  }

  connectedCallback() {
    this.render();
    this.subscribeToEvents();
  }

  subscribeToEvents() {
    this.client.subscribe('invoice.totals.changed', (msg) => {
      if (msg.data.subtotal !== undefined) {
        this._subtotal = msg.data.subtotal;
        this.calculate();
        this.render();
      }
    });

    this.client.subscribe('invoice.load', (msg) => {
      if (msg.data.totals) {
        this._subtotal = msg.data.totals.subtotal || 0;
        this._taxRate = msg.data.totals.taxRate || 0;
        this._notes = msg.data.totals.notes || '';
        this.calculate();
        this.render();
      }
    });

    this.client.subscribe('invoice.clear', () => {
      this._subtotal = 0;
      this._taxRate = 0;
      this._tax = 0;
      this._total = 0;
      this._notes = '';
      this.render();
    });
  }

  calculate() {
    this._tax = this._subtotal * (this._taxRate / 100);
    this._total = this._subtotal + this._tax;

    this.client.publish('invoice.total.calculated', {
      subtotal: this._subtotal,
      taxRate: this._taxRate,
      tax: this._tax,
      total: this._total,
      notes: this._notes
    });
  }

  handleTaxRateChange(value) {
    this._taxRate = parseFloat(value) || 0;
    this.calculate();
    this.render();
  }

  handleNotesChange(value) {
    this._notes = value;
    this.client.publish('invoice.total.calculated', {
      subtotal: this._subtotal,
      taxRate: this._taxRate,
      tax: this._tax,
      total: this._total,
      notes: this._notes
    });
  }

  render() {
    this.innerHTML = `
      <div class="invoice-totals">
        <div class="totals-grid">
          <div class="totals-row">
            <span class="label">Subtotal:</span>
            <span class="value">$${this._subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span class="label">
              Tax
              <input
                type="number"
                step="0.1"
                value="${this._taxRate}"
                placeholder="0"
                oninput="this.closest('pan-invoice-totals').handleTaxRateChange(this.value)"
                style="width: 50px; margin-left: 5px;"
              />%:
            </span>
            <span class="value">$${this._tax.toFixed(2)}</span>
          </div>
          <div class="totals-row total-row">
            <span class="label">Total:</span>
            <span class="value total">$${this._total.toFixed(2)}</span>
          </div>
        </div>
        <div class="notes-section">
          <label>Notes / Payment Terms:</label>
          <textarea
            rows="3"
            placeholder="Payment terms, notes, etc."
            onblur="this.closest('pan-invoice-totals').handleNotesChange(this.value)"
          >${this._notes || ''}</textarea>
        </div>
      </div>
    `;
  }
}

customElements.define('pan-invoice-totals', PanInvoiceTotals);
