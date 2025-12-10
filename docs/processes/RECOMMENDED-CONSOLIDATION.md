# Recommended Repository Consolidation for LARC

## 🎯 Goal
Simplify the LARC ecosystem while maintaining architectural clarity: keep `@larcjs/core` and `@larcjs/components` as separate, focused packages.

## ✅ Your Reasoning is Sound

**Keep `core` and `components` separate because:**
1. ✅ Core is standalone - users shouldn't need components to use the bus
2. ✅ Different audiences - bus users vs. component library users
3. ✅ Independent versioning - core is stable, components evolve faster
4. ✅ Clear value proposition - "Use just the bus, or add components"
5. ✅ Smaller installs - `npm install @larcjs/core` stays minimal

This is architecturally correct. The problem is the **10 OTHER repos** around them.

---

## 📊 Current State (10 Repos)

| Repo | Purpose | Action |
|------|---------|--------|
| `core` | PAN messaging bus | ✅ **Keep separate** |
| `components` | 57 UI components | ✅ **Keep separate** |
| `core-types` | TS types for core | 🔄 **Consolidate** |
| `components-types` | TS types for components | 🔄 **Consolidate** |
| `site` | Documentation | 🔄 **Consolidate** |
| `examples` | Demo apps | 🔄 **Consolidate** |
| `apps` | More demo apps | 🔄 **Consolidate** (merge with examples) |
| `devtools` | Chrome extension | 🔄 **Consolidate** |
| `larc` | Meta repo | 🔄 **Become monorepo** |
| `.github` | Org files | 🔄 **Consolidate** |

---

## 🎨 Proposed Architecture

### Final Structure: **3 Repositories**

```
┌─────────────────────────────────────────────────────────┐
│  github.com/larcjs/core                                 │
│  ├── src/                  (PAN bus implementation)     │
│  ├── tests/                (261 tests)                  │
│  ├── package.json          (@larcjs/core v1.1.1)       │
│  └── README.md             (Core-focused docs)          │
│                                                          │
│  Published: @larcjs/core                                │
│  Size: 40KB minified (128KB unminified), Zero dependencies │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  github.com/larcjs/components                           │
│  ├── src/                  (57 components)              │
│  ├── tests/                                             │
│  ├── package.json          (@larcjs/components v1.1.0) │
│  └── README.md             (Component library docs)     │
│                                                          │
│  Published: @larcjs/components                          │
│  Peer Dep: @larcjs/core ^1.1.0                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  github.com/larcjs/larc (Monorepo - Development Hub)    │
│  ├── packages/                                          │
│  │   ├── core-types/      (@larcjs/core-types)         │
│  │   ├── components-types/(@larcjs/components-types)   │
│  │   └── devtools/        (@larcjs/devtools)           │
│  ├── docs/                                              │
│  │   ├── site/            (Documentation website)       │
│  │   ├── guides/          (Tutorials, how-tos)          │
│  │   └── api/             (API reference)               │
│  ├── examples/                                          │
│  │   ├── basic/           (Simple examples)             │
│  │   ├── contact-manager/ (Full app)                    │
│  │   ├── invoice-studio/  (Full app)                    │
│  │   ├── hybrid-dashboard/(React+Vue+LARC)             │
│  │   ├── offline-todo/    (State management)            │
│  │   └── ...                                            │
│  ├── .github/             (Workflows, templates)        │
│  ├── package.json         (Workspace root)              │
│  └── pnpm-workspace.yaml                                │
│                                                          │
│  Not published as a whole, but packages/* are           │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Package Publishing Strategy

### Published to npm

| Package | Repo | Purpose |
|---------|------|---------|
| `@larcjs/core` | `core` | Standalone messaging bus |
| `@larcjs/components` | `components` | UI component library |
| `@larcjs/core-types` | `larc/packages/core-types` | TypeScript types for core |
| `@larcjs/components-types` | `larc/packages/components-types` | TypeScript types for components |
| `@larcjs/devtools` | `larc/packages/devtools` | Chrome extension (maybe) |

### Not Published (Development Assets)

- Examples (live on GitHub Pages)
- Docs site (live on GitHub Pages)
- Workspace config

---

## 🚀 Developer Workflows

### For Core Development

```bash
# Clone core repo
git clone https://github.com/larcjs/core.git
cd core
npm install
npm test
npm run build

