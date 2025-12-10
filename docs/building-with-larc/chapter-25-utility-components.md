# Utility Components

> "The best debugging tool is still careful thought, coupled with judiciously placed print statements."
>
> — Brian Kernighan

Utility components are the unsung heroes of application development. They don't render UI, manage state, or fetch data. Instead, they provide infrastructure: observability, message routing, cross-system integration. They're the scaffolding that makes complex applications comprehensible and maintainable.

This chapter documents LARC's utility components: `pan-debug` for message tracing and debugging, and `pan-forwarder` for HTTP message forwarding. These components help you understand what's happening in your application and extend it beyond the browser.

## Overview

LARC provides two utility components:

- **pan-debug**: Message tracing and debugging utilities for introspection
- **pan-forwarder**: HTTP message forwarding for server integration

These components operate at the infrastructure level. `pan-debug` observes message flows without altering them, while `pan-forwarder` bridges LARC's in-browser message bus to external systems via HTTP. Together, they provide visibility into your application's behavior and pathways to external integration.

## pan-debug: Message Tracing and Debugging

### Overview

`pan-debug` is not a custom element—it's a JavaScript class (`PanDebugManager`) that provides introspection and debugging capabilities for PAN message flows. It tracks messages as they pass through the bus, records routing decisions, captures errors, and provides query capabilities for analysis.

Think of it as flight data recorder for your message bus. When something goes wrong—a message disappears, a route doesn't fire, a handler throws an error—the trace buffer tells you exactly what happened.

### When to Use

**Use `pan-debug` when:**

- Debugging routing issues or missing messages
- Profiling message throughput and patterns
- Investigating performance bottlenecks in message handling
- Building developer tools or admin dashboards
- Diagnosing production issues (with sampling to minimize overhead)

**Don't use `pan-debug` when:**

- Building production applications (unless explicitly needed for diagnostics)
- Memory is constrained (trace buffer can grow large)
- You need real-time streaming of every message (sampling is more appropriate)

### Installation and Setup

`pan-debug` is typically integrated into `pan-bus`. Access it via the global API after the bus is ready:

```javascript
// Wait for bus readiness
await new Promise(resolve => {
  if (window.__panReady) resolve();
  else window.addEventListener('pan:sys.ready', resolve, { once: true });
});

// Access debug manager
const debug = window.pan.debug;
```

Alternatively, import the class directly:

```javascript
import { PanDebugManager } from './pan-debug.mjs';

const debug = new PanDebugManager();
```

Enable tracing to start capturing messages:

```javascript
// Enable with defaults (1000 message buffer, 100% sampling)
debug.enableTracing();

// Enable with custom configuration
debug.enableTracing({
  maxBuffer: 500,    // Keep last 500 messages
  sampleRate: 0.1    // Sample 10% of messages
});
```

### API Reference

#### Constructor

```javascript
new PanDebugManager()
```

Creates a new debug manager instance with default configuration:

- `enabled`: `false`
- `maxBuffer`: `1000`
- `sampleRate`: `1.0`
- `traceBuffer`: `[]`
- `messageCount`: `0`

#### enableTracing(options)

Enables message tracing with optional configuration.

**Parameters:**
- `options` (Object, optional): Configuration object
  - `maxBuffer` (Number): Maximum messages to retain. Default: `1000`
  - `sampleRate` (Number): Sampling rate from 0.0 to 1.0. Default: `1.0`

**Returns:** `undefined`

**Example:**

```javascript
// Enable with full sampling
debug.enableTracing();

// Enable with limited buffer
debug.enableTracing({ maxBuffer: 100 });

// Enable with 25% sampling for production
debug.enableTracing({
  maxBuffer: 500,
  sampleRate: 0.25
});
```

#### disableTracing()

Disables message tracing. Logs the number of captured messages to the console.

**Returns:** `undefined`

**Example:**

```javascript
debug.disableTracing();
// Console: "[PAN Debug] Tracing disabled (captured 347 messages)"
```

#### trace(message, matchedRoutes)

Records a message trace entry. Typically called by the bus routing system, not user code.

**Parameters:**
- `message` (Object, required): Message object to trace
- `matchedRoutes` (Array, optional): Array of route objects that matched this message. Default: `[]`

**Returns:** `undefined`

