# Core Components Reference

> "Good API documentation is like a lighthouse: it doesn't just show you where you are, it shows you where you can go."
>
> — Developer wisdom, hard-won

This chapter provides comprehensive API documentation for LARC's core components—the foundational building blocks that power every LARC application. Unlike the narrative chapters that teach concepts through examples, this is reference material designed for repeated consultation during development.

Think of this chapter as your field guide. When you need to know exactly which attributes `pan-bus` accepts, what events `pan-theme-provider` emits, or how to programmatically control `pan-routes`, you'll find your answers here.

We'll cover four essential components:

- **pan-bus**: The message bus that enables component communication
- **pan-theme-provider**: Centralized theme management with system preference detection
- **pan-theme-toggle**: UI component for theme switching
- **pan-routes**: Runtime-configurable message routing system

Each component section follows the same structure: overview, usage guidance, installation, complete attribute/method/event reference, working examples, and troubleshooting.

## pan-bus

### Overview

`pan-bus` is the central message bus for LARC applications. It implements a publish-subscribe pattern that enables decoupled communication between components. The enhanced version includes memory management, rate limiting, message validation, routing capabilities, and comprehensive debugging tools.

Every LARC application needs exactly one `pan-bus` instance, typically placed in the document's `<head>` or at the root of the `<body>`.

### When to Use

**Use `pan-bus` when:**

