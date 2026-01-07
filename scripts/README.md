# Build Scripts

## Component Sync Workflow

### Overview

UI components are maintained in `@larcjs/ui` as the **source of truth**, then automatically synced to `@larcjs/core/components/` during build and publish.

This allows:
- **@larcjs/ui** - Standalone UI components package
- **@larcjs/core** - "Batteries included" package with components built-in for one-liner setup

### Automatic Sync

Components sync automatically:

**During build:**
```bash
npm run build              # Syncs, then builds all packages
npm run build:all          # Syncs, builds, and minifies
```

**During publish:**
```bash
npm run changeset:publish  # Syncs before publishing
# or
npm publish                # prepublishOnly hook syncs automatically
```

### Manual Sync

Force sync components without building:

```bash
npm run sync:components
```

### Component Development Workflow

1. **Edit components in `packages/ui/`**
   ```bash
   cd packages/ui
   vim pan-card.mjs
   ```

2. **Test locally**
   ```bash
   npm run serve:examples
   ```

3. **Build (auto-syncs to core)**
   ```bash
   npm run build:all
   ```

4. **Publish (auto-syncs before publishing)**
   ```bash
   npm run changeset:publish
   ```

### What Gets Synced

All `.mjs` and `.min.mjs` files from `packages/ui/`:
- `pan-*.mjs` - PAN components
- `pan-*.min.mjs` - Minified versions
- `*.mjs` - Other components (drag-drop-list, file-upload, etc.)

### Result

Both packages published with identical components:
- `@larcjs/ui` - Original source
- `@larcjs/core/components/` - Synced copy

Users can use either:
```html
<!-- One-liner: core with everything -->
<script src="https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/pan.mjs"></script>

<!-- Minimal: bus only, explicit component imports -->
<script src="https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/pan-bus.mjs"></script>
<script src="https://cdn.jsdelivr.net/npm/@larcjs/ui@3.0.1/pan-card.mjs"></script>
```
