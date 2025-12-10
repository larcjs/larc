# Authentication and Authorization

*In which we learn to keep the riffraff out, manage who gets to do what, and discover that security is less like a lock and more like an onion—layered, sometimes makes you cry, and absolutely essential.*

Authentication and authorization are the bouncer and the VIP list of your application. Authentication answers "who are you?" while authorization answers "what are you allowed to do?" Get either wrong, and you'll either lock out legitimate users or let chaos agents run wild through your carefully constructed digital empire.

In this chapter, we'll explore how to implement robust authentication and authorization in LARC applications, from JWT tokens to role-based access control, all while maintaining the framework's philosophy of explicit, testable, and maintainable code.

## Understanding Authentication vs. Authorization

Before we dive into implementation, let's clarify the distinction that trips up even experienced developers:

**Authentication** is proof of identity. When you show your driver's license at airport security, that's authentication. You're proving you are who you claim to be.

**Authorization** is proof of permission. When you try to board the plane, the gate agent checks if you have a ticket for *this* flight. That's authorization—verifying you're allowed to do the specific thing you're attempting.

In LARC applications, we typically handle authentication through JWT (JSON Web Tokens) and authorization through role-based or permission-based access control. Let's build both systems from the ground up.

## JWT Authentication: The Token Economy

JWT tokens are like those "Hello, My Name Is" stickers, except they're cryptographically signed so people can't just write whatever they want. A JWT contains claims about the user (their ID, username, roles) and a signature that proves the token hasn't been tampered with.

### Creating an Authentication Service

Let's build a comprehensive authentication service that handles login, token generation, and verification:

```typescript
// services/auth.ts
import { api } from '@larc/lib';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserClaims {
  userId: string;
  username: string;
  roles: string[];
  permissions: string[];
}

interface AuthState {
  isAuthenticated: boolean;
  user: UserClaims | null;
  tokens: AuthTokens | null;
}

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth.accessToken',
  REFRESH_TOKEN: 'auth.refreshToken',
  USER_DATA: 'auth.userData'
} as const;

class AuthenticationService {
  private state: AuthState = {
    isAuthenticated: false,
    user: null,
    tokens: null
  };

  // Initialize from stored tokens
  async initialize(): Promise<boolean> {
    const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);

    if (!accessToken || !userData) {
      return false;
    }

    try {
      // Verify the token is still valid
      const user = JSON.parse(userData) as UserClaims;
      const isValid = await this.verifyToken(accessToken);

      if (isValid) {
        this.state = {
          isAuthenticated: true,
          user,
          tokens: {
            accessToken,
            refreshToken: refreshToken || '',
            expiresIn: this.getTokenExpiry(accessToken)
          }
        };
        return true;
      }

      // Token invalid, try refresh
      if (refreshToken) {
        return await this.refreshAccessToken(refreshToken);
      }

      // Can't authenticate, clear everything
      this.clearAuth();
      return false;
    } catch (error) {
      console.error('Auth initialization failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Login with credentials
  async login(credentials: LoginCredentials): Promise<boolean> {
    try {
      const response = await api.post<AuthTokens & { user: UserClaims }>(
        '/auth/login',
        credentials
      );

      const { accessToken, refreshToken, expiresIn, user } = response;

      // Store tokens securely
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      // Update state
      this.state = {
        isAuthenticated: true,
        user,
        tokens: { accessToken, refreshToken, expiresIn }
      };

      // Set up automatic token refresh
      this.scheduleTokenRefresh(expiresIn);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }

  // Logout and clear all auth data
  logout(): void {
    this.clearAuth();
    // Optionally call backend to invalidate tokens
    api.post('/auth/logout', {
      refreshToken: this.state.tokens?.refreshToken
    }).catch(err => console.error('Logout notification failed:', err));
  }

  // Verify token validity
  private async verifyToken(token: string): Promise<boolean> {
    try {
      await api.get('/auth/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return true;
    } catch {
      return false;
    }
  }

  // Refresh the access token
  private async refreshAccessToken(refreshToken: string): Promise<boolean> {
    try {
      const response = await api.post<AuthTokens>('/auth/refresh', {
        refreshToken
      });

      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response;

      // Update stored tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

      // Update state
      if (this.state.tokens) {
        this.state.tokens = { accessToken, refreshToken: newRefreshToken, expiresIn };
      }

      this.scheduleTokenRefresh(expiresIn);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      return false;
    }
  }

  // Schedule automatic token refresh before expiry
  private scheduleTokenRefresh(expiresIn: number): void {
    // Refresh 5 minutes before expiry
    const refreshTime = (expiresIn - 300) * 1000;

    setTimeout(async () => {
      const refreshToken = this.state.tokens?.refreshToken;
      if (refreshToken) {
        await this.refreshAccessToken(refreshToken);
      }
    }, refreshTime);
  }

  // Extract expiry time from JWT
  private getTokenExpiry(token: string): number {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp;
    } catch {
      return 0;
    }
  }

  // Clear all authentication data
  private clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);

    this.state = {
      isAuthenticated: false,
      user: null,
      tokens: null
    };
  }

  // Get current authentication state
  getState(): Readonly<AuthState> {
    return { ...this.state };
  }

  // Get access token for API requests
  getAccessToken(): string | null {
    return this.state.tokens?.accessToken || null;
  }

  // Check if user has specific role
  hasRole(role: string): boolean {
    return this.state.user?.roles.includes(role) || false;
  }

  // Check if user has specific permission
  hasPermission(permission: string): boolean {
    return this.state.user?.permissions.includes(permission) || false;
  }
}

// Export singleton instance
export const authService = new AuthenticationService();
```

