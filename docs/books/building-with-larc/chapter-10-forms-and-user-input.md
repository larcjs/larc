# Forms and User Input

*In which we learn to gracefully accept data from users, who are simultaneously your application's reason for existing and its greatest source of chaos*

Forms are the primary way users communicate with your application, which means they're simultaneously the most important and most frustrating part of web development. Users will try to enter phone numbers with letters, paste entire essays into single-line inputs, and somehow manage to submit forms with negative quantities of products. Your job is to accept their input gracefully while gently steering them toward something your database can actually process.

In this chapter, we'll explore LARC's approach to form handling, from basic input binding to sophisticated schema-driven forms. We'll cover validation strategies that don't make users want to throw their keyboards, file upload patterns that work with modern APIs, and rich text editing that goes beyond the humble textarea. By the end, you'll be equipped to build forms that are both powerful and forgiving—a rare combination in web development.

## The Fundamentals of Form Handling

Let's start with the basics. A form in LARC is just HTML with JavaScript event handling—no magic, no framework-specific syntax, just the web platform doing what it does best.

### Basic Form Structure

Here's a simple login form:

```javascript
class LoginForm extends LarcComponent {
  constructor() {
    super();
    this.error = null;
    this.loading = false;
  }

  async handleSubmit(event) {
    event.preventDefault(); // Prevent default form submission

    this.loading = true;
    this.error = null;
    this.render();

    const formData = new FormData(event.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password'),
      remember: formData.get('remember') === 'on'
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const user = await response.json();
        this.handleLoginSuccess(user);
      } else {
        const error = await response.json();
        this.error = error.message;
      }
    } catch (err) {
      this.error = 'Network error. Please try again.';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  handleLoginSuccess(user) {
    localStorage.setItem('user', JSON.stringify(user));
    navigate('/dashboard');
  }

  template() {
    return `
      <form class="login-form" onsubmit="this.handleSubmit(event)">
        <h2>Login</h2>

        ${this.error ? `<div class="error">${this.error}</div>` : ''}

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            required
            autocomplete="email">
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            required
            autocomplete="current-password">
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" name="remember">
            Remember me
          </label>
        </div>

        <button type="submit" ?disabled="${this.loading}">
          ${this.loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    `;
  }
}
```

This example demonstrates several key patterns:

1. **`preventDefault()`** stops the browser's default form submission
2. **`FormData`** extracts values from form inputs
3. **Loading states** provide feedback during async operations
4. **Error handling** displays meaningful messages to users

### Two-Way Data Binding

Sometimes you want form inputs to sync with component state in real-time. While LARC doesn't provide automatic two-way binding (we're not monsters), you can implement it easily:

```javascript
class UserProfile extends LarcComponent {
  constructor() {
    super();
    this.user = {
      name: '',
      email: '',
      bio: '',
      notifications: true
    };
  }

  handleInput(field, event) {
    this.user[field] = event.target.value;
    // Optionally re-render to update dependent UI
    this.updatePreview();
  }

  handleCheckbox(field, event) {
    this.user[field] = event.target.checked;
    this.render();
  }

  updatePreview() {
    const preview = this.querySelector('.profile-preview');
    if (preview) {
      preview.textContent = this.user.bio || 'No bio provided';
    }
  }

  template() {
    return `
      <form class="profile-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input
            type="text"
            id="name"
            value="${this.user.name}"
            oninput="this.handleInput('name', event)">
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            value="${this.user.email}"
            oninput="this.handleInput('email', event)">
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            id="bio"
            rows="4"
            oninput="this.handleInput('bio', event)">${this.user.bio}</textarea>
        </div>

        <div class="form-group">
          <label>
            <input
              type="checkbox"
              ?checked="${this.user.notifications}"
              onchange="this.handleCheckbox('notifications', event)">
            Email notifications
          </label>
        </div>

        <div class="profile-preview">
          ${this.user.bio || 'No bio provided'}
        </div>
      </form>
    `;
  }
}
```

## Validation Strategies

