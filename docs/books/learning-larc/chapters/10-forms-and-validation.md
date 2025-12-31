# Forms and Validation

Forms are the primary way users input data into web applications. LARC provides patterns for building accessible, validated forms using web standards and the PAN bus.

## Form Components

### Basic Form Component

```javascript
class ContactForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = this.shadowRoot.querySelector('form');

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this.validate()) {
        const data = this.getFormData();
        await this.handleSubmit(data);
      }
    });
  }

  getFormData() {
    const form = this.shadowRoot.querySelector('form');
    const formData = new FormData(form);
    return Object.fromEntries(formData);
  }

  validate() {
    const form = this.shadowRoot.querySelector('form');
    return form.checkValidity();
  }

  async handleSubmit(data) {
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        pan.publish('form.submitted', { form: 'contact', data });
        this.showSuccess();
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      this.showError(error.message);
    }
  }

  showSuccess() {
    pan.publish('notification.success', { message: 'Form submitted successfully!' });
    this.shadowRoot.querySelector('form').reset();
  }

  showError(message) {
    pan.publish('notification.error', { message });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        form { max-width: 500px; }
        .field { margin-bottom: 16px; }
        label {
          display: block;
          margin-bottom: 4px;
          font-weight: 600;
        }
        input, textarea {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e0;
          border-radius: 4px;
        }
        input:invalid, textarea:invalid {
          border-color: #fc8181;
        }
        button {
          background: #667eea;
          color: white;
          padding: 10px 24px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
      </style>

      <form>
        <div class="field">
          <label for="name">Name *</label>
          <input type="text" id="name" name="name" required minlength="2">
        </div>

        <div class="field">
          <label for="email">Email *</label>
          <input type="email" id="email" name="email" required>
        </div>

        <div class="field">
          <label for="message">Message *</label>
          <textarea id="message" name="message" required minlength="10" rows="5"></textarea>
        </div>

        <button type="submit">Send Message</button>
      </form>
    `;
  }
}

