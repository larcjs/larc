# Tooling

While LARC doesn't require a build step, the right tools make development faster and more enjoyable.

## Development Server

A simple development server with live reload:

```javascript
// dev-server.js
const http = require('http');
const fs = require('fs');
const path = require('path');
const WebSocket = require('ws');

const PORT = 3000;
const PUBLIC_DIR = './public';

// HTTP Server
const server = http.createServer((req, res) => {
  let filePath = path.join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

  const ext = path.extname(filePath);
  const contentTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json'
  };

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentTypes[ext] || 'text/plain' });
    res.end(content);
  });
});

// WebSocket for live reload
const wss = new WebSocket.Server({ server });

fs.watch(PUBLIC_DIR, { recursive: true }, () => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send('reload');
    }
  });
});

server.listen(PORT, () => console.log(`Dev server at http://localhost:${PORT}`));
```

Add live reload to your HTML:

```html
<script>
  const ws = new WebSocket('ws://localhost:3000');
  ws.onmessage = () => location.reload();
</script>
```

## VS Code Configuration

Enhance your editor experience:

```json
// .vscode/settings.json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "files.associations": {
    "*.mjs": "javascript"
  }
}
```

Useful snippets:

```json
// .vscode/snippets/larc.code-snippets
{
  "LARC Component": {
    "prefix": "larc",
    "body": [
      "class ${1:ComponentName} extends HTMLElement {",
      "  constructor() {",
      "    super();",
      "    this.attachShadow({ mode: 'open' });",
      "  }",
      "",
      "  connectedCallback() {",
      "    this.render();",
      "  }",
      "",
      "  render() {",
      "    this.shadowRoot.innerHTML = `",
      "      <style>",
      "        :host { display: block; }",
      "      </style>",
      "      <div>$2</div>",
      "    `;",
      "  }",
      "}",
      "",
      "customElements.define('${3:component-name}', ${1:ComponentName});"
    ]
  }
}
```

## ESLint Configuration

Lint your code for consistency:

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.js', '**/*.mjs'],
    rules: {
      'no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error'
    }
  }
];
```

## Browser DevTools

Chrome DevTools has excellent Web Component support:

- **Elements panel**: Inspect shadow DOM by clicking the `#shadow-root` toggle
- **Console**: Access element's shadow root with `$0.shadowRoot`
- **Network panel**: Monitor fetch requests and WebSocket connections
- **Performance panel**: Profile render performance
- **Application panel**: Inspect localStorage, sessionStorage, IndexedDB

## Debugging PAN Bus

Add a debug utility:

```javascript
// pan-debug.js
pan.subscribe('*', (data, topic) => {
  console.log(`[PAN] ${topic}`, data);
});
```

Or use the LARC DevTools extension for a visual message inspector.

## Complete Development Environment Setup

Let's set up a full-featured development environment:

**1. Project structure:**

```
my-larc-project/
├── public/
│   ├── index.html
│   ├── app.js
│   ├── components/
│   └── styles/
├── tests/
│   ├── unit/
│   └── e2e/
├── .vscode/
│   ├── settings.json
│   ├── extensions.json
│   └── snippets/
├── .eslintrc.js
├── .prettierrc
├── package.json
└── dev-server.js
```

**2. Package.json with dev scripts:**

```json
{
  "name": "my-larc-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "node dev-server.js",
    "test": "web-test-runner \"tests/**/*.test.js\"",
    "test:watch": "npm test -- --watch",
    "lint": "eslint '**/*.{js,mjs}'",
    "lint:fix": "eslint '**/*.{js,mjs}' --fix",
    "format": "prettier --write '**/*.{js,mjs,html,css,json,md}'",
    "format:check": "prettier --check '**/*.{js,mjs,html,css,json,md}'",
    "analyze": "wca analyze 'public/components/**/*.js' --outFile custom-elements.json"
  },
  "devDependencies": {
    "@open-wc/testing": "^4.0.0",
    "@web/dev-server": "^0.4.0",
    "@web/test-runner": "^0.18.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0",
    "web-component-analyzer": "^2.0.0",
    "ws": "^8.0.0"
  }
}
```

