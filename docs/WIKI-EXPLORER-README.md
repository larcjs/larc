# 📚 LARC Wiki Explorer

A beautiful, interactive documentation browser built with LARC components. Browse all markdown, HTML, and PDF files in the repository with an intuitive tree navigation and rich content viewer.

## Features

- **🌳 Tree Navigation**: Hierarchical file browser with expandable folders using `pan-tree` component
- **📝 Markdown Rendering**: Beautiful rendering of markdown documents using `pan-markdown-renderer` component
- **🔍 Quick Search**: Filter files by name in real-time
- **📄 Multiple Formats**: View .md, .html, and .pdf files
- **📊 Statistics**: See folder count, file count, and total size at a glance

## Quick Start

### 1. Generate the File Tree

First, generate the JSON file tree of all documentation files:

```bash
cd /Users/cdr/Projects/larc-repos/docs
node generate-file-tree.mjs
```

This will create `file-tree.json` containing all markdown, HTML, and PDF files in the docs directory.

### 2. Open the Wiki Explorer

Open `wiki-explorer.html` in your browser:

```bash
open wiki-explorer.html
```

Or serve it with a local HTTP server:

```bash
python3 -m http.server 8000
# Then visit http://localhost:8000/wiki-explorer.html
```

## Usage

1. **Browse Files**: Click on folders in the left sidebar to expand/collapse them
2. **View Content**: Click on any file to view its contents in the main panel
3. **Search**: Type in the search box to filter files by name
4. **Navigate**: Use the breadcrumb trail to see the current file path

## File Types

- **📝 Markdown (.md)**: Rendered with syntax highlighting and proper formatting
- **🌐 HTML (.html)**: Displayed in an embedded iframe
- **📕 PDF (.pdf)**: Embedded PDF viewer
- **📄 Other**: Raw text display

## Components Used

This demo showcases the following LARC components:

- **`<pan-tree>`**: Collapsible tree component with navigation
- **`<pan-markdown-renderer>`**: Markdown to HTML renderer with syntax highlighting
- **`<pan-bus>`**: Message bus for component communication
- **`PanClient`**: JavaScript client for publishing/subscribing to messages

## Architecture

The wiki explorer uses LARC's event-driven architecture:

1. **File Tree Data**: Generated JSON structure of all files
2. **Tree Component**: Displays the file tree and publishes selection events
3. **Content Viewer**: Subscribes to selection events and loads/displays files
4. **Search**: Filters tree data dynamically

## Customization

### Changing Scanned Extensions

Edit `generate-file-tree.mjs`:

```javascript
const EXTENSIONS = ['.md', '.html', '.pdf', '.txt']; // Add more extensions
```

### Styling

All styles are in `wiki-explorer.html`. Key CSS variables:

- Tree icons can be customized via `icon-open`, `icon-closed`, `icon-leaf` attributes
- Colors can be adjusted in the header gradient and tree selection styles

### Search Behavior

The search filter works on file names. To search content, modify the `searchInput` event handler to include content search.

## File Tree Structure

The generated `file-tree.json` has this structure:

```json
{
  "metadata": {
    "generated": "ISO date",
    "root": "/path/to/docs",
    "extensions": [".md", ".html", ".pdf"],
    "stats": {
      "folders": 43,
      "files": 287,
      "totalSize": 18135302,
      "totalSizeFormatted": "17.3 MB"
    }
  },
  "tree": [
    {
      "id": "unique-id",
      "name": "File Name",
      "type": "file" | "folder",
      "path": "relative/path/to/file.md",
      "extension": ".md",
      "size": 1234,
      "modified": "ISO date",
      "children": []
    }
  ]
}
```

## Regenerating the File Tree

Run the generator script whenever you add/remove/move files:

```bash
node generate-file-tree.mjs
```

The script will:
- Scan all subdirectories (excluding `node_modules`, `.git`, etc.)
- Find all files with specified extensions
- Generate a hierarchical tree structure
- Output statistics
- Save to `file-tree.json`

## Development

To extend the wiki explorer:

1. **Add new file type viewers**: Modify the `loadFile()` function
2. **Add more tree features**: Use pan-tree's built-in editing/drag-drop features
3. **Add bookmarks**: Use localStorage to save favorite files
4. **Add history**: Track recently viewed files
5. **Add themes**: Create light/dark mode toggle

## Browser Compatibility

Works in all modern browsers that support:
- ES6 Modules
- Web Components (Custom Elements)
- Shadow DOM
- Fetch API

## License

Part of the LARC project.
