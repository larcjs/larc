# Core Concepts

Now that you understand LARC's philosophy, let's explore the technical foundation that makes it work. This chapter introduces the core concepts you'll use throughout the book: Web Components, the PAN bus, event-driven architecture, and the component lifecycle.

Don't worry if some of these concepts are new to you. We'll build understanding progressively, starting with the basics and working toward more sophisticated patterns.

## Web Components Refresher

![**Figure 2.1:** LARC High-Level Architecture](../images/01-architecture-overview-1.png)

***Figure 2.1:** LARC High-Level Architecture*


Web Components are a suite of browser APIs that let you create custom, reusable HTML elements. Unlike framework components, Web Components are browser standards supported natively across all modern browsers.

### The Three Pillars

Web Components rest on three main technologies:

#### 1. Custom Elements

![**Figure 2.2:** Web Component Anatomy](../images/02-component-structure-2.png)

***Figure 2.2:** Web Component Anatomy*


Custom Elements let you define new HTML tags with custom behavior:

```javascript
// Define a custom element
class HelloWorld extends HTMLElement {
  connectedCallback() {
    this.textContent = 'Hello, World!';
  }
}

// Register it
customElements.define('hello-world', HelloWorld);
```

Now you can use `<hello-world></hello-world>` in your HTML, and it works like any built-in element.

**Key Points:**

- Element names must contain a hyphen (e.g., `my-component`, not `mycomponent`)
- Custom elements inherit from `HTMLElement` or another HTML element
- They have lifecycle callbacks for creation, connection, and removal

#### 2. Shadow DOM

![**Figure 2.3:** Shadow DOM Tree Structure](../images/02-component-structure-4.png)

***Figure 2.3:** Shadow DOM Tree Structure*


Shadow DOM provides style and markup encapsulation:

```javascript
class FancyButton extends HTMLElement {
  constructor() {
    super();
    // Create shadow root
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
      <style>
        button {
          background: blue;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
        }
      </style>
      <button>
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('fancy-button', FancyButton);
```

The styles inside Shadow DOM don't leak out, and external styles don't leak in:

```html
<!-- This button is blue (from shadow DOM) -->
<fancy-button>Click Me</fancy-button>

<!-- This button is not affected by fancy-button's styles -->
<button>Regular Button</button>

<style>
  /* This won't affect fancy-button's internal button */
  button { background: red; }
</style>
```

**Key Points:**

- Shadow DOM creates an isolated scope for styles and DOM
- Use `<slot>` elements to project content from light DOM into shadow DOM
- `mode: 'open'` makes shadow root accessible via `element.shadowRoot`

#### 3. HTML Templates

Templates define reusable chunks of markup that aren't rendered until activated:

```html
<template id="card-template">
  <style>
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 16px;
    }
  </style>
  <div class="card">
    <h2 class="title"></h2>
    <p class="content"></p>
  </div>
</template>

<script>
  class SimpleCard extends HTMLElement {
    connectedCallback() {
      const template = document.getElementById('card-template');
      const clone = template.content.cloneNode(true);

      clone.querySelector('.title').textContent = this.getAttribute('title');
      clone.querySelector('.content').textContent = this.getAttribute('content');

      this.attachShadow({ mode: 'open' });
      this.shadowRoot.appendChild(clone);
    }
  }

  customElements.define('simple-card', SimpleCard);
</script>
```

**Key Points:**

- Template content is inert (scripts don't run, images don't load)
- Templates can be defined in HTML or created programmatically
- Clone template content before using it

### Web Components vs Framework Components

It's worth understanding how Web Components differ from framework components:

| Aspect | Web Components | React Components |
|--------|---------------|------------------|
| **Definition** | Browser standard | Library-specific |
| **Syntax** | JavaScript classes | JSX or functions |
| **Lifecycle** | Native callbacks | Virtual DOM lifecycle |
| **Reusability** | Works everywhere | Requires React |
| **Build step** | Optional | Required (for JSX) |
| **Encapsulation** | Shadow DOM | CSS Modules/CSS-in-JS |

