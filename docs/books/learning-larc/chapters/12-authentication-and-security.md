# Authentication and Security

Authentication is the bouncer at your application's door. Get it wrong, and either legitimate users can't get in, or everyone can. Security isn't a feature you add later—it's a mindset that shapes every decision from the start.

## Understanding Authentication vs Authorization

These terms often get conflated, but they're distinct:

**Authentication** answers: "Who are you?" It's verifying identity—matching a username and password, validating a token, confirming you are who you claim to be.

**Authorization** answers: "What can you do?" Once we know who you are, authorization determines your permissions—can you view this page, edit this record, delete this user?

LARC applications typically handle authentication with JWT tokens and authorization with role-based or permission-based access control.

## JWT Token Management

JSON Web Tokens (JWTs) are the standard for stateless authentication. A JWT contains encoded claims about the user, signed by the server:

```javascript
// auth-service.js
class AuthService {
  constructor() {
    this.tokenKey = 'auth_token';
    this.refreshKey = 'refresh_token';
  }

  async login(email, password) {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const { accessToken, refreshToken, user } = await response.json();

    this.setTokens(accessToken, refreshToken);
    pan.publish('auth.login', { user }, { retained: true });

    return user;
  }

  setTokens(accessToken, refreshToken) {
    localStorage.setItem(this.tokenKey, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.refreshKey, refreshToken);
    }
  }

  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  isAuthenticated() {
    const token = this.getToken();
    if (!token) return false;

    try {
      const payload = this.decodeToken(token);
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }

  decodeToken(token) {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  }

  async refresh() {
    const refreshToken = localStorage.getItem(this.refreshKey);
    if (!refreshToken) throw new Error('No refresh token');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!response.ok) {
      this.logout();
      throw new Error('Token refresh failed');
    }

    const { accessToken } = await response.json();
    localStorage.setItem(this.tokenKey, accessToken);
    return accessToken;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.refreshKey);
    pan.publish('auth.logout', {}, { retained: true });
  }

  getCurrentUser() {
    const token = this.getToken();
    if (!token) return null;

    try {
      return this.decodeToken(token);
    } catch {
      return null;
    }
  }
}

export const auth = new AuthService();
```

## Automatic Token Refresh

Tokens expire. Good applications refresh them transparently:

```javascript
// api-client.js with token refresh
class AuthenticatedApiClient {
  async fetch(endpoint, options = {}) {
    // First attempt
    try {
      return await this.doFetch(endpoint, options);
    } catch (error) {
      // If 401, try refreshing token
      if (error.status === 401) {
        try {
          await auth.refresh();
          // Retry with new token
          return await this.doFetch(endpoint, options);
        } catch (refreshError) {
          // Refresh failed, user must log in again
          auth.logout();
          throw error;
        }
      }
      throw error;
    }
  }

  async doFetch(endpoint, options) {
    const token = auth.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`/api${endpoint}`, { ...options, headers });

    if (!response.ok) {
      throw { status: response.status, message: await response.text() };
    }

    return response.json();
  }
}
```

## Protected Routes

Some pages should only be accessible to authenticated users. Here's a route guard pattern:

```javascript
// route-guard.js
class RouteGuard extends HTMLElement {
  connectedCallback() {
    this.checkAuth();
    pan.subscribe('auth.logout', () => this.checkAuth());
  }

  checkAuth() {
    if (!auth.isAuthenticated()) {
      // Store intended destination
      sessionStorage.setItem('returnUrl', window.location.pathname);
      // Redirect to login
      pan.publish('router.navigate', { path: '/login' });
    }
  }
}

customElements.define('route-guard', RouteGuard);
```

Use it to wrap protected content:

```html
<route-guard>
  <dashboard-page></dashboard-page>
</route-guard>
```

## Role-Based Access Control

Different users have different permissions. A simple RBAC implementation:

```javascript
// rbac.js
class RBAC {
  constructor() {
    this.permissions = {
      admin: ['read', 'write', 'delete', 'manage-users'],
      editor: ['read', 'write'],
      viewer: ['read']
    };
  }

  can(user, action) {
    if (!user?.role) return false;
    const allowed = this.permissions[user.role] || [];
    return allowed.includes(action);
  }
}

export const rbac = new RBAC();
```

Use it in components:

```javascript
class AdminPanel extends HTMLElement {
  connectedCallback() {
    const user = auth.getCurrentUser();

    if (!rbac.can(user, 'manage-users')) {
      this.innerHTML = '<p>Access denied</p>';
      return;
    }

    this.render();
  }
}
```

## Security Best Practices

### Sanitize User Input

