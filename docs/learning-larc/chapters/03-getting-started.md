# Chapter 3: Getting Started

Theory is important, but there's no substitute for hands-on experience. In this chapter, you'll set up your development environment and build your first LARC application. By the end, you'll have a working project and understand the basic development workflow.

## Setting Up Your Development Environment

One of LARC's strengths is minimal setup requirements. You don't need complex tooling or configuration—just a browser, a text editor, and a way to serve files.

### Requirements

**Essential:**

- **Modern browser** — Chrome, Firefox, Safari, or Edge (latest version)
- **Text editor** — VS Code, Sublime Text, Atom, or any editor you prefer
- **Local web server** — Python's SimpleHTTPServer, Node's `http-server`, or VS Code's Live Server extension

**Optional but Recommended:**

- **VS Code** with the LARC extension for snippets and IntelliSense
- **Browser DevTools** familiarity for debugging
- **Git** for version control

### Quick Start with create-larc-app

The fastest way to start is using the LARC CLI:

```bash
# Install globally
npm install -g create-larc-app

# Create a new project
create-larc-app my-first-app

# Start development server
cd my-first-app
larc dev
```

Open `http://localhost:3000` and you'll see your new LARC application running.

### Manual Setup (No CLI)

Don't want to install Node.js? You can set up a LARC project manually:

**1. Create project structure:**

```bash
mkdir my-first-app
cd my-first-app
mkdir src
mkdir src/components
mkdir public
```

**2. Create `index.html`:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My First LARC App</title>

  <!-- Import Map for dependencies -->
  <script type="importmap">
  {
    "imports": {
      "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs"
    }
  }
  </script>

  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
  </style>
</head>
<body>
  <div id="app"></div>

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

**3. Create `src/app.js`:**

```javascript
import { pan } from '@larcjs/core';

// Import your components
import './components/hello-world.js';

// Initialize app
console.log('LARC app initialized');
pan.publish('app.ready');

// Add component to page
document.getElementById('app').innerHTML = '<hello-world></hello-world>';
```

**4. Create `src/components/hello-world.js`:**

```javascript
class HelloWorld extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div style="
        background: white;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        text-align: center;
      ">
        <h1>Hello, LARC!</h1>
        <p>Welcome to your first LARC application.</p>
      </div>
    `;
  }
}

customElements.define('hello-world', HelloWorld);
```

**5. Serve the files:**

```bash
# Python 3
python3 -m http.server 3000

# Or Python 2
python -m SimpleHTTPServer 3000

# Or with Node.js
npx http-server -p 3000

# Or use VS Code Live Server extension
# (right-click index.html → "Open with Live Server")
```

Open `http://localhost:3000` and you should see "Hello, LARC!" displayed.

**That's it.** No build step. No transpilation. No bundling. Just HTML, CSS, and JavaScript.

### Development Tools

#### VS Code Extensions

Install these extensions for the best experience:

**LARC Extension:**

- Snippets for components and PAN patterns
- IntelliSense for LARC APIs
- Commands for creating components

Install: Search "LARC" in VS Code extensions marketplace

**Live Server:**

- Auto-reload when files change
- Simple local web server
- Right-click HTML file to start

Install: Search "Live Server" by Ritwick Dey

**ES6 String HTML:**

- Syntax highlighting for template literals
- Makes component templates more readable

Install: Search "ES6 String HTML"

#### Browser DevTools

Learn these DevTools features for LARC development:

**Elements Panel:**

    - Inspect shadow DOM (enable "Show user agent shadow DOM" in settings)
    - View Custom Elements with their properties
    - Debug CSS in shadow roots

**Console:**

    - Subscribe to all PAN messages: `pan.subscribe('*', console.log)`
    - Test components directly: `document.querySelector('my-component')`
    - Check Custom Elements registry: `customElements.get('my-component')`

**Network Panel:**

    - Verify ES modules load correctly
    - Check import map resolution
    - Monitor API calls