Validation is like parenting: you need to set boundaries, but if you're too strict, everyone ends up frustrated. The key is providing helpful guidance without being obnoxious about it.

### HTML5 Built-in Validation

Start with HTML5's native validation attributes—they're free, accessible, and work even if JavaScript fails:

```html
<input type="email" required
       pattern="[^@]+@[^@]+\.[^@]+"
       title="Please enter a valid email address">

<input type="tel"
       pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
       placeholder="123-456-7890"
       title="Format: 123-456-7890">

<input type="number"
       min="1"
       max="100"
       step="1">

<input type="url"
       placeholder="https://example.com">

<input type="text"
       minlength="3"
       maxlength="50"
       required>
```

### Custom Validation Logic

For more sophisticated validation, implement custom logic:

```javascript
class RegistrationForm extends LarcComponent {
  constructor() {
    super();
    this.errors = {};
    this.touched = {};
  }

  validateEmail(email) {
    if (!email) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  validatePassword(password) {
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one number';
    }
    return null;
  }

  validatePasswordConfirm(password, confirm) {
    if (!confirm) {
      return 'Please confirm your password';
    }
    if (password !== confirm) {
      return 'Passwords do not match';
    }
    return null;
  }

  validateField(field, value, allValues = {}) {
    switch (field) {
      case 'email':
        return this.validateEmail(value);
      case 'password':
        return this.validatePassword(value);
      case 'passwordConfirm':
        return this.validatePasswordConfirm(allValues.password, value);
      default:
        return null;
    }
  }

  handleBlur(field, event) {
    this.touched[field] = true;
    const error = this.validateField(field, event.target.value, this.getFormValues());
    this.errors[field] = error;
    this.render();
  }

  handleSubmit(event) {
    event.preventDefault();

    const values = this.getFormValues();
    const newErrors = {};

    // Validate all fields
    Object.keys(values).forEach(field => {
      const error = this.validateField(field, values[field], values);
      if (error) {
        newErrors[field] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      this.errors = newErrors;
      this.touched = Object.keys(values).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      this.render();
      return;
    }

    // Form is valid, submit it
    this.submitRegistration(values);
  }

  getFormValues() {
    const form = this.querySelector('form');
    const formData = new FormData(form);
    return {
      email: formData.get('email'),
      password: formData.get('password'),
      passwordConfirm: formData.get('passwordConfirm')
    };
  }

  template() {
    return `
      <form onsubmit="this.handleSubmit(event)">
        <div class="form-group ${this.errors.email && this.touched.email ? 'error' : ''}">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            onblur="this.handleBlur('email', event)">
          ${this.errors.email && this.touched.email ?
            `<span class="error-message">${this.errors.email}</span>` : ''}
        </div>

        <div class="form-group ${this.errors.password && this.touched.password ? 'error' : ''}">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            name="password"
            onblur="this.handleBlur('password', event)">
          ${this.errors.password && this.touched.password ?
            `<span class="error-message">${this.errors.password}</span>` : ''}
        </div>

        <div class="form-group ${this.errors.passwordConfirm && this.touched.passwordConfirm ? 'error' : ''}">
          <label for="passwordConfirm">Confirm Password</label>
          <input
            type="password"
            id="passwordConfirm"
            name="passwordConfirm"
            onblur="this.handleBlur('passwordConfirm', event)">
          ${this.errors.passwordConfirm && this.touched.passwordConfirm ?
            `<span class="error-message">${this.errors.passwordConfirm}</span>` : ''}
        </div>

        <button type="submit">Register</button>
      </form>
    `;
  }
}
```

### Debounced Validation

For fields that require server-side validation (like username availability), debounce the requests:

