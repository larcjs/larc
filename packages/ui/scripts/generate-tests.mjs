#!/usr/bin/env node
/**
 * Generate basic Playwright tests for all UI components
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uiDir = path.join(__dirname, '..');
const testsDir = path.join(uiDir, 'tests');
const playwrightDir = path.join(testsDir, 'playwright');
const fixturesDir = path.join(testsDir, 'fixtures');

// Component categories
const UI_COMPONENTS = [
  'drag-drop-list', 'editable-cell', 'file-upload', 'pan-card', 'pan-chart',
  'pan-date-picker', 'pan-dropdown', 'pan-link', 'pan-markdown-editor',
  'pan-markdown-renderer', 'pan-modal', 'pan-pagination', 'pan-search-bar',
  'pan-table', 'pan-tabs', 'pan-theme-toggle', 'pan-tree', 'todo-list',
  'user-avatar', 'x-counter'
];

const DATA_COMPONENTS = [
  'pan-auth', 'pan-computed-state', 'pan-data-connector', 'pan-data-provider',
  'pan-data-provider-mock', 'pan-data-table', 'pan-fetch', 'pan-files',
  'pan-form', 'pan-forwarder', 'pan-graphql-connector', 'pan-idb',
  'pan-invoice-store', 'pan-json-form', 'pan-jwt', 'pan-leaflet-map',
  'pan-offline-sync', 'pan-open-data-connector', 'pan-persistence-strategy',
  'pan-php-connector', 'pan-query', 'pan-router', 'pan-routes', 'pan-schema',
  'pan-schema-form', 'pan-schema-validator', 'pan-security', 'pan-sse',
  'pan-state-sync', 'pan-static-connector', 'pan-storage', 'pan-store',
  'pan-store-pan', 'pan-theme-provider', 'pan-undo-redo', 'pan-validation',
  'pan-websocket', 'pan-worker', 'todo-provider'
];

const SKIP_COMPONENTS = [
  'pan-bus', 'pan-client', 'pan-debug', 'pan-inspector', 'pan-bus-enhanced',
  'pan-bus-legacy', 'pan-bus-lite'
];

function componentNeedsCore(name) {
  // Components that require pan-bus and pan-client
  return !name.startsWith('pan-bus') && name !== 'pan-client';
}

function generateFixture(componentName) {
  const needsCore = componentNeedsCore(componentName);
  const coreImports = needsCore ? `
    <script type="module" src="../../../core/pan-bus.mjs"></script>
    <script type="module" src="../../../core/pan-client.mjs"></script>` : '';

  const panBusElement = needsCore ? `
    <pan-bus debug="true"></pan-bus>` : '';

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>LARC UI Test – ${componentName}</title>${coreImports}
    <script type="module" src="../../${componentName}.mjs"></script>
    <style>
      body {
        font-family: sans-serif;
        padding: 2rem;
      }
    </style>
  </head>
  <body>${panBusElement}
    <${componentName}></${componentName}>
  </body>
</html>
`;
}

function generateSpec(componentName) {
  return `import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/${componentName}.html';

test.describe('${componentName} component', () => {
  test('registers and renders without errors', async ({ page }) => {
    await page.goto(fixturePath);

    // Wait for custom element to be defined
    await page.waitForFunction(() => customElements.get('${componentName}'));

    // Check that element exists in DOM
    const element = await page.locator('${componentName}');
    await expect(element).toBeAttached();

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Give component time to initialize
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
`;
}

// Get existing test files
const existingSpecs = fs.existsSync(playwrightDir)
  ? fs.readdirSync(playwrightDir).filter(f => f.endsWith('.spec.mjs'))
  : [];
const existingFixtures = fs.existsSync(fixturesDir)
  ? fs.readdirSync(fixturesDir).filter(f => f.endsWith('.html'))
  : [];

console.log(`Found ${existingSpecs.length} existing specs and ${existingFixtures.length} existing fixtures`);

// Create directories if needed
[playwrightDir, fixturesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

let generated = 0;
let skipped = 0;

// Generate tests for UI and Data components
[...UI_COMPONENTS, ...DATA_COMPONENTS].forEach(componentName => {
  const specFile = `${componentName}.spec.mjs`;
  const fixtureFile = `${componentName}.html`;
  const specPath = path.join(playwrightDir, specFile);
  const fixturePath = path.join(fixturesDir, fixtureFile);

  // Skip if both already exist
  if (existingSpecs.includes(specFile) && existingFixtures.includes(fixtureFile)) {
    skipped++;
    return;
  }

  // Generate spec if missing
  if (!existingSpecs.includes(specFile)) {
    fs.writeFileSync(specPath, generateSpec(componentName));
    console.log(`✓ Generated spec: ${specFile}`);
    generated++;
  }

  // Generate fixture if missing
  if (!existingFixtures.includes(fixtureFile)) {
    fs.writeFileSync(fixturePath, generateFixture(componentName));
    console.log(`✓ Generated fixture: ${fixtureFile}`);
  }
});

console.log(`\nGeneration complete:`);
console.log(`  - Generated: ${generated} new test files`);
console.log(`  - Skipped: ${skipped} existing test files`);
console.log(`  - Total components with tests: ${generated + skipped}`);
