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
