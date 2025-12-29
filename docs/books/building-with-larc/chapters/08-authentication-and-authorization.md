# Authentication and Authorization

Quick reference for authentication and authorization patterns in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 12.

## Overview

Authentication verifies user identity ("who are you?") while authorization determines permissions ("what can you do?"). LARC applications typically use JWT tokens for authentication and role-based access control (RBAC) for authorization.

**Key Concepts**:
- JWT tokens: Cryptographically signed identity tokens with claims
- Token refresh: Automatic renewal before expiry
- Protected routes: Enforce authentication/authorization requirements
- RBAC: Role-based permission system with inheritance
- Session management: Timeout, activity tracking, secure storage

## Quick Example

```javascript
// Initialize authentication
import { authService } from './services/auth.js';

await authService.initialize();

if (authService.getState().isAuthenticated) {
  // User logged in
  console.log('User:', authService.getState().user);
} else {
  // Redirect to login
  window.location.href = '/login';
}

// Login
const success = await authService.login({
  username: 'alice',
  password: 'secret123'
});

// Check permissions
if (authService.hasRole('admin')) {
  // Show admin features
}
```

## Authentication Service API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `initialize()` | - | Promise\<boolean\> | Load stored tokens, verify, auto-refresh if needed |
| `login(credentials)` | {username, password} | Promise\<boolean\> | Authenticate and store tokens |
| `logout()` | - | void | Clear tokens and state |
| `getState()` | - | AuthState | Get current authentication state |
| `getAccessToken()` | - | string\|null | Get token for API requests |
| `hasRole(role)` | role: string | boolean | Check if user has role |
| `hasPermission(perm)` | permission: string | boolean | Check if user has permission |

### AuthState Interface

```typescript
interface AuthState {
  isAuthenticated: boolean;
  user: UserClaims | null;
  tokens: AuthTokens | null;
}

interface UserClaims {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}
```

## API Interceptor Pattern

Automatically add authentication headers to requests:

```javascript
// Add bearer token to requests
api.interceptors.request.use(async (config) => {
  const token = authService.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      await authService.refreshAccessToken();
      
      const newToken = authService.getAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return api(error.config);
    }
    return Promise.reject(error);
  }
);
```

## Protected Routes

### Route Guard Component

```javascript
class ProtectedRoute extends HTMLElement {
  connectedCallback() {
    const state = authService.getState();
    
    if (!state.isAuthenticated) {
      const redirect = encodeURIComponent(window.location.pathname);
      window.location.href = `/login?redirect=${redirect}`;
      return;
    }
    
    // Check roles
    const requiredRoles = this.getAttribute('roles')?.split(',') || [];
    if (requiredRoles.length) {
      const hasRole = requiredRoles.some(r => authService.hasRole(r));
      if (!hasRole) {
        window.location.href = '/forbidden';
        return;
      }
    }
  }
}

customElements.define('protected-route', ProtectedRoute);
```

### Usage

```html
<!-- Public route -->
<route path="/" component="home-page"></route>

<!-- Requires authentication -->
<route path="/dashboard">
  <protected-route>
    <dashboard-page></dashboard-page>
  </protected-route>
</route>

<!-- Requires admin role -->
<route path="/admin">
  <protected-route roles="admin">
    <admin-panel></admin-panel>
  </protected-route>
</route>
```

## Role-Based Access Control

### RBAC Configuration

```javascript
const ROLES = {
  guest: {
    id: 'guest',
    permissions: [
      { resource: 'content', action: 'read', scope: 'public' }
    ]
  },
  
  user: {
    id: 'user',
    inherits: ['guest'],
    permissions: [
      { resource: 'profile', action: 'read', scope: 'own' },
      { resource: 'profile', action: 'update', scope: 'own' },
      { resource: 'content', action: 'create', scope: 'own' }
    ]
  },
  
  moderator: {
    id: 'moderator',
    inherits: ['user'],
    permissions: [
      { resource: 'content', action: 'update', scope: 'all' },
      { resource: 'content', action: 'delete', scope: 'all' }
    ]
  },
  
  admin: {
    id: 'admin',
    inherits: ['moderator'],
    permissions: [
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'settings', action: 'update' }
    ]
  }
};
```

### Authorization Service API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getPermissions(roleId)` | roleId: string | Permission[] | Get all permissions (including inherited) |
| `hasPermission(roles, resource, action, scope?)` | roles: string[], resource: string, action: string, scope?: string | boolean | Check if any role has permission |
| `canAccess(roles, resource, action, ownerId?, userId?)` | roles: string[], resource: string, action: string, ownerId?: string, userId?: string | boolean | Check access with ownership |

### Conditional Rendering

```javascript
class AuthorizedContent extends HTMLElement {
  connectedCallback() {
    const resource = this.getAttribute('resource');
    const action = this.getAttribute('action');
    
    const state = authService.getState();
    const authorized = state.user && 
      authz.hasPermission(state.user.roles, resource, action);
    
    if (!authorized) {
      this.style.display = 'none';
    }
  }
}

customElements.define('authorized-content', AuthorizedContent);
```

## Session Management

### Session Timeout

