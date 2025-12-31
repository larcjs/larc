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

### Errors

pan-debug can encounter various error conditions during tracing operations. All errors are thrown as standard JavaScript errors.

#### Error Conditions

| Code | Cause | Resolution |
|------|-------|------------|
| `BUFFER_OVERFLOW` | Trace buffer exceeded maxBuffer limit | Increase maxBuffer, reduce sampleRate, or clear trace more frequently |
| `INVALID_SAMPLE_RATE` | sampleRate outside 0.0-1.0 range | Provide valid sample rate between 0.0 and 1.0 |
| `QUERY_FAILED` | findMessages() query malformed | Check query object format (topic, clientId, timeRange) |
| `EXPORT_FAILED` | exportTrace() serialization error | Check for circular references or non-serializable data |
| `MEMORY_EXCEEDED` | Trace buffer consuming too much memory | Reduce maxBuffer or use lower sampleRate |

#### Error Handling

```javascript
import { PanDebugManager } from './pan-debug.mjs';

const debug = new PanDebugManager();

// Safe initialization with error handling
function initializeDebugger(options = {}) {
  try {
    // Validate sample rate
    const sampleRate = options.sampleRate ?? 1.0;
    if (sampleRate < 0 || sampleRate > 1.0) {
      throw new Error('INVALID_SAMPLE_RATE: Sample rate must be between 0.0 and 1.0');
    }

    // Enable tracing with validated options
    debug.enableTracing({
      maxBuffer: options.maxBuffer || 1000,
      sampleRate: sampleRate
    });

    console.log('Debug tracing enabled');
  } catch (err) {
    console.error('Debug initialization failed:', err.message);
    // Fallback to minimal tracing
    debug.enableTracing({ maxBuffer: 100, sampleRate: 0.01 });
  }
}

// Safe query with error handling
function safeQuery(queryOptions) {
  try {
    // Validate time range
    if (queryOptions.timeRange) {
      const { start, end } = queryOptions.timeRange;
      if (start && end && start > end) {
        throw new Error('QUERY_FAILED: Invalid time range (start > end)');
      }
    }

    const results = debug.findMessages(queryOptions);
    return results;
  } catch (err) {
    console.error('Query failed:', err.message);
    return [];
  }
}

// Safe export with size checking
function safeExport(format = 'json') {
  try {
    const stats = debug.getStats();
    
    // Check buffer size before export
    if (stats.tracedMessages > 10000) {
      console.warn('Large trace buffer, export may be slow');
      // Optionally export in chunks
      const chunkSize = 1000;
      const chunks = [];
      for (let i = 0; i < stats.tracedMessages; i += chunkSize) {
        const chunk = debug.getTrace({ limit: chunkSize, offset: i });
        chunks.push(chunk);
      }
      return chunks;
    }

    const exportData = debug.exportTrace(format);
    return exportData;
  } catch (err) {
    console.error('Export failed:', err.message);
    // Return minimal diagnostic data
    return { error: err.message, stats: debug.getStats() };
  }
}

// Memory monitoring
function monitorMemory() {
  const stats = debug.getStats();
  const estimatedSize = stats.bufferSize * 1000; // ~1KB per message

  if (estimatedSize > 10 * 1024 * 1024) { // 10MB threshold
    console.warn('MEMORY_EXCEEDED: Trace buffer exceeding 10MB');
    debug.clearTrace();
    debug.setSampleRate(0.1); // Reduce to 10%
  }
}

// Periodic memory check
setInterval(monitorMemory, 30000);

// Example: Safe debug UI with error boundaries
function buildRobustDebugPanel() {
  try {
    initializeDebugger({ maxBuffer: 500, sampleRate: 0.1 });

    const panel = document.createElement('div');
    panel.id = 'debug-panel';

    const refresh = () => {
      try {
        const messages = safeQuery({ limit: 20 });
        const stats = debug.getStats();

        panel.innerHTML = `
          <h3>PAN Debug (${stats.totalMessages} total, ${stats.droppedMessages} dropped)</h3>
          <p>Buffer: ${stats.tracedMessages}/${stats.bufferSize} | Rate: ${stats.sampleRate * 100}%</p>
          <button onclick="clearDebugTrace()">Clear</button>
          <button onclick="exportDebugTrace()">Export</button>
          ${stats.droppedMessages > 0 ? '<span style="color:red;">⚠ Messages dropped</span>' : ''}
          <hr>
          ${messages.length === 0 ? '<p>No messages traced</p>' : 
            messages.map(msg => `
              <div style="margin: 5px 0; padding: 5px; border: 1px solid #ddd;">
                <strong>${msg.topic}</strong>
                <small>${new Date(msg.timestamp).toLocaleTimeString()}</small>
                <pre>${JSON.stringify(msg.data, null, 2).substring(0, 200)}</pre>
              </div>
            `).join('')
          }
        `;
      } catch (err) {
        panel.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
      }
    };

    setInterval(refresh, 2000);
    refresh();
    document.body.appendChild(panel);

    // Global safe controls
    window.clearDebugTrace = () => {
      try {
        debug.clearTrace();
        refresh();
      } catch (err) {
        console.error('Clear failed:', err.message);
      }
    };

    window.exportDebugTrace = () => {
      try {
        const data = safeExport();
        console.log('Exported trace:', data);
        // Optionally download as file
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pan-trace-${Date.now()}.json`;
        a.click();
      } catch (err) {
        console.error('Export failed:', err.message);
      }
    };

  } catch (err) {
    console.error('Debug panel initialization failed:', err.message);
  }
}
```

#### Exceptions Thrown

- **TypeError**: Invalid parameter types (e.g., non-numeric sample rate)
- **Error**: General tracing errors (buffer overflow, query failures, export errors)

#### Performance Considerations

- Large buffers (>1000 messages) increase memory usage significantly
- High sample rates (>0.1) can impact application performance
- Export operations on large traces (>5000 messages) may block UI thread
- Consider Web Workers for large export operations in production

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

### Errors

pan-forwarder can encounter various error conditions when forwarding messages to HTTP endpoints. All errors are published as PAN messages on the `forwarder.error` topic.

#### Error Conditions

| Code | Cause | Resolution |
|------|-------|------------|
| `NETWORK_ERROR` | Network connection failed | Check internet connectivity, verify URL is reachable |
| `HTTP_ERROR` | Server returned error status (4xx, 5xx) | Check server logs, verify authentication, check endpoint exists |
| `BATCH_TIMEOUT` | Batch timeout exceeded before filling | Reduce batch-timeout or batch-size for low-volume scenarios |
| `TOPIC_MISMATCH` | No topics matched messages | Verify topic patterns, use "*" to match all messages |
| `PARSE_ERROR` | Response body parsing failed | Check server returns valid JSON, verify Content-Type header |
| `CORS_ERROR` | Cross-origin request blocked | Configure CORS headers on server, check credentials mode |
| `INVALID_CONFIG` | Malformed configuration JSON | Validate JSON syntax in embedded script tag |

#### Error Handling

```javascript
import { PanClient } from './pan-client.mjs';