Both approaches have their place. Web Components excel at true reusability and standards-based development. Framework components often provide better ergonomics within their specific ecosystem.

LARC chooses Web Components because they align with the "standards first" principle.

## The Page Area Network (PAN)

![**Figure 2.4:** Component Communication Flow](../images/01-architecture-overview-2.png)

***Figure 2.4:** Component Communication Flow*


The Page Area Network, or PAN bus, is LARC's event-driven communication system. It's inspired by microservices architecture but designed for browser components.

### The Problem It Solves

In a traditional component tree, communication flows up and down:

```
App
├── Header
│   └── UserMenu
│       └── LogoutButton
└── Content
    └── UserProfile
```

If `LogoutButton` needs to notify `UserProfile` that the user logged out, you have several options:

1. **Pass callbacks down** through props (prop drilling)
2. **Lift state up** to a common ancestor
3. **Use context** or global state
4. **Dispatch custom events** that bubble up

Each approach has tradeoffs. Prop drilling creates tight coupling. Global state makes testing harder. Event bubbling is limited by DOM structure.

### The PAN Bus Approach

The PAN bus provides a **decoupled pub/sub system**:

```javascript
// LogoutButton publishes an event
pan.publish('user.logout', { userId: 123 });

// UserProfile subscribes to events (anywhere in the app)
pan.subscribe('user.logout', (data) => {
  console.log('User logged out:', data.userId);
  this.clearUserData();
});
```

Components don't need to know about each other. They communicate through topics (like `'user.logout'`) with no direct coupling.

### Topic Namespaces

Topics use dot notation for organization:

```javascript
'user.login'          // User logged in
'user.logout'         // User logged out
'user.profile.update' // Profile was updated

'cart.item.add'       // Item added to cart
'cart.item.remove'    // Item removed
'cart.checkout'       // Checkout initiated

'app.theme.change'    // Theme changed
'app.error'           // Application error
```

You can subscribe to specific topics or use wildcards:

```javascript
// Specific topic
pan.subscribe('user.login', handler);

// Wildcard (all user events)
pan.subscribe('user.*', handler);

// All events (useful for debugging)
pan.subscribe('*', handler);
```

### Message Patterns

The PAN bus supports several messaging patterns:

#### 1. Fire and Forget

Most common pattern. Publish a message and continue:

```javascript
pan.publish('notification.show', {
  type: 'success',
  message: 'Saved successfully'
});
```

#### 2. Request/Response

Publish a message and wait for a response:

```javascript
const result = await pan.request('api.fetch', {
  url: '/api/users',
  method: 'GET'
});
```

A subscriber handles the request and returns data:

```javascript
pan.respond('api.fetch', async (data) => {
  const response = await fetch(data.url, { method: data.method });
  return response.json();
});
```

#### 3. State Broadcast

Publish state changes that multiple components need:

```javascript
// Theme switcher publishes
pan.publish('app.theme.change', { theme: 'dark' });

// Multiple components subscribe
class Header extends HTMLElement {
  connectedCallback() {
    pan.subscribe('app.theme.change', ({ theme }) => {
      this.applyTheme(theme);
    });
  }
}

class Sidebar extends HTMLElement {
  connectedCallback() {
    pan.subscribe('app.theme.change', ({ theme }) => {
      this.applyTheme(theme);
    });
  }
}
```

### Why PAN Bus?

The PAN bus provides several advantages:

**Loose Coupling**
Components don't need references to each other. Add or remove components without changing others.

**Testability**
Test components in isolation. Mock the bus or test actual pub/sub behavior.

**Debuggability**
Subscribe to `'*'` to log all messages. Visualize message flow easily.

**Scalability**
Add new features by subscribing to existing topics. No need to modify existing code.

**Flexibility**
Mix different communication patterns (events, requests, broadcasts) as needed.

## Event-Driven Architecture

LARC applications use event-driven architecture (EDA) at multiple levels:

### Browser Events

Standard DOM events for user interaction:

```javascript
class ClickCounter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    this.innerHTML = `
      <button id="btn">Clicked ${this.count} times</button>
    `;

    this.querySelector('#btn').addEventListener('click', () => {
      this.count++;
      this.querySelector('#btn').textContent = `Clicked ${this.count} times`;
    });
  }
}
```

