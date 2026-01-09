# Semantic Versioning Commitment

**Document Version:** 1.0
**Effective Date:** November 24, 2024
**Applies To:** LARC v1.0.0 and above

---

## Introduction

LARC is committed to [Semantic Versioning 2.0.0](https://semver.org/) (SemVer) for all packages in the LARC ecosystem. This document outlines our versioning policy, what constitutes breaking changes, and our commitment to API stability.

---

## Version Format

All LARC packages follow the SemVer format: **MAJOR.MINOR.PATCH**

```
1.2.3
│ │ └─ PATCH version (bug fixes, no API changes)
│ └─── MINOR version (new features, backward compatible)
└───── MAJOR version (breaking changes, not backward compatible)
```

### Examples

- `1.0.0` → `1.0.1` - Bug fix (safe to update)
- `1.0.0` → `1.1.0` - New feature (safe to update)
- `1.0.0` → `2.0.0` - Breaking change (review MIGRATION.md before updating)

---

## Version Increment Rules

### PATCH Version (x.x.X)

**When:** Bug fixes, performance improvements, documentation updates

**Guarantees:**
- ✅ No API changes
- ✅ 100% backward compatible
- ✅ No behavioral changes (except bug fixes)
- ✅ Safe to update without code changes

**Examples:**
```javascript
// All of these are PATCH updates:
// - Fix message delivery race condition
// - Improve autoloader performance
// - Fix memory leak in subscription cleanup
// - Update documentation typos
// - Add JSDoc comments
```

**What's NOT a patch:**
- New public methods or properties
- New component attributes
- New event types
- Deprecation warnings

---

### MINOR Version (x.X.x)

**When:** New features, new APIs, deprecations

**Guarantees:**
- ✅ Backward compatible
- ✅ Existing code continues to work
- ✅ New features are opt-in
- ⚠️ May add deprecation warnings

**Examples:**
```javascript
// All of these are MINOR updates:
// - Add new component: <pan-wizard>
// - Add new PanBus configuration option
// - Add new PanClient convenience method
// - Add new autoloader configuration option
// - Deprecate old API (but keep it working)
// - Add new event type
// - Add new attribute to existing component
```

**What to expect:**
- New capabilities available
- Existing code needs no changes
- Deprecation warnings may appear in console
- Review release notes for new features

---

### MAJOR Version (X.x.x)

**When:** Breaking changes, API removals, behavioral changes

**Guarantees:**
- ⚠️ Breaking changes present
- ⚠️ Code changes likely required
- ⚠️ Thorough testing recommended
- ✅ MIGRATION.md provided

**Examples:**
```javascript
// All of these are MAJOR updates:
// - Remove deprecated API
// - Change component attribute name
// - Change message format
// - Change event detail structure
// - Change autoloader behavior
// - Rename exported classes
// - Change method signatures
// - Change default configuration values
```

**What to do:**
1. Read MIGRATION.md thoroughly
2. Review CHANGELOG.md for all changes
3. Test in development environment
4. Update code as needed
5. Run comprehensive tests
6. Deploy gradually (canary/blue-green)

---

## What Constitutes a Breaking Change

### ⚠️ Breaking Changes (Require MAJOR version bump)

#### 1. **Public API Changes**
```javascript
// BREAKING: Renamed method
class PanClient {
  // v1.x
  subscribe(topics, handler) { }

  // v2.x
  on(topics, handler) { } // BREAKING: different name
}

// BREAKING: Changed method signature
class PanClient {
  // v1.x
  publish(msg) { }

  // v2.x
  publish(topic, data, options) { } // BREAKING: different signature
}

// BREAKING: Removed method
class PanClient {
  // v1.x
  oldMethod() { }

  // v2.x - method removed // BREAKING
}
```

#### 2. **Component Attribute Changes**
```html
<!-- BREAKING: Renamed attribute -->
<!-- v1.x -->
<pan-bus max-retained="1000"></pan-bus>

<!-- v2.x -->
<pan-bus max-messages="1000"></pan-bus> <!-- BREAKING -->

<!-- BREAKING: Changed attribute behavior -->
<!-- v1.x: debug="true" enables verbose logging -->
<pan-bus debug="true"></pan-bus>

<!-- v2.x: debug="verbose" required for same behavior -->
<pan-bus debug="verbose"></pan-bus> <!-- BREAKING -->
```

#### 3. **Event Structure Changes**
```javascript
// BREAKING: Changed event detail structure
// v1.x
document.addEventListener('pan:deliver', (e) => {
  const { topic, data } = e.detail;
});

// v2.x
document.addEventListener('pan:deliver', (e) => {
  const { message } = e.detail; // BREAKING: nested differently
  const { topic, data } = message;
});
```

#### 4. **Default Behavior Changes**
```javascript
// BREAKING: Changed default configuration
// v1.x: autoloader rootMargin defaults to 600px
window.panAutoload = { rootMargin: 600 };

// v2.x: defaults to 1200px - components load earlier
window.panAutoload = { rootMargin: 1200 }; // BREAKING: different timing
```

#### 5. **Removed Features**
```javascript
// BREAKING: Removed configuration option
// v1.x
window.panAutoload = {
  legacyMode: true // supported
};

// v2.x - option removed // BREAKING
```

---

### ✅ Non-Breaking Changes (MINOR or PATCH)

#### 1. **Adding New APIs**
```javascript
// NON-BREAKING: New method added
class PanClient {
  // v1.x
  publish(msg) { }
  subscribe(topics, handler) { }

  // v1.1: New method, old methods still work
  unsubscribeAll() { } // NON-BREAKING
}
```

#### 2. **Adding New Attributes**
```html
<!-- NON-BREAKING: New optional attribute -->
<!-- v1.x -->
<pan-bus max-retained="1000"></pan-bus>

<!-- v1.1: New attribute, old ones still work -->
<pan-bus max-retained="1000" log-level="debug"></pan-bus>
<!-- NON-BREAKING -->
```

#### 3. **Adding New Events**
```javascript
// NON-BREAKING: New event type
// v1.x: pan:deliver, pan:publish, pan:subscribe

// v1.1: New event, old events still work
document.addEventListener('pan:metrics', (e) => {
  // NON-BREAKING: new opt-in event
});
```

#### 4. **Deprecations (with working code)**
```javascript
// NON-BREAKING: Deprecation warning, but method still works
class PanClient {
  // v1.1
  oldMethod() {
    console.warn('oldMethod() is deprecated, use newMethod()');
    return this.newMethod(); // still works!
  }
  newMethod() { } // new preferred method
}
```

#### 5. **Bug Fixes**
```javascript
// NON-BREAKING: Bug fix that makes code work correctly
// v1.0.0: Message delivery sometimes failed (bug)
// v1.0.1: Fixed message delivery (patch)
```

#### 6. **Performance Improvements**
```javascript
// NON-BREAKING: Same API, faster execution
// v1.0.0: Autoloader scans every 100ms
// v1.0.1: Autoloader uses IntersectionObserver (faster)
```

---

## Pre-release Versions

### Alpha Releases (x.x.x-alpha.N)

**Purpose:** Early development, unstable

**Guarantees:**
- ⚠️ No stability guarantees
- ⚠️ Breaking changes between alphas
- ⚠️ Not for production use

**Example:** `2.0.0-alpha.1` → `2.0.0-alpha.2` (may have breaking changes)

### Beta Releases (x.x.x-beta.N)

**Purpose:** Feature complete, testing phase

**Guarantees:**
- ⚠️ Limited stability
- ⚠️ API may change before final release
- ✅ Can be tested in non-critical production

**Example:** `2.0.0-beta.1` → `2.0.0-beta.2` (API changes possible)

### Release Candidates (x.x.x-rc.N)

**Purpose:** Final testing before stable release

**Guarantees:**
- ✅ API frozen (no changes unless critical bug)
- ✅ Production-ready quality
- ✅ Only critical bug fixes

**Example:** `2.0.0-rc.1` → `2.0.0-rc.2` (only critical fixes)

---

## Deprecation Policy

### Deprecation Process

1. **Announce:** Mark as deprecated in release notes
2. **Warn:** Add console warnings in code
3. **Document:** Update docs with migration path
4. **Wait:** Keep working for at least one MAJOR version
5. **Remove:** Remove in next MAJOR version

### Example Timeline

```javascript
// v1.0.0 - Current API
client.oldMethod();

// v1.5.0 - MINOR: Deprecation announced
client.oldMethod(); // works, shows console.warn()
client.newMethod(); // recommended new API

// v2.0.0 - MAJOR: Old API removed
// client.oldMethod(); // ❌ ERROR: removed
client.newMethod(); // ✅ only option
```

### Minimum Deprecation Period

- **Public API:** 1 MAJOR version or 6 months, whichever is longer
- **Component Attributes:** 1 MAJOR version or 6 months
- **Events:** 1 MAJOR version or 6 months
- **Configuration Options:** 1 MAJOR version or 6 months

---

## Package-Specific Versioning

### @larcjs/core

**Stability:** HIGH - Core APIs are very stable

**Change Policy:**
- MAJOR changes are rare (≤1 per year)
- MINOR releases every 2-3 months
- PATCH releases as needed (bug fixes)

**Guarantees:**
- PAN bus message format is stable
- Core events (pan:publish, pan:deliver, etc.) are stable
- Autoloader API is stable

### @larcjs/ui

**Stability:** MEDIUM - Components evolve more frequently

**Change Policy:**
- MAJOR changes possible (new component architecture)
- MINOR releases monthly (new components, features)
- PATCH releases as needed

**Guarantees:**
- Component tag names are stable once released
- Core attributes are stable (may add new ones)
- Events are stable (may add new ones)

---

## Version Compatibility Matrix

### Core Package Compatibility

| @larcjs/core | @larcjs/ui | Supported |
|--------------|------------|-----------|
| 1.x.x | 1.x.x | ✅ Fully compatible |
| 1.x.x | 2.x.x | ⚠️ Check compatibility notes |
| 2.x.x | 1.x.x | ⚠️ May have issues |
| 2.x.x | 2.x.x | ✅ Fully compatible |

### Browser Support Policy

- **Current Major:** Support last 2 years of browsers
- **Previous Major:** Support last 3 years at release time
- **Dropping browser support:** Requires MAJOR version bump

---

## Release Schedule

### Regular Release Cadence

- **PATCH:** As needed (bug fixes)
- **MINOR:** Every 2-3 months (new features)
- **MAJOR:** ~1 per year (breaking changes)

### Security Releases

- **Critical security issues:** Emergency PATCH release within 48 hours
- **Important security issues:** PATCH release within 1 week
- **Minor security issues:** Next scheduled PATCH release

---

## Guarantees and Commitments

### What We Guarantee

1. ✅ **SemVer compliance:** All releases follow SemVer strictly
2. ✅ **Backward compatibility:** MINOR and PATCH are always safe
3. ✅ **Migration guides:** MAJOR releases include MIGRATION.md
4. ✅ **Deprecation warnings:** Early warning before removal
5. ✅ **Comprehensive CHANGELOG:** Every release documented
6. ✅ **Security updates:** Critical fixes for current MAJOR
7. ✅ **LTS support:** Previous MAJOR gets critical fixes for 6 months

### What We Don't Guarantee

1. ⚠️ **Internal API stability:** Private/internal APIs may change
2. ⚠️ **Pre-release stability:** Alpha/beta may have breaking changes
3. ⚠️ **Bug-for-bug compatibility:** Bugs will be fixed
4. ⚠️ **Performance characteristics:** May improve without notice
5. ⚠️ **Error messages:** May change in PATCH releases

---

## Migration Support

### For MAJOR Version Updates

**We provide:**
- 📖 Detailed MIGRATION.md guide
- 📋 Breaking changes checklist
- 💻 Code examples (before/after)
- ⚙️ Automated migration tools (when possible)
- 🆘 Migration support in GitHub Discussions

**You should:**
1. Read MIGRATION.md thoroughly
2. Test in development environment first
3. Update code following examples
4. Run comprehensive tests
5. Deploy gradually (canary → staging → production)

---

## Reporting Versioning Issues

### If You Encounter Issues

If you believe a release violates SemVer:

1. **Check:** Review CHANGELOG.md for the release
2. **Verify:** Confirm it's not documented as breaking
3. **Report:** Open an issue on GitHub with:
   - Version numbers (from → to)
   - What broke
   - Why you believe it violates SemVer
   - Reproduction case

**We will:**
- Investigate within 48 hours
- Issue hotfix if confirmed violation
- Update documentation if needed
- Improve our process to prevent recurrence

---

## Staying Informed

### Release Notifications

- **GitHub Releases:** Full changelog + notes
- **npm:** Automatic notifications
- **Breaking Changes:** Prominently marked in CHANGELOG.md
- **Security:** GitHub Security Advisories

### Best Practices

```json
// package.json - Use tilde for PATCH updates only
{
  "dependencies": {
    "@larcjs/core": "~1.0.0" // ≥1.0.0 <1.1.0 (PATCH only)
  }
}

// package.json - Use caret for MINOR updates
{
  "dependencies": {
    "@larcjs/core": "^1.0.0" // ≥1.0.0 <2.0.0 (MINOR + PATCH)
  }
}

// package.json - Pin exact version for critical production
{
  "dependencies": {
    "@larcjs/core": "1.0.0" // exact version
  }
}
```

---

## Version History

| Document Version | Date | Changes |
|-----------------|------|---------|
| 1.0 | Nov 24, 2024 | Initial semantic versioning commitment |

---

## Questions?

- 📖 **Documentation:** https://larcjs.com/
- 💬 **Discussions:** https://github.com/larcjs/core/discussions
- 🐛 **Issues:** https://github.com/larcjs/core/issues

---

**This is our commitment to you.** LARC follows Semantic Versioning strictly to give you confidence in updates and control over breaking changes.