customElements.define('contact-form', ContactForm);
```

## Two-Way Data Binding

Sync form inputs with component state:

```javascript
class DataBoundForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      firstName: '',
      lastName: '',
      email: ''
    };
  }

  connectedCallback() {
    this.render();
    this.bindInputs();
  }

  bindInputs() {
    const inputs = this.shadowRoot.querySelectorAll('input');

    inputs.forEach(input => {
      // Update state when input changes
      input.addEventListener('input', (e) => {
        this.state[e.target.name] = e.target.value;
        pan.publish('form.state.changed', { state: this.state });
      });

      // Update input when state changes
      pan.subscribe('form.state.update', (updates) => {
        if (updates[input.name] !== undefined) {
          input.value = updates[input.name];
          this.state[input.name] = updates[input.name];
        }
      });
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <form>
        <input type="text" name="firstName" value="${this.state.firstName}" placeholder="First Name">
        <input type="text" name="lastName" value="${this.state.lastName}" placeholder="Last Name">
        <input type="email" name="email" value="${this.state.email}" placeholder="Email">
      </form>
      <div class="preview">
        <p>Hello, ${this.state.firstName} ${this.state.lastName}!</p>
        <p>Email: ${this.state.email}</p>
      </div>
    `;
  }
}
```

## Validation Strategies

### Native HTML5 Validation

```html
<input type="email" required>
<input type="number" min="1" max="100">
<input type="text" pattern="[A-Za-z]{3,}" title="At least 3 letters">
<input type="url" required>
```

### Custom Validation

```javascript
class ValidatedInput extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <input type="text" id="input">
      <span class="error"></span>
    `;

    const input = this.querySelector('input');
    const error = this.querySelector('.error');

    input.addEventListener('blur', () => {
      const validationResult = this.customValidate(input.value);

      if (!validationResult.valid) {
        error.textContent = validationResult.message;
        input.classList.add('invalid');
      } else {
        error.textContent = '';
        input.classList.remove('invalid');
      }
    });
  }

  customValidate(value) {
    // Custom validation logic
    if (value.length < 3) {
      return { valid: false, message: 'Must be at least 3 characters' };
    }

    if (!/^[a-zA-Z]+$/.test(value)) {
      return { valid: false, message: 'Only letters allowed' };
    }

    return { valid: true };
  }
}
```

### Async Validation

```javascript
class UsernameInput extends HTMLElement {
  connectedCallback() {
    this.render();

    const input = this.querySelector('input');
    let timeoutId;

    input.addEventListener('input', (e) => {
      clearTimeout(timeoutId);

      timeoutId = setTimeout(async () => {
        await this.checkAvailability(e.target.value);
      }, 500);
    });
  }

  async checkAvailability(username) {
    const status = this.querySelector('.status');

    if (username.length < 3) {
      status.textContent = '';
      return;
    }

    status.textContent = 'Checking...';

    try {
      const response = await fetch(`/api/check-username?username=${username}`);
      const { available } = await response.json();

      if (available) {
        status.textContent = '✓ Available';
        status.className = 'status success';
      } else {
        status.textContent = '✗ Already taken';
        status.className = 'status error';
      }
    } catch (error) {
      status.textContent = 'Could not check availability';
      status.className = 'status error';
    }
  }

  render() {
    this.innerHTML = `
      <label>Username</label>
      <input type="text" placeholder="Choose a username">
      <span class="status"></span>
    `;
  }
}
```

## Error Handling

Display validation errors elegantly:

```javascript
class FormWithErrors extends HTMLElement {
  constructor() {
    super();
    this.errors = {};
  }

  connectedCallback() {
    this.render();

    const form = this.querySelector('form');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      this.clearErrors();
      const errors = this.validateForm();

      if (Object.keys(errors).length === 0) {
        this.handleSubmit();
      } else {
        this.showErrors(errors);
      }
    });
  }

  validateForm() {
    const errors = {};
    const inputs = this.querySelectorAll('input');

    inputs.forEach(input => {
      if (!input.validity.valid) {
        errors[input.name] = this.getErrorMessage(input);
      }
    });

    return errors;
  }

  getErrorMessage(input) {
    if (input.validity.valueMissing) {
      return 'This field is required';
    }
    if (input.validity.typeMismatch) {
      return `Please enter a valid ${input.type}`;
    }
    if (input.validity.tooShort) {
      return `Must be at least ${input.minLength} characters`;
    }
    if (input.validity.tooLong) {
      return `Must be no more than ${input.maxLength} characters`;
    }
    if (input.validity.patternMismatch) {
      return input.title || 'Invalid format';
    }

    return 'Invalid input';
  }

  showErrors(errors) {
    Object.entries(errors).forEach(([fieldName, message]) => {
      const field = this.querySelector(`[name="${fieldName}"]`);
      const errorEl = field.parentElement.querySelector('.error');

      if (errorEl) {
        errorEl.textContent = message;
        field.classList.add('invalid');
      }
    });
  }

  clearErrors() {
    this.querySelectorAll('.error').forEach(el => {
      el.textContent = '';
    });

    this.querySelectorAll('.invalid').forEach(el => {
      el.classList.remove('invalid');
    });
  }

  render() {
    this.innerHTML = `
      <form>
        <div class="field">
          <label>Email</label>
          <input type="email" name="email" required>
          <span class="error"></span>
        </div>

        <div class="field">
          <label>Password</label>
          <input type="password" name="password" required minlength="8">
          <span class="error"></span>
        </div>

        <button type="submit">Submit</button>
      </form>
    `;
  }
}
```

## File Uploads

Handle file uploads with progress tracking:

```javascript
class FileUpload extends HTMLElement {
  connectedCallback() {
    this.render();

    const input = this.querySelector('input[type="file"]');
    const button = this.querySelector('button');

    input.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.showPreview(file);
        button.disabled = false;
      }
    });

    button.addEventListener('click', () => {
      const file = input.files[0];
      if (file) {
        this.uploadFile(file);
      }
    });
  }

  showPreview(file) {
    const preview = this.querySelector('.preview');

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
      };
      reader.readAsDataURL(file);
    } else {
      preview.innerHTML = `
        <p>${file.name}</p>
        <p>${this.formatFileSize(file.size)}</p>
      `;
    }
  }

  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      const percent = (e.loaded / e.total) * 100;
      this.updateProgress(percent);
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        pan.publish('file.uploaded', {
          filename: file.name,
          response: JSON.parse(xhr.response)
        });
        this.showSuccess();
      } else {
        this.showError('Upload failed');
      }
    });

    xhr.addEventListener('error', () => {
      this.showError('Upload failed');
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  }

  updateProgress(percent) {
    const progress = this.querySelector('.progress-bar');
    progress.style.width = `${percent}%`;
    progress.textContent = `${Math.round(percent)}%`;
  }

  formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  showSuccess() {
    this.querySelector('.status').innerHTML = '✓ Uploaded successfully';
  }

  showError(message) {
    this.querySelector('.status').innerHTML = `✗ ${message}`;
  }

  render() {
    this.innerHTML = `
      <div class="upload-container">
        <input type="file" accept="image/*">
        <div class="preview"></div>
        <div class="progress">
          <div class="progress-bar"></div>
        </div>
        <button disabled>Upload</button>
        <div class="status"></div>
      </div>
    `;
  }
}

