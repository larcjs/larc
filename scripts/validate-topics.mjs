#!/usr/bin/env node
/**
 * Topic Validation CI Script
 * 
 * Validates that all topics used in the codebase are documented in the dictionary.
 * Returns non-zero exit code if validation fails.
 * 
 * Usage:
 *   node scripts/validate-topics.mjs [--strict] [--threshold=N]
 * 
 * Options:
 *   --strict      Fail on any unknown topic
 *   --threshold=N Fail if unknown topics exceed N (default: 0 in strict, 50 otherwise)
 *   --fix         Suggest adding @topic annotations
 *   --json        Output as JSON for CI integration
 */

import { readFile, readdir } from 'fs/promises';
import { join, relative } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse args
const args = process.argv.slice(2);
const strict = args.includes('--strict');
const jsonOutput = args.includes('--json');
const fix = args.includes('--fix');
const thresholdArg = args.find(a => a.startsWith('--threshold='));
const threshold = thresholdArg ? parseInt(thresholdArg.split('=')[1]) : (strict ? 0 : 50);

/**
 * Load the topic dictionary
 */
async function loadDictionary() {
  const dictPath = join(ROOT, 'packages/core/topic-dictionary.json');
  try {
    const content = await readFile(dictPath, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error('❌ Could not load topic-dictionary.json');
    console.error('   Run: node scripts/generate-topic-dictionary.mjs');
    process.exit(1);
  }
}

/**
 * Find all source files
 */
async function findSourceFiles(dir, files = []) {
  const entries = await readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      await findSourceFiles(fullPath, files);
    } else if (entry.name.endsWith('.mjs') || entry.name.endsWith('.js') || entry.name.endsWith('.html')) {
      if (!entry.name.includes('.min.') && !entry.name.includes('.test.')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * Extract topics from file
 */
async function extractTopics(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relPath = relative(ROOT, filePath);
  const topics = [];
  
  // Match publish({ topic: 'xxx' }) or publish('topic', ...)
  const publishRegex = /\.publish\s*\(\s*(?:\{[^}]*topic:\s*['"`]([^'"`]+)['"`]|['"`]([^'"`]+)['"`])/g;
  let match;
  
  while ((match = publishRegex.exec(content)) !== null) {
    const topic = match[1] || match[2];
    if (topic && !topic.includes('${') && !topic.includes('+')) {
      topics.push({ topic, type: 'publish', file: relPath, line: getLineNumber(content, match.index) });
    }
  }
  
  // Match subscribe('topic', ...)
  const subscribeRegex = /\.subscribe\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  while ((match = subscribeRegex.exec(content)) !== null) {
    const topic = match[1];
    if (topic && !topic.includes('${') && !topic.includes('+')) {
      topics.push({ topic, type: 'subscribe', file: relPath, line: getLineNumber(content, match.index) });
    }
  }
  
  return topics;
}

/**
 * Get line number from character index
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Check if topic is in dictionary
 */
function isKnownTopic(topic, dictionary) {
  // Direct match
  if (dictionary.topics[topic]) return true;
  
  // Skip wildcards
  if (topic.includes('*')) return true;
  
  // Skip internal topics
  if (topic.startsWith('pan:') || topic.startsWith('sys:')) return true;
  
  // Try parameterized match
  // {param} can match one or more segments (e.g., {topic} could be "contacts.search")
  for (const pattern of Object.keys(dictionary.topics)) {
    if (pattern.includes('{')) {
      // Replace {param} with a pattern that matches one or more segments
      const regexPattern = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\{[^}]+\}/g, '[^.]+(?:\\.[^.]+)*');  // {param} matches one+ segments
      const regex = new RegExp('^' + regexPattern + '$');
      if (regex.test(topic)) return true;
    }
  }
  
  return false;
}

/**
 * Suggest similar topics
 */
function suggestSimilar(topic, dictionary) {
  const suggestions = [];
  const parts = topic.toLowerCase().split('.');
  
  for (const known of Object.keys(dictionary.topics)) {
    const knownParts = known.toLowerCase().split('.');
    let score = 0;
    
    for (const part of parts) {
      if (knownParts.some(kp => kp.includes(part) || part.includes(kp))) {
        score++;
      }
    }
    
    if (score > 0) suggestions.push({ topic: known, score });
  }
  
  return suggestions.sort((a, b) => b.score - a.score).slice(0, 3).map(s => s.topic);
}

/**
 * Generate fix suggestion
 */
function generateFix(usage) {
  const inferredType = inferType(usage.topic);
  return `Add to component JSDoc:\n  @topic ${usage.topic} - [description]`;
}

function inferType(topic) {
  if (topic.endsWith('.state')) return 'state';
  if (topic.includes('.get') || topic.includes('.list') || topic.includes('.request')) return 'request';
  if (topic.includes('.save') || topic.includes('.delete') || topic.includes('.add')) return 'command';
  if (topic.includes('.created') || topic.includes('.updated') || topic.includes('.ready') || topic.includes('.error')) return 'event';
  return 'unknown';
}

/**
 * Main
 */
async function main() {
  const dictionary = await loadDictionary();
  
  // Find all source files
  const packagesDir = join(ROOT, 'packages');
  const appsDir = join(ROOT, 'apps');
  
  const files = [
    ...(await findSourceFiles(packagesDir)),
    ...(await findSourceFiles(appsDir))
  ];
  
  // Extract all topic usages
  const allUsages = [];
  for (const file of files) {
    const topics = await extractTopics(file);
    allUsages.push(...topics);
  }
  
  // Find unknown topics
  const unknownUsages = allUsages.filter(u => !isKnownTopic(u.topic, dictionary));
  const unknownTopics = [...new Set(unknownUsages.map(u => u.topic))];
  
  // Output results
  if (jsonOutput) {
    console.log(JSON.stringify({
      valid: unknownTopics.length <= threshold,
      totalUsages: allUsages.length,
      unknownCount: unknownTopics.length,
      threshold,
      unknownTopics: unknownUsages.map(u => ({
        topic: u.topic,
        file: u.file,
        line: u.line,
        type: u.type,
        suggestions: suggestSimilar(u.topic, dictionary)
      }))
    }, null, 2));
  } else {
    console.log('🔍 Topic Validation Report');
    console.log('═'.repeat(50));
    console.log(`   Total topic usages: ${allUsages.length}`);
    console.log(`   Known topics: ${allUsages.length - unknownUsages.length}`);
    console.log(`   Unknown topics: ${unknownTopics.length}`);
    console.log(`   Threshold: ${threshold}`);
    console.log('');
    
    if (unknownTopics.length > 0) {
      console.log('⚠️  Unknown Topics:');
      console.log('');
      
      // Group by topic
      const byTopic = new Map();
      for (const u of unknownUsages) {
        if (!byTopic.has(u.topic)) byTopic.set(u.topic, []);
        byTopic.get(u.topic).push(u);
      }
      
      for (const [topic, usages] of byTopic) {
        console.log(`   📌 ${topic}`);
        for (const u of usages.slice(0, 3)) {
          console.log(`      ${u.type === 'publish' ? '📤' : '📥'} ${u.file}:${u.line}`);
        }
        if (usages.length > 3) {
          console.log(`      ... and ${usages.length - 3} more`);
        }
        
        const suggestions = suggestSimilar(topic, dictionary);
        if (suggestions.length > 0) {
          console.log(`      💡 Did you mean: ${suggestions.join(', ')}?`);
        }
        
        if (fix) {
          console.log(`      🔧 ${generateFix(usages[0])}`);
        }
        console.log('');
      }
    }
    
    if (unknownTopics.length <= threshold) {
      console.log('✅ Topic validation PASSED');
    } else {
      console.log(`❌ Topic validation FAILED (${unknownTopics.length} > ${threshold})`);
    }
  }
  
  // Exit with appropriate code
  process.exit(unknownTopics.length <= threshold ? 0 : 1);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
