# Contributing to LARC

Thank you for your interest in contributing to LARC! We welcome contributions from the community.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Repository Structure](#repository-structure)
- [Development Workflow](#development-workflow)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Community](#community)

---

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

---

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- Git
- A modern web browser (Chrome, Firefox, Safari, or Edge)

### Setting Up the Development Environment

1. **Clone the repository:**
   ```bash
   git clone https://github.com/larcjs/larc.git
   cd larc
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the setup script (optional):**
   ```bash
   ./setup.sh      # Mac/Linux
   # OR
   setup.bat       # Windows
   ```

4. **Start a local server:**
   ```bash
   python3 -m http.server 8000
   # OR
   npx serve
   ```

5. **Test the setup:**
   - Open http://localhost:8000/test-config.html
   - Open http://localhost:8000/playground/

---

## Repository Structure

LARC is organized as an **npm workspaces monorepo**:

```
larc/
├── packages/                      # Published packages (npm workspaces)
│   ├── core/                      # @larcjs/core
│   ├── components/                # @larcjs/components
│   ├── core-lite/                 # @larcjs/core-lite
│   ├── core-routing/              # @larcjs/core-routing
│   ├── core-debug/                # @larcjs/core-debug
│   ├── core-types/                # @larcjs/core-types
│   ├── components-types/          # @larcjs/components-types
│   ├── apps/                      # Demo applications
│   ├── examples/                  # Code examples
│   └── devtools/                  # Chrome DevTools extension
├── cli/                           # create-larc-app CLI
├── react-adapter/                 # React integration
├── registry/                      # Component registry
├── vscode-extension/              # VS Code extension
├── docs/                          # Documentation & guides
└── playground/                    # Interactive component explorer
```

### Where to Contribute

All packages are in this monorepo. Choose the appropriate directory based on your contribution:

| Contribution Type | Directory |
|------------------|-----------|
| Core messaging bus, autoloader | `packages/core/` |
| TypeScript types for core | `packages/core-types/` |
| UI components | `packages/components/` |
| TypeScript types for components | `packages/components-types/` |
| Example applications | `packages/examples/` |
| Documentation website | `docs/site/` |
| DevTools extension | `packages/devtools/` |
| CLI tool | `cli/` |
| React adapter | `react-adapter/` |
| Playground, config, docs | Root directory |

---

## Development Workflow

### 1. Fork and Branch

```bash
# Fork the appropriate repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/REPO_NAME.git
cd REPO_NAME
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Write clear, concise code
- Follow the existing code style
- Add tests for new features
- Update documentation as needed

### 3. Test Your Changes

**For core package:**
```bash
cd core
npm install
npm test
```

**For UI components:**
```bash
cd ui
npm install
npm test
```

**For examples:**
- Test in multiple browsers
- Verify all links work
- Check mobile responsiveness

### 4. Commit Your Changes

Follow conventional commit format:

```bash
git commit -m "feat: add new pan-wizard component"
git commit -m "fix: resolve memory leak in pan-bus"
git commit -m "docs: update API reference for pan-client"
git commit -m "test: add tests for message routing"
```

**Commit message format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `style:` - Code style changes (formatting, no logic change)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

---

## Version Management & Changesets

We use [Changesets](https://github.com/changesets/changesets) for managing versions and publishing packages. If your contribution changes functionality or fixes bugs in a published package, you need to create a changeset.

### When to Create a Changeset

Create a changeset if your PR:
- Adds a new feature
- Fixes a bug
- Makes breaking changes
- Updates dependencies that affect functionality

**Don't create a changeset for:**
- Documentation-only changes
- Internal refactoring without behavior changes
- Example updates
- Test additions

### How to Create a Changeset

1. **Run the changeset command:**
   ```bash
   npm run changeset
   ```

2. **Select packages** that your changes affect (use spacebar to select)

3. **Choose the change type:**
   - `major` - Breaking changes (bumps to next major version)
   - `minor` - New features (bumps to next minor version)
   - `patch` - Bug fixes (bumps to next patch version)

4. **Write a summary** describing your changes (this becomes the changelog entry)

5. **Commit the changeset** with your changes:
   ```bash
   git add .changeset
   git commit -m "feat: add new feature with changeset"
   ```

### Example Changeset Workflow

```bash
# Make your changes
vim packages/core/src/pan-bus.mjs

# Create a changeset
npm run changeset
# Select: @larcjs/core
# Type: minor (new feature)
# Summary: "Add support for wildcard message subscriptions"

# Commit everything together
git add packages/core .changeset
git commit -m "feat(core): add wildcard subscriptions"
git push
```

### Automated Release Process

When your PR with a changeset is merged:
1. GitHub Action creates a "Version Packages" PR
2. Maintainers review and merge the version PR
3. Packages are automatically published to npm
4. Changelog is automatically updated

---

## Pull Request Process

### Before Submitting

- [ ] All tests pass locally
- [ ] Code follows project style guidelines
- [ ] Documentation is updated
- [ ] Commit messages are clear and follow conventions
- [ ] No console.log statements left in code
- [ ] TypeScript types are updated (if applicable)

### Submitting a PR

1. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```

2. **Create a Pull Request on GitHub:**
   - Use a clear, descriptive title
   - Reference any related issues (#123)
   - Describe what changed and why
   - Include screenshots for UI changes
   - List any breaking changes

3. **PR Template:**
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tests pass locally
   - [ ] Tested in Chrome
   - [ ] Tested in Firefox
   - [ ] Tested in Safari
   - [ ] Tested on mobile

   ## Related Issues
   Fixes #123

   ## Screenshots (if applicable)
   ```

### Review Process

- Maintainers will review your PR within 1-3 business days
- Address any requested changes
- Once approved, a maintainer will merge your PR
- Your contribution will be included in the next release

---

## Coding Standards

### JavaScript/ES Modules

- Use ES modules (`.mjs` extension for core files)
- Use modern JavaScript (ES2020+)
- Avoid dependencies when possible
- Prefer `const` over `let`, avoid `var`
- Use arrow functions for callbacks
- Use template literals for strings

**Example:**
```javascript
// Good
const client = new PanClient();
const message = { topic: 'user.updated', data: { id: 123 } };
client.publish(message);

// Bad
var client = new PanClient();
var message = { topic: 'user.updated', data: { id: 123 } };
client.publish(message);
```

### Web Components

- Extend `HTMLElement`
- Use Shadow DOM for encapsulation
- Clean up subscriptions in `disconnectedCallback`
- Use descriptive attribute names
- Document all attributes and events

**Example:**
```javascript
class PanCard extends HTMLElement {
  connectedCallback() {
    this.attachShadow({ mode: 'open' });
    this.client = new PanClient(this);
    this.render();
  }

  disconnectedCallback() {
    this.client?.destroy();
  }

  render() {
    this.shadowRoot.innerHTML = `<div class="card">...</div>`;
  }
}
```

### CSS

- Use CSS custom properties for theming
- Follow BEM naming conventions
- Keep specificity low
- Mobile-first responsive design

### TypeScript

- Keep type definitions in separate repos
- Export all public types
- Use JSDoc for documentation
- Avoid `any` type

---

## Testing Guidelines

### Core Package Tests

- Use Playwright for browser testing
- Test across multiple browsers (Chromium, Firefox, WebKit)
- Cover edge cases and error conditions
- Test async behavior thoroughly

**Example test:**
```javascript
import { test, expect } from '@playwright/test';

test('should publish and deliver message', async ({ page }) => {
  await page.goto('/test.html');

  const result = await page.evaluate(() => {
    const client = new PanClient();
    return new Promise(resolve => {
      client.subscribe('test.topic', msg => resolve(msg));
      client.publish({ topic: 'test.topic', data: { value: 42 } });
    });
  });

  expect(result.data.value).toBe(42);
});
```

### UI Component Tests

- Test component rendering
- Test attribute changes
- Test PAN message handling
- Test accessibility (ARIA labels, keyboard navigation)

### Test Coverage

- Aim for 80%+ code coverage
- 100% coverage for critical paths
- All public APIs must be tested
- Edge cases and error handling must be tested

---

## Documentation

### Code Documentation

- Add JSDoc comments to all public APIs
- Include examples in JSDoc
- Document parameters, return values, and exceptions
- Keep comments up to date

**Example:**
```javascript
/**
 * Publishes a message to the PAN bus
 *
 * @param {Object} message - Message to publish
 * @param {string} message.topic - Topic name (e.g., 'user.updated')
 * @param {*} message.data - Message payload
 * @param {boolean} [message.retained=false] - Whether to retain message
 *
 * @returns {Promise<void>} Resolves when message is published
 *
 * @example
 * await client.publish({
 *   topic: 'user.updated',
 *   data: { id: 123, name: 'John' }
 * });
 */
async publish(message) {
  // Implementation
}
```

### Markdown Documentation

- Update relevant docs when changing APIs
- Include code examples
- Use clear headings and structure
- Add a table of contents for long documents

### Component Documentation

Every component should have:
- Description of purpose
- List of attributes
- List of events
- Usage examples
- Accessibility notes

---

## Community

### Getting Help

- 💬 [GitHub Discussions](https://github.com/larcjs/core/discussions) - Ask questions, share ideas
- 🐛 [GitHub Issues](https://github.com/larcjs/core/issues) - Report bugs
- 📖 [Documentation](https://larcjs.github.io/site/) - Read the docs

### Reporting Bugs

When reporting bugs, please include:

1. **Description:** Clear description of the issue
2. **Steps to Reproduce:** Numbered list of steps
3. **Expected Behavior:** What should happen
4. **Actual Behavior:** What actually happens
5. **Environment:**
   - Browser and version
   - LARC version
   - Operating system
6. **Code Sample:** Minimal reproducible example
7. **Screenshots:** If applicable

**Use this template:**
```markdown
**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Load page with pan-bus
2. Subscribe to topic
3. Publish message
4. See error

**Expected Behavior:**
Message should be delivered

**Actual Behavior:**
Error is thrown

**Environment:**
- Browser: Chrome 120
- LARC: v1.1.1
- OS: macOS 14

**Code Sample:**
\`\`\`javascript
const client = new PanClient();
client.subscribe('test', msg => console.log(msg));
\`\`\`

**Screenshots:**
[Attach if applicable]
```

### Suggesting Features

Before suggesting a feature:
- Check if it already exists
- Search existing issues and discussions
- Consider if it fits LARC's philosophy

When suggesting features:
- Explain the use case
- Provide examples
- Consider backward compatibility
- Be open to feedback

---

## Recognition

Contributors will be:
- Listed in release notes
- Added to CONTRIBUTORS.md (if you make substantial contributions)
- Credited in documentation (for significant docs contributions)

---

## Questions?

Feel free to:
- Open a [Discussion](https://github.com/larcjs/core/discussions)
- Comment on an existing issue
- Reach out to maintainers

**Thank you for contributing to LARC!** 🎉