Never trust user input. Always sanitize before rendering:

```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Safe rendering
this.innerHTML = `<p>${escapeHtml(userInput)}</p>`;
```

### Use HTTPS

Always serve your application over HTTPS. This protects tokens in transit and enables secure cookies.

### Secure Token Storage

LocalStorage is convenient but accessible to JavaScript. For high-security applications, consider httpOnly cookies:

```javascript
// Server sets cookie
res.cookie('token', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict'
});
```

### Content Security Policy

Set CSP headers to prevent XSS attacks:

```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self'">
```

## Complete Login/Signup Flow

Let's build a complete authentication system with login and signup components that work together:

### Login Component

```javascript
// components/login-form.js
import { auth } from '../services/auth.js';
import { pan } from '@larcjs/core';

class LoginForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      email: '',
      password: '',
      loading: false,
      error: null
    };
  }

  connectedCallback() {
    this.render();
  }

  async handleSubmit(e) {
    e.preventDefault();

    this.state.loading = true;
    this.state.error = null;
    this.render();

    try {
      const user = await auth.login(this.state.email, this.state.password);

      // Redirect to intended destination or dashboard
      const returnUrl = sessionStorage.getItem('returnUrl') || '/dashboard';
      sessionStorage.removeItem('returnUrl');
      pan.publish('router.navigate', { path: returnUrl });

    } catch (error) {
      this.state.error = error.message;
      this.state.loading = false;
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          max-width: 400px;
          margin: 50px auto;
        }

        form {
          background: white;
          padding: 30px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        h2 {
          margin: 0 0 20px;
          color: #333;
        }

        .error {
          background: #fee;
          color: #c00;
          padding: 10px;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .form-group {
          margin-bottom: 15px;
        }

        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #555;
        }

        input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        input:focus {
          outline: none;
          border-color: #667eea;
        }

        button {
          width: 100%;
          padding: 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
        }

        button:hover:not(:disabled) {
          background: #5568d3;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .signup-link {
          text-align: center;
          margin-top: 15px;
          color: #666;
        }

        .signup-link a {
          color: #667eea;
          text-decoration: none;
        }
      </style>

      <form>
        <h2>Login</h2>

        ${this.state.error ? `
          <div class="error">${this.state.error}</div>
        ` : ''}

        <div class="form-group">
          <label for="email">Email</label>
          <input
            type="email"
            id="email"
            value="${this.state.email}"
            required
            autocomplete="email"
          >
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input
            type="password"
            id="password"
            value="${this.state.password}"
            required
            autocomplete="current-password"
          >
        </div>

        <button type="submit" ?disabled="${this.state.loading}">
          ${this.state.loading ? 'Logging in...' : 'Login'}
        </button>

        <div class="signup-link">
          Don't have an account? <a href="/signup">Sign up</a>
        </div>
      </form>
    `;

    // Attach event listeners
    const form = this.shadowRoot.querySelector('form');
    const emailInput = this.shadowRoot.querySelector('#email');
    const passwordInput = this.shadowRoot.querySelector('#password');

    form.addEventListener('submit', (e) => this.handleSubmit(e));

    emailInput.addEventListener('input', (e) => {
      this.state.email = e.target.value;
    });

    passwordInput.addEventListener('input', (e) => {
      this.state.password = e.target.value;
    });

    // Handle signup link
    const signupLink = this.shadowRoot.querySelector('.signup-link a');
    signupLink?.addEventListener('click', (e) => {
      e.preventDefault();
      pan.publish('router.navigate', { path: '/signup' });
    });
  }
}