This service handles the complete authentication lifecycle: initialization from stored tokens, login with automatic token refresh scheduling, logout with cleanup, and convenient methods for checking authentication state.

### Securing API Requests

Now let's create an API interceptor that automatically adds authentication tokens to requests:

```typescript
// api/auth-interceptor.ts
import { api } from '@larc/lib';
import { authService } from '../services/auth';

// Add authentication header to all requests
api.interceptors.request.use(async (config) => {
  const token = authService.getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Handle 401 responses by refreshing token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh the token
        const state = authService.getState();
        if (state.tokens?.refreshToken) {
          await authService.refreshAccessToken(state.tokens.refreshToken);

          // Retry original request with new token
          const newToken = authService.getAccessToken();
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        authService.logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
```

This interceptor automatically adds the Bearer token to outgoing requests and handles 401 Unauthorized responses by attempting to refresh the token and retry the request—a pattern that keeps users logged in seamlessly.

## Protected Routes and Navigation Guards

Authentication means nothing if users can still access protected pages by typing URLs directly. Let's build a routing system that enforces authentication:

```typescript
// components/protected-route.ts
import { html, define, Component } from '@larc/lib';
import { authService } from '../services/auth';

interface ProtectedRouteProps {
  requiredRoles?: string[];
  requiredPermissions?: string[];
  fallbackPath?: string;
}

class ProtectedRoute extends Component<ProtectedRouteProps> {
  static tagName = 'protected-route';

  connectedCallback() {
    super.connectedCallback();
    this.checkAccess();
  }

  private checkAccess() {
    const state = authService.getState();

    // Check authentication
    if (!state.isAuthenticated) {
      this.redirectToLogin();
      return;
    }

    // Check roles if specified
    const { requiredRoles, requiredPermissions } = this.props;

    if (requiredRoles?.length) {
      const hasRole = requiredRoles.some(role =>
        authService.hasRole(role)
      );
      if (!hasRole) {
        this.redirectToForbidden();
        return;
      }
    }

    // Check permissions if specified
    if (requiredPermissions?.length) {
      const hasPermission = requiredPermissions.every(permission =>
        authService.hasPermission(permission)
      );
      if (!hasPermission) {
        this.redirectToForbidden();
        return;
      }
    }
  }

  private redirectToLogin() {
    const currentPath = window.location.pathname;
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}`;
  }

  private redirectToForbidden() {
    const { fallbackPath = '/forbidden' } = this.props;
    window.location.href = fallbackPath;
  }

  render() {
    const state = authService.getState();

    if (!state.isAuthenticated) {
      return html`<div>Redirecting to login...</div>`;
    }

    // Render children if authorized
    return html`<slot></slot>`;
  }
}

