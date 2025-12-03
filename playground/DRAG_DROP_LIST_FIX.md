# Drag & Drop List Example Fix

## Problem

The Drag & Drop List example had two issues:
1. **No PAN messages** appeared in the monitor when reordering items
2. **Console error** at line 155 of `drag-drop-list.mjs` when dragging items

## Root Cause

The example was passing a simple string array instead of an array of objects:

```javascript
// ❌ WRONG - String array
'items': '["Item 1", "Item 2", "Item 3"]'
```

But the component expects items to be **objects with an `id` property**:

```javascript
// From component documentation (line 4):
//   - items: JSON array of items with { id, content } structure
```

### Why It Failed

Looking at the component code:

**Line 154-156** - Tries to manipulate items array:
```javascript
const movedItem = this.items[oldIndex];  // Works for strings
this.items.splice(oldIndex, 1);          // Works for strings
this.items.splice(newIndex, 0, movedItem); // Works for strings
```

**Line 158-165** - Publishes PAN message:
```javascript
this.pc.publish({
  topic: `${this.topic}.reorder`,
  data: {
    items: this.items,  // Array of strings instead of objects
    from: oldIndex,
    to: newIndex
  }
});
```

**Line 262** - Rendering tries to access `.id`:
```javascript
<div class="list-item" data-id="${item.id}" data-index="${index}">
                                    ^^^^^^^^ undefined for strings!
```

**Line 266** - Tries to use id for slot name:
```javascript
<slot name="item-${item.id}">
                   ^^^^^^^^ undefined for strings!
```

**Line 267** - Falls back to content property:
```javascript
${item.content || item.label || item.title || JSON.stringify(item)}
     ^^^^^^^^^^^^  undefined for strings, eventually calls JSON.stringify("Item 1") = '"Item 1"'
```

### The Error

When items are strings:
1. Drag works visually (DOM manipulation)
2. But `item.id` is `undefined`
3. Creates `data-id="undefined"` in HTML
4. Creates `slot name="item-undefined"`
5. Eventually causes render issues or errors

## Solution

Changed the example to use properly formatted item objects with `id` and `content`:

```javascript
{
  id: 'drag-drop',
  name: 'Drag & Drop List',
  description: 'Reorderable drag and drop list',
  components: [
    {
      name: 'drag-drop-list',
      attributes: {
        'topic': 'list',
        'items': JSON.stringify([
          { id: 1, content: '📝 Task 1: Review code' },
          { id: 2, content: '🎨 Task 2: Update designs' },
          { id: 3, content: '🚀 Task 3: Deploy to production' },
          { id: 4, content: '📊 Task 4: Analyze metrics' }
        ])
      }
    }
  ]
}
```

### Enhancements Made

1. **Added proper object structure** - Each item has `id` and `content`
2. **Added emojis** - Makes the list more visually interesting
3. **Changed topic** from `list.reordered` to `list` (more standard)
4. **Added 4th item** - Shows drag-drop better with more items

## Item Object Format

The component supports flexible item formats:

### Required
- **`id`** (number or string) - Unique identifier for the item

### Content (one of these):
- **`content`** - Main display content (preferred)
- **`label`** - Alternative to content
- **`title`** - Alternative to content
- Any other properties - Will be JSON.stringify'd

### Example Formats

**Basic:**
```javascript
{ id: 1, content: 'Task 1' }
```

**With emoji:**
```javascript
{ id: 'task-1', content: '📝 Review code' }
```

**With label:**
```javascript
{ id: 'item-1', label: 'First Item' }
```

**With title:**
```javascript
{ id: 1, title: 'Important Task' }
```

**Complex object (auto-stringified):**
```javascript
{ id: 1, name: 'Task', priority: 'high', completed: false }
// Displays: {"name":"Task","priority":"high","completed":false}
```

## Testing

### Before Fix
```
1. Load "Drag & Drop List" example
2. See: Three items ("Item 1", "Item 2", "Item 3")
3. Drag items to reorder
4. Open PAN Monitor
5. See: No messages appear ❌
6. Check console
7. See: Error at line 155 or undefined attribute values ❌
```

### After Fix
```
1. Load "Drag & Drop List" example
2. See: Four tasks with emojis ✅
3. Open PAN Monitor
4. Drag "Task 3" above "Task 1"
5. See: PAN message appears ✅
   Topic: list.reorder
   Data: {
     items: [{id: 1, content: '📝 Task 1: Review code'}, ...],
     from: 2,
     to: 0
   }
6. Check console
7. See: No errors ✅
```

## PAN Messages

### Reorder Event
When you drag and drop an item:

```javascript
Topic: {topic}.reorder
Data: {
  items: [
    { id: 1, content: '📝 Task 1: Review code' },
    { id: 2, content: '🎨 Task 2: Update designs' },
    { id: 3, content: '🚀 Task 3: Deploy to production' },
    { id: 4, content: '📊 Task 4: Analyze metrics' }
  ],
  from: 2,  // Original index
  to: 0     // New index
}
```

