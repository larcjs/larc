# Chapter 5: Getting Started

Welcome to the hands-on portion of *Building with LARC*. This chapter takes you from zero to running code in minutes—no elaborate setup, no dependency nightmares, just a browser, a text editor, and a way to serve static files.

If you've worked with modern JavaScript frameworks, you might be bracing yourself for the usual ritual: install Node.js, run npm install, wait for 1,400 packages to download, configure webpack, debug build errors, and finally write your first line of application code. LARC skips all of that. You'll have a working application before you finish reading this chapter.

This isn't a toy example or a contrived demo. We'll build something real: a task manager with multiple components, PAN bus messaging, persistent storage, and proper error handling. By the end, you'll understand LARC's development workflow and be ready to build your own applications.

## Prerequisites

Before you begin, make sure you have:

**Required:**
- A modern web browser (Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+)
- A text editor (VS Code, Sublime Text, Vim—your choice)
- A way to serve static files (Python, PHP, Node, or any HTTP server)

**Helpful but Optional:**
- Git (for cloning examples)
- Browser DevTools familiarity (Console, Network, Elements tabs)
- Basic command-line comfort

That's it. No Node.js, no npm, no build tools. If you have a browser and can start a local server, you're ready.

## Installation Options

LARC offers multiple installation paths. Choose the one that matches your workflow and project requirements.

### Option 1: CDN (Fastest for Testing)

The quickest way to try LARC is loading it directly from a CDN. This is perfect for experiments, prototypes, and learning.

Create a file called `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC Quick Start</title>
</head>
<body>
  <!-- Load LARC from CDN -->
  <script type="module" src="https://unpkg.com/@larcjs/core@1.1.1/src/pan.mjs"></script>

  <!-- PAN bus is automatically instantiated -->

  <!-- Use components declaratively -->
  <pan-card title="Hello LARC">
    <p>This component loaded automatically from the CDN.</p>
    <pan-button>Click Me</pan-button>
  </pan-card>
</body>
</html>
```

Serve the file with any HTTP server:

```bash
# Python 3
$ python3 -m http.server 8000

# Python 2
$ python -m SimpleHTTPServer 8000

# PHP
$ php -S localhost:8000

# Node.js (if you have http-server installed)
$ npx http-server -p 8000
```

Open `http://localhost:8000` in your browser. You should see a styled card with a button. The component loaded automatically—no imports, no registration, no configuration.

**What just happened?**

1. The `pan.mjs` script loaded and initialized the PAN autoloader
2. The autoloader scanned your page for custom elements (tags with hyphens)
3. It discovered `<pan-card>` and `<pan-button>`
4. Using IntersectionObserver, it loaded these components as they entered the viewport
5. The components registered themselves and rendered their content

This is LARC's "convention over configuration" approach in action.

**When to use CDN:**
- Learning LARC
- Quick experiments and prototypes
- Simple single-page applications
- Personal projects

**When to avoid CDN:**
- Production applications requiring optimization
- Offline-first applications
- Projects with strict CSP policies
- Applications needing specific version control

### Option 2: NPM Installation

For projects with existing Node.js tooling or teams familiar with npm, install LARC as a package:

```bash
$ npm install @larcjs/core @larcjs/components
```

Then import in your JavaScript:

```javascript
// main.js
import '/node_modules/@larcjs/core/src/pan.mjs';

// Components auto-load from node_modules
// Configure the path resolver if needed
```

Or use an import map in your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "@larcjs/core/": "./node_modules/@larcjs/core/src/",
      "@larcjs/components/": "./node_modules/@larcjs/components/src/"
    }
  }
  </script>
  <script type="module" src="./main.js"></script>
</head>
<body>
  <pan-card title="From NPM">
    Components load from node_modules
  </pan-card>
</body>
</html>
```

**When to use NPM:**
- Existing Node.js projects
- Teams familiar with package.json workflows
- Projects using bundlers (Vite, Webpack, Rollup)
- TypeScript projects (add `@larcjs/core-types`)

### Option 3: Git Clone (Full Repository)

For working with examples, contributing to LARC, or learning from source code:

```bash
# Clone with submodules
$ git clone --recurse-submodules https://github.com/larcjs/larc.git
$ cd larc

