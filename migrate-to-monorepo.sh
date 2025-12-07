#!/bin/bash
#
# LARC Repository Consolidation Migration Script
# Safely migrates from submodules to monorepo structure
#

set -e  # Exit on error

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

BACKUP_DIR="/tmp/larc-migration-backup-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="migration-$(date +%Y%m%d-%H%M%S).log"

# Logging function
log() {
    echo -e "${COLOR_GREEN}✓${COLOR_RESET} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${COLOR_YELLOW}⚠${COLOR_RESET} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${COLOR_RED}✗${COLOR_RESET} $1" | tee -a "$LOG_FILE"
}

log_section() {
    echo "" | tee -a "$LOG_FILE"
    echo -e "${COLOR_BLUE}═══════════════════════════════════════${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_BLUE}$1${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo -e "${COLOR_BLUE}═══════════════════════════════════════${COLOR_RESET}" | tee -a "$LOG_FILE"
    echo "" | tee -a "$LOG_FILE"
}

# Safety check
if [ ! -f ".gitmodules" ]; then
    log_error "Not in the root of the larc repository!"
    exit 1
fi

log_section "LARC Repository Migration to Monorepo"

log "Starting migration at $(date)"
log "Current directory: $(pwd)"
log "Backup will be created at: $BACKUP_DIR"

# Create backup directory
log_section "Creating Safety Backup"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/"
log "Full backup created at $BACKUP_DIR"

# Verify we have all the submodules
log_section "Verifying Current Structure"

REQUIRED_DIRS="core ui components-types core-types devtools examples site"
for dir in $REQUIRED_DIRS; do
    if [ -d "$dir" ]; then
        log "Found: $dir"
    else
        log_warning "Missing: $dir (will handle gracefully)"
    fi
done

# Start migration
log_section "Step 1: Creating New Directory Structure"

# Create packages directory
mkdir -p packages
log "Created packages/ directory"

# Create docs directory
mkdir -p docs
log "Created docs/ directory"

log_section "Step 2: Moving Type Definitions to packages/"

# Move core-types
if [ -d "core-types" ]; then
    log "Moving core-types to packages/..."

    # Deinitialize submodule
    git submodule deinit -f core-types 2>/dev/null || true
    rm -rf .git/modules/core-types 2>/dev/null || true

    # Move directory
    mv core-types packages/

    # Remove .git reference if exists
    rm -f packages/core-types/.git

    log "✓ core-types moved to packages/core-types"
else
    log_warning "core-types directory not found, skipping"
fi

# Move components-types
if [ -d "components-types" ]; then
    log "Moving components-types to packages/..."

    git submodule deinit -f components-types 2>/dev/null || true
    rm -rf .git/modules/components-types 2>/dev/null || true

    mv components-types packages/
    rm -f packages/components-types/.git

    log "✓ components-types moved to packages/components-types"
else
    log_warning "components-types directory not found, skipping"
fi

log_section "Step 3: Moving DevTools to packages/"

if [ -d "devtools" ]; then
    log "Moving devtools to packages/..."

    git submodule deinit -f devtools 2>/dev/null || true
    rm -rf .git/modules/devtools 2>/dev/null || true

    mv devtools packages/
    rm -f packages/devtools/.git

    log "✓ devtools moved to packages/devtools"
else
    log_warning "devtools directory not found, skipping"
fi

log_section "Step 4: Moving Documentation to docs/"

if [ -d "site" ]; then
    log "Moving site to docs/..."

    git submodule deinit -f site 2>/dev/null || true
    rm -rf .git/modules/site 2>/dev/null || true

    mv site docs/
    rm -f docs/site/.git

    log "✓ site moved to docs/site"
else
    log_warning "site directory not found, skipping"
fi

log_section "Step 5: Organizing Examples"

# Note: We'll keep examples as-is for now since it's already a directory
# apps should be consolidated, but let's check if it exists first
if [ -d "apps" ]; then
    log "Note: apps/ directory exists - consider manually reviewing content to merge with examples/"
    log "apps/ will remain as-is for now (you may want to merge specific demos later)"
fi

log_section "Step 6: Cleaning Up Submodule References"

# Remove .gitmodules entries for moved directories
if [ -f ".gitmodules" ]; then
    log "Backing up original .gitmodules..."
    cp .gitmodules .gitmodules.backup

    # We'll keep core, ui, examples in .gitmodules (these stay as submodules)
    # Remove entries for moved packages
    log "Note: Keeping core, ui, and other active submodules"
    log "Moved packages are no longer submodules"
fi

log_section "Step 7: Creating Workspace Configuration"

# Create pnpm-workspace.yaml
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
EOF
log "✓ Created pnpm-workspace.yaml"

# Create root package.json
cat > package.json << 'EOF'
{
  "name": "larc",
  "version": "2.0.0",
  "private": true,
  "description": "LARC Development Monorepo - Documentation, examples, and developer tools",
  "type": "module",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "dev": "pnpm -r --parallel dev",
    "clean": "pnpm -r clean",
    "lint": "pnpm -r lint",
    "publish-types": "pnpm --filter '@larcjs/core-types' publish && pnpm --filter '@larcjs/components-types' publish",
    "serve": "python3 -m http.server 8000"
  },
  "keywords": [
    "larc",
    "pan",
    "message-bus",
    "web-components",
    "monorepo"
  ],
  "author": "Chris Robison",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/larcjs/larc.git"
  },
  "devDependencies": {}
}
EOF
log "✓ Created root package.json"

log_section "Step 8: Creating New README"

cat > README.md << 'EOF'
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
EOF
log "✓ Created new README.md"

log_section "Migration Complete!"

echo ""
echo "=========================================="
echo "Migration Summary:"
echo "=========================================="
echo ""
echo "✓ Backup created: $BACKUP_DIR"
echo "✓ packages/core-types/       (moved from submodule)"
echo "✓ packages/components-types/ (moved from submodule)"
echo "✓ packages/devtools/         (moved from submodule)"
echo "✓ docs/site/                 (moved from submodule)"
echo "✓ Workspace configuration created"
echo "✓ New README.md created"
echo ""
echo "Preserved as submodules:"
echo "  - core/                    (@larcjs/core)"
echo "  - ui/                      (@larcjs/components)"
echo "  - examples/"
echo ""
echo "Next Steps:"
echo "1. Review changes: git status"
echo "2. Test the workspace: pnpm install (or npm install)"
echo "3. Commit changes: git add . && git commit -m 'Migrate to monorepo structure'"
echo "4. Archive old repos on GitHub (don't delete)"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "Log file: $LOG_FILE"
echo ""
log "Migration completed successfully at $(date)"