- Building any LARC application (it's foundational)
- You need decoupled component communication
- You want components to react to application state changes without direct coupling
- You're implementing request-response patterns between components

**Don't use `pan-bus` when:**

- Building a pure static site with no interactivity
- All your components can communicate through direct DOM manipulation (though PAN is usually better)

### Installation and Setup

The simplest setup requires no configuration:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/core/pan-bus.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>
  <!-- Your application -->
</body>
</html>
```

For production applications, you'll typically add configuration:

```html
<pan-bus
  max-retained="2000"
  max-message-size="2097152"
  debug="false"
  enable-routing="true"
  allow-global-wildcard="false">
</pan-bus>
```

The bus automatically announces readiness by:

1. Setting `window.__panReady = true`
2. Dispatching a `pan:sys.ready` event
3. Exposing global APIs at `window.pan.bus`, `window.pan.routes`, and `window.pan.debug`

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `max-retained` | Integer | `1000` | Maximum number of retained messages. When exceeded, oldest messages are evicted using LRU strategy. |
| `max-message-size` | Integer | `1048576` (1MB) | Maximum total message size in bytes, including metadata. |
| `max-payload-size` | Integer | `524288` (512KB) | Maximum payload (data field) size in bytes. |
| `cleanup-interval` | Integer | `30000` (30s) | Milliseconds between automatic cleanup of dead subscriptions and stale rate limit data. |
| `rate-limit` | Integer | `1000` | Maximum messages per client per second. |
| `allow-global-wildcard` | Boolean | `true` | Whether to allow `*` wildcard subscriptions (subscribe to all messages). Set to `false` for security in production. |
| `debug` | Boolean | `false` | Enable verbose console logging for all bus operations. |
| `enable-routing` | Boolean | `false` | Enable the declarative routing system (see `pan-routes` section). |
| `enable-tracing` | Boolean | `false` | Enable message tracing for debugging (captures full message history). |

**Example with configuration:**

```html
<!-- Production configuration -->
<pan-bus
  max-retained="5000"
  max-message-size="2097152"
  rate-limit="2000"
  allow-global-wildcard="false"
  enable-routing="true">
</pan-bus>
```

### Methods

All methods are available on the `pan-bus` element instance and through the global `window.pan.bus` reference.

#### publish(topic, data, options)

Publishes a message to the bus.

**Parameters:**
- `topic` (String, required): Message topic/identifier
- `data` (Any, required): Message payload (must be JSON-serializable)
- `options` (Object, optional): Additional message options
  - `retain` (Boolean): Store message for late subscribers
  - `clientId` (String): Publisher identifier for rate limiting
  - Any other fields are included in the message

**Returns:** `undefined`

**Example:**

```javascript
const bus = document.querySelector('pan-bus');

// Simple publish
bus.publish('user.login', { userId: '123', name: 'Alice' });

// Publish with retention
bus.publish('app.config', { theme: 'dark' }, { retain: true });

// Publish with metadata
bus.publish('sensor.update',
  { temperature: 22.5, humidity: 45 },
  {
    retain: true,
    source: 'sensor-01',
    priority: 'high'
  }
);
```

#### subscribe(topics, handler)

Subscribes to one or more topic patterns.

**Parameters:**
- `topics` (String or Array<String>, required): Topic pattern(s) to subscribe to. Supports wildcards: `user.*` matches `user.login`, `user.logout`, etc.
- `handler` (Function, required): Callback function receiving `(message)` when matching messages arrive

**Returns:** `Function` - Unsubscribe function to call when done

**Example:**

```javascript
const bus = document.querySelector('pan-bus');

// Subscribe to single topic
const unsub1 = bus.subscribe('user.login', (msg) => {
  console.log('User logged in:', msg.data);
});

// Subscribe to multiple topics
const unsub2 = bus.subscribe(['cart.add', 'cart.remove'], (msg) => {
  console.log('Cart changed:', msg.topic, msg.data);
});

// Subscribe with wildcard
const unsub3 = bus.subscribe('sensor.*', (msg) => {
  console.log('Sensor update:', msg.topic, msg.data);
});

// Unsubscribe when done
unsub1();
unsub2();
unsub3();
```

#### PanBusEnhanced.matches(topic, pattern)

Static method to test if a topic matches a pattern.

**Parameters:**
- `topic` (String, required): Topic to test
- `pattern` (String, required): Pattern to match against (supports wildcards)

**Returns:** `Boolean` - True if topic matches pattern

**Example:**

```javascript
const Bus = customElements.get('pan-bus');

Bus.matches('user.login', 'user.*');       // true
Bus.matches('user.login', 'user.login');   // true
Bus.matches('user.login', 'cart.*');       // false
Bus.matches('user.login', '*');            // true
Bus.matches('sensor.temperature', 'sensor.temp*'); // true (wildcard in pattern)
```

### Events

The bus listens for these custom events (dispatched by components):

#### pan:hello

Registers a client with the bus.

**Detail payload:**
```javascript
{
  id: String,           // Unique client identifier
  caps: Array<String>   // Optional client capabilities
}
```

**Example:**

```javascript
document.dispatchEvent(new CustomEvent('pan:hello', {
  bubbles: true,
  detail: {
    id: 'my-component-123',
    caps: ['request-response', 'streaming']
  }
}));
```

#### pan:subscribe

Subscribes to topics.

**Detail payload:**
```javascript
{
  topics: Array<String>,  // Topic patterns to subscribe to
  clientId: String,       // Optional client identifier
  options: {
    retained: Boolean     // Request retained messages on subscription
  }
}
```

**Example:**

```javascript
document.dispatchEvent(new CustomEvent('pan:subscribe', {
  bubbles: true,
  detail: {
    topics: ['user.*', 'app.config'],
    clientId: 'dashboard-widget',
    options: { retained: true }
  }
}));
```

#### pan:unsubscribe

Unsubscribes from topics.

**Detail payload:**
```javascript
{
  topics: Array<String>,  // Topic patterns to unsubscribe from
  clientId: String        // Optional client identifier
}
```

#### pan:publish

Publishes a message.

**Detail payload:**
```javascript
{
  topic: String,        // Message topic
  data: Any,           // Message payload (JSON-serializable)
  retain: Boolean,     // Store for late subscribers
  clientId: String,    // Publisher identifier
  // Any additional fields
}
```

#### pan:request

Publishes a request message (same as `pan:publish` but semantic distinction).

#### pan:reply

Delivers a reply message (bypasses normal routing).

#### pan:sys.stats

Requests bus statistics.

**Response via `pan:deliver`:**
```javascript
{
  topic: 'pan:sys.stats',
  data: {
    published: Number,      // Total messages published
    delivered: Number,      // Total messages delivered
    dropped: Number,        // Messages dropped (rate limit)
    retainedEvicted: Number, // Retained messages evicted
    subsCleanedUp: Number,  // Dead subscriptions cleaned
    errors: Number,         // Total errors
    subscriptions: Number,  // Current subscription count
    clients: Number,        // Registered clients
    retained: Number,       // Current retained messages
    config: Object         // Current configuration
  }
}
```

#### pan:sys.clear-retained

Clears retained messages.

**Detail payload:**
```javascript
{
  pattern: String  // Optional: only clear topics matching pattern
}
```

**Example:**

```javascript
// Clear all retained messages
document.dispatchEvent(new CustomEvent('pan:sys.clear-retained', {
  bubbles: true,
  detail: {}
}));

// Clear specific pattern
document.dispatchEvent(new CustomEvent('pan:sys.clear-retained', {
  bubbles: true,
  detail: { pattern: 'sensor.*' }
}));
```

The bus dispatches these events:

#### pan:sys.ready

Dispatched when bus is ready.

**Detail payload:**
```javascript
{
  enhanced: true,
  routing: Boolean,    // Whether routing is enabled
  tracing: Boolean,    // Whether tracing is enabled
  config: Object       // Full configuration
}
```

#### pan:sys.error

Dispatched when errors occur.

**Detail payload:**
```javascript
{
  code: String,       // Error code (e.g., 'RATE_LIMIT_EXCEEDED')
  message: String,    // Human-readable error message
  details: Object     // Additional error context
}
```

#### pan:deliver

Dispatched to deliver messages to subscribers.

**Detail payload:** The full message object with these guaranteed fields:
```javascript
{
  topic: String,      // Message topic
  data: Any,         // Message payload
  id: String,        // Unique message ID (UUID)
  ts: Number         // Timestamp (milliseconds since epoch)
  // Plus any additional fields from publish
}
```

### Working Examples

#### Basic Publish-Subscribe

```javascript
// Component A: Subscribe
class DashboardWidget extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    this.unsubscribe = bus.subscribe('user.login', (msg) => {
      this.innerHTML = `Welcome, ${msg.data.name}!`;
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

// Component B: Publish
class LoginForm extends HTMLElement {
  handleLogin(userId, name) {
    const bus = document.querySelector('pan-bus');
    bus.publish('user.login', { userId, name });
  }
}
```

#### Using Retained Messages

```javascript
// Publish configuration once
const bus = document.querySelector('pan-bus');
bus.publish('app.config',
  {
    apiUrl: 'https://api.example.com',
    theme: 'dark',
    language: 'en'
  },
  { retain: true }
);

// Late subscriber gets retained message
class SettingsPanel extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    // Request retained messages
    document.dispatchEvent(new CustomEvent('pan:subscribe', {
      bubbles: true,
      detail: {
        topics: ['app.config'],
        options: { retained: true }  // Get retained message immediately
      }
    }));

    // Handler receives retained message
    this.unsubscribe = bus.subscribe('app.config', (msg) => {
      this.applyConfig(msg.data);
    });
  }
}
```

#### Wildcard Subscriptions

```javascript
// Subscribe to all sensor events
const bus = document.querySelector('pan-bus');

const unsub = bus.subscribe('sensor.*', (msg) => {
  console.log(`Sensor ${msg.topic}:`, msg.data);
});

// These all match
bus.publish('sensor.temperature', { value: 22.5 });
bus.publish('sensor.humidity', { value: 45 });
bus.publish('sensor.pressure', { value: 1013 });
```

#### Request-Response Pattern

```javascript
// Requester
class DataFetcher extends HTMLElement {
  async fetchData(userId) {
    const requestId = crypto.randomUUID();
    const bus = document.querySelector('pan-bus');

    return new Promise((resolve) => {
      // Subscribe to response
      const unsub = bus.subscribe(`response.${requestId}`, (msg) => {
        unsub();  // Unsubscribe after first response
        resolve(msg.data);
      });

      // Publish request
      bus.publish('data.fetch',
        { userId },
        { requestId, responseChannel: `response.${requestId}` }
      );

      // Timeout after 5 seconds
      setTimeout(() => {
        unsub();
        resolve(null);
      }, 5000);
    });
  }
}

// Responder
class DataProvider extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    this.unsubscribe = bus.subscribe('data.fetch', async (msg) => {
      const data = await this.fetchUserData(msg.data.userId);

      // Publish response
      bus.publish(msg.responseChannel, data);
    });
  }
}
```

#### Monitoring Bus Health

```javascript
// Get statistics
document.dispatchEvent(new CustomEvent('pan:sys.stats', {
  bubbles: true
}));

