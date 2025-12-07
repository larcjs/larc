# Chrome DevTools MCP Extension Setup

## Problem

The chrome-devtools MCP server launches Chrome via Playwright, which **does not load extensions by default**. This is why the PAN DevTools extension doesn't appear when using the MCP tools.

## Solution

To enable extension support, the chrome-devtools MCP server needs to be configured with specific Playwright launch arguments.

## Required Changes

### 1. Playwright Launch Method

Change from `browser.launch()` to `browser.launchPersistentContext()`:

```javascript
// ❌ WRONG - Default launch (no extensions)
const browser = await chromium.launch({
  headless: false
});

// ✅ CORRECT - Persistent context (supports extensions)
const context = await chromium.launchPersistentContext(userDataDir, {
  headless: false,
  args: [
    `--load-extension=${extensionPath}`,
    '--disable-extensions-except=' + extensionPath
  ]
});
```

### 2. Extension Path Configuration

The chrome-devtools MCP server needs to know where your PAN DevTools extension is located:

```javascript
const extensionPath = '/Users/cdr/Projects/larc-repos/devtools';
```

### 3. User Data Directory

`launchPersistentContext` requires a user data directory for Chrome profile storage:

```javascript
const userDataDir = path.join(os.tmpdir(), 'chrome-devtools-mcp-profile');
```

## MCP Server Configuration

If you control the chrome-devtools MCP server configuration, add these options:

### Option 1: Environment Variables

```bash
export CHROME_EXTENSION_PATH="/Users/cdr/Projects/larc-repos/devtools"
export CHROME_USER_DATA_DIR="/tmp/chrome-devtools-mcp-profile"
```

### Option 2: MCP Server Config

Update your MCP server configuration (typically in `~/.claude/claude_desktop_config.json` or similar):

```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["@executeautomation/chrome-devtools-mcp"],
      "env": {
        "CHROME_EXTENSION_PATH": "/Users/cdr/Projects/larc-repos/devtools",
        "CHROME_USER_DATA_DIR": "/tmp/chrome-devtools-mcp-profile"
      }
    }
  }
}
```

### Option 3: Fork and Modify

If the MCP server doesn't support extension configuration:

1. Fork the chrome-devtools MCP server repository
2. Modify the Playwright launch code
3. Use your forked version

## Code Changes Needed

In the chrome-devtools MCP server source (typically `src/index.ts` or similar):

```typescript
// Before:
async function launchBrowser() {
  const browser = await chromium.launch({
    headless: false,
    args: ['--disable-blink-features=AutomationControlled']
  });
  return browser;
}

// After:
async function launchBrowser(extensionPath?: string) {
  const userDataDir = path.join(os.tmpdir(), 'chrome-devtools-mcp-profile');

  const launchArgs = [
    '--disable-blink-features=AutomationControlled'
  ];

  if (extensionPath && fs.existsSync(extensionPath)) {
    launchArgs.push(
      `--load-extension=${extensionPath}`,
      `--disable-extensions-except=${extensionPath}`
    );
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: launchArgs
  });

  return context;
}
```

## Alternative: Manual Chrome Instance

If modifying the MCP server isn't feasible, you can test extensions manually:

```bash
# Launch Chrome with extension loaded
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --load-extension=/Users/cdr/Projects/larc-repos/devtools \
  --disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools \
  --user-data-dir=/tmp/chrome-test-profile \
  http://localhost:8080/playground/
```

## Testing Extension Loading

After configuration, verify the extension loads:

1. Open DevTools Console
2. Check for: `[PAN DevTools] Injected and monitoring PAN messages`
3. Check `window.__panDevTools` exists:
   ```javascript
   console.log(window.__panDevTools);
   // Should show: {getHistory: ƒ, clearHistory: ƒ, getComponents: ƒ, ...}
   ```

## Current Workaround

Until the MCP server is configured for extensions, use the **in-page PAN Bus Monitor**:

```html
<pg-bus-monitor></pg-bus-monitor>
```

This component works independently and doesn't require Chrome extensions.

## References

- [Playwright Extensions Documentation](https://playwright.dev/docs/chrome-extensions)
- [Chrome Extension Development](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- PAN DevTools Extension: `/Users/cdr/Projects/larc-repos/devtools/`

## Files Involved

- **Extension Source**: `/Users/cdr/Projects/larc-repos/devtools/`
  - `manifest.json` - Extension manifest
  - `src/injected.js` - Injected script for intercepting PAN events
  - `src/content-script.js` - Content script bridge
  - `src/devtools.js` - DevTools panel
  - `src/panel.html` - DevTools UI

- **MCP Server**: chrome-devtools MCP (external package)
  - Needs modification to support `--load-extension` flag
  - Needs to use `launchPersistentContext` instead of `launch`

## Next Steps

1. **Identify chrome-devtools MCP server location**
   ```bash
   npm list -g @executeautomation/chrome-devtools-mcp
   # or
   which chrome-devtools-mcp
   ```

2. **Check if it supports extension configuration**
   - Look for environment variables
   - Check documentation
   - Review source code

3. **Either**:
   - Add environment variables for extension path
   - Fork and modify the server
   - Use manual Chrome launch for testing

4. **Verify**:
   - Extension appears in `chrome://extensions/`
   - Console shows `[PAN DevTools] Injected...`
   - DevTools panel shows "PAN" tab
   - Messages appear when interacting with components
