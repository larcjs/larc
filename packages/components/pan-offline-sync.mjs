/**
 * pan-offline-sync - Offline-first synchronization component
 *
 * Queues mutations when offline and automatically syncs when back online.
 * Provides conflict resolution and retry logic with exponential backoff.
 *
 * @example
 * <pan-offline-sync
 *   storage="offline-queue"
 *   retry-max="3"
 *   retry-delay="1000"
 *   topics="todos.*,users.*"
 *   debug>
 * </pan-offline-sync>
 *
 * @attribute {string} storage - IndexedDB database name for queue storage
 * @attribute {number} retry-max - Maximum retry attempts (default: 3)
 * @attribute {number} retry-delay - Initial retry delay in ms (default: 1000)
 * @attribute {string} topics - Comma-separated topic patterns to queue
 * @attribute {string} strategy - Conflict resolution: 'server-wins' | 'client-wins' | 'merge'
 * @attribute {boolean} debug - Enable debug logging
 *
 * @topic {storage}.queue.add - Queued a mutation
 * @topic {storage}.queue.sync - Sync started
 * @topic {storage}.queue.success - Mutation synced successfully
 * @topic {storage}.queue.error - Sync error occurred
 * @topic {storage}.queue.conflict - Conflict detected
 * @topic {storage}.network.online - Network came online
 * @topic {storage}.network.offline - Network went offline
 */

export class PanOfflineSync extends HTMLElement {
  static observedAttributes = ['storage', 'retry-max', 'retry-delay', 'topics', 'strategy', 'debug'];

  constructor() {
    super();
    this._db = null;
    this._dbName = 'pan-offline-sync';
    this._queue = [];
    this._processing = false;
    this._online = navigator.onLine;
    this._subscriptions = new Map();
    this._retryQueue = new Map(); // mutation id -> retry count
    this._panClient = null;

    this._boundHandleOnline = this._handleOnline.bind(this);
    this._boundHandleOffline = this._handleOffline.bind(this);
  }

  connectedCallback() {
    // Wait for pan-bus
    this._waitForPanBus().then(() => {
      this._initialize();
    });

    // Listen for online/offline events
    window.addEventListener('online', this._boundHandleOnline);
    window.addEventListener('offline', this._boundHandleOffline);
  }

  disconnectedCallback() {
    this._cleanup();
    window.removeEventListener('online', this._boundHandleOnline);
    window.removeEventListener('offline', this._boundHandleOffline);
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    if (name === 'topics' || name === 'storage') {
      this._cleanup();
      this._initialize();
    }
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
    this._dbName = this.getAttribute('storage') || 'pan-offline-sync';

    // Initialize IndexedDB
    try {
      await this._initDB();
    } catch (error) {
      console.error('Failed to initialize offline sync database:', error);
      return;
    }

    // Load queue from IndexedDB
    await this._loadQueue();

    // Get PAN client
    this._panClient = this._getPanClient();
    if (!this._panClient) {
      console.error('pan-offline-sync could not find pan-client or pan-bus');
      return;
    }

    // Subscribe to topics
    const topics = this.getAttribute('topics');
    if (topics) {
      const topicPatterns = topics.split(',').map(t => t.trim());
      for (const pattern of topicPatterns) {
        this._subscribeToTopic(pattern);
      }
    }

    // Process queue if online
    if (this._online && this._queue.length > 0) {
      this._processQueue();
    }

    this._log('Initialized', {
      dbName: this._dbName,
      queueLength: this._queue.length,
      online: this._online
    });
  }

  _cleanup() {
    // Unsubscribe from all topics
    for (const [topic, handler] of this._subscriptions.entries()) {
      this._panClient?.unsubscribe(topic, handler);
    }
    this._subscriptions.clear();

    if (this._db) {
      this._db.close();
      this._db = null;
    }
  }

