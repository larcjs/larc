# Chapter 23: UI Components

> "The best components are like good appliances: they do one thing well, fit perfectly into your existing setup, and you never have to think about how they work—until you need to, and then the manual is actually helpful."
>
> — A Developer Who's Read Too Many Component APIs

If LARC's PAN bus is the nervous system and custom components are the organs, then LARC's built-in UI components are the power tools in your workshop. They're purpose-built solutions for common UI patterns: file management, markdown editing, and content rendering. Each component is designed to work seamlessly with the PAN bus while remaining usable as a standalone web component.

This chapter provides comprehensive API documentation for three essential UI components: `pan-files`, `pan-markdown-editor`, and `pan-markdown-renderer`. These aren't just reference docs—you'll learn when to use each component, how to integrate them into your applications, and how to troubleshoot common issues.

## pan-files: File System Browser

The `pan-files` component provides a complete file browser interface backed by the browser's Origin Private File System (OPFS). It's designed for applications that need client-side file management without server storage.

### Overview and Purpose

`pan-files` is a file system manager that combines a visual file browser UI with programmatic file operations. It gives users a familiar folder-and-file interface while providing developers with a clean API for reading, writing, and managing files entirely in the browser.

Under the hood, `pan-files` uses OPFS, a browser-native storage API that provides fast, private file system access. Files stored in OPFS persist across sessions, survive page reloads, and remain sandboxed to your origin—they're never sent to a server unless you explicitly choose to do so.

Key features include:

- Visual file browser with icons and metadata
- File and folder creation, renaming, and deletion
- Real-time search and filtering
- Drag-and-drop support (UI ready, extensible)
- PAN bus integration for file events
- Programmatic API for file operations

### When to Use pan-files

**Use `pan-files` when:**

- Building offline-first applications that need local file storage
- Creating note-taking apps, code editors, or document managers
- You need client-side file persistence without backend infrastructure
- Building progressive web apps (PWAs) with file management features
- You want users to manage their own files privately in their browser

**Don't use `pan-files` when:**

- You need server-side file storage or sharing between users
- Files must be accessible from multiple devices (OPFS is device-specific)
- You need file system operations outside the browser (use Node.js fs module)
- Your files are large enough to approach storage quota limits
- You just need simple key-value storage (use localStorage or IndexedDB)

### Installation and Setup

Add the component to your HTML:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import '/path/to/pan-files.mjs';
  </script>
</head>
<body>
  <pan-files></pan-files>
