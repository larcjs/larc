# LARC Playground

Interactive component explorer and testing tool for the LARC framework.

## Features

- **Component Palette**: Browse 49+ components organized by category
- **Live Preview**: See components render in real-time
- **Properties Panel**: Edit component attributes dynamically
- **Code Export**: Generate clean HTML from your designs
- **PAN Bus Monitor**: Visualize message flow between components
- **Zero Build**: Runs directly in the browser, no compilation needed

## Quick Start

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/larcjs/larc.git
   cd larc/playground
   ```

2. Serve with any static file server:
   ```bash
   # Using Python
   python3 -m http.server 8080

   # Using Node.js http-server
   npx http-server -p 8080

   # Using PHP
   php -S localhost:8080
   ```

3. Open http://localhost:8080 in your browser

### Online Demo

Visit the live playground at: https://larcjs.com/playground/

## Usage

1. **Browse Components**: Use the left sidebar to explore available components by category
2. **Search**: Type in the search box to filter components by name or description
3. **Add to Canvas**: Click any component to add it to the canvas
4. **Edit Properties**: Select a component to see and edit its attributes in the right panel
5. **View Code**: Click "View Code" to see the generated HTML
6. **Monitor Messages**: Click "PAN Monitor" to watch PAN bus messages

## Component Categories

- 🧭 **Routing & Navigation** - Client-side routing
- 💾 **State Management** - Data persistence and state
- 📝 **Forms & Input** - Form handling and validation
- 🔌 **Data & Connectivity** - API integration and data fetching
- 🎨 **UI Components** - Interface building blocks
- 📄 **Content & Media** - Content display and editing
- 🔐 **Authentication** - Security and auth
- 🎭 **Theming** - Theme management
- 🔧 **Developer Tools** - Debugging utilities
- ⚙️ **Advanced** - Advanced functionality

## Architecture

```
playground/
├── index.html              # Main page
├── playground.mjs          # Entry point
├── component-registry.json # Component metadata
├── components/             # Playground components
│   ├── pg-palette.mjs     # Component browser
│   ├── pg-canvas.mjs      # Live preview
│   ├── pg-properties.mjs  # Property editor
│   ├── pg-exporter.mjs    # Code generator
│   └── pg-bus-monitor.mjs # Message visualizer
├── styles/
│   └── playground.css     # Styling
└── scripts/
    └── generate-registry.mjs  # Registry generator
```

## Regenerating Component Registry

The component registry is auto-generated from component source files:

```bash
node scripts/generate-registry.mjs
```

This scans all components in `../components/` and extracts:
- Component names and descriptions
- Attributes from `observedAttributes`
- Categories and icons
- Metadata for the playground

## Development

### Adding New Components

1. Add your component to `/components/`
2. Regenerate the registry: `node scripts/generate-registry.mjs`
3. Add category mapping in `generate-registry.mjs` if needed
4. Optionally add an icon mapping

### Customizing Categories

Edit `CATEGORIES` and `COMPONENT_CATEGORIES` in `scripts/generate-registry.mjs`:

```javascript
const CATEGORIES = [
  { id: 'custom', name: 'Custom Components', icon: '✨' }
];

const COMPONENT_CATEGORIES = {
  'my-component': 'custom'
};
```

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

Requires ES modules and Custom Elements support.

## License

MIT

## Related Packages

- [@larcjs/core](https://github.com/larcjs/core) - Core PAN bus implementation
- [@larcjs/ui](https://github.com/larcjs/components) - Component library
- [@larcjs/core-types](https://github.com/larcjs/core-types) - TypeScript types
- [@larcjs/ui-types](https://github.com/larcjs/components-types) - Component types
