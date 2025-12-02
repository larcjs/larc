# LARC Component Registry

The official registry for LARC web components. Browse, discover, and share components built for the LARC framework.

## 🌟 Features

- **Searchable Directory**: Find components by category, tags, or keywords
- **Quality Verified**: Components reviewed and verified by the LARC team
- **Try Before Install**: Test components directly in the playground
- **NPM Integration**: All components available via npm
- **CDN Ready**: Use components directly from CDN without build steps

## 📦 Browse Components

Visit [larcjs.com/components](https://larcjs.com/components) to browse the full registry.

### Categories

- 🧭 **Routing & Navigation** - Client-side routing solutions
- 💾 **State Management** - Data persistence and state handling
- 📝 **Forms & Input** - Form handling and validation
- 🔌 **Data & Connectivity** - API integration and data fetching
- 🎨 **UI Components** - Interface building blocks
- 📄 **Content & Media** - Content display and editing
- 🔐 **Authentication** - Security and authentication
- 🎭 **Theming** - Theme management
- 🔧 **Developer Tools** - Debugging utilities
- ⚙️ **Advanced** - Advanced functionality

## 🚀 Quick Start

### Using a Component

```bash
# Install from npm
npm install @larcjs/ui

# Or use from CDN
```

```html
<script type="importmap">
{
  "imports": {
    "@larcjs/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@latest/dist/index.js"
  }
}
</script>

<script type="module">
  import '@larcjs/ui/pan-card';
</script>

<pan-card header="Hello World">
  Your content here
</pan-card>
```

### Using the CLI

```bash
# Create a new LARC app
npx create-larc-app my-app

# Add a component
cd my-app
npx larc add @username/component-name

# Generate a new component
npx larc generate component my-widget
```

## 🤝 Contributing a Component

We welcome community contributions! Here's how to add your component to the registry:

### Prerequisites

1. **Publish to npm** - Your component must be available on npm
2. **Follow LARC conventions** - Use PAN bus for communication
3. **Include documentation** - README with examples
4. **Add tests** (recommended) - Improves quality score

### Submission Process

1. **Fork this repository**

2. **Create a component entry** in `components/your-component.json`:

```json
{
  "name": "your-component",
  "displayName": "Your Component",
  "description": "Brief description of what it does",
  "category": "ui",
  "npm": {
    "package": "@username/your-component",
    "version": "1.0.0",
    "url": "https://www.npmjs.com/package/@username/your-component"
  },
  "repository": {
    "type": "github",
    "url": "https://github.com/username/your-component"
  },
  "demo": "https://username.github.io/your-component",
  "icon": "🎨",
  "tags": ["ui", "widget"],
  "status": "stable",
  "author": {
    "name": "Your Name",
    "github": "username"
  },
  "license": "MIT",
  "panTopics": ["widget:*"],
  "attributes": [
    {
      "name": "color",
      "type": "string",
      "default": "blue",
      "description": "Widget color",
      "required": false
    }
  ]
}
```

3. **Submit a Pull Request**

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines.

## 📋 Component Requirements

### Required
- ✅ Published on npm
- ✅ Valid component name (kebab-case with at least one hyphen)
- ✅ Basic documentation
- ✅ MIT-compatible license
- ✅ Follows web component standards

### Recommended (for better quality score)
- ⭐ TypeScript definitions
- ⭐ Unit tests
- ⭐ Live demo
- ⭐ Usage examples
- ⭐ PAN bus integration

## 🏆 Quality Badges

Components receive quality scores based on:

- **A Grade**: Tests, types, docs, examples, verified
- **B Grade**: Types, docs, examples
- **C Grade**: Basic docs
- **D Grade**: Minimal docs
- **F Grade**: No docs

## 🔍 Verification

The LARC team reviews submitted components for:

- ✅ Security (no malicious code)
- ✅ Standards compliance (proper web component implementation)
- ✅ PAN bus usage (correct topic patterns)
- ✅ Documentation quality
- ✅ Code quality

Verified components get a ✓ badge in the registry.

## 📊 Statistics

Components with npm packages get automatic stats:

- Monthly downloads
- GitHub stars
- Last updated date
- Bundle size

## 🛠️ Development

### Building the Registry

```bash
# Install dependencies
npm install

# Generate registry from component files
npm run build

# Validate registry
npm run validate

# Run tests
npm test
```

### Local Preview

```bash
# Start registry browser locally
npm run dev

# Open http://localhost:3000
```

## 📚 Documentation

- [Submission Guidelines](./docs/SUBMISSION_GUIDELINES.md)
- [Component Standards](./docs/COMPONENT_STANDARDS.md)
- [Quality Criteria](./docs/QUALITY_CRITERIA.md)
- [API Reference](./docs/API_REFERENCE.md)

## 🔗 Links

- [LARC Framework](https://github.com/larcjs/larc)
- [Component Playground](https://larcjs.com/playground)
- [Documentation](https://larcjs.com/docs)
- [Discord Community](https://discord.gg/larc)

## 📄 License

MIT License - see [LICENSE](./LICENSE) for details

## 🙏 Credits

Built with ❤️ by the LARC community.

Special thanks to all [contributors](./CONTRIBUTORS.md)!
