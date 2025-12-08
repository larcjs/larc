#!/bin/bash
#
# Test Monorepo Migration (Non-Destructive)
# Creates a test migration so you can see what it's like
#

set -e

COLOR_GREEN='\033[0;32m'
COLOR_BLUE='\033[0;34m'
COLOR_YELLOW='\033[1;33m'
COLOR_RED='\033[0;31m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_BLUE}╔════════════════════════════════════════╗${COLOR_RESET}"
echo -e "${COLOR_BLUE}║  LARC Monorepo Migration Test         ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}║  (Non-destructive - creates test dir)  ║${COLOR_RESET}"
echo -e "${COLOR_BLUE}╚════════════════════════════════════════╝${COLOR_RESET}"
echo ""

# Create test directory
TEST_DIR="larc-monorepo-test"

if [ -d "$TEST_DIR" ]; then
    echo -e "${COLOR_YELLOW}⚠ Test directory exists. Remove it? (y/N)${COLOR_RESET}"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        rm -rf "$TEST_DIR"
    else
        echo "Aborted."
        exit 1
    fi
fi

echo -e "${COLOR_GREEN}→${COLOR_RESET} Creating test directory: $TEST_DIR"
mkdir -p "$TEST_DIR"
cd "$TEST_DIR"

# Initialize git
git init
git config user.name "Test User"
git config user.email "test@example.com"

# Create root package.json
echo -e "${COLOR_GREEN}→${COLOR_RESET} Creating root package.json with workspaces..."
cat > package.json << 'EOF'
{
  "name": "larc",
  "version": "1.0.0",
  "private": true,
  "description": "LARC - Lightweight Asynchronous Relay Core",
  "type": "module",
  "workspaces": [
    "packages/*"
  ],
  "scripts": {
    "build": "npm run build --workspaces --if-present",
    "test": "npm run test --workspaces --if-present",
    "dev": "npm run dev --workspaces --if-present",
    "clean": "npm run clean --workspaces --if-present",
    "lint": "npm run lint --workspaces --if-present"
  },
  "devDependencies": {},
  "engines": {
    "node": ">=18.0.0"
  }
}
EOF

# Create packages directory structure
echo -e "${COLOR_GREEN}→${COLOR_RESET} Creating packages/ structure..."
mkdir -p packages/{core,components,cli,devtools,react-adapter,components-types,core-types}

# Simulate @larcjs/core
echo -e "${COLOR_GREEN}→${COLOR_RESET} Setting up @larcjs/core..."
cat > packages/core/package.json << 'EOF'
{
  "name": "@larcjs/core",
  "version": "1.1.1",
  "description": "LARC Core - PAN messaging bus",
  "type": "module",
  "main": "./src/index.js",
  "exports": {
    ".": "./src/pan.mjs"
  },
  "scripts": {
    "build": "echo 'Building core...'",
    "test": "echo 'Testing core...'"
  },
  "keywords": ["pan", "larc", "message-bus"]
}
EOF

mkdir -p packages/core/src
cat > packages/core/src/pan.mjs << 'EOF'
// LARC Core - PAN Bus
export class PANBus {
  constructor() {
    console.log('PANBus initialized');
  }
}

export default PANBus;
EOF

# Simulate @larcjs/components
echo -e "${COLOR_GREEN}→${COLOR_RESET} Setting up @larcjs/components..."
cat > packages/components/package.json << 'EOF'
{
  "name": "@larcjs/components",
  "version": "1.1.1",
  "description": "LARC Components - UI web components",
  "type": "module",
  "main": "./src/index.js",
  "dependencies": {
    "@larcjs/core": "workspace:*"
  },
  "peerDependencies": {
    "@larcjs/core": "^1.1.0"
  },
  "scripts": {
    "build": "echo 'Building components...'",
    "test": "echo 'Testing components...'"
  }
}
EOF

mkdir -p packages/components/src
cat > packages/components/src/index.js << 'EOF'
// LARC Components
import { PANBus } from '@larcjs/core';

export class DataTable {
  constructor() {
    this.bus = new PANBus();
    console.log('DataTable initialized with PAN bus');
  }
}

export default DataTable;
EOF

# Create apps directory
echo -e "${COLOR_GREEN}→${COLOR_RESET} Setting up apps/..."
mkdir -p apps/contact-manager
cat > apps/contact-manager/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Contact Manager</title>
</head>
<body>
  <h1>Contact Manager Demo</h1>
  <p>Uses @larcjs/core and @larcjs/components</p>
  <script type="module">
    // In monorepo, can directly import from packages
    import { PANBus } from '../../packages/core/src/pan.mjs';
    import { DataTable } from '../../packages/components/src/index.js';

    const bus = new PANBus();
    const table = new DataTable();
  </script>
</body>
</html>
EOF

# Create README
cat > README.md << 'EOF'
# LARC Monorepo Test

This is a test setup to demonstrate the monorepo workflow.

## Quick Start

```bash
# Install dependencies (links packages automatically)
npm install

# Build all packages
npm run build

# Test all packages
npm run test

# Work on a package
cd packages/core
# Edit files...

# Changes are immediately available to other packages!
cd ../components
# Can use the updated core right away
```

## Workflow Comparison

### Old Way (Submodules) 😫
```bash
cd core
git checkout main
git pull
# edit files
git add .
git commit -m "Update core"
git push

cd ../meta-repo
git add core
git commit -m "Update core submodule"
git push

cd components
git checkout main
git pull
git submodule update
# Now can see core changes
```

### New Way (Monorepo) 😊
```bash
# Edit files in packages/core
# Edit files in packages/components (sees core changes immediately!)
git add packages/core packages/components
git commit -m "Add feature across core and components"
git push
# Done!
```

## Directory Structure

```
larc/
├── package.json          (workspace root)
├── packages/
│   ├── core/            (@larcjs/core)
│   ├── components/      (@larcjs/components)
│   ├── cli/             (@larcjs/cli)
│   └── ...
├── apps/
│   ├── contact-manager/
│   └── ...
└── examples/
```

## Benefits

✅ One `git clone`
✅ One `npm install`
✅ Atomic commits across packages
✅ No detached HEAD
✅ Fast development iteration
✅ Easy for contributors
✅ Simpler CI/CD

## Publishing

Packages can still be published to npm independently:

```bash
cd packages/core
npm publish

cd ../components
npm publish
```

Or use changesets for coordinated releases:

```bash
npx changeset
npx changeset version
npx changeset publish
```
EOF

# Initial commit
git add .
git commit -m "Initial monorepo setup"

echo ""
echo -e "${COLOR_GREEN}✅ Test monorepo created!${COLOR_RESET}"
echo ""
echo -e "${COLOR_BLUE}═══════════════════════════════════════${COLOR_RESET}"
echo -e "${COLOR_BLUE}Test it out:${COLOR_RESET}"
echo ""
echo -e "  ${COLOR_YELLOW}cd $TEST_DIR${COLOR_RESET}"
echo -e "  ${COLOR_YELLOW}npm install${COLOR_RESET}"
echo -e "  ${COLOR_YELLOW}npm run build${COLOR_RESET}"
echo ""
echo "Try editing files in packages/core and packages/components"
echo "See how they work together without submodule complexity!"
echo ""
echo -e "${COLOR_BLUE}═══════════════════════════════════════${COLOR_RESET}"
echo ""
echo "Compare the workflows:"
echo ""
echo "  📂 Monorepo test: $PWD/$TEST_DIR"
echo "  📂 Current setup: $PWD"
echo ""
echo "When you're done testing:"
echo "  rm -rf $TEST_DIR"
echo ""
