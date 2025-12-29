# Utility Components Reference

API documentation for LARC's utility components. For tutorials, see *Learning LARC* Chapter 14.

## pan-debug

**Purpose**: Message tracing and debugging for PAN bus introspection  
**Import**: `import { PanDebugManager } from './pan-debug.mjs';`  
**Global Access**: `window.pan.debug` (when using pan-bus)

### Quick Example

```javascript
// Access via global
const debug = window.pan.debug;

// Enable tracing
debug.enableTracing({ maxBuffer: 500, sampleRate: 1.0 });

// Query messages
const recentMessages = debug.getTrace({ limit: 10 });
console.log('Recent messages:', recentMessages);

// Find specific messages
const loginMessages = debug.findMessages({
  topic: 'user.login',
  timeRange: { start: Date.now() - 60000 } // Last minute
});

// Export for analysis
const traceData = debug.exportTrace();
console.log('Trace export:', traceData);

// Disable when done
debug.disableTracing();
```

### API

#### Constructor

```javascript
new PanDebugManager()
```

Creates debug manager with defaults:
- `enabled`: false
- `maxBuffer`: 1000
- `sampleRate`: 1.0 (100%)

#### Configuration Methods

| Method | Parameters | Description |
|--------|-----------|-------------|
| `enableTracing(options)` | options?: `{ maxBuffer?, sampleRate? }` | Enable message tracing |
| `disableTracing()` | - | Disable tracing and clear buffer |
| `setSampleRate(rate)` | rate: Number (0.0-1.0) | Set sampling rate |
| `clearTrace()` | - | Clear trace buffer |

**options:**
- `maxBuffer` (Number, default: 1000): Max messages to retain
- `sampleRate` (Number, default: 1.0): Sampling rate (0.0-1.0)

#### Query Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `getTrace(options)` | options?: `{ limit?, offset? }` | Array | Get trace buffer |
| `findMessages(query)` | query: Object | Array | Find messages matching criteria |
| `getStats()` | - | Object | Get statistics |
| `exportTrace(format)` | format?: String | String/Object | Export trace data |

**Query options:**
- `topic` (String): Match topic pattern
- `clientId` (String): Filter by client ID
- `timeRange` (Object): `{ start?, end? }` in milliseconds
- `limit` (Number): Max results

**Stats object:**
```javascript
{
  totalMessages: 1523,
  tracedMessages: 1523,
  droppedMessages: 0,
  bufferSize: 1000,
  sampleRate: 1.0,
  enabled: true
}
```

### Complete Example

```javascript
import { PanDebugManager } from './pan-debug.mjs';

// Create and enable
const debug = new PanDebugManager();
debug.enableTracing({ maxBuffer: 1000, sampleRate: 0.1 }); // Sample 10%

// Build debug UI
function buildDebugPanel() {
  const panel = document.createElement('div');
  panel.style.cssText = `
    position: fixed; bottom: 0; right: 0; width: 400px; height: 300px;
    background: white; border: 1px solid #ccc; overflow: auto; 
    font-family: monospace; font-size: 12px; padding: 10px;
  `;

  const refresh = () => {
    const messages = debug.getTrace({ limit: 20 });
    panel.innerHTML = `
      <h3>PAN Bus Debug (${debug.getStats().totalMessages} total)</h3>
      <button onclick="window.panDebug.clearTrace()">Clear</button>
      <button onclick="window.panDebug.exportToConsole()">Export</button>
      <hr>
      ${messages.map(msg => `
        <div style="margin: 5px 0; border-left: 3px solid #007bff; padding-left: 5px;">
          <strong>${msg.topic}</strong>
          <small>(${new Date(msg.timestamp).toLocaleTimeString()})</small>
          <pre style="margin: 2px 0;">${JSON.stringify(msg.data, null, 2)}</pre>
        </div>
      `).join('')}
    `;
  };

  // Refresh every 2 seconds
  setInterval(refresh, 2000);
  refresh();

  document.body.appendChild(panel);

  // Expose controls
  window.panDebug = {
    clearTrace: () => { debug.clearTrace(); refresh(); },
    exportToConsole: () => console.log(debug.exportTrace())
  };
}

// Initialize when bus ready
if (window.__panReady) {
  buildDebugPanel();
} else {
  window.addEventListener('pan:sys.ready', buildDebugPanel, { once: true });
}
```

### Helper Functions

```javascript
// Filter by topic pattern
function findByTopic(pattern) {
  return debug.findMessages({ topic: pattern });
}

// Get message frequency
function getMessageFrequency() {
  const messages = debug.getTrace();
  const freq = {};
  messages.forEach(msg => {
    freq[msg.topic] = (freq[msg.topic] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1]);
}

// Find slow handlers
function findSlowHandlers(thresholdMs = 100) {
  const messages = debug.getTrace();
  return messages.filter(msg => 
    msg.processingTime && msg.processingTime > thresholdMs
  );
}
```

### Common Issues

**High memory usage**: Reduce `maxBuffer` or `sampleRate`. For production, use `sampleRate: 0.01` (1%).

