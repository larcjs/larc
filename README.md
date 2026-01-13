# LARC

**Lightweight Asynchronous Relay Core** - A minimal, message-based framework for building reactive web applications with zero dependencies.

[![npm version](https://img.shields.io/npm/v/@larcjs/core?label=%40larcjs%2Fcore&color=blue)](https://www.npmjs.com/package/@larcjs/core)
[![npm version](https://img.shields.io/npm/v/@larcjs/ui?label=%40larcjs%2Fcomponents&color=blue)](https://www.npmjs.com/package/@larcjs/ui)
[![npm downloads](https://img.shields.io/npm/dm/@larcjs/core?label=downloads)](https://www.npmjs.com/package/@larcjs/core)
[![Core Tests](https://github.com/larcjs/larc/actions/workflows/core-tests.yml/badge.svg)](https://github.com/larcjs/larc/actions/workflows/core-tests.yml)
[![UI Tests](https://github.com/larcjs/larc/actions/workflows/ui-tests.yml/badge.svg)](https://github.com/larcjs/larc/actions/workflows/ui-tests.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

## 📦 Using LARC in Your App

LARC provides a lightweight messaging bus and component library for building modern web applications. Perfect for microfront ends, event-driven architectures, and composable UIs.

### Installation

```bash
# Core messaging bus (required)
npm install @larcjs/core

# Optional: UI component library
npm install @larcjs/ui

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
- **`@larcjs/core`** (v3.0.1) - Full-featured messaging bus with routing and debug tools
- **`@larcjs/core-lite`** (v3.0.1) - Lightweight 9KB version (perfect for production) ⭐
- **`@larcjs/ui`** (v3.0.1) - UI component library

**Add-ons:**
- **`@larcjs/core-routing`** (v3.0.1) - Dynamic message routing (8KB)
- **`@larcjs/core-debug`** (v3.0.1) - Debug and tracing tools (3KB)

**Framework Integrations:**
- **`@larcjs/react-adapter`** - React hooks for PAN bus
- **`create-larc-app`** - CLI for scaffolding new projects

**TypeScript Support:**
- **`@larcjs/core-types`** - Type definitions for @larcjs/core
- **`@larcjs/ui-types`** - Type definitions for @larcjs/ui

### Documentation

- 📖 [Full Documentation](https://larcjs.com)
- 🚀 [Getting Started Guide](./docs/guides/QUICK-START-GUIDE.md)
- 📚 [API Reference](./docs/API-REFERENCE.md)
- 💡 [Examples](https://larcjs.com/examples/)
- ❓ [FAQ](./docs/guides/HN_FAQ.md)

---

## 🛠️ Developing LARC Locally

This section is for contributors who want to work on LARC itself.

### Prerequisites

- Node.js >= 18.0.0
- Git

### Setup

```bash
# Clone the repository
git clone https://github.com/larcjs/larc.git
cd larc

# Install all dependencies (npm workspaces)
npm install

# Or use pnpm if you prefer
pnpm install
```

### Repository Structure

```
larc/
├── packages/                   → Published packages (npm workspaces)
│   ├── core/                   → @larcjs/core
│   ├── components/             → @larcjs/ui
│   ├── core-lite/              → @larcjs/core-lite (9KB)
│   ├── core-routing/           → @larcjs/core-routing
│   ├── core-debug/             → @larcjs/core-debug
│   ├── core-types/             → TypeScript types
│   └── components-types/       → TypeScript types
├── apps/                       → Demo applications
├── examples/                   → Code examples
├── devtools/                   → Chrome DevTools extension
├── cli/                        → create-larc-app
├── react-adapter/              → React integration
├── registry/                   → Component registry
├── vscode-extension/           → VS Code extension
├── docs/                       → Documentation & guides
└── playground/                 → Interactive component explorer
```

### Development Workflows

#### Working on Core or Components

The core runtime and component library are in the packages directory:

```bash
# Work on core
cd packages/core
npm install
npm run build
npm test

# Work on components
cd packages/ui
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
npm run test --workspace @larcjs/ui
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
cd packages/core
npm publish

cd packages/ui
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

### Testing

**Current Status:**
- ✅ **@larcjs/core:** 261 tests passing (87 tests × 3 browsers)
- ✅ **@larcjs/ui:** 165 tests passing (55 tests × 3 browsers)

```bash
# Test everything
npm test

# Test specific packages
npm run test:core
npm run test:components

# Test with coverage
cd packages/core
npm run test:coverage
```

All UI components are tested end-to-end across Chromium, Firefox, and WebKit using Playwright.

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/YOUR-USERNAME/larc.git`
3. **Install** dependencies: `npm install`
4. **Create** a feature branch: `git checkout -b feature/my-feature`
5. **Make** your changes and add tests
6. **Test** your changes: `npm test`
7. **Commit** with clear messages
8. **Push** to your fork
9. **Submit** a pull request

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
| `npm run build:components` | Build only @larcjs/ui |
| `npm run test:core` | Test only @larcjs/core |
| `npm run dev:site` | Run documentation site |

For pnpm users, all scripts are available with the `pnpm:` prefix:
- `npm run pnpm:build`, `npm run pnpm:test`, etc.

## 📦 Published Packages

These packages are published to npm:

| Package | Version | Description |
|---------|---------|-------------|
| [@larcjs/core](https://npmjs.com/package/@larcjs/core) | 3.0.1 | Full-featured messaging bus |
| [@larcjs/core-lite](https://npmjs.com/package/@larcjs/core-lite) | 3.0.1 | Lightweight 9KB version ⭐ |
| [@larcjs/ui](https://npmjs.com/package/@larcjs/ui) | 3.0.1 | UI component library |
| [@larcjs/core-routing](https://npmjs.com/package/@larcjs/core-routing) | 3.0.1 | Message routing add-on |
| [@larcjs/core-debug](https://npmjs.com/package/@larcjs/core-debug) | 3.0.1 | Debug tools add-on |
| [@larcjs/core-types](https://npmjs.com/package/@larcjs/core-types) | 3.0.1 | TypeScript types |
| [@larcjs/ui-types](https://npmjs.com/package/@larcjs/ui-types) | 3.0.1 | TypeScript types |
| [@larcjs/react-adapter](https://npmjs.com/package/@larcjs/react-adapter) | 3.0.1 | React integration |
| [create-larc-app](https://npmjs.com/package/create-larc-app) | 3.0.1 | Project scaffolding CLI |

## 🔗 Links

- **Website**: [larcjs.com](https://larcjs.com)
- **Documentation**: [larcjs.com](https://larcjs.com/)
- **Examples**: [larcjs.com/examples](https://larcjs.com/examples/)
- **npm Organization**: [@larcjs](https://www.npmjs.com/org/larcjs)
- **GitHub**: [github.com/larcjs](https://github.com/larcjs)
- **Discord**: [Join our Discord](https://discord.gg/zjUPsWTu)

## 📄 License

MIT © LARC Contributors

---

**Note:** This repository uses npm workspaces for monorepo management. All packages are published under the `@larcjs` npm organization.

**Demo**: Check out the [Wiki Explorer](./docs/wiki-explorer.html) - a live demo showcasing LARC's tree navigation and markdown rendering components.