**Trace Entry Structure:**
```javascript
{
  message: {       // Sanitized message copy
    id: "msg-123",
    type: "user.login",
    topic: "user.login",
    ts: 1638360000000,
    data: { ... }
  },
  matchedRoutes: [ // Routes that matched
    {
      id: "route-1",
      name: "User Login Handler",
      actions: ["publish", "transform"],
      error: null
    }
  ],
  ts: 1638360000000,  // Capture timestamp
  sequence: 347        // Message sequence number
}
```

#### traceError(message, route, error)

Records a routing error for a previously traced message.

**Parameters:**
- `message` (Object, required): Message that caused the error
- `route` (Object, required): Route that threw the error
- `error` (Error, required): Error object

**Returns:** `undefined`

**Example:**

```javascript
try {
  // Route action that throws
  executeRouteAction(message, route);
} catch (err) {
  debug.traceError(message, route, err);
  throw err;
}
```

#### getTrace()

Returns a copy of the trace buffer.

**Returns:** `Array<Object>` - Array of trace entries

**Example:**

```javascript
const trace = debug.getTrace();
console.log(`Captured ${trace.length} messages`);

trace.forEach(entry => {
  console.log(`[${entry.sequence}] ${entry.message.topic}`, entry.message.data);
});
```

#### clearTrace()

Clears the trace buffer and resets message count.

**Returns:** `undefined`

**Example:**

```javascript
debug.clearTrace();
// Console: "[PAN Debug] Trace buffer cleared"
```

#### getStats()

Returns statistics about the trace buffer.

**Returns:** `Object` with the following properties:

- `enabled` (Boolean): Whether tracing is enabled
- `messageCount` (Number): Total messages seen (including sampled)
- `bufferSize` (Number): Current number of entries in buffer
- `maxBuffer` (Number): Maximum buffer size
- `sampleRate` (Number): Current sampling rate
- `oldestMessage` (Number, optional): Timestamp of oldest message
- `newestMessage` (Number, optional): Timestamp of newest message
- `timespan` (Number, optional): Milliseconds between oldest and newest

**Example:**

```javascript
const stats = debug.getStats();
console.log(`Tracing: ${stats.enabled ? 'ON' : 'OFF'}`);
console.log(`Buffer: ${stats.bufferSize} / ${stats.maxBuffer}`);
console.log(`Total processed: ${stats.messageCount}`);

if (stats.timespan) {
  console.log(`Timespan: ${(stats.timespan / 1000).toFixed(1)}s`);
}
```

#### query(filter)

Queries the trace buffer with filtering options.

**Parameters:**
- `filter` (Object, optional): Filter criteria
  - `topic` (String): Match exact topic
  - `type` (String): Match exact message type
  - `hasRoutes` (Boolean): Filter by whether routes matched
  - `hasErrors` (Boolean): Filter by whether errors occurred
  - `startTs` (Number): Minimum timestamp (milliseconds)
  - `endTs` (Number): Maximum timestamp (milliseconds)
  - `limit` (Number): Maximum results to return (returns most recent)

**Returns:** `Array<Object>` - Filtered trace entries

**Example:**

```javascript
// Find all user.* messages
const userMessages = debug.query({ topic: 'user.login' });

// Find messages with no matched routes (dead letters)
const unrouted = debug.query({ hasRoutes: false });

// Find messages with errors
const errors = debug.query({ hasErrors: true });

// Find recent messages (last 10)
const recent = debug.query({ limit: 10 });

// Find messages in time range
const inRange = debug.query({
  startTs: Date.now() - 60000,  // Last minute
  limit: 50
});

// Combine filters
const errorMessages = debug.query({
  hasErrors: true,
  startTs: Date.now() - 300000,  // Last 5 minutes
  limit: 20
});
```

#### export()

Exports the trace buffer as formatted JSON.

**Returns:** `String` - JSON string with 2-space indentation

**Example:**

```javascript
const json = debug.export();

// Save to file
const blob = new Blob([json], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `pan-trace-${Date.now()}.json`;
a.click();
```

#### import(json)

Imports a trace buffer from JSON. Replaces the current buffer.

**Parameters:**
- `json` (String, required): JSON string from previous export

**Returns:** `undefined`

**Throws:** Error if JSON is invalid

**Example:**

```javascript
// Load from file
const fileInput = document.querySelector('input[type="file"]');
fileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const json = await file.text();

  try {
    debug.import(json);
    console.log('Trace imported successfully');
  } catch (err) {
    console.error('Failed to import trace:', err);
  }
});
```

