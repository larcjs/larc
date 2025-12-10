# LARC — Lightweight Asynchronous Relay Core

[![Version](https://img.shields.io/badge/version-1.1.1-blue.svg)](https://github.com/larcjs/core)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/larcjs/core/blob/main/LICENSE)
[![Status](https://img.shields.io/badge/status-production--ready-brightgreen.svg)](https://github.com/larcjs/core)

> **Build loosely-coupled, event-driven web applications** with zero build tooling

LARC implements the PAN (Page Area Network) messaging protocol — a framework-agnostic message bus that enables seamless communication between components, iframes, workers, and browser tabs.

---

## 🌟 Key Features

- 🚀 **Zero Build Required** — Drop-in `<pan-bus>` element, no bundler needed
- 🔌 **Framework Complement** — Reduce React/Vue bundles by 60%+, keep frameworks for complex UIs
- 🎯 **Lightweight** — ~5KB core, components load on demand
- ⚡ **High Performance** — 300k+ messages/second, zero memory leaks
- 🔒 **Security Audited** — Production-ready with comprehensive security review
- 🛠️ **DevTools** — Chrome extension for debugging message flows

---

## 📦 Packages

| Package | Description | Version | Links |
|---------|-------------|---------|-------|
| **[@larcjs/core](https://github.com/larcjs/core)** | Core PAN messaging bus | 1.1.1 | [NPM](https://npmjs.com/package/@larcjs/core) · [Docs](https://larcjs.github.io/site/) |
| **[@larcjs/ui](https://github.com/larcjs/components)** | UI components library | 1.1.0 | [NPM](https://npmjs.com/package/@larcjs/ui) · [Gallery](https://larcjs.github.io/site/gallery.html) |
| **[@larcjs/devtools](https://github.com/larcjs/devtools)** | Chrome DevTools extension | 1.0.0 | [Chrome Store](https://chrome.google.com/webstore) · [Docs](https://github.com/larcjs/devtools) |
| **[@larcjs/examples](https://github.com/larcjs/examples)** | Examples & demo apps | 1.0.1 | [Examples](https://larcjs.github.io/examples/) · [Apps](https://github.com/larcjs/examples/tree/main/apps) |
| **[@larcjs/site](https://github.com/larcjs/site)** | Documentation website | 1.0.0 | [Live Site](https://larcjs.github.io/site/) |

---

## ⚡ Quick Start

### CDN (No Installation)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script type="module" src="https://unpkg.com/@larcjs/core@2.0.0/src/pan.js"></script>
</head>
<body>
  <!-- Components load automatically -->
  <pan-data-table resource="users" columns='["id","name","email"]'></pan-data-table>
  <pan-inspector></pan-inspector>
</body>
</html>
```

### NPM Installation

```bash
npm install @larcjs/core @larcjs/ui
```

```javascript
import '@larcjs/core';
import '@larcjs/ui/pan-data-table';

// Use in your HTML
```

---

## 🎯 Use Cases

### Microservices & Microfrontends
Decouple independent UI components that communicate via messages instead of direct dependencies.

### Real-Time Collaboration
Sync state across tabs, iframes, and WebSockets with built-in cross-context messaging.

### Web Workers Integration
Offload heavy computation to workers while maintaining clean message contracts.

### Progressive Enhancement
Add interactive components to existing pages without framework rewrites.

---

## 📚 Documentation

- **[Getting Started](https://larcjs.github.io/site/)** — Quick introduction
- **[API Reference](https://larcjs.github.io/site/docs/API_REFERENCE.html)** — Complete API docs
- **[Examples](https://larcjs.github.io/examples/)** — 30+ progressive examples
- **[Component Gallery](https://larcjs.github.io/site/gallery.html)** — Visual showcase
- **[Architecture Guide](https://larcjs.github.io/site/docs/LARC_SPEC.v0.html)** — System design

---

## 🔍 Example: Simple Todo App

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="https://unpkg.com/@larcjs/core/pan.js"></script>
</head>
<body>
  <h1>Todos</h1>
  <todo-list></todo-list>
  <todo-provider></todo-provider>
  <pan-inspector></pan-inspector>

  <script>
    // Components communicate via PAN messages
    // No direct coupling between todo-list and todo-provider
  </script>
</body>
</html>
```

The todo list publishes `todo.add` messages. The provider listens and updates state. Zero coupling!

---

## 🛠️ Development

### Clone a Package

```bash
git clone https://github.com/larcjs/core.git
cd core
npm install
npm test
```

### Link Packages Locally

```bash
cd core && npm link
cd ../components && npm link @larcjs/core
```

---

## 🌐 Architecture

```
┌─────────────────────────────────────────┐
│            Application                  │
├──────────┬──────────┬──────────────────┤
│ Component│ Component│    Component     │
│    A     │    B     │       C          │
└────┬─────┴────┬─────┴────┬────────────┘
     │          │          │
     └──────────┼──────────┘
                │
         ┌──────▼──────┐
         │  <pan-bus>  │  ← Message Hub
         └──────┬──────┘
                │
     ┌──────────┼──────────┐
     │          │          │
┌────▼───┐  ┌──▼───┐  ┌───▼────┐
│ Worker │  │iframe│  │ Tabs   │
└────────┘  └──────┘  └────────┘
```

---

## 🤝 Contributing

We welcome contributions! Please see:
- [Contributing Guide](https://github.com/larcjs/.github/blob/main/CONTRIBUTING.md)
- [Code of Conduct](https://github.com/larcjs/.github/blob/main/CODE_OF_CONDUCT.md)

---

## 📊 Status

| Package | Build | Tests | Coverage | Security |
|---------|-------|-------|----------|----------|
| core | ✅ | ✅ | 85%+ | ✅ |
| components | ✅ | ✅ | 80%+ | ✅ |
| devtools | ✅ | ✅ | - | ✅ |
| examples | ✅ | - | - | ✅ |

---

## 📄 License

MIT © Chris Robison

All packages are licensed under the MIT License. See individual repositories for details.

---

## 🆘 Support

- 📖 [Documentation](https://larcjs.github.io/site/)
- 💬 [Discussions](https://github.com/orgs/larcjs/discussions)
- 🐛 [Issue Tracker](https://github.com/larcjs/core/issues)

---

## 🎉 Featured Apps

Check out full-featured applications built with LARC:

- **[Invoice Studio](https://github.com/larcjs/examples/tree/main/apps/invoice-studio)** — Professional invoice creation
- **[Contact Manager](https://github.com/larcjs/examples/tree/main/apps/contact-manager)** — CRUD with data grid
- **[Data Browser](https://github.com/larcjs/examples/tree/main/apps/data-browser)** — Generic data exploration
- **[Markdown Notes](https://github.com/larcjs/examples/tree/main/apps/markdown-notes)** — Note-taking with live preview

---

**Build better web apps with LARC!** 🚀
