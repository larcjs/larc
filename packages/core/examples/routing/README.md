# PAN Routing Examples

This directory contains interactive examples demonstrating the PAN routing system.

## Examples

### 01. Basic Routing
**File:** `01-basic-routing.html`

Demonstrates the simplest routing scenario: when a user login succeeds, automatically show the dashboard.

**Key Concepts:**
- Basic route definition
- EMIT action
- LOG action
- Route matching on message type

### 02. Filtered Routing
**File:** `02-filtered-routing.html`

Shows how to use predicates to filter messages based on payload values. Creates an alert when temperature exceeds a threshold.

**Key Concepts:**
- Route predicates (`where` clause)
- Conditional routing
- Transform operations (pick)
- Inheriting payload in actions

### 03. Dynamic Route Management
**File:** `03-dynamic-routes.html`

Interactive demo for adding, enabling/disabling, and removing routes at runtime.

**Key Concepts:**
- Runtime route management
- `pan.routes.add()`, `enable()`, `disable()`, `remove()`
- Route change listeners
- Route listing and filtering

### 04. Storage Persistence
**File:** `04-storage-persistence.html`

Demonstrates route persistence using localStorage. Routes survive page refreshes.

**Key Concepts:**
- Storage adapters
- LocalStorageAdapter
- Route persistence
- Loading routes on startup

### 05. Control Messages
**File:** `05-control-messages.html`

Shows how to configure routes by sending control messages over the bus itself (useful for admin panels).

**Key Concepts:**
- Control messages
- `pan:control` event
- Remote route configuration
- Control message types

### 06. Debug & Tracing
**File:** `06-debug-tracing.html`

Real-time monitoring of message flow through routes with statistics and trace export.

**Key Concepts:**
- Message tracing
- Debug manager API
- Statistics tracking
- Trace export/import

## Running the Examples

1. **Simple HTTP Server:**
   ```bash
   cd core
   python3 -m http.server 8000
   ```

2. **Open in Browser:**
   Navigate to `http://localhost:8000/examples/routing/01-basic-routing.html`

3. **Browser Console:**
   All examples log to the browser console. Open DevTools (F12) to see detailed logs.

## Key Routing Concepts

### Route Structure

```javascript
{
  name: 'Route Name',
  enabled: true,
  order: 0,
  match: {
    type: 'message.type',
    topic: 'topic-name',
    where: { op: 'gt', path: 'payload.value', value: 100 }
  },
  transform: {
    op: 'pick',
    paths: ['payload.field1', 'payload.field2']
  },
  actions: [
    {
      type: 'EMIT',
      message: { type: 'new.message' },
      inherit: ['payload']
    },
    {
      type: 'LOG',
      level: 'info',
      template: 'Message: {{payload.field1}}'
    }
  ]
}
```

### Predicate Operators

- `eq`, `neq` - Equality/inequality
- `gt`, `gte`, `lt`, `lte` - Numeric comparisons
- `in` - Value in array
- `regex` - Regular expression match
- `and`, `or`, `not` - Logical operators

### Actions

- **EMIT** - Emit a new message
- **FORWARD** - Forward original message to different topic
- **LOG** - Log to console
- **CALL** - Call registered handler function

### Transform Operations

- **identity** - Pass through unchanged
- **pick** - Select specific fields
- **map** - Apply function to field
- **custom** - Apply custom transform function

## API Reference

### Global API

```javascript
// Routing
window.pan.routes.add(route)
window.pan.routes.update(id, patch)
window.pan.routes.remove(id)
window.pan.routes.enable(id)
window.pan.routes.disable(id)
window.pan.routes.get(id)
window.pan.routes.list(filter)
window.pan.routes.clear()

// Debug
window.pan.debug.enableTracing(options)
window.pan.debug.disableTracing()
window.pan.debug.getTrace()
window.pan.debug.clearTrace()
window.pan.debug.getStats()
window.pan.debug.export()
```

## Tips

1. **Enable Debug Mode:**
   ```html
   <pan-bus enable-routing="true" debug="true"></pan-bus>
   ```

2. **Enable Tracing:**
   ```html
   <pan-bus enable-routing="true" enable-tracing="true"></pan-bus>
   ```

3. **Check Route Execution:**
   Use `window.pan.routes.getStats()` to see how many routes have been evaluated and matched.

4. **Inspect Trace:**
   Use `window.pan.debug.getTrace()` to see message flow through routes.

## Next Steps

- Read the [API Reference](../../docs/PAN-ROUTING.md)
- Check the [TypeScript Definitions](../../src/types/index.d.ts)
- Explore [Storage Adapters](../../src/components/pan-storage.mjs)
