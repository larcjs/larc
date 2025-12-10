# Repository Structure Decision Tree

## 🤔 Quick Decision Guide

### Question 1: Should this be a separate repo?

```
Is it published to npm as a standalone package?
│
├─ YES → Ask Question 2
│
└─ NO → Consolidate into monorepo
```

### Question 2: Can users want it without other packages?

```
Can users reasonably want ONLY this package?
│
├─ YES → Keep as separate repo
│   Example: @larcjs/core (just the bus, no components)
│
└─ NO → Consolidate into monorepo
    Example: @larcjs/core-types (always used WITH core)
```

---

## 📋 Applied to Your Repos

### `core` - Keep Separate ✅
- ✅ Published to npm: `@larcjs/core`
- ✅ Users want it standalone: "Just the messaging bus"
- ✅ Independent value: 5KB, zero deps
- **Decision: Keep separate**

### `components` - Keep Separate ✅
- ✅ Published to npm: `@larcjs/ui`
- ✅ Users want it standalone: "Components without learning bus internals"
- ✅ Independent value: UI library
- ✅ Optional dependency: Works with core, but separate choice
- **Decision: Keep separate**

### `core-types` - Consolidate 🔄
- ✅ Published to npm: `@larcjs/core-types`
- ❌ Users want it standalone: No, only with `@larcjs/core`
- ❌ Independent value: Just types for core
- **Decision: Move to larc/packages/**

### `components-types` - Consolidate 🔄
- ✅ Published to npm: `@larcjs/ui-types`
- ❌ Users want it standalone: No, only with `@larcjs/ui`
- ❌ Independent value: Just types for components
- **Decision: Move to larc/packages/**

### `devtools` - Consolidate 🔄
- ⚠️ Published to Chrome Store: Maybe
- ❌ Users want it standalone: Only for development
- ❌ Independent value: Only useful with LARC
- **Decision: Move to larc/packages/**

### `examples` - Consolidate 🔄
- ❌ Published to npm: No
- ❌ Users want it standalone: No, examples of using core
- ❌ Independent value: Educational assets
- **Decision: Move to larc/examples/**

### `apps` - Consolidate 🔄
- ❌ Published to npm: No
- ❌ Users want it standalone: No, demos of LARC
- ❌ Independent value: Same as examples
- **Decision: Merge with examples → larc/examples/**

### `site` - Consolidate 🔄
- ❌ Published to npm: No
- ❌ Users want it standalone: No, docs for LARC
- ❌ Independent value: Documentation asset
- **Decision: Move to larc/docs/**

### `larc` (meta repo) - Transform 🔄
- ❌ Published to npm: No (workspace root)
- ❌ Users want it standalone: No, development hub
- ✅ Independent value: **Becomes the monorepo**
- **Decision: Transform into monorepo workspace**

### `.github` - Consolidate 🔄
- ❌ Published to npm: No
- ❌ Users want it standalone: No, org-level config
- ❌ Independent value: GitHub metadata
- **Decision: Move to larc/.github/**

---

## 🎯 Final Count

**Before:** 10 repositories
**After:** 3 repositories

```
✅ github.com/larcjs/core       (Standalone product)
✅ github.com/larcjs/components (Standalone product)
✅ github.com/larcjs/larc       (Development monorepo)
```

---

## 💭 Mental Model

### Think of it like this:

**Products (Separate Repos):**
- "Things users install"
- Clear, focused purpose
- Can be used alone

**Development Assets (Monorepo):**
- "Things that support the products"
- Types, docs, examples, tools
- Only useful in context of products

---

## 🏗️ Architecture Analogy

Think of it like a building:

```
┌─────────────────────────────────────────┐
│         LARC Ecosystem                  │
├─────────────────────────────────────────┤
│                                         │
│  🏢 Core Product (Separate Building)   │
│     @larcjs/core                        │
│     - Standalone                        │
│     - Minimal                           │
│     - Foundation                        │
│                                         │
│  🏢 Components Product (Separate)      │
│     @larcjs/ui                  │
│     - Standalone                        │
│     - Optional add-on                   │
│     - Builds on core                    │
│                                         │
│  🏗️  Development Complex (One Campus)  │
│     larc/ (monorepo)                    │
│     ├── Types (blueprints)              │
│     ├── Docs (manuals)                  │
│     ├── Examples (showroom)             │
│     └── Tools (workshop)                │
│                                         │
└─────────────────────────────────────────┘
```

**You wouldn't build a separate building for:**
- The blueprint storage (types)
- The instruction manuals (docs)
- The showroom (examples)
- The tool shed (devtools)

**They all belong on the same campus!**

---

## ✅ Your Reasoning Applied

> "I want to keep all the individual ui components separate from the core larc messaging bus code simply because I don't want to force my web components down peoples throats if all they're looking for is a well defined, page-level communications bus."

**This is architecturally correct!**

```
User A: "I just want the message bus"
→ npm install @larcjs/core
→ Gets: 5KB, pure messaging

User B: "I want the bus + components"
→ npm install @larcjs/core @larcjs/ui
→ Gets: Bus + UI library

User C: "I already have React, just want the bus"
→ npm install @larcjs/core
→ Uses bus with React components
```

**Perfect separation of concerns!**

---

## 🚫 What NOT to Do

### ❌ Bad: Monolith Package
```
@larcjs/everything
├── core (forced on everyone)
└── components (forced on everyone)
```
**Problem:** Can't use bus without components

### ❌ Bad: Too Granular
```
@larcjs/core
@larcjs/core-types
@larcjs/core-tests
@larcjs/core-examples
@larcjs/core-docs
... (20 repos)
```
**Problem:** Management nightmare

### ✅ Good: Balanced
```
Repos:
  @larcjs/core (product)
  @larcjs/ui (product)
  larc (development assets)

User installs:
  npm install @larcjs/core (minimal)
  npm install @larcjs/ui (optional)
```
**Result:** Clean, simple, flexible

---

## 🎯 Bottom Line

**Your instinct is right:** Keep core and components separate.

**The fix:** Consolidate everything else into one development monorepo.

**Result:**
- Users get clean choices
- Developers get simple workflow
- Maintainers get fewer headaches

---

## 🚀 Next Step

Run this to see it in action:

```bash
./test-monorepo.sh
```

Or read the full plan:
```bash
cat RECOMMENDED-CONSOLIDATION.md
```

---

*"Separate the products. Unify the process."*
