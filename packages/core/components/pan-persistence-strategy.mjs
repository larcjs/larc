/**
 * pan-persistence-strategy - Declarative persistence routing
 *
 * Routes state to different storage backends (memory, localStorage, IndexedDB)
 * based on topic patterns. Supports TTL, size limits, and automatic hydration.
 *
 * @example
 * <pan-persistence-strategy auto-hydrate debug>
 *   <strategy topics="session.*" storage="memory" ttl="1800000"></strategy>
 *   <strategy topics="user.preferences.*" storage="localStorage"></strategy>
 *   <strategy topics="*.list.*" storage="indexedDB" database="app-data"></strategy>
 * </pan-persistence-strategy>
 *
 * @attribute {boolean} auto-hydrate - Automatically load persisted state on init
 * @attribute {boolean} debug - Enable debug logging
 *
 * @topic persist.hydrated - All state has been hydrated
 * @topic persist.saved - State was persisted
 * @topic persist.error - Persistence error occurred
 */

export class PanPersistenceStrategy extends HTMLElement {
  static observedAttributes = ['auto-hydrate', 'debug'];

  constructor() {
    super();
    this._strategies = [];
    this._subscriptions = new Map();
    this._ttlTimers = new Map();
    this._panClient = null;
    this._db = null;
    this._initialized = false;
  }

  connectedCallback() {
    this._waitForPanBus().then(() => {
      this._initialize();
    });
  }

  disconnectedCallback() {
    this._cleanup();
  }

  async _waitForPanBus() {
    let panBus = document.querySelector('pan-bus');

    if (panBus && panBus.panClient) {
      return;
    }

    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        panBus = document.querySelector('pan-bus');
        if (panBus && panBus.panClient) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  async _initialize() {
    if (this._initialized) return;

    this._panClient = this._getPanClient();
    if (!this._panClient) {
      console.error('pan-persistence-strategy could not find pan-client');
      return;
    }

    // Parse strategy elements
    this._parseStrategies();

    // Initialize IndexedDB if needed
    if (this._strategies.some(s => s.storage === 'indexedDB')) {
      await this._initIndexedDB();
    }

    // Subscribe to topics
    for (const strategy of this._strategies) {
      this._subscribeToTopics(strategy);
    }

    // Auto-hydrate if enabled
    if (this.hasAttribute('auto-hydrate')) {
      await this._hydrateAll();
    }

    this._initialized = true;
    this._log('Initialized', { strategies: this._strategies.length });
  }

  _cleanup() {
    // Unsubscribe from all topics
    for (const [topic, handler] of this._subscriptions.entries()) {
      this._panClient?.unsubscribe(topic, handler);
    }
    this._subscriptions.clear();

    // Clear TTL timers
    for (const timer of this._ttlTimers.values()) {
      clearTimeout(timer);
    }
    this._ttlTimers.clear();

    if (this._db) {
      this._db.close();
      this._db = null;
    }

    this._initialized = false;
  }

  _parseStrategies() {
    const strategyElements = this.querySelectorAll('strategy');

    for (const el of strategyElements) {
      const topics = el.getAttribute('topics') || '*';
      const storage = el.getAttribute('storage') || 'memory';
      const ttl = parseInt(el.getAttribute('ttl') || '0', 10);
      const database = el.getAttribute('database') || 'pan-persistence';
      const maxSize = parseInt(el.getAttribute('max-size') || '0', 10);
      const compress = el.hasAttribute('compress');

      this._strategies.push({
        topics: topics.split(',').map(t => t.trim()),
        storage,
        ttl,
        database,
        maxSize,
        compress
      });
    }

    this._log('Parsed strategies', this._strategies);
  }

  async _initIndexedDB() {
    const databases = new Set(
      this._strategies
        .filter(s => s.storage === 'indexedDB')
        .map(s => s.database)
    );

    // For simplicity, use a single database for all strategies
    const dbName = Array.from(databases)[0] || 'pan-persistence';

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create persistence store
        if (!db.objectStoreNames.contains('persistence')) {
          const store = db.createObjectStore('persistence', { keyPath: 'topic' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('expires', 'expires', { unique: false });
        }
      };
    });
  }

