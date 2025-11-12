# LARC - Lightweight Asynchronous Relay Core

**Zero-build, browser-native web component framework with PAN (Page Area Network) messaging.**

## 📦 Repositories

This is the **meta-repository** containing shared configuration. Each component is in its own repository:

| Repository | Description | Links |
|------------|-------------|-------|
| **[@larcjs/core](https://github.com/larcjs/core)** | Core PAN messaging bus | [NPM](https://npmjs.com/package/@larcjs/core) · [Docs](https://larcjs.github.io/site/) |
| **[@larcjs/components](https://github.com/larcjs/components)** | UI components library | [NPM](https://npmjs.com/package/@larcjs/components) · [Gallery](https://larcjs.github.io/site/gallery.html) |
| **[@larcjs/examples](https://github.com/larcjs/examples)** | Examples & demo apps | [Examples](https://larcjs.github.io/examples/) |
| **[@larcjs/site](https://github.com/larcjs/site)** | Documentation website | [Live Site](https://larcjs.github.io/site/) |
| **[@larcjs/devtools](https://github.com/larcjs/devtools)** | Chrome DevTools extension | [Docs](https://github.com/larcjs/devtools) |

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

## 📖 Configuration System

The `larc-config.mjs` file provides:

- **Path Aliases**: `@larc/core`, `@larc/components`, etc.
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
'@larc/components': 'https://unpkg.com/@larcjs/components@1.0.0/src'
```

## 📂 Structure

```
larc-repos/                   # This repository (config)
├── larc-config.mjs          # Central configuration
├── README-CONFIG.md         # Config documentation
├── QUICK-START-CONFIG.md    # Quick reference
├── test-config.html         # Configuration test page
├── core/                    # @larcjs/core (separate repo)
├── components/              # @larcjs/components (separate repo)
├── examples/                # @larcjs/examples (separate repo)
├── site/                    # @larcjs/site (separate repo)
└── devtools/                # @larcjs/devtools (separate repo)
```

## 🤝 Contributing

Each repository has its own contribution guidelines:

- [core/CONTRIBUTING.md](https://github.com/larcjs/core/blob/main/CONTRIBUTING.md)
- [components/CONTRIBUTING.md](https://github.com/larcjs/components/blob/main/CONTRIBUTING.md)
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
