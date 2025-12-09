#!/usr/bin/env node

/**
 * Build Script for LARC UI Components
 *
 * Creates minified versions alongside source files:
 * - src/components/pan-table.mjs → src/components/pan-table.min.mjs (minified)
 * - src/components/pan-form.mjs → src/components/pan-form.min.mjs
 *
 * Preserves original .mjs files for development/debugging
 * Adds .min.mjs files for production use
 */

import * as esbuild from 'esbuild';
import { readdirSync, statSync, existsSync } from 'fs';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const srcDir = join(rootDir, 'src');

console.log('🚀 Building LARC UI Components with minified versions...\n');

/**
 * Recursively find all .mjs files in a directory
 */
function findMjsFiles(dir, fileList = []) {
  if (!existsSync(dir)) {
    console.warn(`⚠️  Directory not found: ${dir}`);
    return fileList;
  }

  const files = readdirSync(dir);

  for (const file of files) {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Skip test directories, node_modules, and hidden dirs
      if (!file.startsWith('.') && file !== 'node_modules' && file !== 'tests' && file !== 'test') {
        findMjsFiles(filePath, fileList);
      }
    } else if (file.endsWith('.mjs') && !file.endsWith('.min.mjs')) {
      fileList.push(filePath);
    }
  }

  return fileList;
}

/**
 * Minify a single .mjs file
 */
async function minifyFile(inputPath) {
  const dir = dirname(inputPath);
  const ext = extname(inputPath);
  const base = basename(inputPath, ext);
  const outputPath = join(dir, `${base}.min${ext}`);

  try {
    await esbuild.build({
      entryPoints: [inputPath],
      outfile: outputPath,
      format: 'esm',
      minify: true,
      bundle: false, // Keep as separate files, don't bundle dependencies
      platform: 'browser',
      target: 'es2022',
      sourcemap: false, // No sourcemap for minified files
      legalComments: 'none', // Remove comments
      treeShaking: true,
      charset: 'utf8',
    });

    return { success: true, input: inputPath, output: outputPath };
  } catch (error) {
    return { success: false, input: inputPath, error: error.message };
  }
}

// ============================================================================
// Find and minify all .mjs files
// ============================================================================

const mjsFiles = findMjsFiles(srcDir);

if (mjsFiles.length === 0) {
  console.error('❌ No .mjs files found in src/ directory');
  process.exit(1);
}

console.log(`📝 Found ${mjsFiles.length} .mjs files to minify\n`);

const results = [];
let successCount = 0;
let failCount = 0;

for (const file of mjsFiles) {
  const relativePath = file.replace(rootDir + '/', '');
  process.stdout.write(`   Minifying ${relativePath}...`);

  const result = await minifyFile(file);
  results.push(result);

  if (result.success) {
    successCount++;
    const outputRelative = result.output.replace(rootDir + '/', '');
    console.log(` ✅ → ${outputRelative}`);
  } else {
    failCount++;
    console.log(` ❌`);
    console.error(`      Error: ${result.error}`);
  }
}

// ============================================================================
// Summary
// ============================================================================

console.log('\n' + '='.repeat(60));
console.log('📊 Build Summary');
console.log('='.repeat(60));
console.log(`✅ Success: ${successCount} files`);
if (failCount > 0) {
  console.log(`❌ Failed:  ${failCount} files`);
}
console.log(`📁 Output:  .min.mjs files alongside originals`);
console.log('='.repeat(60));

if (failCount > 0) {
  console.error('\n⚠️  Some files failed to minify. Check errors above.');
  process.exit(1);
}

console.log('\n✨ Minification complete!\n');
console.log('Usage in HTML:');
console.log('  Development: <script type="module" src="/components/src/components/pan-table.mjs"></script>');
console.log('  Production:  <script type="module" src="/components/src/components/pan-table.min.mjs"></script>');
console.log('');