```javascript
class UsernameField extends LarcComponent {
  constructor() {
    super();
    this.username = '';
    this.checking = false;
    this.available = null;
    this.debounceTimer = null;
  }

  handleInput(event) {
    this.username = event.target.value;
    this.available = null; // Reset availability

    clearTimeout(this.debounceTimer);

    if (this.username.length >= 3) {
      this.checking = true;
      this.render();

      this.debounceTimer = setTimeout(() => {
        this.checkAvailability(this.username);
      }, 500); // Wait 500ms after user stops typing
    } else {
      this.checking = false;
      this.render();
    }
  }

  async checkAvailability(username) {
    try {
      const response = await fetch(`/api/check-username?username=${encodeURIComponent(username)}`);
      const data = await response.json();
      this.available = data.available;
    } catch (err) {
      console.error('Error checking username:', err);
    } finally {
      this.checking = false;
      this.render();
    }
  }

  template() {
    return `
      <div class="form-group">
        <label for="username">Username</label>
        <input
          type="text"
          id="username"
          value="${this.username}"
          oninput="this.handleInput(event)"
          minlength="3"
          maxlength="20">

        ${this.checking ? '<span class="checking">Checking...</span>' : ''}

        ${this.available === true ?
          '<span class="success">[v] Available</span>' : ''}

        ${this.available === false ?
          '<span class="error">[x] Username taken</span>' : ''}
      </div>
    `;
  }
}
```

## Schema-Driven Forms

For complex forms, manually writing validation for each field becomes tedious. Schema-driven forms define the structure and rules in data, then generate the UI automatically.

### Defining a Schema

```javascript
const productSchema = {
  name: {
    type: 'text',
    label: 'Product Name',
    required: true,
    minLength: 3,
    maxLength: 100
  },
  description: {
    type: 'textarea',
    label: 'Description',
    required: true,
    minLength: 10,
    rows: 5
  },
  category: {
    type: 'select',
    label: 'Category',
    required: true,
    options: [
      { value: 'electronics', label: 'Electronics' },
      { value: 'clothing', label: 'Clothing' },
      { value: 'food', label: 'Food & Beverage' },
      { value: 'other', label: 'Other' }
    ]
  },
  price: {
    type: 'number',
    label: 'Price',
    required: true,
    min: 0.01,
    step: 0.01,
    prefix: '$'
  },
  inStock: {
    type: 'checkbox',
    label: 'In Stock',
    defaultValue: true
  },
  tags: {
    type: 'text',
    label: 'Tags (comma-separated)',
    placeholder: 'organic, gluten-free, local'
  }
};
```

### Schema Form Component

