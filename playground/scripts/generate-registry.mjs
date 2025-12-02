#!/usr/bin/env node
/**
 * Component Registry Generator
 *
 * Scans component files and generates a JSON registry with metadata
 * for use in the Playground and Visual Editor.
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(__dirname, '../../ui/src/components');
const outputPath = path.resolve(__dirname, '../component-registry.json');

// Component categories with icons
const CATEGORIES = [
  { id: 'routing', name: 'Routing & Navigation', icon: '🧭' },
  { id: 'state', name: 'State Management', icon: '💾' },
  { id: 'forms', name: 'Forms & Input', icon: '📝' },
  { id: 'data', name: 'Data & Connectivity', icon: '🔌' },
  { id: 'ui', name: 'UI Components', icon: '🎨' },
  { id: 'content', name: 'Content & Media', icon: '📄' },
  { id: 'auth', name: 'Authentication', icon: '🔐' },
  { id: 'theme', name: 'Theming', icon: '🎭' },
  { id: 'devtools', name: 'Developer Tools', icon: '🔧' },
  { id: 'advanced', name: 'Advanced', icon: '⚙️' }
];

// Map component names to categories
const COMPONENT_CATEGORIES = {
  'pan-router': 'routing',
  'pan-link': 'routing',
  'pan-route': 'routing',

  'pan-store': 'state',
  'pan-idb': 'state',
  'pan-store-pan': 'state',

  'pan-form': 'forms',
  'pan-schema-form': 'forms',
  'pan-dropdown': 'forms',
  'pan-date-picker': 'forms',
  'pan-search-bar': 'forms',
  'pan-validation': 'forms',
  'file-upload': 'forms',
  'editable-cell': 'forms',

  'pan-data-connector': 'data',
  'pan-graphql-connector': 'data',
  'pan-php-connector': 'data',
  'pan-websocket': 'data',
  'pan-sse': 'data',
  'pan-fetch': 'data',
  'pan-query': 'data',
  'pan-data-provider': 'data',
  'pan-data-provider-mock': 'data',

  'pan-card': 'ui',
  'pan-modal': 'ui',
  'pan-tabs': 'ui',
  'pan-table': 'ui',
  'pan-data-table': 'ui',
  'pan-chart': 'ui',
  'pan-pagination': 'ui',
  'drag-drop-list': 'ui',
  'user-avatar': 'ui',

  'pan-markdown-editor': 'content',
  'pan-markdown-renderer': 'content',
  'pan-files': 'content',

  'pan-jwt': 'auth',
  'pan-auth': 'auth',
  'pan-security': 'auth',

  'pan-theme-provider': 'theme',
  'pan-theme-toggle': 'theme',

  'pan-inspector': 'devtools',
  'pan-forwarder': 'devtools',

  'pan-worker': 'advanced',
  'pan-schema': 'advanced',
  'pan-invoice-store': 'advanced',
  'todo-list': 'advanced',
  'todo-provider': 'advanced',
  'x-counter': 'advanced'
};

// Map component names to icons
const COMPONENT_ICONS = {
  'pan-router': '🧭',
  'pan-link': '🔗',
  'pan-store': '💾',
  'pan-idb': '🗄️',
  'pan-table': '📊',
  'pan-data-table': '📋',
  'pan-form': '📝',
  'pan-card': '🃏',
  'pan-modal': '📦',
  'pan-tabs': '📑',
  'pan-dropdown': '⬇️',
  'pan-date-picker': '📅',
  'pan-websocket': '🔌',
  'pan-sse': '📡',
  'pan-jwt': '🔐',
  'pan-auth': '🔑',
  'pan-theme-provider': '🎨',
  'pan-theme-toggle': '🌓',
  'pan-pagination': '⏭️',
  'pan-search-bar': '🔍',
  'pan-markdown-editor': '✏️',
  'pan-markdown-renderer': '📄',
  'pan-chart': '📈',
  'file-upload': '📤',
  'drag-drop-list': '📝',
  'pan-inspector': '🔍',
  'pan-worker': '⚙️',
  'pan-fetch': '🌐',
  'user-avatar': '👤',
  'todo-list': '✅',
  'x-counter': '🔢'
};

/**
 * Extract component metadata from source file
 */