  _subscribeToTopics(strategy) {
    for (const topicPattern of strategy.topics) {
      if (this._subscriptions.has(topicPattern)) continue;

      const handler = (message) => {
        this._handleMessage(message, strategy);
      };

      this._panClient.subscribe(topicPattern, handler);
      this._subscriptions.set(topicPattern, handler);

      this._log('Subscribed', { pattern: topicPattern, storage: strategy.storage });
    }
  }

  async _handleMessage(message, strategy) {
    const topic = message.topic;
    const data = message.data;

    // Check size limit
    if (strategy.maxSize > 0) {
      const size = JSON.stringify(data).length;
      if (size > strategy.maxSize) {
        this._log('Data exceeds max size', { topic, size, max: strategy.maxSize });
        return;
      }
    }

    // Persist based on storage strategy
    try {
      switch (strategy.storage) {
        case 'memory':
          // Memory storage doesn't persist, but we track TTL
          if (strategy.ttl > 0) {
            this._setTTL(topic, strategy.ttl);
          }
          break;

        case 'localStorage':
          await this._saveToLocalStorage(topic, data, strategy);
          break;

        case 'sessionStorage':
          await this._saveToSessionStorage(topic, data, strategy);
          break;

        case 'indexedDB':
          await this._saveToIndexedDB(topic, data, strategy);
          break;

        default:
          this._log('Unknown storage type', { storage: strategy.storage });
      }

      this._publishEvent('persist.saved', {
        topic,
        storage: strategy.storage,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Failed to persist data:', error);
      this._publishEvent('persist.error', {
        topic,
        storage: strategy.storage,
        error: error.message
      });
    }
  }

  async _saveToLocalStorage(topic, data, strategy) {
    const item = {
      data,
      timestamp: Date.now(),
      expires: strategy.ttl > 0 ? Date.now() + strategy.ttl : null
    };

    const key = this._getStorageKey(topic);
    localStorage.setItem(key, JSON.stringify(item));

    if (strategy.ttl > 0) {
      this._setTTL(topic, strategy.ttl, 'localStorage');
    }
  }

  async _saveToSessionStorage(topic, data, strategy) {
    const item = {
      data,
      timestamp: Date.now(),
      expires: strategy.ttl > 0 ? Date.now() + strategy.ttl : null
    };

    const key = this._getStorageKey(topic);
    sessionStorage.setItem(key, JSON.stringify(item));

    if (strategy.ttl > 0) {
      this._setTTL(topic, strategy.ttl, 'sessionStorage');
    }
  }

  async _saveToIndexedDB(topic, data, strategy) {
    return new Promise((resolve, reject) => {
      const item = {
        topic,
        data,
        timestamp: Date.now(),
        expires: strategy.ttl > 0 ? Date.now() + strategy.ttl : null
      };

      const tx = this._db.transaction(['persistence'], 'readwrite');
      const store = tx.objectStore('persistence');
      const request = store.put(item);

      request.onsuccess = () => {
        if (strategy.ttl > 0) {
          this._setTTL(topic, strategy.ttl, 'indexedDB');
        }
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  _setTTL(topic, ttl, storage = null) {
    // Clear existing timer
    if (this._ttlTimers.has(topic)) {
      clearTimeout(this._ttlTimers.get(topic));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this._expireData(topic, storage);
    }, ttl);

    this._ttlTimers.set(topic, timer);
  }

  async _expireData(topic, storage) {
    this._log('Expiring data', { topic, storage });

    if (storage === 'localStorage') {
      const key = this._getStorageKey(topic);
      localStorage.removeItem(key);
    } else if (storage === 'sessionStorage') {
      const key = this._getStorageKey(topic);
      sessionStorage.removeItem(key);
    } else if (storage === 'indexedDB') {
      await this._removeFromIndexedDB(topic);
    }

    this._ttlTimers.delete(topic);
  }

  async _removeFromIndexedDB(topic) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['persistence'], 'readwrite');
      const store = tx.objectStore('persistence');
      const request = store.delete(topic);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async _hydrateAll() {
    this._log('Hydrating all persisted state');

    for (const strategy of this._strategies) {
      try {
        switch (strategy.storage) {
          case 'localStorage':
            await this._hydrateFromLocalStorage(strategy);
            break;

          case 'sessionStorage':
            await this._hydrateFromSessionStorage(strategy);
            break;

          case 'indexedDB':
            await this._hydrateFromIndexedDB(strategy);
            break;

          // memory doesn't persist
        }
      } catch (error) {
        console.error('Failed to hydrate from', strategy.storage, error);
      }
    }

    this._publishEvent('persist.hydrated', {
      timestamp: Date.now()
    });

    this._log('Hydration complete');
  }

  async _hydrateFromLocalStorage(strategy) {
    const prefix = this._getStorageKey('');

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith(prefix)) {
        const topic = key.substring(prefix.length);

        // Check if topic matches any pattern
        if (this._matchesTopicPattern(topic, strategy.topics)) {
          const itemStr = localStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);

            // Check expiry
            if (item.expires && Date.now() > item.expires) {
              localStorage.removeItem(key);
              continue;
            }

            // Publish to PAN
            this._panClient.publish(topic, item.data, { retain: true });

            // Set TTL if needed
            if (item.expires) {
              const remaining = item.expires - Date.now();
              if (remaining > 0) {
                this._setTTL(topic, remaining, 'localStorage');
              }
            }
          }
        }
      }
    }
  }