```javascript
class SchemaForm extends LarcComponent {
  constructor(schema, initialValues = {}) {
    super();
    this.schema = schema;
    this.values = { ...initialValues };
    this.errors = {};
    this.touched = {};
  }

  handleInput(field, event) {
    const fieldSchema = this.schema[field];

    if (fieldSchema.type === 'checkbox') {
      this.values[field] = event.target.checked;
    } else {
      this.values[field] = event.target.value;
    }

    // Clear error when user starts correcting
    if (this.errors[field]) {
      delete this.errors[field];
      this.render();
    }
  }

  handleBlur(field) {
    this.touched[field] = true;
    const error = this.validateField(field);
    if (error) {
      this.errors[field] = error;
      this.render();
    }
  }

  validateField(field) {
    const value = this.values[field];
    const fieldSchema = this.schema[field];

    if (fieldSchema.required && !value) {
      return `${fieldSchema.label} is required`;
    }

    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      return `${fieldSchema.label} must be at least ${fieldSchema.minLength} characters`;
    }

    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      return `${fieldSchema.label} must be no more than ${fieldSchema.maxLength} characters`;
    }

    if (fieldSchema.min !== undefined && parseFloat(value) < fieldSchema.min) {
      return `${fieldSchema.label} must be at least ${fieldSchema.min}`;
    }

    if (fieldSchema.max !== undefined && parseFloat(value) > fieldSchema.max) {
      return `${fieldSchema.label} must be no more than ${fieldSchema.max}`;
    }

    if (fieldSchema.pattern && !new RegExp(fieldSchema.pattern).test(value)) {
      return fieldSchema.patternMessage || `${fieldSchema.label} is invalid`;
    }

    return null;
  }

  validateAll() {
    const newErrors = {};

    Object.keys(this.schema).forEach(field => {
      const error = this.validateField(field);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  }

  renderField(fieldName) {
    const field = this.schema[fieldName];
    const value = this.values[fieldName] ?? field.defaultValue ?? '';
    const error = this.errors[fieldName] && this.touched[fieldName];

    const commonAttrs = `
      id="${fieldName}"
      name="${fieldName}"
      onblur="this.handleBlur('${fieldName}')"
    `;

    let input;

    switch (field.type) {
      case 'textarea':
        input = `
          <textarea ${commonAttrs}
                    rows="${field.rows || 3}"
                    oninput="this.handleInput('${fieldName}', event)"
                    ${field.required ? 'required' : ''}>${value}</textarea>
        `;
        break;

      case 'select':
        input = `
          <select ${commonAttrs}
                  onchange="this.handleInput('${fieldName}', event)"
                  ${field.required ? 'required' : ''}>
            <option value="">Select ${field.label}</option>
            ${field.options.map(opt => `
              <option value="${opt.value}" ${value === opt.value ? 'selected' : ''}>
                ${opt.label}
              </option>
            `).join('')}
          </select>
        `;
        break;

      case 'checkbox':
        input = `
          <input type="checkbox" ${commonAttrs}
                 onchange="this.handleInput('${fieldName}', event)"
                 ${value ? 'checked' : ''}>
        `;
        break;

      case 'number':
        input = `
          ${field.prefix || ''}
          <input type="number" ${commonAttrs}
                 value="${value}"
                 oninput="this.handleInput('${fieldName}', event)"
                 ${field.min !== undefined ? `min="${field.min}"` : ''}
                 ${field.max !== undefined ? `max="${field.max}"` : ''}
                 ${field.step !== undefined ? `step="${field.step}"` : ''}
                 ${field.required ? 'required' : ''}>
          ${field.suffix || ''}
        `;
        break;

      default: // text, email, tel, url, etc.
        input = `
          <input type="${field.type}" ${commonAttrs}
                 value="${value}"
                 oninput="this.handleInput('${fieldName}', event)"
                 ${field.placeholder ? `placeholder="${field.placeholder}"` : ''}
                 ${field.required ? 'required' : ''}>
        `;
    }

    return `
      <div class="form-group ${error ? 'error' : ''}">
        <label for="${fieldName}">${field.label}</label>
        ${input}
        ${error ? `<span class="error-message">${this.errors[fieldName]}</span>` : ''}
      </div>
    `;
  }

  handleSubmit(event) {
    event.preventDefault();

    const errors = this.validateAll();

    if (Object.keys(errors).length > 0) {
      this.errors = errors;
      this.touched = Object.keys(this.schema).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {});
      this.render();
      return;
    }

    this.onSubmit(this.values);
  }

  onSubmit(values) {
    // Override in subclass or pass as parameter
    console.log('Form submitted:', values);
  }

  template() {
    return `
      <form class="schema-form" onsubmit="this.handleSubmit(event)">
        ${Object.keys(this.schema).map(field => this.renderField(field)).join('')}

        <div class="form-actions">
          <button type="submit">Submit</button>
          <button type="button" onclick="this.handleReset()">Reset</button>
        </div>
      </form>
    `;
  }
}
```

### Using the Schema Form

```javascript
class ProductForm extends SchemaForm {
  constructor() {
    super(productSchema);
  }

  async onSubmit(values) {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (response.ok) {
        navigate('/products');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (err) {
      alert('Network error. Please try again.');
    }
  }
}

customElements.define('product-form', ProductForm);
```

## File Uploads

File uploads are where form handling gets interesting (read: complicated). You need to handle previews, progress indicators, size limits, and mime type validation.

### Basic File Upload

