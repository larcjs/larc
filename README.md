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

**The missing 20% that makes Web Components ready for real applications.**

Web standards give you 80% of what you need (Custom Elements, Shadow DOM, ES Modules). **PAN provides the missing 20%** - component coordination, auto-loading, and state management.

**The result? Reduce framework overhead by 60%+:**

- ✨ **Standards-based** - Native Web Components, ES Modules, no proprietary tooling
- 🎯 **Complement frameworks** - Keep React for complex UIs, use LARC for cards, modals, tables, navigation
- 🔌 **Loosely coupled** - PAN message bus solves the Web Component "silo problem"
- 🌐 **True interoperability** - Mix React, Vue, and LARC components on the same page
- 🚫 **No lock-in** - Use one component or all of them, mix with anything
- 💾 **No build step** - Write code, refresh browser, see changes instantly
- ❤️ **Built for pragmatists** - Solve real problems without dogma

**Without PAN, Web Components are silos.** Every component needs custom integration code, negating reusability. PAN provides standardized messaging so components coordinate without knowing about each other.

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

📚 **Full documentation:** [`README-CONFIG.md`](./docs/README-CONFIG.md)
🚀 **Quick start:** [`QUICK-START-CONFIG.md`](./docs/QUICK-START-CONFIG.md)
🧪 **Test page:** [`test-config.html`](./test-config.html)

## 🎯 Key Features

- ✅ **Zero Build** - No webpack, no babel, just native ES modules
- ✅ **Auto-Loading** - Components load on-demand as they enter viewport
- ✅ **PAN Messaging** - DOM-native pub/sub for component communication
- ✅ **Advanced State Management** - Cross-tab sync, offline-first, persistence, validation, undo/redo
- ✅ **Framework Friendly** - Use with React, Vue, Angular - reduce your bundle by 60%+
- ✅ **Config System** - Centralized path management with environment detection
- ✅ **CDN Ready** - Automatically switches dev/prod paths
- ✅ **TypeScript Support** - Optional type definitions for full IDE support
- ✅ **Interactive Playground** - Explore and test 57+ components visually
- ✅ **Wide Browser Support** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ ([compatibility matrix](./docs/BROWSER-COMPATIBILITY.md))

## 💡 Use Cases

**Perfect for:**
- **Design Systems** - Build once, use across React, Vue, Angular, and vanilla JS projects
- **Reducing Bundle Size** - Replace heavy component libraries with lightweight LARC components
- **Micro-frontends** - Different teams/frameworks coordinating via PAN messages
- **Progressive Enhancement** - Layer interactive features onto existing pages
- **Legacy Modernization** - Incrementally upgrade without full rewrites

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

## 🔄 State Management

LARC includes a comprehensive suite of state management components for building modern, offline-first applications:

### Core Components

- **`<pan-state-sync>`** - Cross-tab state synchronization via BroadcastChannel
- **`<pan-computed-state>`** - Derived state with automatic dependency tracking
- **`<pan-offline-sync>`** - Offline-first with automatic queue and sync
- **`<pan-persistence-strategy>`** - Declarative persistence routing (memory, localStorage, sessionStorage, IndexedDB)
- **`<pan-schema-validator>`** - Runtime JSON Schema validation (no build tools)
- **`<pan-undo-redo>`** - Time-travel debugging with history management
- **Enhanced `<pan-inspector>`** - State tree visualization, metrics, and debugging

### Features

✨ **Cross-Tab Sync** - State stays synchronized across browser tabs automatically
📡 **Offline-First** - Queue mutations when offline, sync when reconnected
💾 **Flexible Persistence** - Route state to different storage backends with TTL support
✓ **Runtime Validation** - JSON Schema validation without build tooling
↶↷ **Undo/Redo** - Built-in time-travel debugging
🎯 **Zero Build** - Everything works directly in browsers

### Quick Example

```html
<script type="module" src="/core/src/pan.mjs"></script>

<pan-bus></pan-bus>

<!-- Persistence -->
<pan-persistence-strategy auto-hydrate>
  <strategy topics="todos.*" storage="localStorage"></strategy>
</pan-persistence-strategy>

<!-- Cross-tab sync -->
<pan-state-sync channel="myapp" topics="todos.*"></pan-state-sync>

<!-- Offline support -->
<pan-offline-sync topics="todos.*" endpoints='{"todos.*": "/api/todos"}'></pan-offline-sync>

<!-- Computed state -->
<pan-computed-state sources="todos.list" output="todos.stats" retain>
  <script>
    (todos) => ({
      total: todos.length,
      completed: todos.filter(t => t.completed).length
    })
  </script>
</pan-computed-state>

<!-- Undo/redo -->
<pan-undo-redo topics="todos.*" max-history="50" channel="history"></pan-undo-redo>
```

### Documentation

📖 **[State Management Patterns Guide](./STATE_MANAGEMENT_README.md)** - Complete documentation and patterns
📘 **[API Reference](./site/docs/state-management-api.md)** - Detailed API documentation
🎮 **[Live Demo](./examples/offline-todo-app.html)** - Offline-first todo app with all features

## 📂 Structure

```
larc-repos/                   # This repository (config)
├── larc-config.mjs          # Central configuration
├── test-config.html         # Configuration test page
├── docs/                    # Documentation
│   ├── README-CONFIG.md     # Config documentation
│   ├── QUICK-START-CONFIG.md # Quick reference
│   └── ...                  # Other docs
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
