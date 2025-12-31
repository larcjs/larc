/**
 * pan-schema-validator - Runtime validation using JSON Schema
 *
 * Validates PAN messages against JSON Schema definitions. No build step required.
 * Uses lightweight JSON Schema validation (subset of Draft-07).
 *
 * @example
 * <pan-schema-validator topic="users.item.*" strict>
 *   <script type="application/json">
 *   {
 *     "type": "object",
 *     "properties": {
 *       "id": {"type": "string"},
 *       "email": {"type": "string", "format": "email"},
 *       "age": {"type": "number", "minimum": 0}
 *     },
 *     "required": ["id", "email"]
 *   }
 *   </script>
 * </pan-schema-validator>
 *
 * @attribute {string} topic - Topic pattern to validate
 * @attribute {boolean} strict - Reject invalid messages (default: false, logs only)
 * @attribute {boolean} debug - Enable debug logging
 *
 * @topic {topic}.valid - Message passed validation
 * @topic {topic}.invalid - Message failed validation
 */

export class PanSchemaValidator extends HTMLElement {
  static observedAttributes = ['topic', 'strict', 'debug'];

  constructor() {
    super();
    this._schema = null;
    this._subscription = null;
    this._panClient = null;
    this._validators = new Map(); // Cache compiled validators
  }