**Sources Panel:**

    - Set breakpoints in your source code (no source maps needed!)
    - Step through component lifecycle
    - Watch variables and state

## Your First LARC Application

Let's build something more interesting than "Hello World"—a simple counter application with multiple components communicating via the PAN bus.

### Project Goal

We'll create:

    - A counter display component
    - Increment and decrement buttons
    - A reset button
    - Communication via PAN bus (no prop drilling!)

### Step 1: Update index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Counter App - LARC</title>

  <script type="importmap">
  {
    "imports": {
      "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs"
    }
  }
  </script>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    #app {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      min-width: 400px;
    }
  </style>
</head>
<body>
  <div id="app">
    <counter-display></counter-display>
    <counter-controls></counter-controls>
  </div>

  <script type="module" src="src/app.js"></script>
</body>
</html>
```

### Step 2: Create app.js

```javascript
// src/app.js
import { pan } from '@larcjs/core';

// Import components
import './components/counter-display.js';
import './components/counter-controls.js';

// Initialize application state
let count = 0;

// Listen for increment requests
pan.subscribe('counter.increment', () => {
  count++;
  pan.publish('counter.updated', { count });
});

// Listen for decrement requests
pan.subscribe('counter.decrement', () => {
  count--;
  pan.publish('counter.updated', { count });
});

// Listen for reset requests
pan.subscribe('counter.reset', () => {
  count = 0;
  pan.publish('counter.updated', { count });
});

// Publish initial state
pan.publish('counter.updated', { count });

console.log('Counter app initialized');
```

### Step 3: Create counter-display.js

```javascript
// src/components/counter-display.js
import { pan } from '@larcjs/core';

class CounterDisplay extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.count = 0;
  }

  connectedCallback() {
    // Subscribe to count updates
    this.unsubscribe = pan.subscribe('counter.updated', ({ count }) => {
      this.count = count;
      this.render();
    });

    this.render();
  }

  disconnectedCallback() {
    this.unsubscribe();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          text-align: center;
          margin-bottom: 30px;
        }

        .display {
          font-size: 72px;
          font-weight: bold;
          color: #667eea;
          margin-bottom: 10px;
          font-variant-numeric: tabular-nums;
        }

        .label {
          font-size: 18px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
      </style>

      <div class="display">${this.count}</div>
      <div class="label">Current Count</div>
    `;
  }
}

customElements.define('counter-display', CounterDisplay);
```

### Step 4: Create counter-controls.js

```javascript
// src/components/counter-controls.js
import { pan } from '@larcjs/core';

class CounterControls extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.attachEventListeners();
  }

  attachEventListeners() {
    this.shadowRoot.querySelector('#increment').addEventListener('click', () => {
      pan.publish('counter.increment');
    });

    this.shadowRoot.querySelector('#decrement').addEventListener('click', () => {
      pan.publish('counter.decrement');
    });

    this.shadowRoot.querySelector('#reset').addEventListener('click', () => {
      pan.publish('counter.reset');
    });
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .controls {
          display: flex;
          gap: 10px;
          margin-bottom: 15px;
        }

        button {
          flex: 1;
          padding: 15px;
          font-size: 16px;
          font-weight: 600;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        button:active {
          transform: translateY(0);
        }

        #increment {
          background: #48bb78;
          color: white;
        }

        #increment:hover {
          background: #38a169;
        }

        #decrement {
          background: #f56565;
          color: white;
        }

        #decrement:hover {
          background: #e53e3e;
        }

        #reset {
          background: #4a5568;
          color: white;
          width: 100%;
        }

        #reset:hover {
          background: #2d3748;
        }
      </style>

      <div class="controls">
        <button id="decrement">− Decrement</button>
        <button id="increment">+ Increment</button>
      </div>
      <button id="reset">Reset</button>
    `;
  }
}

