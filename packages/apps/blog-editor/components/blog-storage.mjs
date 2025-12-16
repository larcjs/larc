/**
 * blog-storage
 *
 * IndexedDB persistence for blog drafts.
 * Handles saving and loading blog content and metadata.
 *
 * Features:
 * - IndexedDB-based storage
 * - Auto-recovery on page load
 * - Multiple draft support (future)
 *
 * PAN Events:
 * - blog.storage.save: { markdown, metadata?, timestamp }
 * - blog.storage.load: {} - triggers load
 * - blog.draft.loaded: { markdown, metadata, timestamp }
 */

const DB_NAME = 'blog-editor-db';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const CURRENT_DRAFT_KEY = 'current';

class BlogStorage {
  constructor() {
    this._db = null;
    this._init();
  }

  async _init() {
    try {
      await this._openDatabase();
      this._setupPanListeners();
      console.log('blog-storage: initialized');
    } catch (error) {
      console.error('blog-storage: failed to initialize', error);
    }
  }

  _openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this._db = request.result;
        resolve(this._db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create drafts store
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  _setupPanListeners() {
    // Wait for DOM
    const setup = () => {
      const bus = document.querySelector('pan-bus');
      if (!bus) {
        setTimeout(setup, 100);
        return;
      }

      // Save draft
      bus.subscribe('blog.storage.save', async (envelope) => {
        const data = envelope.data || envelope;
        await this._saveDraft(data);
      });

      // Load draft
      bus.subscribe('blog.storage.load', async () => {
        await this._loadDraft();
      });

      // Also capture metadata changes
      bus.subscribe('blog.meta.changed', (envelope) => {
        this._pendingMetadata = envelope.data || envelope;
      });

      // Auto-load on startup (slight delay to let components initialize)
      setTimeout(() => this._loadDraft(), 500);
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', setup);
    } else {
      setup();
    }
  }

  async _saveDraft(data) {
    if (!this._db) {
      console.warn('blog-storage: database not ready');
      return;
    }

    try {
      const draft = {
        id: CURRENT_DRAFT_KEY,
        markdown: data.markdown || '',
        metadata: this._pendingMetadata || data.metadata || {},
        timestamp: data.timestamp || Date.now()
      };

      await this._put(STORE_NAME, draft);
      console.log('blog-storage: draft saved');
    } catch (error) {
      console.error('blog-storage: failed to save draft', error);
    }
  }

  async _loadDraft() {
    if (!this._db) {
      console.warn('blog-storage: database not ready');
      return;
    }

    try {
      const draft = await this._get(STORE_NAME, CURRENT_DRAFT_KEY);

      if (draft) {
        const bus = document.querySelector('pan-bus');
        bus?.publish('blog.draft.loaded', {
          markdown: draft.markdown || '',
          metadata: draft.metadata || {},
          timestamp: draft.timestamp
        });
        console.log('blog-storage: draft loaded');
      } else {
        // No draft found, load default content
        const bus = document.querySelector('pan-bus');
        bus?.publish('blog.draft.loaded', {
          markdown: this._getDefaultContent(),
          metadata: {
            title: '',
            excerpt: '',
            tags: [],
            status: 'draft'
          },
          timestamp: Date.now()
        });
      }
    } catch (error) {
      console.error('blog-storage: failed to load draft', error);
    }
  }

  _getDefaultContent() {
    return `# Welcome to Blog Editor

This is a **markdown** editor with *live preview*.

## Features

- Switch between **Source** and **Visual** editing modes
- Toggle feature groups in the toolbar
- Your drafts are **automatically saved** locally

## Getting Started

1. Add a title above
2. Start writing your content here
3. Toggle features using the toolbar buttons
4. Click the gear icon to see the **Production Mode** demo

---

> This editor demonstrates LARC's progressive enhancement system - add features without a build step!
`;
  }

  // IndexedDB helpers
  _put(storeName, item) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  _get(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  _delete(storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = this._db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Public API
  async saveDraft(markdown, metadata) {
    await this._saveDraft({ markdown, metadata, timestamp: Date.now() });
  }

  async loadDraft() {
    return this._get(STORE_NAME, CURRENT_DRAFT_KEY);
  }

  async clearDraft() {
    await this._delete(STORE_NAME, CURRENT_DRAFT_KEY);
  }
}

// Create instance (element-less, just listens to PAN)
const blogStorage = new BlogStorage();

// Also register as custom element for explicit usage
export class BlogStorageElement extends HTMLElement {
  connectedCallback() {
    // Storage already initialized via singleton
  }
}

customElements.define('blog-storage', BlogStorageElement);
export default blogStorage;