  connectedCallback() {
    this._waitForPanBus().then(() => {
      this._initialize();
    });
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'topic') {
      this._cleanup();
      this._initialize();
    }
  }

  async _waitForPanBus() {
    let panBus = document.querySelector('pan-bus');

    if (panBus && panBus.panClient) {
      return;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        panBus = document.querySelector('pan-bus');
        if (panBus && panBus.panClient) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  _initialize() {
    this._panClient = this._getPanClient();
    if (!this._panClient) {
      console.error('pan-schema-validator could not find pan-client');
      return;
    }

    // Extract schema
    this._schema = this._extractSchema();
    if (!this._schema) {
      console.error('pan-schema-validator requires a JSON schema in a <script> element');
      return;
    }

    // Subscribe to topic
    const topic = this.getAttribute('topic');
    if (!topic) {
      console.error('pan-schema-validator requires a "topic" attribute');
      return;
    }

    this._subscription = this._panClient.subscribe(topic, (message) => {
      this._validateMessage(message);
    });

    this._log('Initialized', { topic, schema: this._schema });
  }

  _cleanup() {
    if (this._subscription) {
      this._panClient?.unsubscribe(this.getAttribute('topic'), this._subscription);
      this._subscription = null;
    }
  }

  _extractSchema() {
    const scriptEl = this.querySelector('script[type="application/json"]');
    if (!scriptEl) return null;

    try {
      return JSON.parse(scriptEl.textContent);
    } catch (e) {
      console.error('Failed to parse JSON schema:', e);
      return null;
    }
  }

  _validateMessage(message) {
    const result = this.validate(message.data, this._schema);

    if (result.valid) {
      this._publishEvent('valid', {
        topic: message.topic,
        timestamp: Date.now()
      });

      this._log('Valid message', { topic: message.topic });
    } else {
      this._publishEvent('invalid', {
        topic: message.topic,
        errors: result.errors,
        timestamp: Date.now()
      });

      const strict = this.hasAttribute('strict');

      if (strict) {
        console.error('Validation failed (strict mode):', {
          topic: message.topic,
          errors: result.errors,
          data: message.data
        });

        // Optionally prevent propagation by publishing a cancel event
        this._panClient.publish(`${message.topic}.cancel`, {
          reason: 'validation-failed',
          errors: result.errors
        }, { retain: false });
      } else {
        console.warn('Validation warning:', {
          topic: message.topic,
          errors: result.errors
        });
      }

      this._log('Invalid message', {
        topic: message.topic,
        errors: result.errors
      });
    }
  }

  /**
   * Validate data against a JSON Schema
   * Supports a subset of JSON Schema Draft-07:
   * - type, properties, required, items
   * - minimum, maximum, minLength, maxLength
   * - pattern, format (email, date-time, uri)
   * - enum, const
   */
  validate(data, schema, path = '') {
    const errors = [];

    // Type validation
    if (schema.type) {
      const actualType = this._getType(data);

      if (Array.isArray(schema.type)) {
        if (!schema.type.includes(actualType)) {
          errors.push({
            path,
            message: `Expected type ${schema.type.join(' or ')}, got ${actualType}`
          });
        }
      } else if (actualType !== schema.type) {
        errors.push({
          path,
          message: `Expected type ${schema.type}, got ${actualType}`
        });
        return { valid: false, errors }; // Early return for type mismatch
      }
    }

    // Const validation
    if (schema.const !== undefined) {
      if (data !== schema.const) {
        errors.push({
          path,
          message: `Expected ${JSON.stringify(schema.const)}, got ${JSON.stringify(data)}`
        });
      }
    }

    // Enum validation
    if (schema.enum) {
      if (!schema.enum.includes(data)) {
        errors.push({
          path,
          message: `Value must be one of ${JSON.stringify(schema.enum)}`
        });
      }
    }

    // String validations
    if (typeof data === 'string') {
      if (schema.minLength !== undefined && data.length < schema.minLength) {
        errors.push({
          path,
          message: `String length ${data.length} is less than minimum ${schema.minLength}`
        });
      }

      if (schema.maxLength !== undefined && data.length > schema.maxLength) {
        errors.push({
          path,
          message: `String length ${data.length} exceeds maximum ${schema.maxLength}`
        });
      }

      if (schema.pattern) {
        const regex = new RegExp(schema.pattern);
        if (!regex.test(data)) {
          errors.push({
            path,
            message: `String does not match pattern ${schema.pattern}`
          });
        }
      }

      if (schema.format) {
        if (!this._validateFormat(data, schema.format)) {
          errors.push({
            path,
            message: `String does not match format ${schema.format}`
          });
        }
      }
    }

    // Number validations
    if (typeof data === 'number') {
      if (schema.minimum !== undefined && data < schema.minimum) {
        errors.push({
          path,
          message: `Value ${data} is less than minimum ${schema.minimum}`
        });
      }

      if (schema.maximum !== undefined && data > schema.maximum) {
        errors.push({
          path,
          message: `Value ${data} exceeds maximum ${schema.maximum}`
        });
      }

      if (schema.multipleOf !== undefined && data % schema.multipleOf !== 0) {
        errors.push({
          path,
          message: `Value ${data} is not a multiple of ${schema.multipleOf}`
        });
      }
    }

    // Array validations
    if (Array.isArray(data)) {
      if (schema.minItems !== undefined && data.length < schema.minItems) {
        errors.push({
          path,
          message: `Array length ${data.length} is less than minimum ${schema.minItems}`
        });
      }

      if (schema.maxItems !== undefined && data.length > schema.maxItems) {
        errors.push({
          path,
          message: `Array length ${data.length} exceeds maximum ${schema.maxItems}`
        });
      }

      if (schema.uniqueItems && this._hasDuplicates(data)) {
        errors.push({
          path,
          message: 'Array items must be unique'
        });
      }

      if (schema.items) {
        data.forEach((item, index) => {
          const itemResult = this.validate(item, schema.items, `${path}[${index}]`);
          errors.push(...itemResult.errors);
        });
      }
    }

    // Object validations
    if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
      // Required properties
      if (schema.required) {
        for (const prop of schema.required) {
          if (!(prop in data)) {
            errors.push({
              path,
              message: `Missing required property "${prop}"`
            });
          }
        }
      }

      // Properties validation
      if (schema.properties) {
        for (const [prop, propSchema] of Object.entries(schema.properties)) {
          if (prop in data) {
            const propPath = path ? `${path}.${prop}` : prop;
            const propResult = this.validate(data[prop], propSchema, propPath);
            errors.push(...propResult.errors);
          }
        }
      }

      // Additional properties
      if (schema.additionalProperties === false) {
        const allowedProps = new Set(Object.keys(schema.properties || {}));
        for (const prop of Object.keys(data)) {
          if (!allowedProps.has(prop)) {
            errors.push({
              path,
              message: `Additional property "${prop}" is not allowed`
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  _getType(value) {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'number';
    }
    return typeof value;
  }

  _validateFormat(value, format) {
    switch (format) {
      case 'email':
        // Use length-limited regex to prevent ReDoS attacks
        return /^[^\s@]{1,64}@[^\s@]{1,253}\.[^\s@]{1,63}$/.test(value);

      case 'uri':
      case 'url':
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }

      case 'date':
        return /^\d{4}-\d{2}-\d{2}$/.test(value) && !isNaN(Date.parse(value));

      case 'time':
        return /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(value);

      case 'date-time':
        return !isNaN(Date.parse(value));

      case 'uuid':
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);

      case 'ipv4':
        return /^(\d{1,3}\.){3}\d{1,3}$/.test(value) &&
               value.split('.').every(part => parseInt(part) <= 255);

      case 'ipv6':
        return /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(value);

      default:
        return true; // Unknown format, pass validation
    }
  }

  _hasDuplicates(array) {
    const seen = new Set();
    for (const item of array) {
      const key = JSON.stringify(item);
      if (seen.has(key)) return true;
      seen.add(key);
    }
    return false;
  }

  _publishEvent(eventType, data) {
    if (!this._panClient) return;

    const topic = this.getAttribute('topic');
    this._panClient.publish(`${topic}.${eventType}`, data, { retain: false });
  }

  _getPanClient() {
    if (this._panClient) return this._panClient;

    const panBus = document.querySelector('pan-bus');
    const panClient = panBus?.panClient || document.querySelector('pan-client');

    if (panClient) {
      this._panClient = panClient.client || panClient;
    }

    return this._panClient;
  }

  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-schema-validator]', ...args);
    }
  }

  // Public API
  getSchema() {
    return this._schema;
  }

  setSchema(schema) {
    this._schema = schema;
    this._log('Schema updated', schema);
  }
}

customElements.define('pan-schema-validator', PanSchemaValidator);