customElements.define('counter-controls', CounterControls);
```

### Step 5: Test Your App

Start your local server and open the page. You should see:

    - A large counter display showing "0"
    - Increment and decrement buttons
    - A reset button

Click the buttons. Notice how:

    - Components update immediately
    - State is managed centrally in `app.js`
    - Components don't reference each other directly
    - Adding new components is trivial (just subscribe to `counter.updated`)

### What Just Happened?

Let's examine the architecture:

**Data Flow:**
```
User clicks button
     ↓
Controls component publishes event
     ↓
App.js receives event and updates state
     ↓
App.js publishes updated state
     ↓
Display component receives update and re-renders
```

**Key Points:**

1. **Decoupled Components:** Display and controls don't know about each other
2. **Central State:** State lives in `app.js`, not in components
3. **Pub/Sub Communication:** All communication via PAN bus topics
4. **No Props:** No prop drilling or lifting state up
5. **Easy Testing:** Each component can be tested in isolation

## Project Structure

![**Figure 3.2:** LARC Deployment Architecture](../images/01-architecture-overview-5.png)

***Figure 3.2:** LARC Deployment Architecture*


As your application grows, organization becomes important. Here's a recommended structure:

```
my-app/
├── index.html              # Entry point
├── larc.config.json        # Optional config
├── src/
│   ├── app.js              # Main application logic
│   ├── components/         # Reusable components
│   │   ├── ui/             # Generic UI components
│   │   │   ├── button.js
│   │   │   ├── card.js
│   │   │   └── modal.js
│   │   ├── features/       # Feature-specific components
│   │   │   ├── user-profile.js
│   │   │   ├── todo-list.js
│   │   │   └── dashboard.js
│   │   └── layout/         # Layout components
│   │       ├── header.js
│   │       ├── sidebar.js
│   │       └── footer.js
│   ├── lib/                # Utilities and helpers
│   │   ├── api.js          # API client
│   │   ├── auth.js         # Authentication
│   │   ├── router.js       # Routing logic
│   │   └── utils.js        # General utilities
│   ├── pages/              # Page-level components
│   │   ├── home.js
│   │   ├── dashboard.js
│   │   └── settings.js
│   └── styles/             # Global styles
│       ├── reset.css
│       ├── variables.css
│       └── utilities.css
├── public/                 # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
└── tests/                  # Test files
    ├── components/
    └── integration/
```

### File Organization Principles

**Components:**

    - One component per file
    - File name matches component name: `user-profile.js` defines `<user-profile>`
    - Keep related components together in subdirectories

**Lib:**

    - Utilities that don't render UI
    - API clients, helpers, formatters
    - Pure functions when possible

**Pages:**

    - Top-level route components
    - Compose smaller components
    - Handle page-specific logic

**Styles:**

    - Global styles in `styles/`
    - Component-specific styles in Shadow DOM
    - CSS custom properties for theming

## Import Maps Explained

![**Figure 3.1:** Module Loading with Import Maps](../images/01-architecture-overview-4.png)

***Figure 3.1:** Module Loading with Import Maps*


Import Maps are a browser standard that replaces the need for bundlers to resolve module paths.

### Basic Import Map

```html
<script type="importmap">
{
  "imports": {
    "lodash": "https://cdn.jsdelivr.net/npm/lodash-es@4/lodash.js",
    "dayjs": "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"
  }
}
</script>

<script type="module">
  // Use package names instead of URLs
  import _ from 'lodash';
  import dayjs from 'dayjs';

  console.log(dayjs().format('YYYY-MM-DD'));
</script>
```

### Path Aliases

Create shortcuts for your own modules:

```html
<script type="importmap">
{
  "imports": {
    "@/": "/src/",
    "components/": "/",
    "lib/": "/src/lib/",
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs"
  }
}
</script>

<script type="module">
  // Instead of: import { api } from '../../../lib/api.js';
  import { api } from 'lib/api.js';

  // Instead of: import Button from '../components/ui/button.js';
  import Button from 'components/ui/button.js';

  // Instead of: import something from '../../../src/utils.js';
  import something from '@/utils.js';