</body>
</html>
```

The component automatically initializes OPFS when connected to the DOM. No additional configuration is required for basic usage.

### Attributes Reference

#### `path`
- **Type**: `String`
- **Default**: `'/'`
- **Description**: The current directory path to display. Currently, the component primarily operates at the root level, but this attribute is designed for future nested directory navigation.

```html
<pan-files path="/"></pan-files>
```

#### `filter`
- **Type**: `String`
- **Default**: `''` (empty string, no filtering)
- **Description**: Comma-separated list of file extensions to display. Only files matching these extensions will be shown. Directories are always visible.

```html
<!-- Show only markdown and text files -->
<pan-files filter=".md,.txt"></pan-files>
```

#### `show-hidden`
- **Type**: `Boolean` (as string)
- **Default**: `'false'`
- **Description**: Whether to display hidden files (files starting with a dot).

```html
<!-- Show hidden files -->
<pan-files show-hidden="true"></pan-files>
```

### Methods Reference

All methods are asynchronous and return Promises. Methods that manipulate files automatically trigger UI refreshes and publish PAN bus events.

#### `writeFile(path, content)`
Writes content to a file, creating it if it doesn't exist or overwriting it if it does.

- **Parameters**:

  - `path` (String): File path (e.g., '/notes.txt')
  - `content` (String): Content to write
- **Returns**: `Promise<void>`
- **Throws**: Error if write operation fails

```javascript
const files = document.querySelector('pan-files');
await files.writeFile('/hello.txt', 'Hello, World!');
```

#### `readFile(path)`
Reads the contents of a file as text.

- **Parameters**:

  - `path` (String): File path to read
- **Returns**: `Promise<String>` - File contents
- **Throws**: Error if file doesn't exist or read fails

```javascript
const files = document.querySelector('pan-files');
const content = await files.readFile('/hello.txt');
console.log(content); // "Hello, World!"
```

#### `deleteFile(path)`
Deletes a file and publishes a deletion event.

- **Parameters**:

  - `path` (String): File path to delete
- **Returns**: `Promise<void>`
- **Throws**: Error if deletion fails
- **Side Effects**: Publishes `file.deleted` event to PAN bus

```javascript
const files = document.querySelector('pan-files');
await files.deleteFile('/old-notes.txt');
```

#### `listFiles()`
Returns an array of all files in the current directory.

- **Parameters**: None
- **Returns**: `Promise<Array<FileInfo>>` - Array of file objects

Each `FileInfo` object contains:
```javascript
{
  name: 'example.txt',      // File name
  path: '/example.txt',     // Full path
  isDirectory: false,       // Whether it's a directory
  size: 1024,              // File size in bytes
  entry: FileSystemHandle  // Native OPFS handle
}
```

```javascript
const files = document.querySelector('pan-files');
const allFiles = await files.listFiles();
console.log(`Found ${allFiles.length} files`);
```

#### `refresh()`
Reloads the file list from OPFS and updates the UI.

- **Parameters**: None
- **Returns**: `Promise<void>`

```javascript
const files = document.querySelector('pan-files');
await files.refresh();
```

### Events Reference

`pan-files` publishes and subscribes to PAN bus events for integration with other components.

#### Published Events

**`file.selected`**
Published when a user clicks on a file in the browser.

Payload:
```javascript
{
  path: '/example.txt',    // Full file path
  name: 'example.txt',     // File name
  isDirectory: false       // Whether it's a directory
}
```

**`file.created`**
Published when a file or folder is created.

Payload:
```javascript
{
  path: '/new-file.txt',
  name: 'new-file.txt',
  isDirectory: false      // true for folders
}
```

**`file.deleted`**
Published when a file is deleted.

Payload:
```javascript
{
  path: '/deleted.txt'
}
```

**`file.renamed`**
Published when a file is renamed.

Payload:
```javascript
{
  oldPath: '/old-name.txt',
  newPath: '/new-name.txt'
}
```

**`file.content-loaded`**
Published in response to a `file.load` event.

Payload:
```javascript
{
  path: '/example.txt',
  content: 'File contents here...'
}
```

#### Subscribed Events

**`file.save`**
Saves a file with the provided content.

Payload:
```javascript
{
  path: '/save-me.txt',
  content: 'Content to save'
}
```

**`file.load`**
Loads a file and publishes its content via `file.content-loaded`.

Payload:
```javascript
{
  path: '/load-me.txt'
}
```

**`file.delete`**
Deletes a file.

Payload:
```javascript
{
  path: '/delete-me.txt'
}
```

**`file.create`**
Creates a file with optional content.

Payload:
```javascript
{
  path: '/new.txt',
  content: 'Optional initial content'  // Defaults to empty string
}
```

### Complete Working Example

Here's a complete example showing `pan-files` integrated with the PAN bus:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-files.mjs';

    // Wait for components to load
    customElements.whenDefined('pan-bus').then(() => {
      const bus = document.querySelector('pan-bus');

      // Listen for file selections
      bus.subscribe('file.selected', (msg) => {
        console.log('File selected:', msg.data.path);

        // Load the file's contents
        bus.publish('file.load', { path: msg.data.path });
      });

      // Listen for file content
      bus.subscribe('file.content-loaded', (msg) => {
        console.log('File content:', msg.data.content);
        document.getElementById('preview').textContent = msg.data.content;
      });

      // Programmatic file operations
      window.createQuickNote = async () => {
        const files = document.querySelector('pan-files');
        const timestamp = new Date().toISOString();
        await files.writeFile(`/note-${Date.now()}.txt`,
          `Note created at ${timestamp}`);
        await files.refresh();
      };
    });
  </script>
  <style>
    body {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 1rem;
      height: 100vh;
      margin: 0;
      padding: 1rem;
    }
    pan-files {
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    #preview {
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      white-space: pre-wrap;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <pan-bus></pan-bus>

  <pan-files filter=".txt,.md"></pan-files>

  <div>
    <button onclick="createQuickNote()">Create Quick Note</button>
    <pre id="preview">Select a file to preview...</pre>
  </div>
</body>
</html>
```

