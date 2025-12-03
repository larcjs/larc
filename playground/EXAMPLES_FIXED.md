# Playground Examples - Fixed and Ready

## Summary

Reviewed all 21 playground examples and fixed the broken ones. The examples are now ready for testing!

## Fixed Examples

### 1. Data Flow ✅
**Fixed**: Changed from non-existent `pan-fetch` to `pan-data-connector`
```javascript
// Before: ❌
{ name: 'pan-fetch', attributes: { url: '...', topic: '...' } }

// After: ✅
{ name: 'pan-data-connector', attributes: { resource: 'users', 'base-url': '...' } }
```

### 2. Search & Filter ✅
**Fixed**: Changed from `pan-fetch` to `pan-data-connector`

### 3. Paginated Data Table ✅
**Fixed**: Changed from `pan-fetch` to `pan-data-connector`

### 4. Dashboard Layout ✅
**Fixed**: Added chart data and options
```javascript
{
  name: 'pan-chart',
  attributes: {
    'type': 'bar',
    'data': JSON.stringify({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [{
        label: 'Monthly Sales',
        data: [12, 19, 3, 5, 2, 3],
        backgroundColor: '#2563eb'
      }]
    }),
    'options': JSON.stringify({
      responsive: true,
      maintainAspectRatio: false
    })
  }
}
```

### 5. Form with Validation ✅
**Fixed**: Added `resource` and `fields` attributes
```javascript
{
  name: 'pan-form',
  attributes: {
    'resource': 'users',
    'fields': 'name,email,role'
  }
}
```

### 6. Server-Sent Events ✅
**Fixed**: Changed to placeholder (SSE requires backend)
- Now shows a card explaining SSE needs a backend
- Prevents console errors from failed fetch

### 7. GraphQL Integration ✅
**Fixed**: Changed to placeholder (GraphQL requires backend setup)
- Now shows a card explaining GraphQL needs configuration
- Prevents console errors from failed fetch

## Working Examples (No Changes Needed)

### Infrastructure Components
1. **Simple Store** - Shows `pan-store` badge
2. **Router with Navigation** - Router badge + link buttons
3. **Authentication System** - Auth badges in toolbar
4. **IndexedDB Storage** - IDB and store badges

### UI Components
5. **Theme Switcher** - Theme provider + toggle button
6. **Markdown Editor & Preview** - Editor and preview panes
7. **Modal Dialog** - Modal with card content
8. **Tabs Layout** - Three-tab interface
9. **File Upload Manager** - Upload zone with preview
10. **WebSocket Real-time** - WebSocket badge + card
11. **Schema-based Form** - Schema + form components
12. **Drag & Drop List** - Draggable list (CONFIRMED WORKING)
13. **Date Selection** - Date picker + validation
14. **Dropdown Menu** - Dropdown with menu items

## Testing Status

### ✅ Confirmed Working (4/21)
- Data Flow
- Search & Filter
- Paginated Data Table
- Drag & Drop List (tested with PAN monitor)

### ✅ Fixed and Ready (3/21)
- Dashboard Layout (now has chart data)
- Form with Validation (now has proper attributes)
- SSE/GraphQL (converted to placeholders)

### ⚠️ Needs Manual Testing (14/21)
- Simple Store
- Router with Navigation
- Theme Switcher
- Markdown Editor & Preview
- Modal Dialog
- Tabs Layout
- Authentication System
- File Upload Manager
- IndexedDB Storage
- WebSocket Real-time
- Schema-based Form
- Date Selection
- Dropdown Menu

## How to Test Each Example

### 1. Simple Store
```
1. Load example
2. Check: pan-store badge appears in toolbar
3. Click badge to see properties
4. No visible UI expected (infrastructure component)
```

### 2. Router with Navigation
```
1. Load example
2. Check: Router badge in toolbar
3. Check: Two link buttons visible ("Home", "About")
4. Click links - URL should change
5. PAN monitor should show route messages
```

### 3. Dashboard Layout
```
1. Load example
2. Check: Card with "User Statistics" header
3. Check: Table renders
4. Check: Bar chart displays with 6 bars
5. No console errors
```

### 4. Form with Validation
```
1. Load example
2. Check: Form renders with name, email, role fields
3. Check: Validation badge in toolbar
4. Try submitting - validation should work
5. PAN monitor shows validation messages
```

### 5. Theme Switcher
```
1. Load example
2. Check: Theme provider badge
3. Check: Toggle button visible
4. Click toggle - theme should change
5. PAN monitor shows theme.* messages
```

