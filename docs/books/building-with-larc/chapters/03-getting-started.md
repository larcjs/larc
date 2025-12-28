# Getting Started

Quick installation and setup reference. For detailed tutorials, see *Learning LARC* Chapter 3.

## Installation

### Via CDN (No Build Tools)

```html
<!DOCTYPE html>
<html>
<head>
  <script type="importmap">
  {
    "imports": {
      "@larc/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2/pan-client.mjs",
      "@larc/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@2/"
    }
  }
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  <my-app></my-app>

  <script type="module">
    import { PanClient } from '@larc/core';

    class MyApp extends HTMLElement {
      connectedCallback() {
        this.innerHTML = '<h1>Hello LARC!</h1>';
      }
    }
    customElements.define('my-app', MyApp);
  </script>
</body>
</html>
```

### Via npm

```bash
npm install @larcjs/core @larcjs/ui
```

```javascript
// In your module
import { PanClient } from '@larcjs/core';
import '@larcjs/ui/pan-button.mjs';
```

### Project Structure

```
my-app/
├── index.html
├── app.mjs
├── components/
│   ├── my-component.mjs
│   └── another-component.mjs
└── styles/
    └── main.css
```

## Development Server

Any static file server works:

```bash
# Python
python3 -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000
```

## Minimal Application

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LARC App</title>
  <script type="importmap">
  {
    "imports": {
      "@larc/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2/pan-client.mjs"
    }
  }
  </script>
</head>
<body>
  <pan-bus debug="true"></pan-bus>
  <my-app></my-app>

  <script type="module" src="/app.mjs"></script>
</body>
</html>
```

```javascript
// app.mjs
import { PanClient } from '@larc/core';

class MyApp extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    // Subscribe to events
    this.client.subscribe('app.ready', () => {
      console.log('App is ready!');
    });

    // Render
    this.innerHTML = `
      <h1>My LARC Application</h1>
      <button id="test-btn">Test PAN Bus</button>
    `;

    // Add event listener
    this.querySelector('#test-btn').addEventListener('click', () => {
      this.client.publish({
        topic: 'button.clicked',
        data: { timestamp: Date.now() }
      });
    });
  }
}

customElements.define('my-app', MyApp);
```

## Import Maps

Define module aliases for cleaner imports:

```html
<script type="importmap">
{
  "imports": {
    "@larc/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@2/pan-client.mjs",
    "@larc/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@2/",
    "@/": "./src/",
    "components/": "./components/"
  }
}
</script>
```

Then use:

```javascript
import { PanClient } from '@larc/core';
import '@larc/ui/pan-button.mjs';
import MyComponent from '@/my-component.mjs';
import Header from 'components/header.mjs';
```

## Browser Requirements

| Browser | Minimum Version | Notes |
|---------|----------------|-------|
| Chrome | 90+ | Full support |
| Firefox | 88+ | Full support |
| Safari | 14+ | Full support |
| Edge | 90+ | Full support |

**Required features:**
- Custom Elements v1
- Shadow DOM v1
- ES Modules
- Import Maps

Check support: `caniuse.com/custom-elementsv1`

## IDE Setup

### VS Code (Recommended)

Install extensions:
- **LARC Extension** — Snippets, IntelliSense
- **ESLint** — Code linting
- **Prettier** — Code formatting
- **Live Server** — Development server

### TypeScript Support

```bash
npm install --save-dev @larcjs/core-types
```

```typescript
// my-component.ts
import { PanClient } from '@larcjs/core';
import type { Message } from '@larcjs/core-types';

class MyComponent extends HTMLElement {
  private client: PanClient;

  connectedCallback(): void {
    this.client = new PanClient(this);

    this.client.subscribe('data.updated', (msg: Message) => {
      console.log(msg.data);
    });
  }
}
```

## Quick Verification

Test your setup:

```javascript
// Open browser console
import { PanClient } from '@larc/core';

const client = new PanClient();
await client.ready();

client.subscribe('test', (msg) => console.log('Received:', msg.data));
client.publish({ topic: 'test', data: { hello: 'world' } });

// Should log: Received: { hello: 'world' }
```

## Next Steps

- **Tutorial**: *Learning LARC* Chapter 3 for step-by-step guide
- **Core concepts**: Chapter 2 for quick reference
- **Components**: Chapters 17-21 for API documentation
- **Examples**: `github.com/larcjs/examples`

## Common Issues

### Import Maps Not Working

**Problem**: Imports fail with "Failed to resolve module specifier"
**Solution**: Ensure import maps are in `<head>` before any module scripts

### PAN Bus Not Ready

**Problem**: `client.ready()` never resolves
**Solution**: Verify `<pan-bus>` element is in DOM before creating PanClient

### CORS Errors with CDN

**Problem**: Module loading fails with CORS error
**Solution**: Use a local development server, not `file://` protocol

See *Learning LARC* Chapter 3 for detailed troubleshooting.