### Custom Events

Components can dispatch custom events for parent components:

```javascript
class ColorPicker extends HTMLElement {
  selectColor(color) {
    // Dispatch custom event
    this.dispatchEvent(new CustomEvent('colorchange', {
      detail: { color },
      bubbles: true,
      composed: true  // Cross shadow DOM boundary
    }));
  }
}

// Parent can listen
document.querySelector('color-picker').addEventListener('colorchange', (e) => {
  console.log('Selected color:', e.detail.color);
});
```

### PAN Bus Events

For cross-component communication:

```javascript
class SearchBox extends HTMLElement {
  handleInput(value) {
    pan.publish('search.query', { query: value });
  }
}

class SearchResults extends HTMLElement {
  connectedCallback() {
    pan.subscribe('search.query', ({ query }) => {
      this.search(query);
    });
  }
}
```

### When to Use Each

**Use DOM Events when:**

- Handling user interactions (click, input, focus, etc.)
- Communication is parent-child relationship
- Following HTML semantics matters

**Use Custom Events when:**

- Component needs to notify parent/ancestors
- Event should bubble up the DOM tree
- Mimicking native element behavior

**Use PAN Bus when:**

- Components are not in parent-child relationship
- Multiple unrelated components need the same data
- Decoupling is more important than DOM semantics
- Building cross-cutting concerns (logging, analytics, etc.)

## State Management Philosophy

LARC takes a pragmatic approach to state management: use the simplest solution that works, then scale up if needed.

### State Hierarchy

State can exist at different levels:

#### 1. Component-Local State

State that only matters to one component:

```javascript
class TodoItem extends HTMLElement {
  constructor() {
    super();
    this.completed = false;  // Local state
  }

  toggle() {
    this.completed = !this.completed;
    this.render();
  }

  render() {
    this.classList.toggle('completed', this.completed);
  }
}
```

**When to use:** UI state, temporary values, component-specific configuration.

#### 2. Shared State

State that multiple components need:

```javascript
// Simple shared state object
const appState = {
  user: null,
  theme: 'light',
  notifications: []
};

// Components read from it
class UserMenu extends HTMLElement {
  connectedCallback() {
    this.render(appState.user);
  }
}

// Components write to it and notify via PAN
function updateTheme(theme) {
  appState.theme = theme;
  pan.publish('app.theme.change', { theme });
}
```

**When to use:** Application-wide settings, user data, feature flags.

#### 3. Persistent State

State that survives page reloads:

```javascript
class TodoList extends HTMLElement {
  loadTodos() {
    const saved = localStorage.getItem('todos');
    return saved ? JSON.parse(saved) : [];
  }

  saveTodos(todos) {
    localStorage.setItem('todos', JSON.stringify(todos));
  }
}
```

**When to use:** User preferences, draft content, offline data.

#### 4. Server State

State that comes from and syncs with a server:

```javascript
class UserProfile extends HTMLElement {
  async loadProfile() {
    const response = await fetch('/api/profile');
    this.profile = await response.json();
    this.render();
  }

  async saveProfile(updates) {
    await fetch('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }
}
```

**When to use:** Database records, API data, real-time updates.

### Reactive State (Optional)

For more complex state needs, LARC provides reactive patterns using JavaScript Proxies:

```javascript
function createStore(initialState) {
  const listeners = new Set();

  const state = new Proxy(initialState, {
    set(target, property, value) {
      target[property] = value;
      listeners.forEach(fn => fn(property, value));
      return true;
    }
  });

  return {
    state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    }
  };
}

// Usage
const store = createStore({ count: 0 });

class Counter extends HTMLElement {
  connectedCallback() {
    // Subscribe to changes
    this.unsubscribe = store.subscribe((prop, value) => {
      if (prop === 'count') this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render() {
    this.textContent = `Count: ${store.state.count}`;
  }
}

// Update state (automatically notifies subscribers)
store.state.count++;
```

