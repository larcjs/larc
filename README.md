# LARC

**Lightweight Asynchronous Relay Core** - A minimal, message-based framework for building reactive web applications with zero dependencies.

## 📦 Using LARC in Your App

LARC provides a lightweight messaging bus and component library for building modern web applications. Perfect for microfront ends, event-driven architectures, and composable UIs.

### Installation

```bash
# Core messaging bus (required)
npm install @larcjs/core

# Optional: UI component library
npm install @larcjs/components

# Or start with the lightweight version (9KB)
npm install @larcjs/core-lite
```

### Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
</head>
<body>
  <!-- Include the PAN bus -->
  <pan-bus debug="true"></pan-bus>

  <!-- Your content here -->
  <div id="app"></div>

  <script type="module">
    import { PanClient } from '@larcjs/core';

    const client = new PanClient();

    // Subscribe to messages
    client.subscribe('user.login', (msg) => {
      console.log('User logged in:', msg.data);
    });

    // Publish messages
    client.publish({
      topic: 'user.login',
      data: { username: 'alice', timestamp: Date.now() }
    });
  </script>
</body>
</html>
```

### Package Overview

**Core Packages:**
- **`@larcjs/core`** (v1.1.2) - Full-featured messaging bus with routing and debug tools
- **`@larcjs/core-lite`** (v1.2.1) - Lightweight 9KB version (perfect for production) ⭐
- **`@larcjs/components`** (v1.1.2) - UI component library

**Add-ons:**
- **`@larcjs/core-routing`** (v1.0.1) - Dynamic message routing (8KB)
- **`@larcjs/core-debug`** (v1.0.1) - Debug and tracing tools (3KB)

**Framework Integrations:**
- **`@larcjs/react-adapter`** - React hooks for PAN bus
- **`create-larc-app`** - CLI for scaffolding new projects

**TypeScript Support:**
- **`@larcjs/core-types`** - Type definitions for @larcjs/core
- **`@larcjs/components-types`** - Type definitions for @larcjs/components

### Documentation

- 📖 [Full Documentation](https://larcjs.com)
- 🚀 [Getting Started Guide](./docs/guides/QUICK-START-GUIDE.md)
- 📚 [API Reference](./docs/API-REFERENCE.md)
- 💡 [Examples](https://larcjs.github.io/larc/examples/)
- ❓ [FAQ](./docs/guides/HN_FAQ.md)

---

## 🛠️ Developing LARC Locally

This section is for contributors who want to work on LARC itself.

### Prerequisites

- Node.js >= 18.0.0
- Git

### Setup

```bash
# Clone the repository with submodules
git clone --recurse-submodules https://github.com/larcjs/larc.git
cd larc

# Install all dependencies (npm workspaces)
npm install

# Or use pnpm if you prefer
pnpm install
```

### Repository Structure

```
larc/
├── core/                       → @larcjs/core (submodule)
├── ui/                         → @larcjs/components (submodule)
├── packages/                   → Published packages
│   ├── core-lite/              → @larcjs/core-lite (9KB)
│   ├── core-routing/           → @larcjs/core-routing
│   ├── core-debug/             → @larcjs/core-debug
│   ├── core-types/             → TypeScript types
│   └── components-types/       → TypeScript types
├── cli/                        → create-larc-app
├── react-adapter/              → React integration
├── registry/                   → Component registry
├── site/                       → Documentation website
├── examples/                   → Example applications
├── devtools/                   → Chrome DevTools extension
└── vscode-extension/           → VS Code extension
```

### Development Workflows

#### Working on Core or Components

The core runtime and component library are maintained as separate submodules:

```bash
# Work on core
cd core
npm install
npm run build
npm test

# Work on components
cd ui
npm install
npm run build
npm test
```

#### Working on Packages

```bash
# Work on core-lite
cd packages/core-lite
# Make changes...
npm run build:minify

# Work on types
cd packages/core-types
# Edit type definitions...
```

#### Using npm Workspaces

Run commands across all workspaces:

```bash
# Build all packages
npm run build

# Test all packages
npm run test

