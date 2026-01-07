# 🚀 LARC Config Quick Start

## **5-Minute Setup**

### **1. Load the Config (Add to Your HTML)**

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Step 1: Load config -->
  <script type="module" src="/larc-config.mjs"></script>

  <!-- Step 2: Load autoloader -->
  <script type="module" src="/core/pan.mjs"></script>

  <!-- Step 3: Use components! -->
  <pan-card>Hello World</pan-card>
</body>
</html>
```

**That's it!** Components will auto-load using the configured paths.

---

## **Using Path Resolution in Scripts**

```javascript
import { paths } from '/larc-config.mjs';

// Resolve any alias
const path = paths.resolve('@larc/core', 'components/pan-client.mjs');

// Import dynamically
const { PanClient } = await import(path);

// Or use the global helper
const resolved = window.larcResolve('@larc/core', 'components/pan-bus.mjs');
```

---

## **Available Aliases**

| Alias | Development | Production |
|-------|------------|------------|
| `@larc/core` | `./core/src` | `https://unpkg.com/@larcjs/core@3.0.1/src` |
| `@larc/components` | `./components/src` | `https://unpkg.com/@larcjs/ui@3.0.1/src` |
| `@larc/examples` | `./examples` | `https://unpkg.com/@larcjs/examples@3.0.1` |
| `@larc/site` | `./site` | `https://larcjs.github.io/site` |

---

## **Common Patterns**

### **Pattern 1: Auto-Loading (Recommended)**
```html
<script type="module" src="/larc-config.mjs"></script>
<script type="module" src="/core/pan.mjs"></script>
<pan-data-table resource="users"></pan-data-table>
```

### **Pattern 2: Manual Import**
```javascript
import { paths } from '/larc-config.mjs';
const { PanClient } = await import(paths.resolve('@larc/core', 'components/pan-client.mjs'));
```

### **Pattern 3: Global Helper**
```html
<script type="module" src="/larc-config.mjs"></script>
<script>
  const path = window.larcResolve('@larc/components', 'components/pan-card.mjs');
  import(path).then(module => {
    // Use module
  });
</script>
```

---

## **Customize Config**

Edit `larc-config.mjs` to:
- Add your own components to `componentPaths`
- Change CDN URLs in `aliases`
- Add custom resolvers in `autoloadConfig`

---

## **Test Your Setup**

Open `/test-config.html` in your browser to verify everything works!

---

## **Need Help?**

📚 Full docs: [`README-CONFIG.md`](/README-CONFIG.md)

🧪 Test page: [`/test-config.html`](/test-config.html)

❓ Issues? Check browser console for errors
