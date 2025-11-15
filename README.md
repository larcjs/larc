# LARC - Lightweight Asynchronous Relay Core

**Zero-build, browser-native web component framework with PAN (Page Area Network) messaging.**

---

## 💡 The PAN Philosophy

**One line. Zero builds. Pure standards.**

```html
<script type="module" src="/src/pan.mjs"></script>

<!-- That's it. Now just use components declaratively: -->
<pan-theme-provider theme="auto"></pan-theme-provider>
<pan-card title="Hello World">
  <pan-button>Click me</pan-button>
</pan-card>
```

### How It Works

**No imports. No bundlers. No lock-in.**

1. **Include the autoloader** - One `<script>` tag
2. **Use HTML elements** - Write components declaratively in markup
3. **Configure with attributes** - All settings via HTML attributes
4. **Components auto-load** - Discovered and loaded automatically as they enter the viewport

The autoloader:
- Scans your page for undefined custom elements
- Loads the corresponding `.mjs` file automatically (`<pan-card>` → `pan-card.mjs`)
- Uses IntersectionObserver for progressive loading
- Watches for dynamically added elements with MutationObserver

### Why PAN?

**Built with web standards. Interoperable. Loosely coupled. Zero lock-in.**

- ✨ **Standards-based** - Native Web Components, ES Modules, no proprietary tooling
- 🎯 **Declarative** - Components are HTML elements with attributes, not JavaScript APIs
- 🔌 **Loosely coupled** - PAN message bus coordinates components without tight dependencies
- 🌐 **Interoperable** - Works with React, Vue, Angular, Svelte, or vanilla JS
- 🚫 **No lock-in** - Use one component or all of them, mix with anything
- 💾 **No build step** - Write code, refresh browser, see changes instantly
- ❤️ **Built with love** - For developers who love the web platform

### The Architecture

**Two layers. Infinite possibilities.**

1. **`core/`** - PAN messaging bus and infrastructure
   - `pan-bus` - DOM-native pub/sub for component communication
   - Progressive loading system
   - Zero dependencies

2. **`ui/`** - Reusable UI components
   - Theme system, forms, data tables, charts
   - File system, markdown editor, routing
   - All loosely coupled via PAN messages

3. **Your app** - Just HTML, attributes, and optional JavaScript
   - No framework required
   - No build configuration
   - No package.json gymnastics

```html
<!-- Components communicate via PAN bus without knowing about each other -->
<pan-bus></pan-bus>

<!-- This publishes theme changes -->
<pan-theme-toggle></pan-theme-toggle>

<!-- These subscribe and react to theme changes -->
<pan-card>I change themes automatically</pan-card>
<pan-data-table>Me too!</pan-data-table>
```

**This is web development as it should be.**

---

## 📦 Repositories

This is the **meta-repository** containing shared configuration. Each component is in its own repository:

