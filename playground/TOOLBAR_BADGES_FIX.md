# Toolbar Badges for Non-UI Components

## Problem

Non-UI components (like `pan-data-connector`, `pan-store`, `pan-bus`, etc.) were being rendered as full-width blocks in the canvas, taking up space and cluttering the preview area. This made the canvas feel messy and confusing.

## Solution

Move non-UI component badges to the **canvas toolbar**, alongside the viewport switcher and Clear All button. They now appear as small, clickable badges that:
- Don't clutter the canvas
- Are always visible for selection
- Show what infrastructure components are active
- Can be clicked to open their properties

## Visual Layout

### Before
```
┌─────────────────────────────────────┐
│ [Clear All]          [Desktop ▼]    │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────────────────────────┐   │
│  │ 📦 Data Connector           │   │
│  │ REST data connector for...  │   │
│  │ Configure in properties →   │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ Card Title                  │   │
│  │ Card content...             │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### After
```
┌──────────────────────────────────────────────┐
│ [Clear All] [📦 Data Connector]  [Desktop ▼] │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────────────────────────┐     │
│  │ Card Title                         │     │
│  │ Card content...                    │     │
│  └────────────────────────────────────┘     │
│                                              │
└──────────────────────────────────────────────┘
```

## Changes Made

### 1. Updated Canvas Toolbar (`pg-canvas.mjs`)

**Modified HTML structure:**
```javascript
<div class="canvas-toolbar">
  <div class="toolbar-left">
    <button class="btn-clear">Clear All</button>
    <div class="non-ui-badges" id="non-ui-badges"></div>
  </div>
  <select class="viewport-size">...</select>
</div>
```

**Added badge management methods:**
```javascript
addNonUIBadge(element, componentMeta) {
  // Creates badge in toolbar
  const badge = document.createElement('div');
  badge.className = 'non-ui-badge';
  badge.textContent = `${componentMeta.icon} ${componentMeta.displayName}`;
  badge.dataset.componentId = element.dataset.componentId;

  // Click to select component
  badge.addEventListener('click', () => {
    this.selectComponent(element);
  });

  badgeContainer.appendChild(badge);
}

removeNonUIBadge(componentId) {
  // Removes badge when component is deleted
}
```

**Modified `addComponent` method:**
- Non-UI components are still added to DOM (for functionality)
- But they're hidden with `element.style.display = 'none'`
- A badge is added to the toolbar instead
- UI components work as before

### 2. Added CSS Styles (`playground.css`)

**Toolbar layout:**
```css
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.non-ui-badges {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
```

**Badge styling:**
```css
.non-ui-badge {
  display: inline-flex;
  align-items: center;
  padding: 0.375rem 0.75rem;
  background: #667eea;
  color: white;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.non-ui-badge:hover {
  background: #5568d3;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}
```

### 3. Updated Methods to Handle Badges

**`clearAll()`:**
- Now clears badges from toolbar
- Resets badge container to empty

**`loadExample()`:**
- Checks if component is non-UI
- Adds badge to toolbar for infrastructure components
- Hides the actual element in canvas

## How It Works

### Adding a Non-UI Component

1. User clicks component in palette (e.g., `pan-data-connector`)
2. Component is created and added to DOM (hidden)
3. Badge is added to toolbar with icon and name
4. Component is selected (shows properties panel)
5. Canvas stays clean!

### Selecting a Non-UI Component

1. Click the badge in the toolbar
2. Component is selected
3. Properties panel shows on the right
4. You can edit all attributes

### Component Categories

**Non-UI (shown as badges):**
- `state` - State management (pan-store, pan-computed-state)
- `routing` - Router components (pan-router)
- `data` - Data connectors (pan-data-connector, pan-graphql-connector)
- `devtools` - Developer tools (pan-bus-monitor)
- `advanced` - Advanced utilities (pan-offline-sync, pan-schema-validator)
- `auth` - Authentication (pan-auth, pan-jwt)

**UI (shown in canvas):**
- `ui` - Visual components (pan-card, pan-button)
- `forms` - Form elements (pan-form, pan-input)
- `content` - Content display (pan-tabs, pan-modal)

## Benefits

✅ **Clean canvas** - Only UI components visible in preview
✅ **Always accessible** - Badges visible at top, easy to click
✅ **Compact display** - Multiple infrastructure components don't clutter
✅ **Visual indicator** - See what infrastructure is active at a glance
✅ **Functional** - Components still work (hidden but mounted in DOM)
✅ **Consistent UX** - Toolbar pattern familiar from dev tools

## Examples

### Data Flow Example
```
Toolbar: [Clear All] [📦 Data Connector] [Desktop ▼]
Canvas:  Only shows the data table (UI component)
```

### Complex App
```
Toolbar: [Clear All] [📦 Data Connector] [🔐 Auth] [📍 Router] [Desktop ▼]
Canvas:  Shows cards, forms, tables, buttons (UI components)
```

## Testing

1. **Start playground:**
   ```bash
   cd playground
   python3 -m http.server 8080
   open http://localhost:8080/
   ```

2. **Load "Data Flow" example:**
   - Should see `📦 Data Connector` badge in toolbar
   - Canvas only shows the table
   - Click badge to select data connector
   - Properties panel shows on right

3. **Add more components:**
   - Add `pan-store` (state) → badge in toolbar
   - Add `pan-auth` (auth) → badge in toolbar
   - Add `pan-card` (ui) → appears in canvas
   - Add `pan-button` (ui) → appears in canvas

4. **Verify:**
   - Toolbar shows all infrastructure badges
   - Canvas only shows UI components
   - Clicking badges selects component
   - Properties panel works for all components

## Future Enhancements

- Add X button on badges to remove component
- Add color coding by category (data=blue, auth=red, state=green)
- Add tooltip with full description on hover
- Add drag-to-reorder badges
- Add "Infrastructure" section header above badges
