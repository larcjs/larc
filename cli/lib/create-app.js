/**
 * Create LARC Application
 */

import { mkdir, writeFile, readdir, readFile, cp } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execAsync = promisify(exec);
const __dirname = dirname(fileURLToPath(import.meta.url));

export async function createApp(projectPath, config) {
  const { template, install, git } = config;

  console.log(chalk.blue(`\n📦 Creating project at ${projectPath}\n`));

  // Check if directory exists
  try {
    await readdir(projectPath);
    throw new Error(`Directory ${projectPath} already exists`);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }

  // Create project directory
  await mkdir(projectPath, { recursive: true });

  // Copy template
  const templateDir = join(__dirname, '../templates', template);
  console.log(chalk.gray(`  Using template: ${template}`));

  try {
    await cp(templateDir, projectPath, { recursive: true });
  } catch (err) {
    throw new Error(`Failed to copy template: ${err.message}`);
  }

  // Generate package.json
  const packageJson = {
    name: projectPath.split('/').pop(),
    version: '0.1.0',
    type: 'module',
    scripts: {
      dev: 'larc dev',
      preview: 'larc preview',
      format: 'prettier --write "**/*.{js,html,css}"'
    },
    devDependencies: {
      prettier: '^3.1.0'
    }
  };

  await writeFile(
    join(projectPath, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
  console.log(chalk.green('  ✓ Created package.json'));

  // Create larc.config.json
  const larcConfig = {
    version: '1.0.0',
    importmap: {
      imports: {
        '@larcjs/core': 'https://cdn.jsdelivr.net/npm/@larcjs/core@latest/dist/index.js',
        '@larcjs/ui': 'https://cdn.jsdelivr.net/npm/@larcjs/ui@latest/dist/index.js'
      }
    },
    devServer: {
      port: 3000,
      hot: true,
      open: true
    }
  };

  await writeFile(
    join(projectPath, 'larc.config.json'),
    JSON.stringify(larcConfig, null, 2)
  );
  console.log(chalk.green('  ✓ Created larc.config.json'));

  // Create .gitignore
  const gitignore = `node_modules/
.DS_Store
dist/
.cache/
*.log
.env
.env.local
`;

  await writeFile(join(projectPath, '.gitignore'), gitignore);
  console.log(chalk.green('  ✓ Created .gitignore'));

  // Create README.md
  const readme = `# ${packageJson.name}

A LARC application created with create-larc-app.

## Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Preview production build
npm run preview
\`\`\`

## Project Structure

\`\`\`
${packageJson.name}/
├── index.html          # Entry point
├── src/
│   ├── app.js         # Main application
│   └── components/    # Custom components
├── public/
│   └── assets/       # Static assets
├── larc.config.json  # LARC configuration
└── package.json
\`\`\`

## Learn More

- [LARC Documentation](https://larcjs.com/docs)
- [Component Registry](https://larcjs.com/components)
- [Playground](https://larcjs.com/playground)

## License

MIT
`;

  await writeFile(join(projectPath, 'README.md'), readme);
  console.log(chalk.green('  ✓ Created README.md'));

  // Install dependencies
  if (install) {
    console.log(chalk.blue('\n📥 Installing dependencies...\n'));
    try {
      await execAsync('npm install', { cwd: projectPath });
      console.log(chalk.green('  ✓ Dependencies installed'));
    } catch (err) {
      console.warn(chalk.yellow('  ⚠ Failed to install dependencies'));
      console.warn(chalk.gray(`    Run 'npm install' manually in ${projectPath}`));
    }
  }

  // Initialize git
  if (git) {
    console.log(chalk.blue('\n🔧 Initializing git repository...\n'));
    try {
      await execAsync('git init', { cwd: projectPath });
      await execAsync('git add .', { cwd: projectPath });
      await execAsync('git commit -m "Initial commit from create-larc-app"', { cwd: projectPath });
      console.log(chalk.green('  ✓ Git repository initialized'));
    } catch (err) {
      console.warn(chalk.yellow('  ⚠ Failed to initialize git'));
    }
  }
}
