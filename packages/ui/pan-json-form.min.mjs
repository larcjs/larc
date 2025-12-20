/**
 * @component pan-json-form
 * @category Forms & Input
 * @status stable
 * @since 1.0.0
 * 
 * @description
 * JSON-driven form generator that renders form fields dynamically from a schema
 * 
 * Generates complete forms from JSON schemas including labels, inputs, validation,
 * and layout. Supports all standard HTML input types plus custom layouts, CSS classes,
 * inline styles, and conditional visibility. Integrates with PAN for data flow and
 * form submission.
 * 
 * @attr {string} resource - Resource name for PAN topics (default: 'form')
 * @attr {string} schema - JSON string defining form structure
 * @attr {string} url - URL to fetch JSON schema from
 * @attr {string} data - JSON string for initial form values
 * @attr {string} layout - Layout mode: 'vertical', 'horizontal', 'grid' (default: 'vertical')
 * @attr {boolean} auto-validate - Validate on input change (default: false)
 * @attr {boolean} show-reset - Show reset button (default: true)
 * 
 * @subscribes {resource}.schema.set { schema } - Set form schema
 * @subscribes {resource}.data.set { data } - Set form values
 * @subscribes {resource}.data.get - Request current form data
 * @subscribes {resource}.validate - Trigger validation
 * @subscribes {resource}.submit - Trigger form submission
 * @subscribes {resource}.reset - Reset form to initial state
 * 
 * @publishes {resource}.data { data } - Current form data (response to data.get)
 * @publishes {resource}.submit { data, isValid } - Form submitted with data
 * @publishes {resource}.change { field, value, data } - Field value changed
 * @publishes {resource}.validation { isValid, errors } - Validation result
 * @publishes {resource}.ready - Form rendered and ready
 * 
 * @related pan-form, pan-schema-form, pan-validation
 * 
 * @example
 * ```html
 * <!-- Basic form with inline schema -->
 * <pan-json-form 
 *   resource="contact"
 *   schema='{
 *     "fields": [
 *       {
 *         "name": "email",
 *         "type": "email",
 *         "label": "Email Address",
 *         "required": true,
 *         "className": "form-control"
 *       },
 *       {
 *         "name": "message",
 *         "type": "textarea",
 *         "label": "Message",
 *         "rows": 5,
 *         "className": "form-control"
 *       }
 *     ]
 *   }'>
 * </pan-json-form>
 * ```
 * 
 * @example
 * ```html
 * <!-- Form with URL schema and grid layout -->
 * <pan-json-form
 *   resource="registration"
 *   url="/api/forms/registration.json"
 *   layout="grid"
 *   auto-validate>
 * </pan-json-form>
 * ```
 * 
 * @example
 * ```javascript
 * // Programmatic form control
 * import { PanClient } from '@larcjs/core';
 * const pc = new PanClient();
 * 
 * // Set form schema
 * pc.publish({
 *   topic: 'contact.schema.set',
 *   data: {
 *     schema: {
 *       fields: [
 *         { name: 'name', type: 'text', label: 'Full Name', required: true },
 *         { name: 'email', type: 'email', label: 'Email', required: true },
 *         { name: 'role', type: 'select', label: 'Role', options: [
 *           { value: 'dev', label: 'Developer' },
 *           { value: 'designer', label: 'Designer' }
 *         ]}
 *       ]
 *     }
 *   }
 * });
 * 
 * // Listen for form submission
 * pc.subscribe('contact.submit', (msg) => {
 *   console.log('Form data:', msg.data.data);
 *   console.log('Is valid:', msg.data.isValid);
 * });
 * 
 * // Get current form data
 * pc.subscribe('contact.data', (msg) => {
 *   console.log('Current data:', msg.data.data);
 * });
 * pc.publish({ topic: 'contact.data.get' });
 * ```
 * 
 * @example
 * ```json
 * // Full schema example
 * {
 *   "fields": [
 *     {
 *       "name": "username",
 *       "type": "text",
 *       "label": "Username",
 *       "placeholder": "Enter username",
 *       "required": true,
 *       "minLength": 3,
 *       "maxLength": 20,
 *       "className": "form-control",
 *       "style": { "marginBottom": "1rem" },
 *       "pattern": "^[a-zA-Z0-9_]+$",
 *       "help": "Letters, numbers, and underscore only"
 *     },
 *     {
 *       "name": "age",
 *       "type": "number",
 *       "label": "Age",
 *       "min": 18,
 *       "max": 100,
 *       "className": "form-control"
 *     },
 *     {
 *       "name": "bio",
 *       "type": "textarea",
 *       "label": "Bio",
 *       "rows": 4,
 *       "maxLength": 500,
 *       "className": "form-control"
 *     },
 *     {
 *       "name": "country",
 *       "type": "select",
 *       "label": "Country",
 *       "options": [
 *         { "value": "us", "label": "United States" },
 *         { "value": "uk", "label": "United Kingdom" },
 *         { "value": "ca", "label": "Canada" }
 *       ],
 *       "className": "form-control"
 *     },
 *     {
 *       "name": "interests",
 *       "type": "checkbox-group",
 *       "label": "Interests",
 *       "options": [
 *         { "value": "coding", "label": "Coding" },
 *         { "value": "design", "label": "Design" },
 *         { "value": "writing", "label": "Writing" }
 *       ]
 *     },
 *     {
 *       "name": "newsletter",
 *       "type": "checkbox",
 *       "label": "Subscribe to newsletter",
 *       "className": "form-check-input"
 *     }
 *   ]
 * }
 * ```
 */

