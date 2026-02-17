#!/usr/bin/env node
/**
 * Topic Dictionary Generator
 * 
 * Scans LARC components for @topic JSDoc annotations and publish/subscribe calls,
 * generating a canonical topic dictionary for validation.
 * 
 * Usage:
 *   node scripts/generate-topic-dictionary.mjs [--output=path] [--format=json|ts|md]
 * 
 * Output:
 *   - topic-dictionary.json: Machine-readable dictionary
 *   - topic-dictionary.d.ts: TypeScript types (optional)
 *   - TOPICS.md: Human-readable reference (optional)
 */

import { readdir, readFile, writeFile, stat } from 'fs/promises';
import { join, relative, basename } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// Parse command line args
const args = process.argv.slice(2);
const outputPath = args.find(a => a.startsWith('--output='))?.split('=')[1] || join(ROOT, 'packages/core');
const format = args.find(a => a.startsWith('--format='))?.split('=')[1] || 'all';

/**
 * Topic entry structure
 */
class TopicEntry {
  constructor(topic, source) {
    this.topic = topic;
    this.sources = [source];
    this.description = '';
    this.type = 'unknown'; // 'state', 'command', 'event', 'request', 'internal'
    this.published = false;
    this.subscribed = false;
    this.parameters = []; // For parameterized topics like {store}.idb.result
  }

  merge(other) {
    this.sources = [...new Set([...this.sources, ...other.sources])];
    if (other.description && !this.description) this.description = other.description;
    if (other.type !== 'unknown') this.type = other.type;
    this.published = this.published || other.published;
    this.subscribed = this.subscribed || other.subscribed;
    if (other.parameters.length) this.parameters = [...new Set([...this.parameters, ...other.parameters])];
  }
}

/**
 * Infer topic type from naming conventions
 */
function inferTopicType(topic) {
  if (topic.endsWith('.state')) return 'state';
  if (topic.includes('.get') || topic.includes('.list') || topic.includes('.request')) return 'request';
  if (topic.includes('.save') || topic.includes('.delete') || topic.includes('.add') || topic.includes('.put')) return 'command';
  if (topic.includes('.created') || topic.includes('.updated') || topic.includes('.deleted') || 
      topic.includes('.opened') || topic.includes('.closed') || topic.includes('.ready') ||
      topic.includes('.result') || topic.includes('.error') || topic.includes('.success')) return 'event';
  if (topic.startsWith('pan:') || topic.startsWith('sys:')) return 'internal';
  return 'unknown';
}

/**
 * Extract parameters from topic template (e.g., {store} from {store}.idb.result)
 */
function extractParameters(topic) {
  const params = [];
  const regex = /\{(\w+)\}/g;
  let match;
  while ((match = regex.exec(topic)) !== null) {
    params.push(match[1]);
  }
  return params;
}

/**
 * Normalize a topic for dictionary key (replace parameters with placeholders)
 */
function normalizeTopicKey(topic) {
  return topic.replace(/\{(\w+)\}/g, '{$1}');
}

/**
 * Recursively find all .mjs and .js files
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
 * Extract @topic annotations from JSDoc comments
 */
function extractJSDocTopics(content, filePath) {
  const topics = [];
  
  // Match @topic annotations:
  // @topic topic.name - description
  // @topic {param}.topic.name - description  
  // The topic can contain {param} placeholders anywhere
  const jsdocRegex = /@topic\s+([\w{}.:-]+(?:\s*\([^)]*\))?)\s*-?\s*(.*)/g;
  let match;
  
  while ((match = jsdocRegex.exec(content)) !== null) {
    let topic = match[1].trim();
    let description = match[2]?.trim() || '';
    
    // If topic ends with (type), extract it as description prefix
    const typeMatch = topic.match(/\s*\(([^)]+)\)$/);
    if (typeMatch) {
      topic = topic.replace(/\s*\([^)]+\)$/, '').trim();
      description = `(${typeMatch[1]}) ${description}`.trim();
    }
    
    const entry = new TopicEntry(topic, filePath);
    entry.description = description;
    entry.type = inferTopicType(topic);
    entry.parameters = extractParameters(topic);
    
    topics.push(entry);
  }
  
  return topics;
}

/**
 * Extract topics from publish/subscribe calls
 */