customElements.define('login-form', LoginForm);
```

### Signup Component

```javascript
// components/signup-form.js
class SignupForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.state = {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      loading: false,
      errors: {}
    };
  }

  connectedCallback() {
    this.render();
  }

  validate() {
    const errors = {};

    if (!this.state.name || this.state.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.state.email)) {
      errors.email = 'Invalid email address';
    }

    if (this.state.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (this.state.password !== this.state.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  async handleSubmit(e) {
    e.preventDefault();

    const errors = this.validate();
    if (Object.keys(errors).length > 0) {
      this.state.errors = errors;
      this.render();
      return;
    }

    this.state.loading = true;
    this.state.errors = {};
    this.render();

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: this.state.name,
          email: this.state.email,
          password: this.state.password
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Signup failed');
      }

      const { accessToken, refreshToken, user } = await response.json();

      auth.setTokens(accessToken, refreshToken);
      pan.publish('auth.login', { user }, { retained: true });
      pan.publish('router.navigate', { path: '/dashboard' });

    } catch (error) {
      this.state.errors = { general: error.message };
      this.state.loading = false;
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        /* Similar styles to login-form */
        :host {
          display: block;
          max-width: 400px;
          margin: 50px auto;
        }
        /* ... (copy styles from login-form) ... */
      </style>

      <form>
        <h2>Create Account</h2>

        ${this.state.errors.general ? `
          <div class="error">${this.state.errors.general}</div>
        ` : ''}

        <div class="form-group">
          <label for="name">Name</label>
          <input type="text" id="name" value="${this.state.name}" required>
          ${this.state.errors.name ? `
            <span class="field-error">${this.state.errors.name}</span>
          ` : ''}
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input type="email" id="email" value="${this.state.email}" required>
          ${this.state.errors.email ? `
            <span class="field-error">${this.state.errors.email}</span>
          ` : ''}
        </div>

        <div class="form-group">
          <label for="password">Password</label>
          <input type="password" id="password" required autocomplete="new-password">
          ${this.state.errors.password ? `
            <span class="field-error">${this.state.errors.password}</span>
          ` : ''}
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" required>
          ${this.state.errors.confirmPassword ? `
            <span class="field-error">${this.state.errors.confirmPassword}</span>
          ` : ''}
        </div>

        <button type="submit" ?disabled="${this.state.loading}">
          ${this.state.loading ? 'Creating account...' : 'Sign Up'}
        </button>

        <div class="login-link">
          Already have an account? <a href="/login">Login</a>
        </div>
      </form>
    `;

    // Attach event listeners (similar to login-form)
    const form = this.shadowRoot.querySelector('form');
    form.addEventListener('submit', (e) => this.handleSubmit(e));

    // Update state on input
    ['name', 'email', 'password', 'confirmPassword'].forEach(field => {
      const input = this.shadowRoot.querySelector(`#${field}`);
      input?.addEventListener('input', (e) => {
        this.state[field] = e.target.value;
      });
    });
  }
}

customElements.define('signup-form', SignupForm);
```

## OAuth Integration (GitHub Example)

OAuth allows users to log in with existing accounts from providers like GitHub, Google, or Facebook:

### OAuth Flow

```javascript
// services/oauth.js
class OAuthService {
  constructor() {
    this.providers = {
      github: {
        clientId: 'your-github-client-id',
        authUrl: 'https://github.com/login/oauth/authorize',
        scope: 'read:user user:email'
      }
    };
  }

  initiateLogin(provider) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unknown provider: ${provider}`);

    const redirectUri = `${window.location.origin}/auth/callback`;
    const state = this.generateState();

    // Store state for CSRF protection
    sessionStorage.setItem('oauth_state', state);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      scope: config.scope,
      state
    });

    // Redirect to provider
    window.location.href = `${config.authUrl}?${params}`;
  }

  generateState() {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  async handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    // Verify state (CSRF protection)
    const storedState = sessionStorage.getItem('oauth_state');
    if (state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for token with your backend
    const response = await fetch('/api/auth/github/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });

    if (!response.ok) {
      throw new Error('OAuth authentication failed');
    }

    const { accessToken, refreshToken, user } = await response.json();

    auth.setTokens(accessToken, refreshToken);
    pan.publish('auth.login', { user }, { retained: true });

    // Clean up
    sessionStorage.removeItem('oauth_state');

    return user;
  }
}

export const oauth = new OAuthService();
```

### OAuth Button Component

```javascript
class OAuthButtons extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <style>
        .oauth-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 20px 0;
        }

        .oauth-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          transition: background 0.2s;
        }

        .oauth-button:hover {
          background: #f5f5f5;
        }

        .oauth-button img {
          width: 20px;
          height: 20px;
        }
      </style>

      <div class="oauth-buttons">
        <button class="oauth-button" data-provider="github">
          <img src="/icons/github.svg" alt="GitHub">
          <span>Continue with GitHub</span>
        </button>

        <button class="oauth-button" data-provider="google">
          <img src="/icons/google.svg" alt="Google">
          <span>Continue with Google</span>
        </button>
      </div>

      <div class="divider">
        <span>or</span>
      </div>
    `;

    this.querySelectorAll('[data-provider]').forEach(button => {
      button.addEventListener('click', () => {
        const provider = button.dataset.provider;
        oauth.initiateLogin(provider);
      });
    });
  }
}

customElements.define('oauth-buttons', OAuthButtons);
```

## Session Management

Track active sessions and allow users to log out from all devices:

```javascript
// services/session-manager.js
class SessionManager {
  async getSessions() {
    return await api.get('/auth/sessions');
  }

