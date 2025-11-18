# Component Registry Plan

## Overview

Create a comprehensive JSON registry of all LARC components with metadata extracted from JSDoc comments. This registry will power:
- 🎨 Playground component palette
- 🛠️ Visual editor toolbox
- 📖 Auto-generated documentation
- 🔍 Component search/discovery
- 💡 IntelliSense and tooltips

## JSON Structure

```json
{
  "version": "1.0.0",
  "generated": "2025-11-12T21:45:00Z",
  "components": [
    {
      "name": "pan-router",
      "displayName": "Router",
      "description": "Client-side routing with navigation and history management",
      "category": "routing",
      "path": "./components/pan-router.mjs",
      "icon": "🧭",
      "tags": ["routing", "navigation", "spa"],
      "status": "stable",
      "since": "1.0.0",

      "attributes": [
        {
          "name": "base-path",
          "type": "string",
          "default": "/",
          "description": "Base path for all routes",
          "required": false
        }
      ],

      "properties": [
        {
          "name": "routes",
          "type": "Array<Route>",
          "description": "Registered routes",
          "readonly": true
        }
      ],

      "methods": [
        {
          "name": "navigate",
          "description": "Navigate to a path",
          "parameters": [
            {
              "name": "path",
              "type": "string",
              "description": "Path to navigate to"
            },
            {
              "name": "options",
              "type": "NavigateOptions",
              "optional": true,
              "description": "Navigation options"
            }
          ],
          "returns": {
            "type": "void"
          }
        },
        {
          "name": "getCurrentRoute",
          "description": "Get current route information",
          "parameters": [],
          "returns": {
            "type": "{ path: string, params: Record<string, string> }"
          }
        }
      ],

      "events": [
        {
          "name": "route-changed",
          "description": "Fired when route changes",
          "detail": {
            "type": "{ path: string, params: Record<string, string> }"
          }
        }
      ],

      "slots": [
        {
          "name": "default",
          "description": "Router outlet content"
        }
      ],

      "examples": [
        {
          "title": "Basic routing",
          "code": "<pan-router>\n  <pan-route path=\"/home\" component=\"home-page\"></pan-route>\n  <pan-route path=\"/about\" component=\"about-page\"></pan-route>\n</pan-router>"
        }
      ],

      "dependencies": ["@larcjs/core"],
      "related": ["pan-link", "pan-route"]
    }
  ],

  "categories": [
    {
      "id": "routing",
      "name": "Routing & Navigation",
      "icon": "🧭",
      "description": "Components for client-side routing"
    },
    {
      "id": "state",
      "name": "State Management",
      "icon": "💾",
      "description": "State management and persistence"
    },
    {
      "id": "forms",
      "name": "Forms & Input",
      "icon": "📝",
      "description": "Form handling and user input"
    },
    {
      "id": "data",
      "name": "Data & Connectivity",
      "icon": "🔌",
      "description": "Data fetching and API integration"
    },
    {
      "id": "ui",
      "name": "UI Components",
      "icon": "🎨",
      "description": "User interface building blocks"
    },
    {
      "id": "content",
      "name": "Content & Media",
      "icon": "📄",
      "description": "Content display and editing"
    },
    {
      "id": "auth",
      "name": "Authentication",
      "icon": "🔐",
      "description": "Authentication and security"
    },
    {
      "id": "theme",
      "name": "Theming",
      "icon": "🎭",
      "description": "Theme and styling management"
    },
    {
      "id": "devtools",
      "name": "Developer Tools",
      "icon": "🔧",
      "description": "Debugging and development utilities"
    },
    {
      "id": "advanced",
      "name": "Advanced",
      "icon": "⚙️",
      "description": "Advanced functionality"
    }
  ]
}
```

## Generator Script

### Approach 1: JSDoc Parser (Recommended)

Use existing JSDoc parsing tools to extract metadata:

```javascript
// scripts/generate-registry.js
import { parse } from 'jsdoc-parse';
import { glob } from 'glob';
import fs from 'fs/promises';

async function generateRegistry() {
  const files = await glob('./components/**/*.mjs');
  const components = [];

  for (const file of files) {
    const content = await fs.readFile(file, 'utf-8');
    const docs = await parse(content);

    // Extract component metadata
    const component = {
      name: extractComponentName(docs),
      displayName: extractDisplayName(docs),
      description: extractDescription(docs),
      category: categorizeComponent(docs),
      path: file,
      icon: guessIcon(docs),
      attributes: extractAttributes(docs),
      properties: extractProperties(docs),
      methods: extractMethods(docs),
      events: extractEvents(docs),
      slots: extractSlots(docs),
      examples: extractExamples(docs)
    };

    components.push(component);
  }

  const registry = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    components,
    categories: getCategories()
  };

  await fs.writeFile(
    './component-registry.json',
    JSON.stringify(registry, null, 2)
  );
}
```

### Approach 2: Custom AST Parser

Parse JavaScript with @babel/parser or acorn:

```javascript
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';

function extractComponentMetadata(code) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['classProperties']
  });

  let metadata = {};

  traverse(ast, {
    ClassDeclaration(path) {
      if (path.node.superClass?.name === 'HTMLElement') {
        metadata.name = path.node.id.name;
        metadata.methods = extractMethods(path);
        metadata.properties = extractProperties(path);
      }
    },

    CallExpression(path) {
      if (path.node.callee.object?.name === 'customElements' &&
          path.node.callee.property?.name === 'define') {
        metadata.tagName = path.node.arguments[0].value;
      }
    }
  });

  return metadata;
}
```