  async _hydrateFromSessionStorage(strategy) {
    const prefix = this._getStorageKey('');

    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);

      if (key.startsWith(prefix)) {
        const topic = key.substring(prefix.length);

        if (this._matchesTopicPattern(topic, strategy.topics)) {
          const itemStr = sessionStorage.getItem(key);
          if (itemStr) {
            const item = JSON.parse(itemStr);

            if (item.expires && Date.now() > item.expires) {
              sessionStorage.removeItem(key);
              continue;
            }

            this._panClient.publish(topic, item.data, { retain: true });

            if (item.expires) {
              const remaining = item.expires - Date.now();
              if (remaining > 0) {
                this._setTTL(topic, remaining, 'sessionStorage');
              }
            }
          }
        }
      }
    }
  }

  async _hydrateFromIndexedDB(strategy) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['persistence'], 'readonly');
      const store = tx.objectStore('persistence');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result;

        for (const item of items) {
          if (this._matchesTopicPattern(item.topic, strategy.topics)) {
            // Check expiry
            if (item.expires && Date.now() > item.expires) {
              this._removeFromIndexedDB(item.topic);
              continue;
            }

            // Publish to PAN
            this._panClient.publish(item.topic, item.data, { retain: true });

            // Set TTL if needed
            if (item.expires) {
              const remaining = item.expires - Date.now();
              if (remaining > 0) {
                this._setTTL(item.topic, remaining, 'indexedDB');
              }
            }
          }
        }

        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  _matchesTopicPattern(topic, patterns) {
    for (const pattern of patterns) {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      if (regex.test(topic)) {
        return true;
      }
    }
    return false;
  }

  _getStorageKey(topic) {
    return `pan-persist:${topic}`;
  }

  _publishEvent(eventTopic, data) {
    if (!this._panClient) return;

    this._panClient.publish(`persist.${eventTopic}`, data, { retain: false });
  }

  _getPanClient() {
    if (this._panClient) return this._panClient;

    const panBus = document.querySelector('pan-bus');
    const panClient = panBus?.panClient || document.querySelector('pan-client');

    if (panClient) {
      this._panClient = panClient.client || panClient;
    }

    return this._panClient;
  }

  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-persistence-strategy]', ...args);
    }
  }

  // Public API
  async hydrate() {
    await this._hydrateAll();
  }

  async clearAll() {
    // Clear all persisted data
    for (const strategy of this._strategies) {
      switch (strategy.storage) {
        case 'localStorage':
          this._clearStorage(localStorage);
          break;
        case 'sessionStorage':
          this._clearStorage(sessionStorage);
          break;
        case 'indexedDB':
          await this._clearIndexedDB();
          break;
      }
    }

    this._log('Cleared all persisted data');
  }

  _clearStorage(storage) {
    const prefix = this._getStorageKey('');
    const keysToRemove = [];

    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      storage.removeItem(key);
    }
  }

  async _clearIndexedDB() {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['persistence'], 'readwrite');
      const store = tx.objectStore('persistence');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  getStrategies() {
    return [...this._strategies];
  }
}

customElements.define('pan-persistence-strategy', PanPersistenceStrategy);