**3. Complete dev server with HMR:**

```javascript
// dev-server.js
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { watch } from 'fs';
import { join, extname } from 'path';
import { WebSocketServer } from 'ws';

const PORT = 3000;
const PUBLIC_DIR = './public';

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// HTTP Server
const server = createServer(async (req, res) => {
  try {
    // Handle SPA routing - serve index.html for non-file routes
    let filePath = join(PUBLIC_DIR, req.url === '/' ? 'index.html' : req.url);

    // Try to read the file
    let content;
    try {
      content = await readFile(filePath);
    } catch (err) {
      // If file not found and URL doesn't have extension, serve index.html
      if (!extname(req.url)) {
        filePath = join(PUBLIC_DIR, 'index.html');
        content = await readFile(filePath);
      } else {
        throw err;
      }
    }

    const ext = extname(filePath);
    const contentType = contentTypes[ext] || 'application/octet-stream';

    // Inject live reload script for HTML files
    if (ext === '.html') {
      const liveReloadScript = `
        <script>
          (function() {
            const ws = new WebSocket('ws://localhost:${PORT}');
            ws.onmessage = (event) => {
              if (event.data === 'reload') {
                console.log('[Dev Server] Reloading...');
                location.reload();
              } else if (event.data.startsWith('hmr:')) {
                const module = event.data.substring(4);
                console.log('[Dev Server] Hot reload:', module);
                // Implement HMR logic here
              }
            };
            ws.onerror = () => console.error('[Dev Server] WebSocket error');
            ws.onclose = () => console.log('[Dev Server] Disconnected');
          })();
        </script>
      `;
      content = Buffer.from(
        content.toString().replace('</body>', `${liveReloadScript}</body>`)
      );
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(content);
  } catch (err) {
    console.error('Server error:', err);
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head><title>404 Not Found</title></head>
        <body>
          <h1>404 - Not Found</h1>
          <p>${req.url}</p>
        </body>
      </html>
    `);
  }
});

// WebSocket for live reload
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');
  ws.on('close', () => console.log('Client disconnected'));
});

// File watcher
watch(PUBLIC_DIR, { recursive: true }, (eventType, filename) => {
  if (filename) {
    console.log(`File changed: ${filename}`);

    // Notify all connected clients
    wss.clients.forEach(client => {
      if (client.readyState === 1) { // WebSocket.OPEN
        if (filename.endsWith('.js') || filename.endsWith('.mjs')) {
          client.send(`hmr:${filename}`);
        } else {
          client.send('reload');
        }
      }
    });
  }
});

server.listen(PORT, () => {
  console.log(`
🚀 Dev server running at http://localhost:${PORT}
📁 Serving: ${PUBLIC_DIR}
🔥 Live reload enabled
  `);
});
```

## Advanced VS Code Configuration

**Complete settings.json:**

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "editor.quickSuggestions": {
    "strings": true
  },
  "emmet.includeLanguages": {
    "javascript": "html"
  },
  "files.associations": {
    "*.mjs": "javascript"
  },
  "files.exclude": {
    "**/.git": true,
    "**/node_modules": true,
    "**/.DS_Store": true
  },
  "search.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.git": true
  },
  "javascript.preferences.quoteStyle": "single",
  "javascript.suggest.autoImports": true,
  "javascript.updateImportsOnFileMove.enabled": "always",
  "css.lint.unknownAtRules": "ignore"
}
```

**Recommended extensions:**

```json
// .vscode/extensions.json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "ritwickdey.liveserver",
    "christian-kohler.path-intellisense",
    "zignd.html-css-class-completion",
    "formulahendry.auto-rename-tag"
  ]
}
```

**Custom snippets:**

