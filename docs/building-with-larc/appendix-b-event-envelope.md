# Appendix B: Event Envelope Specification

This appendix provides the complete specification for LARC message envelopes—the data structures that wrap every message flowing through the PAN bus. Understanding the envelope format is critical for debugging, building tooling, and understanding how the system works at a fundamental level.

## Overview

Every message in LARC is wrapped in an envelope that provides metadata, routing information, and payload data. The envelope follows a simple, predictable structure that balances flexibility with consistency.

**Key Characteristics:**
- Plain JavaScript objects (no classes or prototypes)
- JSON-serializable (can be logged, stored, transmitted)
- Immutable once published (bus may add fields, but won't modify existing)
- Extensible through headers and custom fields

## Message Envelope Structure

### Complete Format

```typescript
interface PanMessage {
  // Required fields (must be provided by publisher)
  topic: string;
  data: any;

  // Auto-generated fields (added by bus if not provided)
  id?: string;
  ts?: number;

  // Optional feature fields
  retain?: boolean;
  replyTo?: string;
  correlationId?: string;
  headers?: Record<string, string>;

  // Internal/system fields (typically not used by applications)
  clientId?: string;
}
```

### Minimal Message

The absolute minimum required to publish a message:

```javascript
{
  topic: 'users.updated',
  data: { id: 123, name: 'Alice' }
}
```

The bus will enhance this to:

```javascript
{
  topic: 'users.updated',
  data: { id: 123, name: 'Alice' },
  id: '550e8400-e29b-41d4-a716-446655440000',
  ts: 1699564800000
}
```

## Field Specifications

### topic (required)

**Type:** `string`

**Purpose:** Identifies the message type and routing destination.

**Format:** Dotted notation, typically `resource.action.qualifier`

**Constraints:**
- Must be non-empty string
- Lowercase letters and dots recommended
- Max length: 256 characters (practical limit)
- Pattern: `/^[a-z0-9.-]+$/i`

**Examples:**
```javascript
'users.list.state'
'users.item.get'
'nav.goto'
'ui.modal.opened'
'auth.session.state'
```

**Validation:**
```javascript
// Valid topics
'users.updated'             ✓
'nav.goto'                  ✓
'users.item.state.123'      ✓
'auth.two-factor.verify'    ✓

// Invalid topics
''                          ✗ Empty string
'users updated'             ✗ Contains space
'users_updated'             ✗ Underscore (not recommended)
null                        ✗ Not a string
```

**Reserved Patterns:**
- `pan:*` - Reserved for PAN bus internals
- `sys:*` - Reserved for system-level topics

### data (required)

**Type:** `any` (must be JSON-serializable)

**Purpose:** Message payload—the actual information being communicated.

**Constraints:**
- Must be JSON-serializable (no functions, circular refs, DOM nodes)
- Recommended max size: 512KB (configurable via `max-payload-size`)
- Can be any valid JSON type: object, array, string, number, boolean, null

**Supported Types:**
```javascript
// Object
{ id: 123, name: 'Alice', active: true }

// Array
[{ id: 1 }, { id: 2 }, { id: 3 }]

// String
"Hello, world"

// Number
42
3.14159

// Boolean
true
false

// Null
null
```

**Invalid Data:**
```javascript
// Functions
data: () => console.log('hi')    ✗

// undefined (use null instead)
data: undefined                  ✗

// Circular references
const obj = {};
obj.self = obj;
data: obj                        ✗

// DOM nodes
data: document.body              ✗
```

**Best Practices:**
```javascript
// Good: structured data
{
  topic: 'users.item.updated',
  data: {
    id: 123,
    name: 'Alice',
    email: 'alice@example.com',
    updatedAt: Date.now()
  }
}

// Good: minimal data
{
  topic: 'users.item.select',
  data: { id: 123 }
}

// Good: null for no data
{
  topic: 'ui.modal.close',
  data: null
}

// Acceptable: primitive data
{
  topic: 'counter.value',
  data: 42
}

// Bad: empty object when null is better
{
  topic: 'ui.modal.close',
  data: {}  // Use null instead
}
```

### id (optional, auto-generated)

**Type:** `string` (UUID v4)

**Purpose:** Unique identifier for message deduplication, tracking, and correlation.

**Auto-generation:** If not provided, bus generates a UUID v4.

**Format:** Standard UUID format: `xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx`

**Example:**
```javascript
'550e8400-e29b-41d4-a716-446655440000'
'7c9e6679-7425-40de-944b-e07fc1f90ae7'
```

**Usage:**
```javascript
// Let bus generate (recommended)
client.publish({
  topic: 'users.updated',
  data: { id: 123 }
  // id will be auto-generated
});

// Provide custom ID (rare)
client.publish({
  topic: 'users.updated',
  data: { id: 123 },
  id: 'user-update-123-2024-11-01'
});
```

**Use Cases:**
- Deduplication (detect duplicate messages)
- Message tracking in logs
- Correlation across systems
- Idempotency keys

### ts (optional, auto-generated)

**Type:** `number` (Unix timestamp in milliseconds)

**Purpose:** Message creation timestamp for ordering and time-based filtering.

**Auto-generation:** If not provided, bus adds `Date.now()`.

**Format:** Milliseconds since Unix epoch (January 1, 1970 00:00:00 UTC)

**Example:**
```javascript
1699564800000  // 2023-11-10 00:00:00 UTC
1699651200000  // 2023-11-11 00:00:00 UTC
```

**Usage:**
```javascript
// Let bus generate (recommended)
client.publish({
  topic: 'users.updated',
  data: { id: 123 }
  // ts will be auto-generated
});

// Provide custom timestamp (rare)
client.publish({
  topic: 'users.updated',
  data: { id: 123 },
  ts: Date.parse('2024-11-01T12:00:00Z')
});
```

**Use Cases:**
- Message ordering
- Time-based filtering
- Analytics and logging
- Determining message freshness

**Working with Timestamps:**
```javascript
// Convert to Date object
const date = new Date(msg.ts);

// Format for display
const formatted = new Date(msg.ts).toISOString();
// "2024-11-01T12:00:00.000Z"

// Check message age
const ageMs = Date.now() - msg.ts;
const ageSeconds = ageMs / 1000;
```

### retain (optional)

**Type:** `boolean`

**Purpose:** Indicates message should be retained by bus and replayed to new subscribers.

**Default:** `false`

**Constraints:**
- Only one message retained per topic (last value wins)
- Subject to LRU eviction if bus retention limit exceeded
- Bus default max retained: 1000 messages (configurable via `max-retained`)

**Usage:**
```javascript
// Publish retained state
client.publish({
  topic: 'app.theme.state',
  data: { mode: 'dark' },
  retain: true
});

// Later subscriber receives immediately
client.subscribe('app.theme.state', (msg) => {
  applyTheme(msg.data);
}, { retained: true });
```

**When to Use:**
- Application state (theme, language, configuration)
- List data (current user list, current items)
- Session information (current user, authentication)
- Last known values (device status, connection state)

**When NOT to Use:**
- Events (one-time notifications)
- High-frequency updates (mouse movements, scroll events)
- Temporary notifications (toasts, alerts)
- Bulk data (large lists, file contents)

### replyTo (optional)

**Type:** `string` (topic name)

**Purpose:** Specifies topic where reply should be sent (request/reply pattern).

**Auto-generation:** Auto-generated by `client.request()` method.

**Format:** Typically `pan:$reply:${clientId}:${correlationId}`

**Usage:**
```javascript
// Manually set replyTo
client.publish({
  topic: 'users.item.get',
  data: { id: 123 },
  replyTo: 'users.item.get.reply.abc123',
  correlationId: 'req-001'
});

// Subscribe to reply
client.subscribe('users.item.get.reply.abc123', (msg) => {
  console.log('Response:', msg.data);
});

// Better: use client.request() (auto-generates replyTo)
const response = await client.request('users.item.get', { id: 123 });
```

**Responder Pattern:**
```javascript
client.subscribe('users.item.get', async (msg) => {
  // Check if reply expected
  if (!msg.replyTo) return;

  const user = await database.getUser(msg.data.id);

  // Send reply to specified topic
  client.publish({
    topic: msg.replyTo,
    data: user ? { ok: true, item: user } : { ok: false, error: 'Not found' },
    correlationId: msg.correlationId
  });
});
```

### correlationId (optional)

**Type:** `string` (UUID or custom identifier)

**Purpose:** Correlates replies with original requests in request/reply pattern.

**Auto-generation:** Auto-generated by `client.request()` method.

**Format:** Typically UUID, but can be any string identifier.

**Usage:**
```javascript
// Manual correlation (rare)
const corrId = crypto.randomUUID();

client.publish({
  topic: 'users.item.get',
  data: { id: 123 },
  replyTo: 'users.reply',
  correlationId: corrId
});

client.subscribe('users.reply', (msg) => {
  if (msg.correlationId === corrId) {
    console.log('Our reply:', msg.data);
  }
});

// Better: use client.request() (auto-correlates)
const response = await client.request('users.item.get', { id: 123 });
```

**Use Cases:**
- Request/reply pattern
- Tracking conversation threads
- Matching async responses
- Distributed tracing

### headers (optional)

**Type:** `Record<string, string>` (string key-value pairs)

**Purpose:** Free-form metadata for custom application needs.

**Constraints:**
- Keys and values must be strings
- No reserved header names (yet)
- Included in message size calculations

**Common Use Cases:**
- User context (userId, sessionId, tenantId)
- Distributed tracing (traceId, spanId, parentSpanId)
- Source tracking (source, version, environment)
- Custom metadata (priority, category, tags)

**Usage:**
```javascript
// Add headers
client.publish({
  topic: 'analytics.event',
  data: { action: 'click', target: 'button' },
  headers: {
    userId: '123',
    sessionId: 'abc-def-ghi',
    source: 'mobile-app',
    version: '2.1.0',
    environment: 'production'
  }
});

// Access headers in subscriber
client.subscribe('analytics.*', (msg) => {
  const userId = msg.headers?.userId;
  const source = msg.headers?.source;

  logEvent(msg.topic, msg.data, { userId, source });
});
```

**Distributed Tracing Example:**
```javascript
// Start trace
const traceId = crypto.randomUUID();
const spanId = crypto.randomUUID();

client.publish({
  topic: 'users.item.get',
  data: { id: 123 },
  headers: {
    traceId,
    spanId,
    parentSpanId: null
  }
});

// Continue trace in handler
client.subscribe('users.item.get', async (msg) => {
  const childSpanId = crypto.randomUUID();

  // Process with trace context
  await database.getUser(msg.data.id, {
    traceId: msg.headers.traceId,
    parentSpanId: msg.headers.spanId,
    spanId: childSpanId
  });
});
```

### clientId (internal)

**Type:** `string`

**Purpose:** Internal identifier for client that published the message.

**Auto-generation:** Generated by PanClient constructor.

**Format:** `${elementTag}#${uuid}`

**Example:** `pan-user-list#7c9e6679-7425-40de-944b`

**Usage:** Primarily for internal bus operations. Applications typically don't need to use this field.

## Message Examples

### Simple Event

```javascript
{
  topic: 'users.item.updated',
  data: {
    id: 123,
    name: 'Alice Cooper',
    email: 'alice@example.com',
    updatedAt: 1699564800000
  },
  id: '550e8400-e29b-41d4-a716-446655440000',
  ts: 1699564800000
}
```

### Retained State

```javascript
{
  topic: 'users.list.state',
  data: {
    items: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ],
    total: 3,
    page: 1
  },
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  ts: 1699651200000,
  retain: true
}
```

### Request Message

```javascript
{
  topic: 'users.item.get',
  data: { id: 123 },
  id: 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  ts: 1699651200000,
  replyTo: 'pan:$reply:user-list#abc123:req-001',
  correlationId: 'req-001'
}
```

### Reply Message

```javascript
{
  topic: 'pan:$reply:user-list#abc123:req-001',
  data: {
    ok: true,
    item: {
      id: 123,
      name: 'Alice',
      email: 'alice@example.com'
    }
  },
  id: 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  ts: 1699651205000,
  correlationId: 'req-001'
}
```

### Message with Headers

```javascript
{
  topic: 'analytics.page-view',
  data: {
    page: '/users/123',
    duration: 5000,
    referrer: '/dashboard'
  },
  id: 'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  ts: 1699651200000,
  headers: {
    userId: '456',
    sessionId: 'session-xyz',
    device: 'mobile',
    browser: 'Chrome',
    version: '119.0',
    traceId: 'trace-abc-def'
  }
}
```

### Error Response

```javascript
{
  topic: 'pan:$reply:user-form#xyz789:req-002',
  data: {
    ok: false,
    error: 'User not found',
    code: 'NOT_FOUND',
    details: {
      requestedId: 999,
      timestamp: 1699651200000
    }
  },
  id: 'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  ts: 1699651210000,
  correlationId: 'req-002'
}
```

## Response Payload Conventions

While `data` can be any JSON value, LARC follows conventions for response payloads in request/reply patterns:

### Success Response

```javascript
{
  ok: true,
  item: { /* single item */ }
}

// or for lists
{
  ok: true,
  items: [ /* array of items */ ],
  total: 100
}
```

### Error Response

```javascript
{
  ok: false,
  error: 'Human-readable error message',
  code: 'ERROR_CODE',           // Optional: machine-readable code
  details: { /* context */ }     // Optional: additional context
}
```

### Example Error Codes

```javascript
'NOT_FOUND'           // Resource doesn't exist
'VALIDATION_ERROR'    // Invalid input
'UNAUTHORIZED'        // Not authenticated
'FORBIDDEN'           // Not authorized
'CONFLICT'            // Resource conflict (e.g., duplicate)
'RATE_LIMIT'          // Too many requests
'SERVER_ERROR'        // Internal error
'TIMEOUT'             // Operation timed out
```

## Message Size Limits

The PAN bus enforces configurable size limits:

### Default Limits

- **Max message size:** 1MB (1,048,576 bytes)
- **Max payload size:** 512KB (524,288 bytes)

### Configuration

```html
<pan-bus
  max-message-size="2097152"
  max-payload-size="1048576">
</pan-bus>
```

### Size Estimation

The bus estimates message size by JSON-stringifying and measuring:

```javascript
function estimateSize(msg) {
  return new Blob([JSON.stringify(msg)]).size;
}
```

### Handling Size Limits

```javascript
// Large data: paginate requests
const response = await client.request('users.list.get', {
  page: 1,
  limit: 50  // Smaller page size
});

// Large payloads: use chunking or external storage
// Instead of:
client.publish({
  topic: 'file.uploaded',
  data: { fileContents: hugeBase64String }  // Too large!
});

// Do:
const fileId = await uploadToStorage(fileContents);
client.publish({
  topic: 'file.uploaded',
  data: { fileId, url: `/files/${fileId}` }
});
```

## Validation

The PAN bus validates messages before processing:

### Topic Validation

```javascript
// Must be non-empty string
topic: ''                    ✗
topic: null                  ✗
topic: undefined             ✗

// Must not be reserved
topic: 'pan:publish'         ✗ (reserved)
topic: 'pan:subscribe'       ✗ (reserved)

// Valid
topic: 'users.updated'       ✓
```

### Data Validation

```javascript
// Must be JSON-serializable
data: () => {}               ✗ (function)
data: document.body          ✗ (DOM node)
data: undefined              ✗ (use null)

const obj = {};
obj.self = obj;
data: obj                    ✗ (circular reference)

// Valid
data: null                   ✓
data: { id: 123 }            ✓
data: [1, 2, 3]              ✓
data: "string"               ✓
data: 42                     ✓
```

### Size Validation

Messages exceeding size limits are rejected with error:

```javascript
// Error emitted if message too large
{
  topic: 'pan:sys.error',
  data: {
    code: 'MESSAGE_INVALID',
    message: 'Message size (2000000 bytes) exceeds limit (1048576 bytes)',
    details: { topic: 'users.list.state' }
  }
}
```

## Internal System Messages

Certain system messages are emitted by the bus:

### pan:sys.ready

Emitted when bus initializes:

```javascript
{
  topic: 'pan:sys.ready',
  data: {
    enhanced: true,
    routing: false,
    tracing: false,
    config: { /* bus configuration */ }
  }
}
```

### pan:sys.error

Emitted for validation errors, rate limits, etc:

```javascript
{
  topic: 'pan:sys.error',
  data: {
    code: 'RATE_LIMIT_EXCEEDED',
    message: 'Too many messages',
    details: { clientId: 'user-list#abc' }
  }
}
```

### pan:sys.stats

Response to stats request:

```javascript
{
  topic: 'pan:sys.stats',
  data: {
    published: 1234,
    delivered: 5678,
    dropped: 0,
    retainedEvicted: 5,
    subsCleanedUp: 2,
    errors: 1,
    subscriptions: 18,
    clients: 5,
    retained: 42,
    config: { /* current config */ }
  }
}
```

## Summary

**Required Fields:**
- `topic` (string) - Message routing address
- `data` (any) - JSON-serializable payload

**Auto-Generated Fields:**
- `id` (string) - UUID for deduplication/tracking
- `ts` (number) - Unix timestamp in milliseconds

**Feature Fields:**
- `retain` (boolean) - Retain for late subscribers
- `replyTo` (string) - Reply destination topic
- `correlationId` (string) - Request/reply correlation
- `headers` (object) - Custom metadata

**Constraints:**
- Topic: non-empty string, max 256 chars
- Data: JSON-serializable, max 512KB (configurable)
- Total message: max 1MB (configurable)
- Headers: string key-value pairs only

**Best Practices:**
- Let bus auto-generate `id` and `ts`
- Use structured objects for `data`
- Use `retain: true` only for actual state
- Follow response conventions (`ok`, `error`, `code`)
- Include relevant context in `headers` for tracing
- Keep messages small; paginate or reference external storage

For topic naming conventions, see Appendix A. For configuration options, see Appendix C.