### Related Components

- **`pan-markdown-editor`**: Use alongside `pan-files` for editing markdown files
- **`pan-bus`**: Required for event-based file operations
- **`pan-markdown-renderer`**: Display rendered markdown from files

### Common Issues and Solutions

**Issue: Files don't persist after closing the browser**

OPFS storage persists by default, but it can be cleared if:

- User clears browser data
- Browser is in private/incognito mode
- Storage quota is exceeded

Solution: Inform users about persistence limitations and provide export functionality for critical data.

**Issue: "Failed to initialize OPFS" error**

Cause: OPFS requires a secure context (HTTPS) and isn't available in all browsers.

Solution:

- Ensure your site runs on HTTPS (or localhost for development)
- Check browser support: OPFS works in Chrome 102+, Edge 102+, Opera 88+
- Provide fallback storage (IndexedDB) for unsupported browsers

**Issue: File list doesn't update after programmatic changes**

Cause: The UI doesn't automatically refresh after calling `writeFile()` or `deleteFile()`.

Solution: Call `refresh()` after file operations:
```javascript
await files.writeFile('/new.txt', 'content');
await files.refresh();
```

**Issue: Can't access files from network requests or other origins**

Cause: OPFS is origin-private—files aren't accessible via URLs or from other domains.

Solution: This is by design for security. To share files, explicitly read content and send via fetch/WebSocket.

---

## pan-markdown-editor: Rich Markdown Editor

The `pan-markdown-editor` component is a full-featured markdown editor with formatting toolbar, live preview, keyboard shortcuts, and auto-save capabilities.

### Overview and Purpose

`pan-markdown-editor` transforms a simple textarea into a powerful markdown editing environment. It's designed for content-heavy applications like note-taking apps, documentation tools, blogs, and content management systems.

The editor provides a rich formatting toolbar with common markdown operations, supports keyboard shortcuts for power users, and includes a live preview pane that renders markdown as you type. It integrates seamlessly with the PAN bus, broadcasting changes and responding to external commands.

Key features include:

- Rich formatting toolbar (bold, italic, headings, lists, etc.)
- Keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, etc.)
- Optional live preview with split-pane view
- Auto-indent and list continuation
- Word and character count
- Optional auto-save with debouncing
- Tab key support for indentation

### When to Use pan-markdown-editor

**Use `pan-markdown-editor` when:**

- Building markdown-based content applications
- You need a WYSIWYG-lite editing experience
- Users benefit from a formatting toolbar
- You want keyboard shortcuts for common formatting
- Live preview helps users understand markdown rendering

**Don't use `pan-markdown-editor` when:**

- You need WYSIWYG rich text editing (use a rich text editor)
- Users don't know markdown (provide alternatives or training)
- You're editing non-markdown content (use plain textarea)
- You need mobile-optimized input (the toolbar can be cramped)

### Installation and Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-markdown-editor.mjs';
    import './pan-markdown-renderer.mjs'; // Required for preview mode
  </script>
</head>
<body>
  <pan-markdown-editor
    value="# Hello World"
    preview="true">
  </pan-markdown-editor>
</body>
</html>
```

### Attributes Reference

#### `value`
- **Type**: `String`
- **Default**: `''`
- **Description**: Initial markdown content for the editor.

```html
<pan-markdown-editor value="# My Document

