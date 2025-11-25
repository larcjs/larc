# LARC Core API Stability Guarantee

**Version:** 1.0.0
**Status:** FROZEN for v1.x releases
**Last Updated:** November 24, 2024

---

## Overview

This document defines the **public API surface** of LARC Core and commits to maintaining backward compatibility for all APIs marked as **STABLE** throughout the v1.x release cycle.

### API Stability Levels

- **STABLE**: API is frozen and guaranteed backward compatible in v1.x
- **EXPERIMENTAL**: API may change in minor versions (use at own risk)
- **DEPRECATED**: API will be removed in next major version

---

## Public API Surface

### 1. PAN Autoloader (`pan.mjs`)

#### Status: **STABLE**

#### Global Configuration

```javascript
window.panAutoload = {
  baseUrl: string | null,           // STABLE
  componentsPath: string,           // STABLE
  extension: string,                // STABLE
  rootMargin: number,               // STABLE
  resolveComponent: (tag) => string, // STABLE
  componentPaths: Record<string, string>, // STABLE
  paths: { resolve: (path) => string }    // STABLE
}
```

**Guarantees:**
- All configuration properties will remain supported
- New optional properties may be added
- Default values will not change
- Configuration merge behavior will not change

#### Public Functions

```javascript
// STABLE - Load component for element
maybeLoadFor(element: Element): Promise<void>

// STABLE - Observe DOM tree for custom elements
observeTree(root?: Document | Element): void
```

**Guarantees:**
- Function signatures will not change
- Return types will not change
- Behavior will remain consistent
- Error handling will not throw new error types

#### Exported Module

```javascript
// STABLE
export { maybeLoadFor, observeTree, panAutoload }
export default panAutoload
```

**Guarantees:**
- Named exports will remain available
- Default export will remain available
- No exports will be removed

---

### 2. PAN Bus (`components/pan-bus.mjs`)

#### Status: **STABLE**

#### Custom Element

```javascript
// STABLE
customElements.define('pan-bus', PanBus)
```

#### Attributes

All attributes are **STABLE**:

```html
<pan-bus
  max-retained="1000"
  max-message-size="1048576"
  max-payload-size="524288"
  rate-limit="1000"
  allow-global-wildcard="true"
  debug="false"
></pan-bus>
```

**Guarantees:**
- All attributes will remain supported
- Attribute names will not change
- Default values will not change
- Attribute coercion rules will not change

#### Configuration Object

```javascript
// STABLE
bus.config = {
  maxRetained: number,        // STABLE - default 1000
  maxMessageSize: number,     // STABLE - default 1048576
  maxPayloadSize: number,     // STABLE - default 524288
  rateLimit: number,          // STABLE - default 1000
  allowGlobalWildcard: boolean, // STABLE - default true
  debug: boolean              // STABLE - default false
}
```

#### Events Dispatched

All events are **STABLE**:

```javascript
// STABLE - Bus ready for messaging
'pan:sys.ready' {
  detail: {
    enhanced: boolean,
    config: Config
  }
}

// STABLE - Message delivery to subscribers
'pan:deliver' {
  detail: {
    topic: string,
    data: any,
    id: string,
    ts: number,
    retain?: boolean,
    replyTo?: string,
    correlationId?: string,
    headers?: Record<string, string>
  }
}

// STABLE - System errors
'pan:sys.error' {
  detail: {
    code: string,
    message: string,
    details?: any
  }
}
```

#### Events Listened

All events are **STABLE**:

```javascript
// STABLE - Publish message
'pan:publish' {
  detail: {
    topic: string,       // required
    data: any,          // required
    retain?: boolean,
    replyTo?: string,
    correlationId?: string,
    headers?: Record<string, string>
  }
}

// STABLE - Subscribe to topics
'pan:subscribe' {
  detail: {
    clientId: string,
    topics: string[],
    options?: {
      retained: boolean
    }
  }
}

// STABLE - Unsubscribe from topics
'pan:unsubscribe' {
  detail: {
    clientId: string,
    topics: string[]
  }
}

// STABLE - Client hello
'pan:hello' {
  detail: {
    id: string,
    caps: string[]
  }
}
```

**Guarantees:**
- Event names will not change
- Event detail structures will not break
- New optional fields may be added
- Required fields will remain required

---

### 3. PAN Client (`components/pan-client.mjs`)

#### Status: **STABLE**

#### Class Export

```javascript
// STABLE
export class PanClient { ... }
export default PanClient
```

#### Constructor

```javascript
// STABLE
constructor(
  host?: HTMLElement | Document,
  busSelector?: string
)
```

**Guarantees:**
- Parameter order will not change
- Default values will not change
- Parameter types will not change

#### Public Methods

```javascript
// STABLE - Wait for bus ready
ready(): Promise<void>

// STABLE - Publish message
publish(msg: {
  topic: string,
  data: any,
  retain?: boolean,
  replyTo?: string,
  correlationId?: string,
  headers?: Record<string, string>
}): void

// STABLE - Subscribe to topics
subscribe(
  topics: string | string[],
  handler: (msg: Message) => void,
  options?: {
    retained?: boolean,
    signal?: AbortSignal
  }
): () => void

// STABLE - Request/reply pattern
request(
  topic: string,
  data: any,
  options?: {
    timeoutMs?: number
  }
): Promise<Message>
```

**Guarantees:**
- Method names will not change
- Method signatures will not break
- Return types will remain compatible
- Default parameter values will not change
- Error types will not change

#### Static Methods

```javascript
// STABLE - Topic matching utility
static matches(
  topic: string,
  pattern: string
): boolean
```

