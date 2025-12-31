# Deployment Process

## Component Sync Architecture

### Source of Truth
- **Components developed in:** `packages/ui/`
- **Synced automatically to:** `packages/core/components/`
- **Script:** `scripts/sync-components.js`

### Automatic Syncing

Components sync automatically in these scenarios:

#### 1. During Build
```bash
npm run build         # Syncs + builds all packages
npm run build:all     # Syncs + builds + minifies
```

#### 2. During Publish
```bash
npm run changeset:publish   # Syncs before publishing
npm publish                 # prepublishOnly hook syncs
```

#### 3. Manual Sync
```bash
npm run sync:components     # Force sync without building
```

### Development Workflow

```bash
# 1. Edit components (source of truth)
cd packages/ui
vim pan-card.mjs

# 2. Test locally
npm run serve:examples

# 3. Build (auto-syncs to core)
npm run build:all

# 4. Publish (auto-syncs before publish)
npm run changeset:publish
```

### What Gets Synced

All 130 component files from `@larcjs/ui`:
- `pan-*.mjs` - 115 PAN components + minified versions
- Other components (drag-drop-list, file-upload, etc.)

### Published Packages

**@larcjs/ui** (Source)
- Original component source files
- For users who want component-only package

**@larcjs/core** (Includes synced components)
- PAN messaging bus
- Auto-loader
- All UI components in `/components/`
- "Batteries included" - one-liner setup

### Result: Two Usage Patterns

**Pattern 1: One-liner (most users)**
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan.mjs"></script>
<pan-card>Hello!</pan-card>
```

**Pattern 2: Minimal (advanced users)**
```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@larcjs/core@2.0.0/pan-bus.mjs"></script>
<script type="module" src="https://cdn.jsdelivr.net/npm/@larcjs/ui@2.0.0/pan-card.mjs"></script>
```

### No Duplication Concerns

Code is duplicated across packages but **maintained in one place**:
- ✅ Edit once in `packages/ui/`
- ✅ Auto-sync to `packages/core/components/`
- ✅ Both packages stay in sync
- ✅ No manual copying needed

### Checklist Before Publishing

- [ ] Components edited in `packages/ui/`
- [ ] Tests pass: `npm test`
- [ ] Build runs: `npm run build:all` (auto-syncs)
- [ ] Publish: `npm run changeset:publish` (auto-syncs)

That's it! The sync happens automatically. 🎉