</script>
```

### Version Management

Pin dependencies to specific versions:

```json
{
  "imports": {
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/dist/index.js",
    "@larcjs/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@2.0.1/dist/index.js"
  }
}
```

Or use version ranges for automatic updates:

```json
{
  "imports": {
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs",
    "@larcjs/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@2/dist/index.js"
  }
}
```

### Multiple CDNs

Add fallbacks for reliability:

```json
{
  "imports": {
    "react": "https://esm.sh/react@18",
    "react-fallback": "https://cdn.skypack.dev/react@18"
  }
}
```

Then in code:

```javascript
let React;
try {
  React = await import('react');
} catch {
  React = await import('react-fallback');
}
```

### Development vs Production

Use different import maps for different environments:

**development.importmap.json:**
```json
{
  "imports": {
    "@larcjs/core": "/node_modules/@larcjs/core/dist/index.js",
    "app/": "/src/"
  }
}
```

**production.importmap.json:**
```json
{
  "imports": {
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/dist/index.js",
    "app/": "/assets/js/"
  }
}
```

Load the appropriate map:

```html
<script type="importmap" src="/config/production.importmap.json"></script>
```

## Development Workflow

### Daily Development

A typical development session:

**1. Start dev server:**
```bash
larc dev
```

This starts a local server with hot reload.

**2. Edit files:**
Open your editor and make changes. The browser automatically reloads when you save.

**3. Check the console:**
Open browser DevTools and check for errors or warnings.

**4. Test in browser:**
Interact with your app, verify behavior, check responsive design.

**5. Debug as needed:**
Set breakpoints, inspect elements, monitor network requests.

**6. Repeat:**
The edit-refresh cycle is instant with no build step.

### Debugging Tips

**Log all PAN messages:**
```javascript
pan.subscribe('*', (topic, data) => {
  console.log(`[PAN] ${topic}:`, data);
});
```

**Inspect custom elements:**
```javascript
// Get element
const el = document.querySelector('my-component');

// Check if defined
console.log(customElements.get('my-component'));

// Access shadow root
console.log(el.shadowRoot);

// Call methods directly
el.someMethod();
```

**Monitor attribute changes:**
```javascript
// Create observer
const observer = new MutationObserver((mutations) => {
  mutations.forEach(mutation => {
    console.log('Attribute changed:', mutation.attributeName);
  });
});

// Watch element
observer.observe(element, { attributes: true });
```

### Testing

Run tests without a build step:

```html
<!-- tests/counter.test.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Counter Tests</title>
  <script type="importmap">
  {
    "imports": {
      "@larcjs/core": "../node_modules/@larcjs/core/dist/index.js"
    }
  }
  </script>
</head>
<body>
  <div id="test-container"></div>

  <script type="module">
    import { pan } from '@larcjs/core';
    import '../counter-display.js';

    // Simple test framework
    function test(name, fn) {
      try {
        fn();
        console.log(`✓ ${name}`);
      } catch (error) {
        console.error(`✗ ${name}:`, error);
      }
    }

    function assert(condition, message) {
      if (!condition) throw new Error(message || 'Assertion failed');
    }

    // Tests
    test('counter-display renders initial count', () => {
      const el = document.createElement('counter-display');
      document.getElementById('test-container').appendChild(el);

      const display = el.shadowRoot.querySelector('.display');
      assert(display.textContent === '0', 'Initial count should be 0');

      el.remove();
    });

    test('counter-display updates on PAN message', async () => {
      const el = document.createElement('counter-display');
      document.getElementById('test-container').appendChild(el);

      // Wait for component to connect
      await new Promise(resolve => setTimeout(resolve, 10));

      // Publish update
      pan.publish('counter.updated', { count: 42 });

      // Wait for render
      await new Promise(resolve => setTimeout(resolve, 10));

      const display = el.shadowRoot.querySelector('.display');
      assert(display.textContent === '42', 'Count should update to 42');

      el.remove();
    });

    console.log('All tests complete');
  </script>