# Publish
npm version patch
npm publish

# Update types
cd ../larc/packages/core-types
# Update types to match
npm version patch
npm publish
```

### For Components Development

```bash
# Clone components repo
git clone https://github.com/larcjs/components.git
cd components
npm install
npm link @larcjs/core  # or use published version
npm test
npm run build

# Publish
npm version minor
npm publish

# Update types
cd ../larc/packages/components-types
# Update types
npm version minor
npm publish
```

### For Examples/Docs (Most Common)

```bash
# Clone monorepo
git clone https://github.com/larcjs/larc.git
cd larc
pnpm install  # Installs all packages

# Work on examples
cd examples/contact-manager
# edit files...
# Uses published @larcjs/core and @larcjs/components

# Work on docs
cd docs/site
# edit docs...

# Work on types
cd packages/core-types
# edit types...

# Single commit for related changes
git add .
git commit -m "Add example and docs for new feature"
git push
```

---

## 🔄 Migration Steps

### Phase 1: Consolidate Examples (2 hours)

**Merge `apps` into `examples`:**

```bash
cd larc
mkdir -p examples

# Move from apps repo
git clone https://github.com/larcjs/apps.git temp-apps
mv temp-apps/contact-manager examples/
mv temp-apps/invoice-studio examples/
mv temp-apps/markdown-notes examples/
mv temp-apps/data-browser examples/
rm -rf temp-apps

