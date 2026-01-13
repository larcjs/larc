# Data Flow Example Fix

## Problem

The "Data Flow" example (and several other examples) were using a non-existent `<pan-fetch>` component. This caused:
1. No data to be fetched and displayed in the table
2. No way to configure the fetch URL in the properties panel
3. Confusion about how to connect REST APIs to LARC components

## Root Cause

There is a `panFetch` utility in `/ui/pan-fetch.mjs`, but it's **not a Web Component**—it's a JavaScript utility function for authenticated fetch operations. The examples incorrectly tried to use it as `<pan-fetch>` with attributes.

## Solution

The correct component to use is **`<pan-data-connector>`**, which:
- Is a real Web Component that can be added to the DOM
- Connects REST APIs to PAN topics
- Automatically handles CRUD operations
- Works seamlessly with `<pan-data-table>` and `<pan-form>`

## Changes Made

### 1. Fixed Examples (`examples.mjs`)

Updated three examples to use `pan-data-connector` instead of the non-existent `pan-fetch`:

**Data Flow Example:**
```javascript
// Before (broken):
{
  name: 'pan-fetch',
  attributes: {
    'url': 'https://jsonplaceholder.typicode.com/users',
    'topic': 'users.loaded'
  }
}

// After (working):
{
  name: 'pan-data-connector',
  attributes: {
    'resource': 'users',
    'base-url': 'https://jsonplaceholder.typicode.com'
  }
}
```

Also updated:
- **Search & Filter** example
- **Pagination** example

### 2. Added Component Metadata (`component-registry.json`)

Added complete attribute definitions for `pan-data-connector`:

```json
{
  "name": "pan-data-connector",
  "attributes": [
    {
      "name": "resource",
      "type": "string",
      "description": "Logical resource name (e.g., 'users', 'posts')",
      "required": true
    },
    {
      "name": "base-url",
      "type": "string",
      "description": "Base URL for the API",
      "required": true
    },
    {
      "name": "key",
      "type": "string",
      "description": "Identifier field name (default: 'id')",
      "default": "id"
    },
    {
      "name": "list-path",
      "type": "string",
      "description": "Override for list endpoint (default: /{resource})"
    },
    {
      "name": "item-path",
      "type": "string",
      "description": "Override for item endpoint (default: /{resource}/:id)"
    },
    {
      "name": "update-method",
      "type": "select",
      "description": "HTTP method for updates (default: PUT)",
      "options": ["PUT", "PATCH"]
    },
    {
      "name": "credentials",
      "type": "select",
      "description": "Fetch credentials mode",
      "options": ["omit", "same-origin", "include"]
    }
  ]
}
```

### 3. Added Help Text

Added comprehensive help text explaining:
- How `pan-data-connector` works with `pan-data-table`
- PAN topic patterns (`{resource}.list.get` → `{resource}.list.state`)
- Example configurations
- Related components

## How It Works Now

### Architecture

```
[pan-data-connector]  ←→  [PAN Bus]  ←→  [pan-data-table]
       ↓                                          ↑
   REST API                                   Displays
```

### Flow

1. **`pan-data-connector`** connects on mount and:
   - Publishes `{resource}.list.get` to request data
   - Fetches from `{base-url}/{resource}`
   - Publishes `{resource}.list.state` with results (retained)

2. **`pan-data-table`** subscribes to `{resource}.list.state` and:
   - Receives the data
   - Renders it in a table
   - On row click, publishes `{resource}.item.select`

### Example Usage

```html
<!-- Connector: Fetches from API and publishes to PAN -->
<pan-data-connector
  resource="users"
  base-url="https://jsonplaceholder.typicode.com">
</pan-data-connector>

<!-- Table: Subscribes to PAN and displays data -->
<pan-data-table
  resource="users"
  columns="name,email,phone">
</pan-data-table>
```

## Testing

1. **Start the playground:**
   ```bash
   cd playground
   python3 -m http.server 8080
   open http://localhost:8080/
   ```

2. **Load the "Data Flow" example**

3. **Verify:**
   - `pan-data-connector` appears with a badge (it's a non-UI component)
   - `pan-data-table` displays user data from JSONPlaceholder API
   - Properties panel shows all configurable attributes
   - Help text explains how to use it

## Related Components

- **`pan-data-table`**: Displays data from `{resource}.list.state`
- **`pan-form`**: CRUD form that works with data connector
- **`pan-graphql-connector`**: Similar connector for GraphQL APIs
- **`pan-php-connector`**: Specialized connector for PHP backends

## Benefits

✅ **Working data fetching** - API data now loads correctly
✅ **Editable properties** - All attributes can be configured in the UI
✅ **Self-documenting** - Help text explains the component
✅ **CRUD-ready** - Full create, read, update, delete support
✅ **Auth-aware** - Automatically includes auth tokens if `pan-auth` is present

## Why This Pattern?

Instead of a simple `<pan-fetch url="...">` component, LARC uses resource-oriented connectors because:

1. **CRUD operations**: Not just GET—also POST, PUT, DELETE
2. **PAN integration**: Publishes to structured topics other components can use
3. **State management**: Retained messages keep data in sync
4. **Live updates**: Individual item updates trigger table refreshes
5. **Form integration**: `pan-form` can save/delete through the same connector

This is more powerful than a simple fetch wrapper!
