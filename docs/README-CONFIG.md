# LARC Configuration System

Centralized path management for the LARC monorepo, eliminating hardcoded relative paths and enabling easy switching between development and production environments.

## 🎯 **Why Use This?**

**Before:**
```javascript
// ❌ Hardcoded, breaks when file moves
import { PanClient } from '../../../../core/pan-client.mjs';
import '../../../components/pan-card.mjs';
```

**After:**
```javascript
// ✅ Clean, portable, environment-aware
import { paths } from '/larc-config.mjs';
const PanClient = await import(paths.resolve('@larc/core', 'components/pan-client.mjs'));

// Or even simpler with autoload
<pan-card></pan-card>  <!-- Automatically resolves and loads -->
```

---

## 📦 **Setup**

### Option 1: Manual Import (In Your Scripts)

```html
<script type="module">
  import { paths } from '/larc-config.mjs';

  // Use paths to resolve imports
  const { PanClient } = await import(paths.resolve('@larc/core', 'components/pan-client.mjs'));
  const client = new PanClient();
</script>
```

### Option 2: With Autoloader (Automatic)

```html
<!DOCTYPE html>
<html>
<head>
  <title>My LARC App</title>
</head>
<body>
  <!-- 1. Load config first -->
  <script type="module" src="/larc-config.mjs"></script>

  <!-- 2. Load autoloader (it will use the config) -->
  <script type="module" src="/core/pan.mjs"></script>

  <!-- 3. Use components - they load automatically! -->
  <pan-bus></pan-bus>
  <pan-card>
    <h2>Hello World</h2>
  </pan-card>

  <script type="module">
    // Config is available globally
    const resolved = window.larcResolve('@larc/core', 'components/pan-client.mjs');
    console.log(resolved);
  </script>
</body>
</html>
```

### Option 3: Import Map (Modern Browsers)

```html
<script type="importmap">
{
  "imports": {
    "@larc/core/": "./core/",
    "@larc/components/": "./components/",
    "pan-bus": "./core/pan-bus.mjs",
    "pan-client": "./core/pan-client.mjs"
  }
}
</script>

<script type="module">
  // Now you can use clean imports!
  import { PanClient } from 'pan-client';
  import '@larc/core/pan-bus.mjs';
</script>
```

---

## 🔧 **Configuration**

The `larc-config.mjs` file defines:

### **Aliases**

Aliases map short names to actual paths, automatically switching between dev and production:

```javascript
export const aliases = {
  '@larc/core': isDevelopment
    ? './core/src'                                    // Local dev
    : 'https://unpkg.com/@larcjs/core@2.0.0/src',    // Production CDN

  '@larc/components': isDevelopment
    ? './components/src'
    : 'https://unpkg.com/@larcjs/components@2.0.0/src',
};
```

### **Component Mappings**

Explicit mappings for components used by the autoloader:

```javascript
export const componentPaths = {
  'pan-bus': '@larc/core/pan-bus.mjs',
  'pan-card': '@larc/components/pan-card.mjs',
  'pan-data-table': '@larc/components/pan-data-table.mjs',
  // ... more components
};
```

### **Path Resolver**

The `paths` utility provides methods for resolving paths:

```javascript
// Resolve an alias
paths.resolve('@larc/core', 'components/pan-bus.mjs');
// Dev:  => './core/pan-bus.mjs'
// Prod: => 'https://unpkg.com/@larcjs/core@2.0.0/pan-bus.mjs'

// Get a component path
paths.component('pan-card');
// => './components/pan-card.mjs' (dev)

// Join paths
paths.join('./base/', 'subpath/file.mjs');
// => './base/subpath/file.mjs'
```

---

## 📝 **Usage Examples**

### **Example 1: Dynamic Import with Path Resolution**

```javascript
import { paths } from '/larc-config.mjs';

// Resolve and import
const panClientPath = paths.resolve('@larc/core', 'components/pan-client.mjs');
const { PanClient } = await import(panClientPath);

const client = new PanClient();
client.publish('app.ready', { timestamp: Date.now() });
```

### **Example 2: Building Import URLs**

```html
<script type="module">
  import { paths } from '/larc-config.mjs';

  // Build imports dynamically
  const components = ['pan-card', 'pan-modal', 'pan-tabs'];

  for (const comp of components) {
    const path = paths.component(comp);
    await import(path);
  }
</script>
```

### **Example 3: Using Global Helper**

```html
<script type="module" src="/larc-config.mjs"></script>
<script type="module">
  // After loading config, use the global helper
  const corePath = window.larcResolve('@larc/core');
  console.log('Core is at:', corePath);

  // Load a specific file
  const clientPath = window.larcResolve('@larc/core', 'components/pan-client.mjs');
  const { PanClient } = await import(clientPath);
</script>
```

### **Example 4: Component with Auto-Loading**

