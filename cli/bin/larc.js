#!/usr/bin/env node
/**
 * larc CLI
 *
 * Main CLI tool for LARC development
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import { readFile } from 'fs/promises';
import { addComponent } from '../lib/add-component.js';
import { generateComponent } from '../lib/generate.js';
import { startDevServer } from '../lib/dev-server.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  await readFile(join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('larc')
  .version(packageJson.version)
  .description('LARC CLI - Tools for LARC development');

// Add command
program
  .command('add <component>')
  .description('Add a component from the registry')
  .option('-y, --yes', 'Skip confirmation')
  .action(async (component, options) => {
    try {
      await addComponent(component, options);
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err.message);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate boilerplate code (component, page, etc.)')
  .option('-d, --dir <directory>', 'Output directory', 'src/components')
  .action(async (type, name, options) => {
    try {
      await generateComponent(type, name, options);
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err.message);
      process.exit(1);
    }
  });

// Dev command
program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--no-open', 'Don\'t open browser')
  .option('--no-hot', 'Disable hot module reload')
  .action(async (options) => {
    try {
      await startDevServer(options);
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err.message);
      process.exit(1);
    }
  });

// Preview command
program
  .command('preview')
  .description('Preview production build')
  .option('-p, --port <port>', 'Port number', '4000')
  .action(async (options) => {
    try {
      await startDevServer({ ...options, prod: true });
    } catch (err) {
      console.error(chalk.red('❌ Error:'), err.message);
      process.exit(1);
    }
  });

program.parse();
