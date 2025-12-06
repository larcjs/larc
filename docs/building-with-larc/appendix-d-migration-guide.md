# Appendix D: Migration Guide

This appendix helps you upgrade LARC applications across versions, navigate breaking changes, and adopt new features while maintaining stability. Whether you're moving from an early prototype to a production release or keeping pace with framework evolution, this guide provides version-specific migration paths and practical strategies.

## General Migration Strategy

Before diving into version-specific changes, establish a methodical upgrade process:

**1. Review the Changelog**
Start with LARC's release notes. Note breaking changes, deprecations, and new features relevant to your application.

**2. Update in Increments**
Avoid jumping multiple major versions. Upgrade one major version at a time, testing thoroughly between steps.

**3. Run Your Test Suite**
Execute all tests before and after migration. Pay special attention to component integration tests that exercise PAN bus communication.

**4. Check Dependencies**
Ensure your LARC-compatible libraries (routing, state management) support the new version. Update these incrementally.

**5. Use Feature Flags**
When migrating large applications, use feature flags to toggle between old and new implementations during transition periods.

## Version 0.x to 1.0 Migration

The move to LARC 1.0 established core APIs and stabilized component architecture. Key changes:

### Component Registration Changes

**Before (0.x):**
```javascript
LARC.register('my-widget', {
  template: '<div>Content</div>',
  props: ['data']
});
```

**After (1.0):**
```javascript
class MyWidget extends HTMLElement {
  static observedAttributes = ['data'];

  connectedCallback() {
    this.render();
  }

  render() {
    this.innerHTML = '<div>Content</div>';
  }
}

customElements.define('my-widget', MyWidget);
```

**Migration Steps:**
1. Convert registration objects to ES6 classes extending `HTMLElement`
2. Move lifecycle hooks to standard Web Components callbacks
3. Implement `observedAttributes` for reactive properties
4. Replace template strings with `render()` methods

### PAN Bus API Refinement

Version 1.0 introduced explicit bus references rather than implicit global access.

**Before (0.x):**
```javascript
this.emit('data-changed', { value: 42 });
this.on('user-action', handler);
```

**After (1.0):**
```javascript
this.pan.dispatch('data-changed', { value: 42 });
this.pan.subscribe('user-action', handler);
```

**Migration Steps:**
1. Replace `emit()` with `pan.dispatch()`
2. Replace `on()` with `pan.subscribe()`
3. Update cleanup to use returned unsubscribe functions
4. Add explicit PAN bus initialization if using custom buses

### Attribute Handling

Attribute parsing became more strict in 1.0.

**Before (0.x):**
```javascript
// Automatic JSON parsing
this.getAttribute('config'); // returns object
```

**After (1.0):**
```javascript
// Explicit parsing required
JSON.parse(this.getAttribute('config') || '{}');
```

**Migration Steps:**
1. Add explicit JSON parsing for complex attributes
2. Implement `attributeChangedCallback()` for reactive updates
3. Use `observedAttributes` to declare monitored attributes

## Version 1.x to 2.0 Migration

LARC 2.0 introduced TypeScript support, improved developer experience, and performance optimizations.

### TypeScript Integration

While JavaScript remains fully supported, TypeScript brings type safety.

**Migration Steps:**
1. Install TypeScript definitions: `npm install --save-dev @larc/types`
2. Rename `.js` files to `.ts` incrementally
3. Add type annotations to component properties
4. Define custom event payload types

**Example:**
```typescript
import { PANEvent } from '@larc/core';

interface UserData {
  id: string;
  name: string;
}

class UserCard extends HTMLElement {
  private userData: UserData | null = null;

  connectedCallback() {
    this.pan.subscribe<UserData>('user-selected', (event: PANEvent<UserData>) => {
      this.userData = event.detail;
      this.render();
    });
  }
}
```

### Shadow DOM Adoption

Version 2.0 encouraged Shadow DOM for style encapsulation.

**Before (1.x):**
```javascript
connectedCallback() {
  this.innerHTML = '<div class="container">Content</div>';
}
```

**After (2.0):**
```javascript
connectedCallback() {
  this.attachShadow({ mode: 'open' });
  this.shadowRoot.innerHTML = `
    <style>
      .container { padding: 1rem; }
    </style>
    <div class="container">Content</div>
  `;
}
```

**Migration Considerations:**
- Global styles won't penetrate Shadow DOM
- Use CSS custom properties for theming
- Update selectors in tests to query shadow roots
- Consider performance impact for large component trees

### Async Component Initialization

Version 2.0 added first-class async support.

**Before (1.x):**
```javascript
connectedCallback() {
  fetch('/api/data').then(data => {
    this.data = data;
    this.render();
  });
}
```

**After (2.0):**
```javascript
async connectedCallback() {
  await this.initialize();
}

async initialize() {
  try {
    this.data = await fetch('/api/data').then(r => r.json());
    this.render();
  } catch (error) {
    this.renderError(error);
  }
}
```

## Version 2.x to 3.0 Migration

LARC 3.0 focused on performance, introducing reactive primitives and optimized rendering.

### Reactive State Management

The new reactive state system replaces manual `render()` calls.