### Helper Functions

#### captureSnapshot(bus, routes, debug)

Creates a comprehensive snapshot of the current PAN state, including bus statistics, routing information, and debug status.

**Parameters:**
- `bus` (Object, required): PAN bus instance
- `routes` (Object, required): Routes manager instance
- `debug` (Object, required): Debug manager instance

**Returns:** `Object` with the following structure:

```javascript
{
  timestamp: 1638360000000,
  bus: {
    stats: {
      published: 1247,
      subscriptions: 23,
      // ... other bus stats
    },
    subscriptions: 23,
    retained: 15
  },
  routes: {
    routeCount: 8,
    activeRoutes: 6,
    // ... other route stats
  },
  debug: {
    enabled: true,
    messageCount: 1247,
    bufferSize: 500,
    maxBuffer: 1000,
    sampleRate: 1.0
  }
}
```

**Example:**

```javascript
import { captureSnapshot } from './pan-debug.mjs';

// Capture current state
const snapshot = captureSnapshot(
  window.pan.bus,
  window.pan.routes,
  window.pan.debug
);

console.log('System snapshot:', snapshot);

// Store for later comparison
localStorage.setItem('pan-snapshot', JSON.stringify(snapshot));
```

### Complete Working Examples

#### Example 1: Basic Debug Session

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module">
    import './pan-bus.mjs';

    // Wait for bus
    await new Promise(resolve => {
      window.addEventListener('pan:sys.ready', resolve, { once: true });
    });

    const debug = window.pan.debug;
    const bus = window.pan.bus;

    // Enable tracing
    debug.enableTracing({ maxBuffer: 50 });

    // Publish test messages
    bus.publish('user.login', { userId: '123' });
    bus.publish('user.profile', { name: 'Alice' });
    bus.publish('cart.add', { itemId: '456' });

    // Check trace
    console.log('Trace:', debug.getTrace());
    console.log('Stats:', debug.getStats());

    // Query for user messages
    const userMsgs = debug.query({
      topic: 'user.login'
    });
    console.log('User messages:', userMsgs);
  </script>
</head>
<body>
  <pan-bus></pan-bus>
</body>
</html>
```

#### Example 2: Production Sampling

```javascript
// Enable lightweight tracing in production
class ProductionDebugger {
  constructor() {
    this.debug = window.pan.debug;

    // Sample 5% of messages, keep last 200
    this.debug.enableTracing({
      maxBuffer: 200,
      sampleRate: 0.05
    });

    // Periodically check for errors
    setInterval(() => this.checkForErrors(), 60000);
  }

  checkForErrors() {
    const errors = this.debug.query({
      hasErrors: true,
      startTs: Date.now() - 60000  // Last minute
    });

    if (errors.length > 0) {
      // Send to error tracking service
      this.reportErrors(errors);

      // Clear to prevent re-reporting
      this.debug.clearTrace();
    }
  }

  reportErrors(errors) {
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        timestamp: Date.now(),
        errors: errors.map(e => ({
          message: e.message,
          route: e.matchedRoutes.find(r => r.error),
          error: e.matchedRoutes.find(r => r.error)?.error
        }))
      })
    });
  }
}