# Run setup script (handles submodule initialization)
$ ./setup.sh         # Mac/Linux
# or
$ setup.bat          # Windows

# Start a server
$ python3 -m http.server 8000

# Open http://localhost:8000/test-config.html
```

This gives you:

- Complete source code
- All examples
- Playground for testing components
- Documentation site
- DevTools extension

**When to use Git clone:**
- Learning from examples
- Contributing to LARC
- Exploring advanced features
- Building custom components

### Option 4: Create LARC App (Coming Soon)

The LARC CLI provides scaffolding tools (currently in development):

```bash
# Create a new project
$ npx create-larc-app my-app
$ cd my-app
$ npm run dev

# Add components from registry
$ larc add pan-data-table

# Generate custom components
$ larc generate component my-widget
```

This creates a zero-config development environment with hot reload, component generation, and registry integration.

## Development Environment Setup

Once you've chosen an installation method, set up your development environment for maximum productivity.

### Directory Structure

LARC doesn't enforce a specific structure, but here's a recommended layout:

```
my-larc-app/
├── index.html              # Entry point
├── larc-config.mjs         # Path configuration (optional)
├── src/
│   ├── components/         # Your custom components
│   │   ├── task-list.mjs
│   │   ├── task-item.mjs
│   │   └── task-form.mjs
│   ├── utils/              # Helper functions
│   │   ├── api.mjs
│   │   └── storage.mjs
│   └── styles/             # Global styles
│       └── main.css
├── core/                   # LARC core (if cloned)
│   └── src/
│       └── pan.mjs
└── ui/                     # LARC components (if cloned)
    └── src/
        └── components/
```

**Rationale:**
- `src/components/` - Your application components live here
- `src/utils/` - Pure functions, API clients, shared logic
- `src/styles/` - Global CSS, CSS custom properties, themes
- `core/` and `ui/` - LARC source (only if using Git clone method)

This structure scales from small experiments to large applications while keeping concerns separated.

### Editor Configuration

#### VS Code (Recommended)

Install the LARC extension (when available) for:

- Component auto-completion
- PAN topic IntelliSense
- Snippet library
- Integrated component browser

**Manual setup without extension:**

Create `.vscode/settings.json`:

```json
{
  "files.associations": {
    "*.mjs": "javascript"
  },
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "emmet.triggerExpansionOnTab": true
}
```

This enables Emmet HTML completion inside JavaScript template literals.

**Recommended extensions:**
- **Live Server** - Auto-reload on file changes
- **ES6 String HTML** - Syntax highlighting in template literals
- **ESLint** - JavaScript linting (configure for ES modules)
- **Path Intellisense** - Autocomplete for imports

#### Other Editors

**Sublime Text:**
- Install "HTML-CSS-JS Prettify"
- Use "JavaScript Next" syntax highlighting

**Vim:**
```vim
" In .vimrc
autocmd BufNewFile,BufRead *.mjs set filetype=javascript
```

**WebStorm/IntelliJ:**
- Built-in support for ES modules
- Configure web server for localhost testing

### Local Development Server

LARC requires a local server (file:// URLs don't work due to CORS and ES module restrictions). Choose any option:

#### Python (Built-in)

```bash
# Python 3 (most common)
$ python3 -m http.server 8000
# Serving HTTP on :: port 8000 (http://[::]:8000/) ...