Start writing here..."></pan-markdown-editor>
```

#### `placeholder`
- **Type**: `String`
- **Default**: `'Start writing...'`
- **Description**: Placeholder text shown when the editor is empty.

```html
<pan-markdown-editor placeholder="Enter your markdown here..."></pan-markdown-editor>
```

#### `preview`
- **Type**: `Boolean` (as string)
- **Default**: `'false'`
- **Description**: Whether to show the live preview pane alongside the editor.

```html
<pan-markdown-editor preview="true"></pan-markdown-editor>
```

#### `autosave`
- **Type**: `Boolean` (as string)
- **Default**: `'false'`
- **Description**: Whether to enable auto-save with 1-second debouncing. When enabled, publishes `markdown.saved` events automatically.

```html
<pan-markdown-editor autosave="true"></pan-markdown-editor>
```

### Methods Reference

#### `setValue(value)`
Sets the editor content programmatically.

- **Parameters**:

  - `value` (String): New markdown content
- **Returns**: `void`
- **Side Effects**: Updates stats, preview, and triggers change events

```javascript
const editor = document.querySelector('pan-markdown-editor');
editor.setValue('# New Content\n\nThis replaces all existing content.');
```

#### `getValue()`
Returns the current editor content.

- **Parameters**: None
- **Returns**: `String` - Current markdown content

```javascript
const editor = document.querySelector('pan-markdown-editor');
const markdown = editor.getValue();
console.log(markdown);
```

#### `insertText(text)`
Inserts text at the current cursor position.

- **Parameters**:

  - `text` (String): Text to insert
- **Returns**: `void`

```javascript
const editor = document.querySelector('pan-markdown-editor');
editor.insertText('\n\n---\n\n'); // Insert horizontal rule
```

#### `focus()`
Focuses the editor textarea.

- **Parameters**: None
- **Returns**: `void`

```javascript
const editor = document.querySelector('pan-markdown-editor');
editor.focus();
```

### Toolbar Actions

The toolbar provides buttons for common markdown operations. Each button has a corresponding keyboard shortcut.

| Button | Action | Keyboard | Result |
|--------|--------|----------|--------|
| **B** | Bold | Ctrl+B | `**text**` |
| **I** | Italic | Ctrl+I | `*text*` |
| **S** | Strikethrough | - | `~~text~~` |
| H1-H3 | Headings | - | `# text` |
| • List | Bullet list | - | `* item` |
| 1. List | Numbered list | - | `1. item` |
| ☑ Task | Task list | - | `- [ ] task` |
| 🔗 Link | Insert link | Ctrl+K | `[text](url)` |
| 🖼️ Image | Insert image | - | `![alt](url)` |
| { } | Inline code | - | `` `code` `` |
| </> | Code block | - | ` ```lang\ncode\n``` ` |
| ❝ Quote | Blockquote | - | `> quote` |
| ─ | Horizontal rule | - | `---` |
| ⊞ Table | Insert table | - | Markdown table template |
| 👁️ Preview | Toggle preview | - | Shows/hides preview pane |

### Keyboard Shortcuts

- **Ctrl+B**: Bold selection
- **Ctrl+I**: Italic selection
- **Ctrl+K**: Insert link
- **Ctrl+S**: Save (publishes `markdown.saved` event)
- **Tab**: Insert two spaces (for indentation)
- **Enter**: Auto-continue lists (bullets, numbers, tasks)

### Events Reference

#### Published Events

**`markdown.changed`**
Published whenever the content changes.

Payload:
```javascript
{
  content: '# Markdown content',
  wordCount: 42,
  charCount: 256
}
```

**`markdown.saved`**
Published when Ctrl+S is pressed or auto-save triggers.

Payload:
```javascript
{
  content: '# Current markdown content'
}
```

#### Subscribed Events

**`markdown.set-content`**
Sets the editor content externally.

Payload:
```javascript
{
  content: '# New content to set'
}
```

**`markdown.get-content`**
Requests current content. The editor responds by publishing `markdown.content-response`.

Payload: None (empty object)

Response via `markdown.content-response`:
```javascript
{
  content: '# Current content'
}
```

### Complete Working Example