// Initialize in production
if (window.location.hostname !== 'localhost') {
  new ProductionDebugger();
}
```

#### Example 3: Debug Dashboard

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font: 14px/1.4 system-ui; margin: 20px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
    .card { border: 1px solid #ddd; border-radius: 8px; padding: 16px; }
    .trace-entry { border-left: 3px solid #4a90e2; padding: 8px; margin: 4px 0; background: #f7f7f7; }
    .error { border-left-color: #e74c3c; }
    button { padding: 8px 16px; margin: 4px; cursor: pointer; }
  </style>
</head>
<body>
  <h1>PAN Debug Dashboard</h1>

  <div class="stats">
    <div class="card">
      <h3>Status</h3>
      <div id="status"></div>
    </div>
    <div class="card">
      <h3>Buffer</h3>
      <div id="buffer"></div>
    </div>
    <div class="card">
      <h3>Timespan</h3>
      <div id="timespan"></div>
    </div>
  </div>

  <div>
    <button id="toggle">Enable Tracing</button>
    <button id="clear">Clear Buffer</button>
    <button id="export">Export JSON</button>
    <button id="errors">Show Errors</button>
    <button id="unrouted">Show Unrouted</button>
    <button id="all">Show All</button>
  </div>

  <div id="trace"></div>

  <pan-bus></pan-bus>

  <script type="module">
    await new Promise(resolve => {
      window.addEventListener('pan:sys.ready', resolve, { once: true });
    });

    const debug = window.pan.debug;
    const bus = window.pan.bus;

    // Update dashboard
    function updateStats() {
      const stats = debug.getStats();

      document.getElementById('status').innerHTML =
        `Enabled: ${stats.enabled ? '[v]' : '[x]'}<br>` +
        `Messages: ${stats.messageCount}`;

      document.getElementById('buffer').innerHTML =
        `Size: ${stats.bufferSize} / ${stats.maxBuffer}<br>` +
        `Sample: ${(stats.sampleRate * 100).toFixed(0)}%`;

      if (stats.timespan) {
        document.getElementById('timespan').innerHTML =
          `${(stats.timespan / 1000).toFixed(1)}s`;
      }
    }

    // Display trace entries
    function displayTrace(entries) {
      const traceDiv = document.getElementById('trace');
      traceDiv.innerHTML = '';

      entries.forEach(entry => {
        const div = document.createElement('div');
        div.className = 'trace-entry';

        if (entry.matchedRoutes.some(r => r.error)) {
          div.classList.add('error');
        }

        div.innerHTML = `
          <strong>[${entry.sequence}] ${entry.message.topic}</strong><br>
          <pre>${JSON.stringify(entry.message.data, null, 2)}</pre>
          Routes: ${entry.matchedRoutes.length}
        `;

        traceDiv.appendChild(div);
      });

      updateStats();
    }

    // Controls
    document.getElementById('toggle').onclick = () => {
      if (debug.getStats().enabled) {
        debug.disableTracing();
        document.getElementById('toggle').textContent = 'Enable Tracing';
      } else {
        debug.enableTracing({ maxBuffer: 100 });
        document.getElementById('toggle').textContent = 'Disable Tracing';
      }
      updateStats();
    };

    document.getElementById('clear').onclick = () => {
      debug.clearTrace();
      displayTrace([]);
    };

    document.getElementById('export').onclick = () => {
      const json = debug.export();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pan-trace-${Date.now()}.json`;
      a.click();
    };

    document.getElementById('errors').onclick = () => {
      displayTrace(debug.query({ hasErrors: true }));
    };

    document.getElementById('unrouted').onclick = () => {
      displayTrace(debug.query({ hasRoutes: false }));
    };

    document.getElementById('all').onclick = () => {
      displayTrace(debug.getTrace());
    };

    // Enable by default
    debug.enableTracing({ maxBuffer: 100 });
    document.getElementById('toggle').textContent = 'Disable Tracing';

    // Publish test messages
    setInterval(() => {
      bus.publish('test.ping', { ts: Date.now() });
    }, 2000);

    // Update display every second
    setInterval(updateStats, 1000);
    updateStats();
  </script>
</body>
</html>
```

### Common Issues and Solutions

**Issue: Trace buffer fills up quickly**

*Solution:* Reduce `maxBuffer` or lower `sampleRate`:

```javascript
debug.enableTracing({
  maxBuffer: 200,
  sampleRate: 0.1  // Only 10% of messages
});
```

**Issue: Missing messages in trace**

*Cause:* Sampling is active

*Solution:* Check the sample rate:

```javascript
const stats = debug.getStats();
console.log(`Sample rate: ${stats.sampleRate}`);

// Increase to 100% for debugging
debug.enableTracing({ sampleRate: 1.0 });
```

**Issue: Memory usage grows over time**

*Cause:* Large trace buffer or high message volume

*Solution:* Use periodic cleanup:

```javascript
// Clear trace every 5 minutes
setInterval(() => {
  debug.clearTrace();
}, 300000);
```

**Issue: Cannot find specific message**

*Solution:* Use query filters:

```javascript
// Search by topic pattern
const results = debug.query({
  topic: 'user.login',
  startTs: Date.now() - 60000  // Last minute
});

