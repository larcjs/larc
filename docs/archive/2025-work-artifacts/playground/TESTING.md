# LARC Playground - Testing Guide

## Setup

1. **Server is running at:** http://localhost:8080
2. **Playground URL:** http://localhost:8080/playground/
3. **Registry:** 49 components across 10 categories

## Testing Checklist

### Initial Load
- [ ] Page loads without errors
- [ ] All 3 panels visible (palette, canvas, properties)
- [ ] Header shows "LARC Playground" with buttons
- [ ] Component palette shows categories
- [ ] Canvas shows empty state message
- [ ] Properties panel shows "Select a component" message

### Component Palette
- [ ] All 10 categories are displayed
- [ ] Each category shows component count
- [ ] Components have icons and names
- [ ] Search box is visible and functional
- [ ] Can expand/collapse categories

### Search Functionality
- [ ] Type "router" - should show routing components
- [ ] Type "store" - should show state management components
- [ ] Type "form" - should show form components
- [ ] Clear search - all components return
- [ ] Case-insensitive search works

### Adding Components to Canvas
- [ ] Click "pan-router" - adds to canvas
- [ ] Click "pan-store" - adds to canvas
- [ ] Click "pan-table" - adds to canvas
- [ ] Empty state message disappears
- [ ] Components appear in preview area
- [ ] Each component gets selection border on add

### Component Selection
- [ ] Click a component - gets selected (blue border)
- [ ] Properties panel updates with component info
- [ ] Component icon appears in properties
- [ ] Component name and description show
- [ ] Attributes list appears (if any)
- [ ] Click another component - selection changes
- [ ] Click canvas background - deselects all

### Properties Editing
- [ ] Select component with attributes
- [ ] Change text attribute - updates live
- [ ] Change number attribute - updates live
- [ ] Toggle boolean attribute - updates live
- [ ] Changes reflect immediately on canvas

### Canvas Controls
- [ ] Viewport dropdown shows Desktop/Tablet/Mobile
- [ ] Change to Tablet - canvas resizes
- [ ] Change to Mobile - canvas resizes smaller
- [ ] Change back to Desktop - full width
- [ ] "Clear All" button removes all components
- [ ] Empty state returns after clear

### Code Export
- [ ] Click "View Code" button
- [ ] Bottom panel appears
- [ ] HTML code is displayed
- [ ] Code includes DOCTYPE and proper structure
- [ ] Code includes pan-bus
- [ ] Code includes all added components
- [ ] Components have correct attributes
- [ ] Click "Copy" - copies to clipboard
- [ ] Button shows "Copied!" feedback
- [ ] Click "Download" - downloads HTML file
- [ ] Click "Hide Code" - panel disappears

### PAN Bus Monitor
- [ ] Click "PAN Monitor" button
- [ ] Bottom panel shows bus monitor
- [ ] Code exporter hides
- [ ] Monitor shows message list
- [ ] Add component - see messages
- [ ] Filter by topic works
- [ ] Clear log button works
- [ ] Click "Hide Monitor" - panel disappears

### Delete Component
- [ ] Select a component
- [ ] Click "Delete Component" in properties
- [ ] Component removed from canvas
- [ ] Properties panel returns to "no selection"
- [ ] Other components remain

### Edge Cases
- [ ] Add same component multiple times
- [ ] Delete all components one by one
- [ ] Search with no results
- [ ] Rapid clicking components
- [ ] Export code with no components
- [ ] Change properties rapidly
- [ ] Switch between viewport sizes rapidly

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge

### Console Checks
- [ ] Open browser dev tools
- [ ] No errors in console
- [ ] No 404s for resources
- [ ] Component imports successful
- [ ] Registry loads successfully

## Known Issues to Watch For

1. **Path Resolution**: Components should load from `../components/`
2. **Pan-bus**: Should initialize without errors
3. **Dynamic Imports**: May fail for components not yet implemented
4. **CORS**: Should not be an issue with local server
5. **Missing Components**: Some components may not have full implementation

## Success Criteria

- ✅ Can add at least 5 different components
- ✅ Properties panel shows and edits attributes
- ✅ Code export generates valid HTML
- ✅ Search filters components correctly
- ✅ No critical errors in console
- ✅ Responsive viewport controls work
- ✅ Delete and clear functionality works

## Reporting Issues

If you find bugs, note:
1. Component name (if applicable)
2. Steps to reproduce
3. Expected vs actual behavior
4. Browser and version
5. Console errors (if any)

## Next Steps After Testing

1. Fix any critical bugs found
2. Add missing component implementations
3. Improve error handling
4. Add keyboard shortcuts
5. Deploy to GitHub Pages