This is similar to MobX or Vue's reactivity, but built with standard JavaScript.

## Module System

LARC uses ES Modules, the native JavaScript module system.

### Import/Export Basics

Export from a module:

```javascript
// components/button.js
export class PanButton extends HTMLElement {
  // ...
}

export const BUTTON_TYPES = ['primary', 'secondary', 'danger'];

export default PanButton;
```

Import into another module:

```javascript
// app.js
import PanButton, { BUTTON_TYPES } from './components/button.js';

// Or import everything
import * as Button from './components/button.js';
```

### Import Maps

Import Maps let you define aliases for module paths:

```html
<script type="importmap">
{
  "imports": {
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/pan.mjs",
    "@larcjs/ui": "https://cdn.jsdelivr.net/npm/@larcjs/components@2.0.0/pan-card.mjs",
    "app/": "/src/",
    "components/": "/"
  }
}
</script>

<script type="module">
  // Use aliases
  import { pan } from '@larcjs/core';
  import { PanButton } from '@larcjs/ui';
  import { Header } from 'components/header.js';
</script>
```

This is similar to webpack's resolve aliases, but it's a browser standard.

### Module Organization

A typical LARC project structure:

```
src/
├── components/
│   ├── header.js
│   ├── footer.js
│   └── sidebar.js
├── lib/
│   ├── api.js
│   ├── auth.js
│   └── utils.js
├── pages/
│   ├── home.js
│   ├── dashboard.js
│   └── profile.js
└── app.js
```

Each file is a module with clear responsibilities:

```javascript
// src/lib/api.js
export async function fetchJSON(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

// src/components/user-list.js
import { fetchJSON } from '../lib/api.js';

export class UserList extends HTMLElement {
  async connectedCallback() {
    const users = await fetchJSON('/api/users');
    this.render(users);
  }
}

customElements.define('user-list', UserList);
```

## The Component Lifecycle

Understanding the component lifecycle is essential for building robust LARC applications.

### Lifecycle Callbacks

Web Components provide several lifecycle callbacks:

#### constructor()

Called when an instance is created:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    // MUST call super() first
    super();

    // Initialize instance properties
    this.count = 0;
    this.data = null;

    // Attach shadow DOM if needed
    this.attachShadow({ mode: 'open' });

    // DON'T access attributes or children here
    // They might not be set yet
  }
}
```

**Best practices:**

- Always call `super()` first
- Initialize instance properties
- Attach shadow DOM
- Don't access attributes, children, or parent elements
- Don't render here (use `connectedCallback` instead)

#### connectedCallback()

Called when the element is inserted into the DOM:

```javascript
connectedCallback() {
  // Now it's safe to access attributes, children, parent
  const title = this.getAttribute('title');

  // Render initial content
  this.render();

  // Add event listeners
  this.addEventListener('click', this.handleClick);

  // Fetch data
  this.loadData();

  // Subscribe to PAN events
  this.unsubscribe = pan.subscribe('data.update', this.handleUpdate);
}
```

**Best practices:**

- Render initial content
- Add event listeners
- Subscribe to events
- Fetch initial data
- Can be called multiple times if element is moved

#### disconnectedCallback()

Called when the element is removed from the DOM:

```javascript
disconnectedCallback() {
  // Clean up event listeners
  this.removeEventListener('click', this.handleClick);

  // Unsubscribe from PAN events
  if (this.unsubscribe) {
    this.unsubscribe();
  }

  // Cancel pending operations
  if (this.fetchController) {
    this.fetchController.abort();
  }

  // Clear timers
  if (this.timer) {
    clearInterval(this.timer);
  }
}
```

**Best practices:**

- Remove event listeners to prevent memory leaks
- Unsubscribe from PAN events
- Cancel pending async operations
- Clear timers and intervals

#### attributeChangedCallback(name, oldValue, newValue)

Called when observed attributes change:

```javascript
static get observedAttributes() {
  return ['title', 'count', 'active'];
}

