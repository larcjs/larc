# File Management

Quick reference for file management and OPFS (Origin Private File System) in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 11.

## Overview

OPFS provides browser-based file storage with high performance, large capacity (GB+), and persistence across sessions. Unlike localStorage (5-10MB) or IndexedDB, OPFS offers native file system operations ideal for offline-first apps and large file handling.

**Key Concepts**:

- OPFS: Origin Private File System - browser's private file storage
- FileSystemDirectoryHandle: Directory reference for operations
- FileSystemFileHandle: File reference for read/write operations
- Storage quota: Browser-managed space limits (best-effort persistence)
- Streaming: Handle large files without loading into memory

## Quick Example

```javascript
// Initialize OPFS
const root = await navigator.storage.getDirectory();

// Write file
const fileHandle = await root.getFileHandle('notes.txt', { create: true });
const writable = await fileHandle.createWritable();
await writable.write('Hello OPFS!');
await writable.close();

// Read file
const file = await fileHandle.getFile();
const text = await file.text();
console.log(text); // "Hello OPFS!"

// List files
for await (const [name, handle] of root.entries()) {
  console.log(name, handle.kind); // 'notes.txt' 'file'
}
```

## FileSystemService API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `initialize()` | - | Promise\<void\> | Initialize OPFS root handle |
| `createDirectory(path)` | path: string | Promise\<DirectoryHandle\> | Create directory (recursive) |
| `getDirectory(path)` | path: string | Promise\<DirectoryHandle\> | Get existing directory |
| `listFiles(path)` | path?: string | Promise\<FileInfo[]\> | List files in directory |
| `listDirectories(path)` | path?: string | Promise\<DirectoryInfo[]\> | List subdirectories |
| `writeFile(path, name, content)` | path: string, name: string, content: Blob\|ArrayBuffer\|string | Promise\<void\> | Write or update file |
| `readFile(path, name)` | path: string, name: string | Promise\<File\> | Read file contents |
| `deleteFile(path, name)` | path: string, name: string | Promise\<void\> | Delete file |
| `deleteDirectory(path, recursive?)` | path: string, recursive?: boolean | Promise\<void\> | Delete directory |
| `fileExists(path, name)` | path: string, name: string | Promise\<boolean\> | Check if file exists |
| `copyFile(src, dest)` | sourcePath: string, sourceFile: string, destPath: string, destFile: string | Promise\<void\> | Copy file |
| `moveFile(src, dest)` | sourcePath: string, sourceFile: string, destPath: string, destFile: string | Promise\<void\> | Move file |
| `getStorageInfo()` | - | Promise\<StorageInfo\> | Get quota and usage stats |
| `getDirectorySize(path)` | path?: string | Promise\<number\> | Calculate total size (bytes) |

### FileInfo Interface

```typescript
interface FileInfo {
  name: string;
  size: number;
  type: string;
  handle: FileSystemFileHandle;
  lastModified: number;
}
```

## Common Operations

### Create and Write File

```javascript
const fileSystem = new FileSystemService();
await fileSystem.initialize();

// Write text
await fileSystem.writeFile('/', 'note.txt', 'Hello World');

// Write binary
const blob = new Blob(['data'], { type: 'application/octet-stream' });
await fileSystem.writeFile('/documents', 'file.bin', blob);

// Write ArrayBuffer
const buffer = new ArrayBuffer(1024);
await fileSystem.writeFile('/data', 'binary.dat', buffer);
```

### Read and Process Files

```javascript
// Read file
const file = await fileSystem.readFile('/', 'note.txt');
const text = await file.text();

// Stream large files
const file = await fileSystem.readFile('/', 'large-file.mp4');
const stream = file.stream();
const reader = stream.getReader();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  processChunk(value);
}
```

### Directory Operations

```javascript
// Create nested directories
await fileSystem.createDirectory('/documents/2024/reports');

// List with filtering
const files = await fileSystem.listFiles('/documents');
const images = files.filter(f => f.type.startsWith('image/'));

// Recursive size calculation
const size = await fileSystem.getDirectorySize('/documents');
console.log(`Total: ${size} bytes`);
```

## Storage Quota Management

### Check Quota

```javascript
const { usage, quota, percentUsed } = await fileSystem.getStorageInfo();

console.log(`Used: ${usage} / ${quota} bytes (${percentUsed}%)`);

if (percentUsed > 75) {
  alert('Running low on storage');
}
```

### Request Persistent Storage

```javascript
// Request persistence (prevents automatic eviction)
if (navigator.storage?.persist) {
  const isPersisted = await navigator.storage.persist();
  console.log('Persistent:', isPersisted);
}

// Check current persistence status
if (navigator.storage?.persisted) {
  const persisted = await navigator.storage.persisted();
  console.log('Currently persisted:', persisted);
}
```

## File Upload Pattern

### Drag-and-Drop Upload

```javascript
class FileUploadComponent extends HTMLElement {
  connectedCallback() {
    this.addEventListener('drop', async (e) => {
      e.preventDefault();
      
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        await this.uploadFile(file);
      }
    });
    
    this.addEventListener('dragover', (e) => e.preventDefault());
  }
  
  async uploadFile(file) {
    const content = await file.arrayBuffer();
    await fileSystem.writeFile('/', file.name, content);
    this.dispatchEvent(new CustomEvent('file-uploaded', { 
      detail: { name: file.name, size: file.size }
    }));
  }
}
```

### Upload with Progress Tracking