if (results.length === 0) {
  console.log('No matching messages found');
  console.log('Total in buffer:', debug.getStats().bufferSize);
}
```

## pan-forwarder: HTTP Message Forwarding

### Overview

`pan-forwarder` is a custom element that forwards PAN messages to HTTP endpoints. It subscribes to topic patterns and POSTs each matching message to a configured destination, enabling integration with server-side systems, webhooks, and external APIs.

Think of it as a bridge between LARC's in-browser message bus and the wider world. Messages published to the PAN bus can trigger server-side actions, be logged to external systems, or forwarded to other clients via a hub.

### When to Use

**Use `pan-forwarder` when:**

- Synchronizing local actions to a server (chat messages, collaborative editing)
- Logging client events to analytics or monitoring systems
- Triggering server-side workflows from browser actions
- Implementing server-sent events (SSE) with bidirectional flow
- Building multi-client synchronization

**Don't use `pan-forwarder` when:**

- You need request-response patterns (use `pan-xhr` or `fetch` directly)
- Messages contain sensitive data and your endpoint isn't secured
- You're forwarding high-frequency messages without throttling
- Creating message loops (forwarding + SSE on same topics)

### Installation and Setup

```html
<script type="module" src="/components/pan-forwarder.mjs"></script>

<pan-forwarder
  dest="https://api.example.com/events"
  topics="chat.* user.action.*"
  method="POST"
  headers='{"Authorization": "Bearer token123"}'
  enabled="true">
</pan-forwarder>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `dest` | String | *(required)* | Destination URL for HTTP requests. Must be a valid URL. |
| `topics` | String | `"*"` | Space-separated topic patterns to forward. Supports wildcards. |
| `method` | String | `"POST"` | HTTP method to use. Typically POST or PUT. |
| `headers` | String | `"{}"` | HTTP headers as JSON object or semicolon-separated key-value pairs. |
| `with-credentials` | Boolean | `true` | Whether to include credentials (cookies) in requests. |
| `enabled` | Boolean | `true` | Whether forwarding is active. Set to "false" or "0" to disable. |

**Attribute Details:**

**dest**

Required. The HTTP endpoint that will receive forwarded messages.

```html
<pan-forwarder dest="https://api.example.com/pan"></pan-forwarder>
```

**topics**

Space-separated list of topic patterns. Defaults to `*` (all messages).

```html
<!-- Forward all user and admin messages -->
<pan-forwarder
  dest="/api/events"
  topics="user.* admin.*">
</pan-forwarder>

<!-- Forward specific topics -->
<pan-forwarder
  dest="/api/chat"
  topics="chat.message chat.typing">
</pan-forwarder>
```

**method**

HTTP method to use. Converted to uppercase.

```html
<pan-forwarder dest="/api/events" method="PUT"></pan-forwarder>
```

**headers**

HTTP headers as JSON or semicolon-separated pairs:

```html
<!-- JSON format -->
<pan-forwarder
  dest="/api/events"
  headers='{"Authorization": "Bearer abc123", "X-Client": "web"}'>
</pan-forwarder>

<!-- Semicolon-separated format -->
<pan-forwarder
  dest="/api/events"
  headers="Authorization: Bearer abc123; X-Client: web">
</pan-forwarder>
```

**with-credentials**

Controls whether cookies and authorization headers are included:

```html
<!-- Include credentials (default) -->
<pan-forwarder dest="/api/events" with-credentials="true"></pan-forwarder>

<!-- Omit credentials for CORS requests -->
<pan-forwarder dest="https://other-domain.com/events" with-credentials="false"></pan-forwarder>
```

**enabled**

Controls whether forwarding is active:

```html
<!-- Disabled -->
<pan-forwarder dest="/api/events" enabled="false"></pan-forwarder>

<!-- Enable/disable programmatically -->
<pan-forwarder id="fwd" dest="/api/events"></pan-forwarder>
<script>
  const fwd = document.getElementById('fwd');
  fwd.setAttribute('enabled', 'false');  // Disable
  fwd.setAttribute('enabled', 'true');   // Re-enable
</script>
```

### Properties

Access configuration via JavaScript properties:

```javascript
const forwarder = document.querySelector('pan-forwarder');

console.log(forwarder.dest);            // "https://api.example.com/events"
console.log(forwarder.topics);          // ["chat.*", "user.*"]
console.log(forwarder.method);          // "POST"
console.log(forwarder.headers);         // { Authorization: "Bearer ..." }
console.log(forwarder.withCredentials); // true
console.log(forwarder.enabled);         // true
```

