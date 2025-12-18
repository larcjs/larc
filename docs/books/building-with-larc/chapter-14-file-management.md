# File Management

*In which we discover that the browser can store files just like a real computer, learn that "unlimited storage" means "we'll delete your stuff if we feel like it," and find out that OPFS is the best-kept secret in modern web development.*

File management used to be simple: users uploaded files to your server, and your server stored them in folders. But modern web applications demand more—they need to work offline, handle large files without overwhelming your bandwidth budget, and provide instant access to previously loaded content. Enter the Origin Private File System (OPFS), the browser's own file system that gives your web app genuine file storage capabilities.

In this chapter, we'll build comprehensive file management features in LARC: file browsers, upload and download handlers, directory navigation, and smart quota management. By the end, you'll have a file system in your web app that rivals native applications.

## Understanding OPFS: Your App's Private File System

OPFS is like giving your web application its own private hard drive. Unlike LocalStorage (limited to 5-10MB) or IndexedDB (better but still clunky for files), OPFS provides:

- **Large storage capacity**: Gigabytes, not megabytes
- **High performance**: Direct file I/O operations
- **Private to your origin**: Other sites can't access your files
- **Persistent**: Survives page reloads and browser restarts
- **Streaming support**: Handle large files without loading everything into memory

The catch? Storage is "best effort"—browsers can delete it under pressure. But with proper quota management, OPFS is remarkably reliable.

## Getting Started with OPFS

Let's build a comprehensive OPFS wrapper that provides a clean API for file operations:

