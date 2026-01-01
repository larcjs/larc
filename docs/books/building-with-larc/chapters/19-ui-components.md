# UI Components Reference

API documentation for LARC's UI components. For tutorials, see *Learning LARC* Chapter 10.

## pan-files

**Purpose**: OPFS-backed file system browser with visual UI and programmatic API  
**Import**: `<script type="module" src="/ui/pan-files.mjs"></script>`

### Quick Example

```html
<pan-files filter=".md,.txt"></pan-files>

<script type="module">
const files = document.querySelector('pan-files');

// Write file
await files.writeFile('/notes.txt', 'Hello, World!');

// Read file
const content = await files.readFile('/notes.txt');

// List files
const allFiles = await files.listFiles();
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `path` | String | "/" | Current directory path (root level only) |
| `filter` | String | "" | Comma-separated file extensions to display |
| `show-hidden` | Boolean | false | Show files starting with dot |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `writeFile(path, content)` | path: String, content: String | Promise\<void\> | Write file (creates or overwrites) |
| `readFile(path)` | path: String | Promise\<String\> | Read file contents |
| `deleteFile(path)` | path: String | Promise\<void\> | Delete file |
| `listFiles()` | - | Promise\<Array\<FileInfo\>\> | Get all files in directory |
| `refresh()` | - | Promise\<void\> | Reload file list and update UI |

**FileInfo structure:**
```javascript
{
  name: 'example.txt',
  path: '/example.txt',
  isDirectory: false,
  size: 1024,
  entry: FileSystemHandle
}
```

### PAN Events

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `file.selected` | `{ path, name, isDirectory }` | User clicked file |
| `file.created` | `{ path, name, isDirectory }` | File/folder created |
| `file.deleted` | `{ path }` | File deleted |
| `file.renamed` | `{ oldPath, newPath }` | File renamed |
| `file.content-loaded` | `{ path, content }` | Response to file.load |

#### Subscribed

| Topic | Data | Description |
|-------|------|-------------|
| `file.save` | `{ path, content }` | Save file |
| `file.load` | `{ path }` | Load file (triggers file.content-loaded) |
| `file.delete` | `{ path }` | Delete file |
| `file.create` | `{ path, content? }` | Create file with optional content |

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-files.mjs';

    customElements.whenDefined('pan-bus').then(() => {
      const bus = document.querySelector('pan-bus');
      const files = document.querySelector('pan-files');

      // Load file content when selected
      bus.subscribe('file.selected', (msg) => {
        bus.publish('file.load', { path: msg.data.path });
      });

      bus.subscribe('file.content-loaded', (msg) => {
        document.getElementById('preview').textContent = msg.data.content;
      });

      // Create quick note
      window.createNote = async () => {
        await files.writeFile(
          `/note-${Date.now()}.txt`,
          `Created at ${new Date().toISOString()}`
        );
        await files.refresh();
      };
    });
  </script>
  <style>
    body { display: grid; grid-template-columns: 300px 1fr; gap: 1rem; padding: 1rem; }
    #preview { padding: 1rem; border: 1px solid #ccc; white-space: pre-wrap; font-family: monospace; }
  </style>
</head>
<body>
  <pan-bus></pan-bus>
  <pan-files filter=".txt,.md"></pan-files>
  <div>
    <button onclick="createNote()">Create Note</button>
    <pre id="preview">Select a file...</pre>
  </div>
</body>
</html>
```

### Errors

pan-files dispatches custom `error` events and publishes to `file.error` topic:

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `OPFS_NOT_SUPPORTED` | Browser doesn't support OPFS | Use Chrome 102+, Edge 102+, or provide fallback |
| `OPFS_INIT_FAILED` | Failed to initialize file system | Check HTTPS connection (or localhost) |
| `FILE_NOT_FOUND` | File doesn't exist | Verify path or catch error gracefully |
| `WRITE_FAILED` | Cannot write file | Check storage quota or permissions |
| `READ_FAILED` | Cannot read file | Verify file exists and is accessible |
| `DELETE_FAILED` | Cannot delete file | Check if file is locked or in use |
| `QUOTA_EXCEEDED` | Storage quota exceeded | Clear old files or request persistent storage |
| `INVALID_PATH` | Path contains invalid characters | Use valid path format (no `<>:"|?*`) |