# Python 2 (if needed)
$ python -m SimpleHTTPServer 8000
```

**Pros:** No installation, universally available, simple
**Cons:** No hot reload, basic features

#### Node.js Options

**http-server (simple):**
```bash
$ npx http-server -p 8000 -c-1
# -c-1 disables caching (important during development)
```

**live-server (with auto-reload):**
```bash
$ npx live-server --port=8000 --no-browser
```

**Vite (full-featured):**
```bash
$ npx vite --port 8000
```

Vite provides:

- Instant hot module replacement
- Built-in TypeScript support
- Optimized production builds
- Plugin ecosystem

#### PHP (Built-in)

```bash
$ php -S localhost:8000
```

#### VS Code Extension

Install "Live Server" extension, then right-click `index.html` → "Open with Live Server". Changes reload automatically.

**Recommended for beginners:** Python (simplest) or Live Server extension (best DX)

**Recommended for teams:** Vite (most features, best performance)

## Browser DevTools Setup

LARC applications are debuggable with standard browser DevTools. Here's how to configure them effectively.

### Chrome DevTools

**Essential Panels:**

1. **Console** - View PAN messages, errors, and logs
2. **Network** - Monitor component loading
3. **Elements** - Inspect Shadow DOM and component attributes
4. **Application** - Check localStorage, IndexedDB, and OPFS

**Enable useful settings:**

1. Open DevTools (F12 / Cmd+Option+I)
2. Settings (F1 / ⚙️ icon) → Experiments
3. Enable:

   - "Show user agent shadow DOM" (to inspect component internals)
   - "CSS Authoring" (for live CSS editing)

**Debugging PAN messages:**

```javascript
// Add to index.html during development
if (window.location.hostname === 'localhost') {
  // Subscribe to all messages
  window.addEventListener('pan-ready', () => {
    window.panClient.subscribe('*', ({ topic, data, meta }) => {
      console.log(`[PAN] ${topic}`, data, meta);
    });
  });
}
```

This logs every message flowing through the PAN bus.

### Firefox Developer Tools

Firefox has excellent Web Components support:

1. Open DevTools (F12 / Cmd+Option+I)
2. Enable "Show Browser Styles" in Inspector settings
3. Use Console to inspect components:

```javascript
// Get component instance
const card = document.querySelector('pan-card');
console.log(card);

// Inspect Shadow DOM
console.log(card.shadowRoot);

// Trigger methods
card.setAttribute('theme', 'dark');
```

### Safari Web Inspector

Safari's Web Inspector works well for debugging:

1. Enable Develop menu: Preferences → Advanced → Show Develop Menu
2. Develop → Show Web Inspector (Cmd+Option+I)
3. Elements tab shows Shadow DOM boundaries clearly

**Safari-specific considerations:**
- OPFS not available (use IndexedDB fallback)
- BroadcastChannel available in Safari 15.4+
- Test iOS Safari separately (different engine version)

### LARC DevTools Extension (Optional)

The LARC DevTools extension (in development) provides:

- Visual PAN message inspector
- Component tree visualization
- Performance profiling
- State inspection

Install from Chrome Web Store or Firefox Add-ons when available.

## Your First LARC Application

Let's build a complete task manager to demonstrate LARC's development workflow. This isn't a trivial example—it includes multiple components, state management, persistence, and error handling.

### Step 1: Project Setup

Create a new directory and add `index.html`:

```bash
$ mkdir task-manager
$ cd task-manager
```

**index.html:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Task Manager - LARC Example</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f5f5f5;
      padding: 2rem;
    }

    .container {
      max-width: 600px;
      margin: 0 auto;
    }

    h1 {
      margin-bottom: 2rem;
      color: #333;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Task Manager</h1>

    <!-- Load LARC from CDN -->
    <script type="module" src="https://unpkg.com/@larcjs/core@1.1.1/src/pan.mjs"></script>

    <!-- Load our custom components -->
    <script type="module" src="./src/components/task-form.mjs"></script>
    <script type="module" src="./src/components/task-list.mjs"></script>
    <script type="module" src="./src/components/task-item.mjs"></script>

    <!-- Use components -->
    <task-form></task-form>
    <task-list></task-list>
  </div>
</body>
</html>
```

### Step 2: Create Directory Structure

```bash
$ mkdir -p src/components src/utils
```

### Step 3: Build the Task Form Component

Create `src/components/task-form.mjs`:

```javascript
class TaskForm extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-bottom: 2rem;
        }

        form {
          display: flex;
          gap: 0.5rem;
          background: white;
          padding: 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
        }

        input:focus {
          outline: none;
          border-color: #4CAF50;
        }

        button {
          padding: 0.75rem 1.5rem;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background: #45a049;
        }

        button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
      </style>

      <form>
        <input
          type="text"
          placeholder="What needs to be done?"
          required
          autocomplete="off"
        />
        <button type="submit">Add Task</button>
      </form>
    `;
  }

  setupEventListeners() {
    const form = this.shadowRoot.querySelector('form');
    const input = this.shadowRoot.querySelector('input');

    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const text = input.value.trim();
      if (!text) return;

      // Publish task creation via PAN bus
      window.panClient.publish('tasks.add', {
        id: Date.now(),
        text,
        completed: false,
        createdAt: new Date().toISOString()
      });

      // Clear input
      input.value = '';
      input.focus();
    });
  }
}

customElements.define('task-form', TaskForm);
```

### Step 4: Build the Task List Component

Create `src/components/task-list.mjs`:

```javascript
class TaskList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tasks = [];
  }

  connectedCallback() {
    this.render();
    this.subscribeToMessages();
    this.loadTasks();
  }

  disconnectedCallback() {
    // Clean up subscriptions
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => sub.unsubscribe());
    }
  }

  subscribeToMessages() {
    this.subscriptions = [
      // Listen for new tasks
      window.panClient.subscribe('tasks.add', ({ data }) => {
        this.tasks.push(data);
        this.saveTasks();
        this.render();
      }),

      // Listen for task toggles
      window.panClient.subscribe('tasks.toggle', ({ data }) => {
        const task = this.tasks.find(t => t.id === data.id);
        if (task) {
          task.completed = !task.completed;
          this.saveTasks();
          this.render();
        }
      }),

      // Listen for task deletions
      window.panClient.subscribe('tasks.delete', ({ data }) => {
        this.tasks = this.tasks.filter(t => t.id !== data.id);
        this.saveTasks();
        this.render();
      })
    ];
  }

  loadTasks() {
    try {
      const stored = localStorage.getItem('larc-tasks');
      if (stored) {
        this.tasks = JSON.parse(stored);
        this.render();
      }
    } catch (error) {
      console.error('Failed to load tasks:', error);
    }
  }

  saveTasks() {
    try {
      localStorage.setItem('larc-tasks', JSON.stringify(this.tasks));
    } catch (error) {
      console.error('Failed to save tasks:', error);
    }
  }

  render() {
    const total = this.tasks.length;
    const completed = this.tasks.filter(t => t.completed).length;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        .summary {
          background: white;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
          color: #666;
          font-size: 0.9rem;
        }

        .list {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          overflow: hidden;
        }

        .empty {
          padding: 3rem;
          text-align: center;
          color: #999;
        }
      </style>

      ${total > 0 ? `
        <div class="summary">
          ${completed} of ${total} tasks completed
        </div>
      ` : ''}

      <div class="list">
        ${total === 0 ? `
          <div class="empty">No tasks yet. Add one above!</div>
        ` : ''}
      </div>
    `;

    // Render task items
    const list = this.shadowRoot.querySelector('.list');
    this.tasks.forEach(task => {
      const item = document.createElement('task-item');
      item.setAttribute('task-id', task.id);
      item.setAttribute('text', task.text);
      if (task.completed) {
        item.setAttribute('completed', '');
      }
      list.appendChild(item);
    });
  }
}

customElements.define('task-list', TaskList);
```

### Step 5: Build the Task Item Component

Create `src/components/task-item.mjs`:

```javascript
class TaskItem extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['completed', 'text'];
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
  }

  attributeChangedCallback() {
    if (this.shadowRoot) {
      this.render();
    }
  }

  get taskId() {
    return parseInt(this.getAttribute('task-id'));
  }

  get text() {
    return this.getAttribute('text') || '';
  }

  get completed() {
    return this.hasAttribute('completed');
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          border-bottom: 1px solid #eee;
        }

        :host(:last-child) {
          border-bottom: none;
        }

        .task {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.5rem;
          transition: background 0.2s;
        }

        .task:hover {
          background: #f9f9f9;
        }

        input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }

        .text {
          flex: 1;
          font-size: 1rem;
          transition: color 0.2s, text-decoration 0.2s;
        }

        .text.completed {
          color: #999;
          text-decoration: line-through;
        }

        .delete {
          padding: 0.5rem 1rem;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
          opacity: 0.7;
          transition: opacity 0.2s;
        }

        .delete:hover {
          opacity: 1;
        }
      </style>

      <div class="task">
        <input type="checkbox" ${this.completed ? 'checked' : ''} />
        <span class="text ${this.completed ? 'completed' : ''}">${this.text}</span>
        <button class="delete">Delete</button>
      </div>
    `;
  }

  setupEventListeners() {
    const checkbox = this.shadowRoot.querySelector('input[type="checkbox"]');
    const deleteBtn = this.shadowRoot.querySelector('.delete');

    checkbox.addEventListener('change', () => {
      window.panClient.publish('tasks.toggle', {
        id: this.taskId
      });
    });

    deleteBtn.addEventListener('click', () => {
      window.panClient.publish('tasks.delete', {
        id: this.taskId
      });
    });
  }
}