```json
// .vscode/snippets/larc.code-snippets
{
  "LARC Component with Shadow DOM": {
    "prefix": "larc-component",
    "body": [
      "/**",
      " * ${1:ComponentName} - ${2:Component description}",
      " * @element ${3:component-name}",
      " */",
      "class ${1:ComponentName} extends HTMLElement {",
      "  constructor() {",
      "    super();",
      "    this.attachShadow({ mode: 'open' });",
      "  }",
      "",
      "  connectedCallback() {",
      "    this.render();",
      "  }",
      "",
      "  disconnectedCallback() {",
      "    // Clean up",
      "  }",
      "",
      "  render() {",
      "    this.shadowRoot.innerHTML = `",
      "      <style>",
      "        :host {",
      "          display: block;",
      "        }",
      "      </style>",
      "      <div class=\"${3:component-name}\">",
      "        $4",
      "      </div>",
      "    `;",
      "  }",
      "}",
      "",
      "customElements.define('${3:component-name}', ${1:ComponentName});"
    ],
    "description": "Create a LARC component with Shadow DOM"
  },
  "PAN Subscribe": {
    "prefix": "pan-sub",
    "body": [
      "this.subscription = pan.subscribe('${1:topic}', (data) => {",
      "  $2",
      "});"
    ],
    "description": "Subscribe to PAN topic"
  },
  "PAN Publish": {
    "prefix": "pan-pub",
    "body": [
      "pan.publish('${1:topic}', {",
      "  $2",
      "});"
    ],
    "description": "Publish to PAN topic"
  }
}
```

## ESLint and Prettier Configuration

**Complete ESLint config:**

```javascript
// eslint.config.js
export default [
  {
    files: ['**/*.{js,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        customElements: 'readonly',
        HTMLElement: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        URL: 'readonly',
        URLSearchParams: 'readonly'
      }
    },
    rules: {
      // Best practices
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'eqeqeq': ['error', 'always'],
      'no-eval': 'error',
      'no-implied-eval': 'error',

      // Formatting (let Prettier handle most)
      'semi': ['error', 'always'],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'comma-dangle': ['error', 'never'],

      // ES6+
      'arrow-spacing': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-template': 'warn',
      'template-curly-spacing': 'error',
      'object-shorthand': 'warn',

      // Async
      'no-async-promise-executor': 'error',
      'require-await': 'warn',

      // Custom Elements
      'no-constructor-return': 'error'
    }
  },
  {
    files: ['**/*.test.{js,mjs}'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly'
      }
    }
  }
];
```

**Prettier configuration:**

```json
// .prettierrc
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

**Ignore files:**

```
# .prettierignore
node_modules
dist
build
coverage
*.min.js
package-lock.json
```

## Advanced Debugging Techniques

**1. Source maps for debugging:**

Although LARC doesn't need transpilation, you can still use source maps for development:

```javascript
// Add inline source maps during development
if (import.meta.env?.MODE === 'development') {
  Error.stackTraceLimit = Infinity;
}
```

**2. Component debugger:**

```javascript
// debug-component.js
export function debugComponent(ComponentClass) {
  const originalConnected = ComponentClass.prototype.connectedCallback;
  const originalDisconnected = ComponentClass.prototype.disconnectedCallback;
  const originalAttributeChanged = ComponentClass.prototype.attributeChangedCallback;

  ComponentClass.prototype.connectedCallback = function(...args) {
    console.log(`[Connected] <${this.tagName.toLowerCase()}>`, this);
    return originalConnected?.apply(this, args);
  };

  ComponentClass.prototype.disconnectedCallback = function(...args) {
    console.log(`[Disconnected] <${this.tagName.toLowerCase()}>`, this);
    return originalDisconnected?.apply(this, args);
  };

  ComponentClass.prototype.attributeChangedCallback = function(name, old, val) {
    console.log(`[Attribute] <${this.tagName.toLowerCase()}> ${name}: ${old} → ${val}`);
    return originalAttributeChanged?.call(this, name, old, val);
  };

  return ComponentClass;
}

// Usage
@debugComponent
class MyComponent extends HTMLElement {
  // ...
}
```