### Request Body Format

Each forwarded message is sent as JSON with the following structure:

```javascript
{
  "topic": "chat.message",
  "data": {
    "user": "Alice",
    "text": "Hello world"
  },
  "retain": false,
  "id": "msg-123",
  "ts": 1638360000000
}
```

**Fields:**
- `topic` (String): Message topic
- `data` (Any): Message payload
- `retain` (Boolean): Whether message was marked for retention
- `id` (String, optional): Message ID if present
- `ts` (Number, optional): Message timestamp if present

### Deduplication

`pan-forwarder` implements best-effort deduplication using message IDs. If a message includes an `id` field, the forwarder tracks recently sent IDs to avoid duplicates.

The deduplication cache is cleared every 30 seconds to prevent unbounded growth.

### Complete Working Examples

#### Example 1: Basic Forwarding

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/components/pan-bus.mjs"></script>
  <script type="module" src="/components/pan-forwarder.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Forward chat messages to server -->
  <pan-forwarder
    dest="/api/chat"
    topics="chat.message">
  </pan-forwarder>

  <input id="message" placeholder="Type a message">
  <button id="send">Send</button>

  <script type="module">
    import { PanClient } from '/components/pan-client.mjs';

    const pc = new PanClient();

    document.getElementById('send').onclick = () => {
      const text = document.getElementById('message').value;
      if (!text) return;

      // Publish locally (forwarder sends to server)
      pc.publish({
        topic: 'chat.message',
        data: {
          user: 'Alice',
          text: text,
          ts: Date.now()
        }
      });

      document.getElementById('message').value = '';
    };
  </script>
</body>
</html>
```

#### Example 2: Multi-Topic Forwarding with Headers

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/components/pan-bus.mjs"></script>
  <script type="module" src="/components/pan-forwarder.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Forward multiple topic patterns with auth -->
  <pan-forwarder
    dest="https://api.example.com/events"
    topics="user.* admin.* system.alert"
    headers='{"Authorization": "Bearer abc123", "X-App": "dashboard"}'>
  </pan-forwarder>

  <script type="module">
    import { PanClient } from '/components/pan-client.mjs';

    const pc = new PanClient();

    // These will be forwarded
    pc.publish({ topic: 'user.login', data: { userId: '123' } });
    pc.publish({ topic: 'admin.action', data: { action: 'delete' } });
    pc.publish({ topic: 'system.alert', data: { level: 'critical' } });

    // This will NOT be forwarded (doesn't match patterns)
    pc.publish({ topic: 'ui.click', data: { button: 'submit' } });
  </script>
</body>
</html>
```

#### Example 3: SSE Integration (Bidirectional Sync)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/components/pan-bus.mjs"></script>
  <script type="module" src="/components/pan-sse.mjs"></script>
  <script type="module" src="/components/pan-forwarder.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Receive messages from server via SSE -->
  <pan-sse
    src="/api/sse"
    topics="chat.message"
    persist-last-event="chat">
  </pan-sse>

  <!-- Forward local messages to server -->
  <pan-forwarder
    dest="/api/chat"
    topics="chat.message">
  </pan-forwarder>

  <div id="messages"></div>
  <input id="text" placeholder="Type a message">
  <button id="send">Send</button>

  <script type="module">
    import { PanClient } from '/components/pan-client.mjs';

    const pc = new PanClient();
    const messagesDiv = document.getElementById('messages');

    // Display incoming messages (from SSE or local)
    pc.subscribe('chat.message', (msg) => {
      const div = document.createElement('div');
      div.textContent = `${msg.data.user}: ${msg.data.text}`;
      messagesDiv.appendChild(div);
    });

    // Send message
    document.getElementById('send').onclick = () => {
      const text = document.getElementById('text').value;
      if (!text) return;

      // Publish locally
      // Forwarder sends to server
      // Server broadcasts via SSE to all clients
      pc.publish({
        topic: 'chat.message',
        data: {
          user: 'Current User',
          text: text,
          ts: Date.now()
        }
      });

      document.getElementById('text').value = '';
    };
  </script>