  async revokeSession(sessionId) {
    await api.delete(`/auth/sessions/${sessionId}`);
    pan.publish('session.revoked', { sessionId });
  }

  async revokeAllSessions() {
    await api.delete('/auth/sessions');
    pan.publish('session.all-revoked');
    auth.logout();
  }
}

export const sessionManager = new SessionManager();
```

### Sessions Component

```javascript
class SessionsList extends HTMLElement {
  constructor() {
    super();
    this.sessions = [];
  }

  async connectedCallback() {
    await this.loadSessions();
    this.render();

    pan.subscribe('session.revoked', () => this.loadSessions());
  }

  async loadSessions() {
    try {
      this.sessions = await sessionManager.getSessions();
      this.render();
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  }

  async revokeSession(sessionId) {
    if (!confirm('Revoke this session?')) return;

    try {
      await sessionManager.revokeSession(sessionId);
    } catch (error) {
      alert('Failed to revoke session');
    }
  }

  async revokeAll() {
    if (!confirm('Log out from all devices?')) return;

    try {
      await sessionManager.revokeAllSessions();
    } catch (error) {
      alert('Failed to revoke sessions');
    }
  }

  render() {
    this.innerHTML = `
      <div class="sessions">
        <h3>Active Sessions</h3>

        ${this.sessions.map(session => `
          <div class="session" data-current="${session.isCurrent}">
            <div class="session-info">
              <strong>${session.device}</strong>
              <span>${session.location}</span>
              <small>Last active: ${new Date(session.lastActive).toLocaleString()}</small>
            </div>
            ${session.isCurrent ? `
              <span class="badge">Current</span>
            ` : `
              <button onclick="this.closest('sessions-list').revokeSession('${session.id}')">
                Revoke
              </button>
            `}
          </div>
        `).join('')}

        <button class="danger" onclick="this.closest('sessions-list').revokeAll()">
          Log out from all devices
        </button>
      </div>
    `;
  }
}

customElements.define('sessions-list', SessionsList);
```

## XSS and CSRF Protection

### Preventing XSS (Cross-Site Scripting)

Always sanitize user input before rendering:

```javascript
// utils/sanitize.js
const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br'];

function sanitizeHtml(html) {
  const div = document.createElement('div');
  div.innerHTML = html;

  // Remove all scripts
  div.querySelectorAll('script').forEach(el => el.remove());

  // Remove event handlers
  div.querySelectorAll('*').forEach(el => {
    [...el.attributes].forEach(attr => {
      if (attr.name.startsWith('on')) {
        el.removeAttribute(attr.name);
      }
    });

    // Remove tags not in allowlist
    if (!ALLOWED_TAGS.includes(el.tagName.toLowerCase())) {
      el.replaceWith(...el.childNodes);
    }
  });

  return div.innerHTML;
}

export { sanitizeHtml };
```

### CSRF Protection

Include CSRF tokens in state-changing requests:

```javascript
// api-client.js
class SecureApiClient {
  getCsrfToken() {
    // Get from meta tag or cookie
    return document.querySelector('meta[name="csrf-token"]')?.content;
  }

  async fetch(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      'X-CSRF-Token': this.getCsrfToken(),
      ...options.headers
    };