  async _initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this._dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this._db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create queue store
        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
          queueStore.createIndex('status', 'status', { unique: false });
        }
      };
    });
  }

  async _loadQueue() {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['queue'], 'readonly');
      const store = tx.objectStore('queue');
      const request = store.getAll();

      request.onsuccess = () => {
        this._queue = request.result.filter(item => item.status === 'pending');
        this._log('Loaded queue', { count: this._queue.length });
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  _subscribeToTopic(topicPattern) {
    if (this._subscriptions.has(topicPattern)) return;

    const handler = (message) => {
      // Only queue messages that look like mutations
      const topic = message.topic;

      // Check if this is a mutation (contains .add, .update, .delete, .save, etc.)
      const isMutation = /\.(add|update|delete|save|create|remove|set)/.test(topic);

      if (isMutation && !this._online) {
        this._queueMutation({
          topic,
          data: message.data,
          meta: message.meta,
          timestamp: Date.now()
        });
      }
    };

    this._panClient.subscribe(topicPattern, handler);
    this._subscriptions.set(topicPattern, handler);

    this._log('Subscribed to topic', { pattern: topicPattern });
  }

  async _queueMutation(mutation) {
    const item = {
      ...mutation,
      status: 'pending',
      retries: 0,
      queuedAt: Date.now()
    };

    // Save to IndexedDB
    try {
      const tx = this._db.transaction(['queue'], 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.add(item);

      request.onsuccess = () => {
        item.id = request.result;
        this._queue.push(item);

        this._publishEvent('queue.add', {
          id: item.id,
          topic: item.topic,
          queueLength: this._queue.length
        });

        this._log('Queued mutation', { id: item.id, topic: item.topic });
      };

      request.onerror = () => {
        console.error('Failed to queue mutation:', request.error);
      };
    } catch (error) {
      console.error('Failed to queue mutation:', error);
    }
  }

  _handleOnline() {
    this._online = true;

    this._publishEvent('network.online', {
      timestamp: Date.now(),
      queueLength: this._queue.length
    });

    this._log('Network online', { queueLength: this._queue.length });

    // Start processing queue
    if (this._queue.length > 0) {
      this._processQueue();
    }
  }

  _handleOffline() {
    this._online = false;

    this._publishEvent('network.offline', {
      timestamp: Date.now()
    });

    this._log('Network offline');
  }

  async _processQueue() {
    if (this._processing || !this._online || this._queue.length === 0) {
      return;
    }

    this._processing = true;

    this._publishEvent('queue.sync', {
      timestamp: Date.now(),
      queueLength: this._queue.length
    });

    this._log('Processing queue', { count: this._queue.length });

    // Process mutations sequentially
    const errors = [];

    for (let i = 0; i < this._queue.length; i++) {
      const mutation = this._queue[i];

      if (!this._online) {
        this._log('Network went offline during sync');
        break;
      }

      try {
        await this._syncMutation(mutation);

        // Remove from queue on success
        await this._removeMutation(mutation.id);
        this._queue.splice(i, 1);
        i--; // Adjust index

        this._publishEvent('queue.success', {
          id: mutation.id,
          topic: mutation.topic,
          remaining: this._queue.length
        });

        this._log('Synced mutation', { id: mutation.id, topic: mutation.topic });

      } catch (error) {
        errors.push({ mutation, error });

        // Handle retry
        const retryCount = (this._retryQueue.get(mutation.id) || 0) + 1;
        const maxRetries = parseInt(this.getAttribute('retry-max') || '3', 10);

        if (retryCount >= maxRetries) {
          // Move to failed status
          await this._updateMutationStatus(mutation.id, 'failed', error.message);
          this._queue.splice(i, 1);
          i--;

          this._publishEvent('queue.error', {
            id: mutation.id,
            topic: mutation.topic,
            error: error.message,
            retries: retryCount
          });

          this._log('Mutation failed after retries', {
            id: mutation.id,
            topic: mutation.topic,
            retries: retryCount
          });
        } else {
          this._retryQueue.set(mutation.id, retryCount);

          // Exponential backoff
          const baseDelay = parseInt(this.getAttribute('retry-delay') || '1000', 10);
          const delay = baseDelay * Math.pow(2, retryCount - 1);

          this._log('Retrying mutation', {
            id: mutation.id,
            attempt: retryCount,
            delay
          });

          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    this._processing = false;

    if (errors.length > 0) {
      this._log('Queue processing completed with errors', { errors: errors.length });
    } else {
      this._log('Queue processing completed successfully');
    }
  }

  async _syncMutation(mutation) {
    // Publish the mutation to the original topic
    // In a real app, this would make an API call

    return new Promise((resolve, reject) => {
      // Simulate network request
      // In production, this would be an actual API call

      // For now, just re-publish the message
      this._panClient.publish(mutation.topic, mutation.data, {
        retain: mutation.meta?.retain || false,
        meta: {
          ...mutation.meta,
          syncedAt: Date.now(),
          queuedAt: mutation.queuedAt,
          source: 'offline-sync'
        }
      });

      // Check if there's a sync endpoint configuration
      const syncEndpoint = this._getSyncEndpoint(mutation.topic);

      if (syncEndpoint) {
        // Make actual HTTP request
        fetch(syncEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mutation.data)
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            return response.json();
          })
          .then(result => {
            // Check for conflicts
            if (result.conflict) {
              this._handleConflict(mutation, result);
              reject(new Error('Conflict detected'));
            } else {
              resolve(result);
            }
          })
          .catch(error => reject(error));
      } else {
        // No endpoint, just resolve (message was re-published)
        resolve();
      }
    });
  }

  _getSyncEndpoint(topic) {
    // Look for pan-fetch or pan-rest components that handle this topic
    // This is a simplified version - in production, you'd have more sophisticated routing

    // Check if there's a data attribute with endpoint mapping
    const endpoints = this.getAttribute('endpoints');
    if (!endpoints) return null;

    try {
      const mapping = JSON.parse(endpoints);

      // Find matching endpoint by topic pattern
      for (const [pattern, endpoint] of Object.entries(mapping)) {
        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
        if (regex.test(topic)) {
          return endpoint;
        }
      }
    } catch (e) {
      // Invalid JSON, ignore
    }

    return null;
  }

  _handleConflict(mutation, serverResponse) {
    const strategy = this.getAttribute('strategy') || 'server-wins';

    this._publishEvent('queue.conflict', {
      id: mutation.id,
      topic: mutation.topic,
      local: mutation.data,
      server: serverResponse.data,
      strategy
    });

    // Apply conflict resolution strategy
    let resolved;

    if (strategy === 'server-wins') {
      resolved = serverResponse.data;
    } else if (strategy === 'client-wins') {
      resolved = mutation.data;
    } else if (strategy === 'merge') {
      resolved = this._mergeData(mutation.data, serverResponse.data);
    }

    // Publish resolved data
    this._panClient.publish(mutation.topic + '.resolved', resolved, {
      retain: true,
      meta: { source: 'conflict-resolution', strategy }
    });
  }

  _mergeData(local, server) {
    // Simple merge: server data takes precedence, but preserve local additions
    if (typeof local !== 'object' || typeof server !== 'object') {
      return server;
    }

    return { ...local, ...server };
  }

  async _removeMutation(id) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['queue'], 'readwrite');
      const store = tx.objectStore('queue');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async _updateMutationStatus(id, status, error = null) {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['queue'], 'readwrite');
      const store = tx.objectStore('queue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const mutation = getRequest.result;
        if (mutation) {
          mutation.status = status;
          if (error) mutation.error = error;

          const updateRequest = store.put(mutation);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  _publishEvent(eventTopic, data) {
    const panClient = this._getPanClient();
    if (!panClient) return;

    const storage = this.getAttribute('storage') || 'pan-offline-sync';
    const topic = `${storage}.${eventTopic}`;

    panClient.publish(topic, data, { retain: false });
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
      console.log('[pan-offline-sync]', ...args);
    }
  }

  // Public API
  get online() {
    return this._online;
  }

  get queueLength() {
    return this._queue.length;
  }

  get queue() {
    return [...this._queue];
  }

  async syncNow() {
    if (this._online) {
      await this._processQueue();
    } else {
      throw new Error('Cannot sync while offline');
    }
  }

  async clearQueue() {
    // Clear all pending mutations
    const tx = this._db.transaction(['queue'], 'readwrite');
    const store = tx.objectStore('queue');

    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => {
        this._queue = [];
        this._retryQueue.clear();
        this._log('Queue cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  async getFailedMutations() {
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(['queue'], 'readonly');
      const store = tx.objectStore('queue');
      const index = store.index('status');
      const request = index.getAll('failed');

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

customElements.define('pan-offline-sync', PanOfflineSync);
