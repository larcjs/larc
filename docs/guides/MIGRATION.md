# LARC Migration Guide

**Document Version:** 1.0
**Last Updated:** November 24, 2024
**Applies To:** All LARC package migrations

---

## Introduction

This guide helps you migrate between major versions of LARC packages. LARC follows [Semantic Versioning](SEMVER.md), which means:

- **PATCH updates (1.0.x)** - Safe to update, no changes needed
- **MINOR updates (1.x.0)** - Safe to update, new features are opt-in
- **MAJOR updates (x.0.0)** - May require code changes

---

## Quick Migration Index

| From Version | To Version | Migration Needed | Read Section |
|--------------|------------|------------------|--------------|
| 0.x | 1.0.x | ✅ No breaking changes | [0.x → 1.0](#migrating-from-0x-to-10x) |
| 1.0.x | 1.0.y | ✅ No changes needed | N/A (PATCH update) |
| 1.x | 1.y | ✅ No changes needed | N/A (MINOR update) |
| 1.x | 2.0 | ⚠️ Not released yet | N/A |

---

## Migrating from 0.x to 1.0.x

### Overview

**Good News:** LARC 1.0 introduces **zero breaking changes** to the core APIs. If you're using 0.x, you can upgrade to 1.0.x safely.

**Status:** ✅ Fully backward compatible

### What Changed in 1.0

#### Added (Non-Breaking)
- Component autoload system (opt-in)
- Router and navigation components
- WebSocket bridge component
- IndexedDB bridge component
- New UI components
- Comprehensive test suite (80%+ coverage)
- Performance benchmarks (300k+ msg/sec)
- Production documentation

#### Improved (Non-Breaking)
- Enhanced error handling
- Better memory management
- Improved TypeScript support
- Extended browser compatibility documentation

#### Fixed (Non-Breaking)
- PAN bus delivery with document listeners
- Message delivery race conditions
- Path resolution in autoloader
- Retained message subscription loop

### Migration Steps

#### Step 1: Update Package Version

```bash
# npm
npm install @larcjs/core@^1.0.0

# yarn
yarn add @larcjs/core@^1.0.0

# pnpm
pnpm add @larcjs/core@^1.0.0
```

#### Step 2: Test Your Application

Even though there are no breaking changes, run your test suite:

```bash
npm test
```

#### Step 3: Optional - Adopt New Features

Consider adopting these new 1.0 features:

##### Autoloader (Recommended)
```html
<!-- Before (0.x): Manual imports -->
<script type="module">
  import './components/pan-bus.mjs';
  import './components/pan-client.mjs';
</script>

<!-- After (1.0): Automatic loading -->
<script type="module">
  import '@larcjs/core/pan.mjs';
</script>
<pan-bus></pan-bus>
<pan-client></pan-client>
<!-- Components load automatically when needed -->
```

##### Enhanced Client API
```javascript
// Before (0.x): Still works in 1.0
const client = new PanClient();
await client.ready();

// After (1.0): New convenience methods
const data = await client.request('user.get', { id: 123 }, { timeout: 5000 });
const retained = await client.retained(['app.state.*']);
```

### Compatibility Notes

#### What Remains Compatible

✅ **All core APIs unchanged:**
- `PanBus` component and configuration
- `PanClient` methods (publish, subscribe, request)
- PAN message envelope format
- Topic naming conventions
- CustomEvent names (pan:publish, pan:deliver, etc.)
- Configuration via attributes and window.panAutoload

✅ **All existing code works:**
```javascript
// 0.x code still works perfectly in 1.0
document.addEventListener('pan:deliver', (e) => {
  const { topic, data } = e.detail;
  // This still works exactly as before
});

document.dispatchEvent(new CustomEvent('pan:publish', {
  detail: { topic: 'test.topic', data: { message: 'hello' } },
  bubbles: true
}));
```

#### What's New (Opt-In)

The following features are **new in 1.0** but completely **opt-in**:

- **Autoloader:** Only activates if you import `pan.mjs`
- **Router:** Only if you use `<pan-router>` component
- **WebSocket bridge:** Only if you use `<pan-websocket>`
- **IndexedDB bridge:** Only if you use `<pan-idb>`

### Known Issues

1. **Browser Support (1.0.0-1.0.2)**
   - Limited testing on Firefox, Safari, mobile browsers
   - Core APIs use standard DOM, should work everywhere
   - Full browser compatibility matrix: [BROWSER-COMPATIBILITY.md](BROWSER-COMPATIBILITY.md)

2. **UI Components**
   - All core components security-audited and production-ready
   - Browser compatibility testing ongoing

### Rollback Plan

If you encounter issues (unlikely), rolling back is simple:

```bash
# Rollback to 0.x
npm install @larcjs/core@0.1.0

# Or pin to last working version
npm install @larcjs/core@2.0.0
```

No code changes needed for rollback - APIs are fully compatible.

---

## Migrating from 1.x to 2.0

**Status:** ⚠️ Not yet released

LARC 2.0 has not been released yet. When it is, this section will document:
- Breaking changes introduced
- Step-by-step migration instructions
- Deprecation timeline for old APIs
- Automated migration tools (if available)

**Stay Updated:**
- Watch the [GitHub releases](https://github.com/larcjs/core/releases)
- Review [CHANGELOG.md](../core/CHANGELOG.md) for release notes
- Check [SEMVER.md](SEMVER.md) for versioning policy

---

## Package-Specific Migrations

### @larcjs/core

#### Current Status (v1.0.x)
- **Stability:** HIGH - Core APIs are locked
- **Breaking Changes:** None since 1.0.0
- **Deprecations:** None

#### Deprecated APIs
No APIs are currently deprecated. When APIs are deprecated:
1. They will continue working with console warnings
2. Deprecation will last at least 1 MAJOR version (6 months minimum)
3. Migration path will be documented here

### @larcjs/ui

#### Current Status (v1.0.x)
- **Stability:** MEDIUM - Components evolve more frequently
- **Breaking Changes:** None since 1.0.0
- **Deprecations:** None

#### Component-Specific Notes
- All UI components follow the same core messaging patterns
- Component tag names are stable once released
- New components added in MINOR versions (backward compatible)

---

## General Migration Best Practices

### Before You Migrate

1. **Read the Release Notes**
   - Review [CHANGELOG.md](../core/CHANGELOG.md) for the target version
   - Look for "Breaking Changes" section
   - Check deprecation notices

2. **Review Dependencies**
   ```bash
   npm outdated
   ```

3. **Check Compatibility Matrix**
   - Core package compatibility: [SEMVER.md](SEMVER.md#version-compatibility-matrix)
   - Browser compatibility: [BROWSER-COMPATIBILITY.md](BROWSER-COMPATIBILITY.md)

### During Migration

1. **Create a Feature Branch**
   ```bash
   git checkout -b upgrade-larc-2.0
   ```

2. **Update One Package at a Time**
   ```bash
   # Update core first
   npm install @larcjs/core@2.0.0
   npm test

   # Then update UI
   npm install @larcjs/ui@2.0.0
   npm test
   ```

3. **Run Your Test Suite**
   ```bash
   npm test
   npm run test:integration
   ```

4. **Test in Development Environment**
   - Deploy to staging/dev environment
   - Perform manual testing
   - Check browser console for warnings

5. **Monitor Deprecation Warnings**
   ```javascript
   // Look for warnings in console
   console.warn('oldMethod() is deprecated, use newMethod()');
   ```

### After Migration

1. **Update Your Code**
   - Replace deprecated APIs with new ones
   - Follow examples in this guide

2. **Update Documentation**
   - Update your project's README
   - Update internal docs
   - Update code comments

3. **Deploy Gradually**
   - Canary deployment (5% traffic)
   - Staging environment testing
   - Gradual rollout to production
   - Monitor error rates

---

## Breaking Change Reference

### Format

Each breaking change will be documented using this format:

#### Change Title

**Version:** When the change was introduced
**Impact:** LOW / MEDIUM / HIGH
**Effort:** Minutes / Hours / Days

**What Changed:**
- Description of the breaking change
- Why the change was made

**Before (Old Code):**
```javascript
// Old API that no longer works
```

**After (New Code):**
```javascript
// New API to use instead
```

**Migration Steps:**
1. Step-by-step instructions
2. With code examples
3. And test verification

### Example (Template for Future Releases)

#### Renamed PanClient.subscribe() to PanClient.on()

**Version:** 2.0.0 (hypothetical example)
**Impact:** HIGH
**Effort:** 30 minutes

**What Changed:**
- `subscribe()` method renamed to `on()` for consistency with EventEmitter pattern
- `unsubscribe()` renamed to `off()`

**Before (v1.x):**
```javascript
const client = new PanClient();
const unsub = client.subscribe('user.*', (msg) => {
  console.log(msg.data);
});

// Later...
unsub();
```

**After (v2.x):**
```javascript
const client = new PanClient();
const off = client.on('user.*', (msg) => {
  console.log(msg.data);
});

// Later...
off();
```

**Migration Steps:**
1. Find all `subscribe()` calls: `grep -r "\.subscribe\(" src/`
2. Replace with `on()`: `sed -i 's/\.subscribe(/\.on(/g' src/**/*.js`
3. Replace `unsubscribe()` with `off()`
4. Run tests: `npm test`

**Automated Migration:**
```bash
# Run migration script (if provided)
npx @larcjs/migrate 1.x-to-2.x
```

---

## Deprecation Timeline

### Current Deprecations

**Status:** No APIs are currently deprecated in v1.x

### How Deprecations Work

When an API is deprecated, this section will show:

| API | Deprecated In | Removed In | Replacement | Migration Guide |
|-----|---------------|------------|-------------|-----------------|
| (none yet) | - | - | - | - |

**Example (for future deprecations):**

| API | Deprecated In | Removed In | Replacement | Migration Guide |
|-----|---------------|------------|-------------|-----------------|
| `subscribe()` | 1.5.0 | 2.0.0 | `on()` | [Link](#example-change) |

---

## Automated Migration Tools

### Current Tools

**Status:** No automated migration tools yet (none needed - no breaking changes)

### Future Tools

When LARC 2.0 is released with breaking changes, we plan to provide:

```bash
# Automated migration (planned for 2.0)
npx @larcjs/migrate 1.x-to-2.x

# Options
npx @larcjs/migrate 1.x-to-2.x --dry-run  # Preview changes
npx @larcjs/migrate 1.x-to-2.x --interactive  # Choose which changes to apply
```

---

## Version-Specific Guides

### 0.x → 1.0.x ✅ COMPLETE
See [Migrating from 0.x to 1.0.x](#migrating-from-0x-to-10x) above.

### 1.x → 2.0 ⚠️ NOT RELEASED
Not yet available. Check back when LARC 2.0 is announced.

---

## Getting Help

### Migration Support

If you encounter issues during migration:

1. **Check Documentation:**
   - [API Reference](../reference/API-REFERENCE.md)
   - [Troubleshooting Guide](TROUBLESHOOTING.md)
   - [CHANGELOG](../core/CHANGELOG.md)

2. **Search Issues:**
   - [GitHub Issues](https://github.com/larcjs/core/issues)
   - Search for your error message

3. **Ask for Help:**
   - [GitHub Discussions](https://github.com/larcjs/core/discussions)
   - Tag: `migration`, `help-wanted`

4. **Report Migration Problems:**
   ```markdown
   **Title:** Migration issue: [describe problem]

   **Migrating from:** 1.x.x
   **Migrating to:** 2.0.0

   **Error:**
   [paste error message]

   **Code:**
   [paste relevant code]

   **Expected:** What you expected to happen
   **Actual:** What actually happened
   ```

### Version Support Policy

- **Current MAJOR:** Full support (bug fixes, security updates, features)
- **Previous MAJOR:** Critical bug fixes and security updates for 6 months
- **Older versions:** Community support only

**Example (as of v1.0.x):**
- v1.x: Full support ✅
- v0.x: Critical fixes for 6 months (until May 2025) ⏰
- Earlier: Community only ⚠️

---

## Migration Checklist

Use this checklist when performing any major version migration:

### Pre-Migration
- [ ] Read CHANGELOG.md for target version
- [ ] Read this migration guide
- [ ] Check browser compatibility requirements
- [ ] Review deprecation notices
- [ ] Create git feature branch
- [ ] Backup production database (if applicable)
- [ ] Set up rollback plan

### Migration
- [ ] Update package.json dependencies
- [ ] Run `npm install`
- [ ] Run automated migration tools (if available)
- [ ] Update code following migration guide
- [ ] Fix deprecation warnings
- [ ] Run test suite
- [ ] Test in development environment
- [ ] Test critical user flows manually

### Post-Migration
- [ ] Update documentation
- [ ] Deploy to staging environment
- [ ] Perform QA testing
- [ ] Monitor error logs
- [ ] Canary deployment (5% traffic)
- [ ] Gradual rollout to 100%
- [ ] Monitor performance metrics
- [ ] Update internal runbooks

---

## FAQ

### Do I need to migrate from 0.x to 1.0?

**Answer:** No, but it's recommended. LARC 1.0 is backward compatible, but adds significant improvements:
- 80%+ test coverage
- Performance benchmarks (300k+ msg/sec)
- Production-ready documentation
- Security audit completed
- New opt-in features

### Will my 0.x code break in 1.0?

**Answer:** No. All core APIs remain compatible. You can upgrade with zero code changes.

### How long will 0.x be supported?

**Answer:** Critical bug fixes and security updates for 6 months after 1.0 release (until May 2025).

### Can I use new 1.0 features in 0.x?

**Answer:** No. New features require 1.0. But upgrading is safe and requires no code changes.

### What if I find a breaking change not documented here?

**Answer:** Please report it immediately:
1. Open a GitHub issue
2. Tag it with `bug` and `breaking-change`
3. We'll investigate within 48 hours
4. If confirmed, we'll issue a hotfix

### How do I stay informed about upcoming breaking changes?

**Answer:**
- Watch [GitHub Releases](https://github.com/larcjs/core/releases)
- Subscribe to deprecation warnings in your console
- Join [GitHub Discussions](https://github.com/larcjs/core/discussions)
- Read CHANGELOG.md with each update

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 24, 2024 | Initial migration guide with 0.x → 1.0.x guide |

---

## See Also

- [Semantic Versioning Commitment](../specs/SEMVER.md)
- [API Reference](../reference/API-REFERENCE.md)
- [Troubleshooting Guide](TROUBLESHOOTING.md)
- [Production Deployment Guide](PRODUCTION-DEPLOYMENT.md)
- [CHANGELOG](../core/CHANGELOG.md)

---

**Questions?** Open an issue or discussion on GitHub: https://github.com/larcjs/core