```javascript
class FileUpload extends LarcComponent {
  constructor() {
    super();
    this.file = null;
    this.preview = null;
    this.uploading = false;
    this.progress = 0;
  }

  handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or GIF)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      alert('File size must be less than 5MB');
      return;
    }

    this.file = file;
    this.generatePreview(file);
    this.render();
  }

  generatePreview(file) {
    const reader = new FileReader();

    reader.onload = (e) => {
      this.preview = e.target.result;
      this.render();
    };

    reader.readAsDataURL(file);
  }

  async handleUpload() {
    if (!this.file) {
      return;
    }

    this.uploading = true;
    this.progress = 0;
    this.render();

    const formData = new FormData();
    formData.append('file', this.file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        this.handleUploadSuccess(result);
      } else {
        alert('Upload failed');
      }
    } catch (err) {
      alert('Network error');
    } finally {
      this.uploading = false;
      this.render();
    }
  }

  handleUploadSuccess(result) {
    console.log('File uploaded:', result.url);
    this.file = null;
    this.preview = null;
    this.render();
  }

  template() {
    return `
      <div class="file-upload">
        <input
          type="file"
          accept="image/*"
          onchange="this.handleFileSelect(event)"
          ?disabled="${this.uploading}">

        ${this.preview ? `
          <div class="preview">
            <img src="${this.preview}" alt="Preview">
            <button onclick="this.handleUpload()"
                    ?disabled="${this.uploading}">
              ${this.uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        ` : ''}

        ${this.uploading ? `
          <div class="progress">
            <div class="progress-bar" style="width: ${this.progress}%"></div>
          </div>
        ` : ''}
      </div>
    `;
  }
}
```

### Upload Progress with XMLHttpRequest

For detailed progress tracking, use XMLHttpRequest instead of fetch:

```javascript
uploadWithProgress(file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error('Upload failed'));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Network error'));
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  });
}

async handleUpload() {
  this.uploading = true;
  this.render();

  try {
    const result = await this.uploadWithProgress(this.file, (progress) => {
      this.progress = progress;
      this.render();
    });

    this.handleUploadSuccess(result);
  } catch (err) {
    alert('Upload failed');
  } finally {
    this.uploading = false;
    this.render();
  }
}
```

## Rich Text Editing

Sometimes a plain textarea isn't enough, and you need formatted text. You have two main approaches: WYSIWYG editors and markdown.

### Markdown Editor

Markdown is developer-friendly and produces clean, semantic output:

```javascript
class MarkdownEditor extends LarcComponent {
  constructor() {
    super();
    this.content = '';
    this.previewMode = false;
  }

  handleInput(event) {
    this.content = event.target.value;
    if (this.previewMode) {
      this.updatePreview();
    }
  }

  togglePreview() {
    this.previewMode = !this.previewMode;
    this.render();
  }

  updatePreview() {
    const preview = this.querySelector('.markdown-preview');
    if (preview) {
      preview.innerHTML = this.renderMarkdown(this.content);
    }
  }

  renderMarkdown(text) {
    // Simple markdown parser (use a library like marked.js for production)
    return text
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/gim, '<img alt="$1" src="$2">')
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
      .replace(/\n/gim, '<br>');
  }

  insertFormatting(format) {
    const textarea = this.querySelector('textarea');
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = this.content.substring(start, end);

    let insertion;
    switch (format) {
      case 'bold':
        insertion = `**${selectedText}**`;
        break;
      case 'italic':
        insertion = `*${selectedText}*`;
        break;
      case 'link':
        insertion = `[${selectedText}](url)`;
        break;
      case 'heading':
        insertion = `## ${selectedText}`;
        break;
      default:
        return;
    }

    this.content = this.content.substring(0, start) +
                   insertion +
                   this.content.substring(end);

    this.render();
  }

  template() {
    return `
      <div class="markdown-editor">
        <div class="toolbar">
          <button type="button" onclick="this.insertFormatting('bold')">
            <strong>B</strong>
          </button>
          <button type="button" onclick="this.insertFormatting('italic')">
            <em>I</em>
          </button>
          <button type="button" onclick="this.insertFormatting('link')">
            Link
          </button>
          <button type="button" onclick="this.insertFormatting('heading')">
            H2
          </button>
          <button type="button" onclick="this.togglePreview()">
            ${this.previewMode ? 'Edit' : 'Preview'}
          </button>
        </div>

        ${this.previewMode ? `
          <div class="markdown-preview">
            ${this.renderMarkdown(this.content)}
          </div>
        ` : `
          <textarea
            rows="10"
            oninput="this.handleInput(event)">${this.content}</textarea>
        `}
      </div>
    `;
  }
}
```

### Integrating Third-Party Editors

For full-featured rich text editing, integrate libraries like Quill or TipTap:

```javascript
import Quill from 'quill';