</body>
</html>
```

**Important Note:** When using `pan-forwarder` with `pan-sse`, be careful to avoid message loops. Forward write intents only (e.g., `chat.send`) rather than read events (e.g., `chat.message`), or ensure the server doesn't echo back messages from the same client.

#### Example 4: Conditional Forwarding

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/components/pan-bus.mjs"></script>
  <script type="module" src="/components/pan-forwarder.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Initially disabled -->
  <pan-forwarder
    id="forwarder"
    dest="/api/events"
    topics="user.*"
    enabled="false">
  </pan-forwarder>

  <label>
    <input type="checkbox" id="sync">
    Enable server sync
  </label>

  <script type="module">
    const forwarder = document.getElementById('forwarder');
    const checkbox = document.getElementById('sync');

    // Enable/disable based on checkbox
    checkbox.addEventListener('change', () => {
      forwarder.setAttribute('enabled', checkbox.checked);
    });
  </script>
</body>
</html>
```

#### Example 5: Analytics Forwarding

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script type="module" src="/components/pan-bus.mjs"></script>
  <script type="module" src="/components/pan-forwarder.mjs"></script>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Forward analytics events to tracking server -->
  <pan-forwarder
    dest="https://analytics.example.com/events"
    topics="analytics.*"
    headers='{"X-API-Key": "your-api-key"}'>
  </pan-forwarder>

  <button id="btn1">Action 1</button>
  <button id="btn2">Action 2</button>

  <script type="module">
    import { PanClient } from '/components/pan-client.mjs';

    const pc = new PanClient();

    // Track button clicks
    document.getElementById('btn1').onclick = () => {
      pc.publish({
        topic: 'analytics.click',
        data: {
          button: 'action1',
          timestamp: Date.now(),
          page: window.location.pathname
        }
      });
    };

    document.getElementById('btn2').onclick = () => {
      pc.publish({
        topic: 'analytics.click',
        data: {
          button: 'action2',
          timestamp: Date.now(),
          page: window.location.pathname
        }
      });
    };

    // Track page views
    pc.publish({
      topic: 'analytics.pageview',
      data: {
        page: window.location.pathname,
        timestamp: Date.now(),
        referrer: document.referrer
      }
    });
  </script>
</body>
</html>
```

### Server-Side Implementation

A typical server endpoint for receiving forwarded messages:

```php
<?php
// /api/events endpoint (PHP example)
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  exit(0);
}

$json = file_get_contents('php://input');
$message = json_decode($json, true);