**Before (2.x):**
```javascript
class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  increment() {
    this.count++;
    this.render();
  }
}
```

**After (3.0):**
```javascript
import { reactive } from '@larc/core';

class Counter extends HTMLElement {
  constructor() {
    super();
    this.state = reactive({ count: 0 });
    this.state.$watch(() => this.render());
  }

  increment() {
    this.state.count++; // automatically triggers render
  }
}
```

**Migration Steps:**
1. Wrap component state in `reactive()`
2. Set up `$watch()` for automatic rendering
3. Remove manual `render()` calls after state changes
4. Use `$batch()` for multiple simultaneous updates

### PAN Bus Namespacing

Version 3.0 introduced event namespacing for better organization.

**Before (2.x):**
```javascript
this.pan.dispatch('data-loaded', data);
this.pan.dispatch('data-error', error);
this.pan.dispatch('data-cleared');
```

**After (3.0):**
```javascript
this.pan.dispatch('data:loaded', data);
this.pan.dispatch('data:error', error);
this.pan.dispatch('data:cleared');

// Subscribe to namespace
this.pan.subscribe('data:*', (event) => {
  console.log(`Data event: ${event.type}`);
});
```

### Performance Optimizations

Version 3.0 added batched updates and render scheduling.

**Manual Batching:**
```javascript
import { batch } from '@larc/core';

batch(() => {
  this.state.count++;
  this.state.name = 'Updated';
  this.state.timestamp = Date.now();
}); // Single render after all changes
```

**Render Scheduling:**
```javascript
class HeavyComponent extends HTMLElement {
  render() {
    requestIdleCallback(() => {
      // Expensive rendering during idle time
      this.updateComplexUI();
    });
  }
}
```

## Deprecation Timeline

### Currently Deprecated (Remove in 4.0)

**Legacy Event Syntax:**
```javascript
// Deprecated
this.pan.on('event-name', handler);

// Use instead
this.pan.subscribe('event-name', handler);
```

**Global Bus Access:**
```javascript
// Deprecated
window.PAN.dispatch('event');

// Use instead
this.pan.dispatch('event');
```

**Synchronous connectedCallback with async operations:**
```javascript
// Deprecated pattern
connectedCallback() {
  fetch('/data').then(d => this.data = d);
  this.render(); // Renders before data loads
}

// Preferred
async connectedCallback() {
  this.data = await fetch('/data').then(r => r.json());
  this.render();
}
```

### Planned Deprecations (4.0+)

- Direct innerHTML manipulation (prefer template literals or JSX)
- Imperative event listener registration (favor declarative templates)
- String-based event names (transition to strongly-typed event enums)

## Breaking Changes Checklist

When upgrading major versions, verify these common breaking change areas:

**API Surface:**
- [ ] Component registration method
- [ ] PAN bus method names
- [ ] Event payload structure
- [ ] Lifecycle callback signatures

**Behavior Changes:**
- [ ] Attribute parsing (automatic vs. manual)
- [ ] Default Shadow DOM usage
- [ ] Event bubbling and cancellation
- [ ] Async initialization timing

**Build Process:**
- [ ] Bundler configuration
- [ ] TypeScript compiler options
- [ ] Test framework compatibility
- [ ] Development server setup

**Dependencies:**
- [ ] Peer dependency versions
- [ ] Polyfill requirements
- [ ] Browser compatibility targets
- [ ] Third-party library compatibility

## Migration Tools

### Automated Refactoring

Use these tools to accelerate migration:

**AST-Based Transforms:**
```bash
npx @larc/migrate --from 2.x --to 3.0 src/**/*.js
```

**Codemod Scripts:**
```javascript
// Example: Convert emit to dispatch
module.exports = function(fileInfo, api) {
  const j = api.jscodeshift;
  return j(fileInfo.source)
    .find(j.CallExpression, {
      callee: {
        object: { type: 'ThisExpression' },
        property: { name: 'emit' }
      }
    })
    .forEach(path => {
      path.value.callee.property.name = 'dispatch';
    })
    .toSource();
};
```

### Manual Review Points

Automated tools can't catch everything. Manually review:

1. **Business Logic:** Ensure state changes behave identically
2. **Edge Cases:** Test error handling and boundary conditions
3. **Performance:** Profile before/after for regressions
4. **User Experience:** Verify visual consistency and interactions

## Rollback Strategy

If migration causes critical issues:

1. **Revert Version:** Use git to restore previous package.json
2. **Isolate Changes:** Create feature branches for incremental updates
3. **Dual Implementation:** Run old and new code side-by-side with feature flags
4. **Gradual Rollout:** Deploy to subset of users before full migration

## Getting Help

When stuck during migration:

- **Documentation:** Check version-specific upgrade guides at larc.dev/migrate
- **Community:** Ask in GitHub Discussions or Discord
- **Issue Tracker:** Search for similar migration problems
- **Support Contracts:** Enterprise users can access dedicated migration assistance

Migration is an investment in your application's future. Take time to understand changes, test thoroughly, and leverage community resources. The LARC team strives for smooth upgrade paths while continuing to evolve the framework.