document.addEventListener('pan:deliver', (e) => {
  if (e.detail.topic === 'pan:sys.stats') {
    console.log('Bus stats:', e.detail.data);
    // {
    //   published: 1523,
    //   delivered: 3046,
    //   dropped: 5,
    //   subscriptions: 12,
    //   retained: 8,
    //   ...
    // }
  }
});

// Monitor errors
document.addEventListener('pan:sys.error', (e) => {
  console.error('Bus error:', e.detail.code, e.detail.message);
});
```

### Common Issues and Solutions

**Issue: Messages not being delivered**

Check these common causes:

1. Bus not initialized: Wait for `pan:sys.ready` event
2. Subscription pattern doesn't match topic: Use `PanBusEnhanced.matches()` to test
3. Component disconnected: Subscribe in `connectedCallback()`, unsubscribe in `disconnectedCallback()`
4. Rate limit exceeded: Check console for errors, increase `rate-limit` attribute

```javascript
// Wait for bus ready
document.addEventListener('pan:sys.ready', () => {
  // Now safe to subscribe/publish
});

// Or check programmatically
if (window.__panReady) {
  // Bus is ready
}
```

**Issue: Memory leaks from subscriptions**

Always unsubscribe in `disconnectedCallback()`:

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');
    this.unsubscribe = bus.subscribe('my.topic', this.handler);
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }
}
```

**Issue: "Data must be JSON-serializable" error**

Message payloads cannot contain functions, DOM nodes, or circular references:

```javascript
// Bad
bus.publish('user.data', {
  element: document.querySelector('#foo'),  // DOM node
  callback: () => {}                        // Function
});

// Good
bus.publish('user.data', {
  elementId: 'foo',                         // String reference
  shouldCallback: true                      // Boolean flag
});
```

**Issue: Rate limiting in production**

Adjust `rate-limit` based on your application's needs:

```html
<!-- For high-frequency updates (sensor data, etc.) -->
<pan-bus rate-limit="5000"></pan-bus>

<!-- For typical applications -->
<pan-bus rate-limit="1000"></pan-bus>
```

---

## pan-theme-provider

### Overview

`pan-theme-provider` manages application theme state and automatically responds to system light/dark mode preferences. It broadcasts theme changes via the PAN bus, enabling all components to update their appearance in a coordinated fashion.

The provider supports three theme modes: `light`, `dark`, and `auto`. In auto mode, it tracks system preferences and updates automatically when users change their OS theme settings.

### When to Use

**Use `pan-theme-provider` when:**

- Your application supports light and dark themes
- You want to respect user system preferences
- You need coordinated theme switching across multiple components
- You're building a theme-aware component library

**Don't use `pan-theme-provider` when:**

- Your application has only one fixed theme
- You're implementing a custom theme system that goes beyond light/dark

### Installation and Setup

Include the provider once per application, typically near the bus:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/core/pan-bus.mjs"></script>
  <script type="module" src="/ui/pan-theme-provider.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-theme-provider theme="auto"></pan-theme-provider>
  <!-- Your application -->
