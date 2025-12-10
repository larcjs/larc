#!/usr/bin/env node

/**
 * Monorepo Build Script - Minify all .mjs files
 *
 * Runs minification for:
 * - core/ submodule
 * - ui/ submodule
 * - Any other directories with .mjs files
 *
 * Creates .min.mjs files alongside originals
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

console.log('🚀 LARC Monorepo - Building minified versions...\n');
console.log('='.repeat(60));

const builds = [
  {
    name: 'Core',
    path: join(rootDir, 'core'),
    script: 'scripts/build-minified.js',
  },
  {
    name: 'UI Components',
    path: join(rootDir, 'ui'),
    script: 'scripts/build-minified.js',
  },
];

let totalSuccess = true;

for (const build of builds) {
  console.log(`\n📦 Building ${build.name}...`);
  console.log('─'.repeat(60));

  const scriptPath = join(build.path, build.script);

  // Check if directory and script exist
  if (!existsSync(build.path)) {
    console.log(`   ⚠️  Skipped (directory not found: ${build.path})`);
    continue;
  }

  if (!existsSync(scriptPath)) {
    console.log(`   ⚠️  Skipped (no build script at ${build.script})`);
    continue;
  }

  try {
    const { stdout, stderr } = await execAsync(`node ${scriptPath}`, {
      cwd: build.path,
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    // Print output
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);

    console.log(`   ✅ ${build.name} build complete`);
  } catch (error) {
    console.error(`   ❌ ${build.name} build failed:`);
    console.error(error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    totalSuccess = false;
  }
}

// ============================================================================
// Final Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 Monorepo Build Summary');
console.log('='.repeat(60));

if (totalSuccess) {
  console.log('✅ All builds completed successfully!');
  console.log('\n💡 Minified files (.min.mjs) created alongside originals');
  console.log('\nUsage:');
  console.log('  Development: Use .mjs files (unminified, with comments)');
  console.log('  Production:  Use .min.mjs files (minified, optimized)');
  console.log('');
} else {
  console.error('❌ Some builds failed. Check errors above.');
  process.exit(1);
}