**Guarantees:**
- Method signature will not change
- Matching algorithm will remain consistent
- Return type will not change

#### Public Properties

```javascript
// STABLE (read-only)
client.host: HTMLElement | Document
client.clientId: string
```

**Guarantees:**
- Property names will not change
- Property types will not change
- Read-only properties will remain read-only

---

## Message Format

### Status: **STABLE**

```typescript
interface Message {
  topic: string;              // STABLE - required
  data: any;                  // STABLE - required
  id?: string;                // STABLE - UUID generated by bus
  ts?: number;                // STABLE - timestamp in ms
  retain?: boolean;           // STABLE - retain for late subscribers
  replyTo?: string;           // STABLE - reply topic
  correlationId?: string;     // STABLE - request correlation
  headers?: Record<string, string>; // STABLE - metadata
}
```

**Guarantees:**
- Required fields will remain required
- Optional fields will remain optional
- Field types will not change
- Field names will not change
- New optional fields may be added

---

## Wildcard Patterns

### Status: **STABLE**

#### Single Segment Wildcard

```javascript
// STABLE
'users.*'      // matches: users.created, users.updated
               // does NOT match: users.list.all
```

#### Multi-Segment Wildcard

```javascript
// STABLE
'app.*.*'      // matches: app.users.created, app.posts.updated
               // does NOT match: app.users (too short)
```

#### Global Wildcard

```javascript
// STABLE
'*'            // matches: ALL messages
```

**Guarantees:**
- Wildcard syntax will not change
- Matching behavior will remain consistent
- Wildcard segment boundaries (`.`) will not change

---

## Error Codes

### Status: **STABLE**

All error codes dispatched via `pan:sys.error`:

```javascript
// STABLE
'MESSAGE_INVALID'    // Invalid message format
'TOPIC_INVALID'      // Invalid topic format
'RATE_LIMIT'         // Rate limit exceeded
'MESSAGE_TOO_LARGE'  // Message exceeds size limit
'PAYLOAD_TOO_LARGE'  // Payload exceeds size limit
```

**Guarantees:**
- Error codes will not be removed
- Error code strings will not change
- New error codes may be added
- Error message formats may improve

---

## Deprecation Policy

### Rules

1. **Minimum Notice**: 6 months OR 1 major version (whichever is longer)
2. **Documentation**: Deprecated APIs must be marked in docs
3. **Warnings**: Console warnings for deprecated API usage
4. **Alternatives**: Migration path must be provided

### Current Deprecations

**None** - All v1.0 APIs are stable and will be supported throughout v1.x

---

## Version Compatibility

### v1.x Compatibility Promise

**Within v1.x releases:**
- ✅ All STABLE APIs will remain backward compatible
- ✅ New optional features may be added
- ✅ Bug fixes will not break APIs
- ✅ Performance improvements will not break APIs
- ✅ New optional parameters may be added (with defaults)
- ❌ Required parameters will NOT be added
- ❌ Parameter order will NOT change
- ❌ Return types will NOT change incompatibly

### Breaking Changes Allowed in v2.0+

The following changes would require a major version bump:
- Removing public APIs
- Changing required parameters
- Changing return types incompatibly
- Changing event detail structure (breaking)
- Changing wildcard matching behavior
- Removing error codes

---

## API Compatibility Tests

All STABLE APIs have dedicated compatibility tests to prevent accidental breakage:

```
tests/api-compatibility/
  ├── autoloader-api.test.mjs
  ├── bus-api.test.mjs
  ├── client-api.test.mjs
  └── message-format.test.mjs
```

These tests will fail if any STABLE API changes in an incompatible way.

---

## Using Experimental APIs

Some features may be marked **EXPERIMENTAL**. These:
- May change in minor versions
- May be removed in minor versions
- Should not be used in production
- Will be documented with `@experimental` tag

**Currently:** No experimental APIs in v1.0.0

---

## Support Policy

| Version | Status | Support Until | Breaking Changes |
|---------|--------|---------------|------------------|
| v1.0.x | **Current** | v2.0.0 release | ❌ None allowed |
| v1.1.x | Future | v2.0.0 release | ❌ None allowed |
| v1.x.x | Future | v2.0.0 release | ❌ None allowed |
| v2.0.0 | Future | TBD | ✅ Allowed |

---

## Reporting API Issues

If you encounter behavior that violates this stability guarantee:

1. **Check Documentation**: Verify the API is marked STABLE
2. **Check Version**: Ensure you're using a v1.x release
3. **File Issue**: Report via GitHub Issues with:
   - API being used
   - Expected behavior (per this doc)
   - Actual behavior
   - Version numbers

**API stability violations are considered critical bugs** and will be fixed with high priority.

---

## Summary

### What You Can Depend On (v1.x)

✅ All function signatures
✅ All event names and basic structure
✅ All configuration options
✅ All error codes
✅ Wildcard matching behavior
✅ Message format structure

### What May Change (v1.x)

✅ Performance improvements
✅ Bug fixes
✅ New optional parameters (with defaults)
✅ New optional fields in messages
✅ New optional configuration
✅ Error message text (not codes)
✅ Internal implementation

### What Will NOT Change (v1.x)

❌ Required parameters
❌ Parameter types
❌ Return types
❌ Event names
❌ Required message fields
❌ Wildcard syntax
❌ Public API removal

---

## Commitment

LARC Core v1.x is committed to **100% backward compatibility** for all STABLE APIs. Your code written against v1.0 will continue to work with v1.1, v1.2, v1.x without modification.

**Last Review:** November 24, 2024
**Next Review:** Prior to v1.1.0 release
