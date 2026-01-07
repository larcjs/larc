# Pre-Publish Checklist

## Current Change: Bundle UI Components in Core

### What's Changed
- ✅ All 130 UI components copied to `@larcjs/core/components/`
- ✅ Autoloader updated to check `./components/` first
- ✅ Sync script created (`scripts/sync-components.js`)
- ✅ Build process updated to auto-sync
- ✅ Publish hooks added (prepublishOnly)

### Version Bump
- **@larcjs/core**: `2.0.0` → `2.1.0` (minor)
  - Feature: Bundled components for zero-config setup
  - Non-breaking: Existing code continues to work

### Pre-Publish Steps

#### 1. Verify Build
```bash
npm run build:all
```
- [ ] Build completes successfully
- [ ] No errors in sync process
- [ ] Components copied (130 files)

#### 2. Run Tests
```bash
npm run test:core
npm run test:ui
```
- [ ] Core tests pass (153 tests)
- [ ] UI tests pass (if any)

#### 3. Test Locally
```bash
cd packages/core
python3 -m http.server 8000
# Open http://localhost:8000/test-local.html
```
- [ ] Components load from ./components/
- [ ] pan-card renders correctly
- [ ] Autoloader works

#### 4. Review Changes
```bash
git status
git diff packages/core/package.json
git diff packages/core/pan.mjs
```
- [ ] Only intended files modified
- [ ] No accidental changes

#### 5. Version & Publish
```bash
# Apply version bumps
npm run changeset:version

# Review version changes
git diff

# Commit version changes
git add .
git commit -m "chore: version packages"

# Publish to npm (will auto-sync components)
npm run changeset:publish

# Push tags
git push --follow-tags
```

### What Gets Published

**@larcjs/core@3.0.1:**
- pan.mjs (autoloader)
- pan-bus.mjs (messaging)
- pan-client.mjs (client API)
- pan-storage.mjs (storage)
- components/ (130 UI components)

**Result:**
```html
<!-- This now works with zero config! -->
<script type="module" src="https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/pan.mjs"></script>
<pan-card>Hello!</pan-card>
```

### Rollback Plan

If something goes wrong:
```bash
# Unpublish within 72 hours
npm unpublish @larcjs/core@3.0.1

# Or publish a patch
npm version patch
npm publish
```

### Post-Publish Verification

```bash
# Test from CDN
curl -I https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/pan.mjs
curl -I https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/components/pan-card.mjs

# Test in browser
open https://cdn.jsdelivr.net/npm/@larcjs/core@3.0.1/
```

- [ ] CDN serves files correctly
- [ ] Components accessible
- [ ] No 404 errors

### Documentation Updates Needed

- [ ] Update README with one-liner example
- [ ] Update quickstart guide
- [ ] Announce change (changelog, blog, etc.)

---

## Ready to Publish?

All checkboxes above should be ✅ before running:

```bash
npm run changeset:version && npm run changeset:publish
```