```typescript
// services/file-system.ts
interface FileInfo {
  name: string;
  size: number;
  type: string;
  handle: FileSystemFileHandle;
  lastModified: number;
}

interface DirectoryInfo {
  name: string;
  handle: FileSystemDirectoryHandle;
  parent?: FileSystemDirectoryHandle;
}

class FileSystemService {
  private root: FileSystemDirectoryHandle | null = null;

  // Initialize the file system
  async initialize(): Promise<void> {
    try {
      this.root = await navigator.storage.getDirectory();
      console.log('OPFS initialized');
    } catch (error) {
      console.error('Failed to initialize OPFS:', error);
      throw new Error('File system not available');
    }
  }

  // Get root directory handle
  private async getRoot(): Promise<FileSystemDirectoryHandle> {
    if (!this.root) {
      await this.initialize();
    }
    return this.root!;
  }

  // Create or get a directory
  async createDirectory(path: string): Promise<FileSystemDirectoryHandle> {
    const root = await this.getRoot();
    const parts = path.split('/').filter(p => p.length > 0);

    let current = root;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part, { create: true });
    }

    return current;
  }

  // Get directory handle
  async getDirectory(path: string): Promise<FileSystemDirectoryHandle> {
    const root = await this.getRoot();
    const parts = path.split('/').filter(p => p.length > 0);

    let current = root;
    for (const part of parts) {
      current = await current.getDirectoryHandle(part);
    }

    return current;
  }

  // List files in a directory
  async listFiles(path: string = '/'): Promise<FileInfo[]> {
    try {
      const dir = path === '/'
        ? await this.getRoot()
        : await this.getDirectory(path);

      const files: FileInfo[] = [];

      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'file') {
          const fileHandle = handle as FileSystemFileHandle;
          const file = await fileHandle.getFile();

          files.push({
            name,
            size: file.size,
            type: file.type,
            handle: fileHandle,
            lastModified: file.lastModified
          });
        }
      }

      return files.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to list files:', error);
      return [];
    }
  }

  // List directories
  async listDirectories(path: string = '/'): Promise<DirectoryInfo[]> {
    try {
      const dir = path === '/'
        ? await this.getRoot()
        : await this.getDirectory(path);

      const directories: DirectoryInfo[] = [];

      for await (const [name, handle] of dir.entries()) {
        if (handle.kind === 'directory') {
          directories.push({
            name,
            handle: handle as FileSystemDirectoryHandle,
            parent: dir
          });
        }
      }

      return directories.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      console.error('Failed to list directories:', error);
      return [];
    }
  }

  // Write file
  async writeFile(
    path: string,
    fileName: string,
    content: Blob | ArrayBuffer | string
  ): Promise<void> {
    try {
      const dir = path === '/'
        ? await this.getRoot()
        : await this.createDirectory(path);

      const fileHandle = await dir.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      if (typeof content === 'string') {
        await writable.write(content);
      } else if (content instanceof ArrayBuffer) {
        await writable.write(new Blob([content]));
      } else {
        await writable.write(content);
      }

      await writable.close();
    } catch (error) {
      console.error('Failed to write file:', error);
      throw error;
    }
  }

  // Read file
  async readFile(path: string, fileName: string): Promise<File> {
    try {
      const dir = path === '/'
        ? await this.getRoot()
        : await this.getDirectory(path);

      const fileHandle = await dir.getFileHandle(fileName);
      return await fileHandle.getFile();
    } catch (error) {
      console.error('Failed to read file:', error);
      throw error;
    }
  }

  // Delete file
  async deleteFile(path: string, fileName: string): Promise<void> {
    try {
      const dir = path === '/'
        ? await this.getRoot()
        : await this.getDirectory(path);

      await dir.removeEntry(fileName);
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  // Delete directory
  async deleteDirectory(path: string, recursive: boolean = false): Promise<void> {
    try {
      const parts = path.split('/').filter(p => p.length > 0);
      const dirName = parts.pop()!;
      const parentPath = parts.join('/');

      const parent = parentPath
        ? await this.getDirectory(parentPath)
        : await this.getRoot();

      await parent.removeEntry(dirName, { recursive });
    } catch (error) {
      console.error('Failed to delete directory:', error);
      throw error;
    }
  }

  // Check if file exists
  async fileExists(path: string, fileName: string): Promise<boolean> {
    try {
      await this.readFile(path, fileName);
      return true;
    } catch {
      return false;
    }
  }

  // Get file handle
  async getFileHandle(
    path: string,
    fileName: string
  ): Promise<FileSystemFileHandle> {
    const dir = path === '/'
      ? await this.getRoot()
      : await this.getDirectory(path);

    return await dir.getFileHandle(fileName);
  }

  // Copy file
  async copyFile(
    sourcePath: string,
    sourceFile: string,
    destPath: string,
    destFile: string
  ): Promise<void> {
    const file = await this.readFile(sourcePath, sourceFile);
    const content = await file.arrayBuffer();
    await this.writeFile(destPath, destFile, content);
  }

  // Move file
  async moveFile(
    sourcePath: string,
    sourceFile: string,
    destPath: string,
    destFile: string
  ): Promise<void> {
    await this.copyFile(sourcePath, sourceFile, destPath, destFile);
    await this.deleteFile(sourcePath, sourceFile);
  }

  // Get storage estimate
  async getStorageInfo(): Promise<{
    usage: number;
    quota: number;
    percentUsed: number;
  }> {
    const estimate = await navigator.storage.estimate();
    const usage = estimate.usage || 0;
    const quota = estimate.quota || 0;
    const percentUsed = quota > 0 ? (usage / quota) * 100 : 0;

    return {
      usage,
      quota,
      percentUsed
    };
  }

  // Calculate directory size
  async getDirectorySize(path: string = '/'): Promise<number> {
    let totalSize = 0;

    const files = await this.listFiles(path);
    for (const file of files) {
      totalSize += file.size;
    }

    const directories = await this.listDirectories(path);
    for (const dir of directories) {
      const subPath = path === '/' ? dir.name : `${path}/${dir.name}`;
      totalSize += await this.getDirectorySize(subPath);
    }

    return totalSize;
  }
}

export const fileSystem = new FileSystemService();
```

## Building a File Browser Component

Now let's create a beautiful, functional file browser that lets users navigate directories and manage files:

