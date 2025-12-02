#!/usr/bin/env node
/**
 * create-larc-app
 *
 * CLI tool for creating new LARC applications
 */

import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import { program } from 'commander';
import chalk from 'chalk';
import prompts from 'prompts';
import { createApp } from '../lib/create-app.js';
import { readFile } from 'fs/promises';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageJson = JSON.parse(
  await readFile(join(__dirname, '../package.json'), 'utf-8')
);

program
  .name('create-larc-app')
  .version(packageJson.version)
  .description('Create a new LARC application')
  .argument('[project-directory]', 'Project directory name')
  .option('-t, --template <template>', 'Template to use (minimal, dashboard, blog)', 'minimal')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .option('--no-install', 'Skip npm install')
  .option('--no-git', 'Skip git initialization')
  .action(async (projectDir, options) => {
    console.log(chalk.bold.blue('\n✨ Create LARC App\n'));

    let config = {
      projectDir: projectDir || null,
      template: options.template,
      install: options.install,
      git: options.git
    };

    // Interactive prompts if not in yes mode
    if (!options.yes) {
      const questions = [];

      if (!config.projectDir) {
        questions.push({
          type: 'text',
          name: 'projectDir',
          message: 'Project directory:',
          initial: 'my-larc-app',
          validate: value => {
            if (!value) return 'Project directory is required';
            if (!/^[a-zA-Z0-9-_]+$/.test(value)) {
              return 'Project directory must contain only letters, numbers, hyphens, and underscores';
            }
            return true;
          }
        });
      }

      questions.push({
        type: 'select',
        name: 'template',
        message: 'Choose a template:',
        choices: [
          { title: 'Minimal - Just the essentials', value: 'minimal' },
          { title: 'Dashboard - Admin dashboard starter', value: 'dashboard' },
          { title: 'Blog - Blog/content site starter', value: 'blog' }
        ],
        initial: 0
      });

      questions.push({
        type: 'confirm',
        name: 'install',
        message: 'Install dependencies?',
        initial: true
      });

      questions.push({
        type: 'confirm',
        name: 'git',
        message: 'Initialize git repository?',
        initial: true
      });

      const answers = await prompts(questions, {
        onCancel: () => {
          console.log(chalk.red('\n✖ Operation cancelled\n'));
          process.exit(0);
        }
      });

      config = { ...config, ...answers };
    }

    // Validate config
    if (!config.projectDir) {
      console.error(chalk.red('❌ Project directory is required'));
      process.exit(1);
    }

    const projectPath = resolve(process.cwd(), config.projectDir);

    try {
      await createApp(projectPath, config);

      console.log(chalk.bold.green('\n✅ Project created successfully!\n'));
      console.log(chalk.gray('Next steps:\n'));
      console.log(chalk.cyan(`  cd ${config.projectDir}`));
      if (!config.install) {
        console.log(chalk.cyan('  npm install'));
      }
      console.log(chalk.cyan('  npm start'));
      console.log(chalk.gray('\nHappy coding! 🚀\n'));

    } catch (err) {
      console.error(chalk.red('\n❌ Failed to create project:'), err.message);
      process.exit(1);
    }
  });

program.parse();
