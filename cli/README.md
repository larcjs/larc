# create-larc-app

Official CLI tool for creating and managing LARC applications.

## Quick Start

```bash
# Create a new LARC app
npx create-larc-app my-app

# Or with options
npx create-larc-app my-app --template=dashboard --yes
```

## Features

- 🚀 **Zero Config** - No build step required
- 📦 **Template System** - Start with pre-built templates
- 🔥 **Hot Reload** - Development server with live updates
- 🎨 **Component Generator** - Scaffold new components quickly
- 📚 **Registry Integration** - Add components from the LARC registry

## Commands

### create-larc-app

Create a new LARC application:

```bash
npx create-larc-app <project-directory> [options]
```

**Options:**
- `-t, --template <template>` - Template to use (minimal, dashboard, blog)
- `-y, --yes` - Skip prompts and use defaults
- `--no-install` - Skip npm install
- `--no-git` - Skip git initialization

**Examples:**

```bash
# Interactive mode
npx create-larc-app my-app

# With template
npx create-larc-app my-dashboard --template=dashboard

# Skip prompts
npx create-larc-app my-app --yes
```

### larc dev

Start development server:

```bash
larc dev [options]
```

**Options:**
- `-p, --port <port>` - Port number (default: 3000)
- `--no-open` - Don't open browser
- `--no-hot` - Disable hot module reload

**Example:**

```bash
larc dev --port=8080
```

### larc add

Add a component from the registry:

```bash
larc add <component> [options]
```

**Options:**
- `-y, --yes` - Skip confirmation

**Examples:**

```bash
# Interactive
larc add pan-card

# Skip confirmation
larc add @larcjs/ui --yes

# By npm package
larc add @username/my-component
```

### larc generate

Generate boilerplate code:

```bash
larc generate <type> <name> [options]
```

**Alias:** `larc g`

**Options:**
- `-d, --dir <directory>` - Output directory (default: src/components)

**Examples:**

```bash
# Generate a component
larc generate component my-widget

# Generate in custom directory
larc g component my-widget --dir=src/widgets
```

### larc preview

Preview production build:

```bash
larc preview [options]
```

**Options:**
- `-p, --port <port>` - Port number (default: 4000)

## Project Structure

```
my-app/
├── index.html          # Entry point
├── src/
│   ├── app.js         # Main application
│   └── components/    # Custom components
├── public/
│   ├── styles.css    # Global styles
│   └── assets/       # Static assets
├── larc.config.json  # LARC configuration
├── package.json
└── README.md
```

## larc.config.json

Configuration file for LARC projects:

```json
{
  "version": "1.0.0",
  "importmap": {
    "imports": {
      "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@latest/dist/index.js",
      "@larcjs/ui": "https://cdn.jsdelivr.net/npm/@larcjs/ui@latest/dist/index.js"
    }
  },
  "devServer": {
    "port": 3000,
    "hot": true,
    "open": true
  }
}
```

## Templates

### minimal

Basic starter with essential structure:
- Clean HTML/CSS/JS setup
- Import map configuration
- Example component structure

### dashboard

Admin dashboard starter:
- Pre-built layout with sidebar
- Navigation components
- Data table examples
- Chart integration

### blog

Blog/content site starter:
- Article layout
- Markdown rendering
- Routing setup
- Content components

## Development Workflow

1. **Create project:**
   ```bash
   npx create-larc-app my-app
   cd my-app
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Add components:**
   ```bash
   larc add pan-card
   ```

4. **Generate custom components:**
   ```bash
   larc generate component my-widget
   ```

5. **Build for production:**
   ```bash
   # No build needed! Just deploy your files
   ```

## Hot Module Reload

The dev server includes hot reload:

- Watches `src/`, `public/`, and HTML files
- Auto-refreshes on changes
- SSE-based communication
- Zero configuration

## Import Maps

LARC uses native import maps for dependency management:

```html
<script type="importmap">
{
  "imports": {
    "@larcjs/core": "https://cdn.jsdelivr.net/npm/@larcjs/core@latest/dist/index.js"
  }
}
</script>
```

Managed automatically via `larc.config.json`.

## No Build Step

LARC embraces the no-build philosophy:

- Native ES modules
- Import maps for dependencies
- Direct CDN usage
- Browser-native features

## Requirements

- Node.js 18+
- Modern browser with:
  - ES Modules support
  - Import Maps support
  - Custom Elements support

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT

## Links

- [LARC Framework](https://github.com/larcjs/larc)
- [Component Registry](https://larcjs.com/components)
- [Documentation](https://larcjs.com/docs)
- [Playground](https://larcjs.com/playground)