customElements.define('task-item', TaskItem);
```

### Step 6: Run the Application

Start your development server:

```bash
$ python3 -m http.server 8000
```

Open `http://localhost:8000` in your browser. You should see:

- A form to add tasks
- An empty state message
- Tasks appear when you add them
- Checkbox to toggle completion
- Delete button to remove tasks
- Task counter showing progress
- Persistence (refresh the page—tasks remain)

### What You Just Built

This application demonstrates core LARC concepts:

1. **Component Composition** - Three components work together without direct coupling
2. **PAN Bus Messaging** - Components communicate through published messages
3. **Shadow DOM** - Each component has encapsulated styles
4. **Lifecycle Management** - Components clean up subscriptions properly
5. **State Persistence** - Data saved to localStorage automatically
6. **Progressive Enhancement** - Works without JavaScript for basic HTML

**Try these experiments:**

1. Open the Console and log all PAN messages:
```javascript
panClient.subscribe('*', ({ topic, data }) => {
  console.log('[PAN]', topic, data);
});
```

2. Add a task and watch messages flow: `tasks.add`, updates trigger re-renders

3. Inspect Shadow DOM in Elements panel—each component's styles are isolated

4. Refresh the page—tasks persist via localStorage

## Serving Static Files

LARC applications are just HTML, CSS, and JavaScript files. Any HTTP server works, but different servers offer different features.

### Development Servers (Local)

**Quick comparison:**

| Server | Setup | Hot Reload | HTTPS | Speed | Best For |
|--------|-------|------------|-------|-------|----------|
| Python | Built-in | No | No | Fast | Quick testing |
| Live Server | VS Code ext | Yes | Optional | Fast | Active development |
| http-server | npm | No | Optional | Fast | Node users |
| Vite | npm | Yes | Yes | Fastest | Full projects |
| PHP | Built-in | No | No | Fast | PHP developers |

**Recommended workflow:**

1. **Learning/Experimenting:** Python (`python3 -m http.server`)
2. **Active Development:** Live Server extension or Vite
3. **Team Projects:** Vite or similar with shared config

### Production Servers

**Static hosting options:**

1. **CDN-based:**
   - Netlify (drag-and-drop deployment)
   - Vercel (Git integration)
   - Cloudflare Pages (global edge network)
   - GitHub Pages (free for public repos)

2. **Traditional hosting:**
   - Nginx (most common)
   - Apache (with mod_rewrite)
   - Caddy (automatic HTTPS)

3. **Cloud platforms:**
   - AWS S3 + CloudFront
   - Google Cloud Storage + CDN
   - Azure Static Web Apps

**Deployment is simple:**

```bash
# Example: Netlify CLI
$ npm install -g netlify-cli
$ netlify deploy --dir=. --prod
```

Your LARC app deploys like any static site—just upload files. No build step required (though you can add optimization).