customElements.define('file-upload', FileUpload);
```

## Form Submission

Handle form submission with loading states and error recovery:

```javascript
class SmartForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.submitting = false;
  }

  connectedCallback() {
    this.render();

    this.shadowRoot.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();

      if (this.submitting) return;

      this.submitting = true;
      this.disableForm();

      try {
        const data = this.getFormData();
        await this.submitForm(data);
        this.handleSuccess();
      } catch (error) {
        this.handleError(error);
      } finally {
        this.submitting = false;
        this.enableForm();
      }
    });
  }

  getFormData() {
    const form = this.shadowRoot.querySelector('form');
    const formData = new FormData(form);
    return Object.fromEntries(formData);
  }

  async submitForm(data) {
    const response = await fetch('/api/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Submission failed');
    }

    return response.json();
  }

  disableForm() {
    const inputs = this.shadowRoot.querySelectorAll('input, button, textarea');
    inputs.forEach(el => el.disabled = true);

    this.shadowRoot.querySelector('.loading').style.display = 'block';
  }

  enableForm() {
    const inputs = this.shadowRoot.querySelectorAll('input, button, textarea');
    inputs.forEach(el => el.disabled = false);

    this.shadowRoot.querySelector('.loading').style.display = 'none';
  }

  handleSuccess() {
    pan.publish('notification.success', { message: 'Form submitted successfully!' });
    this.shadowRoot.querySelector('form').reset();
  }

  handleError(error) {
    pan.publish('notification.error', { message: error.message });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        .loading {
          display: none;
          text-align: center;
          padding: 16px;
        }
      </style>

      <form>
        <!-- Form fields -->
        <button type="submit">Submit</button>
      </form>

      <div class="loading">
        <div class="spinner"></div>
        <p>Submitting...</p>
      </div>
    `;
  }
}

customElements.define('smart-form', SmartForm);
```

## Summary

This chapter covered:

- Building accessible form components
- Two-way data binding patterns
- Validation strategies (native and custom)
- Error handling and display
- File upload with progress tracking
- Form submission with loading states

---

## Best Practices

1. **Use native validation first** - HTML5 provides powerful built-in validation
2. **Provide clear error messages** - Tell users exactly what's wrong
3. **Validate on blur** - Don't show errors while user is typing
4. **Disable during submission** - Prevent double-submission
5. **Show progress for uploads** - Users want to see progress
6. **Handle errors gracefully** - Network can fail, handle it well

---

## Further Reading

**For complete forms and validation reference:**
- *Building with LARC* Chapter 6: Forms and User Input - All form patterns and validation strategies
- *Building with LARC* Chapter 19: UI Components - pan-files and pan-markdown-editor reference
- *Building with LARC* Appendix E: Recipes and Patterns - Form validation recipes
