# PAN Runtime Routes - API Reference

## Overview

PAN Runtime Routes extends the PAN messaging bus with declarative, runtime-configurable routing rules. Routes define how messages should be matched, transformed, and acted upon as they flow through the system.

**Key Features:**
- ✅ Runtime route configuration (add, update, remove)
- ✅ Declarative matching with predicates
- ✅ Message transformations
- ✅ Multiple action types (EMIT, FORWARD, LOG, CALL)
- ✅ Pluggable storage for persistence
- ✅ Control messages for remote configuration
- ✅ Debug tracing and introspection
- ✅ Error isolation and handling

## Quick Start

### Enable Routing

```html
<pan-bus enable-routing="true"></pan-bus>
```

### Add a Simple Route

```javascript
window.pan.routes.add({
  name: 'Login -> Dashboard',
  enabled: true,
  match: {
    type: 'user.login.success'
  },
  actions: [
    {
      type: 'EMIT',
      message: {
        type: 'ui.show.dashboard'
      }
    }
  ]
});
```

### Publish a Message

```javascript
document.dispatchEvent(new CustomEvent('pan:publish', {
  detail: {
    type: 'user.login.success',
    payload: { username: 'alice' }
  }
}));
```

The route will automatically emit `ui.show.dashboard` when a login succeeds.

## Route Definition

### Route Structure

```typescript
interface Route {
  id: string;              // Auto-generated if not provided
  name?: string;           // Human-readable name
  enabled: boolean;        // Whether route is active
  order?: number;          // Execution order (lower = earlier)
  match: RouteMatch;       // Matching criteria
  transform?: Transform;   // Optional transformation
  actions: Action[];       // Actions to execute
  meta?: {                 // Metadata
    createdBy?: string;
    createdAt?: number;
    updatedAt?: number;
    tags?: string[];
  };
}
```

## Matching

### Match Criteria

Routes match messages based on multiple criteria. All examples in the [routing examples directory](../examples/routing/).

See complete documentation and interactive examples at [PAN-ROUTING-API.md](./PAN-ROUTING-API.md).
