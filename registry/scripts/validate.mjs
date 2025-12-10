#!/usr/bin/env node
/**
 * Component Registry Validator
 *
 * Validates component JSON files against the schema and checks:
 * - JSON syntax
 * - Schema compliance
 * - Required fields
 * - npm package existence
 * - URL accessibility
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import chalk from 'chalk';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const componentsDir = path.resolve(__dirname, '../ui');
const schemaPath = path.resolve(__dirname, '../../registry-schema.json');

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

let schema;
try {
  const schemaContent = await fs.readFile(schemaPath, 'utf-8');
  schema = JSON.parse(schemaContent);
} catch (err) {
  console.error(chalk.red('❌ Failed to load schema:'), err.message);
  process.exit(1);
}

// Add schema to AJV
ajv.addSchema(schema, 'registry-schema');

// Component-specific validator (for individual component objects)
const validateComponent = ajv.compile({ $ref: 'registry-schema#/definitions/component' });

/**
 * Validate component name format
 */
function validateComponentName(name) {
  const errors = [];

  // Must be kebab-case with at least one hyphen
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) {
    errors.push('Component name must be kebab-case with at least one hyphen (e.g., "my-component")');
  }

  // Reserved names
  const reserved = ['web-component', 'custom-element', 'html-element'];
  if (reserved.includes(name)) {
    errors.push(`Component name "${name}" is reserved`);
  }

  return errors;
}

/**
 * Validate npm package
 */
async function validateNpmPackage(packageName) {
  if (!packageName) return [];

  const errors = [];

  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      errors.push(`npm package "${packageName}" not found (HTTP ${response.status})`);
    }
  } catch (err) {
    errors.push(`Failed to check npm package: ${err.message}`);
  }

  return errors;
}

/**
 * Validate URLs
 */
async function validateUrls(component) {
  const errors = [];
  const urlsToCheck = [];

  if (component.demo) {
    urlsToCheck.push({ url: component.demo, label: 'demo' });
  }

  if (component.repository?.url) {
    urlsToCheck.push({ url: component.repository.url, label: 'repository' });
  }

  if (component.npm?.url) {
    urlsToCheck.push({ url: component.npm.url, label: 'npm' });
  }

  for (const { url, label } of urlsToCheck) {
    try {
      const response = await fetch(url, { method: 'HEAD', timeout: 5000 });
      if (!response.ok && response.status !== 405) { // 405 = Method Not Allowed is ok
        errors.push(`${label} URL not accessible: ${url} (HTTP ${response.status})`);
      }
    } catch (err) {
      // Warning only, don't fail validation
      console.warn(chalk.yellow(`  ⚠️  Could not verify ${label} URL: ${url}`));
    }
  }

  return errors;
}

/**
 * Validate component quality claims
 */
function validateQuality(component) {
  const errors = [];
  const warnings = [];

  if (component.quality) {
    if (component.quality.tests && !component.repository?.url) {
      warnings.push('Quality claims tests=true but no repository URL to verify');
    }

    if (component.quality.types && !component.npm?.package) {
      warnings.push('Quality claims types=true but no npm package specified');
    }

    if (component.quality.docs && !component.repository?.url && !component.demo) {
      warnings.push('Quality claims docs=true but no repository or demo URL');
    }
  }

  return { errors, warnings };
}

/**
 * Validate a single component file
 */
