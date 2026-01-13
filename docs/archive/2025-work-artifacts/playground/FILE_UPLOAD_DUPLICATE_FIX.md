# File Upload Duplicate Events Fix

## Problem

In the File Upload Manager example, everything was happening twice:
- Uploading a file triggered two upload events
- PAN Monitor showed duplicate messages
- File appeared twice in the list

## Root Cause

The `file-upload` component had a cascading event listener problem:

### The Bug Chain

1. **`connectedCallback()`** calls `render()` and `setupEvents()` (lines 30-31)
2. **`render()`** also calls `setupEvents()` in a setTimeout (line 374)
3. **`attributeChangedCallback()`** calls `render()` whenever attributes change (line 35)
4. **Each `setupEvents()` call** added NEW event listeners without removing old ones

This meant:
- First render: 1 set of listeners
- Attribute change: 2 sets of listeners (original + new)
- Another change: 3 sets of listeners
- etc.

### Why It Happened

```javascript
// OLD CODE - BAD
connectedCallback() {
  this.render();        // Calls setupEvents()
  this.setupEvents();   // Calls setupEvents() AGAIN ❌
}

render() {
  this.shadowRoot.innerHTML = `...`;

  setTimeout(() => {
    this.setupEvents();  // Calls setupEvents() AGAIN ❌
    this.renderFileList();
  }, 0);
}

setupEvents() {
  const input = this.shadowRoot.querySelector('.file-input');

  if (input) {
    // Adds a NEW listener every time, never removes old ones ❌
    input.addEventListener('change', (e) => this.handleFiles(e.target.files));
  }
  // ... more listeners ...
}
```

## Solution

### 1. Remove Duplicate setupEvents() Call

```javascript
// NEW CODE - GOOD
connectedCallback() {
  this.render();  // This will call setupEvents()
  // Removed duplicate setupEvents() call ✅
}
```

### 2. Guard Against Multiple Setup Calls

```javascript
constructor() {
  super();
  this.attachShadow({ mode: 'open' });
  this.pc = new PanClient(this);
  this.files = [];
  this.boundHandlers = null; // Store handlers for cleanup ✅
}

setupEvents() {
  // Skip if already set up to prevent duplicate listeners ✅
  if (this.boundHandlers) return;

  const input = this.shadowRoot.querySelector('.file-input');
  const dropZone = this.shadowRoot.querySelector('.drop-zone');
  const browseBtn = this.shadowRoot.querySelector('.browse-btn');

  // Create bound handlers once ✅
  this.boundHandlers = {
    fileChange: (e) => this.handleFiles(e.target.files),
    browseClick: () => input?.click(),
    preventDefaults: (e) => {
      e.preventDefault();
      e.stopPropagation();
    },
    dragEnter: () => dropZone?.classList.add('drag-over'),
    dragLeave: () => dropZone?.classList.remove('drag-over'),
    drop: (e) => {
      dropZone?.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      this.handleFiles(files);
    }
  };

  // Use stored handlers ✅
  if (input) {
    input.addEventListener('change', this.boundHandlers.fileChange);
  }

  if (browseBtn) {
    browseBtn.addEventListener('click', this.boundHandlers.browseClick);
  }

  if (dropZone && this.dragDrop) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.boundHandlers.preventDefaults);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, this.boundHandlers.dragEnter);
    });

    dropZone.addEventListener('dragleave', this.boundHandlers.dragLeave);
    dropZone.addEventListener('drop', this.boundHandlers.drop);
  }
}
```

### 3. Reset Handlers on Re-render

```javascript
render() {
  // Reset handlers so setupEvents can run fresh ✅
  this.boundHandlers = null;

  this.shadowRoot.innerHTML = `...`;

  // Re-setup events after render
  if (this.isConnected) {
    setTimeout(() => {
      this.setupEvents();  // Now only runs once ✅
      this.renderFileList();
    }, 0);
  }
}
```

## How the Fix Works

### Before (Broken)
```
User uploads file
↓
3 event listeners fire (from 3 setupEvents() calls)
↓
handleFiles() runs 3 times
↓
3 upload events published
↓
File appears 3 times in list
```

### After (Fixed)
```
User uploads file
↓
1 event listener fires (setupEvents ran once)
↓
handleFiles() runs once
↓
1 upload event published
↓
File appears once in list
```

## Key Pattern: Guarded Event Setup

This pattern prevents duplicate event listeners:

```javascript
// 1. Store handlers in instance variable
this.boundHandlers = null;

// 2. Check if already set up
setupEvents() {
  if (this.boundHandlers) return;  // Skip if already done

  // 3. Create bound handlers once
  this.boundHandlers = { ... };

  // 4. Add listeners using stored handlers
  element.addEventListener('event', this.boundHandlers.handler);
}

// 5. Reset when re-rendering
render() {
  this.boundHandlers = null;  // Allow fresh setup
  // ... re-render ...
  this.setupEvents();  // Set up again with new elements
}
```

## Benefits

✅ **No duplicate events** - Each handler runs exactly once
✅ **Clean re-renders** - Resetting handlers allows proper re-setup
✅ **Better performance** - Not stacking up unused listeners
✅ **Easier debugging** - PAN Monitor shows correct message count

## Testing

### Before Fix
```
1. Load "File Upload Manager" example
2. Open PAN Monitor
3. Upload a file
4. See: 2+ "files.uploaded.upload" messages ❌
5. See: File appears multiple times in list ❌
```

### After Fix
```
1. Load "File Upload Manager" example
2. Open PAN Monitor
3. Upload a file
4. See: 1 "files.uploaded.upload" message ✅
5. See: File appears once in list ✅
6. Change attributes (e.g., toggle preview)
7. Upload another file
8. See: Still only 1 message per upload ✅
```

## Files Changed

### `/Users/cdr/Projects/larc-repos/ui/file-upload.mjs`

**Lines Changed:**
- Line 27: Added `this.boundHandlers = null;`
- Lines 30-31: Removed duplicate `setupEvents()` call from `connectedCallback()`
- Lines 45-90: Complete rewrite of `setupEvents()` with guard and bound handlers
- Lines 205-206: Reset `boundHandlers` in `render()`

## Related Issues

This same pattern could affect other components that:
- Call `setupEvents()` from multiple places
- Re-render frequently (attribute changes)
- Don't remove old event listeners

### Potential Candidates to Check
- `drag-drop-list` - Has drag event listeners
- `pan-markdown-editor` - Has input event listeners
- `pan-search-bar` - Has input event listeners
- `pan-date-picker` - Has calendar event listeners

## Prevention Pattern

For new components, follow this pattern:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.handlers = null;  // Guard variable
  }

  connectedCallback() {
    this.render();  // Only render
  }

  setupEvents() {
    if (this.handlers) return;  // Guard

    this.handlers = {
      // Store bound handlers
      click: () => this.handleClick(),
      input: (e) => this.handleInput(e)
    };

    // Use stored handlers
    this.shadowRoot.querySelector('.btn')
      .addEventListener('click', this.handlers.click);
  }

  render() {
    this.handlers = null;  // Reset for re-render
    this.shadowRoot.innerHTML = `...`;
    this.setupEvents();  // Set up once
  }
}
```

## Summary

The file upload duplicate events issue was caused by:
1. Multiple calls to `setupEvents()`
2. No guard against adding duplicate listeners
3. No cleanup of old listeners

Fixed by:
1. Removing duplicate `setupEvents()` call
2. Adding guard check (`if (this.boundHandlers) return`)
3. Storing bound handlers for reuse
4. Resetting handlers on re-render

The fix ensures each event listener is added exactly once per render cycle.
