#!/usr/bin/env node
/**
 * Interactive Component Addition Tool
 *
 * Helps create a new component entry interactively
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createInterface } from 'readline';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(__dirname, '../ui');

const readline = createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => readline.question(query, resolve));
}

const CATEGORIES = ['routing', 'state', 'forms', 'data', 'ui', 'content', 'auth', 'theme', 'devtools', 'advanced'];
const STATUSES = ['experimental', 'beta', 'stable'];

async function addComponent() {
  console.log(chalk.bold.blue('\n✨ LARC Component Registry - Add Component\n'));

  try {
    // Component name
    const name = await question(chalk.cyan('Component name (kebab-case): '));
    if (!name || !/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) {
      console.error(chalk.red('❌ Invalid component name. Must be kebab-case with at least one hyphen.'));
      process.exit(1);
    }

    // Check if already exists
    const filePath = path.join(componentsDir, `${name}.json`);
    try {
      await fs.access(filePath);
      console.error(chalk.red(`❌ Component "${name}" already exists`));
      process.exit(1);
    } catch (err) {
      // File doesn't exist, good to continue
    }

    // Display name
    const defaultDisplayName = name
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    let displayName = await question(chalk.cyan(`Display name [${defaultDisplayName}]: `));
    displayName = displayName || defaultDisplayName;

    // Description
    const description = await question(chalk.cyan('Description: '));
    if (!description) {
      console.error(chalk.red('❌ Description is required'));
      process.exit(1);
    }

    // Category
    console.log(chalk.gray('\nCategories:'));
    CATEGORIES.forEach((cat, i) => console.log(chalk.gray(`  ${i + 1}. ${cat}`)));
    const categoryNum = await question(chalk.cyan('Category (number): '));
    const category = CATEGORIES[parseInt(categoryNum) - 1];
    if (!category) {
      console.error(chalk.red('❌ Invalid category'));
      process.exit(1);
    }

    // NPM package
    const npmPackage = await question(chalk.cyan('NPM package name: '));
    if (!npmPackage) {
      console.error(chalk.red('❌ NPM package name is required'));
      process.exit(1);
    }

    // Version
    let version = await question(chalk.cyan('Version [1.0.0]: '));
    version = version || '1.0.0';

    // Repository
    const repoUrl = await question(chalk.cyan('Repository URL (GitHub): '));

    // Demo
    const demoUrl = await question(chalk.cyan('Demo URL (optional): '));

    // Author
    const authorName = await question(chalk.cyan('Your name: '));
    const authorGithub = await question(chalk.cyan('GitHub username: '));

    // Status
    console.log(chalk.gray('\nStatus:'));
    STATUSES.forEach((s, i) => console.log(chalk.gray(`  ${i + 1}. ${s}`)));
    const statusNum = await question(chalk.cyan('Status (number) [3]: '));
    const status = STATUSES[parseInt(statusNum || 3) - 1];

    // Build component object
    const component = {
      name,
      displayName,
      description,
      category,
      icon: '📦',
      tags: [category, name.split('-')[0]],
      status,
      since: version,

      npm: {
        package: npmPackage,
        version,
        url: `https://www.npmjs.com/package/${npmPackage}`
      },

      cdn: {
        jsdelivr: `https://cdn.jsdelivr.net/npm/${npmPackage}@${version}/dist/index.js`,
        unpkg: `https://unpkg.com/${npmPackage}@${version}/dist/index.js`,
        esm: `https://esm.sh/${npmPackage}@${version}`
      },

      repository: repoUrl ? {
        type: 'github',
        url: repoUrl
      } : undefined,

      demo: demoUrl || undefined,

      author: {
        name: authorName,
        github: authorGithub
      },

      license: 'MIT',

      panTopics: [],
      attributes: [],
      properties: [],
      methods: [],
      events: [],
      slots: [],
      cssProperties: [],
      cssParts: [],
      examples: [],
      dependencies: ['@larcjs/core'],
      related: [],

      quality: {
        tests: false,
        types: false,
        docs: true,
        examples: false
      }
    };

    // Clean up undefined fields
    Object.keys(component).forEach(key => {
      if (component[key] === undefined) {
        delete component[key];
      }
    });

    // Write file
    await fs.writeFile(filePath, JSON.stringify(component, null, 2));

    console.log(chalk.bold.green(`\n✅ Component "${name}" created successfully!`));
    console.log(chalk.gray(`\nFile: ${filePath}`));
    console.log(chalk.yellow('\n⚠️  Next steps:'));
    console.log(chalk.gray('  1. Edit the file to add attributes, properties, methods, events'));
    console.log(chalk.gray('  2. Add examples'));
    console.log(chalk.gray('  3. Run: npm run validate'));
    console.log(chalk.gray('  4. Run: npm run build'));
    console.log(chalk.gray('  5. Commit and push your changes\n'));

  } catch (err) {
    console.error(chalk.red('❌ Error:'), err.message);
    process.exit(1);
  } finally {
    readline.close();
  }
}

addComponent();