Here's a markdown editor integrated with file storage:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-files.mjs';
    import './pan-markdown-editor.mjs';
    import './pan-markdown-renderer.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const bus = document.querySelector('pan-bus');
      let currentFile = null;

      // Load file content into editor when selected
      bus.subscribe('file.selected', (msg) => {
        if (msg.data.path.endsWith('.md')) {
          currentFile = msg.data.path;
          bus.publish('file.load', { path: msg.data.path });
        }
      });

      bus.subscribe('file.content-loaded', (msg) => {
        const editor = document.querySelector('pan-markdown-editor');
        editor.setValue(msg.data.content);
        document.getElementById('filename').textContent =
          msg.data.path.split('/').pop();
      });

      // Save editor content back to file
      bus.subscribe('markdown.saved', async (msg) => {
        if (currentFile) {
          bus.publish('file.save', {
            path: currentFile,
            content: msg.data.content
          });
          showNotification('Saved!');
        }
      });

      window.createNewNote = () => {
        currentFile = `/note-${Date.now()}.md`;
        document.getElementById('filename').textContent =
          currentFile.split('/').pop();
        const editor = document.querySelector('pan-markdown-editor');
        editor.setValue('# New Note\n\n');
        editor.focus();
      };

      function showNotification(message) {
        const notif = document.getElementById('notification');
        notif.textContent = message;
        notif.style.display = 'block';
        setTimeout(() => notif.style.display = 'none', 2000);
      }
    });
  </script>
  <style>
    body {
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-rows: auto 1fr;
      height: 100vh;
    }
    .toolbar {
      padding: 1rem;
      border-bottom: 1px solid #ccc;
      display: flex;
      gap: 1rem;
      align-items: center;
    }
    #filename {
      font-weight: bold;
      flex: 1;
    }
    #notification {
      display: none;
      background: #4caf50;
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 4px;
    }
    .content {
      display: grid;
      grid-template-columns: 250px 1fr;
      gap: 1rem;
      padding: 1rem;
      overflow: hidden;
    }
    pan-files, pan-markdown-editor {
      border: 1px solid #ccc;
      border-radius: 4px;
      overflow: auto;
    }
  </style>
</head>
<body>
  <pan-bus></pan-bus>

  <div class="toolbar">
    <span id="filename">No file selected</span>
    <button onclick="createNewNote()">New Note</button>
    <div id="notification"></div>
  </div>

  <div class="content">
    <pan-files filter=".md"></pan-files>
    <pan-markdown-editor
      preview="true"
      autosave="true"
      placeholder="Select a file or create a new note...">
    </pan-markdown-editor>
  </div>