    return fetch(endpoint, { ...options, headers });
  }
}
```

Server should validate CSRF tokens on state-changing requests (POST, PUT, DELETE).

## Password Reset Flow

```javascript
// components/password-reset.js
class PasswordResetForm extends HTMLElement {
  async handleRequest(e) {
    e.preventDefault();
    const email = this.querySelector('#email').value;

    try {
      await fetch('/api/auth/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      this.innerHTML = `
        <p>If an account exists for ${email}, you will receive a password reset email.</p>
      `;
    } catch (error) {
      this.showError('Failed to send reset email');
    }
  }

  async handleReset(e) {
    e.preventDefault();
    const token = new URLSearchParams(window.location.search).get('token');
    const password = this.querySelector('#password').value;

    try {
      await fetch('/api/auth/password-reset/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      });

      pan.publish('router.navigate', { path: '/login' });
      pan.publish('notification.success', {
        message: 'Password reset successful'
      });
    } catch (error) {
      this.showError('Failed to reset password');
    }
  }
}
```

## Troubleshooting

### Problem: Token Expires Too Quickly

**Symptom**: Users frequently get logged out

**Solution**: Implement automatic token refresh in background:

```javascript
// Auto-refresh tokens before expiry
class TokenRefreshManager {
  constructor() {
    this.refreshInterval = null;
  }

  start() {
    // Check token every minute
    this.refreshInterval = setInterval(async () => {
      const token = auth.getToken();
      if (!token) return;

      const payload = auth.decodeToken(token);
      const expiresIn = (payload.exp * 1000) - Date.now();

      // Refresh if expires in less than 5 minutes
      if (expiresIn < 5 * 60 * 1000) {
        try {
          await auth.refresh();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
          auth.logout();
        }
      }
    }, 60 * 1000);
  }

  stop() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }
}

export const tokenRefresh = new TokenRefreshManager();
```

### Problem: OAuth Callback Not Working

**Symptom**: After OAuth redirect, nothing happens

**Solution**: Ensure callback route is registered and handles the code:

```javascript
// In your router setup
pan.subscribe('route.changed', ({ path }) => {
  if (path === '/auth/callback') {
    oauth.handleCallback()
      .then(() => {
        pan.publish('router.navigate', { path: '/dashboard' });
      })
      .catch(error => {
        console.error('OAuth callback failed:', error);
        pan.publish('router.navigate', { path: '/login' });
      });
  }
});
```

### Problem: Users See Flash of Protected Content

**Symptom**: Protected page renders briefly before redirect to login

**Solution**: Check authentication before mounting component:

```javascript
class ProtectedPage extends HTMLElement {
  connectedCallback() {
    // Don't render until auth check complete
    this.checkAuthThenRender();
  }

  async checkAuthThenRender() {
    if (!auth.isAuthenticated()) {
      sessionStorage.setItem('returnUrl', window.location.pathname);
      pan.publish('router.navigate', { path: '/login' });
      return;
    }

    this.render();
  }

  render() {
    // Only called if authenticated
    this.innerHTML = `
      <h1>Protected Content</h1>
      <p>Only authenticated users see this</p>
    `;
  }
}
```

### Problem: Infinite Redirect Loop

**Symptom**: App keeps redirecting between login and protected route

**Solution**: Check for redirect loops in route guard:

```javascript
class RouteGuard extends HTMLElement {
  checkAuth() {
    if (!auth.isAuthenticated() && window.location.pathname !== '/login') {
      sessionStorage.setItem('returnUrl', window.location.pathname);
      pan.publish('router.navigate', { path: '/login' });
    }
  }
}
```

## Best Practices

1. **Never store passwords** - Always hash on the server
2. **Use HTTPS everywhere** - Tokens in plaintext over HTTP are vulnerable
3. **Implement token refresh** - Don't force users to re-login frequently
4. **Validate on the server** - Client-side validation is for UX, not security
5. **Use httpOnly cookies for tokens** - Protects against XSS
6. **Implement CSRF protection** - Required for cookie-based auth
7. **Rate limit authentication endpoints** - Prevent brute force attacks
8. **Log authentication events** - Track suspicious activity
9. **Use secure password requirements** - Minimum 8 characters, complexity rules
10. **Provide 2FA** - Add extra layer of security for sensitive apps

## Exercises

### Exercise 1: Add "Remember Me"

Extend the login form with a "Remember Me" checkbox that:
- Uses a longer-lived refresh token when checked
- Falls back to session-only auth when unchecked
- Persists the preference across sessions

### Exercise 2: Implement 2FA

Add two-factor authentication:
- Generate TOTP secret on enrollment
- Display QR code for authenticator apps
- Validate TOTP codes on login
- Provide backup codes for account recovery

### Exercise 3: Password Strength Meter

Build a password strength indicator that:
- Shows strength in real-time as user types
- Checks length, character variety, common passwords
- Provides feedback on how to improve
- Blocks weak passwords on submission

### Exercise 4: Activity Log

Create an activity log component that:
- Tracks login attempts, password changes, session activity
- Displays timeline of security events
- Alerts on suspicious activity (new device, new location)
- Allows filtering by event type

---

## Summary

Authentication and security are critical to any application that handles user data. LARC applications use industry-standard patterns:

- **JWT tokens** for stateless authentication
- **Automatic token refresh** to maintain sessions
- **OAuth integration** for social login
- **RBAC** for fine-grained authorization
- **XSS and CSRF protection** to prevent attacks
- **Secure token storage** with httpOnly cookies when possible
- **Route guards** to protect sensitive pages
- **Session management** to track and revoke active sessions

Security isn't a checkbox—it's an ongoing practice. Stay updated on security best practices, use HTTPS everywhere, validate all input, and treat user data with respect.

---

## Further Reading

**For complete authentication reference:**
- *Building with LARC* Chapter 8: Authentication and Authorization - All auth patterns and strategies
- *Building with LARC* Chapter 14: Error Handling and Debugging - Security debugging
- *Building with LARC* Appendix E: Recipes and Patterns - Auth implementation recipes
