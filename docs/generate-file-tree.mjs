#!/usr/bin/env node

/**
 * File Tree Generator for Wiki Explorer
 *
 * Scans the current directory and generates a JSON file tree
 * of all markdown (.md), HTML (.html), and PDF (.pdf) files.
 * The output is suitable for use with the pan-tree component.
 */

import { readdirSync, statSync, writeFileSync } from 'fs';
import { join, relative, basename, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const ROOT_DIR = __dirname; // Scan from the docs directory
const OUTPUT_FILE = join(__dirname, 'file-tree.json');
const EXTENSIONS = ['.md', '.html', '.pdf'];
const SKIP_DIRS = ['node_modules', '.git', 'dist', 'test-results', 'site/node_modules'];

/**
 * Generate a unique ID for tree nodes
 */
let idCounter = 0;
function generateId() {
  return `node-${idCounter++}`;
}

/**
 * Scan a directory and build a tree structure
 */
function scanDirectory(dirPath, basePath = dirPath) {
  const items = [];

  try {
    const entries = readdirSync(dirPath);

    for (const entry of entries) {
      const fullPath = join(dirPath, entry);
      const relativePath = relative(basePath, fullPath);

      // Skip hidden files and directories
      if (entry.startsWith('.')) continue;

      // Check if it's a directory or file
      let stat;
      try {
        stat = statSync(fullPath);
      } catch (err) {
        console.warn(`Skipping ${fullPath}: ${err.message}`);
        continue;
      }

      if (stat.isDirectory()) {
        // Skip unwanted directories
        if (SKIP_DIRS.some(skip => relativePath.includes(skip) || entry === skip)) {
          continue;
        }

        // Recursively scan subdirectory
        const children = scanDirectory(fullPath, basePath);

        // Only include directories that have children with our target files
        if (children.length > 0) {
          items.push({
            id: generateId(),
            name: entry,
            type: 'folder',
            path: relativePath,
            children: children
          });
        }
      } else if (stat.isFile()) {
        // Check if file has one of our target extensions
        const ext = extname(entry).toLowerCase();
        if (EXTENSIONS.includes(ext)) {
          items.push({
            id: generateId(),
            name: entry,
            type: 'file',
            extension: ext,
            path: relativePath,
            size: stat.size,
            modified: stat.mtime.toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.error(`Error scanning directory ${dirPath}:`, err.message);
  }

  // Sort: folders first, then files, both alphabetically
  return items.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === 'folder' ? -1 : 1;
    }
    return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
  });
}

/**
 * Count statistics about the file tree
 */
function countStats(tree) {
  let folders = 0;
  let files = 0;
  let totalSize = 0;

  function traverse(items) {
    for (const item of items) {
      if (item.type === 'folder') {
        folders++;
        if (item.children) {
          traverse(item.children);
        }
      } else if (item.type === 'file') {
        files++;
        totalSize += item.size || 0;
      }
    }
  }

  traverse(tree);

  return { folders, files, totalSize };
}

/**
 * Format bytes to human-readable size
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Main execution
 */
console.log('📁 Scanning directory tree...\n');
console.log(`Root: ${ROOT_DIR}`);
console.log(`Looking for: ${EXTENSIONS.join(', ')}`);
console.log(`Skipping: ${SKIP_DIRS.join(', ')}\n`);

const fileTree = scanDirectory(ROOT_DIR);

// Generate metadata
const stats = countStats(fileTree);
const metadata = {
  generated: new Date().toISOString(),
  root: ROOT_DIR,
  extensions: EXTENSIONS,
  stats: {
    folders: stats.folders,
    files: stats.files,
    totalSize: stats.totalSize,
    totalSizeFormatted: formatBytes(stats.totalSize)
  }
};

// Create output object
const output = {
  metadata,
  tree: fileTree
};

// Write to file
writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf-8');

console.log('✅ File tree generated successfully!\n');
console.log(`📊 Statistics:`);
console.log(`   Folders: ${stats.folders}`);
console.log(`   Files: ${stats.files}`);
console.log(`   Total size: ${formatBytes(stats.totalSize)}`);
console.log(`\n📄 Output: ${relative(process.cwd(), OUTPUT_FILE)}`);
