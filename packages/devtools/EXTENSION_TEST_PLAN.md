# PAN Inspector Extension - Test Plan

## Prerequisites
- ✅ Claude Desktop config updated with extension flags
- ⏳ Claude Desktop restarted (Cmd+Q and reopen)

## Test 1: Verify Extension is Loaded

### Step 1.1: Check Chrome Process Arguments
```bash
# In terminal, run:
ps aux | grep "Google Chrome.app" | grep -v "Helper\|Renderer\|GPU" | head -1
```

**Expected:** Should see these flags in the output:
- `--enable-extensions`
- `--load-extension=/Users/cdr/Projects/larc-repos/devtools`
- `--disable-extensions-except=/Users/cdr/Projects/larc-repos/devtools`

**Status:** [ ] PASS [ ] FAIL

### Step 1.2: Check Chrome Extensions Page
```
1. Use chrome-devtools MCP to navigate to: chrome://extensions/
2. Look for "PAN Inspector" extension
```

**Expected:**
- Extension name: "PAN Inspector"
- Version: "1.0.0"
- Status: Enabled
- ID: (any valid extension ID)

**Status:** [ ] PASS [ ] FAIL

---

## Test 2: Verify Extension Injection

### Step 2.1: Load Playground
```
1. Start local HTTP server:
   cd /Users/cdr/Projects/larc-repos
   python3 -m http.server 8000 &

2. Navigate to: http://localhost:8000/playground/index.html
```

**Expected:** Playground loads without CORS errors

**Status:** [ ] PASS [ ] FAIL

### Step 2.2: Check Console for Extension Messages
```javascript
// Check browser console for:
[PAN DevTools] Injected and monitoring PAN messages
[PAN DevTools] Found PAN bus
```

**Expected:** Extension injection messages appear in console

**Status:** [ ] PASS [ ] FAIL

### Step 2.3: Verify Extension API
```javascript
// Run in browser console:
console.log(window.__panDevTools);
```

**Expected:** Should return an object with methods like:
```javascript
{
  version: "1.0.0",
  getMessages: function,
  clearMessages: function,
  // ... other API methods
}
```

**Status:** [ ] PASS [ ] FAIL

---

## Test 3: Verify DevTools Panel

### Step 3.1: Open Chrome DevTools
```
1. With playground loaded, press F12 or right-click → Inspect
2. Look for "PAN" tab in DevTools tabs row
```

**Expected:** "PAN" tab appears between existing DevTools tabs

**Status:** [ ] PASS [ ] FAIL

### Step 3.2: Open PAN Panel
```
1. Click the "PAN" tab
2. Observe the panel interface
```

**Expected:** Panel shows:
- Message counter (0 messages initially)
- Filter controls (text input, type checkboxes)
- Message table (empty initially)
- Control buttons (Pause/Resume, Clear, Export, Import)

**Status:** [ ] PASS [ ] FAIL

---

## Test 4: Capture PAN Messages

### Step 4.1: Add Component to Playground
```
1. In playground, click a component from sidebar (e.g., "Link")
2. Component should appear in canvas
3. Check PAN Inspector panel
```

**Expected:**
- Message counter increases
- Messages appear in table showing:
  - Type (publish/subscribe/deliver)
  - Topic
  - Timestamp
  - Data preview

**Status:** [ ] PASS [ ] FAIL

### Step 4.2: Inspect Message Details
```
1. Click on a message row in the table
2. Details panel should open on the right
```

**Expected:**
- Full message payload displayed
- JSON formatted with syntax highlighting
- "Replay Message" button visible
- "Copy as JSON" button visible

**Status:** [ ] PASS [ ] FAIL

### Step 4.3: Filter Messages
```
1. Type "component" in filter input
2. Observe message list updates
```

**Expected:** Only messages containing "component" are visible

**Status:** [ ] PASS [ ] FAIL

### Step 4.4: Toggle Message Types
```
1. Uncheck "Publish" checkbox
2. Observe message list updates
```

**Expected:** Publish messages are hidden, only subscribe/deliver visible

**Status:** [ ] PASS [ ] FAIL

---

## Test 5: Message Replay

### Step 5.1: Replay a Message
```
1. Select a publish message in the table
2. Click "Replay" button (or in details panel)
3. Check console and PAN monitor
```

**Expected:**
- Console shows: [PAN DevTools] Replaying message: {topic}
- Message is re-dispatched to PAN bus
- New delivery message appears in inspector

**Status:** [ ] PASS [ ] FAIL

---

## Test 6: Export/Import

### Step 6.1: Export Messages
```
1. Capture several messages by interacting with playground
2. Click "Export" button
3. Save JSON file
```

**Expected:**
- File download triggers
- Filename: pan-messages-{timestamp}.json
- File contains array of message objects

**Status:** [ ] PASS [ ] FAIL

### Step 6.2: Clear and Import
```
1. Click "Clear" button to remove all messages
2. Click "Import" button
3. Select the previously exported JSON file
```

**Expected:**
- Messages are restored from file
- Message count matches exported count
- All message details are preserved

**Status:** [ ] PASS [ ] FAIL

---

## Test 7: Recording Controls

### Step 7.1: Pause Recording
```
1. Click "Pause" button
2. Interact with playground (add/remove components)
3. Check message counter
```

**Expected:**
- Button changes to "Resume"
- No new messages appear while paused
- Message counter stays constant

**Status:** [ ] PASS [ ] FAIL

### Step 7.2: Resume Recording
```
1. Click "Resume" button
2. Interact with playground
```

**Expected:**
- Button changes back to "Pause"
- New messages start appearing again

**Status:** [ ] PASS [ ] FAIL

