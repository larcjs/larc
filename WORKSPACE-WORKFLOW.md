# Workspace Build Workflow

## Monorepo Structure

```
larc/ (root)
├── packages/
│   ├── core/              → @larcjs/core (includes synced components)
│   ├── core-lite/         → @larcjs/core-lite
│   ├── ui/                → @larcjs/ui (SOURCE OF TRUTH for components)
│   ├── apps/              → @larcjs/apps
│   ├── examples/          → @larcjs/examples
│   └── ...
├── cli/                   → create-larc-app
├── registry/              → @larcjs/registry
├── react-adapter/         → @larcjs/react-adapter
└── docs/site/             → @larcjs/site
```

## Build Order with Component Sync

### 1. Root Level Build
```bash
npm run build
```

**Execution flow:**
```
1. sync:components (root)
   └─> Copies @larcjs/ui/* to @larcjs/core/components/

2. npm run build --workspaces --if-present
   ├─> @larcjs/ui (builds first - independent)
   ├─> @larcjs/core (builds with fresh components)
   ├─> @larcjs/core-lite (builds)
   ├─> @larcjs/apps (depends on core + ui)
   ├─> @larcjs/react-adapter (depends on core)
   └─> ... (all other workspaces)
```

### 2. Individual Workspace Build
```bash
npm run build:core    # Just @larcjs/core
npm run build:ui      # Just @larcjs/ui
```

**Execution flow:**
```
npm run build --workspace @larcjs/core
└─> Runs @larcjs/core's build script
    └─> sync:components (if prepublishOnly)
    └─> build script
```

### 3. Publish Workflow
```bash
npm run changeset:publish
```

**Execution flow:**
```
1. sync:components (root level)
   └─> Ensures core has latest UI components

2. changeset publish
   ├─> Bumps versions
   ├─> For each package:
   │   ├─> prepublishOnly hook (syncs again if @larcjs/core)
   │   └─> npm publish
   └─> Git tags + push
```

## Workspace Dependencies

```
@larcjs/ui (standalone)
  └─> No dependencies (source of truth)

@larcjs/core
  └─> Synced from: @larcjs/ui/components
  └─> peerDependencies: none

@larcjs/apps
  └─> @larcjs/core
  └─> @larcjs/ui

@larcjs/react-adapter
  └─> @larcjs/core
  └─> react (peer)

@larcjs/devtools
  └─> @larcjs/core
```

## Development Workflow

### Edit UI Component
```bash
# 1. Edit in source of truth
vim packages/ui/pan-card.mjs

# 2. Test individually
cd packages/ui
npm run test

# 3. Build all (syncs to core automatically)
cd ../..
npm run build:all
```

### Publish Changes
```bash
# 1. Create changeset
npm run changeset
# Select packages: @larcjs/ui, @larcjs/core

# 2. Version bump
npm run changeset:version

# 3. Publish (auto-syncs before publishing)
npm run changeset:publish
```

## Key Points

✅ **Workspaces respected** - Each package builds independently
✅ **Sync happens first** - Components synced before any builds
✅ **Dependencies honored** - Workspace dependencies build in order
✅ **Single source** - Components maintained only in `@larcjs/ui`
✅ **Auto-sync** - Core always gets latest components at build/publish

## Commands Summary

| Command | What It Does | Sync? |
|---------|--------------|-------|
| `npm run build` | Build all workspaces | ✅ Yes (before) |
| `npm run build:all` | Build + minify all | ✅ Yes (before) |
| `npm run build:core` | Build core only | ⚠️ Only if prepublish |
| `npm run build:ui` | Build ui only | ❌ No |
| `npm run sync:components` | Manual sync | ✅ Yes |
| `npm run changeset:publish` | Publish all changed | ✅ Yes (before) |
| `npm test` | Test all workspaces | ❌ No |
| `npm run clean` | Clean all workspaces | ❌ No |

## Best Practices

1. **Always edit in `packages/ui/`** - Never edit `packages/core/components/` directly
2. **Run `npm run build:all`** - Ensures everything syncs and builds
3. **Use changesets for publishing** - Handles versioning and sync automatically
4. **Test after sync** - Run `npm test` after building to verify everything works

## Troubleshooting

**Components out of sync?**
```bash
npm run sync:components
npm run build:all
```

**Want to see what will sync?**
```bash
ls packages/ui/*.mjs | wc -l        # Source
ls packages/core/components/*.mjs | wc -l  # Destination
```

**Need to rebuild everything clean?**
```bash
npm run clean
npm run build:all
```
