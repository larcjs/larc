# LARC Development Monorepo

This repository contains the development assets for the LARC ecosystem:

- **Type definitions** (`@larcjs/core-types`, `@larcjs/components-types`)
- **Developer tools** (`@larcjs/devtools`)
- **Documentation** (docs/site/)
- **Examples** (examples/)

## 🏗️ Structure

```
larc/
├── packages/
│   ├── core-types/        → @larcjs/core-types (npm)
│   ├── components-types/  → @larcjs/components-types (npm)
│   └── devtools/          → @larcjs/devtools (Chrome extension)
├── docs/
│   └── site/              → larcjs.github.io
├── examples/              → Example applications
├── apps/                  → Demo applications
└── core/                  → @larcjs/core (submodule)
    ui/                    → @larcjs/components (submodule)
```

## 🚀 Quick Start

### For Contributors

```bash
# Clone with submodules
git clone --recurse-submodules https://github.com/larcjs/larc.git
cd larc

# Install dependencies (if pnpm is available)
pnpm install

# Or use npm
npm install
```

### For Core/Components Development

Core and components remain in their own repositories:

- **Core**: https://github.com/larcjs/core
- **Components**: https://github.com/larcjs/components

### Work on Types

```bash
cd packages/core-types
# Edit types...

# Publish when ready
pnpm publish
```

### Work on DevTools

```bash
cd packages/devtools
# Edit extension...
```

### Work on Documentation

```bash
cd docs/site
# Edit docs...
python3 -m http.server 8000
# Visit http://localhost:8000
```

### Work on Examples

```bash
cd examples
# Browse or create examples
```

## 📦 Published Packages

These packages are published to npm from this monorepo:

- `@larcjs/core-types` - TypeScript types for @larcjs/core
- `@larcjs/components-types` - TypeScript types for @larcjs/components
- `@larcjs/devtools` - Chrome DevTools extension

## 🔗 Related Repositories

The core products are maintained separately:

- **[@larcjs/core](https://github.com/larcjs/core)** - The PAN messaging bus
- **[@larcjs/components](https://github.com/larcjs/components)** - UI component library

## 📚 Documentation

- [Live Documentation](https://larcjs.github.io/larc/docs/site/)
- [Examples](https://larcjs.github.io/larc/examples/)
- [API Reference](https://larcjs.github.io/larc/docs/site/docs/API_REFERENCE.html)

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## 📄 License

MIT © LARC Contributors

---

**Note:** This repository was migrated from a submodules structure to a monorepo on 2025-12-06.
See `MIGRATION.md` for details.