async function validateComponentFile(filePath) {
  const fileName = path.basename(filePath);
  const errors = [];
  const warnings = [];

  console.log(chalk.blue(`\n📋 Validating ${fileName}...`));

  try {
    // Read and parse JSON
    const content = await fs.readFile(filePath, 'utf-8');
    let component;

    try {
      component = JSON.parse(content);
    } catch (err) {
      errors.push(`Invalid JSON: ${err.message}`);
      return { errors, warnings };
    }

    // Schema validation
    const valid = validateComponent(component);
    if (!valid) {
      validateComponent.errors.forEach(err => {
        errors.push(`Schema error at ${err.instancePath}: ${err.message}`);
      });
    }

    // Component name validation
    if (component.name) {
      const nameErrors = validateComponentName(component.name);
      errors.push(...nameErrors);

      // File name should match component name
      const expectedFileName = `${component.name}.json`;
      if (fileName !== expectedFileName && fileName !== '.component-template.json') {
        warnings.push(`File name "${fileName}" doesn't match component name "${expectedFileName}"`);
      }
    }

    // npm package validation (optional, can be slow)
    if (process.env.CHECK_NPM === 'true' && component.npm?.package) {
      const npmErrors = await validateNpmPackage(component.npm.package);
      errors.push(...npmErrors);
    }

    // URL validation (optional, can be slow)
    if (process.env.CHECK_URLS === 'true') {
      const urlErrors = await validateUrls(component);
      errors.push(...urlErrors);
    }

    // Quality validation
    const qualityResults = validateQuality(component);
    errors.push(...qualityResults.errors);
    warnings.push(...qualityResults.warnings);

    // Required fields check
    if (!component.description || component.description.length < 10) {
      warnings.push('Description should be at least 10 characters');
    }

    if (!component.examples || component.examples.length === 0) {
      warnings.push('No examples provided');
    }

    if (!component.attributes || component.attributes.length === 0) {
      warnings.push('No attributes documented');
    }

  } catch (err) {
    errors.push(`Failed to process file: ${err.message}`);
  }

  return { errors, warnings };
}

/**
 * Main validation function
 */
async function validate() {
  console.log(chalk.bold.blue('\n🔍 LARC Component Registry Validator\n'));

  // Get component files
  let files;
  try {
    const allFiles = await fs.readdir(componentsDir);
    files = allFiles.filter(f =>
      f.endsWith('.json') &&
      f !== '.component-template.json'
    );
  } catch (err) {
    console.error(chalk.red('❌ Failed to read components directory:'), err.message);
    process.exit(1);
  }

  console.log(chalk.gray(`Found ${files.length} component files to validate\n`));

  // Validate specific file if provided
  const targetFile = process.argv[2];
  if (targetFile) {
    files = files.filter(f => f === targetFile || f === `${targetFile}.json`);
    if (files.length === 0) {
      console.error(chalk.red(`❌ Component file not found: ${targetFile}`));
      process.exit(1);
    }
  }

  // Validate each file
  const results = [];
  for (const file of files) {
    const filePath = path.join(componentsDir, file);
    const result = await validateComponentFile(filePath);
    results.push({ file, ...result });
  }

  // Print results
  console.log(chalk.bold.blue('\n📊 Validation Results\n'));

  let totalErrors = 0;
  let totalWarnings = 0;
  let passed = 0;

  for (const result of results) {
    const hasErrors = result.errors.length > 0;
    const hasWarnings = result.warnings.length > 0;

    if (!hasErrors && !hasWarnings) {
      console.log(chalk.green(`✓ ${result.file}`));
      passed++;
    } else {
      if (hasErrors) {
        console.log(chalk.red(`✗ ${result.file}`));
        result.errors.forEach(err => {
          console.log(chalk.red(`  ❌ ${err}`));
        });
        totalErrors += result.errors.length;
      } else {
        console.log(chalk.yellow(`⚠ ${result.file}`));
      }

      if (hasWarnings) {
        result.warnings.forEach(warn => {
          console.log(chalk.yellow(`  ⚠️  ${warn}`));
        });
        totalWarnings += result.warnings.length;
      }
    }
  }

  // Summary
  console.log(chalk.bold.blue('\n📈 Summary\n'));
  console.log(`Total components: ${results.length}`);
  console.log(chalk.green(`Passed: ${passed}`));
  console.log(chalk.yellow(`Warnings: ${totalWarnings}`));
  console.log(chalk.red(`Errors: ${totalErrors}`));

  if (totalErrors > 0) {
    console.log(chalk.red('\n❌ Validation failed'));
    process.exit(1);
  } else if (totalWarnings > 0) {
    console.log(chalk.yellow('\n⚠️  Validation passed with warnings'));
  } else {
    console.log(chalk.green('\n✅ All validations passed!'));
  }
}

// Run validator
validate().catch(err => {
  console.error(chalk.red('❌ Validation error:'), err);
  process.exit(1);
});