**Messages not appearing**: Ensure tracing enabled and sampling rate > 0.

**Performance impact**: Tracing adds overhead. Use sampling (0.01-0.1) in production, or disable entirely.

---

## pan-forwarder

**Purpose**: Forward PAN messages to HTTP endpoints  
**Import**: `<pan-forwarder>` custom element

### Quick Example

```html
<pan-forwarder
  url="https://api.example.com/events"
  topics="user.login,user.logout,error.*"
  method="POST"
  debounce="500">
</pan-forwarder>

<script type="module">
// Messages matching topics are automatically forwarded
// No additional code needed
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `url` | String | "" | HTTP endpoint URL |
| `topics` | String | "*" | Comma-separated topic patterns |
| `method` | String | "POST" | HTTP method |
| `debounce` | Number | 0 | Debounce delay (ms) |
| `batch-size` | Number | 1 | Batch multiple messages |
| `batch-timeout` | Number | 1000 | Max batch wait time (ms) |
| `credentials` | String | "" | Fetch credentials mode |
| `deduplicate` | Boolean | false | Skip duplicate messages |

### Headers Configuration

Configure headers via embedded JSON script:

```html
<pan-forwarder url="/api/events" topics="user.*">
  <script type="application/json">
    {
      "headers": {
        "Authorization": "Bearer TOKEN",
        "X-App-Version": "1.0.0"
      }
    }
  </script>
</pan-forwarder>
```

### Request Format

**Single message:**
```json
{
  "topic": "user.login",
  "data": { "userId": 123 },
  "timestamp": 1640000000000,
  "id": "msg-abc123"
}
```

**Batched messages:**
```json
{
  "messages": [
    { "topic": "user.login", "data": {...}, "timestamp": 1640000000000 },
    { "topic": "user.action", "data": {...}, "timestamp": 1640000001000 }
  ],
  "batchSize": 2
}
```

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-forwarder.mjs';
    import { PanClient } from './pan-client.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const pc = new PanClient();

      // Application publishes messages normally
      document.getElementById('login-btn').addEventListener('click', () => {
        pc.publish('user.login', {
          userId: 123,
          timestamp: Date.now()
        });
        // Message automatically forwarded to server
      });

      // Track forwarding status
      pc.subscribe('forwarder.success', (msg) => {
        console.log('Forwarded:', msg.data.topic);
      });

      pc.subscribe('forwarder.error', (msg) => {
        console.error('Forward failed:', msg.data.error);
      });
    });
  </script>
</head>
<body>
  <pan-bus></pan-bus>
  
  <!-- Forward user events to analytics server -->
  <pan-forwarder
    url="https://analytics.example.com/events"
    topics="user.login,user.logout,user.action"
    method="POST"
    debounce="1000"
    batch-size="10"
    batch-timeout="5000">
    <script type="application/json">
      {
        "headers": {
          "Authorization": "Bearer analytics-token",
          "Content-Type": "application/json"
        }
      }
    </script>
  </pan-forwarder>

  <!-- Forward errors to monitoring service -->
  <pan-forwarder
    url="https://monitoring.example.com/errors"
    topics="error.*,*.error"
    method="POST"
    credentials="include">
    <script type="application/json">
      {
        "headers": {
          "X-Service": "my-app",
          "X-Environment": "production"
        }
      }
    </script>
  </pan-forwarder>

  <button id="login-btn">Login (forwards to server)</button>
</body>
</html>
```

### Server-Side Example

**Node.js/Express:**
```javascript
app.post('/events', express.json(), (req, res) => {
  const { topic, data, timestamp } = req.body;
  
  console.log(`Received: ${topic}`, data);
  
  // Process event
  if (topic === 'user.login') {
    analytics.track('login', data);
  }
  
  res.json({ success: true });
});

// Batched messages
app.post('/events/batch', express.json(), (req, res) => {
  const { messages } = req.body;
  
  messages.forEach(msg => {
    console.log(`Received: ${msg.topic}`, msg.data);
  });
  
  res.json({ success: true, processed: messages.length });
});
```

### PAN Events

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `forwarder.success` | `{ topic, url, status }` | Message forwarded successfully |
| `forwarder.error` | `{ topic, url, error, status }` | Forward failed |

### Common Issues

**Messages not forwarded**: Check topic patterns match. Use `topics="*"` to forward all messages.

**CORS errors**: Configure CORS headers on server. Use `credentials="include"` for cookies.

**Too many requests**: Increase `debounce` or use `batch-size` to group messages.

**Duplicate forwards**: Enable `deduplicate="true"` to skip duplicate messages within 5-second window.

**Server overload**: Use batching (`batch-size="50"`, `batch-timeout="5000"`) to reduce request frequency.

---

## Summary

This chapter documented LARC's utility components:

- **pan-debug**: Message tracing and debugging with query capabilities
- **pan-forwarder**: HTTP message forwarding for server integration

These components provide observability and extensibility without modifying core application logic.

**See Also**:
- Tutorial: *Learning LARC* Chapter 14
- Core components: Chapter 17
- Integration patterns: Chapter 20
- Debugging guide: Appendix D