</body>
</html>
```

The provider automatically:

1. Detects current system theme preference
2. Applies theme to `document.documentElement` via `data-theme` attribute
3. Sets `color-scheme` CSS property for native UI elements
4. Broadcasts `theme.changed` messages via PAN bus
5. Monitors system preference changes

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `theme` | String | `"auto"` | Theme mode: `"light"`, `"dark"`, or `"auto"`. Auto mode follows system preferences. |

**Example:**

```html
<!-- Use system preference (recommended) -->
<pan-theme-provider theme="auto"></pan-theme-provider>

<!-- Force light theme -->
<pan-theme-provider theme="light"></pan-theme-provider>

<!-- Force dark theme -->
<pan-theme-provider theme="dark"></pan-theme-provider>
```

### Methods

All methods are available on the provider element instance.

#### setTheme(theme)

Sets the theme mode.

**Parameters:**
- `theme` (String, required): One of `"light"`, `"dark"`, or `"auto"`

**Returns:** `undefined`

**Example:**

```javascript
const provider = document.querySelector('pan-theme-provider');

provider.setTheme('dark');  // Switch to dark theme
provider.setTheme('auto');  // Switch to auto mode
```

#### getTheme()

Gets the current theme mode (not the effective theme).

**Returns:** `String` - Current theme mode (`"light"`, `"dark"`, or `"auto"`)

**Example:**

```javascript
const provider = document.querySelector('pan-theme-provider');
console.log(provider.getTheme());  // "auto"
```

#### getEffectiveTheme()

Gets the actual theme being applied (resolves auto mode to light or dark).

**Returns:** `String` - Effective theme (`"light"` or `"dark"`)

**Example:**

```javascript
const provider = document.querySelector('pan-theme-provider');
console.log(provider.getEffectiveTheme());  // "dark" (if system is dark)
```

#### getSystemTheme()

Gets the current system theme preference.

**Returns:** `String` - System theme (`"light"` or `"dark"`)

**Example:**

```javascript
const provider = document.querySelector('pan-theme-provider');
console.log(provider.getSystemTheme());  // "dark"
```

### Events

The provider dispatches these events:

#### theme-change (DOM event)

Dispatched whenever the theme changes.

**Detail payload:**
```javascript
{
  theme: String,      // Current theme mode ("light", "dark", or "auto")
  effective: String   // Effective theme ("light" or "dark")
}
```

**Example:**

```javascript
const provider = document.querySelector('pan-theme-provider');

provider.addEventListener('theme-change', (e) => {
  console.log('Theme changed:', e.detail.theme, '->', e.detail.effective);
});
```

#### theme.changed (PAN message)

Published via PAN bus when theme changes.

**Message payload:**
```javascript
{
  theme: String,      // Current theme mode
  effective: String   // Effective theme
}
```

**Example:**

```javascript
const bus = document.querySelector('pan-bus');

bus.subscribe('theme.changed', (msg) => {
  console.log('Theme changed to:', msg.data.effective);
  this.updateStyles(msg.data.effective);
});
```

#### theme.system-changed (PAN message)

Published when system theme preference changes.

**Message payload:**
```javascript
{
  theme: String  // New system theme ("light" or "dark")
}
```

### Working Examples

#### Basic Theme Setup

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Define theme variables */
    :root[data-theme="light"] {
      --bg: #ffffff;
      --text: #1e293b;
      --border: #e2e8f0;
    }

    :root[data-theme="dark"] {
      --bg: #1e293b;
      --text: #f1f5f9;
      --border: #334155;
    }

    body {
      background: var(--bg);
      color: var(--text);
      border-color: var(--border);
    }
  </style>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-theme-provider theme="auto"></pan-theme-provider>

  <h1>Theme-aware content</h1>
</body>
</html>
```

#### Component Responding to Theme Changes

```javascript
class ThemedCard extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');

    this.unsubscribe = bus.subscribe('theme.changed', (msg) => {
      this.updateTheme(msg.data.effective);
    });

    // Get initial theme
    const provider = document.querySelector('pan-theme-provider');
    if (provider) {
      this.updateTheme(provider.getEffectiveTheme());
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }

  updateTheme(theme) {
    this.className = `card theme-${theme}`;
    // Update component appearance
  }
}

customElements.define('themed-card', ThemedCard);
```

#### Programmatic Theme Control

```javascript
// Toggle between light and dark
function toggleTheme() {
  const provider = document.querySelector('pan-theme-provider');
  const current = provider.getEffectiveTheme();
  provider.setTheme(current === 'light' ? 'dark' : 'light');
}

// Cycle through all modes
function cycleTheme() {
  const provider = document.querySelector('pan-theme-provider');
  const current = provider.getTheme();
  const cycle = { auto: 'light', light: 'dark', dark: 'auto' };
  provider.setTheme(cycle[current]);
}

// Reset to auto
function resetTheme() {
  const provider = document.querySelector('pan-theme-provider');
  provider.setTheme('auto');
}
```

#### Persisting Theme Preference

```javascript
class ThemeManager extends HTMLElement {
  connectedCallback() {
    const bus = document.querySelector('pan-bus');
    const provider = document.querySelector('pan-theme-provider');

    // Load saved preference
    const saved = localStorage.getItem('theme-preference');
    if (saved && provider) {
      provider.setTheme(saved);
    }

    // Save when theme changes
    this.unsubscribe = bus.subscribe('theme.changed', (msg) => {
      localStorage.setItem('theme-preference', msg.data.theme);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) this.unsubscribe();
  }
}

customElements.define('theme-manager', ThemeManager);
```

