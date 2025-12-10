# Migration Plan: From Git Submodules to Monorepo

## 🎯 Goal
Transform the LARC project from a git submodules architecture to a modern monorepo that's easier to develop and maintain.

## 📊 Current State Analysis

### Current Architecture (Submodules - PAINFUL 😫)
```
larc/ (meta repo)
├── core/ (submodule → @larcjs/core)
├── ui/ (submodule → @larcjs/components)
├── apps/ (submodule)
│   ├── components/ (nested submodule)
│   └── core/ (nested submodule)
├── site/ (submodule)
├── examples/ (submodule)
├── devtools/ (submodule)
├── cli/ (submodule?)
├── playground/ (submodule?)
├── react-adapter/ (submodule?)
├── components-types/ (submodule)
└── core-types/ (submodule)
```

**Problems:**
- 8+ separate git repos to manage
- Detached HEAD confusion
- Complex push/pull workflows
- Nested submodules (apps has its own submodules!)
- Hard for new contributors
- Difficult to make atomic changes across packages

---

## 🎨 Proposed Architecture (Monorepo - EASY 😊)

### Option A: npm/yarn/pnpm Workspaces (RECOMMENDED)

```
larc/ (single git repo)
├── package.json (workspace root)
├── packages/
│   ├── core/              (@larcjs/core)
│   ├── components/        (@larcjs/components)
│   ├── components-types/  (@larcjs/components-types)
│   ├── core-types/        (@larcjs/core-types)
│   ├── react-adapter/     (@larcjs/react-adapter)
│   ├── cli/               (@larcjs/cli)
│   └── devtools/          (@larcjs/devtools)
├── apps/
│   ├── contact-manager/
│   ├── invoice/
│   ├── markdown-notes/
│   └── data-browser/
├── examples/
├── site/ (documentation site)
└── playground/
```

**Workflow:**
```bash
# One clone
git clone https://github.com/larcjs/larc.git

# One install (links all packages automatically)
npm install

# Work across packages easily
cd packages/core
# edit core...
cd ../components
# edit components that depend on core...
# Both changes tested together!

# One commit for atomic changes
git add packages/core packages/components
git commit -m "Add feature across core and components"
git push
```

---

## 🚀 Migration Steps

### Phase 1: Assessment (1 hour)
- [ ] Identify which "submodules" are actually published packages vs. just code organization
- [ ] List cross-package dependencies
- [ ] Document current release process

### Phase 2: Preparation (2 hours)
- [ ] Create new branch `feature/monorepo-migration`
- [ ] Backup current state
- [ ] Create root `package.json` with workspaces config
- [ ] Set up build tooling (turborepo, nx, or just npm workspaces)

### Phase 3: Migration (4-6 hours)
- [ ] Copy submodule code into packages/ directory
- [ ] Remove .git directories from former submodules
- [ ] Update package.json dependencies to use workspace protocol
- [ ] Update import paths if needed
- [ ] Test that everything builds and runs
- [ ] Update CI/CD pipelines

### Phase 4: Cleanup (1 hour)
- [ ] Archive old submodule repos (keep for history)
- [ ] Update documentation
- [ ] Update contributor guide
- [ ] Test deployment

---

## 📝 Detailed Implementation

### 1. Root package.json

```json
{
  "name": "larc-monorepo",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "dev": "npm run dev --workspaces --if-present",
    "clean": "npm run clean --workspaces --if-present"
  },
  "devDependencies": {
    "turbo": "^2.0.0",  // Optional: faster builds
    "changesets": "^2.0.0"  // Optional: version management
  }
}
```

### 2. Update Package Dependencies

**Before (submodules):**
```json
// packages/components/package.json
{
  "peerDependencies": {
    "@larcjs/core": "^1.1.0"
  }
}
```

**After (monorepo):**
```json
// packages/components/package.json
{
  "dependencies": {
    "@larcjs/core": "workspace:*"
  },
  "peerDependencies": {
    "@larcjs/core": "^1.1.0"  // Still needed for external consumers
  }
}
```

### 3. Migration Script

Create `migrate-to-monorepo.sh`:

```bash
#!/bin/bash
set -e

echo "🚀 Starting migration to monorepo..."

# Create packages directory
mkdir -p packages

# Move submodules to packages (preserving git history)
PACKAGES="core ui components-types core-types react-adapter cli devtools"

for pkg in $PACKAGES; do
  echo "📦 Migrating $pkg..."

  # Get the actual directory name (ui → components)
  if [ "$pkg" = "ui" ]; then
    SOURCE="ui"
    DEST="packages/components"
  else
    SOURCE="$pkg"
    DEST="packages/$pkg"
  fi

  # Move with history preservation
  if [ -d "$SOURCE" ]; then
    # Remove submodule connection
    git submodule deinit -f "$SOURCE" 2>/dev/null || true
    rm -rf ".git/modules/$SOURCE" 2>/dev/null || true

    # Move the directory
    mv "$SOURCE" "$DEST"

    # Remove .git reference if it exists
    rm -f "$DEST/.git"
  fi
done

# Move apps, examples, site to root (not in packages)
echo "📁 Organizing other directories..."
# These are already in place

# Remove submodule config
rm -f .gitmodules

echo "✅ Physical migration complete!"
echo "📝 Next steps:"
echo "  1. Update package.json files with workspace: protocol"
echo "  2. Run npm install"
echo "  3. Test builds"
echo "  4. Update documentation"
```

---

## 🔄 Alternative: Keep Some Repos Separate