| Repository | Description | Links |
|------------|-------------|-------|
| **[@larcjs/core](https://github.com/larcjs/core)** | Core PAN messaging bus | [NPM](https://npmjs.com/package/@larcjs/core) · [Docs](https://larcjs.github.io/site/) |
| **[@larcjs/core-types](https://github.com/larcjs/core-types)** | TypeScript types for core | [NPM](https://npmjs.com/package/@larcjs/core-types) |
| **[@larcjs/ui](https://github.com/larcjs/components)** | UI components library | [NPM](https://npmjs.com/package/@larcjs/components) · [Gallery](https://larcjs.github.io/site/gallery.html) |
| **[@larcjs/ui-types](https://github.com/larcjs/components-types)** | TypeScript types for UI components | [NPM](https://npmjs.com/package/@larcjs/components-types) |
| **[@larcjs/examples](https://github.com/larcjs/examples)** | Examples & demo apps | [Examples](https://larcjs.github.io/examples/) |
| **[@larcjs/site](https://github.com/larcjs/site)** | Documentation website | [Live Site](https://larcjs.github.io/site/) |
| **[@larcjs/devtools](https://github.com/larcjs/devtools)** | Chrome DevTools extension | [Docs](https://github.com/larcjs/devtools) |
| **[Playground](./playground/)** | Interactive component explorer | [Local](http://localhost:8080/playground/) · [Docs](./playground/README.md) |

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/larcjs/larc.git
cd larc

# Run setup script
./setup.sh         # Mac/Linux
# OR
setup.bat          # Windows

# Start a local server
python3 -m http.server 8000

# Open http://localhost:8000/test-config.html
```

### Option 2: Manual Setup

```bash
# Clone the repository
git clone https://github.com/larcjs/larc.git
cd larc

# Initialize and update submodules
git submodule init
git submodule update --recursive

# Start a local server
python3 -m http.server 8000
```

### Use the Configuration System

This repository contains the centralized configuration system for path management:

```html
<!-- Load config first -->
<script type="module" src="/larc-config.mjs"></script>

<!-- Load autoloader -->
<script type="module" src="/core/src/pan.mjs"></script>

<!-- Use components - they auto-load! -->
<pan-card>Hello World</pan-card>
```

📚 **Full documentation:** [`README-CONFIG.md`](./README-CONFIG.md)
🚀 **Quick start:** [`QUICK-START-CONFIG.md`](./QUICK-START-CONFIG.md)
🧪 **Test page:** [`test-config.html`](./test-config.html)

## 🎯 Key Features

- ✅ **Zero Build** - No webpack, no babel, just native ES modules
- ✅ **Auto-Loading** - Components load on-demand as they enter viewport
- ✅ **PAN Messaging** - DOM-native pub/sub for component communication
- ✅ **Config System** - Centralized path management with environment detection
- ✅ **CDN Ready** - Automatically switches dev/prod paths
- ✅ **TypeScript Support** - Optional type definitions for full IDE support
- ✅ **Interactive Playground** - Explore and test 49+ components visually

## 📖 Configuration System

The `larc-config.mjs` file provides:

- **Path Aliases**: `@larc/core`, `@larc/ui`, etc.
- **Environment Detection**: Auto-switches between local dev and CDN
- **Component Mappings**: Pre-configured paths for all components
- **Path Resolver**: Utilities for dynamic imports

```javascript
import { paths } from '/larc-config.mjs';

// Resolve any alias
const path = paths.resolve('@larc/core', 'components/pan-client.mjs');

// Import dynamically
const { PanClient } = await import(path);
```

## 🛠️ Development

### Local Development

```bash
# Serve from root with any static server
python3 -m http.server 8000
# or
npx serve
# or
php -S localhost:8000
```

All imports use relative paths in development.

### Production

In production, the config automatically uses CDN URLs:

```javascript
'@larc/core': 'https://unpkg.com/@larcjs/core@1.0.0/src'
'@larc/ui': 'https://unpkg.com/@larcjs/ui@1.0.0/src'
```

## 📂 Structure

```
larc-repos/                   # This repository (config)
├── larc-config.mjs          # Central configuration
├── README-CONFIG.md         # Config documentation
├── QUICK-START-CONFIG.md    # Quick reference
├── test-config.html         # Configuration test page
├── core/                    # @larcjs/core (separate repo)
├── core-types/              # @larcjs/core-types (separate repo)
├── ui/                      # @larcjs/ui (separate repo)
├── ui-types/                # @larcjs/ui-types (separate repo)
├── playground/              # Interactive component explorer
│   ├── components/          # Playground UI components
│   ├── component-registry.json  # Auto-generated metadata
│   └── scripts/             # Registry generator
├── examples/                # @larcjs/examples (separate repo)
├── site/                    # @larcjs/site (separate repo)
└── devtools/                # @larcjs/devtools (separate repo)
```

## 🤝 Contributing

Each repository has its own contribution guidelines:

- [core/CONTRIBUTING.md](https://github.com/larcjs/core/blob/main/CONTRIBUTING.md)
- [ui/CONTRIBUTING.md](https://github.com/larcjs/components/blob/main/CONTRIBUTING.md)
- [examples/CONTRIBUTING.md](https://github.com/larcjs/examples/blob/main/CONTRIBUTING.md)

## 📄 License

MIT License - see individual repositories for details.

## 🔗 Links

- 🌐 [Website](https://larcjs.github.io/site/)
- 📚 [Documentation](https://larcjs.github.io/site/docs/)
- 💬 [Discussions](https://github.com/larcjs/core/discussions)
- 🐛 [Issues](https://github.com/larcjs/core/issues)

---

**Built with ❤️ for the web platform**