### Common Issues and Solutions

**Issue: Theme not applying**

Ensure CSS variables are defined for both themes:

```css
/* Must define for both themes */
:root[data-theme="light"] {
  --color: #000;
}

:root[data-theme="dark"] {
  --color: #fff;
}

/* Then use in components */
.my-element {
  color: var(--color);
}
```

**Issue: Flash of wrong theme on page load**

Set theme before page renders to prevent flash:

```html
<head>
  <!-- Inline script before any content -->
  <script>
    // Apply saved theme immediately
    const saved = localStorage.getItem('theme-preference');
    if (saved && saved !== 'auto') {
      document.documentElement.setAttribute('data-theme', saved);
    } else {
      // Detect system preference
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
  </script>

  <!-- Then load components -->
  <script type="module" src="components.js"></script>
</head>
```

**Issue: Components not updating when theme changes**

Subscribe to `theme.changed` in `connectedCallback()`:

```javascript
connectedCallback() {
  const bus = document.querySelector('pan-bus');
  this.unsubscribe = bus.subscribe('theme.changed', (msg) => {
    this.render();  // Re-render with new theme
  });
}
```

---

## pan-theme-toggle

### Overview

`pan-theme-toggle` is a UI component for switching themes. It displays the current theme and allows users to cycle through light, dark, and auto modes. The component integrates with `pan-theme-provider` via the PAN bus.

The toggle supports three visual variants: icon-only, button with label, and dropdown menu with all theme options.

### When to Use

**Use `pan-theme-toggle` when:**

- You want to provide users control over theme preferences
- You need a quick, accessible way to switch themes
- You're building a settings panel or toolbar

**Don't use `pan-theme-toggle` when:**

- You want themes to be automatic only (use only `pan-theme-provider`)
- You're implementing custom theme controls with different UX

### Installation and Setup

Include the toggle component in your UI:

```html
<pan-bus></pan-bus>
<pan-theme-provider theme="auto"></pan-theme-provider>

<!-- Icon-only toggle (default) -->
<pan-theme-toggle></pan-theme-toggle>

<!-- Button with label -->
<pan-theme-toggle label="Theme"></pan-theme-toggle>

<!-- Dropdown menu -->
<pan-theme-toggle variant="dropdown"></pan-theme-toggle>
```

The toggle automatically:

1. Queries the theme provider for current theme
2. Subscribes to `theme.changed` messages
3. Updates its icon to reflect current theme
4. Communicates theme changes to the provider

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | String | `""` | Optional text label to display next to icon. Only used with `button` variant. |
| `variant` | String | `"icon"` | Visual style: `"icon"` (icon only), `"button"` (icon + label), or `"dropdown"` (menu with all options). |

**Examples:**

```html
<!-- Icon only (minimal) -->
<pan-theme-toggle></pan-theme-toggle>

<!-- Button with label -->
<pan-theme-toggle variant="button" label="Theme"></pan-theme-toggle>

<!-- Dropdown menu -->
<pan-theme-toggle variant="dropdown"></pan-theme-toggle>
```

### Methods

The toggle component has no public methods. All interaction happens through the UI or via the theme provider.

### Events

The toggle doesn't emit custom events. Theme changes are communicated through `pan-theme-provider`.

### Working Examples

#### Navigation Bar with Theme Toggle

```html
<nav class="main-nav">
  <div class="nav-brand">
    <h1>My App</h1>
  </div>

  <div class="nav-actions">
    <button>Settings</button>
    <pan-theme-toggle variant="icon"></pan-theme-toggle>
  </div>
</nav>

<style>
  .main-nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 2rem;
    background: var(--color-surface);
    border-bottom: 1px solid var(--color-border);
  }

  .nav-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
</style>
```

#### Settings Panel with Dropdown

```html
<div class="settings-panel">
  <h2>Preferences</h2>

  <div class="setting-row">
    <label>Theme</label>
    <pan-theme-toggle variant="dropdown"></pan-theme-toggle>
  </div>

  <div class="setting-row">
    <label>Language</label>
    <select>
      <option>English</option>
      <option>Espanol</option>
    </select>
  </div>
</div>

<style>
  .setting-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 0;
    border-bottom: 1px solid var(--color-border);
  }
</style>
```

#### Responsive Theme Toggle

```html
<!-- Show dropdown on mobile, icon on desktop -->
<style>
  .theme-toggle-mobile {
    display: block;
  }

  .theme-toggle-desktop {
    display: none;
  }

  @media (min-width: 768px) {
    .theme-toggle-mobile {
      display: none;
    }

    .theme-toggle-desktop {
      display: block;
    }
  }
</style>

<div class="theme-toggle-mobile">
  <pan-theme-toggle variant="dropdown"></pan-theme-toggle>
</div>

<div class="theme-toggle-desktop">
  <pan-theme-toggle variant="icon"></pan-theme-toggle>
</div>
```

#### Custom Styled Toggle

