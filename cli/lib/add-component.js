/**
 * Add component from registry
 */

import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';
import prompts from 'prompts';
import fetch from 'node-fetch';

const REGISTRY_URL = 'https://raw.githubusercontent.com/larcjs/registry/main/registry.json';

export async function addComponent(componentName, options) {
  console.log(chalk.blue(`\n📦 Adding component: ${componentName}\n`));

  // Load registry
  console.log(chalk.gray('  Fetching registry...'));
  let registry;
  try {
    const response = await fetch(REGISTRY_URL);
    registry = await response.json();
  } catch (err) {
    throw new Error(`Failed to fetch registry: ${err.message}`);
  }

  // Find component
  const component = registry.components.find(c =>
    c.name === componentName ||
    c.npm?.package === componentName ||
    c.displayName.toLowerCase() === componentName.toLowerCase()
  );

  if (!component) {
    throw new Error(`Component "${componentName}" not found in registry`);
  }

  console.log(chalk.green(`  ✓ Found: ${component.displayName}`));
  console.log(chalk.gray(`    ${component.description}`));

  // Show component info
  if (!options.yes) {
    console.log(chalk.gray(`\n    Category: ${component.category}`));
    console.log(chalk.gray(`    Status: ${component.status}`));
    console.log(chalk.gray(`    NPM: ${component.npm?.package || 'N/A'}`));
    console.log(chalk.gray(`    CDN: ${component.cdn?.jsdelivr || 'N/A'}`));

    const { confirm } = await prompts({
      type: 'confirm',
      name: 'confirm',
      message: 'Add this component?',
      initial: true
    });

    if (!confirm) {
      console.log(chalk.yellow('\n  ✖ Cancelled\n'));
      return;
    }
  }

  // Update larc.config.json
  try {
    const configPath = join(process.cwd(), 'larc.config.json');
    const configContent = await readFile(configPath, 'utf-8');
    const config = JSON.parse(configContent);

    if (!config.importmap) {
      config.importmap = { imports: {} };
    }

    if (!config.importmap.imports) {
      config.importmap.imports = {};
    }

    // Add import
    const packageName = component.npm?.package || component.name;
    const cdnUrl = component.cdn?.jsdelivr || component.cdn?.unpkg;

    if (cdnUrl) {
      config.importmap.imports[packageName] = cdnUrl;
      await writeFile(configPath, JSON.stringify(config, null, 2));
      console.log(chalk.green(`\n  ✓ Added to larc.config.json`));
    }

    // Show usage
    console.log(chalk.blue('\n  Usage:\n'));
    console.log(chalk.gray(`    import '${packageName}';\n`));

    if (component.examples && component.examples.length > 0) {
      console.log(chalk.blue('  Example:\n'));
      console.log(chalk.gray(`    ${component.examples[0].code}\n`));
    }

  } catch (err) {
    console.warn(chalk.yellow(`\n  ⚠ Could not update larc.config.json: ${err.message}`));
    console.log(chalk.gray(`\n  Manual setup:`));
    console.log(chalk.gray(`    Add to your importmap:`));
    console.log(chalk.gray(`    "${component.npm?.package}": "${component.cdn?.jsdelivr}"`));
  }

  console.log(chalk.green('\n✅ Component added successfully!\n'));
}