```javascript
async function uploadWithProgress(file, onProgress) {
  const chunkSize = 1024 * 1024; // 1MB chunks
  const chunks = Math.ceil(file.size / chunkSize);
  
  const fileHandle = await root.getFileHandle(file.name, { create: true });
  const writable = await fileHandle.createWritable();
  
  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);
    
    await writable.write(chunk);
    onProgress((i + 1) / chunks * 100);
  }
  
  await writable.close();
}

// Usage
await uploadWithProgress(file, (percent) => {
  console.log(`Upload: ${percent}%`);
});
```

## File Download Pattern

```javascript
async function downloadFile(path, fileName) {
  const file = await fileSystem.readFile(path, fileName);
  const url = URL.createObjectURL(file);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  
  URL.revokeObjectURL(url);
}
```

## File Browser Component

```javascript
class FileBrowser extends HTMLElement {
  async connectedCallback() {
    this.currentPath = '/';
    await this.render();
  }
  
  async render() {
    const files = await fileSystem.listFiles(this.currentPath);
    const dirs = await fileSystem.listDirectories(this.currentPath);
    
    this.innerHTML = `
      <div class="breadcrumb">${this.currentPath}</div>
      
      ${dirs.map(d => `
        <div class="dir" onclick="navigate('${d.name}')">
          📁 ${d.name}
        </div>
      `).join('')}
      
      ${files.map(f => `
        <div class="file" onclick="open('${f.name}')">
          ${this.getIcon(f.type)} ${f.name} (${this.formatSize(f.size)})
        </div>
      `).join('')}
    `;
  }
  
  getIcon(type) {
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎬';
    if (type.startsWith('audio/')) return '🎵';
    if (type === 'application/pdf') return '📄';
    return '📄';
  }
  
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

customElements.define('file-browser', FileBrowser);
```

## Search and Filter

```javascript
class FileSearch {
  async search(query, options = {}) {
    const results = [];
    await this.searchDirectory('/', query, options, results);
    return results.sort((a, b) => b.score - a.score);
  }
  
  async searchDirectory(path, query, options, results) {
    const files = await fileSystem.listFiles(path);
    
    for (const file of files) {
      const score = this.matchFile(file, query, options);
      if (score > 0) {
        results.push({ file, path, score });
      }
    }
    
    if (options.recursive) {
      const dirs = await fileSystem.listDirectories(path);
      for (const dir of dirs) {
        const subPath = `${path}/${dir.name}`.replace('//', '/');
        await this.searchDirectory(subPath, query, options, results);
      }
    }
  }
  
  matchFile(file, query, options) {
    const name = file.name.toLowerCase();
    const q = query.toLowerCase();
    
    let score = 0;
    
    if (name === q) score += 100;
    else if (name.startsWith(q)) score += 50;
    else if (name.includes(q)) score += 25;
    else return 0;
    
    // Filter by type
    if (options.types?.length) {
      const matches = options.types.some(t => file.type.startsWith(t));
      if (!matches) return 0;
      score += 10;
    }
    
    // Filter by size
    if (options.minSize && file.size < options.minSize) return 0;
    if (options.maxSize && file.size > options.maxSize) return 0;
    
    return score;
  }
}

const fileSearch = new FileSearch();

// Usage
const results = await fileSearch.search('photo', {
  types: ['image/'],
  minSize: 1024 * 100, // 100KB min
  recursive: true
});
```

## Component Reference

See Chapter 19 for file management UI components:

- **pan-files**: Complete file manager with browser, upload, quota display
- **pan-file-picker**: File selection dialog
- **pan-image-viewer**: Image preview and editing

## Performance Tips

| Optimization | Implementation | Benefit |
|--------------|----------------|---------|
| **Stream large files** | Use `file.stream()` instead of `file.arrayBuffer()` | Reduce memory usage |
| **Batch operations** | Group multiple writes in single transaction | Improve write speed |
| **Cache handles** | Store FileSystemHandle references | Reduce lookup overhead |
| **Lazy loading** | Load directory contents on demand | Faster initial render |
| **Background cleanup** | Delete temp files in Web Worker | Non-blocking UI |

### Streaming Example

```javascript
async function processLargeFile(path, fileName) {
  const file = await fileSystem.readFile(path, fileName);
  const stream = file.stream();
  const reader = stream.getReader();
  
  let bytesProcessed = 0;
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    await processChunk(value);
    bytesProcessed += value.length;
    updateProgress(bytesProcessed / file.size);
  }
}
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 11 (File Management and OPFS)
- **Components**: Chapter 19 (pan-files, pan-file-picker, pan-image-viewer)
- **Patterns**: Appendix E (File Management Patterns)
- **Related**: Chapter 4 (State Management - IndexedDB), Chapter 12 (Performance)

## Common Issues

### Issue: "NotFoundError" when reading files
**Problem**: File or directory doesn't exist
**Solution**: Check existence with `fileExists()` before reading; handle errors gracefully

### Issue: "QuotaExceededError" on write
**Problem**: Storage quota exceeded
**Solution**: Check available space before write; request persistent storage; implement cleanup

### Issue: Files lost after browser update
**Problem**: Non-persistent storage evicted
**Solution**: Request persistence via `navigator.storage.persist()`; implement cloud backup

### Issue: Slow directory listing with many files
**Problem**: Synchronous iteration blocks UI
**Solution**: Paginate results; use Web Worker for processing; implement virtual scrolling

### Issue: OPFS not available in browser
**Problem**: Older browser or insecure context (non-HTTPS)
**Solution**: Feature detect `navigator.storage?.getDirectory`; provide fallback (IndexedDB)

See *Learning LARC* Chapter 11 for complete file management patterns, image processing, and cloud sync strategies.