```html
<pan-theme-toggle variant="button" label="Appearance"></pan-theme-toggle>

<style>
  pan-theme-toggle {
    /* Override CSS custom properties */
    --color-surface: #f8fafc;
    --color-border: #cbd5e1;
    --color-text: #1e293b;
    --font-sans: 'Inter', system-ui, sans-serif;
  }

  pan-theme-toggle::part(button) {
    /* Style shadow DOM parts if exposed */
    border-radius: 0.75rem;
    padding: 0.75rem 1.5rem;
  }
</style>
```

### Common Issues and Solutions

**Issue: Toggle not working**

Ensure `pan-theme-provider` is present:

```html
<!-- Provider must exist -->
<pan-theme-provider theme="auto"></pan-theme-provider>

<!-- Then toggle will work -->
<pan-theme-toggle></pan-theme-toggle>
```

**Issue: Toggle shows wrong icon**

The toggle subscribes to theme changes on connect. If added dynamically, wait for PAN bus:

```javascript
// Wait for bus ready before adding toggle
document.addEventListener('pan:sys.ready', () => {
  const toggle = document.createElement('pan-theme-toggle');
  document.body.appendChild(toggle);
});
```

**Issue: Dropdown menu positioning**

The dropdown uses `position: absolute` and may need container constraints:

```html
<div style="position: relative;">
  <pan-theme-toggle variant="dropdown"></pan-theme-toggle>
</div>
```

---

## pan-routes

### Overview

`pan-routes` provides runtime-configurable message routing for the PAN bus. It enables declarative routing rules that match messages based on topic, content, or metadata, then perform actions like emitting new messages, forwarding to different topics, logging, or calling handler functions.

Routes are defined programmatically and can be enabled, disabled, or updated at runtime. This makes `pan-routes` ideal for complex message flows, cross-cutting concerns (logging, monitoring), and workflow orchestration.

Note that `pan-routes` is not a URL router (for that, see Chapter 9). It's a message router for the PAN bus.

### When to Use

**Use `pan-routes` when:**

- You need to transform or redirect messages based on content
- You're implementing cross-cutting concerns (logging, analytics, monitoring)
- You want to decouple message producers from consumers
- You're building workflow automation or state machines
- You need conditional message routing based on complex predicates

**Don't use `pan-routes` when:**

- Simple direct pub-sub suffices for your needs
- You need URL/navigation routing (use client-side router instead)
- The added complexity isn't justified by your use case

### Installation and Setup

Enable routing in the bus configuration:

```html
<pan-bus enable-routing="true"></pan-bus>
```

Once enabled, access the routing manager via the global API:

```javascript
const routes = window.pan.routes;

// Or from the bus element
const bus = document.querySelector('pan-bus');
const routes = bus.routingManager;
```

### Methods

All methods are available on the `PanRoutesManager` instance.

#### add(route)

Adds a new route to the routing system.

**Parameters:**
- `route` (Object, required): Route configuration object

**Route configuration:**
```javascript
{
  id: String,           // Optional: unique ID (generated if omitted)
  name: String,         // Required: human-readable name
  enabled: Boolean,     // Optional: whether route is active (default: true)
  order: Number,        // Optional: execution order (default: 0)
  match: {             // Required: matching criteria
    type: String|Array,     // Match message type
    topic: String|Array,    // Match message topic
    source: String|Array,   // Match message source
    tagsAny: Array,        // Match any of these tags
    tagsAll: Array,        // Match all of these tags
    where: Object          // Predicate for complex matching
  },
  transform: Object,    // Optional: transform matched message
  actions: Array,       // Required: actions to perform
  meta: {              // Optional: metadata
    createdBy: String,
    tags: Array
  }
}
```

**Returns:** `Object` - The created route with generated ID

**Example:**

```javascript
const routes = window.pan.routes;

// Simple route
routes.add({
  name: 'Login -> Dashboard',
  match: { type: 'user.login.success' },
  actions: [
    { type: 'EMIT', message: { topic: 'ui.navigate', data: { to: '/dashboard' } } }
  ]
});

// Complex route with filtering
routes.add({
  name: 'High temp alert',
  match: {
    type: 'sensor.update',
    where: {
      op: 'gt',
      path: 'payload.temperature',
      value: 30
    }
  },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'alert.high-temp' },
      inherit: ['payload', 'meta']
    },
    {
      type: 'LOG',
      level: 'warn',
      template: 'High temp: {{payload.temperature}} degreesC'
    }
  ]
});
```

#### update(id, patch)

Updates an existing route.

**Parameters:**
- `id` (String, required): Route ID
- `patch` (Object, required): Fields to update

**Returns:** `Object` - Updated route

**Example:**

```javascript
routes.update('route-123', {
  enabled: false,      // Disable route
  order: 10           // Change execution order
});
```

#### remove(id)

Removes a route.

**Parameters:**
- `id` (String, required): Route ID

**Returns:** `Boolean` - True if route existed and was removed

#### enable(id) / disable(id)

Enables or disables a route without removing it.

**Parameters:**
- `id` (String, required): Route ID

**Example:**

```javascript
routes.disable('route-123');  // Temporarily disable
// ... later ...
routes.enable('route-123');   // Re-enable
```

#### get(id)

Retrieves a route by ID.

**Parameters:**
- `id` (String, required): Route ID

**Returns:** `Object|undefined` - The route or undefined if not found

#### list(filter)

Lists all routes, optionally filtered.

**Parameters:**
- `filter` (Object, optional): Filter criteria
  - `enabled` (Boolean): Only return enabled/disabled routes

