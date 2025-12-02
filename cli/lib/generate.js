/**
 * Generate component boilerplate
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import chalk from 'chalk';

const TEMPLATES = {
  component: (name, className) => `/**
 * ${className} Component
 */

export class ${className} extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  static get observedAttributes() {
    return ['value'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  get value() {
    return this.getAttribute('value') || '';
  }

  set value(val) {
    this.setAttribute('value', val);
  }

  render() {
    this.shadowRoot.innerHTML = \`
      <style>
        :host {
          display: block;
          padding: 1rem;
        }

        .container {
          font-family: system-ui, sans-serif;
        }
      </style>

      <div class="container">
        <h3>${className}</h3>
        <p>Value: \${this.value}</p>
      </div>
    \`;
  }
}

customElements.define('${name}', ${className});
`
};

function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

export async function generateComponent(type, name, options) {
  console.log(chalk.blue(`\n✨ Generating ${type}: ${name}\n`));

  // Validate name
  if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)+$/.test(name)) {
    throw new Error('Component name must be kebab-case with at least one hyphen (e.g., "my-component")');
  }

  // Get template
  const template = TEMPLATES[type];
  if (!template) {
    throw new Error(`Unknown type: ${type}. Available types: ${Object.keys(TEMPLATES).join(', ')}`);
  }

  // Generate file
  const className = toPascalCase(name);
  const content = template(name, className);

  const dir = options.dir || 'src/components';
  const filePath = join(process.cwd(), dir, `${name}.js`);

  try {
    // Ensure directory exists
    await mkdir(join(process.cwd(), dir), { recursive: true });

    // Write file
    await writeFile(filePath, content);

    console.log(chalk.green(`  ✓ Created ${filePath}`));
    console.log(chalk.blue('\n  Next steps:\n'));
    console.log(chalk.gray(`    1. Import in your app: import './${dir}/${name}.js'`));
    console.log(chalk.gray(`    2. Use in HTML: <${name}></${name}>`));
    console.log(chalk.gray(`    3. Customize the component\n`));

    console.log(chalk.green('✅ Component generated successfully!\n'));

  } catch (err) {
    throw new Error(`Failed to create file: ${err.message}`);
  }
}