import { PanClient } from '../core/pan-client.mjs';

export class PanJsonForm extends HTMLElement {
  static get observedAttributes() {
    return ['resource', 'schema', 'url', 'data', 'layout', 'auto-validate', 'show-reset'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.pc = new PanClient(this);
    this.schema = null;
    this.formData = {};
    this.initialData = {};
    this.validationErrors = {};
    this._offs = [];
  }

  connectedCallback() {
    this.loadSchema();
    this.setupTopics();
    this.render();
  }

  disconnectedCallback() {
    this._offs.forEach(off => off());
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    
    if (name === 'schema' && newValue) {
      try {
        this.schema = JSON.parse(newValue);
        this.render();
      } catch (e) {
        console.error('[pan-json-form] Invalid schema JSON:', e);
      }
    } else if (name === 'data' && newValue) {
      try {
        this.formData = JSON.parse(newValue);
        this.initialData = { ...this.formData };
        this.render();
      } catch (e) {
        console.error('[pan-json-form] Invalid data JSON:', e);
      }
    } else if (this.isConnected) {
      this.render();
    }
  }

  get resource() {
    return this.getAttribute('resource') || 'form';
  }

  get layout() {
    return this.getAttribute('layout') || 'vertical';
  }

  get autoValidate() {
    return this.hasAttribute('auto-validate');
  }

  get showReset() {
    return this.hasAttribute('show-reset') ? this.getAttribute('show-reset') !== 'false' : true;
  }

  async loadSchema() {
    const url = this.getAttribute('url');
    if (!url) return;

    try {
      const response = await fetch(url);
      this.schema = await response.json();
      this.render();
    } catch (e) {
      console.error('[pan-json-form] Failed to load schema from URL:', e);
    }
  }

  setupTopics() {
    this._offs.push(
      this.pc.subscribe(`${this.resource}.schema.set`, (msg) => {
        if (msg.data.schema) {
          this.schema = msg.data.schema;
          this.render();
        }
      })
    );

    this._offs.push(
      this.pc.subscribe(`${this.resource}.data.set`, (msg) => {
        if (msg.data.data) {
          this.formData = { ...msg.data.data };
          this.updateFormValues();
        }
      })
    );

    this._offs.push(
      this.pc.subscribe(`${this.resource}.data.get`, () => {
        this.pc.publish({
          topic: `${this.resource}.data`,
          data: { data: this.formData }
        });
      })
    );

    this._offs.push(
      this.pc.subscribe(`${this.resource}.validate`, () => {
        this.validate();
      })
    );

    this._offs.push(
      this.pc.subscribe(`${this.resource}.submit`, () => {
        this.handleSubmit(new Event('submit'));
      })
    );

    this._offs.push(
      this.pc.subscribe(`${this.resource}.reset`, () => {
        this.reset();
      })
    );
  }

  updateFormValues() {
    if (!this.schema?.fields) return;

    this.schema.fields.forEach(field => {
      const input = this.shadowRoot.querySelector(`[name="${field.name}"]`);
      if (!input) return;

      const value = this.formData[field.name];
      
      if (field.type === 'checkbox') {
        input.checked = !!value;
      } else if (field.type === 'checkbox-group' || field.type === 'radio') {
        const inputs = this.shadowRoot.querySelectorAll(`[name="${field.name}"]`);
        inputs.forEach(inp => {
          if (Array.isArray(value)) {
            inp.checked = value.includes(inp.value);
          } else {
            inp.checked = inp.value === value;
          }
        });
      } else {
        input.value = value ?? '';
      }
    });
  }

  validate() {
    if (!this.schema?.fields) return true;

    this.validationErrors = {};
    let isValid = true;

    this.schema.fields.forEach(field => {
      const value = this.formData[field.name];
      const errors = [];

      // Required validation
      if (field.required && !value) {
        errors.push(`${field.label || field.name} is required`);
        isValid = false;
      }

      // Type-specific validation
      if (value) {
        if (field.type === 'email' && !this.isValidEmail(value)) {
          errors.push('Invalid email address');
          isValid = false;
        }

        if (field.type === 'number') {
          const num = Number(value);
          if (field.min !== undefined && num < field.min) {
            errors.push(`Must be at least ${field.min}`);
            isValid = false;
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(`Must be at most ${field.max}`);
            isValid = false;
          }
        }

        if (field.minLength && value.length < field.minLength) {
          errors.push(`Must be at least ${field.minLength} characters`);
          isValid = false;
        }

        if (field.maxLength && value.length > field.maxLength) {
          errors.push(`Must be at most ${field.maxLength} characters`);
          isValid = false;
        }

        if (field.pattern && !new RegExp(field.pattern).test(value)) {
          errors.push(field.patternMessage || 'Invalid format');
          isValid = false;
        }
      }

      if (errors.length > 0) {
        this.validationErrors[field.name] = errors;
      }
    });

    this.pc.publish({
      topic: `${this.resource}.validation`,
      data: { isValid, errors: this.validationErrors }
    });

    this.renderErrors();
    return isValid;
  }

  isValidEmail(email) {
    // Use length-limited regex to prevent ReDoS attacks
    return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{1,63}$/.test(email);
  }

  renderErrors() {
    Object.keys(this.validationErrors).forEach(fieldName => {
      const errorContainer = this.shadowRoot.querySelector(`#error-${fieldName}`);
      if (errorContainer) {
        errorContainer.innerHTML = this.validationErrors[fieldName]
          .map(err => `<div class="error-message">${err}</div>`)
          .join('');
        errorContainer.style.display = 'block';
      }
    });

    // Clear errors for valid fields
    if (this.schema?.fields) {
      this.schema.fields.forEach(field => {
        if (!this.validationErrors[field.name]) {
          const errorContainer = this.shadowRoot.querySelector(`#error-${field.name}`);
          if (errorContainer) {
            errorContainer.innerHTML = '';
            errorContainer.style.display = 'none';
          }
        }
      });
    }
  }

  handleInput(e) {
    const field = this.schema.fields.find(f => f.name === e.target.name);
    if (!field) return;

    let value;
    
    if (field.type === 'checkbox') {
      value = e.target.checked;
    } else if (field.type === 'checkbox-group') {
      const checked = Array.from(
        this.shadowRoot.querySelectorAll(`[name="${field.name}"]:checked`)
      ).map(input => input.value);
      value = checked;
    } else if (field.type === 'number') {
      value = e.target.value ? Number(e.target.value) : null;
    } else {
      value = e.target.value;
    }

    this.formData[field.name] = value;

    if (this.autoValidate) {
      this.validate();
    }

    this.pc.publish({
      topic: `${this.resource}.change`,
      data: { field: field.name, value, data: this.formData }
    });
  }

  handleSubmit(e) {
    e.preventDefault();
    const isValid = this.validate();

    this.pc.publish({
      topic: `${this.resource}.submit`,
      data: { data: this.formData, isValid }
    });
  }

  reset() {
    this.formData = { ...this.initialData };
    this.validationErrors = {};
    this.updateFormValues();
    this.renderErrors();
  }

  renderField(field) {
    const value = this.formData[field.name] ?? field.defaultValue ?? '';
    const className = field.className || '';
    const style = field.style ? Object.entries(field.style).map(([k, v]) => `${k}: ${v}`).join('; ') : '';
    
    let inputHTML = '';

    switch (field.type) {
      case 'textarea':
        inputHTML = `
          <textarea
            name="${field.name}"
            class="${className}"
            style="${style}"
            rows="${field.rows || 3}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.readonly ? 'readonly' : ''}
            ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
          >${value}</textarea>
        `;
        break;

      case 'select':
        const options = (field.options || []).map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return `<option value="${optValue}" ${value === optValue ? 'selected' : ''}>${optLabel}</option>`;
        }).join('');
        
        inputHTML = `
          <select
            name="${field.name}"
            class="${className}"
            style="${style}"
            ${field.required ? 'required' : ''}
            ${field.readonly ? 'disabled' : ''}
          >
            ${field.placeholder ? `<option value="">${field.placeholder}</option>` : ''}
            ${options}
          </select>
        `;
        break;

      case 'checkbox':
        inputHTML = `
          <label class="checkbox-label">
            <input
              type="checkbox"
              name="${field.name}"
              class="${className}"
              style="${style}"
              value="true"
              ${value ? 'checked' : ''}
              ${field.readonly ? 'disabled' : ''}
            />
            <span>${field.label}</span>
          </label>
        `;
        return `
          <div class="field-group" data-field="${field.name}">
            ${inputHTML}
            ${field.help ? `<div class="help-text">${field.help}</div>` : ''}
            <div id="error-${field.name}" class="error-container"></div>
          </div>
        `;

      case 'checkbox-group':
        const checkboxes = (field.options || []).map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          const isChecked = Array.isArray(value) && value.includes(optValue);
          return `
            <label class="checkbox-label">
              <input
                type="checkbox"
                name="${field.name}"
                value="${optValue}"
                ${isChecked ? 'checked' : ''}
                ${field.readonly ? 'disabled' : ''}
              />
              <span>${optLabel}</span>
            </label>
          `;
        }).join('');
        
        inputHTML = `<div class="checkbox-group">${checkboxes}</div>`;
        break;

      case 'radio':
        const radios = (field.options || []).map(opt => {
          const optValue = typeof opt === 'string' ? opt : opt.value;
          const optLabel = typeof opt === 'string' ? opt : opt.label;
          return `
            <label class="radio-label">
              <input
                type="radio"
                name="${field.name}"
                value="${optValue}"
                ${value === optValue ? 'checked' : ''}
                ${field.readonly ? 'disabled' : ''}
              />
              <span>${optLabel}</span>
            </label>
          `;
        }).join('');
        
        inputHTML = `<div class="radio-group">${radios}</div>`;
        break;

      default:
        inputHTML = `
          <input
            type="${field.type || 'text'}"
            name="${field.name}"
            class="${className}"
            style="${style}"
            value="${value}"
            placeholder="${field.placeholder || ''}"
            ${field.required ? 'required' : ''}
            ${field.readonly ? 'readonly' : ''}
            ${field.min !== undefined ? `min="${field.min}"` : ''}
            ${field.max !== undefined ? `max="${field.max}"` : ''}
            ${field.minLength ? `minlength="${field.minLength}"` : ''}
            ${field.maxLength ? `maxlength="${field.maxLength}"` : ''}
            ${field.pattern ? `pattern="${field.pattern}"` : ''}
          />
        `;
    }

    // Don't render label for checkbox type (it's inline with the input)
    if (field.type === 'checkbox') {
      return inputHTML;
    }

    return `
      <div class="field-group" data-field="${field.name}">
        ${field.label ? `<label class="field-label">${field.label}${field.required ? ' <span class="required">*</span>' : ''}</label>` : ''}
        ${inputHTML}
        ${field.help ? `<div class="help-text">${field.help}</div>` : ''}
        <div id="error-${field.name}" class="error-container"></div>
      </div>
    `;
  }

  render() {
    if (!this.schema?.fields) {
      this.shadowRoot.innerHTML = '<div class="no-schema">No form schema provided</div>';
      return;
    }

    const layoutClass = `form-layout-${this.layout}`;
    const fieldsHTML = this.schema.fields.map(field => this.renderField(field)).join('');

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .form-container {
          width: 100%;
        }

        .form-layout-vertical .field-group {
          margin-bottom: 1.5rem;
        }

        .form-layout-horizontal .field-group {
          display: grid;
          grid-template-columns: 150px 1fr;
          gap: 1rem;
          align-items: start;
          margin-bottom: 1rem;
        }

        .form-layout-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1.5rem;
        }

        .field-label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--color-text, #333);
        }

        .required {
          color: var(--color-danger, #e74c3c);
        }

        input[type="text"],
        input[type="email"],
        input[type="password"],
        input[type="number"],
        input[type="tel"],
        input[type="url"],
        input[type="date"],
        textarea,
        select {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: 14px;
          font-family: inherit;
          background: var(--color-surface, white);
          color: var(--color-text, inherit);
        }

        input:focus,
        textarea:focus,
        select:focus {
          outline: none;
          border-color: var(--color-primary, #3498db);
          box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.1);
        }

        textarea {
          resize: vertical;
        }

        .checkbox-label,
        .radio-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          margin-bottom: 0.5rem;
        }

        .checkbox-group,
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .help-text {
          margin-top: 0.25rem;
          font-size: 12px;
          color: var(--color-text-muted, #666);
        }

        .error-container {
          display: none;
          margin-top: 0.25rem;
        }

        .error-message {
          color: var(--color-danger, #e74c3c);
          font-size: 12px;
          margin-top: 0.25rem;
        }

        .form-actions {
          margin-top: 2rem;
          display: flex;
          gap: 1rem;
        }

        button {
          padding: 0.6rem 1.5rem;
          border: 1px solid var(--color-border, #ddd);
          border-radius: 4px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          background: var(--color-surface, white);
          color: var(--color-text, inherit);
        }

        button:hover {
          background: var(--color-surface-alt, #f5f5f5);
        }

        .btn-submit {
          background: var(--color-primary, #3498db);
          color: white;
          border-color: var(--color-primary, #3498db);
        }

        .btn-submit:hover {
          background: var(--color-primary-dark, #2980b9);
        }

        .btn-reset {
          background: var(--color-secondary, #95a5a6);
          color: white;
          border-color: var(--color-secondary, #95a5a6);
        }

        .btn-reset:hover {
          background: var(--color-secondary-light, #7f8c8d);
        }

        .no-schema {
          padding: 2rem;
          text-align: center;
          color: var(--color-text-muted, #999);
        }
      </style>

      <div class="form-container">
        <form class="${layoutClass}">
          ${fieldsHTML}
          
          <div class="form-actions">
            <button type="submit" class="btn-submit">Submit</button>
            ${this.showReset ? '<button type="button" class="btn-reset">Reset</button>' : ''}
          </div>
        </form>
      </div>
    `;

    // Attach event listeners
    const form = this.shadowRoot.querySelector('form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
      
      const inputs = form.querySelectorAll('input, textarea, select');
      inputs.forEach(input => {
        input.addEventListener('input', (e) => this.handleInput(e));
        input.addEventListener('change', (e) => this.handleInput(e));
      });

      const resetBtn = form.querySelector('.btn-reset');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => this.reset());
      }
    }

    // Publish ready event
    this.pc.publish({
      topic: `${this.resource}.ready`,
      data: {}
    });
  }
}

customElements.define('pan-json-form', PanJsonForm);