define(ProtectedRoute);
```

Use it in your application like this:

```typescript
// app.ts
import { html, define, Component } from '@larc/lib';
import './components/protected-route';

class App extends Component {
  render() {
    return html`
      <nav-bar></nav-bar>

      <router-outlet>
        <!-- Public route -->
        <route-handler path="/" component="home-page"></route-handler>
        <route-handler path="/login" component="login-page"></route-handler>

        <!-- Protected route - requires authentication -->
        <route-handler path="/dashboard">
          <protected-route>
            <dashboard-page></dashboard-page>
          </protected-route>
        </route-handler>

        <!-- Protected route - requires admin role -->
        <route-handler path="/admin">
          <protected-route requiredRoles="${['admin']}">
            <admin-panel></admin-panel>
          </protected-route>
        </route-handler>

        <!-- Protected route - requires specific permission -->
        <route-handler path="/reports">
          <protected-route requiredPermissions="${['reports.view']}">
            <reports-page></reports-page>
          </protected-route>
        </route-handler>
      </router-outlet>
    `;
  }
}

define(App);
```

## Role-Based Access Control (RBAC)

RBAC is like organizing your office with different colored keycards. Some doors everyone can open (the break room), some require special access (the server room), and some are only for the CEO (the executive washroom with the good soap).

### Designing a Flexible RBAC System

Here's a comprehensive RBAC implementation that supports hierarchical roles and fine-grained permissions:

```typescript
// services/authorization.ts
interface Permission {
  resource: string;  // e.g., 'users', 'reports', 'settings'
  action: string;    // e.g., 'create', 'read', 'update', 'delete'
  scope?: string;    // e.g., 'own', 'team', 'all'
}

interface Role {
  id: string;
  name: string;
  permissions: Permission[];
  inherits?: string[];  // Inherit permissions from other roles
}

const ROLES: Record<string, Role> = {
  guest: {
    id: 'guest',
    name: 'Guest',
    permissions: [
      { resource: 'content', action: 'read', scope: 'public' }
    ]
  },

  user: {
    id: 'user',
    name: 'User',
    inherits: ['guest'],
    permissions: [
      { resource: 'profile', action: 'read', scope: 'own' },
      { resource: 'profile', action: 'update', scope: 'own' },
      { resource: 'content', action: 'create', scope: 'own' },
      { resource: 'content', action: 'update', scope: 'own' },
      { resource: 'content', action: 'delete', scope: 'own' }
    ]
  },

  moderator: {
    id: 'moderator',
    name: 'Moderator',
    inherits: ['user'],
    permissions: [
      { resource: 'content', action: 'update', scope: 'all' },
      { resource: 'content', action: 'delete', scope: 'all' },
      { resource: 'reports', action: 'read', scope: 'all' },
      { resource: 'reports', action: 'update', scope: 'all' }
    ]
  },

  admin: {
    id: 'admin',
    name: 'Administrator',
    inherits: ['moderator'],
    permissions: [
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'settings', action: 'read' },
      { resource: 'settings', action: 'update' }
    ]
  }
};

class AuthorizationService {
  // Get all permissions for a role (including inherited)
  getPermissions(roleId: string): Permission[] {
    const role = ROLES[roleId];
    if (!role) return [];

    const permissions = [...role.permissions];

    // Recursively add inherited permissions
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        permissions.push(...this.getPermissions(inheritedRoleId));
      }
    }

    return permissions;
  }

  // Check if role has specific permission
  hasPermission(
    roleIds: string[],
    resource: string,
    action: string,
    scope?: string
  ): boolean {
    // Get all permissions for all user's roles
    const allPermissions = roleIds.flatMap(roleId =>
      this.getPermissions(roleId)
    );

    // Check if any permission matches
    return allPermissions.some(permission =>
      permission.resource === resource &&
      permission.action === action &&
      (!scope || !permission.scope || permission.scope === scope)
    );
  }

  // Check if user can perform action on specific resource
  canAccess(
    roleIds: string[],
    resource: string,
    action: string,
    ownerId?: string,
    userId?: string
  ): boolean {
    // First check for 'all' scope
    if (this.hasPermission(roleIds, resource, action, 'all')) {
      return true;
    }

    // Then check for 'own' scope if resource belongs to user
    if (ownerId && userId && ownerId === userId) {
      return this.hasPermission(roleIds, resource, action, 'own');
    }

    // Finally check for permission without scope
    return this.hasPermission(roleIds, resource, action);
  }

  // Get user-friendly permission label
  getPermissionLabel(permission: Permission): string {
    const scopeText = permission.scope ? ` (${permission.scope})` : '';
    return `${permission.action} ${permission.resource}${scopeText}`;
  }
}