**Error handling example**:
```javascript
const files = document.querySelector('pan-files');
const bus = document.querySelector('pan-bus');

// Listen for errors via DOM event
files.addEventListener('error', (e) => {
  const { code, message, path } = e.detail;
  console.error(`File error [${code}]:`, message);

  switch (code) {
    case 'OPFS_NOT_SUPPORTED':
      showFallbackUI();
      break;
    case 'QUOTA_EXCEEDED':
      promptUserToCleanup();
      break;
    case 'FILE_NOT_FOUND':
      console.warn(`File not found: ${path}`);
      break;
  }
});

// Or subscribe via PAN bus
bus.subscribe('file.error', (msg) => {
  const { code, message, path } = msg.data;
  displayErrorToUser(message);
});

// Safe file operations with try-catch
async function safeWriteFile(path, content) {
  try {
    await files.writeFile(path, content);
    await files.refresh();
  } catch (err) {
    console.error('Write failed:', err.message);
    // Fallback to localStorage or download
    localStorage.setItem(`backup_${path}`, content);
  }
}

// Check quota before large operations
if (navigator.storage && navigator.storage.estimate) {
  const estimate = await navigator.storage.estimate();
  const percentUsed = (estimate.usage / estimate.quota) * 100;
  
  if (percentUsed > 90) {
    console.warn('Storage nearly full, cleanup recommended');
  }
}
```

**Exceptions thrown**:

- `DOMException`: OPFS-specific errors (NotFoundError, QuotaExceededError)
- `TypeError`: Invalid parameters (non-string path, invalid content type)
- `Error`: General file operation failures

**Browser Compatibility Notes**:

- OPFS requires Chrome 102+, Edge 102+, Opera 88+
- Not available in Firefox as of December 2024
- Requires HTTPS or localhost (not available on `http://`)
- Private/incognito mode may have reduced quota
- Check support: `if ('storage' in navigator && 'getDirectory' in navigator.storage)`

### Common Issues

**Files don't persist**: OPFS storage clears if user clears browser data, uses private mode, or exceeds quota. Provide export functionality for critical data.

**"Failed to initialize OPFS"**: Requires HTTPS (or localhost). Check browser support: Chrome 102+, Edge 102+, Opera 88+.

**File list doesn't update**: Call `refresh()` after `writeFile()` or `deleteFile()`.

**Can't access files from network**: OPFS is origin-private by design. Read content and send via fetch/WebSocket to share.

---

## pan-markdown-editor

**Purpose**: Rich markdown editor with toolbar, preview, and auto-save  
**Import**: `<script type="module" src="/ui/pan-markdown-editor.mjs"></script>`

### Quick Example

```html
<pan-markdown-editor
  value="# Hello World"
  preview="true"
  autosave="true"
  placeholder="Start writing...">
</pan-markdown-editor>

<script type="module">
const editor = document.querySelector('pan-markdown-editor');

// Get content
const markdown = editor.getValue();

// Set content
editor.setValue('# New Content');

// Insert at cursor
editor.insertText('\n\n---\n\n');
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | String | "" | Initial markdown content |
| `placeholder` | String | "Start writing..." | Placeholder text |
| `preview` | Boolean | false | Show live preview pane |
| `autosave` | Boolean | false | Enable auto-save (1s debounce) |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `setValue(value)` | value: String | void | Set editor content |
| `getValue()` | - | String | Get current content |
| `insertText(text)` | text: String | void | Insert at cursor position |
| `focus()` | - | void | Focus editor textarea |

### Toolbar Actions

| Button | Action | Shortcut | Result |
|--------|--------|----------|--------|
| **B** | Bold | Ctrl+B | `**text**` |
| **I** | Italic | Ctrl+I | `*text*` |
| **S** | Strikethrough | - | `~~text~~` |
| H1-H3 | Headings | - | `# text` |
| * | Bullet list | - | `* item` |
| 1. | Numbered list | - | `1. item` |
| [v] | Task list | - | `- [ ] task` |
| [link] | Link | Ctrl+K | `[text](url)` |
| [img] | Image | - | `![alt](url)` |
| { } | Inline code | - | `` `code` `` |
| </> | Code block | - | ` ```lang\ncode\n``` ` |
| " | Blockquote | - | `> quote` |
| - | Horizontal rule | - | `---` |
| [+] | Table | - | Markdown table |
| [eye] | Preview | - | Toggle preview pane |