### Approach 3: Hybrid (Best)

Combine JSDoc for documentation + AST for code structure:

```javascript
async function analyzeComponent(file) {
  const content = await fs.readFile(file, 'utf-8');

  // Parse JSDoc comments
  const jsdocInfo = parseJSDoc(content);

  // Parse code structure
  const codeInfo = parseAST(content);

  // Merge both
  return {
    ...jsdocInfo,
    ...codeInfo,
    path: file
  };
}
```

## JSDoc Convention

Standardize JSDoc comments in components:

```javascript
/**
 * @component pan-router
 * @displayName Router
 * @category routing
 * @icon 🧭
 * @status stable
 * @since 1.0.0
 * @description Client-side routing with navigation and history management
 *
 * @attribute {string} base-path="/" - Base path for all routes
 * @attribute {boolean} hash-mode=false - Use hash-based routing
 *
 * @property {Array<Route>} routes - Registered routes (readonly)
 *
 * @fires route-changed - Fired when route changes
 * @fires navigation-error - Fired when navigation fails
 *
 * @method navigate
 * @param {string} path - Path to navigate to
 * @param {NavigateOptions} [options] - Navigation options
 * @returns {void}
 *
 * @method getCurrentRoute
 * @returns {{ path: string, params: Record<string, string> }}
 *
 * @slot default - Router outlet content
 *
 * @example
 * <pan-router base-path="/app">
 *   <pan-route path="/home" component="home-page"></pan-route>
 * </pan-router>
 *
 * @related pan-link
 * @related pan-route
 * @dependency @larcjs/core
 */
class PanRouter extends HTMLElement {
  // implementation
}
```

## Implementation Steps

1. **Define JSON Schema** ✅ (above)
2. **Choose parser approach** (Hybrid recommended)
3. **Create generator script** (`scripts/generate-registry.js`)
4. **Add JSDoc conventions** to component files
5. **Generate initial registry**
6. **Add npm script** (`npm run registry:generate`)
7. **Integrate with build process**
8. **Create TypeScript types** for registry
9. **Add validation** (JSON schema validation)
10. **Documentation** on how to use registry

## Usage Examples

### In Playground

```javascript
import registry from './component-registry.json';

// Render component palette
function renderPalette() {
  const categories = registry.categories;

  return categories.map(cat => {
    const components = registry.components
      .filter(c => c.category === cat.id);

    return `
      <div class="category">
        <h3>${cat.icon} ${cat.name}</h3>
        ${components.map(c => `
          <button class="component-item"
                  data-component="${c.name}"
                  title="${c.description}">
            ${c.icon} ${c.displayName}
          </button>
        `).join('')}
      </div>
    `;
  }).join('');
}

// Get component details for property panel
function getComponentDetails(name) {
  return registry.components.find(c => c.name === name);
}
```

### In Visual Editor

```javascript
// Drag and drop from palette
function onDragStart(e, componentName) {
  const component = registry.components.find(c => c.name === componentName);
  e.dataTransfer.setData('component', JSON.stringify(component));
}

// Show properties panel
function showProperties(componentName) {
  const component = registry.components.find(c => c.name === componentName);

  return component.attributes.map(attr => `
    <label>
      ${attr.name}
      <input type="${getInputType(attr.type)}"
             value="${attr.default}"
             placeholder="${attr.description}">
    </label>
  `).join('');
}
```

### In Documentation Generator

```javascript
// Generate API docs
function generateDocs() {
  return registry.components.map(component => {
    return `
# ${component.displayName}

${component.description}

## Attributes

${component.attributes.map(attr =>
  `- **${attr.name}** (${attr.type}): ${attr.description}`
).join('\n')}

## Methods

${component.methods.map(method =>
  `### ${method.name}(${method.parameters.map(p => p.name).join(', ')})`
).join('\n')}

## Examples

\`\`\`html
${component.examples[0].code}
\`\`\`
    `;
  }).join('\n\n');
}
```

## Benefits

1. **Single Source of Truth** - All component metadata in one place
2. **Automatic Documentation** - Generate docs from code
3. **Playground/Editor Ready** - Metadata powers visual tools
4. **Searchable** - Easy to find components by category, tag, or name
5. **Versioned** - Track component changes over time
6. **Validation** - Can validate components implement what they document
7. **Type Safety** - TypeScript types from registry
8. **Extensible** - Easy to add new metadata fields

## Timeline

**Recommended:** Add to Phase 4 (Developer Experience) or Phase 5 (before Playground)

- Week 1: Design JSON schema and JSDoc conventions
- Week 2: Build generator script
- Week 3: Add JSDoc to all components
- Week 4: Generate registry and integrate

**Alternative:** Start now as it will benefit Playground development

## Open Questions

1. Should we include default styles/CSS in registry?
2. Should we version the registry separately from components?
3. Should we generate separate registries for categories?
4. Should we include component dependencies graph?
5. Should we track component size/bundle impact?

## Next Steps

1. Finalize JSON schema
2. Choose parser approach
3. Create generator script
4. Document JSDoc conventions
5. Start adding JSDoc to key components
6. Generate initial registry
