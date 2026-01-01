/**
 * @fileoverview PAN Storage - Storage adapters for route persistence
 *
 * Provides pluggable storage backends for persisting routing configuration.
 *
 * @example
 * // Use localStorage
 * const storage = new LocalStorageAdapter('pan-routes');
 * pan.routes.useStorage(storage);
 *
 * @example
 * // Use custom HTTP backend
 * const storage = new HttpStorageAdapter({
 *   loadUrl: '/api/routes',
 *   saveUrl: '/api/routes'
 * });
 * pan.routes.useStorage(storage);
 */

/**
 * Base storage interface
 */
export class StorageAdapter {
  async load() {
    throw new Error('load() must be implemented');
  }

  async save(routes) {
    throw new Error('save() must be implemented');
  }
}

/**
 * LocalStorage adapter for route persistence
 */
export class LocalStorageAdapter extends StorageAdapter {
  constructor(key = 'pan-routes') {
    super();
    this.key = key;
  }

  async load() {
    try {
      const data = localStorage.getItem(this.key);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('[PAN Storage] Failed to load from localStorage:', err);
      return [];
    }
  }

  async save(routes) {
    try {
      const data = JSON.stringify(routes, null, 2);
      localStorage.setItem(this.key, data);
    } catch (err) {
      console.error('[PAN Storage] Failed to save to localStorage:', err);
      throw err;
    }
  }
}

/**
 * SessionStorage adapter for route persistence
 */
export class SessionStorageAdapter extends StorageAdapter {
  constructor(key = 'pan-routes') {
    super();
    this.key = key;
  }

  async load() {
    try {
      const data = sessionStorage.getItem(this.key);
      if (!data) return [];

      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('[PAN Storage] Failed to load from sessionStorage:', err);
      return [];
    }
  }

  async save(routes) {
    try {
      const data = JSON.stringify(routes, null, 2);
      sessionStorage.setItem(this.key, data);
    } catch (err) {
      console.error('[PAN Storage] Failed to save to sessionStorage:', err);
      throw err;
    }
  }
}

/**
 * HTTP storage adapter for remote route persistence
 */
export class HttpStorageAdapter extends StorageAdapter {
  constructor(options = {}) {
    super();
    this.loadUrl = options.loadUrl || '/api/pan/routes';
    this.saveUrl = options.saveUrl || '/api/pan/routes';
    this.headers = options.headers || { 'Content-Type': 'application/json' };
    this.credentials = options.credentials || 'same-origin';
  }

  async load() {
    try {
      const response = await fetch(this.loadUrl, {
        method: 'GET',
        headers: this.headers,
        credentials: this.credentials
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('[PAN Storage] Failed to load from HTTP:', err);
      return [];
    }
  }

  async save(routes) {
    try {
      const response = await fetch(this.saveUrl, {
        method: 'POST',
        headers: this.headers,
        credentials: this.credentials,
        body: JSON.stringify(routes)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[PAN Storage] Failed to save to HTTP:', err);
      throw err;
    }
  }
}

/**
 * In-memory storage (no persistence, for testing)
 */
export class MemoryStorageAdapter extends StorageAdapter {
  constructor() {
    super();
    this.data = [];
  }

  async load() {
    return [...this.data];
  }

  async save(routes) {
    this.data = [...routes];
  }
}

/**
 * Composite storage adapter (tries multiple backends)
 */
export class CompositeStorageAdapter extends StorageAdapter {
  constructor(adapters = []) {
    super();
    this.adapters = adapters;
  }

  async load() {
    for (const adapter of this.adapters) {
      try {
        const routes = await adapter.load();
        if (routes.length > 0) return routes;
      } catch (err) {
        console.warn('[PAN Storage] Adapter failed, trying next:', err);
      }
    }
    return [];
  }

  async save(routes) {
    const errors = [];

    for (const adapter of this.adapters) {
      try {
        await adapter.save(routes);
      } catch (err) {
        errors.push(err);
      }
    }

    if (errors.length === this.adapters.length) {
      throw new Error('All storage adapters failed');
    }
  }
}

/**
 * Debounced storage wrapper
 * Useful for reducing save frequency during rapid route changes
 */
export class DebouncedStorageAdapter extends StorageAdapter {
  constructor(adapter, delayMs = 1000) {
    super();
    this.adapter = adapter;
    this.delayMs = delayMs;
    this.timer = null;
    this.pending = null;
  }

  async load() {
    return this.adapter.load();
  }

  async save(routes) {
    // Cancel pending save
    if (this.timer) {
      clearTimeout(this.timer);
    }

    // Store pending data
    this.pending = routes;

    // Schedule save
    return new Promise((resolve, reject) => {
      this.timer = setTimeout(async () => {
        try {
          await this.adapter.save(this.pending);
          this.pending = null;
          this.timer = null;
          resolve();
        } catch (err) {
          reject(err);
        }
      }, this.delayMs);
    });
  }

  /**
   * Force immediate save of pending data
   */
  async flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    if (this.pending) {
      await this.adapter.save(this.pending);
      this.pending = null;
    }
  }
}

export default {
  StorageAdapter,
  LocalStorageAdapter,
  SessionStorageAdapter,
  HttpStorageAdapter,
  MemoryStorageAdapter,
  CompositeStorageAdapter,
  DebouncedStorageAdapter
};