</body>
</html>
```

### Related Components

- **`pan-files`**: Store and retrieve markdown files
- **`pan-markdown-renderer`**: Display rendered output
- **`pan-bus`**: Coordinate between editor and other components

### Common Issues and Solutions

**Issue: Toolbar buttons don't work on mobile**

Cause: Mobile browsers handle focus and selection differently.

Solution: The component is optimized for desktop. For mobile, consider hiding the toolbar and relying on keyboard shortcuts or providing a simplified mobile UI.

**Issue: Preview pane doesn't update**

Cause: `pan-markdown-renderer` component isn't loaded.

Solution: Ensure you import both components:
```javascript
import './pan-markdown-editor.mjs';
import './pan-markdown-renderer.mjs';
```

**Issue: Large documents cause lag**

Cause: Real-time rendering of very large documents can be slow.

Solution:

- Disable preview for large documents
- Add debouncing to preview updates
- Split large documents into smaller sections

**Issue: Keyboard shortcuts conflict with browser shortcuts**

Cause: Some browsers intercept Ctrl+S, Ctrl+K, etc.

Solution: The component calls `preventDefault()` for most shortcuts, but browser behavior varies. Consider documenting known conflicts.

---

## pan-markdown-renderer: Markdown Display

The `pan-markdown-renderer` component takes markdown text and renders it as formatted HTML with syntax highlighting, tables, and GitHub-flavored markdown support.

### Overview and Purpose

`pan-markdown-renderer` is a read-only component that displays markdown content as formatted HTML. It's the display counterpart to `pan-markdown-editor`—while the editor lets users write markdown, the renderer shows them what it looks like.

The renderer implements a custom markdown parser that supports standard markdown syntax plus GitHub-flavored extensions like task lists and tables. It's designed to be lightweight (no external dependencies), secure (HTML sanitization), and styleable (CSS custom properties).

Key features include:

- Complete markdown syntax support
- GitHub-flavored markdown (tables, task lists)
- Safe HTML rendering (sanitized by default)
- Syntax highlighting structure (CSS-based)
- Responsive design
- Custom styling via CSS variables

### When to Use pan-markdown-renderer

**Use `pan-markdown-renderer` when:**

- Displaying markdown content to users
- Building preview panes for editors
- Rendering blog posts, documentation, or comments
- You need sanitized HTML output from markdown
- You want consistent markdown rendering across your app

**Don't use `pan-markdown-renderer` when:**

- You need a full-featured markdown parser (use marked.js, markdown-it)
- You require advanced syntax highlighting (use Prism or highlight.js)
- You're rendering non-markdown content
- You need to edit content (use `pan-markdown-editor`)

### Installation and Setup

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-markdown-renderer.mjs';
  </script>
</head>
<body>
  <pan-markdown-renderer content="# Hello World

This is **bold** and this is *italic*."></pan-markdown-renderer>
</body>
</html>
```

### Attributes Reference

#### `content`
- **Type**: `String`
- **Default**: `''`
- **Description**: Markdown content to render. Changes to this attribute trigger re-rendering.

```html
<pan-markdown-renderer content="# Title

Paragraph text here."></pan-markdown-renderer>
```

#### `sanitize`
- **Type**: `Boolean` (as string)
- **Default**: `'true'`
- **Description**: Whether to sanitize HTML in markdown content. When true, raw HTML is escaped. Set to false only if you trust the content source.

```html
<!-- Allow raw HTML (use with caution) -->
<pan-markdown-renderer
  content="# Title

<div class='custom'>Raw HTML</div>"
  sanitize="false">
</pan-markdown-renderer>
```

### Methods Reference

#### `setContent(content)`
Sets the markdown content programmatically and triggers rendering.

- **Parameters**:

  - `content` (String): Markdown content to render
- **Returns**: `void`

```javascript
const renderer = document.querySelector('pan-markdown-renderer');
renderer.setContent('# Dynamic Content\n\nUpdated at runtime.');
```

#### `getContent()`
Returns the current markdown content (not the rendered HTML).

- **Parameters**: None
- **Returns**: `String` - Current markdown content

```javascript
const renderer = document.querySelector('pan-markdown-renderer');
console.log(renderer.getContent());
```

#### `getHtml()`
Returns the rendered HTML output.

- **Parameters**: None
- **Returns**: `String` - Rendered HTML

```javascript
const renderer = document.querySelector('pan-markdown-renderer');
const html = renderer.getHtml();
console.log(html); // "<h1>Title</h1><p>Content...</p>"
```

### Supported Markdown Syntax

The renderer supports the following markdown features:

**Headings**
```markdown
# H1
## H2
### H3
#### H4
##### H5
###### H6
```

**Emphasis**
```markdown
**bold** or __bold__
*italic* or _italic_
~~strikethrough~~
```

**Lists**
```markdown
* Bullet item
* Another item

1. Numbered item
2. Another item

- [ ] Unchecked task
- [x] Checked task
```

**Links and Images**
```markdown
[Link text](https://example.com)
![Alt text](https://example.com/image.png)
```

**Code**
```markdown
Inline `code`

```javascript
// Code block with language
function hello() {
  console.log('Hello');
}
```
```

**Blockquotes**
```markdown
> This is a quote
> with multiple lines
```

**Horizontal Rules**
```markdown
---
***
___
```

**Tables**
```markdown
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |
```

### Styling with CSS Variables

