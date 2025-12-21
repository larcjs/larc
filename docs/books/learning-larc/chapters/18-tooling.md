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