# Merge with existing examples
git clone https://github.com/larcjs/examples.git temp-examples
mv temp-examples/* examples/
rm -rf temp-examples

# Organize
examples/
├── README.md
├── basic/              (Simple, quick demos)
├── intermediate/       (Real features)
└── advanced/           (Full applications)
    ├── contact-manager/
    ├── invoice-studio/
    ├── hybrid-dashboard/
    └── ...

git add examples
git commit -m "Consolidate all examples"
```

### Phase 2: Move Types to Monorepo (1 hour)

```bash
cd larc
mkdir -p packages

# Move core-types
git clone https://github.com/larcjs/core-types.git packages/core-types
rm -rf packages/core-types/.git

# Move components-types
git clone https://github.com/larcjs/components-types.git packages/components-types
rm -rf packages/components-types/.git

# Update package.json to reference published packages
# packages/core-types/package.json
{
  "name": "@larcjs/core-types",
  "version": "1.1.1",
  "peerDependencies": {
    "@larcjs/core": "^1.1.0"
  }
}

git add packages
git commit -m "Move TypeScript types to monorepo"
```

### Phase 3: Move Documentation (1 hour)

```bash
cd larc
mkdir -p docs

# Move site
git clone https://github.com/larcjs/site.git docs/site
rm -rf docs/site/.git

git add docs
git commit -m "Move documentation to monorepo"
```

### Phase 4: Move DevTools (30 min)

```bash
cd larc/packages

git clone https://github.com/larcjs/devtools.git devtools
rm -rf devtools/.git

git add devtools
git commit -m "Move DevTools to monorepo"
```

### Phase 5: Set Up Workspaces (30 min)

```bash
# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
EOF

# Create root package.json
cat > package.json << EOF
{
  "name": "larc",
  "version": "1.0.0",
  "private": true,
  "description": "LARC Development Monorepo",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "dev": "pnpm -r --parallel dev",
    "clean": "pnpm -r clean",
    "publish-types": "pnpm --filter '@larcjs/core-types' publish && pnpm --filter '@larcjs/components-types' publish"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0"
  }
}
EOF

pnpm install
git add .
git commit -m "Set up pnpm workspaces"
```

### Phase 6: Archive Old Repos (15 min)

**Don't delete! Archive for history:**

```bash
# On GitHub, go to each repo:
# Settings → Archive this repository

Archive these:
- larcjs/apps
- larcjs/examples
- larcjs/site
- larcjs/core-types
- larcjs/components-types
- larcjs/devtools

Add README to each:
"This repository has been consolidated into https://github.com/larcjs/larc
See [path] for the code."
```

---

## 📋 Final Repository Structure

### `github.com/larcjs/core` (Active)
```
core/
├── src/
│   ├── pan.mjs
│   ├── components/
│   └── index.js
├── tests/
├── package.json        (@larcjs/core)
└── README.md
```

### `github.com/larcjs/components` (Active)
```
components/
├── src/
│   ├── components/
│   ├── styles/
│   └── index.js
├── tests/
├── package.json        (@larcjs/components)
└── README.md
```

### `github.com/larcjs/larc` (Active - Monorepo)
```
larc/
├── packages/
│   ├── core-types/
│   │   ├── index.d.ts
│   │   └── package.json    (@larcjs/core-types)
│   ├── components-types/
│   │   ├── index.d.ts
│   │   └── package.json    (@larcjs/components-types)
│   └── devtools/
│       ├── src/
│       ├── manifest.json
│       └── package.json    (@larcjs/devtools)
├── examples/
│   ├── README.md
│   ├── basic/
│   │   ├── hello-world.html
│   │   ├── message-passing.html
│   │   └── ...
│   ├── intermediate/
│   │   ├── form-validation.html
│   │   ├── tabs-routing.html
│   │   └── ...
│   └── advanced/
│       ├── contact-manager/
│       ├── invoice-studio/
│       ├── hybrid-dashboard/
│       └── offline-todo/
├── docs/
│   └── site/
│       ├── index.html
│       ├── docs/
│       ├── guides/
│       └── api/
├── .github/
│   ├── workflows/
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
├── package.json
├── pnpm-workspace.yaml
├── README.md
└── CONTRIBUTING.md
```

---

## 🌐 URLs After Consolidation

### Package Installs (Unchanged)
```bash
npm install @larcjs/core
npm install @larcjs/components
npm install -D @larcjs/core-types
npm install -D @larcjs/components-types
```

### GitHub URLs (Simplified)

**Source code:**
- https://github.com/larcjs/core
- https://github.com/larcjs/components
- https://github.com/larcjs/larc

**Documentation:**
- https://larcjs.github.io/larc/docs/
- https://larcjs.github.io/larc/examples/

**Examples:**
- https://larcjs.github.io/larc/examples/basic/
- https://larcjs.github.io/larc/examples/advanced/contact-manager/

---

## 💡 Benefits of This Structure

### For Core/Components Users (External)
- ✅ Clear separation: bus vs. components
- ✅ Minimal installs
- ✅ Independent versioning
- ✅ **No change to their workflow**

### For Contributors (Internal)
- ✅ Fewer repos to clone (3 vs 10)
- ✅ Examples all in one place
- ✅ Types updated alongside features
- ✅ Docs co-located with examples
- ✅ Single source of truth

### For Maintainers
- ✅ Fewer repos to manage
- ✅ Simpler CI/CD (3 repos vs 10)
- ✅ Coordinated releases for types
- ✅ Easier to keep docs in sync

---

## 🔄 Alternative: Keep It Super Simple

If you want **even simpler**:

### Option B: Just 2 Repos

```
github.com/larcjs/core        (Stay as-is)
github.com/larcjs/components  (Stay as-is)

Everything else → Archive or move to wiki
```

**Rationale:**
- Types published as patch releases from core
- Examples live in README or GitHub Pages
- Docs on website only

**Result:** 10 repos → 2 repos (most extreme)

---

## 📊 Comparison

| Approach | Repos | Complexity | npm Packages | Best For |
|----------|-------|------------|--------------|----------|
| **Current** | 10 | High 😫 | 5 | Nothing |
| **Recommended (3)** | 3 | Low 😊 | 5 | Most teams |
| **Extreme (2)** | 2 | Minimal 🤩 | 2 | Solo maintainer |

---

## ✅ Recommended Action Plan

1. **Keep as separate** (Don't touch):
   - `core` - Published package
   - `components` - Published package

2. **Consolidate into `larc`** (Do this):
   - `core-types` → `larc/packages/core-types`
   - `components-types` → `larc/packages/components-types`
   - `devtools` → `larc/packages/devtools`
   - `site` → `larc/docs/site`
   - `examples` + `apps` → `larc/examples`
   - `.github` → `larc/.github`

3. **Archive** (Safe to archive):
   - Old `apps` repo (merged into examples)
   - Old `examples` repo (merged into larc)
   - Old `site` repo (moved to larc)
   - Old type repos (moved to larc)
   - Old devtools repo (moved to larc)

**Timeline:** 5-6 hours one-time effort

**Benefit:** Simpler forever 🎉

---

## 🚀 Ready to Execute?

I can help create the migration scripts. Just say the word!
