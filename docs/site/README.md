# LARC Site

[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Website](https://img.shields.io/badge/website-live-brightgreen.svg)](https://larcjs.com/)

> **Official documentation website** and showcase for the LARC/PAN ecosystem

The central hub for LARC documentation, guides, API references, and interactive demos.

🌐 **Live Site:** [https://larcjs.com/](https://larcjs.com/)

---

## 📚 What's Inside

### Documentation
- **Getting Started Guide** — Quick introduction to LARC/PAN
- **API Reference** — Complete API documentation
- **Topic Conventions** — Message pattern guidelines
- **Architecture Guide** — System design and patterns
- **Security Best Practices** — Secure application development
- **Migration Guides** — Upgrade paths and breaking changes

### Interactive Pages
- **Component Gallery** — Visual showcase of all UI components
- **Demo Applications** — Full-featured app examples
- **Examples Index** — Categorized example browser
- **Component Registry** — Searchable component catalog
- **Theme Showcase** — Theming capabilities demonstration

### Resources
- **Roadmap** — Future plans and version goals
- **Changelog** — Version history and updates
- **Contributing Guide** — How to contribute
- **FAQ** — Frequently asked questions

---

## 🚀 Local Development

### Prerequisites
- Node.js 16+ (for build scripts)
- Python 3 (for local server, or use any alternative)

### Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/larcjs/site.git
   cd site
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Build documentation:**
   ```bash
   npm run build
   ```

4. **Start development server:**
   ```bash
   npm run dev
   # or
   npm run serve
   ```

5. **Open in browser:**
   ```
   http://localhost:8000
   ```

---

## 📝 Building Documentation

### Build All
```bash
npm run build
```

This runs both markdown rendering and API documentation generation.

### Build Markdown Docs Only
```bash
npm run build:docs
```

Processes Markdown files from `/docs` into HTML pages.

### Build API Docs Only
```bash
npm run build:api
```

Generates API reference from source code comments.

---

## 📂 Repository Structure

```
site/
├── index.html              # Homepage
├── docs/                   # Source documentation (Markdown)
│   ├── API_REFERENCE.md
│   ├── LARC_SPEC.v0.md
│   ├── USAGE.md
│   ├── THEME_SYSTEM.md
│   ├── MIGRATION_*.md
│   └── ...
│
├── gallery.html            # Component showcase
├── demo.html               # Interactive demos
├── examples.html           # Examples browser
├── apps.html               # Demo applications
├── conformance/            # Conformance testing
├── registry/               # Component registry
│
├── assets/                 # Styles, images, scripts
│   ├── styles.css
│   ├── theme.css
│   └── logo.svg
│
├── render-markdown.mjs     # Build script: MD → HTML
├── generate-docs.mjs       # Build script: Code → API docs
└── package.json
```

---

## 🎨 Adding New Documentation

### Create a New Doc Page

1. **Create Markdown file:**
   ```bash
   echo "# My New Guide" > docs/MY_GUIDE.md
   ```

2. **Write content:**
   ```markdown
   # My New Guide

   Introduction to...

   ## Section 1
   Content...
   ```

3. **Build:**
   ```bash
   npm run build:docs
   ```

4. **Link from site:**
   Edit `index.html` or relevant page to add link:
   ```html
   <a href="docs/MY_GUIDE.html">My Guide</a>
   ```

### Update API Documentation

API docs are auto-generated from code comments:

1. **Add JSDoc comments** to source code in other repos
2. **Run generation:**
   ```bash
   npm run build:api
   ```
3. **Commit generated files**

---

## 🌐 Deployment

### GitHub Pages (Automatic)

The site auto-deploys to GitHub Pages on push to `main`:

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Build
        run: npm ci && npm run build
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### Manual Deployment

Build and deploy manually:

```bash
# Build
npm run build

# Deploy to your hosting
# (copy files to web server)
rsync -avz --delete . user@server:/var/www/site/
```

---

## 🔗 Cross-Repository Links

The site links to other LARC repositories:

- **[@larcjs/core](https://github.com/larcjs/core)** — Core implementation
- **[@larcjs/ui](https://github.com/larcjs/components)** — UI components
- **[@larcjs/examples](https://github.com/larcjs/examples)** — Examples & demos
- **[@larcjs/devtools](https://github.com/larcjs/devtools)** — DevTools extension

Ensure links stay updated when repo structure changes.

---

## 📋 Content Guidelines

### Documentation Standards

- **Clear structure** — Use headings, lists, code blocks
- **Examples** — Include code examples for concepts
- **Links** — Cross-reference related docs
- **Up-to-date** — Keep in sync with code changes

### Code Examples

Use triple backticks with language:

```html
<!DOCTYPE html>
<html>
  <head>
    <script type="module" src="https://unpkg.com/@larcjs/core@3.0.2/src/pan.js"></script>
  </head>
  <body>
    <pan-bus></pan-bus>
  </body>
</html>
```

### Images

Place images in `assets/`:

```markdown
![Component Gallery](assets/gallery-screenshot.png)
```

---

## 🧪 Testing

### Test Links
```bash
# Check for broken links
npm run test:links
```

### Test Build
```bash
# Ensure build succeeds
npm run build
```

### Visual Testing
```bash
# Open in browser and verify
npm run serve
```

---

## 🎯 Key Pages

### Homepage (`index.html`)
- LARC overview
- Quick start guide
- Feature highlights
- Links to packages

### Gallery (`gallery.html`)
- Visual showcase of all components
- Interactive demos
- Live code examples

### API Reference (`docs/API_REFERENCE.html`)
- Complete API documentation
- Method signatures
- Usage examples

### Examples Browser (`examples.html`)
- Categorized examples
- Difficulty levels
- Search/filter

---

## 🛠️ Customization

### Styling

Edit `assets/theme.css` for global styles:

```css
:root {
  --primary-color: #007bff;
  --font-family: system-ui, sans-serif;
}
```

### Layout

Templates are in the root HTML files. Modify:
- `index.html` — Homepage layout
- `gallery.html` — Gallery layout
- etc.

### Build Scripts

Customize build process:
- `render-markdown.mjs` — Markdown processing
- `generate-docs.mjs` — API doc generation

---

## 📄 License

MIT © Chris Robison

---

## 🆘 Support

- 💬 [Discussions](https://github.com/larcjs/site/discussions)
- 🐛 [Issue Tracker](https://github.com/larcjs/site/issues)

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build
5. Submit a pull request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

**The central hub for all things LARC!** 📖✨