**3. Performance profiling:**

```javascript
// performance-tracker.js
class PerformanceTracker {
  constructor(name) {
    this.name = name;
    this.marks = new Map();
  }

  start(label) {
    const markName = `${this.name}:${label}:start`;
    performance.mark(markName);
    this.marks.set(label, markName);
  }

  end(label) {
    const startMark = this.marks.get(label);
    if (!startMark) {
      console.warn(`No start mark for ${label}`);
      return;
    }

    const endMark = `${this.name}:${label}:end`;
    performance.mark(endMark);

    const measureName = `${this.name}:${label}`;
    performance.measure(measureName, startMark, endMark);

    const measure = performance.getEntriesByName(measureName)[0];
    console.log(`⏱ ${measureName}: ${measure.duration.toFixed(2)}ms`);

    // Clean up
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    this.marks.delete(label);
  }
}

// Usage in component
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.perf = new PerformanceTracker('MyComponent');
  }

  connectedCallback() {
    this.perf.start('render');
    this.render();
    this.perf.end('render');
  }
}
```

**4. Network debugging:**

```javascript
// network-debugger.js
const originalFetch = window.fetch;

window.fetch = function(...args) {
  const startTime = performance.now();
  const [url, options] = args;

  console.log(`[Fetch] →`, {
    url,
    method: options?.method || 'GET',
    headers: options?.headers,
    body: options?.body
  });

  return originalFetch.apply(this, args)
    .then(response => {
      const duration = performance.now() - startTime;
      console.log(`[Fetch] ← ${response.status} (${duration.toFixed(0)}ms)`, url);
      return response;
    })
    .catch(error => {
      const duration = performance.now() - startTime;
      console.error(`[Fetch] ✗ (${duration.toFixed(0)}ms)`, url, error);
      throw error;
    });
};
```

## PAN Bus DevTools

Build a visual inspector for PAN messages:

