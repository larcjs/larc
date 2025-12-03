# PAN Bus Monitor Fix

## Problem

The PAN Bus Monitor wasn't showing any events when components interacted. Testing with the drag-drop-list example showed no messages appearing in the monitor.

## Root Cause

The monitor was listening for the wrong event type. It was trying to hook into `dispatchEvent` and looking for `pan-message` events, but the actual PAN bus uses:
- `pan:publish` - When a message is published to the bus
- `pan:deliver` - When a message is delivered to a subscriber

The old code:
```javascript
// ❌ WRONG: Hooking dispatchEvent looking for 'pan-message'
bus.dispatchEvent = (event) => {
  if (event.type === 'pan-message') {
    this.logMessage(event.detail);
  }
  return this.originalDispatchEvent(event);
};
```

## Solution

Changed to properly listen for the actual PAN bus events using document-level event listeners:

```javascript
// ✅ CORRECT: Listen for actual PAN bus events
this.publishHandler = (event) => {
  if (event.detail && event.detail.topic) {
    this.logMessage({
      topic: event.detail.topic,
      data: event.detail.data,
      type: 'publish'
    });
  }
};

this.deliverHandler = (event) => {
  if (event.detail && event.detail.topic) {
    this.logMessage({
      topic: event.detail.topic,
      data: event.detail.data,
      type: 'deliver'
    });
  }
};

document.addEventListener('pan:publish', this.publishHandler, true);
document.addEventListener('pan:deliver', this.deliverHandler, true);
```

## How PAN Bus Actually Works

From the core PAN bus implementation (`core/src/components/pan-bus.mjs`):

### Publishing
When a component publishes a message:
```javascript
bus.publish(topic, data, options);
// Dispatches: 'pan:publish' event with { topic, data, ...options }
```

### Delivering
When the bus delivers to subscribers:
```javascript
target.dispatchEvent(new CustomEvent('pan:deliver', {
  detail: { topic, data, id, ts }
}));
```

### Why Two Event Types?

- **`pan:publish`** - Captures the intent to send (one per publish call)
- **`pan:deliver`** - Captures each delivery (multiple per publish if multiple subscribers)

This lets the monitor show both:
- What's being published (even if no subscribers)
- What's being delivered (shows the message flow)

## Enhancements Made

### 1. Message Type Display
Messages now show whether they're publish or deliver:
- 📤 PUBLISH - Green border (message sent)
- 📥 DELIVER - Blue border (message received)

### 2. Better Layout
```
┌────────────────────────────────────┐
│ 📤 PUBLISH          10:30:45 AM    │
├────────────────────────────────────┤
│ list.reorder                       │
│ {"items": [...], "from": 0}        │
└────────────────────────────────────┘
```

### 3. Improved Styling
- Header with type and timestamp
- Topic in monospace font
- Data with scrollable area (max 200px)
- Color-coded borders by message type
- Dark theme matching code panel

## Files Changed

### `components/pg-bus-monitor.mjs`
- **`startMonitoring()`**: Listen to `pan:publish` and `pan:deliver` on document
- **`stopMonitoring()`**: Clean up event listeners properly
- **`render()`**: Show message type (publish/deliver) with icons and header

### `styles/playground.css`
- Added `.bus-message-publish` - Green border for published messages
- Added `.bus-message-deliver` - Blue border for delivered messages
- Added `.bus-message-header` - Header layout for type and time
- Added `.bus-message-type` - Styled message type badge
- Updated `.bus-message-data` - Scrollable area, better formatting

## Testing

1. **Start playground:**
   ```bash
   cd playground
   python3 -m http.server 8080
   open http://localhost:8080/
   ```

2. **Load "Drag & Drop List" example:**
   - Click "Load Example..." dropdown
   - Select "Drag & Drop List"

3. **Open PAN Monitor:**
   - Click "PAN Monitor" button in header
   - Bottom panel should open

4. **Interact with the list:**
   - Drag and reorder items
   - Watch messages appear in monitor

5. **Verify:**
   - ✅ Messages appear immediately when dragging
   - ✅ Shows "📤 PUBLISH" messages
   - ✅ Shows "📥 DELIVER" messages
   - ✅ Topic is visible (e.g., `list.reorder`)
   - ✅ Data is formatted and readable
   - ✅ Timestamps are accurate

## Example Output

When dragging items in drag-drop-list, you should see:

```
📤 PUBLISH                           10:30:45.123
list.reorder
{"items": [{"id": 2, "text": "Item 2"}, {"id": 1, "text": "Item 1"}], "from": 0, "to": 1}

📥 DELIVER                           10:30:45.124
list.reorder
{"items": [{"id": 2, "text": "Item 2"}, {"id": 1, "text": "Item 1"}], "from": 0, "to": 1}
```

The PUBLISH shows the message being sent, and DELIVER shows it being received by subscribers.

## Why This Pattern?

### Using `capture: true`
```javascript
document.addEventListener('pan:publish', handler, true);
                                                  ^^^^
```

The `true` flag enables **capture phase** listening, which ensures we catch events before they bubble up, even if other handlers stop propagation.

### Document-level Listeners
PAN bus events bubble through the document, so listening at the document level catches all messages regardless of which component sent them.

### Proper Cleanup
```javascript
disconnectedCallback() {
  this.stopMonitoring(); // Remove listeners when monitor closes
}
```

This prevents memory leaks when the monitor is toggled on/off.

## Benefits

✅ **Actually works** - Messages now appear in real-time
✅ **Shows message flow** - See both publish and deliver events
✅ **Better debugging** - Understand which components are communicating
✅ **Visual distinction** - Color-coded by message type
✅ **Proper cleanup** - No memory leaks

The PAN Monitor is now fully functional for debugging component communication! 🎉