async function analyzeComponent(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const fileName = path.basename(filePath, '.mjs');

  // Extract component name (tag name from customElements.define)
  const defineMatch = content.match(/customElements\.define\s*\(\s*['"]([^'"]+)['"]/);
  const componentName = defineMatch ? defineMatch[1] : fileName;

  // Extract class name
  const classMatch = content.match(/class\s+(\w+)\s+extends\s+HTMLElement/);
  const className = classMatch ? classMatch[1] : null;

  // Extract description from JSDoc or file comment
  const descMatch = content.match(/\/\*\*[\s\S]*?@fileoverview\s+([^\n*]+)/);
  const description = descMatch ? descMatch[1].trim() :
    `${componentName.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} component`;

  // Extract attributes from observedAttributes
  const observedMatch = content.match(/observedAttributes\s*\(\s*\)\s*\{[\s\S]*?return\s*\[([\s\S]*?)\]/);
  const attributes = [];

  if (observedMatch) {
    const attrStr = observedMatch[1];
    const attrMatches = attrStr.matchAll(/['"]([^'"]+)['"]/g);
    for (const match of attrMatches) {
      attributes.push({
        name: match[1],
        type: 'string',
        default: '',
        description: `${match[1]} attribute`,
        required: false
      });
    }
  }

  // Determine category
  const category = COMPONENT_CATEGORIES[componentName] || 'advanced';

  // Get icon
  const icon = COMPONENT_ICONS[componentName] || '📦';

  // Generate display name
  let displayName = componentName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Remove "Pan " prefix for cleaner UI
  if (displayName.startsWith('Pan ')) {
    displayName = displayName.substring(4);
  }

  return {
    name: componentName,
    displayName,
    description,
    category,
    path: `../ui/src/components/${fileName}.mjs`,
    icon,
    tags: [category, componentName.split('-')[0]],
    status: 'stable',
    since: '1.0.0',
    attributes,
    properties: [],
    methods: [],
    events: [],
    slots: [],
    examples: [],
    dependencies: ['@larcjs/core'],
    related: []
  };
}

/**
 * Generate the complete component registry
 */
async function generateRegistry() {
  console.log('🔍 Scanning components directory...');

  const files = await fs.readdir(componentsDir);
  const mjsFiles = files.filter(f => f.endsWith('.mjs') && !f.endsWith('.d.ts'));

  console.log(`📦 Found ${mjsFiles.length} component files`);

  const components = [];

  for (const file of mjsFiles) {
    const filePath = path.join(componentsDir, file);
    try {
      const component = await analyzeComponent(filePath);
      components.push(component);
      console.log(`  ✓ ${component.name}`);
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  // Sort components by name
  components.sort((a, b) => a.name.localeCompare(b.name));

  const registry = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    components,
    categories: CATEGORIES
  };

  console.log(`\n💾 Writing registry to ${outputPath}`);
  await fs.writeFile(outputPath, JSON.stringify(registry, null, 2));

  console.log('✅ Component registry generated successfully!');
  console.log(`📊 Total components: ${components.length}`);

  // Show breakdown by category
  const breakdown = {};
  components.forEach(c => {
    breakdown[c.category] = (breakdown[c.category] || 0) + 1;
  });

  console.log('\n📈 Components by category:');
  Object.entries(breakdown).forEach(([cat, count]) => {
    const catInfo = CATEGORIES.find(c => c.id === cat);
    console.log(`  ${catInfo.icon} ${catInfo.name}: ${count}`);
  });
}

// Run the generator
generateRegistry().catch(err => {
  console.error('❌ Error generating registry:', err);
  process.exit(1);
});