const pc = new PanClient();

// Monitor forwarding errors
pc.subscribe('forwarder.error', (msg) => {
  const { topic, url, error, status, response } = msg.data;
  console.error(`Forward failed [${topic}]:`, error);

  // Handle different error scenarios
  switch (true) {
    case error.includes('NETWORK_ERROR'):
      handleNetworkError(topic, msg.data.originalMessage);
      break;

    case status === 401:
      console.error('Authentication required');
      refreshAuthToken();
      break;

    case status === 429:
      console.warn('Rate limited, backing off');
      increaseDebounce();
      break;

    case status >= 500:
      console.warn('Server error, will retry');
      queueForRetry(topic, msg.data.originalMessage);
      break;

    case error.includes('CORS_ERROR'):
      console.error('CORS configuration issue on server');
      showCorsWarning();
      break;

    default:
      console.error('Unhandled forward error:', error);
      logToErrorTracking({ topic, error, status });
  }
});

// Track successful forwards
let forwardCount = 0;
pc.subscribe('forwarder.success', (msg) => {
  forwardCount++;
  console.log(`Forwarded ${msg.data.topic} (total: ${forwardCount})`);
});

// Network error handling with offline queue
const offlineQueue = [];
let isOnline = navigator.onLine;

function handleNetworkError(topic, originalMessage) {
  if (!isOnline) {
    console.log('Queueing message for offline:', topic);
    offlineQueue.push({ topic, data: originalMessage });
    localStorage.setItem('forwarder_queue', JSON.stringify(offlineQueue));
  }
}

// Restore queue when online
window.addEventListener('online', () => {
  isOnline = true;
  const saved = localStorage.getItem('forwarder_queue');
  if (saved) {
    const queue = JSON.parse(saved);
    console.log(`Replaying ${queue.length} queued messages`);
    queue.forEach(({ topic, data }) => {
      pc.publish(topic, data);
    });
    localStorage.removeItem('forwarder_queue');
    offlineQueue.length = 0;
  }
});

window.addEventListener('offline', () => {
  isOnline = false;
  console.warn('Network offline, queueing messages');
});

// Retry logic with exponential backoff
const retryQueue = [];
let retryTimer = null;

function queueForRetry(topic, message, retries = 0) {
  if (retries >= 3) {
    console.error('Max retries exceeded for:', topic);
    logToErrorTracking({ topic, message, error: 'max_retries_exceeded' });
    return;
  }

  retryQueue.push({ topic, message, retries });

  if (!retryTimer) {
    const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
    retryTimer = setTimeout(() => {
      console.log(`Retrying ${retryQueue.length} messages...`);
      const batch = [...retryQueue];
      retryQueue.length = 0;
      retryTimer = null;

      batch.forEach(({ topic, message, retries }) => {
        pc.publish(topic, message);
        // Monitor if it fails again
        const unsubscribe = pc.subscribe('forwarder.error', (msg) => {
          if (msg.data.topic === topic) {
            queueForRetry(topic, message, retries + 1);
            unsubscribe();
          }
        });
      });
    }, delay);
  }
}

// Dynamic debounce adjustment for rate limiting
let currentDebounce = 0;

