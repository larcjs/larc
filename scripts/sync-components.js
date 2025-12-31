#!/usr/bin/env node
/**
 * Sync UI Components to Core Package
 *
 * Copies all components from @larcjs/ui to @larcjs/core/components/
 * Run this before publishing to ensure core has all UI components.
 *
 * Usage: node scripts/sync-components.js
 */

import { readdir, copyFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const uiDir = join(rootDir, 'packages/ui');
const coreComponentsDir = join(rootDir, 'packages/core/components');

async function syncComponents() {
  console.log('🔄 Syncing UI components to @larcjs/core/components/...\n');

  // Ensure core/components directory exists
  try {
    await mkdir(coreComponentsDir, { recursive: true });
  } catch (err) {
    // Directory already exists
  }

  // Get all .mjs files from ui package (excluding node_modules, tests, etc.)
  const files = await readdir(uiDir);
  const componentFiles = files.filter(f =>
    (f.endsWith('.mjs') || f.endsWith('.min.mjs')) &&
    !f.startsWith('.')
  );

  console.log(`Found ${componentFiles.length} component files in @larcjs/ui\n`);

  let copied = 0;
  let skipped = 0;

  for (const file of componentFiles) {
    const source = join(uiDir, file);
    const dest = join(coreComponentsDir, file);

    try {
      await copyFile(source, dest);
      console.log(`  ✅ ${file}`);
      copied++;
    } catch (err) {
      console.log(`  ⚠️  ${file} - ${err.message}`);
      skipped++;
    }
  }

  console.log(`\n✨ Done! Copied ${copied} files, skipped ${skipped}\n`);
  console.log('📦 Components synced to @larcjs/core/components/\n');
}

// Run it
syncComponents().catch(err => {
  console.error('❌ Error syncing components:', err);
  process.exit(1);
});