---

## Test 8: Load Example Project

### Step 8.1: Load Example with Rich Message Flow
```
1. In playground dropdown, select "Simple Store - Basic state management with pan-store"
2. Example loads in canvas
3. Interact with example (if it has buttons/inputs)
```

**Expected:**
- Multiple PAN messages captured:
  - store.state.changed
  - store.action.dispatch
  - Component subscriptions
- Messages show proper data structure
- Message flow is sequential and logical

**Status:** [ ] PASS [ ] FAIL

---

## Test 9: Performance Test

### Step 9.1: High Message Volume
```
1. Load "Dashboard Layout" example (has chart updates)
2. Let it run for ~30 seconds
3. Check PAN Inspector performance
```

**Expected:**
- Panel remains responsive
- Messages are captured correctly
- UI doesn't freeze or lag
- Message limit enforced (last 1000 messages)

**Status:** [ ] PASS [ ] FAIL

---

## Test 10: Edge Cases

### Step 10.1: Large Payload
```
1. Use console to publish large message:
   const bus = document.querySelector('pan-bus');
   const largeData = Array(1000).fill({ test: 'data' });
   bus.dispatchEvent(new CustomEvent('pan:publish', {
     detail: { topic: 'test.large', data: largeData }
   }));
```

**Expected:**
- Message is captured
- Payload is displayed correctly
- Data truncated in table view if too large
- Full data available in details panel

**Status:** [ ] PASS [ ] FAIL

### Step 10.2: Rapid Messages
```
1. Use console to publish many rapid messages:
   for(let i = 0; i < 100; i++) {
     const bus = document.querySelector('pan-bus');
     bus.dispatchEvent(new CustomEvent('pan:publish', {
       detail: { topic: `test.rapid.${i}`, data: { index: i } }
     }));
   }
```

**Expected:**
- All messages captured
- No messages lost
- Counter shows correct count
- Performance remains acceptable

**Status:** [ ] PASS [ ] FAIL

---

## Troubleshooting

### Extension Not Showing in chrome://extensions/

**Check:**
1. Chrome process has correct launch arguments
2. Extension path exists: `/Users/cdr/Projects/larc-repos/devtools/`
3. manifest.json is valid
4. Claude Desktop was fully restarted

**Solution:**
```bash
# Kill any Chrome processes
killall "Google Chrome"

# Restart Claude Desktop
# Extension should load on next chrome-devtools MCP use
```

### PAN Tab Not in DevTools

**Check:**
1. Extension is loaded in chrome://extensions/
2. devtools.html and devtools.js exist
3. manifest.json has "devtools_page": "devtools.html"

**Solution:**
```bash
# Reload extension
1. Go to chrome://extensions/
2. Find "PAN Inspector"
3. Click reload icon
4. Close and reopen DevTools
```

### No Messages Captured

**Check:**
1. Page has PAN bus: `document.querySelector('pan-bus')`
2. Extension injected: `window.__panDevTools` exists
3. Console shows extension messages
4. Recording not paused

**Solution:**
```javascript
// Test message manually
const bus = document.querySelector('pan-bus');
bus.dispatchEvent(new CustomEvent('pan:publish', {
  detail: { topic: 'test', data: { hello: 'world' } }
}));
// Should appear in PAN Inspector
```

---

## Success Criteria Summary

All tests pass when:
- [ ] Extension loads on Chrome startup
- [ ] PAN tab appears in DevTools
- [ ] Messages are captured in real-time
- [ ] Filtering works correctly
- [ ] Replay functionality works
- [ ] Export/Import works
- [ ] Recording controls work
- [ ] Performance is acceptable with many messages
- [ ] Edge cases handled gracefully

---

## Quick Verification Script

Run this after restart to quickly verify extension is working:

```javascript
// Copy-paste into browser console after loading playground

console.log('=== PAN Inspector Quick Verification ===');

// Test 1: Check API
if (window.__panDevTools) {
  console.log('✅ Extension API found');
  console.log('   Version:', window.__panDevTools.version);
} else {
  console.log('❌ Extension API NOT found');
}

// Test 2: Check PAN Bus
const bus = document.querySelector('pan-bus');
if (bus) {
  console.log('✅ PAN Bus found');
} else {
  console.log('❌ PAN Bus NOT found');
}

// Test 3: Send test message
if (bus && window.__panDevTools) {
  console.log('📤 Sending test message...');
  bus.dispatchEvent(new CustomEvent('pan:publish', {
    detail: { topic: 'devtools.test', data: { test: true, timestamp: Date.now() } }
  }));
  console.log('✅ Test message sent - check PAN Inspector panel');
} else {
  console.log('❌ Cannot send test message');
}

console.log('=== Check DevTools for "PAN" tab ===');
```

Expected output:
```
=== PAN Inspector Quick Verification ===
✅ Extension API found
   Version: 1.0.0
✅ PAN Bus found
📤 Sending test message...
✅ Test message sent - check PAN Inspector panel
=== Check DevTools for "PAN" tab ===
```

---

## Report Template

After completing tests, fill out:

```
Date: _______________
Tester: _______________

Tests Passed: ___ / 10
Tests Failed: ___ / 10

Critical Issues:
1.
2.
3.

Minor Issues:
1.
2.
3.

Notes:




Overall Status: [ ] Ready for Use [ ] Needs Fixes
```

---

## Next Steps After Testing

If all tests pass:
- ✅ Extension is ready for use
- ✅ Can test with real applications
- ✅ Can share with team

If tests fail:
- Review console errors
- Check extension logs in chrome://extensions/
- Review background service worker logs
- Create issue with reproduction steps