</body>
</html>
```

Open `tests/counter.test.html` in your browser to run tests.

## Common Patterns

### Pattern 1: Loading States

```javascript
class DataComponent extends HTMLElement {
  async connectedCallback() {
    this.render({ loading: true });

    try {
      const data = await this.fetchData();
      this.render({ data });
    } catch (error) {
      this.render({ error: error.message });
    }
  }

  render(state) {
    if (state.loading) {
      this.innerHTML = '<loading-spinner></loading-spinner>';
    } else if (state.error) {
      this.innerHTML = `<error-message>${state.error}</error-message>`;
    } else {
      this.innerHTML = `<data-display .data="${state.data}"></data-display>`;
    }
  }
}
```

### Pattern 2: Form Handling

```javascript
class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <form>
        <input type="email" name="email" required>
        <input type="password" name="password" required>
        <button type="submit">Login</button>
      </form>
    `;

    this.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);

      pan.publish('auth.login', data);
    });
  }
}
```

### Pattern 3: Conditional Rendering

```javascript
class UserMenu extends HTMLElement {
  constructor() {
    super();
    this.user = null;
  }

  connectedCallback() {
    pan.subscribe('auth.user.changed', ({ user }) => {
      this.user = user;
      this.render();
    });

    this.render();
  }

  render() {
    if (this.user) {
      this.innerHTML = `
        <div class="logged-in">
          <span>Hello, ${this.user.name}</span>
          <button id="logout">Logout</button>
        </div>
      `;

      this.querySelector('#logout').addEventListener('click', () => {
        pan.publish('auth.logout');
      });
    } else {
      this.innerHTML = `
        <button id="login">Login</button>
      `;

      this.querySelector('#login').addEventListener('click', () => {
        pan.publish('app.navigate', { path: '/login' });
      });
    }
  }
}
```

### Pattern 4: Lists and Iteration

```javascript
class TodoList extends HTMLElement {
  constructor() {
    super();
    this.todos = [];
  }

  connectedCallback() {
    pan.subscribe('todos.updated', ({ todos }) => {
      this.todos = todos;
      this.render();
    });

    this.render();
  }

  render() {
    this.innerHTML = `
      <ul>
        ${this.todos.map(todo => `
          <li>
            <input type="checkbox"
                   ${todo.completed ? 'checked' : ''}
                   data-id="${todo.id}">
            <span class="${todo.completed ? 'completed' : ''}">
              ${todo.text}
            </span>
          </li>
        `).join('')}
      </ul>
    `;

    // Attach event listeners after rendering
    this.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        pan.publish('todos.toggle', { id });
      });
    });
  }
}
```

## Summary

In this chapter, you:

    - Set up a LARC development environment (CLI or manual)
    - Built your first multi-component application
    - Learned project structure best practices
    - Mastered Import Maps for dependency management
    - Established an efficient development workflow
    - Explored common component patterns

You now have a solid foundation for building LARC applications. The next chapter dives deeper into creating sophisticated Web Components with proper lifecycle management, styling, and interactivity.

---

## Exercises

**1. Enhance the Counter App:**

    - Add a history component that shows past values
    - Add increment/decrement by custom amounts
    - Persist count to localStorage

**2. Build a Todo List:**

    - Add/remove todos
    - Mark as complete/incomplete
    - Filter by status (all/active/completed)
    - Use PAN bus for state management

**3. Create a Theme Switcher:**

    - Light/dark theme toggle
    - Publish theme changes via PAN
    - Multiple components respond to theme changes
    - Persist theme preference

**4. Experiment with Import Maps:**

    - Try different CDNs (jsDelivr, unpkg, esm.sh)
    - Add path aliases for your components
    - Import an external library (lodash, dayjs, etc.)

Take your time with these exercises. Understanding these patterns now will make the rest of the book much easier.
