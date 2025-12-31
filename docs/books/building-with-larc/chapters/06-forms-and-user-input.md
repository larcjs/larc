# Forms and User Input

Quick reference for form handling in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 10.

## Overview

Forms enable user input through validation, submission handling, and error feedback. LARC uses standard HTML forms with JavaScript event handling—no magic, no framework-specific syntax.

**Key Concepts**:

- FormData API: Extract values from form inputs
- Validation strategies: Client-side and server-side validation
- Loading states: Provide feedback during async operations
- Error handling: Display meaningful messages
- File uploads: Handle files with modern APIs

## Quick Example

```javascript
class LoginForm extends LarcComponent {
  constructor() {
    super();
    this.error = null;
    this.loading = false;
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    this.loading = true;
    this.error = null;
    this.render();

    const formData = new FormData(event.target);
    const credentials = {
      email: formData.get('email'),
      password: formData.get('password')
    };

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const user = await response.json();
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/dashboard');
      } else {
        this.error = 'Invalid credentials';
      }
    } catch (err) {
      this.error = 'Network error. Please try again.';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  template() {
    return `
      <form onsubmit="this.handleSubmit(event)">
        ${this.error ? `<div class="error">${this.error}</div>` : ''}
        
        <input type="email" name="email" required autocomplete="email">
        <input type="password" name="password" required>
        
        <button type="submit" ?disabled="${this.loading}">
          ${this.loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    `;
  }
}
```

## Validation Strategies

| Strategy | When | Implementation |
|----------|------|----------------|
| **HTML5 validation** | Simple cases | Use `required`, `pattern`, `min`, `max` attributes |
| **Client-side JS** | Immediate feedback | Validate on `input` or `blur` events |
| **Server-side** | Final authority | Always validate on server, return errors |
| **Schema validation** | Complex forms | Use libraries like Zod, Yup, or JSON Schema |

### Validation Example

```javascript
validateEmail(email) {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return pattern.test(email);
}

handleInput(event) {
  const email = event.target.value;
  const isValid = this.validateEmail(email);
  
  const errorEl = this.querySelector('.email-error');
  errorEl.textContent = isValid ? '' : 'Invalid email format';
  errorEl.hidden = isValid;
}
```

## Common Patterns

### Pattern 1: Two-Way Data Binding

```javascript
class UserProfile extends LarcComponent {
  constructor() {
    super();
    this.user = { name: '', email: '', bio: '' };
  }

  handleInput(field, event) {
    this.user[field] = event.target.value;
    this.updatePreview();
  }

  template() {
    return `
      <form>
        <input type="text" value="${this.user.name}" 
               oninput="this.handleInput('name', event)">
        <textarea oninput="this.handleInput('bio', event)">${this.user.bio}</textarea>
        <div class="preview">${this.user.bio || 'No bio'}</div>
      </form>
    `;
  }
}
```

### Pattern 2: File Upload

```javascript
async handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const result = await response.json();
      this.handleUploadSuccess(result);
    }
  } catch (err) {
    this.showError('Upload failed');
  }
}
```

### Pattern 3: Schema-Driven Validation

```javascript
import { z } from 'zod';

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  age: z.number().min(13).max(120)
});

async handleSubmit(event) {
  event.preventDefault();
  
  const data = {
    email: formData.get('email'),
    password: formData.get('password'),
    age: parseInt(formData.get('age'))
  };

  try {
    const validated = userSchema.parse(data);
    await this.submitForm(validated);
  } catch (err) {
    this.displayValidationErrors(err.errors);
  }
}
```

## Input Types Reference

| Type | Use Case | Validation |
|------|----------|------------|
| `text` | General text input | `pattern`, `minlength`, `maxlength` |
| `email` | Email addresses | Built-in email validation |
| `password` | Passwords | `minlength`, autocomplete hints |
| `number` | Numeric input | `min`, `max`, `step` |
| `tel` | Phone numbers | `pattern` for format |
| `url` | URLs | Built-in URL validation |
| `date` | Dates | `min`, `max` for range |
| `file` | File upload | `accept` for file types |
| `checkbox` | Boolean choice | Check `.checked` property |
| `radio` | Single choice | Group by `name` attribute |
| `select` | Dropdown choice | Multiple with `multiple` attribute |

## Error Display Patterns

### Inline Errors

```javascript
template() {
  return `
    <div class="form-group">
      <label for="email">Email</label>
      <input type="email" id="email" name="email">
      <span class="error" ?hidden="${!this.errors.email}">
        ${this.errors.email}
      </span>
    </div>
  `;
}
```

### Summary Errors

```javascript
template() {
  return `
    ${this.errors.length > 0 ? `
      <div class="error-summary">
        <h3>Please fix the following errors:</h3>
        <ul>
          ${this.errors.map(err => `<li>${err}</li>`).join('')}
        </ul>
      </div>
    ` : ''}
    <form>...</form>
  `;
}
```

## Component Reference

- **pan-files**: File upload component - See Chapter 19
- **pan-markdown-editor**: Rich text editing - See Chapter 19

## Complete Example: Registration Form

```javascript
class RegistrationForm extends LarcComponent {
  constructor() {
    super();
    this.errors = {};
    this.loading = false;
  }

  validate(data) {
    const errors = {};
    
    if (!data.email || !this.validateEmail(data.email)) {
      errors.email = 'Valid email required';
    }
    
    if (!data.password || data.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (data.password !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords must match';
    }
    
    return Object.keys(errors).length === 0 ? null : errors;
  }

  async handleSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const data = {
      email: formData.get('email'),
      password: formData.get('password'),
      confirmPassword: formData.get('confirmPassword'),
      terms: formData.get('terms') === 'on'
    };

    // Client-side validation
    const validationErrors = this.validate(data);
    if (validationErrors) {
      this.errors = validationErrors;
      this.render();
      return;
    }

    // Submit to server
    this.loading = true;
    this.render();

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email, password: data.password })
      });

      if (response.ok) {
        navigate('/welcome');
      } else {
        const error = await response.json();
        this.errors = { general: error.message };
      }
    } catch (err) {
      this.errors = { general: 'Network error. Please try again.' };
    } finally {
      this.loading = false;
      this.render();
    }
  }

  template() {
    return `
      <form class="registration-form" onsubmit="this.handleSubmit(event)">
        <h2>Create Account</h2>

        ${this.errors.general ? `
          <div class="error-banner">${this.errors.general}</div>
        ` : ''}

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" name="email" required>
          ${this.errors.email ? `<span class="error">${this.errors.email}</span>` : ''}
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" name="password" required>
          ${this.errors.password ? `<span class="error">${this.errors.password}</span>` : ''}
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" name="confirmPassword" required>
          ${this.errors.confirmPassword ? `<span class="error">${this.errors.confirmPassword}</span>` : ''}
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" name="terms" required>
            I agree to the Terms of Service
          </label>
        </div>

        <button type="submit" ?disabled="${this.loading}">
          ${this.loading ? 'Creating account...' : 'Sign Up'}
        </button>
      </form>
    `;
  }
}

customElements.define('registration-form', RegistrationForm);
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 10 (Forms and User Input)
- **Components**: Chapter 19 (pan-files, pan-markdown-editor)
- **Patterns**: Appendix E (Form Patterns)
- **Related**: Chapter 4 (State Management), Chapter 14 (Error Handling)

## Common Issues

### Issue: Form submits on Enter key
**Problem**: Single-line inputs trigger form submission
**Solution**: Use `onsubmit` handler with `preventDefault()`, not button click handlers

### Issue: FormData missing checkbox values
**Problem**: Unchecked checkboxes don't appear in FormData
**Solution**: Check for `null` or use `.get('field') === 'on'` pattern

### Issue: File upload fails with large files
**Problem**: Request timeout or server rejects large payloads
**Solution**: Implement chunked upload or use signed URLs for direct S3 upload

### Issue: Validation errors not clearing
**Problem**: Error messages persist after fixing input
**Solution**: Clear errors object before revalidation, or validate on input event

### Issue: Password managers not filling forms
**Problem**: Autocomplete not working correctly
**Solution**: Use proper `autocomplete` attributes (`email`, `current-password`, `new-password`)

See *Learning LARC* Chapter 10 for detailed form patterns and advanced validation strategies.