```javascript
class SessionManager {
  constructor(timeoutMinutes, warningMinutes) {
    this.timeoutMinutes = timeoutMinutes;
    this.warningMinutes = warningMinutes;
    this.setupActivityListeners();
  }
  
  start() {
    this.resetTimeout();
  }
  
  resetTimeout() {
    clearTimeout(this.timeoutId);
    clearTimeout(this.warningId);
    
    // Warning before timeout
    const warningMs = this.warningMinutes * 60 * 1000;
    this.warningId = setTimeout(() => {
      this.showWarning();
    }, warningMs);
    
    // Logout on timeout
    const timeoutMs = this.timeoutMinutes * 60 * 1000;
    this.timeoutId = setTimeout(() => {
      authService.logout();
      window.location.href = '/login?reason=timeout';
    }, timeoutMs);
  }
  
  setupActivityListeners() {
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, () => {
        if (authService.getState().isAuthenticated) {
          this.resetTimeout();
        }
      }, { passive: true });
    });
  }
}

// Initialize with 30-minute timeout
const sessionManager = new SessionManager(30, 25);
sessionManager.start();
```

## Security Best Practices

### Input Validation

```javascript
const validators = {
  email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  
  password: (value) => {
    const errors = [];
    if (value.length < 8) errors.push('8+ characters required');
    if (!/[A-Z]/.test(value)) errors.push('Uppercase required');
    if (!/[a-z]/.test(value)) errors.push('Lowercase required');
    if (!/[0-9]/.test(value)) errors.push('Number required');
    if (!/[^A-Za-z0-9]/.test(value)) errors.push('Special char required');
    return { valid: errors.length === 0, errors };
  },
  
  sanitize: (value) => 
    value.replace(/[<>]/g, '')
         .replace(/javascript:/gi, '')
         .trim()
};
```

### CSRF Protection

```javascript
class CSRFProtection {
  generateToken() {
    const token = this.randomString(32);
    sessionStorage.setItem('csrf-token', token);
    return token;
  }
  
  getToken() {
    return sessionStorage.getItem('csrf-token') || '';
  }
  
  addToHeaders(headers) {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken()
    };
  }
  
  randomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array).map(x => chars[x % chars.length]).join('');
  }
}

const csrf = new CSRFProtection();
```

## Component Reference

See Chapter 20 for authentication-related components:
- **pan-auth**: Complete authentication component
- **pan-user-menu**: User profile dropdown with logout

## Complete Example: Login Form

```javascript
class LoginForm extends HTMLElement {
  connectedCallback() {
    this.state = {
      username: '',
      password: '',
      loading: false,
      error: null
    };
    
    csrf.generateToken();
    this.render();
  }
  
  async handleSubmit(e) {
    e.preventDefault();
    
    this.state.loading = true;
    this.state.error = null;
    this.render();
    
    try {
      const success = await authService.login({
        username: this.state.username,
        password: this.state.password
      });
      
      if (success) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/dashboard';
        window.location.href = redirect;
      } else {
        this.state.error = 'Invalid credentials';
      }
    } catch (err) {
      this.state.error = 'Login failed. Try again.';
    } finally {
      this.state.loading = false;
      this.render();
    }
  }
  
  render() {
    this.innerHTML = `
      <form class="login-form">
        ${this.state.error ? `<div class="error">${this.state.error}</div>` : ''}
        
        <label>
          Username
          <input name="username" value="${this.state.username}" required>
        </label>
        
        <label>
          Password
          <input type="password" name="password" value="${this.state.password}" required>
        </label>
        
        <button type="submit" ${this.state.loading ? 'disabled' : ''}>
          ${this.state.loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
    `;
    
    this.querySelector('form').addEventListener('submit', (e) => this.handleSubmit(e));
    this.querySelector('[name="username"]').addEventListener('input', (e) => {
      this.state.username = e.target.value;
    });
    this.querySelector('[name="password"]').addEventListener('input', (e) => {
      this.state.password = e.target.value;
    });
  }
}

customElements.define('login-form', LoginForm);
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 12 (Authentication and Authorization)
- **Components**: Chapter 20 (pan-auth, pan-user-menu)
- **Patterns**: Appendix E (Security Patterns)
- **Related**: Chapter 7 (API Authentication), Chapter 9 (WebSocket Authentication)

## Common Issues

### Issue: Token expires during request
**Problem**: 401 errors on long-running requests
**Solution**: Refresh token before expiry (subtract 5 minutes from expiry time)

### Issue: Lost authentication on page refresh
**Problem**: User logged out after reload
**Solution**: Call `authService.initialize()` on app startup to restore session

### Issue: Infinite redirect loops
**Problem**: Protected route redirects to login, login redirects to protected route
**Solution**: Check authentication before redirect; use redirect parameter correctly

### Issue: CORS errors with credentials
**Problem**: `Access-Control-Allow-Credentials` errors
**Solution**: Set `credentials: 'include'` in fetch options, enable CORS on server

### Issue: XSS attacks via stored tokens
**Problem**: Token accessible via JavaScript
**Solution**: Use httpOnly cookies for refresh tokens; store access tokens in memory when possible

See *Learning LARC* Chapter 12 for complete authentication flows, OAuth integration, and multi-factor authentication patterns.