**Additional shortcuts:**
- Ctrl+S: Save (triggers `markdown.saved`)
- Tab: Insert two spaces
- Enter: Auto-continue lists

### PAN Events

#### Published

| Topic | Data | Description |
|-------|------|-------------|
| `markdown.changed` | `{ content, wordCount, charCount }` | Content changed |
| `markdown.saved` | `{ content }` | Ctrl+S pressed or auto-save |

#### Subscribed

| Topic | Data | Description |
|-------|------|-------------|
| `markdown.set-content` | `{ content }` | Set editor content |
| `markdown.get-content` | `{}` | Request content (responds with markdown.content-response) |

### Complete Example

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

      // Load file into editor
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

      // Save editor to file
      bus.subscribe('markdown.saved', (msg) => {
        if (currentFile) {
          bus.publish('file.save', {
            path: currentFile,
            content: msg.data.content
          });
        }
      });

      window.createNote = () => {
        currentFile = `/note-${Date.now()}.md`;
        document.getElementById('filename').textContent = 
          currentFile.split('/').pop();
        const editor = document.querySelector('pan-markdown-editor');
        editor.setValue('# New Note\n\n');
        editor.focus();
      };
    });
  </script>
  <style>
    body { margin: 0; display: grid; grid-template-rows: auto 1fr; height: 100vh; }
    .toolbar { padding: 1rem; border-bottom: 1px solid #ccc; display: flex; gap: 1rem; }
    .content { display: grid; grid-template-columns: 250px 1fr; gap: 1rem; padding: 1rem; }
  </style>
</head>
<body>
  <pan-bus></pan-bus>
  <div class="toolbar">
    <span id="filename">No file selected</span>
    <button onclick="createNote()">New Note</button>
  </div>
  <div class="content">
    <pan-files filter=".md"></pan-files>
    <pan-markdown-editor preview="true" autosave="true"></pan-markdown-editor>
  </div>
</body>
</html>
```

### Errors

pan-markdown-editor dispatches `error` events for error conditions:

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `RENDER_FAILED` | Preview rendering failed | Check markdown syntax or disable preview |
| `AUTOSAVE_FAILED` | Auto-save operation failed | Check storage or disable autosave |
| `INVALID_CONTENT` | Non-string content passed to `setValue()` | Pass valid string to `setValue()` |
| `TOOLBAR_ACTION_FAILED` | Toolbar button action threw error | Check custom toolbar handlers |

**Error handling example**:
```javascript
const editor = document.querySelector('pan-markdown-editor');

// Listen for errors
editor.addEventListener('error', (e) => {
  const { code, message, action } = e.detail;
  console.error(`Editor error [${code}]:`, message);

  switch (code) {
    case 'RENDER_FAILED':
      // Disable preview temporarily
      editor.removeAttribute('preview');
      showNotification('Preview disabled due to rendering error');
      break;

    case 'AUTOSAVE_FAILED':
      // Manual save prompt
      if (confirm('Auto-save failed. Save manually?')) {
        const content = editor.getValue();
        manualSave(content);
      }
      break;

    case 'INVALID_CONTENT':
      console.warn('Attempted to set invalid content');
      break;
  }
});

// Safe setValue with validation
function safeSetValue(content) {
  if (typeof content !== 'string') {
    console.error('Content must be a string');
    return;
  }
  
  try {
    editor.setValue(content);
  } catch (err) {
    console.error('Failed to set editor content:', err);
    // Fallback to plain textarea
    useFallbackEditor(content);
  }
}

// Monitor autosave with error handling
const bus = document.querySelector('pan-bus');
bus.subscribe('markdown.saved', (msg) => {
  try {
    localStorage.setItem('backup', msg.data.content);
    console.log('Content backed up');
  } catch (err) {
    console.error('Backup failed:', err);
  }
});
```

**Exceptions thrown**:

- `TypeError`: Invalid parameters (non-string content, invalid position)
- `Error`: General operation failures (toolbar actions, preview rendering)

**Performance Notes**:

- Documents over 50KB may cause lag with preview enabled
- Autosave debounces input by 1 second
- Consider disabling preview for large documents: `if (content.length > 50000) editor.removeAttribute('preview')`

### Common Issues

**Toolbar doesn't work on mobile**: Component optimized for desktop. Hide toolbar on mobile.

**Preview doesn't update**: Ensure `pan-markdown-renderer` is imported.

**Large documents lag**: Disable preview or add debouncing for documents over 50KB.

**Keyboard shortcuts conflict**: Component uses `preventDefault()` but browser behavior varies.

---

## pan-markdown-renderer

**Purpose**: Render markdown as formatted HTML with syntax highlighting structure  
**Import**: `<script type="module" src="/ui/pan-markdown-renderer.mjs"></script>`

### Quick Example

```html
<pan-markdown-renderer content="# Hello World

This is **bold** and *italic*.

```javascript
console.log('Code block');
```
"></pan-markdown-renderer>

<script type="module">
const renderer = document.querySelector('pan-markdown-renderer');

// Set content
renderer.setContent('# Dynamic Content');

// Get markdown
const markdown = renderer.getContent();

// Get rendered HTML
const html = renderer.getHtml();
</script>
```

### Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `content` | String | "" | Markdown content to render |
| `sanitize` | Boolean | true | Escape raw HTML (disable only if trusted) |

### Methods

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `setContent(content)` | content: String | void | Set and render markdown |
| `getContent()` | - | String | Get current markdown |
| `getHtml()` | - | String | Get rendered HTML output |

### Supported Syntax

**Standard markdown:**
- Headings: `# H1` through `###### H6`
- Emphasis: `**bold**`, `*italic*`, `~~strikethrough~~`
- Lists: Bullet (`*`), numbered (`1.`), task (`- [ ]`)
- Links: `[text](url)` and images: `![alt](url)`
- Code: Inline `` `code` `` and fenced ` ```lang ` blocks
- Blockquotes: `> quote`
- Horizontal rules: `---`

**GitHub-flavored:**
- Tables with `|` delimiters
- Task lists: `- [x] Done` and `- [ ] Todo`

### Styling

Customize with CSS variables:

```css
pan-markdown-renderer {
  --color-text: #1e293b;
  --color-text-muted: #64748b;
  --color-bg-alt: #f8fafc;
  --color-border: #e2e8f0;
  --color-code-bg: #1e293b;
  --color-code-text: #e2e8f0;
  --color-primary: #006699;
  --font-mono: 'Courier New', monospace;
}

/* Dark mode */
pan-markdown-renderer.dark {
  --color-text: #e2e8f0;
  --color-bg-alt: #1e293b;
  --color-code-bg: #0f172a;
  --color-primary: #38bdf8;
}
```

### PAN Events

#### Subscribed

| Topic | Data | Description |
|-------|------|-------------|
| `markdown.render` | `{ content }` | Render new content |

### Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import './pan-bus.mjs';
    import './pan-markdown-renderer.mjs';

    const docs = {
      intro: `# Getting Started

Welcome! This guide covers the basics.

## Prerequisites

- Modern web browser
- Basic HTML/JavaScript knowledge
- 15 minutes

## Installation

\`\`\`javascript
import './components/app.mjs';
\`\`\``,

      api: `# API Reference

## Core Methods

### \`initialize(config)\`

Initializes the application.

**Parameters:**
- \`config.debug\` (Boolean): Enable debug mode
- \`config.theme\` (String): Theme name

\`\`\`javascript
await initialize({ debug: true, theme: 'dark' });
\`\`\``,

      examples: `# Examples

## Task List

- [x] Create component
- [x] Write docs
- [ ] Deploy

## Data Table

| Feature | Status | Version |
|---------|--------|---------|
| Import  | ✓      | 1.0     |
| Export  | ✓      | 1.0     |
| Sync    | ⏳     | 2.0     |`
    };

    customElements.whenDefined('pan-bus').then(() => {
      const renderer = document.querySelector('pan-markdown-renderer');

      window.showDoc = (section) => {
        renderer.setContent(docs[section]);
        document.querySelectorAll('nav button').forEach(btn => {
          btn.classList.toggle('active', btn.dataset.section === section);
        });
      };

      showDoc('intro');
    });
  </script>
  <style>
    body { margin: 0; display: grid; grid-template-columns: 200px 1fr; height: 100vh; }
    nav { background: #f8fafc; padding: 1rem; border-right: 1px solid #e2e8f0; }
    nav button { display: block; width: 100%; padding: 0.5rem; margin: 0.25rem 0; 
                 border: none; background: transparent; text-align: left; cursor: pointer; }
    nav button:hover { background: #e2e8f0; }
    nav button.active { background: #006699; color: white; }
    main { padding: 2rem; overflow-y: auto; }
  </style>
</head>
<body>
  <pan-bus></pan-bus>
  <nav>
    <h2>Documentation</h2>
    <button data-section="intro" onclick="showDoc('intro')" class="active">Getting Started</button>
    <button data-section="api" onclick="showDoc('api')">API Reference</button>
    <button data-section="examples" onclick="showDoc('examples')">Examples</button>
  </nav>
  <main>
    <pan-markdown-renderer></pan-markdown-renderer>
  </main>
</body>
</html>
```

### Errors

pan-markdown-renderer dispatches `error` events when rendering fails:

| Error Code | Cause | Resolution |
|------------|-------|------------|
| `PARSE_ERROR` | Invalid markdown syntax | Check markdown format or sanitize input |
| `RENDER_ERROR` | HTML generation failed | Simplify content or report bug |
| `SANITIZATION_ERROR` | HTML sanitization failed | Check content or disable sanitization |
| `INVALID_CONTENT` | Non-string content passed | Pass valid string to `setContent()` |

**Error handling example**:
```javascript
const renderer = document.querySelector('pan-markdown-renderer');

// Listen for errors
renderer.addEventListener('error', (e) => {
  const { code, message, content } = e.detail;
  console.error(`Renderer error [${code}]:`, message);

  switch (code) {
    case 'PARSE_ERROR':
      // Show raw markdown as fallback
      renderer.shadowRoot.querySelector('.content').textContent = content;
      showWarning('Markdown parsing failed, showing raw content');
      break;

    case 'RENDER_ERROR':
      console.error('Failed to render markdown');
      showFallbackRenderer();
      break;

    case 'SANITIZATION_ERROR':
      // Retry with stricter sanitization
      renderer.setAttribute('sanitize', 'true');
      break;

    case 'INVALID_CONTENT':
      console.warn('Invalid content type provided');
      break;
  }
});

// Safe setContent with validation
function safeSetContent(content) {
  if (typeof content !== 'string') {
    console.error('Content must be a string');
    return;
  }

  try {
    renderer.setContent(content);
  } catch (err) {
    console.error('Failed to render content:', err);
    // Fallback to plain text
    renderer.shadowRoot.querySelector('.content').textContent = content;
  }
}

// Validate markdown before rendering
function validateAndRender(markdown) {
  // Check for balanced code fences
  const fenceCount = (markdown.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) {
    console.warn('Unbalanced code fences detected');
    markdown += '\n```'; // Auto-close
  }

  renderer.setContent(markdown);
}
```

**Exceptions thrown**:

- `TypeError`: Invalid parameters (non-string content)
- `Error`: Parse or render failures

**Performance Notes**:

- Large documents (>100KB) may slow rendering
- Complex tables with many rows cause layout reflow
- Consider debouncing content updates for live preview

### Common Issues

**No syntax highlighting**: Renderer provides structure only. Add Prism.js or similar for color syntax highlighting.

**Tables render incorrectly**: Ensure separator row with dashes: `|---|---|`

**Raw HTML appears**: Sanitization enabled by default. Only set `sanitize="false"` for trusted content.

**Content doesn't wrap on mobile**: Add responsive CSS:
```css
pan-markdown-renderer { overflow-x: auto; }
pan-markdown-renderer pre { max-width: 100%; overflow-x: auto; }
```

---

## Summary

This chapter documented LARC's UI components:

- **pan-files**: OPFS file system browser with visual UI and programmatic API
- **pan-markdown-editor**: Rich markdown editor with toolbar, preview, and auto-save
- **pan-markdown-renderer**: Markdown-to-HTML renderer with GitHub-flavored syntax

Use together for complete markdown applications or individually as needed.

**See Also**:

- Tutorial: *Learning LARC* Chapter 10
- Core components: Chapter 17
- Data components: Chapter 18
- Integration patterns: Chapter 20
