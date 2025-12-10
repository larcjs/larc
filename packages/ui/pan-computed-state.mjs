/**
 * pan-computed-state - Computed/derived state with automatic dependency tracking
 *
 * Subscribes to multiple PAN topics and computes a derived value, publishing
 * the result to an output topic. Includes memoization and debouncing.
 *
 * @example
 * <pan-computed-state
 *   sources="cart.items,user.discount"
 *   output="cart.total"
 *   debounce="100"
 *   retain>
 *   <script type="application/json">
 *     {
 *       "compute": "(items, discount) => items.reduce((sum, item) => sum + item.price, 0) - (discount || 0)"
 *     }
 *   </script>
 * </pan-computed-state>
 *
 * Alternatively, use a script element directly:
 * <pan-computed-state sources="a,b" output="c">
 *   <script>
 *     (a, b) => a + b
 *   </script>
 * </pan-computed-state>
 *
 * @attribute {string} sources - Comma-separated list of source topics
 * @attribute {string} output - Output topic to publish computed result
 * @attribute {number} debounce - Debounce delay in ms (default: 0)
 * @attribute {boolean} retain - Whether to retain the computed message
 * @attribute {boolean} async - Whether the compute function is async
 * @attribute {boolean} debug - Enable debug logging
 * @attribute {string} memo - Memoization strategy: 'none' | 'shallow' | 'deep' (default: 'shallow')
 */

export class PanComputedState extends HTMLElement {
  static observedAttributes = ['sources', 'output', 'debounce', 'retain', 'async', 'debug', 'memo'];

  constructor() {
    super();
    this._subscriptions = new Map();
    this._sourceData = new Map();
    this._computeFunction = null;
    this._debounceTimer = null;
    this._computing = false;
    this._lastResult = undefined;
    this._lastHash = null;
    this._panClient = null;
    this._initialized = false;
  }

  connectedCallback() {
    // Wait for pan-bus to be ready
    this._waitForPanBus().then(() => {
      this._initialize();
    });
  }

  disconnectedCallback() {
    this._cleanup();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue || !this._initialized) return;