**Returns:** `Array<Object>` - Array of routes sorted by order

**Example:**

```javascript
// Get all routes
const allRoutes = routes.list();

// Get only enabled routes
const activeRoutes = routes.list({ enabled: true });
```

#### clear()

Removes all routes.

#### registerTransformFn(fnId, fn)

Registers a transform function for use in routes.

**Parameters:**
- `fnId` (String, required): Unique function identifier
- `fn` (Function, required): Transform function

**Example:**

```javascript
// Register transform
routes.registerTransformFn('toUpperCase', (value) => {
  return typeof value === 'string' ? value.toUpperCase() : value;
});

// Use in route
routes.add({
  name: 'Uppercase messages',
  match: { type: 'message.send' },
  transform: {
    op: 'map',
    path: 'payload.text',
    fnId: 'toUpperCase'
  },
  actions: [
    { type: 'FORWARD', topic: 'message.send.processed' }
  ]
});
```

#### registerHandler(handlerId, fn)

Registers a handler function for `CALL` actions.

**Parameters:**
- `handlerId` (String, required): Unique handler identifier
- `fn` (Function, required): Handler function receiving message

**Example:**

```javascript
// Register handler
routes.registerHandler('logToServer', async (message) => {
  await fetch('/api/logs', {
    method: 'POST',
    body: JSON.stringify(message)
  });
});

// Use in route
routes.add({
  name: 'Log errors to server',
  match: { type: 'error.*' },
  actions: [
    { type: 'CALL', handlerId: 'logToServer' }
  ]
});
```

#### getStats()

Returns routing statistics.

**Returns:** `Object` - Statistics object

```javascript
{
  routesEvaluated: Number,     // Total routes evaluated
  routesMatched: Number,       // Total routes matched
  actionsExecuted: Number,     // Total actions executed
  errors: Number,              // Total errors
  routeCount: Number,          // Current route count
  enabledRouteCount: Number,   // Enabled route count
  transformFnCount: Number,    // Registered transforms
  handlerCount: Number         // Registered handlers
}
```

#### resetStats()

Resets all statistics to zero.

#### setEnabled(enabled)

Enables or disables the entire routing system.

**Parameters:**
- `enabled` (Boolean, required): Whether routing should be active

#### onRoutesChanged(listener)

Subscribes to route configuration changes.

**Parameters:**
- `listener` (Function, required): Callback receiving updated route list

**Returns:** `Function` - Unsubscribe function

**Example:**

```javascript
const unsubscribe = routes.onRoutesChanged((routeList) => {
  console.log('Routes updated:', routeList.length);
});

// Later
unsubscribe();
```

#### onError(listener)

Subscribes to routing errors.

**Parameters:**
- `listener` (Function, required): Callback receiving error details

**Returns:** `Function` - Unsubscribe function

### Route Configuration

#### Match Criteria

**Match by type:**
```javascript
match: {
  type: 'user.login'              // Single type
  // OR
  type: ['user.login', 'user.register']  // Multiple types
}
```

**Match by topic:**
```javascript
match: {
  topic: 'sensor.temp'
  // OR
  topic: ['sensor.temp', 'sensor.humidity']
}
```

**Match by source:**
```javascript
match: {
  source: 'dashboard-widget'
  // OR
  source: ['widget-1', 'widget-2']
}
```

**Match by tags:**
```javascript
match: {
  tagsAny: ['urgent', 'high-priority'],  // Has any of these tags
  tagsAll: ['verified', 'logged']        // Has all of these tags
}
```

**Match with predicates:**

Predicates support: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `regex`, `and`, `or`, `not`

```javascript
// Greater than
match: {
  where: {
    op: 'gt',
    path: 'payload.value',
    value: 100
  }
}

// Regular expression
match: {
  where: {
    op: 'regex',
    path: 'payload.email',
    value: '^[\\w-]+@[\\w-]+\\.[a-z]{2,}$'
  }
}

// Combined predicates
match: {
  where: {
    op: 'and',
    children: [
      { op: 'eq', path: 'payload.status', value: 'active' },
      { op: 'gt', path: 'payload.score', value: 75 }
    ]
  }
}
```

#### Transform Operations

**Identity (no transformation):**
```javascript
transform: { op: 'identity' }
```

**Pick fields:**
```javascript
transform: {
  op: 'pick',
  paths: ['payload.userId', 'payload.email', 'meta.timestamp']
}
```

**Map with function:**
```javascript
// First register function
routes.registerTransformFn('double', (x) => x * 2);

// Then use in route
transform: {
  op: 'map',
  path: 'payload.value',
  fnId: 'double'
}
```

**Custom transformation:**
```javascript
// Register custom transform
routes.registerTransformFn('summarize', (message) => {
  return {
    ...message,
    payload: {
      summary: `${message.type}: ${message.payload.count} items`
    }
  };
});

// Use in route
transform: {
  op: 'custom',
  fnId: 'summarize'
}
```

#### Actions

**EMIT action** - Publishes a new message:
```javascript
{
  type: 'EMIT',
  message: {
    topic: 'new.topic',
    data: { /* payload */ }
  },
  inherit: ['payload', 'meta']  // Inherit fields from original message
}
```