### CORS and Module Loading

ES modules require proper MIME types. Most servers handle this automatically, but verify:

**Nginx:**
```nginx
types {
    application/javascript mjs js;
}
```

**Apache (.htaccess):**
```apache
AddType application/javascript .mjs
```

**Python:** Works by default

If modules fail to load, check:

1. Console for CORS errors
2. Network tab for MIME type (`application/javascript`)
3. Server is running (file:// URLs don't work)

## Browser Requirements and Compatibility

LARC targets modern browsers with native Web Components support. Here's what you need to know.

### Supported Browsers

**Minimum versions (full support, no polyfills):**

| Browser | Version | Released | Market Share |
|---------|---------|----------|--------------|
| Chrome | 90+ | April 2021 | ~65% |
| Edge | 90+ | April 2021 | ~5% |
| Firefox | 88+ | April 2021 | ~3% |
| Safari | 14+ | Sept 2020 | ~20% |
| Opera | 76+ | April 2021 | ~2% |
| Samsung | 15+ | April 2021 | ~3% |

**Total coverage:** ~98% of global users (2025 data)

These versions support:

- Custom Elements v1
- Shadow DOM v1
- ES Modules
- IntersectionObserver
- MutationObserver
- Async/await

### Feature Detection

Not all browsers support every optional feature. Use feature detection:

```javascript
// Check for optional features
const features = {
  opfs: 'storage' in navigator && 'getDirectory' in navigator.storage,
  broadcastChannel: typeof BroadcastChannel !== 'undefined',
  resizeObserver: typeof ResizeObserver !== 'undefined',
  constructableStylesheets: 'adoptedStyleSheets' in Document.prototype
};

console.log('Available features:', features);

// Use features conditionally
if (features.opfs) {
  // Use Origin Private File System
} else {
  // Fall back to IndexedDB
}
```

### Polyfills for Older Browsers

If you must support older browsers, add polyfills selectively:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LARC with Polyfills</title>

  <!-- Feature detection -->
  <script>
    // Only load polyfills if needed
    if (!('customElements' in window)) {
      document.write('<script src="https://unpkg.com/@webcomponents/webcomponentsjs@2/webcomponents-loader.js"><\/script>');
    }

    if (typeof BroadcastChannel === 'undefined') {
      document.write('<script src="https://unpkg.com/broadcast-channel@4/dist/bundle.js"><\/script>');
    }
  </script>

  <!-- Load LARC after polyfills -->
  <script type="module" src="https://unpkg.com/@larcjs/core@1.1.1/src/pan.mjs"></script>
</head>
<body>
  <!-- Your app -->
</body>
</html>
```

**Polyfill size impact:**
- Web Components: ~30 KB gzipped
- BroadcastChannel: ~5 KB gzipped
- Total: ~35 KB for full compatibility

**Recommendation:** Target modern browsers only. Display upgrade message for IE11 and older browsers:

```html
<!--[if IE]>
<div style="padding: 2rem; background: #fff3cd; border: 2px solid #ffc107;">
  <h2>Browser Update Required</h2>
  <p>This application requires a modern browser. Please upgrade to Chrome 90+, Firefox 88+, Safari 14+, or Edge 90+.</p>
</div>
<![endif]-->
```

### Mobile Browser Support

LARC works on mobile browsers with the same requirements:

**iOS:**
- Safari 14+ (iOS 14+)
- Chrome 90+ (iOS)
- Full support except OPFS (use IndexedDB fallback)

**Android:**
- Chrome 90+ (Android 7+)
- Samsung Internet 15+
- Full support including OPFS

**Test on real devices:**
```bash
# Start server accessible on network
$ python3 -m http.server 8000

# Find your local IP
$ ifconfig | grep "inet "  # Mac/Linux
$ ipconfig                  # Windows

# Access from mobile browser
# http://192.168.1.100:8000
```

## Common Troubleshooting

### Problem: Components Don't Load

**Symptoms:** Page blank, no errors, or "Failed to fetch" in Console

**Solutions:**

1. **Check server is running:**
```bash
$ python3 -m http.server 8000
# Should show "Serving HTTP on..."
```

2. **Verify file paths:**
```javascript
// Check Network tab in DevTools
// Look for 404 errors
```

3. **Check MIME types:**
```bash
# Should be application/javascript
$ curl -I http://localhost:8000/src/components/task-form.mjs
```

4. **Verify module syntax:**
```javascript
// Must use .mjs extension or type="module"
<script type="module" src="./app.js"></script>
```

### Problem: PAN Bus Messages Not Received

**Symptoms:** Components don't update when publishing messages

**Solutions:**

1. **Wait for PAN bus initialization:**
```javascript
// Wrong - panClient may not exist yet
window.panClient.publish('test', {});

// Right - wait for pan-ready event
window.addEventListener('pan-ready', () => {
  window.panClient.publish('test', {});
});
```

2. **Check subscriptions:**
```javascript
// Debug: Log all messages
panClient.subscribe('*', ({ topic, data }) => {
  console.log('[PAN]', topic, data);
});
```

3. **Verify topic patterns:**
```javascript
// Specific
panClient.subscribe('tasks.add', handler);  // Only tasks.add

// Wildcard
panClient.subscribe('tasks.*', handler);    // All tasks.* topics

// All
panClient.subscribe('*', handler);          // Everything
```

### Problem: Styles Not Applying

**Symptoms:** Components render but look unstyled

**Solutions:**

1. **Check Shadow DOM encapsulation:**
```javascript
// Global styles don't penetrate Shadow DOM
// Use :host selector
this.shadowRoot.innerHTML = `
  <style>
    :host {
      display: block;  /* Applied to component itself */
    }
    .inner {
      color: blue;     /* Applied to internal elements */
    }
  </style>
`;
```

2. **Use CSS Custom Properties for theming:**
```css
/* Global (outside Shadow DOM) */
:root {
  --primary-color: #4CAF50;
}

/* Component (inside Shadow DOM) */
button {
  background: var(--primary-color);
}
```

### Problem: localStorage Quota Exceeded

**Symptoms:** "QuotaExceededError" in Console

**Solutions:**

1. **Check storage usage:**
```javascript
if ('storage' in navigator && 'estimate' in navigator.storage) {
  navigator.storage.estimate().then(({ usage, quota }) => {
    console.log(`Using ${usage} of ${quota} bytes`);
  });
}
```

2. **Implement data cleanup:**
```javascript
try {
  localStorage.setItem('data', JSON.stringify(data));
} catch (error) {
  if (error.name === 'QuotaExceededError') {
    // Clear old data
    localStorage.clear();
    // Try again
    localStorage.setItem('data', JSON.stringify(data));
  }
}
```

3. **Use IndexedDB for large datasets:**
```javascript
// IndexedDB has much higher quota (typically 50%+ of disk space)
```

### Problem: CORS Errors

**Symptoms:** "CORS policy" errors when loading components

**Solutions:**

1. **Use proper server (not file://):**
```bash
# Don't open index.html directly in browser
# Always use HTTP server
$ python3 -m http.server 8000
```

2. **Check CDN CORS headers (usually automatic)**

3. **For API calls, configure server CORS:**
```javascript
// Server must send appropriate headers
Access-Control-Allow-Origin: *
```

## Next Steps

You now have a working LARC development environment and understand the basic workflow:

1. Create HTML file with component tags
2. Load LARC autoloader
3. Write components as Custom Elements
4. Communicate through PAN bus
5. Test in browser with DevTools
6. Deploy as static files

In Chapter 6, we'll explore state management in depth—how to handle complex application state, implement undo/redo, synchronize across tabs, and persist data reliably. The task manager you built is a foundation; next, we'll scale it up.

Before moving on, experiment with your task manager:

- Add filtering (all/active/completed)
- Implement task editing
- Add due dates
- Create categories
- Export/import tasks

Each feature is an opportunity to practice PAN messaging and component composition. The patterns you learn here apply to any LARC application.

Welcome to zero-build development. The browser is your development environment now.