export const authz = new AuthorizationService();
```

### Using Authorization in Components

Let's create a component that conditionally renders content based on permissions:

```typescript
// components/authorized-content.ts
import { html, define, Component } from '@larc/lib';
import { authService } from '../services/auth';
import { authz } from '../services/authorization';

interface AuthorizedContentProps {
  resource: string;
  action: string;
  fallback?: string;
}

class AuthorizedContent extends Component<AuthorizedContentProps> {
  static tagName = 'authorized-content';

  private isAuthorized(): boolean {
    const state = authService.getState();
    if (!state.user) return false;

    const { resource, action } = this.props;
    return authz.hasPermission(state.user.roles, resource, action);
  }

  render() {
    if (this.isAuthorized()) {
      return html`<slot></slot>`;
    }

    const { fallback } = this.props;
    if (fallback) {
      return html`<div class="unauthorized">${fallback}</div>`;
    }

    return html``;
  }
}

define(AuthorizedContent);

// Usage example:
// <authorized-content resource="users" action="delete">
//   <button onclick="${this.deleteUser}">Delete User</button>
// </authorized-content>
```

## Session Management Best Practices

Session management is the art of remembering who users are across requests without making them log in every five seconds or leaving security holes big enough to drive a truck through.

### Implementing Secure Session Storage

```typescript
// utils/secure-storage.ts
class SecureStorage {
  private readonly prefix = '__secure__';

  // Store sensitive data with encryption (in production, use Web Crypto API)
  setSecure(key: string, value: string): void {
    try {
      // In production, encrypt the value before storing
      const encrypted = this.encrypt(value);
      sessionStorage.setItem(`${this.prefix}${key}`, encrypted);
    } catch (error) {
      console.error('Failed to store secure data:', error);
    }
  }

  getSecure(key: string): string | null {
    try {
      const encrypted = sessionStorage.getItem(`${this.prefix}${key}`);
      if (!encrypted) return null;
      return this.decrypt(encrypted);
    } catch (error) {
      console.error('Failed to retrieve secure data:', error);
      return null;
    }
  }

  removeSecure(key: string): void {
    sessionStorage.removeItem(`${this.prefix}${key}`);
  }

  clearSecure(): void {
    const keys = Object.keys(sessionStorage);
    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  // Simple encryption (use Web Crypto API in production!)
  private encrypt(value: string): string {
    // This is a placeholder - use proper encryption in production
    return btoa(value);
  }

  private decrypt(value: string): string {
    // This is a placeholder - use proper decryption in production
    return atob(value);
  }
}

export const secureStorage = new SecureStorage();
```

### Session Timeout and Activity Tracking

Implement automatic session timeout to protect against abandoned sessions:

```typescript
// services/session-manager.ts
import { authService } from './auth';

interface SessionConfig {
  timeoutMinutes: number;
  warningMinutes: number;
}

class SessionManager {
  private timeoutId: number | null = null;
  private warningId: number | null = null;
  private lastActivity: number = Date.now();

  constructor(private config: SessionConfig) {
    this.setupActivityListeners();
  }

  // Start session monitoring
  start(): void {
    this.resetTimeout();
  }

  // Stop session monitoring
  stop(): void {
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);
  }

