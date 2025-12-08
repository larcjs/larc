# @larcjs/core-debug

[![Version](https://img.shields.io/npm/v/@larcjs/core-debug.svg)](https://www.npmjs.com/package/@larcjs/core-debug)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Bundle Size](https://img.shields.io/badge/bundle-3KB%20minified-blue.svg)](#)

> **Debug and tracing tools** - Advanced debugging capabilities for PAN messages

Add comprehensive debugging and message tracing to LARC Core or Core Lite. Essential for development and troubleshooting complex message flows.

## Installation

```bash
# Requires @larcjs/core or @larcjs/core-lite
npm install @larcjs/core-debug
```

## Quick Start

```html
<pan-bus debug="true" enable-tracing="true"></pan-bus>

<script type="module">
import '@larcjs/core-debug';

// Access debug manager
const debug = window.pan.debug;

// Enable tracing
debug.enableTracing();

// View message history
console.log(debug.getMessageHistory());

// Export state snapshot
const snapshot = debug.captureSnapshot();
console.log(JSON.stringify(snapshot, null, 2));
</script>
```

## Features

- 🔍 **Message Tracing** - Track all messages with full metadata
- 📊 **Performance Metrics** - Handler duration, message sizes
- 📸 **State Snapshots** - Export/import complete bus state
- 🎯 **Filtering** - Filter messages by topic patterns
- ⏱️ **Timeline** - View message history with timestamps
- 📦 **Export/Import** - Save and restore state for debugging

## API Reference

### debug.enableTracing()

Start tracking all messages.

```javascript
window.pan.debug.enableTracing();
```

### debug.disableTracing()

Stop tracking messages.

```javascript
window.pan.debug.disableTracing();
```

### debug.getMessageHistory(filter?)

Get tracked messages, optionally filtered.

```javascript
// All messages
const all = debug.getMessageHistory();

// Filtered by topic pattern
const filtered = debug.getMessageHistory('user.*');
```

### debug.captureSnapshot()

Capture current bus state.

```javascript
const snapshot = debug.captureSnapshot();
// Returns: { timestamp, messages, retained, subscriptions, stats }
```

### debug.clear()

Clear message history.

```javascript
debug.clear();
```

## Usage with <pan-inspector>

The debug manager powers the `<pan-inspector>` component:

```html
<pan-inspector></pan-inspector>
```

Features:
- Real-time message monitoring
- State tree visualization
- Performance metrics dashboard
- Export/import state snapshots

## Development Workflow

### 1. Enable Debug Mode

```html
<pan-bus debug="true" enable-tracing="true"></pan-bus>
```

### 2. Monitor Messages

```javascript
// Watch console for debug logs
// [PAN Bus] Published { topic: 'user.login', delivered: 3, routes: 1 }
```

### 3. Inspect State

```javascript
// View current retained state
const state = debug.captureSnapshot();
console.table(state.retained);
```

### 4. Export for Bug Reports

```javascript
// Export state snapshot for sharing
const snapshot = debug.captureSnapshot();
navigator.clipboard.writeText(JSON.stringify(snapshot, null, 2));
```

## Performance Impact

- **Overhead:** ~5% when tracing enabled
- **Memory:** Stores last 1000 messages (configurable)
- **Production:** Automatically stripped in minified builds

## Bundle Size

- **Minified:** 3.0KB
- **Gzipped:** ~1KB

## Related Packages

- **[@larcjs/core](../../core)** — Full-featured PAN bus (includes debug)
- **[@larcjs/core-lite](../core-lite)** — Lightweight bus (use this package to add debug)
- **[@larcjs/core-routing](../core-routing)** — Message routing system
- **[@larcjs/devtools](../../devtools)** — Chrome DevTools extension

## License

MIT © Chris Robison
