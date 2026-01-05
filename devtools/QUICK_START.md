# PAN DevTools Extension - Quick Start

## ✅ Configuration Complete!

The extension is now configured to load automatically with chrome-devtools MCP.

## 🔄 Next: Restart Claude Desktop

**IMPORTANT**: MCP server configuration only loads on startup.

1. **Quit Claude Desktop**: Cmd+Q (or File → Quit)
2. **Reopen Claude Desktop**: Launch from Applications
3. **Wait 5-10 seconds**: For MCP servers to initialize

## ✓ Verify Extension Loaded

After restart, when you use chrome-devtools tools, the extension will be loaded automatically.

### Test It

Use these commands in conversation with me:

```
Can you navigate to http://localhost:8080/playground/ and check if the PAN DevTools extension loaded?
```

I'll check for:
- Console message: `[PAN DevTools] Injected and monitoring PAN messages`
- API available: `window.__panDevTools`
- DevTools panel: "PAN" tab visible

## 📍 What Changed

**File**: `/Users/cdr/Library/Application Support/Claude/claude_desktop_config.json`

**Added**:
```json
"chrome-devtools": {
  "command": "npx",
  "args": [
    "chrome-devtools-mcp",
    "--chrome-arg=--load-extension=/Users/cdr/Projects/larc-repos/devtools",
    "--chrome-arg=--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools"
  ]
}
```

## 🎯 What You'll Get

### DevTools Panel
- Real-time PAN message display
- Message filtering and search
- Component inspection
- Message replay
- Statistics dashboard

### Console Logging
```
[PAN DevTools] Intercepted event: pan:publish
[PAN DevTools] Posting message to content script
```

### Browser API
```javascript
window.__panDevTools.getHistory()      // All messages
window.__panDevTools.getComponents()   // All components
window.__panDevTools.getStats()        // Statistics
window.__panDevTools.clearHistory()    // Clear logs
window.__panDevTools.replay(id)        // Replay message
```

## 🔍 How to Use

1. **Open Playground**: Navigate to `http://localhost:8080/playground/`
2. **Open DevTools**: Press F12 or Cmd+Option+I
3. **Find PAN Tab**: Look in top toolbar (between Elements, Console, etc.)
4. **Interact with Examples**: Load any example and interact with components
5. **Watch Messages**: See PAN messages appear in real-time

## 📚 Full Documentation

- **Extension Setup**: `EXTENSION_ENABLED.md`
- **Session Fixes**: `../playground/SESSION_FIXES_SUMMARY.md`
- **MCP Setup**: `CHROME_DEVTOOLS_MCP_EXTENSION_SETUP.md`

## 🎉 That's It!

Just restart Claude Desktop and the extension will work automatically with all chrome-devtools MCP tools!
