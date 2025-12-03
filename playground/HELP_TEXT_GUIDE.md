# Help Text Guide

## Overview

The playground now includes comprehensive help text for components with complex configurations. This guide explains what was added and how to use it.

## Components with Help Text (13 total)

### UI Components

#### 1. **pan-tabs**
Shows how to configure tabs using JSON array:
```json
[
  { "label": "Tab 1", "id": "tab1" },
  { "label": "Tab 2", "id": "tab2", "disabled": true },
  { "label": "Tab 3", "id": "tab3", "icon": "🎨" }
]
```
Also shows slot-based approach for dynamic content.

#### 2. **pan-chart**
Examples for chart data structure and options:
```json
{
  "labels": ["Jan", "Feb", "Mar"],
  "datasets": [{
    "label": "Sales",
    "data": [12, 19, 3]
  }]
}
```

#### 3. **pan-data-table**
Shows expected data format from PAN topics:
```json
{
  "data": {
    "items": [
      { "id": 1, "name": "Alice", "email": "alice@example.com" }
    ]
  }
}
```

#### 4. **drag-drop-list**
Array of items with id and text:
```json
[
  {"id": 1, "text": "First item"},
  {"id": 2, "text": "Second item"}
]
```

### Form Components

#### 5. **pan-json-form**
JSON schema for dynamic form generation:
```json
{
  "fields": [
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "placeholder": "you@example.com"
    }
  ]
}
```

#### 6. **pan-form**
Shows PAN topic integration for CRUD operations:
- Listens: `{resource}.item.select`
- Requests: `{resource}.item.get`
- Submits: `{resource}.item.save`
- Deletes: `{resource}.item.delete`

#### 7. **file-upload**
Configuration for file uploads with size limits:
- `accept="image/*"` - File type filter
- `max-size="5242880"` - 5MB in bytes
- `preview` - Show image previews
- `drag-drop` - Enable drag-drop zone

### State Management Components

#### 8. **pan-computed-state**
Derived state with automatic dependency tracking:
```html
<pan-computed-state sources="todos.list" output="todos.stats">
  <script>
    (todos) => ({
      total: todos.length,
      completed: todos.filter(t => t.completed).length
    })
  </script>
</pan-computed-state>
```

#### 9. **pan-state-sync**
Cross-tab synchronization with BroadcastChannel:
```html
<pan-state-sync
  channel="myapp"
  topics="user.*,cart.*">
</pan-state-sync>
```

#### 10. **pan-offline-sync**
Offline-first with automatic queue and sync:
```json
{
  "todos.create": "/api/todos",
  "todos.update": "/api/todos/:id",
  "todos.delete": "/api/todos/:id"
}
```

#### 11. **pan-persistence-strategy**
Declarative routing to storage backends:
```html
<pan-persistence-strategy auto-hydrate>
  <strategy topics="user.prefs" storage="localStorage"></strategy>
  <strategy topics="cart.*" storage="indexedDB" ttl="3600000"></strategy>
</pan-persistence-strategy>
```

#### 12. **pan-schema-validator**
Runtime JSON Schema validation:
```json
{
  "type": "object",
  "required": ["email", "name"],
  "properties": {
    "email": {"type": "string", "format": "email"},
    "name": {"type": "string", "minLength": 2}
  }
}
```

#### 13. **pan-undo-redo**
Time-travel debugging for state:
```html
<pan-undo-redo
  topics="editor.*"
  max-history="50"
  channel="editor-history">
</pan-undo-redo>
```

## Attributes with Help Text (9 total)

Attributes now show inline examples when you click "Show example":

| Component | Attribute | Type | Help Text |
|-----------|-----------|------|-----------|
| pan-tabs | tabs | json | Tab configuration array |
| pan-json-form | schema | json | Form field definitions |
| pan-chart | data | json | Chart dataset structure |
| pan-chart | options | json | Chart configuration options |
| pan-data-table | columns | string | Comma-separated column names |
| pan-form | fields | string | Comma-separated field names |
| pan-computed-state | sources | string | Source topic patterns |
| pan-offline-sync | endpoints | json | Topic-to-URL mappings |
| drag-drop-list | items | json | Array of draggable items |

## Updated Attribute Types

For better editing experience, these attributes now use `json` or `textarea` input types:

- **JSON types**: `pan-tabs.tabs`, `pan-json-form.schema`, `pan-chart.data/options`, `pan-offline-sync.endpoints`, `drag-drop-list.items`, `pan-schema-validator.schema`
- **These render as textareas** with monospace font for easier JSON editing

## How to Use in Playground

1. **Start playground:**
   ```bash
   cd playground
   python3 -m http.server 8080
   open http://localhost:8080/
   ```

2. **Add a component** from the sidebar

3. **Select the component** to see properties panel

4. **Look for help text:**
   - **Component-level**: Expandable "💡 Usage Guide" section at top
   - **Attribute-level**: "Show example" link under each complex attribute

5. **Edit properties:**
   - JSON attributes show as textareas
   - Help text provides copy-paste examples
   - Changes update on blur (tab out of textarea)

## Adding New Help Text

To add help text for more components:

1. **Edit** `playground/scripts/add-help-text.mjs`

2. **Add component help:**
   ```javascript
   const COMPONENT_HELP = {
     'your-component': {
       helpText: `<p>Description here</p><pre>Example code</pre>`
     }
   };
   ```

3. **Add attribute help:**
   ```javascript
   const ATTRIBUTE_HELP = {
     'your-component': {
       'attribute-name': `Example value or JSON`
     }
   };
   ```

4. **Set attribute types:**
   ```javascript
   const ATTRIBUTE_TYPES = {
     'your-component': {
       'attribute-name': 'json' // or 'textarea', 'number', etc.
     }
   };
   ```

5. **Run the script:**
   ```bash
   node playground/scripts/add-help-text.mjs
   ```

## Tips for Writing Help Text

### Component Help Text (HTML)
- Start with a brief description
- Show complete, working examples in `<pre>` tags
- Explain the data shape or format
- Mention related PAN topics or components
- Keep it concise but complete

### Attribute Help Text (Plain Text)
- Show actual example values
- For JSON: format it nicely with newlines
- For strings: show common patterns
- For arrays: show 1-2 example items
- Keep it one-line or minimal

### Good Examples

**Component Help (with HTML):**
```javascript
helpText: `<p>Description of what it does:</p>
<pre>&lt;component
  attr1="value"
  attr2='{"json": "here"}'&gt;
&lt;/component&gt;</pre>
<p>Additional usage notes.</p>`
```

**Attribute Help (plain text):**
```javascript
helpText: `[{"id":1,"name":"Example"},{"id":2,"name":"Another"}]`
```

## Benefits

1. **Self-documenting**: Components explain themselves
2. **Copy-paste ready**: Examples are immediately usable
3. **Better DX**: No need to switch to external docs
4. **Type-aware**: JSON attributes get proper textarea input
5. **Contextual**: Help appears exactly when needed

## Impact

Before:
- Generic descriptions only
- No examples
- Unclear data shapes
- Single-line text inputs for complex JSON

After:
- 13 components with detailed help
- 9 attributes with examples
- Clear data format specifications
- Proper textarea inputs for JSON/objects
- Expandable help sections

The playground is now self-explanatory for complex components! 🎉
