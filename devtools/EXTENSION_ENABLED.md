# PAN DevTools Extension - Now Enabled! ✅

## What We Fixed

The chrome-devtools MCP server is now configured to load the PAN DevTools extension automatically when launching Chrome.

## Configuration Applied

Updated: `/Users/cdr/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": [
        "chrome-devtools-mcp",
        "--chrome-arg=--load-extension=/Users/cdr/Projects/larc-repos/devtools",
        "--chrome-arg=--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools"
      ]
    }
  }
}
```

## How It Works

### The Solution
The chrome-devtools-mcp server uses **Puppeteer** (not Playwright) and supports passing custom Chrome arguments via `--chrome-arg`.

**Key Arguments**:
1. `--load-extension=/path/to/extension` - Tells Chrome to load the specified extension
2. `--disable-extensions-except=/path/to/extension` - Disables all other extensions except this one

### Why This Works
From the chrome-devtools-mcp source code (`browser.js` line 72-98):

```javascript
const args = [
  ...(options.args ?? []),  // <-- Custom args passed here
  '--hide-crash-restore-bubble',
];

const browser = await puppeteer.launch({
  channel: puppeteerChannel,
  targetFilter: makeTargetFilter(),
  executablePath,
  defaultViewport: null,
  userDataDir,
  pipe: true,
  headless,
  args,  // <-- Args applied to Chrome launch
  acceptInsecureCerts: options.acceptInsecureCerts,
  handleDevToolsAsPage: true,
});
```

The `--chrome-arg` CLI option (defined in `cli.js` line 135-138) allows passing any Chrome command-line flag.

## Next Steps

### 1. Restart Claude Desktop
The MCP server configuration is only loaded when Claude Desktop starts. You need to:
1. **Quit Claude Desktop completely** (Cmd+Q)
2. **Reopen Claude Desktop**
3. Wait for MCP servers to initialize

### 2. Test the Extension

Once restarted, use the chrome-devtools MCP tools:

```javascript
// Navigate to playground
mcp__chrome-devtools__navigate_page({ type: "url", url: "http://localhost:8080/playground/" })

// Load an example (e.g., Drag & Drop List)
// Then check console for extension logs
mcp__chrome-devtools__list_console_messages()
```

**Expected Console Output**:
```
[PAN DevTools] Injected and monitoring PAN messages
```

### 3. Verify Extension Loaded

Check that the extension API is available:

```javascript
mcp__chrome-devtools__evaluate_script({
  function: "() => { return { devTools: window.__panDevTools ? 'loaded' : 'missing' }; }"
})
```

**Expected Result**:
```json
{"devTools": "loaded"}
```

### 4. Check DevTools Panel

1. Open Chrome DevTools (F12 or Cmd+Option+I)
2. Look for the **"PAN"** tab in the top toolbar
3. Interact with playground components
4. See PAN messages appear in real-time

## Extension Features

Once loaded, the PAN DevTools extension provides:

### Console Logging
```
[PAN DevTools] Intercepted event: pan:publish {topic: "list.reorder", ...}
[PAN DevTools] Posting message to content script: {...}
```

### DevTools Panel
- Real-time message display
- Message filtering by type/topic
- Component inspection
- Message replay capability
- Statistics dashboard

### Browser API
Available at `window.__panDevTools`:
```javascript
window.__panDevTools.getHistory()      // Get all captured messages
window.__panDevTools.clearHistory()    // Clear message history
window.__panDevTools.getComponents()   // List all PAN components
window.__panDevTools.getStats()        // Get message statistics
window.__panDevTools.replay(messageId) // Replay a specific message
```

## Troubleshooting

### Extension Not Loading

If you don't see the extension after restart:

1. **Check Chrome launched by MCP**:
   - Use chrome-devtools tools to navigate to `chrome://extensions/`
   - Verify PAN DevTools appears in the list

2. **Check console for errors**:
   ```javascript
   mcp__chrome-devtools__list_console_messages()
   ```
   Look for extension-related errors