If you want to keep `@larcjs/core` and `@larcjs/components` in separate repos (for independent versioning), use a hybrid approach:

### Hybrid Option: Monorepo + External Packages

```
larc/ (monorepo)
├── packages/
│   ├── cli/
│   ├── react-adapter/
│   └── devtools/
├── apps/        (links to @larcjs/core, @larcjs/components via npm)
├── examples/    (links via npm)
└── site/        (links via npm)

# Separate repos:
github.com/larcjs/core        → published as @larcjs/core
github.com/larcjs/components  → published as @larcjs/components
```

**Development workflow:**
```bash
# For core development
npm link @larcjs/core
npm link @larcjs/components

# Or use npm install git+https://...
```

This is simpler but loses the "atomic commits" benefit.

---

## 📦 Tooling Options

### Option 1: Plain npm Workspaces (Simple)
**Pros:** Built-in, no extra tools
**Cons:** Slower builds, basic features

```json
// package.json
{
  "workspaces": ["packages/*"]
}
```

### Option 2: pnpm Workspaces (Better)
**Pros:** Faster, better disk usage, workspace protocol
**Cons:** Need to install pnpm

```yaml
# pnpm-workspace.yaml
packages:
  - 'packages/*'
```

### Option 3: Turborepo (Best for scaling)
**Pros:** Caching, parallel builds, remote caching
**Cons:** Extra complexity

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Option 4: Nx (Most features)
**Pros:** Everything + graph viz, generators
**Cons:** Steeper learning curve

---

## 🎯 Recommended Path for LARC

### **Recommendation: pnpm Workspaces + Changesets**

**Why:**
- Fast, reliable package manager (pnpm)
- Excellent monorepo support
- Simple workspace protocol
- Changesets for version/changelog management
- Not too complex, not too simple

**Steps:**
```bash
# 1. Install pnpm
npm install -g pnpm

# 2. Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << EOF
packages:
  - 'packages/*'
EOF

# 3. Create root package.json
cat > package.json << EOF
{
  "name": "larc",
  "private": true,
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "dev": "pnpm -r --parallel dev"
  },
  "devDependencies": {
    "@changesets/cli": "^2.27.0"
  }
}
EOF

# 4. Migrate packages
./migrate-to-monorepo.sh

# 5. Update package.json dependencies
# Change peerDependencies to: "@larcjs/core": "workspace:*"

# 6. Install
pnpm install

# 7. Test
pnpm build
pnpm test
```

---

## 📊 Comparison: Before vs After

| Aspect | Submodules | Monorepo |
|--------|-----------|----------|
| Clone | `git clone --recurse-submodules` | `git clone` |
| Update | `git pull && git submodule update --init --recursive --remote` | `git pull` |
| Work on package | `cd pkg && git checkout main && git pull` | `cd packages/pkg` |
| Cross-package change | 3+ commits, 3+ pushes | 1 commit, 1 push |
| Dependencies | Manual, error-prone | Automatic via workspaces |
| Build | Manual coordination | Orchestrated |
| New contributor | 30min + docs | 5min |
| CI/CD | Complex, multiple triggers | Simple, single trigger |

---

## 🚨 Migration Risks & Mitigation

### Risk 1: Lost Git History
**Mitigation:** Use git subtree or keep old repos as archives
```bash
# Preserve history when moving
git subtree add --prefix=packages/core https://github.com/larcjs/core.git main
```

### Risk 2: Breaking External Dependents
**Mitigation:** Keep old repos as "release mirrors"
- Keep github.com/larcjs/core for npm registry
- Monorepo becomes source of truth
- Auto-push releases to old repos

### Risk 3: Large Repo Size
**Mitigation:** Use git partial clone for CI
```bash
git clone --filter=blob:none --depth=1
```

### Risk 4: Team Resistance
**Mitigation:**
- Pilot with small team first
- Document benefits clearly
- Provide scripts/aliases for common tasks

---

## 🎬 Quick Start: Try It Out (Non-Destructive)

Want to try before committing? Test on a copy:

```bash
# 1. Clone into new directory
git clone https://github.com/larcjs/larc.git larc-monorepo-test
cd larc-monorepo-test

# 2. Create test branch
git checkout -b test-monorepo

# 3. Run migration script (I'll create this)
./test-monorepo.sh

# 4. Try the workflow
pnpm install
pnpm build
# Make changes...
git add .
git commit -m "Test change"

# 5. If you like it, do it for real. If not, delete the directory.
```

---

## 📚 Resources

- [pnpm Workspaces](https://pnpm.io/workspaces)
- [Turborepo](https://turbo.build/repo)
- [Changesets](https://github.com/changesets/changesets)
- [Monorepo.tools](https://monorepo.tools/)
- [Why Google Stores Billions of Lines of Code in a Single Repository](https://cacm.acm.org/magazines/2016/7/204032-why-google-stores-billions-of-lines-of-code-in-a-single-repository/fulltext)

---

## ✅ Success Criteria

Migration is successful when:
- [ ] `git clone` + `pnpm install` + `pnpm build` works
- [ ] All tests pass
- [ ] Can edit core and see changes in components immediately
- [ ] Single commit can update multiple packages
- [ ] New contributors can get started in < 10 minutes
- [ ] CI/CD is simpler and faster
- [ ] Team is happier 😊

---

## 🤔 Still Want Submodules?

If you must keep submodules for some reason, at least use `git-subrepo` instead of `git submodule`:
- No detached HEAD
- Simpler workflow
- Better for contributors

But honestly, **just use a monorepo**. Your future self will thank you.

---

*Created: 2025-12-06*