```typescript
// components/file-browser.ts
import { html, define, Component } from '@larc/lib';
import { fileSystem, FileInfo, DirectoryInfo } from '../services/file-system';

interface FileBrowserState {
  currentPath: string;
  files: FileInfo[];
  directories: DirectoryInfo[];
  selectedItems: Set<string>;
  isLoading: boolean;
  viewMode: 'list' | 'grid';
  sortBy: 'name' | 'size' | 'date';
  sortOrder: 'asc' | 'desc';
}

class FileBrowser extends Component {
  static tagName = 'file-browser';

  state: FileBrowserState = {
    currentPath: '/',
    files: [],
    directories: [],
    selectedItems: new Set(),
    isLoading: false,
    viewMode: 'list',
    sortBy: 'name',
    sortOrder: 'asc'
  };

  async connectedCallback() {
    super.connectedCallback();
    await fileSystem.initialize();
    await this.loadDirectory('/');
  }

  private async loadDirectory(path: string): Promise<void> {
    this.setState({ isLoading: true, currentPath: path });

    try {
      const [files, directories] = await Promise.all([
        fileSystem.listFiles(path),
        fileSystem.listDirectories(path)
      ]);

      this.setState({
        files: this.sortItems(files),
        directories,
        selectedItems: new Set(),
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to load directory:', error);
      this.setState({ isLoading: false });
    }
  }

  private sortItems(files: FileInfo[]): FileInfo[] {
    const { sortBy, sortOrder } = this.state;
    const sorted = [...files];

    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
          comparison = a.lastModified - b.lastModified;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return sorted;
  }

  private async navigateToDirectory(dirName: string): Promise<void> {
    const newPath = this.state.currentPath === '/'
      ? `/${dirName}`
      : `${this.state.currentPath}/${dirName}`;

    await this.loadDirectory(newPath);
  }

  private async navigateUp(): Promise<void> {
    const parts = this.state.currentPath.split('/').filter(p => p.length > 0);
    parts.pop();
    const newPath = parts.length > 0 ? `/${parts.join('/')}` : '/';
    await this.loadDirectory(newPath);
  }

  private toggleSelection(name: string): void {
    const selectedItems = new Set(this.state.selectedItems);

    if (selectedItems.has(name)) {
      selectedItems.delete(name);
    } else {
      selectedItems.add(name);
    }

    this.setState({ selectedItems });
  }

  private async deleteSelected(): Promise<void> {
    if (!confirm('Delete selected items?')) return;

    const { currentPath, selectedItems } = this.state;

    for (const name of selectedItems) {
      try {
        await fileSystem.deleteFile(currentPath, name);
      } catch (error) {
        console.error(`Failed to delete ${name}:`, error);
      }
    }

    await this.loadDirectory(currentPath);
  }

  private async createFolder(): Promise<void> {
    const name = prompt('Folder name:');
    if (!name) return;

    try {
      const newPath = this.state.currentPath === '/'
        ? name
        : `${this.state.currentPath}/${name}`;

      await fileSystem.createDirectory(newPath);
      await this.loadDirectory(this.state.currentPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder');
    }
  }

  private async downloadFile(file: FileInfo): Promise<void> {
    try {
      const fileData = await fileSystem.readFile(this.state.currentPath, file.name);
      const url = URL.createObjectURL(fileData);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      alert('Failed to download file');
    }
  }

  render() {
    const {
      currentPath,
      files,
      directories,
      selectedItems,
      isLoading,
      viewMode,
      sortBy,
      sortOrder
    } = this.state;

    return html`
      <div class="file-browser">
        <!-- Toolbar -->
        <div class="toolbar">
          <div class="breadcrumbs">
            <button
              class="breadcrumb"
              onclick="${() => this.loadDirectory('/')}"
            >
              Home
            </button>
            ${currentPath.split('/').filter(p => p).map((part, i, arr) => {
              const path = '/' + arr.slice(0, i + 1).join('/');
              return html`
                <span class="separator">/</span>
                <button
                  class="breadcrumb"
                  onclick="${() => this.loadDirectory(path)}"
                >
                  ${part}
                </button>
              `;
            })}
          </div>

          <div class="toolbar-actions">
            <button
              class="btn btn-icon"
              onclick="${this.createFolder}"
              title="New Folder"
            >
              [folder]
            </button>

            <button
              class="btn btn-icon"
              onclick="${this.deleteSelected}"
              disabled="${selectedItems.size === 0}"
              title="Delete Selected"
            >
              [trash]
            </button>

            <button
              class="btn btn-icon"
              onclick="${() => this.setState({
                viewMode: viewMode === 'list' ? 'grid' : 'list'
              })}"
              title="Toggle View"
            >
              ${viewMode === 'list' ? '[+]' : '[menu]'}
            </button>
          </div>
        </div>

        <!-- Sort Controls -->
        <div class="sort-controls">
          <select
            value="${sortBy}"
            onchange="${(e: Event) => {
              this.setState({
                sortBy: (e.target as HTMLSelectElement).value as any,
                files: this.sortItems(files)
              });
            }}"
          >
            <option value="name">Name</option>
            <option value="size">Size</option>
            <option value="date">Date</option>
          </select>

          <button
            class="btn btn-icon"
            onclick="${() => {
              this.setState({
                sortOrder: sortOrder === 'asc' ? 'desc' : 'asc',
                files: this.sortItems(files)
              });
            }}"
          >
            ${sortOrder === 'asc' ? '^' : 'v'}
          </button>
        </div>

        <!-- Content Area -->
        <div class="content ${viewMode}">
          ${isLoading ? html`
            <div class="loading">Loading...</div>
          ` : html`
            <!-- Parent Directory Link -->
            ${currentPath !== '/' ? html`
              <div class="item directory" onclick="${this.navigateUp}">
                <div class="item-icon">[folder]</div>
                <div class="item-name">..</div>
              </div>
            ` : ''}

            <!-- Directories -->
            ${directories.map(dir => html`
              <div
                class="item directory"
                onclick="${() => this.navigateToDirectory(dir.name)}"
              >
                <div class="item-icon">[folder]</div>
                <div class="item-name">${dir.name}</div>
              </div>
            `)}

            <!-- Files -->
            ${files.map(file => html`
              <div
                class="item file ${selectedItems.has(file.name) ? 'selected' : ''}"
                onclick="${(e: MouseEvent) => {
                  if (e.ctrlKey || e.metaKey) {
                    this.toggleSelection(file.name);
                  } else {
                    this.downloadFile(file);
                  }
                }}"
              >
                <div class="item-icon">${this.getFileIcon(file.type)}</div>
                <div class="item-name">${file.name}</div>
                <div class="item-size">${this.formatSize(file.size)}</div>
                <div class="item-date">
                  ${new Date(file.lastModified).toLocaleDateString()}
                </div>
              </div>
            `)}

            ${files.length === 0 && directories.length === 0 ? html`
              <div class="empty">This folder is empty</div>
            ` : ''}
          `}
        </div>
      </div>

      <style>
        .file-browser {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: white;
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .toolbar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border-bottom: 1px solid #ddd;
          background: #f8f9fa;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .breadcrumb {
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          color: #007bff;
          border-radius: 4px;
        }

        .breadcrumb:hover {
          background: rgba(0, 123, 255, 0.1);
        }

        .separator {
          color: #6c757d;
        }

        .toolbar-actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-icon {
          padding: 0.5rem;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1.2rem;
        }

        .btn-icon:hover:not(:disabled) {
          background: #f8f9fa;
        }

        .btn-icon:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .sort-controls {
          display: flex;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-bottom: 1px solid #ddd;
          background: #f8f9fa;
        }

        .content {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
        }

        .content.list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .content.grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
          gap: 1rem;
        }

        .item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .content.grid .item {
          flex-direction: column;
          text-align: center;
        }

        .item:hover {
          background: #f8f9fa;
          border-color: #007bff;
        }

        .item.selected {
          background: #e7f3ff;
          border-color: #007bff;
        }

        .item.directory {
          font-weight: 500;
        }

        .item-icon {
          font-size: 2rem;
        }

        .item-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .content.grid .item-name {
          width: 100%;
        }

        .item-size, .item-date {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .content.grid .item-size,
        .content.grid .item-date {
          display: none;
        }

        .loading, .empty {
          padding: 2rem;
          text-align: center;
          color: #6c757d;
        }
      </style>
    `;
  }

  private getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '[image]';
    if (type.startsWith('video/')) return '[video]';
    if (type.startsWith('audio/')) return '[audio]';
    if (type.startsWith('text/')) return '[file]';
    if (type === 'application/pdf') return '[PDF]';
    if (type.includes('zip') || type.includes('compressed')) return '[package]';
    return '[file]';
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

define(FileBrowser);
```

## File Upload and Download

Let's create a comprehensive upload component with drag-and-drop, progress tracking, and validation:

```typescript
// components/file-upload.ts
import { html, define, Component } from '@larc/lib';
import { fileSystem } from '../services/file-system';

interface FileUploadState {
  uploads: Map<string, {
    file: File;
    progress: number;
    status: 'pending' | 'uploading' | 'complete' | 'error';
    error?: string;
  }>;
  isDragging: boolean;
}

interface FileUploadProps {
  path?: string;
  maxSize?: number;
  acceptedTypes?: string[];
  multiple?: boolean;
  onUploadComplete?: (files: File[]) => void;
}

class FileUpload extends Component<FileUploadProps> {
  static tagName = 'file-upload';

  state: FileUploadState = {
    uploads: new Map(),
    isDragging: false
  };

  private fileInputRef: HTMLInputElement | null = null;

  private handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    this.setState({ isDragging: true });
  };

  private handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    this.setState({ isDragging: false });
  };

  private handleDragOver = (e: DragEvent) => {
    e.preventDefault();
  };

  private handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    this.setState({ isDragging: false });

    const files = Array.from(e.dataTransfer?.files || []);
    await this.processFiles(files);
  };

  private handleFileSelect = async (e: Event) => {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    await this.processFiles(files);

    // Reset input
    input.value = '';
  };

  private async processFiles(files: File[]): Promise<void> {
    const { maxSize, acceptedTypes, multiple } = this.props;

    // Filter and validate files
    const validFiles = files.filter(file => {
      // Check size
      if (maxSize && file.size > maxSize) {
        this.addError(file, `File too large (max ${this.formatSize(maxSize)})`);
        return false;
      }

      // Check type
      if (acceptedTypes && acceptedTypes.length > 0) {
        const isAccepted = acceptedTypes.some(type => {
          if (type.endsWith('/*')) {
            const category = type.split('/')[0];
            return file.type.startsWith(category + '/');
          }
          return file.type === type;
        });

        if (!isAccepted) {
          this.addError(file, 'File type not accepted');
          return false;
        }
      }

      return true;
    });

    // Limit to one file if not multiple
    const filesToUpload = multiple ? validFiles : validFiles.slice(0, 1);

    // Start uploads
    for (const file of filesToUpload) {
      await this.uploadFile(file);
    }
  }

  private addError(file: File, error: string): void {
    const uploads = new Map(this.state.uploads);
    uploads.set(file.name, {
      file,
      progress: 0,
      status: 'error',
      error
    });
    this.setState({ uploads });
  }

  private async uploadFile(file: File): Promise<void> {
    const uploads = new Map(this.state.uploads);

    // Add to upload list
    uploads.set(file.name, {
      file,
      progress: 0,
      status: 'pending'
    });
    this.setState({ uploads });

    try {
      // Update status to uploading
      const upload = uploads.get(file.name)!;
      upload.status = 'uploading';
      this.setState({ uploads: new Map(uploads) });

      // Simulate progress (in real app, track actual upload progress)
      const progressInterval = setInterval(() => {
        const current = uploads.get(file.name);
        if (current && current.status === 'uploading' && current.progress < 90) {
          current.progress += 10;
          this.setState({ uploads: new Map(uploads) });
        }
      }, 100);

      // Write file to OPFS
      const path = this.props.path || '/';
      const content = await file.arrayBuffer();
      await fileSystem.writeFile(path, file.name, content);

      clearInterval(progressInterval);

      // Mark as complete
      upload.progress = 100;
      upload.status = 'complete';
      this.setState({ uploads: new Map(uploads) });

      // Notify parent
      if (this.props.onUploadComplete) {
        this.props.onUploadComplete([file]);
      }

      // Remove from list after 2 seconds
      setTimeout(() => {
        const current = new Map(this.state.uploads);
        current.delete(file.name);
        this.setState({ uploads: current });
      }, 2000);
    } catch (error) {
      const upload = uploads.get(file.name)!;
      upload.status = 'error';
      upload.error = error instanceof Error ? error.message : 'Upload failed';
      this.setState({ uploads: new Map(uploads) });
    }
  }

  private formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  render() {
    const { uploads, isDragging } = this.state;
    const { multiple = true, acceptedTypes } = this.props;

    return html`
      <div class="file-upload">
        <div
          class="drop-zone ${isDragging ? 'dragging' : ''}"
          ondragenter="${this.handleDragEnter}"
          ondragleave="${this.handleDragLeave}"
          ondragover="${this.handleDragOver}"
          ondrop="${this.handleDrop}"
          onclick="${() => this.fileInputRef?.click()}"
        >
          <div class="drop-zone-content">
            <div class="upload-icon">[upload]</div>
            <div class="upload-text">
              <strong>Drop files here</strong> or click to browse
            </div>
            ${acceptedTypes ? html`
              <div class="accepted-types">
                Accepted: ${acceptedTypes.join(', ')}
              </div>
            ` : ''}
          </div>
        </div>

        <input
          type="file"
          ref="${(el: HTMLInputElement) => this.fileInputRef = el}"
          onchange="${this.handleFileSelect}"
          multiple="${multiple}"
          accept="${acceptedTypes?.join(',') || ''}"
          style="display: none;"
        />

        ${uploads.size > 0 ? html`
          <div class="upload-list">
            ${Array.from(uploads.entries()).map(([name, upload]) => html`
              <div class="upload-item ${upload.status}">
                <div class="upload-info">
                  <div class="upload-name">${name}</div>
                  <div class="upload-size">${this.formatSize(upload.file.size)}</div>
                </div>

                ${upload.status === 'uploading' ? html`
                  <div class="progress-bar">
                    <div
                      class="progress-fill"
                      style="width: ${upload.progress}%"
                    ></div>
                  </div>
                ` : ''}

                ${upload.status === 'complete' ? html`
                  <div class="upload-status success">[v] Complete</div>
                ` : ''}

                ${upload.status === 'error' ? html`
                  <div class="upload-status error">
                    [x] ${upload.error}
                  </div>
                ` : ''}
              </div>
            `)}
          </div>
        ` : ''}
      </div>

      <style>
        .file-upload {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .drop-zone {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 3rem;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          background: #f8f9fa;
        }

        .drop-zone:hover {
          border-color: #007bff;
          background: #e7f3ff;
        }

        .drop-zone.dragging {
          border-color: #007bff;
          background: #e7f3ff;
          transform: scale(1.02);
        }

        .upload-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .upload-text {
          font-size: 1.1rem;
          margin-bottom: 0.5rem;
        }

        .accepted-types {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .upload-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .upload-item {
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        }

        .upload-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 0.5rem;
        }

        .upload-name {
          font-weight: 500;
        }

        .upload-size {
          color: #6c757d;
          font-size: 0.875rem;
        }

        .progress-bar {
          height: 4px;
          background: #e9ecef;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #007bff;
          transition: width 0.3s ease;
        }

        .upload-status {
          margin-top: 0.5rem;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .upload-status.success {
          color: #28a745;
        }

        .upload-status.error {
          color: #dc3545;
        }
      </style>
    `;
  }
}

define(FileUpload);
```

## Storage Quota Management

Managing storage quotas is crucial—browsers can be generous with space, but they can also delete your data without asking. Let's build a quota monitoring component:

```typescript
// components/storage-quota.ts
import { html, define, Component } from '@larc/lib';
import { fileSystem } from '../services/file-system';

interface StorageQuotaState {
  usage: number;
  quota: number;
  percentUsed: number;
  isLoading: boolean;
}

class StorageQuota extends Component {
  static tagName = 'storage-quota';

  state: StorageQuotaState = {
    usage: 0,
    quota: 0,
    percentUsed: 0,
    isLoading: true
  };

  async connectedCallback() {
    super.connectedCallback();
    await this.updateQuota();

    // Update every 30 seconds
    setInterval(() => {
      this.updateQuota();
    }, 30000);
  }

  private async updateQuota(): Promise<void> {
    try {
      const info = await fileSystem.getStorageInfo();
      this.setState({
        ...info,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to get storage info:', error);
      this.setState({ isLoading: false });
    }
  }

  private async requestPersistence(): Promise<void> {
    if (!navigator.storage?.persist) {
      alert('Persistent storage not supported');
      return;
    }

    try {
      const isPersisted = await navigator.storage.persist();
      if (isPersisted) {
        alert('Storage is now persistent!');
      } else {
        alert('Persistence request denied');
      }
    } catch (error) {
      console.error('Failed to request persistence:', error);
      alert('Failed to request persistence');
    }
  }

  render() {
    const { usage, quota, percentUsed, isLoading } = this.state;

    if (isLoading) {
      return html`<div class="storage-quota loading">Loading...</div>`;
    }

    const getStatusClass = () => {
      if (percentUsed > 90) return 'danger';
      if (percentUsed > 75) return 'warning';
      return 'normal';
    };

    return html`
      <div class="storage-quota">
        <div class="quota-header">
          <h4>Storage Usage</h4>
          <button
            class="btn btn-small"
            onclick="${this.requestPersistence}"
          >
            Request Persistent Storage
          </button>
        </div>

        <div class="quota-bar ${getStatusClass()}">
          <div class="quota-fill" style="width: ${percentUsed}%"></div>
        </div>

        <div class="quota-info">
          <div class="quota-stat">
            <span class="label">Used:</span>
            <span class="value">${this.formatBytes(usage)}</span>
          </div>
          <div class="quota-stat">
            <span class="label">Available:</span>
            <span class="value">${this.formatBytes(quota)}</span>
          </div>
          <div class="quota-stat">
            <span class="label">Percentage:</span>
            <span class="value">${percentUsed.toFixed(1)}%</span>
          </div>
        </div>

        ${percentUsed > 75 ? html`
          <div class="quota-warning">
            [warning] Running low on storage space. Consider cleaning up old files.
          </div>
        ` : ''}
      </div>

      <style>
        .storage-quota {
          padding: 1.5rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
        }

        .quota-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .quota-header h4 {
          margin: 0;
        }

        .btn-small {
          padding: 0.5rem 1rem;
          border: 1px solid #007bff;
          background: white;
          color: #007bff;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
        }

        .btn-small:hover {
          background: #007bff;
          color: white;
        }

        .quota-bar {
          height: 24px;
          background: #e9ecef;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 1rem;
        }

        .quota-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .quota-bar.normal .quota-fill { background: #28a745; }
        .quota-bar.warning .quota-fill { background: #ffc107; }
        .quota-bar.danger .quota-fill { background: #dc3545; }

        .quota-info {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .quota-stat {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .quota-stat .label {
          font-size: 0.875rem;
          color: #6c757d;
        }

        .quota-stat .value {
          font-size: 1.25rem;
          font-weight: 500;
        }

        .quota-warning {
          padding: 0.75rem;
          background: #fff3cd;
          border: 1px solid #ffc107;
          border-radius: 4px;
          color: #856404;
        }
      </style>
    `;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

define(StorageQuota);
```

## File Type Filtering and Search

Let's add powerful filtering and search capabilities:

```typescript
// services/file-search.ts
import { fileSystem, FileInfo } from './file-system';

interface SearchOptions {
  query?: string;
  types?: string[];
  minSize?: number;
  maxSize?: number;
  fromDate?: Date;
  toDate?: Date;
  path?: string;
  recursive?: boolean;
}

interface SearchResult {
  file: FileInfo;
  path: string;
  score: number;
}

class FileSearchService {
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    await this.searchDirectory(options.path || '/', options, results);

    // Sort by relevance score
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  private async searchDirectory(
    path: string,
    options: SearchOptions,
    results: SearchResult[]
  ): Promise<void> {
    const files = await fileSystem.listFiles(path);

    for (const file of files) {
      const score = this.calculateScore(file, options);

      if (score > 0) {
        results.push({ file, path, score });
      }
    }

    // Search subdirectories if recursive
    if (options.recursive) {
      const directories = await fileSystem.listDirectories(path);

      for (const dir of directories) {
        const subPath = path === '/' ? `/${dir.name}` : `${path}/${dir.name}`;
        await this.searchDirectory(subPath, options, results);
      }
    }
  }

  private calculateScore(file: FileInfo, options: SearchOptions): number {
    let score = 0;

    // Check query match
    if (options.query) {
      const query = options.query.toLowerCase();
      const name = file.name.toLowerCase();

      if (name === query) {
        score += 100; // Exact match
      } else if (name.startsWith(query)) {
        score += 50; // Starts with
      } else if (name.includes(query)) {
        score += 25; // Contains
      } else {
        return 0; // No match
      }
    }

    // Check type filter
    if (options.types && options.types.length > 0) {
      const matchesType = options.types.some(type => {
        if (type.endsWith('/*')) {
          const category = type.split('/')[0];
          return file.type.startsWith(category + '/');
        }
        return file.type === type;
      });

      if (!matchesType) return 0;
      score += 10;
    }

    // Check size filters
    if (options.minSize !== undefined && file.size < options.minSize) {
      return 0;
    }

    if (options.maxSize !== undefined && file.size > options.maxSize) {
      return 0;
    }

    // Check date filters
    if (options.fromDate && file.lastModified < options.fromDate.getTime()) {
      return 0;
    }

    if (options.toDate && file.lastModified > options.toDate.getTime()) {
      return 0;
    }

    return score;
  }
}

export const fileSearch = new FileSearchService();
```

## Putting It All Together

Let's create a complete file manager component that combines everything:

```typescript
// components/file-manager.ts
import { html, define, Component } from '@larc/lib';
import './file-browser';
import './file-upload';
import './storage-quota';

interface FileManagerState {
  currentView: 'browser' | 'upload' | 'settings';
}

class FileManager extends Component {
  static tagName = 'file-manager';

  state: FileManagerState = {
    currentView: 'browser'
  };

  render() {
    const { currentView } = this.state;

    return html`
      <div class="file-manager">
        <div class="sidebar">
          <h3>File Manager</h3>

          <nav class="nav">
            <button
              class="nav-item ${currentView === 'browser' ? 'active' : ''}"
              onclick="${() => this.setState({ currentView: 'browser' })}"
            >
              [folder] Browse Files
            </button>

            <button
              class="nav-item ${currentView === 'upload' ? 'active' : ''}"
              onclick="${() => this.setState({ currentView: 'upload' })}"
            >
              [upload] Upload
            </button>

            <button
              class="nav-item ${currentView === 'settings' ? 'active' : ''}"
              onclick="${() => this.setState({ currentView: 'settings' })}"
            >
              [gear] Storage
            </button>
          </nav>
        </div>

        <div class="main-content">
          ${currentView === 'browser' ? html`
            <file-browser></file-browser>
          ` : ''}

          ${currentView === 'upload' ? html`
            <div class="upload-view">
              <h2>Upload Files</h2>
              <file-upload
                path="/"
                maxSize="${50 * 1024 * 1024}"
                multiple="${true}"
              ></file-upload>
            </div>
          ` : ''}

          ${currentView === 'settings' ? html`
            <div class="settings-view">
              <h2>Storage Settings</h2>
              <storage-quota></storage-quota>
            </div>
          ` : ''}
        </div>
      </div>

      <style>
        .file-manager {
          display: grid;
          grid-template-columns: 250px 1fr;
          height: 100vh;
          overflow: hidden;
        }

        .sidebar {
          padding: 1.5rem;
          background: #f8f9fa;
          border-right: 1px solid #ddd;
        }

        .sidebar h3 {
          margin: 0 0 1.5rem 0;
        }

        .nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          border: none;
          background: transparent;
          border-radius: 4px;
          cursor: pointer;
          text-align: left;
          font-size: 1rem;
        }

        .nav-item:hover {
          background: rgba(0, 0, 0, 0.05);
        }

        .nav-item.active {
          background: #007bff;
          color: white;
        }

        .main-content {
          padding: 1.5rem;
          overflow-y: auto;
        }

        .upload-view, .settings-view {
          max-width: 800px;
        }

        .upload-view h2, .settings-view h2 {
          margin-top: 0;
        }
      </style>
    `;
  }
}

define(FileManager);
```

## What We've Learned

In this chapter, we've built a comprehensive file management system for LARC applications:

- **OPFS integration** with a clean, promise-based API for file operations
- **File browser component** with list and grid views, sorting, and navigation
- **Upload handling** with drag-and-drop, progress tracking, and validation
- **Storage quota management** with monitoring and persistence requests
- **File search and filtering** capabilities for finding files quickly
- **Complete file manager** that combines all features into a cohesive interface

File management in the browser has evolved from "upload to server" to "the browser IS the file system." With OPFS, your LARC applications can provide native-app-like file handling with offline support, fast access, and the web's inherent advantages of zero-install deployment.

You now have the tools to build applications that handle files like a pro—whether you're building a photo editor, document manager, or any app that needs to work with files locally. Just remember to be mindful of storage quotas, request persistence when appropriate, and always have a backup strategy for important user data.

The browser's file system is powerful, but it's not Fort Knox—treat it as temporary storage that happens to persist, and you'll build resilient applications that users can trust.
