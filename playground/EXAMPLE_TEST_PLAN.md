# Playground Examples Test Plan

This document tracks the testing status of all playground examples.

## Test Criteria

For each example, verify:
- ✅ **Loads**: Components load without console errors
- ✅ **Renders**: Components display correctly in canvas
- ✅ **Functions**: Core functionality works as expected
- ✅ **PAN**: PAN messages flow (check monitor)

## Examples Status

### 1. Simple Store ⚠️
**Status**: Needs Testing
**Components**: `pan-store`
**Expected**: Badge in toolbar, can be selected and configured
**Issues**: None yet

---

### 2. Router with Navigation ⚠️
**Status**: Needs Testing
**Components**: `pan-router`, `pan-link` (x2)
**Expected**:
- Router badge in toolbar
- Two link buttons visible
- Links change URL on click
**Issues**: None yet

---

### 3. Dashboard Layout ⚠️
**Status**: Needs Testing
**Components**: `pan-card`, `pan-table`, `pan-chart`
**Expected**:
- Card with "User Statistics" header
- Table with demo data
- Chart placeholder
**Issues**: `pan-chart` needs data to display

---

### 4. Form with Validation ⚠️
**Status**: Needs Testing
**Components**: `pan-form`, `pan-validation`
**Expected**:
- Form fields render
- Validation badge in toolbar
**Issues**: Need to check if form renders without `resource` or `fields` attributes

---

### 5. Theme Switcher ⚠️
**Status**: Needs Testing
**Components**: `pan-theme-provider`, `pan-theme-toggle`
**Expected**:
- Theme provider badge in toolbar
- Toggle button visible
- Clicking toggle changes theme
**Issues**: None yet

---

### 6. Data Flow ✅
**Status**: FIXED (in this session)
**Components**: `pan-data-connector`, `pan-data-table`
**Expected**:
- Connector badge in toolbar
- Table loads with user data from JSONPlaceholder
- Shows name, email, phone columns
**Issues**: FIXED - Changed from non-existent `pan-fetch` to `pan-data-connector`

---

### 7. Markdown Editor & Preview ⚠️
**Status**: Needs Testing
**Components**: `pan-markdown-editor`, `pan-markdown-renderer`
**Expected**:
- Editor textarea visible
- Preview area visible
- Typing in editor updates preview
- PAN messages flow on input
**Issues**: None yet

---

### 8. Search & Filter ✅
**Status**: FIXED (in this session)
**Components**: `pan-search-bar`, `pan-data-connector`, `pan-data-table`
**Expected**:
- Search input visible
- Connector badge in toolbar
- Table loads posts data
- Search filters table (if implemented)
**Issues**: FIXED - Changed from `pan-fetch` to `pan-data-connector`

---

### 9. Modal Dialog ⚠️
**Status**: Needs Testing
**Components**: `pan-modal`, `pan-card`
**Expected**:
- Modal visible or trigger button
- Card content inside modal
**Issues**: Need to check if modal auto-opens or needs trigger

---

### 10. Tabs Layout ⚠️
**Status**: Needs Testing
**Components**: `pan-tabs`
**Expected**:
- Three tabs: Home, Profile, Settings
- Tabs are clickable
- Active tab is highlighted
**Issues**: Tabs attribute is JSON string, may need parsing

---

### 11. Authentication System ⚠️
**Status**: Needs Testing
**Components**: `pan-auth`, `pan-jwt`
**Expected**:
- Both badges in toolbar
- No visible UI (infrastructure components)
**Issues**: Can't test auth without backend, but should load without errors

---

### 12. File Upload Manager ⚠️
**Status**: Needs Testing
**Components**: `file-upload`, `pan-files`
**Expected**:
- Upload zone with drag-drop
- Preview area
- File list component
**Issues**: None yet

---

### 13. IndexedDB Storage ⚠️
**Status**: Needs Testing
**Components**: `pan-idb`, `pan-store`
**Expected**:
- Both badges in toolbar
- No visible UI
**Issues**: None yet

---