attributeChangedCallback(name, oldValue, newValue) {
  // Called for each observed attribute that changes
  if (name === 'title') {
    this.updateTitle(newValue);
  } else if (name === 'count') {
    this.updateCount(Number(newValue));
  } else if (name === 'active') {
    this.updateActive(newValue !== null);
  }
}
```

**Best practices:**

- Only observe attributes you actually use
- Convert string values to appropriate types
- Handle null/undefined values
- Update only what changed (don't re-render everything)

#### adoptedCallback()

Called when the element is moved to a new document (rare):

```javascript
adoptedCallback() {
  // Usually not needed
  // Called when element is moved between documents
  // (e.g., iframe scenarios)
}
```

### Complete Lifecycle Example

Here's a full component showing proper lifecycle management:

```javascript
class DataTable extends HTMLElement {
  // Define which attributes to observe
  static get observedAttributes() {
    return ['url', 'page-size'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Initialize state
    this.data = [];
    this.pageSize = 10;
    this.currentPage = 1;
  }

  async connectedCallback() {
    // Initial render
    this.render();

    // Load data if URL is set
    const url = this.getAttribute('url');
    if (url) {
      await this.loadData(url);
    }

    // Subscribe to events
    this.unsubscribePan = pan.subscribe('table.refresh', () => {
      this.refresh();
    });

    // Set up event listeners
    this.addEventListener('page-change', this.handlePageChange);
  }

  disconnectedCallback() {
    // Clean up subscriptions
    if (this.unsubscribePan) {
      this.unsubscribePan();
    }

    // Remove event listeners
    this.removeEventListener('page-change', this.handlePageChange);

    // Cancel pending fetch
    if (this.fetchController) {
      this.fetchController.abort();
    }
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'url' && newValue) {
      this.loadData(newValue);
    } else if (name === 'page-size') {
      this.pageSize = Number(newValue) || 10;
      this.render();
    }
  }

  async loadData(url) {
    // Cancel previous fetch if any
    if (this.fetchController) {
      this.fetchController.abort();
    }

    this.fetchController = new AbortController();

    try {
      const response = await fetch(url, {
        signal: this.fetchController.signal
      });
      this.data = await response.json();
      this.render();
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to load data:', error);
      }
    }
  }

  render() {
    // Render logic here
    this.shadowRoot.innerHTML = `
      <style>
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
      </style>
      <table>
        <thead>
          <tr><th>ID</th><th>Name</th><th>Status</th></tr>
        </thead>
        <tbody>
          ${this.data.map(row => `
            <tr>
              <td>${row.id}</td>
              <td>${row.name}</td>
              <td>${row.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  handlePageChange = (event) => {
    this.currentPage = event.detail.page;
    this.render();
  }

  async refresh() {
    const url = this.getAttribute('url');
    if (url) {
      await this.loadData(url);
    }
  }
}

customElements.define('data-table', DataTable);
```

## Summary

This chapter introduced LARC's core concepts:

- **Web Components** provide standard, reusable elements with Custom Elements, Shadow DOM, and Templates
- **The PAN Bus** enables decoupled pub/sub communication between components
- **Event-Driven Architecture** uses DOM events, custom events, and PAN messages for different scenarios
- **State Management** starts simple (local state) and scales to shared, persistent, and server state
- **ES Modules** organize code with standard imports/exports and import maps
- **Component Lifecycle** provides callbacks for creation, connection, attribute changes, and cleanup

In the next chapter, we'll put these concepts into practice by setting up a development environment and building your first LARC application.

---

## Key Takeaways

- Web Components are browser standards, not framework abstractions
- Shadow DOM provides true style encapsulation
- The PAN bus decouples components through pub/sub messaging
- Use the simplest state management that works, then scale up
- ES Modules and Import Maps replace build-time bundling
- Proper lifecycle management prevents bugs and memory leaks
- Components should be self-contained but composable

---

## Further Reading

**For detailed technical reference:**
- *Building with LARC* Chapter 2: Core Concepts - Architecture patterns and message flow reference
- *Building with LARC* Appendix A: Message Topics Reference - Standard topic conventions
- *Building with LARC* Appendix B: Event Envelope Specification - Message format details
- *Building with LARC* Appendix F: Glossary - Technical terminology reference