**FORWARD action** - Forwards message to different topic:
```javascript
{
  type: 'FORWARD',
  topic: 'new.topic',          // Required
  typeOverride: 'new.type'     // Optional
}
```

**LOG action** - Logs message:
```javascript
{
  type: 'LOG',
  level: 'info',              // 'log', 'info', 'warn', 'error'
  template: 'User {{payload.userId}} logged in at {{meta.timestamp}}'
}
```

**CALL action** - Calls registered handler:
```javascript
{
  type: 'CALL',
  handlerId: 'my-handler'
}
```

### Working Examples

#### Workflow Orchestration

```javascript
const routes = window.pan.routes;

// Step 1: User registers -> validate email
routes.add({
  name: 'Registration -> Email validation',
  match: { type: 'user.register' },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'email.validate' },
      inherit: ['payload']
    }
  ]
});

// Step 2: Email validated -> send welcome message
routes.add({
  name: 'Email validated -> Welcome',
  match: { type: 'email.validated' },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'email.send', data: { template: 'welcome' } },
      inherit: ['payload']
    }
  ]
});

// Step 3: All done -> show dashboard
routes.add({
  name: 'Welcome sent -> Dashboard',
  match: { type: 'email.sent', where: { op: 'eq', path: 'payload.template', value: 'welcome' } },
  actions: [
    {
      type: 'EMIT',
      message: { topic: 'ui.navigate', data: { to: '/dashboard' } }
    }
  ]
});
```

#### Cross-cutting Logging

```javascript
// Log all error messages
routes.add({
  name: 'Error logger',
  match: { topic: 'error.*' },
  actions: [
    {
      type: 'LOG',
      level: 'error',
      template: '[{{topic}}] {{payload.message}}'
    }
  ]
});

// Log high-value transactions
routes.add({
  name: 'High-value transaction logger',
  match: {
    type: 'transaction.complete',
    where: { op: 'gt', path: 'payload.amount', value: 1000 }
  },
  actions: [
    {
      type: 'LOG',
      level: 'info',
      template: 'High-value transaction: ${{payload.amount}}'
    },
    {
      type: 'CALL',
      handlerId: 'notifyFinance'
    }
  ]
});
```

#### Message Filtering and Transformation

```javascript
// Filter and forward sensor data
routes.add({
  name: 'Filter valid sensor readings',
  match: {
    type: 'sensor.reading',
    where: {
      op: 'and',
      children: [
        { op: 'gte', path: 'payload.temperature', value: -40 },
        { op: 'lte', path: 'payload.temperature', value: 85 }
      ]
    }
  },
  transform: {
    op: 'pick',
    paths: ['payload.temperature', 'payload.humidity', 'meta.sensorId']
  },
  actions: [
    { type: 'FORWARD', topic: 'sensor.valid' }
  ]
});
```

#### Analytics and Monitoring

```javascript
// Count messages by type
const messageCounts = new Map();

routes.registerHandler('countMessages', (msg) => {
  const count = messageCounts.get(msg.type) || 0;
  messageCounts.set(msg.type, count + 1);
});

routes.add({
  name: 'Message counter',
  match: { topic: '*' },  // Match all messages
  actions: [
    { type: 'CALL', handlerId: 'countMessages' }
  ]
});

// Report stats periodically
setInterval(() => {
  console.log('Message counts:', Object.fromEntries(messageCounts));
}, 60000);
```

### Common Issues and Solutions

**Issue: Routes not firing**

Ensure routing is enabled:

```html
<pan-bus enable-routing="true"></pan-bus>
```

Check route is enabled:
```javascript
const route = routes.get('route-id');
console.log('Enabled:', route.enabled);
```

**Issue: Route matching wrong messages**

Test match criteria:

```javascript
// Debug what routes match
const bus = document.querySelector('pan-bus');
bus.setAttribute('debug', 'true');

// Or use route stats
console.log(routes.getStats());
```

**Issue: Transform function not found**

Register before adding routes:

```javascript
// Register first
routes.registerTransformFn('myTransform', (msg) => msg);

// Then use
routes.add({
  name: 'My route',
  transform: { op: 'custom', fnId: 'myTransform' },
  actions: [...]
});
```

**Issue: Routes executing in wrong order**

Set explicit order:

```javascript
routes.add({
  name: 'First route',
  order: 0,  // Executes first
  // ...
});

routes.add({
  name: 'Second route',
  order: 10,  // Executes after order 0
  // ...
});
```

---

## Summary

This chapter provided comprehensive API reference documentation for LARC's four core components:

- **pan-bus**: The foundational message bus enabling decoupled component communication with memory management, rate limiting, and routing
- **pan-theme-provider**: Centralized theme management that respects system preferences and coordinates theme changes across the application
- **pan-theme-toggle**: User-facing theme switching controls with multiple visual variants
- **pan-routes**: Runtime-configurable message routing for complex workflows and cross-cutting concerns

These components form the backbone of every LARC application. The bus provides communication infrastructure, the theme components enable appearance customization, and routes add sophisticated message routing capabilities.

As you build with LARC, you'll reference this chapter frequently for attribute names, method signatures, event payloads, and troubleshooting guidance. The examples demonstrate real-world patterns you can adapt to your specific needs.

In the next chapter, we'll explore advanced component patterns that build on these foundations, showing you how to create sophisticated, composable components that leverage the full power of the LARC architecture.