### 14. Paginated Data Table ✅
**Status**: FIXED (in this session)
**Components**: `pan-data-connector`, `pan-data-table`, `pan-pagination`
**Expected**:
- Connector badge
- Table with posts data
- Pagination controls
**Issues**: FIXED - Changed from `pan-fetch` to `pan-data-connector`

---

### 15. WebSocket Real-time ⚠️
**Status**: Needs Testing
**Components**: `pan-websocket`, `pan-card`
**Expected**:
- WebSocket badge
- Card shows "Live Updates"
- Messages appear when WS receives data
**Issues**: echo.websocket.org may not respond without sending

---

### 16. Server-Sent Events ❌
**Status**: BROKEN
**Components**: `pan-sse`, `pan-data-table`
**Expected**:
- SSE badge
- Table receives streamed data
**Issues**:
- `/api/events` endpoint doesn't exist (playground is static)
- Table uses `listen-topic` (deprecated?) instead of `resource`

---

### 17. GraphQL Integration ❌
**Status**: BROKEN
**Components**: `pan-graphql-connector`, `pan-data-table`
**Expected**:
- Connector badge
- Table loads GraphQL data
**Issues**:
- `https://api.example.com/graphql` is a fake endpoint
- Should use a real GraphQL API

---

### 18. Schema-based Form ⚠️
**Status**: Needs Testing
**Components**: `pan-schema`, `pan-schema-form`
**Expected**:
- Schema badge
- Form renders from schema
**Issues**: Need to check if works without schema data

---

### 19. Drag & Drop List ✅
**Status**: WORKING (tested this session with PAN monitor)
**Components**: `drag-drop-list`
**Expected**:
- List with 3 items
- Items are draggable
- PAN messages on reorder
**Issues**: None - confirmed working

---

### 20. Date Selection ⚠️
**Status**: Needs Testing
**Components**: `pan-date-picker`, `pan-validation`
**Expected**:
- Date picker input
- Validation badge
**Issues**: None yet

---

### 21. Dropdown Menu ⚠️
**Status**: Needs Testing
**Components**: `pan-dropdown`
**Expected**:
- Dropdown button with "Actions"
- Opens menu with Edit, Delete, Share
**Issues**: Items is JSON array string

---

## Quick Fixes Needed

### 1. SSE Stream Example
Change to use mock data or remove:
```javascript
// Option 1: Remove example (SSE needs backend)
// Option 2: Use mock data with pan-store
```

### 2. GraphQL Example
Use a real public GraphQL API:
```javascript
{
  name: 'pan-graphql-connector',
  attributes: {
    'endpoint': 'https://countries.trevorblades.com/',
    'resource': 'countries',
    'query': '{ countries { code name } }'
  }
}
```

### 3. Form Examples
Add `resource` and `fields` attributes:
```javascript
{
  name: 'pan-form',
  attributes: {
    'resource': 'users',
    'fields': 'name,email,role'
  }
}
```

### 4. Chart Example
Add chart data:
```javascript
{
  name: 'pan-chart',
  attributes: {
    'type': 'bar',
    'data': JSON.stringify({
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Sales',
        data: [12, 19, 3, 5]
      }]
    })
  }
}
```

## Testing Checklist

- [ ] 1. Simple Store
- [ ] 2. Router with Navigation
- [ ] 3. Dashboard Layout
- [ ] 4. Form with Validation
- [ ] 5. Theme Switcher
- [x] 6. Data Flow
- [ ] 7. Markdown Editor & Preview
- [x] 8. Search & Filter
- [ ] 9. Modal Dialog
- [ ] 10. Tabs Layout
- [ ] 11. Authentication System
- [ ] 12. File Upload Manager
- [ ] 13. IndexedDB Storage
- [x] 14. Paginated Data Table
- [ ] 15. WebSocket Real-time
- [ ] 16. Server-Sent Events
- [ ] 17. GraphQL Integration
- [ ] 18. Schema-based Form
- [x] 19. Drag & Drop List
- [ ] 20. Date Selection
- [ ] 21. Dropdown Menu

## Next Steps

1. Fix SSE and GraphQL examples (broken endpoints)
2. Add missing attributes (data, resource, fields)
3. Test each example systematically
4. Document expected behavior
5. Add troubleshooting tips
