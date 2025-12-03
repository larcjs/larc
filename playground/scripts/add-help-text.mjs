#!/usr/bin/env node
/**
 * Add Help Text to Component Registry
 *
 * Adds helpful documentation and examples to components that have complex configurations
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const registryPath = path.resolve(__dirname, '../component-registry.json');

// Help text for components with complex configurations
const COMPONENT_HELP = {
  'pan-tabs': {
    helpText: `<p>To add tabs, use the <code>tabs</code> attribute with a JSON array:</p>
<pre>[
  { "label": "Tab 1", "id": "tab1" },
  { "label": "Tab 2", "id": "tab2", "disabled": true },
  { "label": "Tab 3", "id": "tab3", "icon": "🎨" }
]</pre>
<p>Or add content as slotted children:</p>
<pre>&lt;pan-tabs&gt;
  &lt;div slot="tab-0" data-label="First"&gt;Content 1&lt;/div&gt;
  &lt;div slot="tab-1" data-label="Second"&gt;Content 2&lt;/div&gt;
&lt;/pan-tabs&gt;</pre>`
  },

  'pan-json-form': {
    helpText: `<p>Generate forms from JSON schemas:</p>
<pre>{
  "fields": [
    {
      "name": "email",
      "type": "email",
      "label": "Email Address",
      "required": true,
      "placeholder": "you@example.com"
    },
    {
      "name": "message",
      "type": "textarea",
      "label": "Message",
      "rows": 5
    }
  ]
}</pre>
<p>Supports all HTML5 input types plus custom styling.</p>`
  },

  'pan-data-table': {
    helpText: `<p>Subscribes to <code>{resource}.list.state</code> for data:</p>
<pre>&lt;pan-data-table
  resource="users"
  columns="name,email,role"
  key="id"&gt;
&lt;/pan-data-table&gt;</pre>
<p>Expected data format:</p>
<pre>{
  "data": {
    "items": [
      { "id": 1, "name": "Alice", "email": "alice@example.com", "role": "Admin" },
      { "id": 2, "name": "Bob", "email": "bob@example.com", "role": "User" }
    ]
  }
}</pre>
<p>Click rows to publish <code>{resource}.item.select</code></p>`
  },

  'pan-form': {
    helpText: `<p>CRUD form that subscribes to selection events:</p>
<pre>&lt;pan-form
  resource="users"
  fields="name,email,role"
  key="id"&gt;
&lt;/pan-form&gt;</pre>
<p>Listens to <code>{resource}.item.select</code> and requests data via <code>{resource}.item.get</code>.</p>
<p>Submits via <code>{resource}.item.save</code> and deletes via <code>{resource}.item.delete</code>.</p>`
  },

  'pan-chart': {
    helpText: `<p>Render charts with JSON data:</p>
<pre>&lt;pan-chart
  type="bar"
  data='{
    "labels": ["Jan", "Feb", "Mar"],
    "datasets": [{
      "label": "Sales",
      "data": [12, 19, 3]
    }]
  }'
  options='{"responsive": true}'&gt;
&lt;/pan-chart&gt;</pre>`
  },

  'pan-computed-state': {
    helpText: `<p>Create derived state from other topics:</p>
<pre>&lt;pan-computed-state
  sources="todos.list"
  output="todos.stats"
  retain&gt;
  &lt;script&gt;
    (todos) =&gt; ({
      total: todos.length,
      completed: todos.filter(t =&gt; t.completed).length,
      remaining: todos.filter(t =&gt; !t.completed).length
    })
  &lt;/script&gt;
&lt;/pan-computed-state&gt;</pre>
<p>The function receives topic data and returns computed result.</p>`
  },

  'pan-state-sync': {
    helpText: `<p>Synchronize state across browser tabs:</p>
<pre>&lt;pan-state-sync
  channel="myapp"
  topics="user.*,cart.*"&gt;
&lt;/pan-state-sync&gt;</pre>
<p>Uses BroadcastChannel API to mirror messages across tabs.</p>
<p>Wildcard patterns supported: <code>*</code> and <code>**</code></p>`
  },

  'pan-offline-sync': {
    helpText: `<p>Queue operations when offline and sync when reconnected:</p>
<pre>&lt;pan-offline-sync
  topics="todos.*"
  endpoints='{
    "todos.create": "/api/todos",
    "todos.update": "/api/todos/:id",
    "todos.delete": "/api/todos/:id"
  }'&gt;
&lt;/pan-offline-sync&gt;</pre>
<p>Automatically queues mutations when offline and retries on reconnection.</p>`
  },

  'pan-persistence-strategy': {
    helpText: `<p>Route state to different storage backends:</p>
<pre>&lt;pan-persistence-strategy auto-hydrate&gt;
  &lt;strategy topics="user.prefs" storage="localStorage"&gt;&lt;/strategy&gt;
  &lt;strategy topics="session.*" storage="sessionStorage"&gt;&lt;/strategy&gt;
  &lt;strategy topics="cart.*" storage="indexedDB" ttl="3600000"&gt;&lt;/strategy&gt;
&lt;/pan-persistence-strategy&gt;</pre>
<p>Supports: localStorage, sessionStorage, indexedDB, memory</p>`
  },

  'pan-schema-validator': {
    helpText: `<p>Runtime JSON Schema validation:</p>
<pre>&lt;pan-schema-validator
  topics="user.profile"
  schema='{
    "type": "object",
    "required": ["email", "name"],
    "properties": {
      "email": {"type": "string", "format": "email"},
      "name": {"type": "string", "minLength": 2},
      "age": {"type": "number", "minimum": 0}
    }
  }'&gt;
&lt;/pan-schema-validator&gt;</pre>
<p>Publishes <code>{topic}.validation</code> with errors if invalid.</p>`
  },

  'pan-undo-redo': {
    helpText: `<p>Time-travel debugging for state management:</p>
<pre>&lt;pan-undo-redo
  topics="editor.*"
  max-history="50"
  channel="editor-history"&gt;
&lt;/pan-undo-redo&gt;</pre>
<p>Listens to: <code>{channel}.undo</code>, <code>{channel}.redo</code>, <code>{channel}.clear</code></p>
<p>Maintains history of mutations for undo/redo operations.</p>`
  },

  'drag-drop-list': {
    helpText: `<p>Reorderable list with drag and drop:</p>
<pre>&lt;drag-drop-list
  topic="todos"
  items='[
    {"id": 1, "text": "First item"},
    {"id": 2, "text": "Second item"},
    {"id": 3, "text": "Third item"}
  ]'&gt;
&lt;/drag-drop-list&gt;</pre>
<p>Publishes <code>{topic}.reorder</code> when items are reordered.</p>`
  },

  'file-upload': {
    helpText: `<p>File upload with drag-drop and preview:</p>
<pre>&lt;file-upload
  accept="image/*"
  multiple
  max-size="5242880"
  preview
  drag-drop
  topic="files"&gt;
&lt;/file-upload&gt;</pre>
<p>max-size in bytes (5242880 = 5MB)</p>
<p>Publishes <code>{topic}.upload</code> with file data.</p>`
  }
};

// Attribute-specific help text (examples for complex attributes)
const ATTRIBUTE_HELP = {
  'pan-tabs': {
    'tabs': `[{"label":"Home","id":"home"},{"label":"Profile","id":"profile","icon":"👤"}]`
  },
  'pan-json-form': {
    'schema': `{"fields":[{"name":"email","type":"email","label":"Email","required":true}]}`
  },
  'pan-chart': {
    'data': `{"labels":["Q1","Q2","Q3"],"datasets":[{"label":"Revenue","data":[100,150,200]}]}`,
    'options': `{"responsive":true,"maintainAspectRatio":false}`
  },
  'pan-data-table': {
    'columns': `name,email,created_at`,
    'resource': `users`
  },
  'pan-form': {
    'fields': `name,email,role`,
    'resource': `users`
  },
  'pan-computed-state': {
    'sources': `todos.list,user.settings`,
    'output': `dashboard.stats`
  },
  'pan-state-sync': {
    'topics': `user.*,cart.*,app.state`
  },
  'pan-offline-sync': {
    'endpoints': `{"todos.create":"/api/todos","todos.update":"/api/todos/:id"}`
  },
  'pan-schema-validator': {
    'schema': `{"type":"object","required":["email"],"properties":{"email":{"type":"string","format":"email"}}}`
  },
  'drag-drop-list': {
    'items': `[{"id":1,"text":"Item 1"},{"id":2,"text":"Item 2"}]`
  }
};

// Update attribute types for better editing experience
const ATTRIBUTE_TYPES = {
  'pan-tabs': {
    'tabs': 'json'
  },
  'pan-json-form': {
    'schema': 'json',
    'data': 'json'
  },
  'pan-chart': {
    'data': 'json',
    'options': 'json'
  },
  'pan-computed-state': {
    'sources': 'string',
    'output': 'string'
  },
  'pan-offline-sync': {
    'endpoints': 'json'
  },
  'pan-schema-validator': {
    'schema': 'json'
  },
  'drag-drop-list': {
    'items': 'json'
  },
  'pan-persistence-strategy': {
    'topics': 'string',
    'ttl': 'number'
  }
};

async function updateRegistry() {
  console.log('📖 Reading registry...');
  const content = await fs.readFile(registryPath, 'utf-8');
  const registry = JSON.parse(content);

  let updatedCount = 0;
  let attributeCount = 0;

  for (const component of registry.components) {
    const name = component.name;

    // Add component-level help text
    if (COMPONENT_HELP[name]) {
      component.helpText = COMPONENT_HELP[name].helpText;
      updatedCount++;
      console.log(`  ✅ Added help text for ${name}`);
    }

    // Update attribute types and add help text
    if (component.attributes) {
      for (const attr of component.attributes) {
        // Update type
        if (ATTRIBUTE_TYPES[name]?.[attr.name]) {
          attr.type = ATTRIBUTE_TYPES[name][attr.name];
        }

        // Add help text
        if (ATTRIBUTE_HELP[name]?.[attr.name]) {
          attr.helpText = ATTRIBUTE_HELP[name][attr.name];
          attributeCount++;
        }
      }
    }
  }

  // Write updated registry
  console.log('\n💾 Writing updated registry...');
  await fs.writeFile(
    registryPath,
    JSON.stringify(registry, null, 2) + '\n',
    'utf-8'
  );

  console.log(`\n✨ Done!`);
  console.log(`   ${updatedCount} components updated`);
  console.log(`   ${attributeCount} attributes updated`);
}

updateRegistry().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