### Drop Event
Published after drag completes:

```javascript
Topic: {topic}.drop
Data: {
  item: { id: 3, content: '🚀 Task 3: Deploy to production' },
  index: 0
}
```

## PAN Subscriptions

The component also listens to control topics:

### Set Items
Replace entire list:
```javascript
pc.publish({
  topic: 'list.setItems',
  data: {
    items: [
      { id: 1, content: 'New item 1' },
      { id: 2, content: 'New item 2' }
    ]
  }
});
```

### Add Item
Insert item at position:
```javascript
pc.publish({
  topic: 'list.addItem',
  data: {
    item: { id: 5, content: 'New task' },
    index: 2  // Optional, defaults to end
  }
});
```

### Remove Item
Remove by ID:
```javascript
pc.publish({
  topic: 'list.removeItem',
  data: {
    id: 3  // Remove item with id: 3
  }
});
```

## Component Features

### Drag Handle
The `⋮⋮` icon indicates items are draggable. You can specify a custom handle:

```javascript
attributes: {
  'handle': '.drag-handle',
  'items': JSON.stringify([
    { id: 1, content: '<span class="drag-handle">⚡</span> Item 1' }
  ])
}
```

### Disabled State
Disable dragging:
```javascript
attributes: {
  'disabled': 'true',
  'items': '...'
}
```

### Empty State
Shows when no items:
```html
<div class="empty-state">
  <slot name="empty">No items to display</slot>
</div>
```

### Custom Slots
Use slots for custom content:
```javascript
// In your HTML:
<drag-drop-list items='[{"id":1,"content":"Item 1"}]'>
  <div slot="item-1">
    <strong>Custom content for item 1</strong>
  </div>
</drag-drop-list>
```

## Example Variations

### Task List with Priorities
```javascript
'items': JSON.stringify([
  { id: 1, content: '🔴 High: Fix critical bug' },
  { id: 2, content: '🟡 Medium: Update docs' },
  { id: 3, content: '🟢 Low: Refactor code' }
])
```

### Shopping List
```javascript
'items': JSON.stringify([
  { id: 1, content: '🥖 Bread' },
  { id: 2, content: '🥛 Milk' },
  { id: 3, content: '🍎 Apples' },
  { id: 4, content: '🧀 Cheese' }
])
```

### File Manager
```javascript
'items': JSON.stringify([
  { id: 1, content: '📁 Documents' },
  { id: 2, content: '📁 Pictures' },
  { id: 3, content: '📁 Downloads' },
  { id: 4, content: '📄 README.md' }
])
```

### Playlist
```javascript
'items': JSON.stringify([
  { id: 1, content: '🎵 Song 1 - Artist A' },
  { id: 2, content: '🎵 Song 2 - Artist B' },
  { id: 3, content: '🎵 Song 3 - Artist C' }
])
```

## Files Changed

### `/Users/cdr/Projects/larc-repos/playground/examples.mjs`

**Lines 382-400**: Changed from string array to object array with proper structure

```javascript
// Before:
'items': '["Item 1", "Item 2", "Item 3"]'

// After:
'items': JSON.stringify([
  { id: 1, content: '📝 Task 1: Review code' },
  { id: 2, content: '🎨 Task 2: Update designs' },
  { id: 3, content: '🚀 Task 3: Deploy to production' },
  { id: 4, content: '📊 Task 4: Analyze metrics' }
])
```

Also changed topic from `list.reordered` to `list` (more standard).

## Pattern Recognition

This is now the **third example** with the same issue:
1. **Dropdown Menu** - Expected objects with `{label, value}`, got strings
2. **Drag & Drop List** - Expected objects with `{id, content}`, got strings
3. Future: Check other components that take JSON arrays

### Common Pattern
Components that accept JSON array attributes usually expect objects with specific properties, not primitive values (strings/numbers).

### Rule of Thumb
When a component has an `items` attribute:
1. Read the component documentation (first comment block)
2. Look for expected structure (e.g., `{id, content}`)
3. Use proper objects in examples
4. Include IDs when required

## Prevention

For new examples with array attributes:
- ✅ Check component documentation first
- ✅ Use objects with required properties
- ✅ Include IDs when needed
- ✅ Test with PAN Monitor open
- ❌ Don't use simple string/number arrays

## Summary

The drag & drop list was fixed by changing the items from a simple string array to an array of properly formatted objects with `id` and `content` properties. Now:
- ✅ Items display correctly with emojis
- ✅ Drag and drop works smoothly
- ✅ PAN messages appear in monitor
- ✅ No console errors
- ✅ Reorder data includes full item objects

The example now demonstrates proper drag-drop functionality with real task-like items and full PAN integration.