The renderer uses CSS custom properties for easy theming:

```css
pan-markdown-renderer {
  /* Text colors */
  --color-text: #1e293b;
  --color-text-muted: #64748b;

  /* Backgrounds */
  --color-bg-alt: #f8fafc;
  --color-border: #e2e8f0;

  /* Code blocks */
  --color-code-bg: #1e293b;
  --color-code-text: #e2e8f0;

  /* Links */
  --color-primary: #006699;

  /* Fonts */
  --font-mono: 'Courier New', monospace;
}
```

Example: Dark mode theme
```css
pan-markdown-renderer.dark-mode {
  --color-text: #e2e8f0;
  --color-text-muted: #94a3b8;
  --color-bg-alt: #1e293b;
  --color-border: #334155;
  --color-code-bg: #0f172a;
  --color-code-text: #e2e8f0;
  --color-primary: #38bdf8;
}
```

### Events Reference

#### Subscribed Events

**`markdown.render`**
Triggers rendering with new content.

Payload:
```javascript
{
  content: '# Content to render'
}
```

Example:
```javascript
const bus = document.querySelector('pan-bus');
bus.publish('markdown.render', {
  content: '# Hello from PAN bus'
});
```

### Complete Working Example

Here's a complete example showing a markdown documentation viewer:

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-markdown-renderer.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const bus = document.querySelector('pan-bus');
      const renderer = document.querySelector('pan-markdown-renderer');

      // Sample documentation sections
      const docs = {
        intro: `# Getting Started

Welcome to our documentation! This guide will help you understand the basics.

## Prerequisites

Before you begin, make sure you have:

- A modern web browser
- Basic knowledge of HTML and JavaScript
- 15 minutes of free time

## Installation

1. Download the package
2. Extract to your project
3. Import the components

\`\`\`javascript
import './components/app.mjs';
\`\`\``,

        api: `# API Reference

## Core Methods

### \`initialize(config)\`

Initializes the application with the provided configuration.

**Parameters:**
- \`config\` (Object): Configuration object
  - \`debug\` (Boolean): Enable debug mode
  - \`theme\` (String): Theme name

**Returns:** Promise<void>

**Example:**
\`\`\`javascript
await initialize({
  debug: true,
  theme: 'dark'
});
\`\`\``,

        examples: `# Examples

## Hello World

The simplest example:

\`\`\`html
<hello-world></hello-world>
\`\`\`

## Task List

- [x] Create component
- [x] Write documentation
- [ ] Deploy to production

## Data Table

| Feature | Supported | Version |
|---------|-----------|---------|
| Import  | ✅ | 1.0 |
| Export  | ✅ | 1.0 |
| Sync    | ⏳ | 2.0 |`
      };

      // Navigation
      window.showDoc = (section) => {
        renderer.setContent(docs[section]);

        // Update active state
        document.querySelectorAll('nav button').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.section === section);
        });
      };

      // Show initial doc
      showDoc('intro');
    });
  </script>
  <style>
    body {
      margin: 0;
      font-family: system-ui, sans-serif;
      display: grid;
      grid-template-columns: 200px 1fr;
      height: 100vh;
    }
    nav {
      background: #f8fafc;
      padding: 1rem;
      border-right: 1px solid #e2e8f0;
    }
    nav h2 {
      margin-top: 0;
      font-size: 1rem;
      color: #64748b;
    }
    nav button {
      display: block;
      width: 100%;
      padding: 0.5rem;
      margin: 0.25rem 0;
      border: none;
      background: transparent;
      text-align: left;
      cursor: pointer;
      border-radius: 4px;
      transition: background 0.15s;
    }
    nav button:hover {
      background: #e2e8f0;
    }
    nav button.active {
      background: #006699;
      color: white;
    }
    main {
      padding: 2rem;
      overflow-y: auto;
    }
    pan-markdown-renderer {
      display: block;
      max-width: 800px;
    }
  </style>