  // Reset timeout on user activity
  private resetTimeout(): void {
    this.lastActivity = Date.now();

    // Clear existing timers
    if (this.timeoutId) clearTimeout(this.timeoutId);
    if (this.warningId) clearTimeout(this.warningId);

    // Set warning timer
    const warningMs = this.config.warningMinutes * 60 * 1000;
    this.warningId = window.setTimeout(() => {
      this.showTimeoutWarning();
    }, warningMs);

    // Set timeout timer
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    this.timeoutId = window.setTimeout(() => {
      this.handleTimeout();
    }, timeoutMs);
  }

  // Setup listeners for user activity
  private setupActivityListeners(): void {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        // Only reset if user is authenticated
        if (authService.getState().isAuthenticated) {
          this.resetTimeout();
        }
      }, { passive: true });
    });
  }

  // Show warning before timeout
  private showTimeoutWarning(): void {
    const remainingMinutes = this.config.timeoutMinutes - this.config.warningMinutes;

    // Dispatch custom event that UI can listen to
    window.dispatchEvent(new CustomEvent('session-warning', {
      detail: { remainingMinutes }
    }));
  }

  // Handle session timeout
  private handleTimeout(): void {
    authService.logout();

    // Dispatch timeout event
    window.dispatchEvent(new CustomEvent('session-timeout'));

    // Redirect to login
    window.location.href = '/login?reason=timeout';
  }

  // Get time until timeout
  getTimeRemaining(): number {
    const elapsed = Date.now() - this.lastActivity;
    const timeoutMs = this.config.timeoutMinutes * 60 * 1000;
    return Math.max(0, timeoutMs - elapsed);
  }
}

// Initialize with 30-minute timeout, 5-minute warning
export const sessionManager = new SessionManager({
  timeoutMinutes: 30,
  warningMinutes: 25
});
```

## Security Best Practices

Security is like flossing—everyone knows they should do it, but it's easy to skip until problems arise. Let's make sure you're following best practices.

### Input Validation and Sanitization

Never trust user input. Ever. Here's a validation utility:

```typescript
// utils/validation.ts
export const validators = {
  email: (value: string): boolean => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(value);
  },

  password: (value: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (value.length < 8) {
      errors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(value)) {
      errors.push('Password must contain an uppercase letter');
    }
    if (!/[a-z]/.test(value)) {
      errors.push('Password must contain a lowercase letter');
    }
    if (!/[0-9]/.test(value)) {
      errors.push('Password must contain a number');
    }
    if (!/[^A-Za-z0-9]/.test(value)) {
      errors.push('Password must contain a special character');
    }

    return { valid: errors.length === 0, errors };
  },

  sanitize: (value: string): string => {
    return value
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .trim();
  }
};
```

### CSRF Protection

Protect against Cross-Site Request Forgery:

```typescript
// utils/csrf.ts
class CSRFProtection {
  private token: string = '';

  // Generate CSRF token
  generateToken(): string {
    this.token = this.randomString(32);
    sessionStorage.setItem('csrf-token', this.token);
    return this.token;
  }

  // Get current token
  getToken(): string {
    return this.token || sessionStorage.getItem('csrf-token') || '';
  }

  // Validate token
  validateToken(token: string): boolean {
    return token === this.getToken();
  }

  // Add token to request headers
  addToHeaders(headers: Record<string, string>): Record<string, string> {
    return {
      ...headers,
      'X-CSRF-Token': this.getToken()
    };
  }

  private randomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);

    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }

    return result;
  }
}

export const csrf = new CSRFProtection();
```

## Putting It All Together: A Complete Login Flow

Let's build a complete login component that demonstrates everything we've learned:

```typescript
// components/login-form.ts
import { html, define, Component } from '@larc/lib';
import { authService } from '../services/auth';
import { validators } from '../utils/validation';
import { csrf } from '../utils/csrf';

interface LoginFormState {
  username: string;
  password: string;
  rememberMe: boolean;
  isLoading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
}

class LoginForm extends Component {
  static tagName = 'login-form';

  state: LoginFormState = {
    username: '',
    password: '',
    rememberMe: false,
    isLoading: false,
    error: null,
    fieldErrors: {}
  };

  connectedCallback() {
    super.connectedCallback();
    csrf.generateToken(); // Generate CSRF token on mount
  }