    if (name === 'sources' || name === 'output') {
      this._cleanup();
      this._initialize();
    } else if (name === 'debounce') {
      // Just update debounce value, no need to reinitialize
      this._log('Debounce updated', { debounce: newValue });
    }
  }

  async _waitForPanBus() {
    // Check if pan-bus exists
    let panBus = document.querySelector('pan-bus');

    if (panBus && panBus.panClient) {
      return;
    }

    // Wait for pan-bus to be ready
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        panBus = document.querySelector('pan-bus');
        if (panBus && panBus.panClient) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 50);

      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve();
      }, 5000);
    });
  }

  _initialize() {
    const sources = this.getAttribute('sources');
    const output = this.getAttribute('output');

    if (!sources || !output) {
      console.error('pan-computed-state requires both "sources" and "output" attributes');
      return;
    }

    // Get compute function
    this._computeFunction = this._extractComputeFunction();
    if (!this._computeFunction) {
      console.error('pan-computed-state requires a compute function in a <script> element');
      return;
    }

    // Get PAN client
    this._panClient = this._getPanClient();
    if (!this._panClient) {
      console.error('pan-computed-state could not find pan-client or pan-bus');
      return;
    }

    // Subscribe to source topics
    const sourceTopics = sources.split(',').map(s => s.trim());
    for (const topic of sourceTopics) {
      this._subscribeToSource(topic);
    }

    this._initialized = true;
    this._log('Initialized', { sources: sourceTopics, output });
  }

  _cleanup() {
    // Unsubscribe from all sources
    for (const [topic, handler] of this._subscriptions.entries()) {
      this._panClient?.unsubscribe(topic, handler);
    }
    this._subscriptions.clear();
    this._sourceData.clear();

    if (this._debounceTimer) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }

    this._initialized = false;
  }

  _subscribeToSource(topic) {
    if (this._subscriptions.has(topic)) return;

    const handler = (message) => {
      this._handleSourceUpdate(topic, message.data);
    };

    this._panClient.subscribe(topic, handler);
    this._subscriptions.set(topic, handler);

    // Request current value (if retained)
    this._panClient.publish(`${topic}.get`, null, {
      retain: false,
      replyTo: `${topic}.current`
    });

    this._log('Subscribed to source', { topic });
  }

  _handleSourceUpdate(topic, data) {
    this._sourceData.set(topic, data);
    this._log('Source updated', { topic, data });

    // Trigger computation
    this._scheduleComputation();
  }

  _scheduleComputation() {
    const debounce = parseInt(this.getAttribute('debounce') || '0', 10);

    if (debounce > 0) {
      if (this._debounceTimer) {
        clearTimeout(this._debounceTimer);
      }

      this._debounceTimer = setTimeout(() => {
        this._compute();
      }, debounce);
    } else {
      this._compute();
    }
  }

  async _compute() {
    if (this._computing) {
      this._log('Already computing, skipping');
      return;
    }

    // Check if all sources have data
    const sources = this.getAttribute('sources').split(',').map(s => s.trim());
    const allSourcesReady = sources.every(topic => this._sourceData.has(topic));

    if (!allSourcesReady) {
      this._log('Not all sources ready', {
        ready: Array.from(this._sourceData.keys()),
        waiting: sources.filter(t => !this._sourceData.has(t))
      });
      return;
    }

    this._computing = true;

    try {
      // Prepare arguments in order of sources
      const args = sources.map(topic => this._sourceData.get(topic));

      // Check memoization
      if (this._shouldSkipComputation(args)) {
        this._log('Skipping computation (memoized)', { args });
        this._computing = false;
        return;
      }

      // Execute compute function
      const isAsync = this.hasAttribute('async');
      let result;

      if (isAsync) {
        result = await this._computeFunction(...args);
      } else {
        result = this._computeFunction(...args);
      }

      // Check if result changed
      if (this._resultChanged(result)) {
        this._lastResult = result;
        this._publishResult(result);
        this._log('Computed and published', { result });
      } else {
        this._log('Result unchanged, skipping publish', { result });
      }

    } catch (error) {
      console.error('Error computing state:', error);
      this._publishError(error);
    } finally {
      this._computing = false;
    }
  }

  _shouldSkipComputation(args) {
    const memoStrategy = this.getAttribute('memo') || 'shallow';

    if (memoStrategy === 'none') {
      return false;
    }

    const currentHash = this._hashArgs(args, memoStrategy);

    if (this._lastHash !== null && this._lastHash === currentHash) {
      return true;
    }

    this._lastHash = currentHash;
    return false;
  }

  _hashArgs(args, strategy) {
    if (strategy === 'shallow') {
      return JSON.stringify(args.map(arg => {
        if (arg === null || arg === undefined) return arg;
        if (typeof arg === 'object') return Object.keys(arg).sort().join(',');
        return arg;
      }));
    } else if (strategy === 'deep') {
      return JSON.stringify(args);
    }
    return null;
  }

  _resultChanged(newResult) {
    if (this._lastResult === undefined) return true;

    // Deep comparison
    try {
      return JSON.stringify(this._lastResult) !== JSON.stringify(newResult);
    } catch (e) {
      // Fallback to reference comparison
      return this._lastResult !== newResult;
    }
  }

  _publishResult(result) {
    const output = this.getAttribute('output');
    const retain = this.hasAttribute('retain');

    this._panClient.publish(output, result, {
      retain,
      meta: {
        source: 'computed',
        sources: this.getAttribute('sources').split(',').map(s => s.trim()),
        timestamp: Date.now()
      }
    });
  }

  _publishError(error) {
    const output = this.getAttribute('output');

    this._panClient.publish(`${output}.error`, {
      error: error.message,
      stack: error.stack,
      timestamp: Date.now()
    }, { retain: false });
  }

  _extractComputeFunction() {
    // Look for script element with compute function
    const scriptEl = this.querySelector('script:not([src])');

    if (!scriptEl) return null;

    const content = scriptEl.textContent.trim();

    // Check if it's JSON with a compute property
    if (scriptEl.type === 'application/json') {
      try {
        const json = JSON.parse(content);
        if (json.compute) {
          // eslint-disable-next-line no-new-func
          return new Function(`return ${json.compute}`)();
        }
      } catch (e) {
        console.error('Failed to parse JSON compute function:', e);
        return null;
      }
    }

    // Otherwise, treat as plain function
    try {
      // eslint-disable-next-line no-new-func
      return new Function(`return ${content}`)();
    } catch (e) {
      console.error('Failed to parse compute function:', e);
      return null;
    }
  }

  _getPanClient() {
    if (this._panClient) return this._panClient;

    // Find pan-client or pan-bus
    const panBus = document.querySelector('pan-bus');
    const panClient = panBus?.panClient || document.querySelector('pan-client');

    if (panClient) {
      this._panClient = panClient.client || panClient;
    }

    return this._panClient;
  }

  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-computed-state]', ...args);
    }
  }

  // Public API
  get sources() {
    return this.getAttribute('sources').split(',').map(s => s.trim());
  }

  get output() {
    return this.getAttribute('output');
  }

  get lastResult() {
    return this._lastResult;
  }

  async recompute() {
    await this._compute();
  }

  clearMemo() {
    this._lastHash = null;
    this._log('Memo cleared');
  }

  getSourceData() {
    return new Map(this._sourceData);
  }
}

customElements.define('pan-computed-state', PanComputedState);
