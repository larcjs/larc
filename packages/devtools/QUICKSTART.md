# PAN Inspector - Quick Start Guide

## Installation (2 minutes)

### Step 1: Open Chrome Extensions
1. Open Chrome
2. Navigate to `chrome://extensions/`
3. Enable **"Developer mode"** (toggle in top right)

### Step 2: Load the Extension
1. Click **"Load unpacked"** button
2. Navigate to the `devtools/` directory of your LARC installation
3. Click **"Select"**

### Step 3: Verify
1. Look for "PAN Inspector" in extensions list
2. Should show green "Active" status
3. Icon should be visible

✅ **Extension installed!**

---

## First Use (1 minute)

### Step 1: Open a PAN Example
```bash
# Open any example with PAN components
open examples/02-todos-and-inspector.html
```

Or use any page with `<pan-bus>`.

### Step 2: Open DevTools
Press `F12` or:
- Mac: `Cmd + Option + I`
- Windows/Linux: `Ctrl + Shift + I`

### Step 3: Find the PAN Tab
Look for **"PAN"** tab in DevTools (may be in overflow menu ››)

### Step 4: Interact with Page
- Add a todo item
- Toggle a todo
- Watch messages appear in PAN Inspector!

✅ **You're using PAN Inspector!**

---

## Quick Test

### Minimal Test Page

Save this as `test-pan-inspector.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>PAN Inspector Test</title>
</head>
<body>
  <h1>PAN Inspector Test</h1>
  <button id="btn">Send Test Message</button>
  <div id="output"></div>

  <script type="module" src="../src/components/pan-bus.mjs"></script>
  <script type="module" src="../src/components/pan-client.mjs"></script>

  <pan-bus></pan-bus>

  <script type="module">
    import { PanClient } from '../src/components/pan-client.mjs';

    const client = new PanClient();
    await client.ready();

    let count = 0;

    document.getElementById('btn').onclick = () => {
      count++;
      client.publish({
        topic: 'test.click',
        data: {
          count,
          timestamp: Date.now(),
          message: `Test message #${count}`
        }
      });
    };

    client.subscribe('test.click', (msg) => {
      document.getElementById('output').innerHTML +=
        `<p>Received: ${msg.data.message}</p>`;
    });
  </script>
</body>
</html>
```

1. Open in Chrome
2. Open DevTools → PAN tab
3. Click "Send Test Message"
4. See it in PAN Inspector!

---

## Features to Try

### 1. Filtering
```
Type "test" in filter box
→ See only test messages
```

### 2. Message Details
```
Click any message row
→ Details panel opens on right
→ See full JSON payload
```

### 3. Replay
```
Click "Replay" on any message
→ Message sent again
→ Check console/output
```

### 4. Export/Import
```
Click "Export"
→ Download JSON file
Click "Import"
→ Load messages back
```

### 5. Pause/Resume
```
Click "Pause"
→ Messages stop appearing
Click "Resume"
→ Messages flow again
```

---

## Troubleshooting

### No PAN Tab?
1. Check extension is active: `chrome://extensions/`
2. Reload extension (click reload icon)
3. Close and reopen DevTools

### No Messages?
1. Check page has `<pan-bus>` or `<pan-bus-enhanced>`
2. Check console for errors
3. Try the test page above

### Extension Won't Load?
1. Chrome version 88+?
2. Check `chrome://extensions/` for errors
3. Make sure all files exist in folder

---

## Next Steps

1. ✅ Try with real examples: `examples/02-todos-and-inspector.html`
2. ✅ Test with enhanced bus: `examples/17-enhanced-security.html`
3. ✅ Read full README: `devtools-extension/README.md`
4. ✅ Report issues: GitHub Issues

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl/Cmd + K` | Focus filter |
| `Ctrl/Cmd + L` | Clear messages |
| `Space` | Pause/Resume |
| `Esc` | Close details |

---

## Getting Help

- 📖 Full README: [README.md](README.md)
- 🐛 Issues: [GitHub Issues](https://github.com/larcjs/devtools/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/larcjs/devtools/discussions)

---

**Happy debugging!** 🚀