```javascript
// pan-devtools.js
class PanDevTools extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.messages = [];
    this.maxMessages = 100;
    this.filter = '';
  }

  connectedCallback() {
    this.render();
    this.setupPanMonitoring();
  }

  setupPanMonitoring() {
    // Subscribe to all topics
    pan.subscribe('*', (data, topic) => {
      this.logMessage({
        timestamp: new Date(),
        topic,
        data,
        type: 'received'
      });
    });

    // Intercept publishes (if PAN client supports it)
    const originalPublish = pan.publish;
    pan.publish = (topic, data) => {
      this.logMessage({
        timestamp: new Date(),
        topic,
        data,
        type: 'sent'
      });
      return originalPublish.call(pan, topic, data);
    };
  }

  logMessage(message) {
    this.messages.unshift(message);
    if (this.messages.length > this.maxMessages) {
      this.messages.pop();
    }
    this.renderMessages();
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 400px;
          max-height: 600px;
          background: #1e1e1e;
          color: #d4d4d4;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 12px;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
          display: flex;
          flex-direction: column;
          z-index: 10000;
        }

        .header {
          padding: 8px;
          background: #252526;
          border-bottom: 1px solid #3e3e42;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .title {
          font-weight: bold;
          color: #4ec9b0;
        }

        .controls {
          display: flex;
          gap: 8px;
        }

        button {
          background: #3e3e42;
          border: none;
          color: #d4d4d4;
          padding: 4px 8px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 11px;
        }

        button:hover {
          background: #4e4e52;
        }

        .filter {
          padding: 8px;
          border-bottom: 1px solid #3e3e42;
        }

        input {
          width: 100%;
          padding: 4px 8px;
          background: #3c3c3c;
          border: 1px solid #3e3e42;
          color: #d4d4d4;
          border-radius: 3px;
          font-size: 11px;
        }

        .messages {
          flex: 1;
          overflow-y: auto;
          padding: 8px;
        }

        .message {
          margin-bottom: 8px;
          padding: 8px;
          background: #252526;
          border-left: 3px solid #4ec9b0;
          border-radius: 3px;
        }

        .message.sent {
          border-left-color: #569cd6;
        }

        .message-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }

        .topic {
          color: #4ec9b0;
          font-weight: bold;
        }

        .timestamp {
          color: #858585;
          font-size: 10px;
        }

        .data {
          color: #ce9178;
          white-space: pre-wrap;
          word-break: break-all;
        }

        .type {
          display: inline-block;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          margin-left: 8px;
        }

        .type.sent {
          background: #569cd6;
        }

        .type.received {
          background: #4ec9b0;
        }
      </style>

      <div class="header">
        <span class="title">PAN DevTools</span>
        <div class="controls">
          <button id="clear-btn">Clear</button>
          <button id="close-btn">Close</button>
        </div>
      </div>

      <div class="filter">
        <input type="text" id="filter-input" placeholder="Filter by topic...">
      </div>

      <div class="messages" id="messages"></div>
    `;

    // Setup event listeners
    this.shadowRoot.getElementById('clear-btn').addEventListener('click', () => {
      this.messages = [];
      this.renderMessages();
    });

    this.shadowRoot.getElementById('close-btn').addEventListener('click', () => {
      this.remove();
    });

    this.shadowRoot.getElementById('filter-input').addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase();
      this.renderMessages();
    });
  }

  renderMessages() {
    const messagesEl = this.shadowRoot.getElementById('messages');
    if (!messagesEl) return;

    const filtered = this.filter
      ? this.messages.filter(m => m.topic.toLowerCase().includes(this.filter))
      : this.messages;

    messagesEl.innerHTML = filtered.map(msg => `
      <div class="message ${msg.type}">
        <div class="message-header">
          <span class="topic">${msg.topic}</span>
          <span class="timestamp">${msg.timestamp.toLocaleTimeString()}.${msg.timestamp.getMilliseconds()}</span>
        </div>
        <div>
          <span class="type ${msg.type}">${msg.type}</span>
        </div>
        <div class="data">${JSON.stringify(msg.data, null, 2)}</div>
      </div>
    `).join('');
  }
}

customElements.define('pan-devtools', PanDevTools);

// Add to page with keyboard shortcut
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'P') {
    if (!document.querySelector('pan-devtools')) {
      document.body.appendChild(document.createElement('pan-devtools'));
    }
  }
});
```

## Optional Build Tools

While LARC doesn't need a build step, sometimes you want to bundle for production:

**Using esbuild for optimization:**

```javascript
// build.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['public/app.js'],
  bundle: true,
  minify: true,
  sourcemap: true,
  target: ['es2020'],
  outfile: 'dist/app.min.js',
  format: 'esm',
  splitting: false,
  treeShaking: true
});

console.log('✅ Build complete');
```

**Using Rollup:**

```javascript
// rollup.config.js
import { terser } from 'rollup-plugin-terser';
import resolve from '@rollup/plugin-node-resolve';

export default {
  input: 'public/app.js',
  output: {
    file: 'dist/app.min.js',
    format: 'esm',
    sourcemap: true
  },
  plugins: [
    resolve(),
    terser()
  ]
};
```

## Troubleshooting Tooling Issues

### Problem 1: Live Reload Not Working

**Symptoms**: Changes aren't reflected after saving files.

**Diagnosis**:

```bash
# Check if dev server is running
ps aux | grep node

# Check WebSocket connection in browser console
# Should see WebSocket connected message
```

**Solution**:

```javascript
// Ensure WebSocket script is injected
// Check browser console for WebSocket errors
// Verify port 3000 is not blocked by firewall

// Alternative: Use browser extension like LiveReload
```

### Problem 2: ESLint Errors in VS Code

**Symptoms**: Red squiggly lines everywhere, but code works fine.

**Cause**: ESLint configuration mismatch.

**Solution**:

```bash
# Reinstall ESLint
npm install --save-dev eslint