```html
<!-- No imports needed! Config + autoloader handles it -->
<script type="module" src="/larc-config.mjs"></script>
<script type="module" src="/core/pan.mjs"></script>

<pan-data-table resource="users"></pan-data-table>
<pan-form resource="users"></pan-form>

<!-- Components load automatically when they enter viewport -->
```

---

## 🌍 **Environment Detection**

The config automatically detects the environment:

```javascript
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.protocol === 'file:';
```

- **Development**: Uses relative paths (`./core/src`, `./components/src`)
- **Production**: Uses CDN URLs (`https://unpkg.com/@larcjs/...`)

---

## ⚙️ **Customizing the Config**

### **Per-Page Override**

Override config before loading the main config:

```html
<script>
  // Set custom paths before loading config
  window.panAutoload = {
    baseUrl: 'https://my-cdn.com/larc/',
    componentsPath: 'my-components/'
  };
</script>
<script type="module" src="/larc-config.mjs"></script>
```

### **Custom Component Paths**

Add your own components to the mapping:

```javascript
// In larc-config.mjs
export const componentPaths = {
  // ... existing mappings

  // Your custom components
  'my-widget': './my-app/components/my-widget.mjs',
  'my-dialog': '@larc/components/my-dialog.mjs',
};
```

### **Custom Resolver**

Provide your own resolution logic:

```javascript
export const autoloadConfig = {
  // ... other config

  resolveComponent(tagName) {
    // Custom logic for resolving component paths
    if (tagName.startsWith('my-')) {
      return `./custom/${tagName}.mjs`;
    }
    // Return null to fall back to default behavior
    return null;
  }
};
```

---

## 🚀 **Benefits**

1. **✅ No Hardcoded Paths** - All paths are configurable
2. **✅ Environment Aware** - Auto-switches dev/prod
3. **✅ Centralized** - One place to manage all paths
4. **✅ CDN Ready** - Easy production deployment
5. **✅ Portable** - Move files without breaking imports
6. **✅ Zero Build** - Still no build step required
7. **✅ Backward Compatible** - Existing code still works

---

## 📚 **API Reference**

### **`paths.resolve(aliasOrPath, subpath?)`**
Resolves an alias or path to an absolute URL.
- **Parameters:**
  - `aliasOrPath` (string): Alias like `'@larc/core'` or a path
  - `subpath` (string, optional): Subpath to append
- **Returns:** (string) Resolved URL

### **`paths.component(componentName)`**
Gets the path for a specific component.
- **Parameters:**
  - `componentName` (string): Component tag name (e.g., `'pan-card'`)
- **Returns:** (string) Resolved component path

### **`paths.join(base, path)`**
Joins two path segments correctly.
- **Parameters:**
  - `base` (string): Base path
  - `path` (string): Path to append
- **Returns:** (string) Joined path

### **`window.larcResolve(aliasOrPath, subpath?)`**
Global helper function (same as `paths.resolve`).

---

## 🔍 **Debugging**

Check the loaded configuration:

```javascript
// In browser console
console.log(window.panAutoload);
// Shows: { config, paths, aliases, componentPaths, ... }

// Check a specific alias
console.log(window.panAutoload.aliases['@larc/core']);

// Test path resolution
console.log(window.larcResolve('@larc/core', 'components/pan-bus.mjs'));
```

---

## 📖 **Migration Guide**

To migrate existing code to use the config system:

### **Step 1: Load the Config**

Add to your HTML:
```html
<script type="module" src="/larc-config.mjs"></script>
```

### **Step 2: Option A - Keep Using Autoloader**

If you're using custom elements, no changes needed! The autoloader will use the config automatically.

### **Step 3: Option B - Update Manual Imports**

Replace hardcoded paths:

```javascript
// Before
import { PanClient } from '../../../core/pan-client.mjs';

// After
import { paths } from '/larc-config.mjs';
const { PanClient } = await import(paths.resolve('@larc/core', 'components/pan-client.mjs'));

// Or use window.larcResolve in non-module scripts
const path = window.larcResolve('@larc/core', 'components/pan-client.mjs');
const { PanClient } = await import(path);
```

---

## 💡 **Tips**

1. **Load config before autoloader** - The autoloader will pick up the config automatically
2. **Use aliases in new code** - Makes it easier to refactor later
3. **Test both environments** - Make sure dev and prod paths work
4. **Document custom components** - Add them to componentPaths for clarity
5. **Consider import maps** - Modern browsers support them natively

---

## 🐛 **Troubleshooting**

### **Component not loading?**

1. Check if it's in `componentPaths` mapping
2. Verify the path with `paths.component('your-component')`
3. Check browser console for autoloader warnings

### **Wrong path in production?**

1. Check `isDevelopment` detection logic
2. Verify CDN URLs in `aliases`
3. Test with `window.location.hostname`

### **Config not loading?**

1. Load config before other modules
2. Check for JavaScript errors
3. Verify `larc-config.mjs` is accessible

---

**Need help?** Open an issue on GitHub or check the examples in `/examples/` directory.
