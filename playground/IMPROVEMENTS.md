# Playground Improvements

## Changes Made

### 1. Fixed Property Updates Not Applying ✅

**Problem:** Component properties weren't updating when changed in the properties panel.

**Solution:**
- Improved property listener logic to handle different input types correctly
- Added explicit property setter in addition to setAttribute for better component compatibility
- Boolean attributes now properly set/remove (empty string for true, removed for false)
- Empty values now properly remove attributes instead of setting them to empty string

### 2. Badges Only for Non-UI Components ✅

**Problem:** All components showed badges cluttering the canvas, even UI components that have visible elements.

**Solution:**
- Added logic to detect non-UI components by category: `state`, `routing`, `data`, `devtools`, `advanced`, `auth`
- Non-UI components (like `pan-bus`, `pan-store`, `pan-computed-state`) now show a badge and description
- UI components (like `pan-card`, `pan-button`, `pan-tabs`) render cleanly without badges
- Canvas is now a clean, functional preview area

### 3. Clean Canvas for UI Components ✅

**Problem:** UI components had unnecessary hints and placeholders cluttering the view.

**Solution:**
- Removed the generic fallback that added hints to all components
- UI components now render naturally with their default content
- Pre-defined demo content for common components (cards, forms, tables, tabs, modals)
- Canvas feels like a real preview area, not a debug interface

### 4. Per-Component Help Text System ✅

**Problem:** No way to describe complex configurations like JSON objects, tabs structure, or special attribute formats.

**Solution:**
- Added `helpText` field support at both component and attribute levels
- Component-level help text shows in an expandable "Usage Guide" section
- Attribute-level help text shows as "Show example" expandable details
- Uses `<details>` elements for clean, collapsible help
- Help text is displayed in monospace for code examples

### 5. Better Input Types for Complex Data ✅

**Problem:** JSON and object attributes had no good way to be edited.

**Solution:**
- Added support for `json`, `object`, `array`, and `textarea` input types
- These render as `<textarea>` elements with appropriate styling
- Monospace font for easier JSON editing
- Updates on blur to avoid constant re-rendering while typing

## How to Use Help Text

### Component-Level Help Text

Edit the `component-registry.json` or add to your component metadata:

```json
{
  "name": "pan-tabs",
  "displayName": "Tabs",
  "description": "Tabbed interface component",
  "helpText": "<p>To add tabs, use the <code>tabs</code> attribute with a JSON array:</p><pre>[\n  { \"label\": \"Tab 1\", \"content\": \"Content 1\" },\n  { \"label\": \"Tab 2\", \"content\": \"Content 2\" }\n]</pre><p>Or add tab elements as children in HTML.</p>",
  "attributes": [...]
}
```

### Attribute-Level Help Text

For complex attributes that need examples:

```json
{
  "name": "config",
  "type": "json",
  "description": "Configuration object",
  "helpText": "{\n  \"theme\": \"dark\",\n  \"autoSave\": true,\n  \"interval\": 5000\n}",
  "required": false
}
```

### Supported Input Types

- `string` (default) - Text input
- `number` - Number input
- `boolean` - Checkbox
- `select` - Dropdown (requires `options` array)
- `json` / `object` / `array` - Textarea with monospace font
- `textarea` - Multiline text input

## Examples

### State Management Component (Non-UI)

```json
{
  "name": "pan-computed-state",
  "displayName": "Computed State",
  "description": "Derived state with automatic dependency tracking",
  "category": "state",
  "helpText": "<p>Use to create computed values from other state:</p><pre>&lt;pan-computed-state sources=\"todos.list\" output=\"todos.stats\"&gt;\n  &lt;script&gt;\n    (todos) => ({\n      total: todos.length,\n      completed: todos.filter(t => t.completed).length\n    })\n  &lt;/script&gt;\n&lt;/pan-computed-state&gt;</pre>",
  "attributes": [
    {
      "name": "sources",
      "type": "string",
      "description": "Comma-separated list of topics to watch",
      "helpText": "todos.list,user.preferences",
      "required": true
    },
    {
      "name": "output",
      "type": "string",
      "description": "Topic to publish computed result to",
      "required": true
    }
  ]
}
```

### UI Component (Shows Cleanly)

```json
{
  "name": "pan-card",
  "displayName": "Card",
  "description": "Card container with header and content",
  "category": "ui",
  "attributes": [
    {
      "name": "header",
      "type": "string",
      "description": "Card header text",
      "default": "Card Title"
    },
    {
      "name": "elevation",
      "type": "select",
      "description": "Shadow depth",
      "options": ["0", "1", "2", "3"],
      "default": "1"
    }
  ]
}
```

## Testing the Changes

1. Start the playground:
   ```bash
   cd playground
   python3 -m http.server 8080
   ```

2. Open http://localhost:8080/

3. Try adding components:
   - **UI Component** (like `pan-card`): Should render cleanly without badges
   - **State Component** (like `pan-store`): Should show a badge at the top

4. Select a component and test property editing:
   - Text inputs should update on typing
   - Checkboxes should toggle attributes
   - Textareas should update on blur
   - Changes should reflect in the component immediately

5. Look for help text:
   - Check if any components have the "💡 Usage Guide" section
   - Check if attributes have "Show example" links

## Future Enhancements

- Add more pre-defined demo content for components
- Create a help text generator script
- Add validation for JSON inputs with error messages
- Add "Copy example" button for help text code snippets
- Create templates for common component configurations