if (!$message || !isset($message['topic'], $message['data'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Invalid message format']);
  exit;
}

// Process message
$topic = $message['topic'];
$data = $message['data'];
$retain = $message['retain'] ?? false;
$id = $message['id'] ?? null;
$ts = $message['ts'] ?? time() * 1000;

// Log to database
$pdo = new PDO('sqlite:messages.db');
$stmt = $pdo->prepare('INSERT INTO messages (topic, data, ts) VALUES (?, ?, ?)');
$stmt->execute([$topic, json_encode($data), $ts]);

// Broadcast to other clients (if using SSE)
broadcast_message($topic, $data);

echo json_encode(['status' => 'ok']);
```

### Related Components

**pan-sse**

Receives server-sent events and publishes them to the PAN bus. Often used in conjunction with `pan-forwarder` for bidirectional synchronization.

**pan-xhr**

Provides request-response HTTP patterns. Use for traditional API calls rather than one-way message forwarding.

**pan-bus**

The message bus that `pan-forwarder` subscribes to. Configure routing and message validation in `pan-bus`.

### Common Issues and Solutions

**Issue: Messages not being forwarded**

*Possible causes:*
1. `enabled` attribute is false
2. Topic patterns don't match
3. No `dest` attribute
4. CORS errors (check browser console)

*Solution:*

```javascript
const fwd = document.querySelector('pan-forwarder');

console.log('Enabled:', fwd.enabled);
console.log('Destination:', fwd.dest);
console.log('Topics:', fwd.topics);

// Check if topic matches
import { PanBusEnhanced } from '/components/pan-bus.mjs';
const matches = fwd.topics.some(pattern =>
  PanBusEnhanced.matches('your.topic', pattern)
);
console.log('Topic matches:', matches);
```

**Issue: CORS errors when forwarding**

*Cause:* Server doesn't allow cross-origin requests

*Solution:* Configure CORS headers on server:

```javascript
// Server must respond with:
Access-Control-Allow-Origin: https://your-domain.com
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true  // If with-credentials="true"
```

**Issue: Message loops with SSE**

*Cause:* Forwarding the same topics that SSE publishes

*Solution:* Use different topic patterns:

```html
<!-- BAD: Loop -->
<pan-sse src="/api/sse" topics="chat.message"></pan-sse>
<pan-forwarder dest="/api/chat" topics="chat.message"></pan-forwarder>

<!-- GOOD: Separate intent and state -->
<pan-sse src="/api/sse" topics="chat.message"></pan-sse>
<pan-forwarder dest="/api/chat" topics="chat.send"></pan-forwarder>

<!-- In your code, publish to chat.send instead of chat.message -->
<script>
  pc.publish({ topic: 'chat.send', data: { text: 'Hello' } });
</script>
```

**Issue: High network traffic**

*Cause:* Forwarding high-frequency messages without throttling

*Solution:* Throttle at the source:

```javascript
class ThrottledPublisher {
  constructor(pc, interval = 100) {
    this.pc = pc;
    this.interval = interval;
    this.pending = null;
    this.timer = null;
  }

  publish(topic, data) {
    this.pending = { topic, data };

    if (!this.timer) {
      this.flush();
      this.timer = setInterval(() => this.flush(), this.interval);
    }
  }

  flush() {
    if (this.pending) {
      this.pc.publish(this.pending.topic, this.pending.data);
      this.pending = null;
    }
  }
}

// Use throttled publisher for high-frequency events
const throttled = new ThrottledPublisher(pc, 100);

document.addEventListener('mousemove', (e) => {
  throttled.publish('mouse.move', { x: e.clientX, y: e.clientY });
});
```

**Issue: Duplicate messages**

*Cause:* Messages without IDs bypass deduplication

*Solution:* Include unique IDs in published messages:

```javascript
import { generateId } from '/utils/id.mjs';

pc.publish({
  topic: 'chat.message',
  data: { text: 'Hello' },
  id: generateId()  // Ensures deduplication
});
```

**Issue: Authentication failures**

*Cause:* Missing or incorrect headers

*Solution:* Verify headers are set correctly:

```html
<pan-forwarder
  id="fwd"
  dest="/api/events"
  headers='{"Authorization": "Bearer your-token"}'>
</pan-forwarder>

<script>
  const fwd = document.getElementById('fwd');
  console.log('Headers:', fwd.headers);
  // Should show: { Authorization: "Bearer your-token" }
</script>
```

Or set headers programmatically:

```javascript
const fwd = document.querySelector('pan-forwarder');

// Get auth token
const token = localStorage.getItem('authToken');

// Update headers
fwd.setAttribute('headers', JSON.stringify({
  Authorization: `Bearer ${token}`
}));
```

## Best Practices

### Debug Component Best Practices

1. **Use sampling in production**: Full tracing has memory and performance overhead
2. **Clear buffers periodically**: Prevent unbounded memory growth
3. **Export traces before refresh**: Trace data is lost on page reload
4. **Query efficiently**: Use specific filters rather than scanning entire buffer
5. **Monitor error patterns**: Check for recurring issues with `query({ hasErrors: true })`

### Forwarder Best Practices

1. **Avoid message loops**: Don't forward topics that SSE publishes back
2. **Use specific topic patterns**: Forward only what's needed
3. **Throttle high-frequency events**: Reduce network overhead
4. **Include message IDs**: Enable deduplication
5. **Secure endpoints**: Use HTTPS and authentication headers
6. **Handle server errors gracefully**: Forwarder silently ignores failures
7. **Test CORS configuration**: Ensure server allows cross-origin requests
8. **Use `with-credentials` carefully**: Required for cookies, but can cause CORS issues

## Summary

Utility components provide infrastructure for observability and integration:

**pan-debug** gives you x-ray vision into message flows. Use it during development to understand routing behavior, diagnose issues, and profile performance. In production, enable sampling to capture errors without overwhelming resources.

**pan-forwarder** extends LARC beyond the browser. Use it to synchronize state with servers, log analytics events, trigger workflows, and build real-time collaborative features. Combined with `pan-sse`, it enables bidirectional message flow between client and server.

Both components embody LARC's philosophy: simple, focused tools that compose cleanly. They don't try to solve every problem—they solve specific problems well, and they integrate seamlessly with the rest of the ecosystem.

In the next chapter, we'll explore advanced integration patterns: building full-stack applications, implementing offline-first architectures, and connecting LARC to external systems and frameworks.