  private validate(): boolean {
    const errors: Record<string, string> = {};

    if (!this.state.username) {
      errors.username = 'Username is required';
    }

    if (!this.state.password) {
      errors.password = 'Password is required';
    }

    this.setState({ fieldErrors: errors });
    return Object.keys(errors).length === 0;
  }

  private async handleSubmit(e: Event) {
    e.preventDefault();

    if (!this.validate()) return;

    this.setState({ isLoading: true, error: null });

    try {
      const success = await authService.login({
        username: this.state.username,
        password: this.state.password
      });

      if (success) {
        // Get redirect URL from query params
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect') || '/dashboard';
        window.location.href = redirect;
      } else {
        this.setState({
          error: 'Invalid username or password',
          isLoading: false
        });
      }
    } catch (error) {
      this.setState({
        error: 'An error occurred. Please try again.',
        isLoading: false
      });
    }
  }

  render() {
    const { username, password, rememberMe, isLoading, error, fieldErrors } = this.state;

    return html`
      <div class="login-container">
        <form class="login-form" onsubmit="${this.handleSubmit}">
          <h2>Sign In</h2>

          ${error ? html`
            <div class="alert alert-error">
              ${error}
            </div>
          ` : ''}

          <div class="form-group">
            <label for="username">Username</label>
            <input
              type="text"
              id="username"
              value="${username}"
              oninput="${(e: Event) => this.setState({
                username: (e.target as HTMLInputElement).value
              })}"
              class="${fieldErrors.username ? 'error' : ''}"
              disabled="${isLoading}"
              autocomplete="username"
            />
            ${fieldErrors.username ? html`
              <span class="error-message">${fieldErrors.username}</span>
            ` : ''}
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              type="password"
              id="password"
              value="${password}"
              oninput="${(e: Event) => this.setState({
                password: (e.target as HTMLInputElement).value
              })}"
              class="${fieldErrors.password ? 'error' : ''}"
              disabled="${isLoading}"
              autocomplete="current-password"
            />
            ${fieldErrors.password ? html`
              <span class="error-message">${fieldErrors.password}</span>
            ` : ''}
          </div>

          <div class="form-group checkbox">
            <label>
              <input
                type="checkbox"
                checked="${rememberMe}"
                onchange="${(e: Event) => this.setState({
                  rememberMe: (e.target as HTMLInputElement).checked
                })}"
                disabled="${isLoading}"
              />
              Remember me
            </label>
          </div>

          <button
            type="submit"
            class="btn btn-primary"
            disabled="${isLoading}"
          >
            ${isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div class="form-footer">
            <a href="/forgot-password">Forgot password?</a>
          </div>
        </form>
      </div>

      <style>
        .login-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 1rem;
        }

        .login-form {
          width: 100%;
          max-width: 400px;
          padding: 2rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input[type="text"],
        .form-group input[type="password"] {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 4px;
        }

        .form-group input.error {
          border-color: #dc3545;
        }

        .error-message {
          display: block;
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }

        .alert {
          padding: 0.75rem;
          margin-bottom: 1rem;
          border-radius: 4px;
        }

        .alert-error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .btn {
          width: 100%;
          padding: 0.75rem;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
        }

        .btn-primary {
          background: #007bff;
          color: white;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .form-footer {
          margin-top: 1rem;
          text-align: center;
        }
      </style>
    `;
  }
}

define(LoginForm);
```

## What We've Learned

In this chapter, we've built a complete authentication and authorization system for LARC applications. You now know how to:

- Implement JWT-based authentication with automatic token refresh
- Create protected routes that enforce authentication and authorization
- Build a flexible role-based access control system
- Manage sessions securely with timeout and activity tracking
- Follow security best practices including input validation and CSRF protection
- Create production-ready login flows with proper error handling

Authentication and authorization are the foundation of application security. Get them right, and you'll sleep better at night knowing your users and their data are protected. Get them wrong, and you'll be explaining to your CEO why the company is on the front page of Hacker News for all the wrong reasons.

In the next chapter, we'll explore real-time features, where we'll need to authenticate WebSocket connections and authorize real-time events. Because what good is a secure application if it can't securely push updates to users in real-time?
