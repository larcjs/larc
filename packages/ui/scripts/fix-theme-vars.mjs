#!/usr/bin/env node

/**
 * Fix Theme Variables Script
 *
 * Scans PAN components and updates them to use standard theme variable names.
 *
 * Usage:
 *   node fix-theme-vars.mjs [--dry-run] [--file=path/to/file.mjs]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packagesDir = path.resolve(__dirname, '..');

// Mapping of old variable names to new standard names
const varMapping = {
  '--bg': '--color-surface',
  '--fg': '--color-text',
  '--border': '--color-border',
  '--card': '--color-surface-alt',
  '--accent': '--color-accent',
  '--muted': '--color-muted',
  '--primary': '--color-accent',
  '--text-muted': '--color-muted',
  '--primary-dark': '--color-accent',
  '--surface-alt': '--color-surface-alt',
  '--code-bg': '--color-code-bg',
  '--code-text': '--color-text',
};

function findComponents(dir) {
  const files = [];
  const items = fs.readdirSync(dir);

  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip node_modules, tests, etc.
      if (!['node_modules', 'test', 'tests', 'docs', 'scripts'].includes(item)) {
        files.push(...findComponents(fullPath));
      }
    } else if (item.endsWith('.mjs') && item.startsWith('pan-')) {
      files.push(fullPath);
    }
  }

  return files;
}

function replaceVars(content) {
  let updated = content;
  let changes = [];

  for (const [oldVar, newVar] of Object.entries(varMapping)) {
    // Match var(--old-var, fallback) and replace with var(--new-var, fallback)
    const regex = new RegExp(`var\\(\\s*${escapeRegex(oldVar)}([,\\s)])`, 'g');
    const matches = content.match(regex);

    if (matches && matches.length > 0) {
      updated = updated.replace(regex, `var(${newVar}$1`);
      changes.push(`${oldVar} → ${newVar} (${matches.length} occurrences)`);
    }
  }

  return { updated, changes };
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function processFile(filePath, dryRun = false) {
  const content = fs.readFileSync(filePath, 'utf8');
  const { updated, changes } = replaceVars(content);

  if (changes.length > 0) {
    console.log(`\n📝 ${path.basename(filePath)}`);
    changes.forEach(change => console.log(`   ${change}`));

    if (!dryRun) {
      fs.writeFileSync(filePath, updated, 'utf8');
      console.log(`   ✅ Updated`);
    } else {
      console.log(`   🔍 Dry run - no changes made`);
    }

    return true;
  }

  return false;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const fileArg = args.find(arg => arg.startsWith('--file='));
  const specificFile = fileArg ? fileArg.split('=')[1] : null;

  console.log('🎨 PAN Theme Variable Fixer\n');

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No files will be modified\n');
  }

  let files;
  if (specificFile) {
    files = [path.resolve(specificFile)];
    console.log(`Processing single file: ${specificFile}\n`);
  } else {
    files = findComponents(packagesDir);
    console.log(`Found ${files.length} component files\n`);
  }

  let updatedCount = 0;
  for (const file of files) {
    if (processFile(file, dryRun)) {
      updatedCount++;
    }
  }

  console.log(`\n✨ Done! ${updatedCount} file(s) needed updates`);

  if (dryRun && updatedCount > 0) {
    console.log('\nRun without --dry-run to apply changes');
  }
}

main();