function extractUsageTopics(content, filePath) {
  const topics = [];
  
  // Match publish({ topic: 'xxx' }) or publish('topic', ...)
  const publishRegex = /\.publish\s*\(\s*(?:\{[^}]*topic:\s*['"`]([^'"`]+)['"`]|['"`]([^'"`]+)['"`])/g;
  let match;
  
  while ((match = publishRegex.exec(content)) !== null) {
    const topic = match[1] || match[2];
    if (topic && !topic.includes('${') && !topic.includes('+')) { // Skip dynamic topics
      const entry = new TopicEntry(topic, filePath);
      entry.published = true;
      entry.type = inferTopicType(topic);
      topics.push(entry);
    }
  }
  
  // Match subscribe('topic', ...) or subscribe(TOPIC.XXX, ...)
  const subscribeRegex = /\.subscribe\s*\(\s*['"`]([^'"`]+)['"`]/g;
  
  while ((match = subscribeRegex.exec(content)) !== null) {
    const topic = match[1];
    if (topic && !topic.includes('${') && !topic.includes('+')) {
      const entry = new TopicEntry(topic, filePath);
      entry.subscribed = true;
      entry.type = inferTopicType(topic);
      topics.push(entry);
    }
  }
  
  return topics;
}

/**
 * Process a single file
 */
async function processFile(filePath) {
  const content = await readFile(filePath, 'utf-8');
  const relPath = relative(ROOT, filePath);
  
  const jsdocTopics = extractJSDocTopics(content, relPath);
  const usageTopics = extractUsageTopics(content, relPath);
  
  return [...jsdocTopics, ...usageTopics];
}

/**
 * Merge topic entries with the same normalized key
 */
function mergeTopics(allTopics) {
  const merged = new Map();
  
  for (const entry of allTopics) {
    const key = normalizeTopicKey(entry.topic);
    
    if (merged.has(key)) {
      merged.get(key).merge(entry);
    } else {
      merged.set(key, entry);
    }
  }
  
  return merged;
}

/**
 * Generate JSON output
 */
function generateJSON(topicsMap) {
  const topics = {};
  const byNamespace = {};
  
  for (const [key, entry] of topicsMap) {
    const parts = key.split('.');
    const namespace = parts[0];
    
    topics[key] = {
      topic: entry.topic,
      type: entry.type,
      description: entry.description,
      published: entry.published,
      subscribed: entry.subscribed,
      parameters: entry.parameters,
      sources: entry.sources.slice(0, 5) // Limit sources for readability
    };
    
    if (!byNamespace[namespace]) byNamespace[namespace] = [];
    byNamespace[namespace].push(key);
  }
  
  return {
    version: '1.0.0',
    generated: new Date().toISOString(),
    stats: {
      total: topicsMap.size,
      byType: {
        state: [...topicsMap.values()].filter(t => t.type === 'state').length,
        command: [...topicsMap.values()].filter(t => t.type === 'command').length,
        event: [...topicsMap.values()].filter(t => t.type === 'event').length,
        request: [...topicsMap.values()].filter(t => t.type === 'request').length,
        internal: [...topicsMap.values()].filter(t => t.type === 'internal').length,
        unknown: [...topicsMap.values()].filter(t => t.type === 'unknown').length
      }
    },
    namespaces: byNamespace,
    topics
  };
}

/**
 * Generate TypeScript definitions
 */
function generateTypeScript(topicsMap) {
  const lines = [
    '/**',
    ' * LARC Topic Dictionary',
    ' * Auto-generated - do not edit manually',
    ` * Generated: ${new Date().toISOString()}`,
    ' */',
    '',
    'export type TopicType = "state" | "command" | "event" | "request" | "internal" | "unknown";',
    '',
    'export interface TopicDefinition {',
    '  topic: string;',
    '  type: TopicType;',
    '  description: string;',
    '  parameters?: string[];',
    '}',
    '',
    '/** All known topics */',
    'export const TOPICS = {'
  ];
  
  // Group by namespace
  const byNamespace = new Map();
  for (const [key, entry] of topicsMap) {
    // Skip wildcards and invalid entries for TypeScript
    if (key === '*' || key.includes('*') || key.includes(':')) continue;
    
    const parts = key.split('.');
    const namespace = parts[0].toUpperCase().replace(/-/g, '_').replace(/[^A-Z0-9_]/g, '');
    
    if (!namespace) continue;
    if (!byNamespace.has(namespace)) byNamespace.set(namespace, []);
    byNamespace.get(namespace).push({ key, entry });
  }
  
  for (const [namespace, entries] of byNamespace) {
    lines.push(`  ${namespace}: {`);
    
    for (const { key, entry } of entries) {
      let constName = key
        .split('.')
        .slice(1)
        .join('_')
        .toUpperCase()
        .replace(/-/g, '_')
        .replace(/[{}]/g, '')
        .replace(/[^A-Z0-9_]/g, '');
      
      // Ensure valid identifier
      if (!constName || /^[0-9]/.test(constName)) constName = 'TOPIC_' + constName;
      
      if (entry.description) {
        lines.push(`    /** ${entry.description} */`);
      }
      lines.push(`    ${constName}: '${entry.topic}' as const,`);
    }
    
    lines.push('  },');
  }
  
  lines.push('} as const;');
  lines.push('');
  lines.push('/** Topic string literal union type */');
  lines.push('export type Topic = typeof TOPICS[keyof typeof TOPICS][keyof typeof TOPICS[keyof typeof TOPICS]];');
  lines.push('');
  
  return lines.join('\n');
}

/**
 * Generate Markdown documentation
 */
function generateMarkdown(topicsMap, jsonData) {
  const lines = [
    '# LARC Topic Dictionary',
    '',
    `> Auto-generated on ${new Date().toISOString()}`,
    '',
    '## Statistics',
    '',
    `- **Total Topics:** ${jsonData.stats.total}`,
    `- **State Topics:** ${jsonData.stats.byType.state}`,
    `- **Command Topics:** ${jsonData.stats.byType.command}`,
    `- **Event Topics:** ${jsonData.stats.byType.event}`,
    `- **Request Topics:** ${jsonData.stats.byType.request}`,
    '',
    '## Topics by Namespace',
    ''
  ];
  
  for (const [namespace, topicKeys] of Object.entries(jsonData.namespaces)) {
    lines.push(`### ${namespace}`);
    lines.push('');
    lines.push('| Topic | Type | Description |');
    lines.push('|-------|------|-------------|');
    
    for (const key of topicKeys.sort()) {
      const t = jsonData.topics[key];
      lines.push(`| \`${t.topic}\` | ${t.type} | ${t.description || '-'} |`);
    }
    
    lines.push('');
  }
  
  return lines.join('\n');
}

/**
 * Main
 */
async function main() {
  console.log('🔍 Scanning for topics...');
  
  // Find all source files
  const packagesDir = join(ROOT, 'packages');
  const appsDir = join(ROOT, 'apps');
  
  const files = [
    ...(await findSourceFiles(packagesDir)),
    ...(await findSourceFiles(appsDir))
  ];
  
  console.log(`   Found ${files.length} source files`);
  
  // Process all files
  const allTopics = [];
  for (const file of files) {
    const topics = await processFile(file);
    allTopics.push(...topics);
  }
  
  console.log(`   Extracted ${allTopics.length} topic references`);
  
  // Merge duplicates
  const mergedTopics = mergeTopics(allTopics);
  console.log(`   Merged to ${mergedTopics.size} unique topics`);
  
  // Generate outputs
  const jsonData = generateJSON(mergedTopics);
  
  if (format === 'all' || format === 'json') {
    const jsonPath = join(outputPath, 'topic-dictionary.json');
    await writeFile(jsonPath, JSON.stringify(jsonData, null, 2));
    console.log(`✅ Generated ${relative(ROOT, jsonPath)}`);
  }
  
  if (format === 'all' || format === 'ts') {
    const tsData = generateTypeScript(mergedTopics);
    const tsPath = join(outputPath, 'topic-dictionary.d.ts');
    await writeFile(tsPath, tsData);
    console.log(`✅ Generated ${relative(ROOT, tsPath)}`);
  }
  
  if (format === 'all' || format === 'md') {
    const mdData = generateMarkdown(mergedTopics, jsonData);
    const mdPath = join(ROOT, 'docs', 'TOPICS.md');
    await writeFile(mdPath, mdData);
    console.log(`✅ Generated ${relative(ROOT, mdPath)}`);
  }
  
  // Print summary
  console.log('\n📊 Topic Summary:');
  console.log(`   State:    ${jsonData.stats.byType.state}`);
  console.log(`   Command:  ${jsonData.stats.byType.command}`);
  console.log(`   Event:    ${jsonData.stats.byType.event}`);
  console.log(`   Request:  ${jsonData.stats.byType.request}`);
  console.log(`   Internal: ${jsonData.stats.byType.internal}`);
  console.log(`   Unknown:  ${jsonData.stats.byType.unknown}`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