class RichTextEditor extends LarcComponent {
  constructor() {
    super();
    this.content = '';
    this.editor = null;
  }

  afterRender() {
    if (!this.editor) {
      const container = this.querySelector('.editor-container');
      this.editor = new Quill(container, {
        theme: 'snow',
        modules: {
          toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'header': 1 }, { 'header': 2 }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            ['link', 'image'],
            ['clean']
          ]
        }
      });

      this.editor.on('text-change', () => {
        this.content = this.editor.root.innerHTML;
      });
    }
  }

  getContent() {
    return this.content;
  }

  setContent(html) {
    if (this.editor) {
      this.editor.root.innerHTML = html;
      this.content = html;
    }
  }

  template() {
    return '<div class="editor-container"></div>';
  }
}
```

## Form State Management

For complex forms with multiple steps or interdependent fields, centralized state management helps maintain sanity:

```javascript
class FormState {
  constructor(initialValues = {}) {
    this.values = { ...initialValues };
    this.errors = {};
    this.touched = {};
    this.dirty = false;
    this.listeners = [];
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  notify() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  getState() {
    return {
      values: { ...this.values },
      errors: { ...this.errors },
      touched: { ...this.touched },
      dirty: this.dirty
    };
  }

  setValue(field, value) {
    this.values[field] = value;
    this.dirty = true;
    this.notify();
  }

  setError(field, error) {
    if (error) {
      this.errors[field] = error;
    } else {
      delete this.errors[field];
    }
    this.notify();
  }

  setTouched(field) {
    this.touched[field] = true;
    this.notify();
  }

  reset(values = {}) {
    this.values = { ...values };
    this.errors = {};
    this.touched = {};
    this.dirty = false;
    this.notify();
  }

  isValid() {
    return Object.keys(this.errors).length === 0;
  }
}
```

Use this state manager in your forms:

```javascript
class MultiStepForm extends LarcComponent {
  constructor() {
    super();
    this.currentStep = 1;
    this.formState = new FormState({
      // Step 1
      name: '',
      email: '',
      // Step 2
      address: '',
      city: '',
      // Step 3
      payment: ''
    });

    this.unsubscribe = this.formState.subscribe(() => {
      this.render();
    });
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  nextStep() {
    if (this.validateCurrentStep()) {
      this.currentStep++;
      this.render();
    }
  }

  previousStep() {
    this.currentStep--;
    this.render();
  }

  validateCurrentStep() {
    // Validate fields for current step
    return true;
  }

  template() {
    const state = this.formState.getState();

    return `
      <form class="multi-step-form">
        <div class="steps">
          ${this.currentStep === 1 ? this.renderStep1(state) : ''}
          ${this.currentStep === 2 ? this.renderStep2(state) : ''}
          ${this.currentStep === 3 ? this.renderStep3(state) : ''}
        </div>

        <div class="navigation">
          ${this.currentStep > 1 ? `
            <button type="button" onclick="this.previousStep()">
              Previous
            </button>
          ` : ''}

          ${this.currentStep < 3 ? `
            <button type="button" onclick="this.nextStep()">
              Next
            </button>
          ` : `
            <button type="submit">Submit</button>
          `}
        </div>
      </form>
    `;
  }
}
```

## Conclusion

Forms are the battleground where user intent meets application logic. By combining HTML5's built-in capabilities with LARC's component model, you can create forms that validate intelligently, provide helpful feedback, and gracefully handle the chaos users inevitably introduce. Whether you're building simple login forms or complex multi-step wizards, the patterns in this chapter will help you create user inputs that are both powerful and forgiving.

In the next chapter, we'll explore data fetching and APIs—because forms are useless without somewhere to send their data.