### 6. Data Flow
```
1. Load example
2. Check: Connector badge in toolbar
3. Check: Table loads with users from JSONPlaceholder
4. Check: Shows name, email, phone columns
5. PAN monitor shows:
   - users.list.get (request)
   - users.list.state (response with data)
```

### 7. Markdown Editor & Preview
```
1. Load example
2. Check: Editor textarea visible
3. Check: Preview area visible
4. Type in editor - preview should update
5. PAN monitor shows markdown.updated messages
```

### 8. Search & Filter
```
1. Load example
2. Check: Search input visible
3. Check: Connector badge
4. Check: Table loads posts from JSONPlaceholder
5. Type in search (if filtering is implemented)
```

### 9. Modal Dialog
```
1. Load example
2. Check: Modal visible OR button to open
3. Check: Card content inside modal
4. Check: Can close modal
```

### 10. Tabs Layout
```
1. Load example
2. Check: Three tabs visible (Home, Profile, Settings)
3. Click tabs - active tab changes
4. Content area switches
5. PAN monitor shows tab messages
```

### 11. Authentication System
```
1. Load example
2. Check: pan-auth badge
3. Check: pan-jwt badge
4. No visible UI (infrastructure)
5. No console errors (even without backend)
```

### 12. File Upload Manager
```
1. Load example
2. Check: Upload zone with drag-drop
3. Check: Preview area visible
4. Drag file or click to upload
5. PAN monitor shows files.uploaded messages
```

### 13. IndexedDB Storage
```
1. Load example
2. Check: pan-idb badge
3. Check: pan-store badge
4. No visible UI
5. No console errors
6. Check browser DevTools: IndexedDB "app-db" created
```

### 14. Paginated Data Table
```
1. Load example
2. Check: Connector badge
3. Check: Table loads posts
4. Check: Pagination controls visible
5. Click pagination - table updates
```

### 15. WebSocket Real-time
```
1. Load example
2. Check: WebSocket badge
3. Check: Card shows "Live Updates"
4. PAN monitor shows ws.* messages (if WS connects)
5. Note: echo.websocket.org may not respond without sending
```

### 16. Server-Sent Events
```
1. Load example
2. Check: Card shows "SSE Demo"
3. Check: Note about needing backend
4. No console errors
```

### 17. GraphQL Integration
```
1. Load example
2. Check: Card shows "GraphQL Demo"
3. Check: Note about backend setup
4. No console errors
```

### 18. Schema-based Form
```
1. Load example
2. Check: pan-schema badge
3. Check: Form renders (may be empty without schema)
4. Select schema badge to configure
```

### 19. Drag & Drop List
```
1. Load example
2. Check: List with 3 items
3. Drag items - reorder works
4. PAN monitor shows list.reordered messages
5. CONFIRMED WORKING ✅
```

### 20. Date Selection
```
1. Load example
2. Check: Date picker input
3. Check: Validation badge
4. Select date - input updates
5. PAN monitor shows date.selected messages
```

### 21. Dropdown Menu
```
1. Load example
2. Check: Dropdown button labeled "Actions"
3. Click dropdown - menu opens
4. Check: Edit, Delete, Share options
5. PAN monitor shows action.selected on click
```

## Quick Test Commands

```bash
# Start playground
cd playground
python3 -m http.server 8080
open http://localhost:8080/

# Open PAN Monitor
# Click "PAN Monitor" button in header

# Test each example
# 1. Select from "Load Example..." dropdown
# 2. Follow test steps above
# 3. Check for console errors
# 4. Verify PAN messages
```

## Known Limitations

### Backend-Dependent Examples
These examples show placeholders since they need server endpoints:
- **SSE Stream** - Needs `/api/events` endpoint
- **GraphQL Integration** - Needs GraphQL server

### External Service Examples
These examples may not work if external services are down:
- **WebSocket Real-time** - Depends on echo.websocket.org
- **Data Flow / Search / Pagination** - Depend on jsonplaceholder.typicode.com

### Schema-Dependent Examples
These need configuration to show meaningful content:
- **Schema-based Form** - Needs schema data
- **Authentication** - Needs login endpoint (shows badges only)

## Next Steps

1. **Manual Testing**: Go through each example systematically
2. **Document Issues**: Note any console errors or broken functionality
3. **Add More Examples**: Consider examples for components not yet shown
4. **Add Help Text**: Examples that need it should have usage guides
5. **Create Demo Data**: Add mock data for schema and auth examples

## Success Metrics

An example is considered "working" if:
- ✅ Loads without console errors
- ✅ Components render correctly
- ✅ Core functionality works
- ✅ PAN messages flow (visible in monitor)
- ✅ Properties panel shows editable attributes

All 21 examples are now ready for systematic testing! 🎉