# Restart VS Code ESLint server
# Cmd+Shift+P → "ESLint: Restart ESLint Server"

# Check ESLint output panel
# View → Output → Select "ESLint" from dropdown
```

### Problem 3: Import Paths Not Resolving

**Symptoms**: VS Code shows import errors, but browser loads fine.

**Cause**: VS Code doesn't understand import maps.

**Solution**:

```json
// jsconfig.json - Help VS Code understand paths
{
  "compilerOptions": {
    "module": "esnext",
    "moduleResolution": "bundler",
    "baseUrl": "./public",
    "paths": {
      "@components/*": ["components/*"],
      "@utils/*": ["utils/*"]
    }
  },
  "include": ["public/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Problem 4: Shadow DOM Not Visible in DevTools

**Symptoms**: Can't inspect Shadow DOM elements.

**Cause**: Shadow DOM panel not enabled.

**Solution**:

1. Open Chrome DevTools
2. Go to Settings (gear icon)
3. Preferences → Elements → Enable "Show user agent shadow DOM"
4. Now you can see `#shadow-root` in Elements panel

## Tooling Best Practices

1. **Use a Dev Server**: Never open HTML files directly—use a local server for proper CORS and module loading.

2. **Enable Live Reload**: Instant feedback speeds up development significantly.

3. **Configure Your Editor**: Proper linting, formatting, and snippets save hours of work.

4. **Debug with DevTools**: Master the Elements, Console, Network, and Performance panels.

5. **Monitor PAN Messages**: Use a visual inspector to understand message flow.

6. **Profile Performance**: Use Performance API and DevTools to find bottlenecks.

7. **Automate Formatting**: Let Prettier handle code style—focus on logic.

8. **Test Continuously**: Run tests in watch mode during development.

9. **Document As You Go**: JSDoc comments help VS Code provide better autocomplete.

10. **Keep It Simple**: Don't over-tool. Start minimal and add tools as needed.

## Hands-On Exercises

### Exercise 1: Set Up Complete Dev Environment

Configure a full development environment with:

- Dev server with live reload
- VS Code with all recommended extensions
- ESLint and Prettier configured
- Custom snippets for LARC components
- Git hooks for pre-commit linting

**Bonus**: Add automated testing on file save.

### Exercise 2: Build a PAN Message Inspector

Create a browser extension or dev panel that:

- Shows all PAN messages in real-time
- Filters messages by topic pattern
- Records and exports message history
- Shows message timing and frequency
- Highlights retained vs. transient messages

**Bonus**: Add ability to publish test messages.

### Exercise 3: Create Custom VS Code Extension

Build a VS Code extension that:

- Generates LARC component boilerplate
- Validates component structure
- Provides autocomplete for PAN topics
- Shows component documentation on hover
- Refactors component names across files

**Bonus**: Publish to VS Code marketplace.

### Exercise 4: Implement Advanced Debugging

Set up comprehensive debugging tools:

- Component lifecycle logger
- Performance profiler for renders
- Network request interceptor
- Error boundary with stack traces
- State inspector for component properties

**Bonus**: Create a dashboard showing all metrics.

## Summary

Good tooling makes LARC development faster and more enjoyable:

- **Dev server**: Live reload and hot module replacement
- **Editor setup**: VS Code configuration, extensions, snippets
- **Linting**: ESLint for code quality, Prettier for formatting
- **Debugging**: DevTools mastery, PAN inspector, performance tracking
- **Automation**: npm scripts, git hooks, CI integration

Start simple and add tools as your project grows. The beauty of LARC is you can be productive with just a text editor and a browser—everything else is optional.

## Further Reading

- **Building with LARC - Chapter 20 (DevTools)**: Advanced debugging techniques
- **Building with LARC - Chapter 11 (Best Practices)**: Development workflow patterns
- **Building with LARC - Chapter 14 (Testing)**: Testing infrastructure setup