</head>
<body>
  <pan-bus></pan-bus>

  <nav>
    <h2>Documentation</h2>
    <button data-section="intro" onclick="showDoc('intro')" class="active">
      Getting Started
    </button>
    <button data-section="api" onclick="showDoc('api')">
      API Reference
    </button>
    <button data-section="examples" onclick="showDoc('examples')">
      Examples
    </button>
  </nav>

  <main>
    <pan-markdown-renderer></pan-markdown-renderer>
  </main>
</body>
</html>
```

### Related Components

- **`pan-markdown-editor`**: Edit markdown content
- **`pan-files`**: Store markdown files
- **`pan-bus`**: Coordinate rendering with other components

### Common Issues and Solutions

**Issue: Code blocks don't have syntax highlighting**

Cause: The renderer provides structure but not syntax coloring.

Solution: Add a CSS-based syntax highlighter or a library like Prism.js:
```html
<link rel="stylesheet" href="prism.css">
<script src="prism.js"></script>
```

**Issue: Tables render incorrectly**

Cause: Table markdown must follow strict formatting with alignment rows.

Solution: Ensure tables have a header separator row:
```markdown
| Header 1 | Header 2 |
|----------|----------|  ← Required separator
| Cell 1   | Cell 2   |
```

**Issue: Raw HTML appears in output**

Cause: HTML sanitization is enabled by default.

Solution: Only disable sanitization if you trust the content source:
```html
<pan-markdown-renderer sanitize="false" content="<div>Raw HTML</div>">
</pan-markdown-renderer>
```

**Issue: Custom markdown extensions not supported**

Cause: The built-in parser implements standard markdown only.

Solution: For advanced features, consider replacing the internal parser with markdown-it or marked.js and subclassing the component.

**Issue: Markdown doesn't wrap in mobile views**

Cause: Long code blocks or wide tables can overflow.

Solution: Add responsive styling:
```css
pan-markdown-renderer {
  overflow-x: auto;
}
pan-markdown-renderer pre {
  max-width: 100%;
  overflow-x: auto;
}
```

---

## Component Integration Patterns

The three components work best when integrated together. Here are common patterns:

### Pattern 1: Markdown Note-Taking App

```javascript
// Connect file selection → editor → auto-save → file storage
bus.subscribe('file.selected', (msg) => {
  bus.publish('file.load', { path: msg.data.path });
});

bus.subscribe('file.content-loaded', (msg) => {
  const editor = document.querySelector('pan-markdown-editor');
  editor.setValue(msg.data.content);
});

bus.subscribe('markdown.saved', (msg) => {
  bus.publish('file.save', {
    path: currentFile,
    content: msg.data.content
  });
});
```

### Pattern 2: Documentation Viewer

```javascript
// Render markdown files as formatted documentation
bus.subscribe('file.selected', async (msg) => {
  if (msg.data.path.endsWith('.md')) {
    const files = document.querySelector('pan-files');
    const content = await files.readFile(msg.data.path);

    const renderer = document.querySelector('pan-markdown-renderer');
    renderer.setContent(content);
  }
});
```

### Pattern 3: Split-View Editor

```html
<div class="split-view">
  <pan-markdown-editor></pan-markdown-editor>
  <pan-markdown-renderer></pan-markdown-renderer>
</div>

<script type="module">
  // Sync editor to renderer
  bus.subscribe('markdown.changed', (msg) => {
    const renderer = document.querySelector('pan-markdown-renderer');
    renderer.setContent(msg.data.content);
  });
</script>
```

---

## Conclusion

LARC's UI components demonstrate the power of web components: they're self-contained, reusable, and work with or without a framework. `pan-files` handles storage, `pan-markdown-editor` handles input, and `pan-markdown-renderer` handles display—each focused on doing one thing well.

The PAN bus ties them together, allowing components to communicate without tight coupling. You can use these components individually or compose them into full applications. And because they're built on web standards, they'll work in browsers long after today's frameworks fade into obscurity.

In the next chapter, we'll explore advanced component patterns: building custom UI components that follow these same principles, creating reusable component libraries, and designing component APIs that stand the test of time.