3. **Verify extension path**:
   ```bash
   ls -la /Users/cdr/Projects/larc-repos/devtools/manifest.json
   ```
   Should exist and be readable

4. **Check manifest.json is valid**:
   ```bash
   cat /Users/cdr/Projects/larc-repos/devtools/manifest.json | jq .
   ```
   Should parse without errors

### Extension Loads But No Messages

If extension loads but doesn't capture messages:

1. **Check injected script loaded**:
   - Console should show: `[PAN DevTools] Injected and monitoring PAN messages`
   - If missing, check content script injection in manifest.json

2. **Verify PAN Bus is active**:
   - Console should show: `[PAN Bus] PAN Bus Enhanced ready`
   - Components should register: `[PAN Bus] Client registered`

3. **Check event listeners**:
   ```javascript
   // In console
   console.log('pan:publish listeners:',
     getEventListeners(document)['pan:publish']?.length || 0
   );
   ```

## Alternative: Manual Testing

To test the extension outside of MCP:

```bash
# Launch Chrome with extension manually
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --load-extension=/Users/cdr/Projects/larc-repos/devtools \
  --disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools \
  --user-data-dir=/tmp/chrome-extension-test \
  http://localhost:8080/playground/
```

## Configuration Options

### Use a Persistent User Data Directory

To maintain extension settings across sessions:

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "chrome-devtools-mcp",
      "--chrome-arg=--load-extension=/Users/cdr/Projects/larc-repos/devtools",
      "--chrome-arg=--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools",
      "--user-data-dir=/Users/cdr/.chrome-devtools-profile"
    ]
  }
}
```

### Launch with DevTools Open

Auto-open DevTools on each page:

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "chrome-devtools-mcp",
      "--chrome-arg=--load-extension=/Users/cdr/Projects/larc-repos/devtools",
      "--chrome-arg=--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools",
      "--chrome-arg=--auto-open-devtools-for-tabs"
    ]
  }
}
```

### Use Chrome Canary

If you want to test with Chrome Canary:

```json
{
  "chrome-devtools": {
    "command": "npx",
    "args": [
      "chrome-devtools-mcp",
      "--channel=canary",
      "--chrome-arg=--load-extension=/Users/cdr/Projects/larc-repos/devtools",
      "--chrome-arg=--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools"
    ]
  }
}
```

## Technical Details

### MCP Server Architecture

```
Claude Desktop
    ↓
claude_desktop_config.json
    ↓
npx chrome-devtools-mcp (with --chrome-arg flags)
    ↓
Puppeteer.launch(args: [...custom chrome args])
    ↓
Chrome Browser (with PAN DevTools extension loaded)
```

### Extension Components

1. **manifest.json** - Extension configuration (Manifest V3)
2. **injected.js** - Runs in page context, intercepts PAN events
3. **content-script.js** - Bridge between page and extension
4. **devtools.js** - Creates DevTools panel
5. **panel.html** - DevTools panel UI

### Message Flow

```
Component publishes PAN message
    ↓
document.dispatchEvent(new CustomEvent('pan:publish', ...))
    ↓
injected.js intercepts via EventTarget.prototype.dispatchEvent
    ↓
window.postMessage({ type: 'PAN_MESSAGE', data: ... })
    ↓
content-script.js receives message
    ↓
chrome.runtime.sendMessage() to background/devtools
    ↓
DevTools panel displays message
```

## Benefits

### Before Configuration
- ❌ Extension not loading
- ❌ No DevTools panel
- ❌ Manual reload required
- ✅ PAN Monitor works (in-page alternative)

### After Configuration
- ✅ Extension loads automatically
- ✅ DevTools panel available
- ✅ Real-time message capture
- ✅ No manual intervention needed
- ✅ PAN Monitor still works (both tools available)

## Summary

The PAN DevTools extension is now properly configured to load with the chrome-devtools MCP server. After restarting Claude Desktop, you'll have full DevTools integration for debugging PAN messages in the playground!

**Key Achievement**: We discovered that chrome-devtools-mcp already supports custom Chrome args, so no source code modification was needed - just proper configuration! 🎉