# Run specific workspace
npm run build --workspace @larcjs/core
npm run test --workspace @larcjs/components
npm run dev --workspace @larcjs/site
```

#### Using pnpm (Alternative)

If you prefer pnpm, all the original scripts are preserved:

```bash
# Build all packages
pnpm run pnpm:build

# Test all packages
pnpm run pnpm:test

# Dev mode (parallel)
pnpm run pnpm:dev
```

### Publishing Packages

Packages are published to npm from the monorepo:

```bash
# Publish a specific package
cd packages/core-lite
npm publish

# Publish core or components
cd core
npm publish

cd ui
npm publish
```

### Running Examples

```bash
# Serve examples locally
cd examples
python3 -m http.server 8888
# Visit http://localhost:8888
```

### Building Documentation

```bash
# Build and serve docs
npm run dev --workspace @larcjs/site

# Or manually
cd site
npm run build
npm run serve
```

### Submodule Management

```bash
# Update all submodules
git submodule update --remote --merge

# Update specific submodule
git submodule update --remote --merge core
git submodule update --remote --merge ui
```

### Testing

```bash
# Test everything
npm test

# Test specific packages
npm run test:core
npm run test:components

# Test with coverage
cd core
npm run test:coverage
```

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork with submodules: `git clone --recurse-submodules`
3. **Create** a feature branch: `git checkout -b feature/my-feature`
4. **Make** your changes and add tests
5. **Test** your changes: `npm test`
6. **Commit** with clear messages
7. **Push** to your fork
8. **Submit** a pull request

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Build all workspace packages |
| `npm run test` | Run tests across all packages |
| `npm run dev` | Start development mode |
| `npm run lint` | Lint all packages |
| `npm run serve` | Serve examples on port 8000 |
| `npm run build:core` | Build only @larcjs/core |
| `npm run build:components` | Build only @larcjs/components |
| `npm run test:core` | Test only @larcjs/core |
| `npm run dev:site` | Run documentation site |

For pnpm users, all scripts are available with the `pnpm:` prefix:
- `npm run pnpm:build`, `npm run pnpm:test`, etc.

## 📦 Published Packages

These packages are published to npm:

| Package | Version | Description |
|---------|---------|-------------|
| [@larcjs/core](https://npmjs.com/package/@larcjs/core) | 1.1.2 | Full-featured messaging bus |
| [@larcjs/core-lite](https://npmjs.com/package/@larcjs/core-lite) | 1.2.1 | Lightweight 9KB version ⭐ |
| [@larcjs/components](https://npmjs.com/package/@larcjs/components) | 1.1.2 | UI component library |
| [@larcjs/core-routing](https://npmjs.com/package/@larcjs/core-routing) | 1.0.1 | Message routing add-on |
| [@larcjs/core-debug](https://npmjs.com/package/@larcjs/core-debug) | 1.0.1 | Debug tools add-on |
| [@larcjs/core-types](https://npmjs.com/package/@larcjs/core-types) | 1.1.2 | TypeScript types |
| [@larcjs/components-types](https://npmjs.com/package/@larcjs/components-types) | 1.0.3 | TypeScript types |
| [@larcjs/react-adapter](https://npmjs.com/package/@larcjs/react-adapter) | 1.0.0 | React integration |
| [create-larc-app](https://npmjs.com/package/create-larc-app) | 1.0.0 | Project scaffolding CLI |

## 🔗 Links

- **Website**: [larcjs.com](https://larcjs.com)
- **Documentation**: [larcjs.github.io/larc](https://larcjs.github.io/larc/docs/site/)
- **Examples**: [larcjs.github.io/larc/examples](https://larcjs.github.io/larc/examples/)
- **npm Organization**: [@larcjs](https://www.npmjs.com/org/larcjs)
- **GitHub**: [github.com/larcjs](https://github.com/larcjs)

## 📄 License

MIT © LARC Contributors

---

**Note:** This repository was migrated from a submodules structure to a hybrid monorepo on 2025-12-06.
See [docs/migration/MIGRATION-COMPLETE.md](./docs/migration/MIGRATION-COMPLETE.md) for migration details.
