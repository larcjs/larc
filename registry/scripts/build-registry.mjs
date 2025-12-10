#!/usr/bin/env node
/**
 * Registry Builder
 *
 * Builds the complete registry.json from individual component files
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(__dirname, '../ui');
const outputPath = path.resolve(__dirname, '../registry.json');

// Component categories
const CATEGORIES = [
  { id: 'routing', name: 'Routing & Navigation', icon: '🧭', description: 'Client-side routing solutions' },
  { id: 'state', name: 'State Management', icon: '💾', description: 'Data persistence and state handling' },
  { id: 'forms', name: 'Forms & Input', icon: '📝', description: 'Form handling and validation' },
  { id: 'data', name: 'Data & Connectivity', icon: '🔌', description: 'API integration and data fetching' },
  { id: 'ui', name: 'UI Components', icon: '🎨', description: 'Interface building blocks' },
  { id: 'content', name: 'Content & Media', icon: '📄', description: 'Content display and editing' },
  { id: 'auth', name: 'Authentication', icon: '🔐', description: 'Security and authentication' },
  { id: 'theme', name: 'Theming', icon: '🎭', description: 'Theme management' },
  { id: 'devtools', name: 'Developer Tools', icon: '🔧', description: 'Debugging utilities' },
  { id: 'advanced', name: 'Advanced', icon: '⚙️', description: 'Advanced functionality' }
];

/**
 * Calculate quality score
 */
function calculateQualityScore(component) {
  if (!component.quality) {
    return 'C'; // Default score
  }

  let score = 0;

  if (component.quality.tests) score += 25;
  if (component.quality.types) score += 20;
  if (component.quality.docs) score += 20;
  if (component.quality.examples) score += 15;
  if (component.demo) score += 10;
  if (component.verified) score += 10;

  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

/**
 * Build the registry
 */
async function buildRegistry() {
  console.log(chalk.bold.blue('\n📦 Building LARC Component Registry\n'));

  // Read component files
  let files;
  try {
    const allFiles = await fs.readdir(componentsDir);
    files = allFiles.filter(f =>
      f.endsWith('.json') &&
      f !== '.component-template.json'
    );
  } catch (err) {
    console.error(chalk.red('❌ Failed to read components directory:'), err.message);
    process.exit(1);
  }

  console.log(chalk.gray(`Found ${files.length} component files\n`));

  // Load components
  const components = [];
  const errors = [];

  for (const file of files) {
    const filePath = path.join(componentsDir, file);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const component = JSON.parse(content);

      // Calculate quality score if not already set
      if (component.quality && !component.quality.score) {
        component.quality.score = calculateQualityScore(component);
      }

      components.push(component);
      console.log(chalk.green(`  ✓ ${component.name}`));
    } catch (err) {
      console.error(chalk.red(`  ✗ ${file}: ${err.message}`));
      errors.push({ file, error: err.message });
    }
  }

  if (errors.length > 0) {
    console.log(chalk.red(`\n❌ Failed to load ${errors.length} components`));
    process.exit(1);
  }

  // Sort components by name
  components.sort((a, b) => a.name.localeCompare(b.name));

  // Build registry object
  const registry = {
    version: '1.0.0',
    generated: new Date().toISOString(),
    components,
    categories: CATEGORIES,
    stats: {
      totalComponents: components.length,
      byCategory: {},
      byStatus: {},
      byQuality: {}
    }
  };

  // Calculate stats
  components.forEach(component => {
    // By category
    if (!registry.stats.byCategory[component.category]) {
      registry.stats.byCategory[component.category] = 0;
    }
    registry.stats.byCategory[component.category]++;

    // By status
    if (!registry.stats.byStatus[component.status]) {
      registry.stats.byStatus[component.status] = 0;
    }
    registry.stats.byStatus[component.status]++;

    // By quality
    if (component.quality?.score) {
      if (!registry.stats.byQuality[component.quality.score]) {
        registry.stats.byQuality[component.quality.score] = 0;
      }
      registry.stats.byQuality[component.quality.score]++;
    }
  });

  // Write registry
  console.log(chalk.blue(`\n💾 Writing registry to ${path.basename(outputPath)}`));
  await fs.writeFile(outputPath, JSON.stringify(registry, null, 2));

  // Print summary
  console.log(chalk.bold.blue('\n📊 Registry Statistics\n'));
  console.log(chalk.gray(`Total components: ${registry.stats.totalComponents}`));

  console.log(chalk.bold('\nBy Category:'));
  Object.entries(registry.stats.byCategory).forEach(([cat, count]) => {
    const category = CATEGORIES.find(c => c.id === cat);
    console.log(chalk.gray(`  ${category.icon} ${category.name}: ${count}`));
  });

  console.log(chalk.bold('\nBy Status:'));
  Object.entries(registry.stats.byStatus).forEach(([status, count]) => {
    const color = status === 'stable' ? 'green' : status === 'beta' ? 'yellow' : 'gray';
    console.log(chalk[color](`  ${status}: ${count}`));
  });

  if (Object.keys(registry.stats.byQuality).length > 0) {
    console.log(chalk.bold('\nBy Quality:'));
    ['A', 'B', 'C', 'D', 'F'].forEach(grade => {
      if (registry.stats.byQuality[grade]) {
        const color = grade === 'A' ? 'green' : grade === 'B' ? 'blue' : grade === 'C' ? 'yellow' : 'gray';
        console.log(chalk[color](`  Grade ${grade}: ${registry.stats.byQuality[grade]}`));
      }
    });
  }

  console.log(chalk.bold.green('\n✅ Registry built successfully!\n'));
}

// Run builder
buildRegistry().catch(err => {
  console.error(chalk.red('❌ Build error:'), err);
  process.exit(1);
});
