# LARC VS Code Extension

Official Visual Studio Code extension for the LARC framework.

## Features

### Code Snippets

- **Component boilerplate** - Type `larc-component` to create a full web component
- **PAN bus integration** - Type `larc-pan-component` for PAN-enabled components
- **PAN utilities** - Quick snippets for `pan-subscribe` and `pan-publish`
- **Import maps** - Type `larc-importmap` for import map setup
- **HTML elements** - Quick insertion of LARC components in HTML

### Commands

- **LARC: New Component** - Interactive component generation
- **LARC: Add Component from Registry** - Browse and add components from the registry
- **LARC: View Documentation** - Open LARC documentation

### IntelliSense

- Auto-completion for component names
- Component descriptions in hover tooltips
- Registry-powered suggestions

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (or `Cmd+Shift+X` on Mac)
3. Search for "LARC"
4. Click Install

### From VSIX

```bash
code --install-extension larc-vscode-1.0.0.vsix
```

## Usage

### Creating a Component

1. Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
2. Type "LARC: New Component"
3. Enter component name (kebab-case)
4. Component file is created and opened

Or use the snippet:

```javascript
// Type 'larc-component' and press Tab
```

### Adding from Registry

1. Open Command Palette
2. Type "LARC: Add Component from Registry"
3. Select a component from the list
4. Component is added to your project

### Code Snippets

#### JavaScript

| Trigger | Description |
|---------|-------------|
| `larc-component` | Full web component boilerplate |
| `larc-pan-component` | Component with PAN bus integration |
| `pan-subscribe` | Subscribe to PAN bus topic |
| `pan-publish` | Publish to PAN bus topic |
| `import-larc` | Import LARC core utilities |

#### HTML

| Trigger | Description |
|---------|-------------|
| `larc-importmap` | Import map script tag |
| `larc-import` | Module script tag |
| `pan-bus` | PAN bus element |
| `larc-comp` | Generic LARC component element |

## Settings

Configure the extension in your VS Code settings:

```json
{
  "larc.autoImport": true,
  "larc.snippetsEnabled": true,
  "larc.registryUrl": "https://raw.githubusercontent.com/larcjs/registry/main/registry.json"
}
```

### Available Settings

- **`larc.autoImport`** - Automatically add imports for LARC components (default: `true`)
- **`larc.snippetsEnabled`** - Enable LARC code snippets (default: `true`)
- **`larc.registryUrl`** - URL to the LARC component registry

## Requirements

- Visual Studio Code 1.80.0 or higher
- Node.js 18+ (for CLI commands)

## Example Workflow

1. Create a new LARC project:
   ```bash
   npx create-larc-app my-app
   code my-app
   ```

2. Use Command Palette to add a component from registry:
   - `Ctrl+Shift+P` → "LARC: Add Component from Registry"

3. Generate a custom component:
   - `Ctrl+Shift+P` → "LARC: New Component"

4. Use snippets for quick coding:
   - Type `larc-component` and press Tab
   - Type `pan-subscribe` for PAN bus subscriptions

## Known Issues

- Registry loading may take a few seconds on first activation
- Auto-completion works best with JavaScript and HTML files

## Release Notes

### 1.0.0

- Initial release
- Component snippets
- Registry integration
- Commands for component generation
- IntelliSense support

## Contributing

See [CONTRIBUTING.md](https://github.com/larcjs/vscode-extension/blob/main/CONTRIBUTING.md)

## License

MIT

## Links

- [LARC Framework](https://github.com/larcjs/larc)
- [Component Registry](https://larcjs.com/components)
- [Documentation](https://larcjs.com/docs)
- [Issues](https://github.com/larcjs/vscode-extension/issues)