function increaseDebounce() {
  currentDebounce = Math.min(currentDebounce + 500, 5000); // Max 5s
  console.log(`Increased debounce to ${currentDebounce}ms`);
  
  // Update forwarder element
  const forwarder = document.querySelector('pan-forwarder');
  if (forwarder) {
    forwarder.setAttribute('debounce', currentDebounce);
  }
}

// Reset debounce after successful forwards
let successCount = 0;
pc.subscribe('forwarder.success', () => {
  successCount++;
  if (successCount >= 10 && currentDebounce > 0) {
    currentDebounce = Math.max(currentDebounce - 500, 0);
    console.log(`Reduced debounce to ${currentDebounce}ms`);
    const forwarder = document.querySelector('pan-forwarder');
    if (forwarder) {
      forwarder.setAttribute('debounce', currentDebounce);
    }
    successCount = 0;
  }
});

// Authentication token refresh
async function refreshAuthToken() {
  try {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      credentials: 'include'
    });
    
    if (response.ok) {
      const { token } = await response.json();
      
      // Update forwarder headers
      const forwarder = document.querySelector('pan-forwarder');
      const scriptTag = forwarder.querySelector('script[type="application/json"]');
      const config = JSON.parse(scriptTag.textContent);
      config.headers.Authorization = `Bearer ${token}`;
      scriptTag.textContent = JSON.stringify(config, null, 2);
      
      console.log('Auth token refreshed');
    } else {
      console.error('Token refresh failed, redirecting to login');
      window.location.href = '/login';
    }
  } catch (err) {
    console.error('Token refresh error:', err.message);
  }
}

// CORS warning display
function showCorsWarning() {
  const warning = document.createElement('div');
  warning.style.cssText = `
    position: fixed; top: 20px; right: 20px; 
    background: #ff9800; color: white; padding: 15px;
    border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    z-index: 10000;
  `;
  warning.innerHTML = `
    <strong>⚠ CORS Error</strong><br>
    Server needs CORS headers configured.<br>
    <button onclick="this.parentElement.remove()">Dismiss</button>
  `;
  document.body.appendChild(warning);
}

// Error tracking integration
function logToErrorTracking(errorData) {
  // Example: Send to monitoring service
  fetch('https://monitoring.example.com/errors', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      component: 'pan-forwarder',
      timestamp: Date.now(),
      ...errorData
    })
  }).catch(err => console.error('Error tracking failed:', err.message));
}

// Example: Robust forwarder with comprehensive error handling
function setupRobustForwarder() {
  const container = document.createElement('div');
  container.innerHTML = `
    <pan-forwarder
      url="https://api.example.com/events"
      topics="user.*,error.*"
      method="POST"
      debounce="1000"
      batch-size="10"
      batch-timeout="5000"
      credentials="include">
      <script type="application/json">
        {
          "headers": {
            "Authorization": "Bearer initial-token",
            "Content-Type": "application/json",
            "X-Client-Version": "1.0.0"
          }
        }
      </script>
    </pan-forwarder>

    <div id="forward-stats" style="position: fixed; bottom: 10px; right: 10px; background: white; padding: 10px; border: 1px solid #ddd; font-family: monospace; font-size: 12px;">
      Forwards: <span id="success-count">0</span> | 
      Errors: <span id="error-count">0</span> | 
      Queued: <span id="queue-count">0</span>
    </div>
  `;
  
  document.body.appendChild(container);

  // Update stats display
  let errorCount = 0;
  pc.subscribe('forwarder.error', () => {
    errorCount++;
    document.getElementById('error-count').textContent = errorCount;
    document.getElementById('queue-count').textContent = offlineQueue.length + retryQueue.length;
  });

  pc.subscribe('forwarder.success', () => {
    document.getElementById('success-count').textContent = forwardCount;
  });

  // Periodic queue check
  setInterval(() => {
    document.getElementById('queue-count').textContent = offlineQueue.length + retryQueue.length;
  }, 1000);
}

// Initialize when ready
customElements.whenDefined('pan-bus').then(setupRobustForwarder);
```

#### Exceptions Thrown

pan-forwarder does not throw exceptions directly. All errors are published as PAN messages on `forwarder.error` topic.

#### HTTP Status Codes

Common status codes encountered:

- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: Valid token but insufficient permissions
- **404 Not Found**: Endpoint URL incorrect
- **429 Too Many Requests**: Rate limiting in effect
- **500 Internal Server Error**: Server-side processing error
- **502 Bad Gateway**: Server unreachable or down
- **503 Service Unavailable**: Server temporarily overloaded

#### Server Requirements

For successful message forwarding, server must:

1. Accept POST requests (or configured method) at the URL
2. Support JSON request body (Content-Type: application/json)
3. Return JSON response with status field
4. Configure CORS headers if cross-origin:
   ```
   Access-Control-Allow-Origin: *
   Access-Control-Allow-Methods: POST, OPTIONS
   Access-Control-Allow-Headers: Content-Type, Authorization
   ```
5. Handle batched messages if batch-size > 1
6. Respond within reasonable timeout (default: 30s)

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
