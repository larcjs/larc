/**
 * pan-topic-validator - Runtime topic validation component
 * 
 * Validates that published/subscribed topics match the canonical topic dictionary.
 * Useful for development to catch typos and naming inconsistencies.
 * 
 * @example
 * <pan-topic-validator 
 *   dictionary="/packages/core/topic-dictionary.json"
 *   mode="warn"
 *   strict="false">
 * </pan-topic-validator>
 * 
 * @attribute {string} dictionary - Path to topic-dictionary.json
 * @attribute {string} mode - 'warn' | 'error' | 'silent' (default: 'warn')
 * @attribute {boolean} strict - Reject unknown topics entirely (default: false)
 * @attribute {boolean} debug - Enable debug logging
 * 
 * @topic topic.validation.error - Topic validation failed
 * @topic topic.validation.warning - Topic validation warning (unknown topic)
 * @topic topic.validation.loaded - Dictionary loaded successfully
 */

export class PanTopicValidator extends HTMLElement {
  static observedAttributes = ['dictionary', 'mode', 'strict', 'debug'];
  
  constructor() {
    super();
    this._dictionary = null;
    this._topics = new Map();
    this._unknownTopics = new Set();
    this._panClient = null;
    this._intercepted = false;
  }
  
  connectedCallback() {
    this._loadDictionary();
  }
  
  disconnectedCallback() {
    // Note: We can't easily remove the bus intercept, but it will be inactive
    this._intercepted = false;
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'dictionary' && oldValue !== newValue) {
      this._loadDictionary();
    }
  }
  
  async _loadDictionary() {
    const dictionaryPath = this.getAttribute('dictionary') || '/packages/core/topic-dictionary.json';
    
    try {
      const response = await fetch(dictionaryPath);
      if (!response.ok) throw new Error(`Failed to load dictionary: ${response.status}`);
      
      this._dictionary = await response.json();
      
      // Build topic lookup map
      this._topics.clear();
      for (const [key, topic] of Object.entries(this._dictionary.topics)) {
        this._topics.set(topic.topic, topic);
      }
      
      this._log(`Loaded ${this._topics.size} topics from dictionary`);
      
      // Intercept PAN bus
      this._interceptBus();
      
      // Notify loaded
      this._publish('topic.validation.loaded', {
        count: this._topics.size,
        version: this._dictionary.version
      });
      
    } catch (err) {
      console.error('[pan-topic-validator] Failed to load dictionary:', err);
    }
  }
  
  _interceptBus() {
    if (this._intercepted) return;
    
    // Find pan-bus
    const panBus = document.querySelector('pan-bus');
    if (!panBus) {
      // Retry after bus is ready
      document.addEventListener('pan:sys.ready', () => this._interceptBus(), { once: true });
      return;
    }
    
    const bus = panBus._bus || panBus.bus;
    if (!bus) return;
    
    // Store original publish method
    const originalPublish = bus.publish.bind(bus);
    const validator = this;
    
    // Intercept publish
    bus.publish = function(topicOrMsg, data, options) {
      const topic = typeof topicOrMsg === 'string' ? topicOrMsg : topicOrMsg?.topic;
      validator._validateTopic(topic, 'publish');
      return originalPublish(topicOrMsg, data, options);
    };
    
    // Store original subscribe method
    const originalSubscribe = bus.subscribe.bind(bus);
    
    // Intercept subscribe
    bus.subscribe = function(topic, handler, options) {
      validator._validateTopic(topic, 'subscribe');
      return originalSubscribe(topic, handler, options);
    };
    
    this._intercepted = true;
    this._log('Intercepted PAN bus for topic validation');
  }
  
  _validateTopic(topic, operation) {
    if (!topic || !this._dictionary) return;
    
    // Skip internal topics
    if (topic.startsWith('pan:') || topic.startsWith('topic.validation')) return;
    
    // Skip wildcard patterns
    if (topic.includes('*')) return;
    
    const mode = this.getAttribute('mode') || 'warn';
    const strict = this.hasAttribute('strict');
    
    // Check if topic exists in dictionary
    const definition = this._findTopic(topic);
    
    if (!definition) {
      // Unknown topic
      if (!this._unknownTopics.has(topic)) {
        this._unknownTopics.add(topic);
        
        const message = `Unknown topic: "${topic}" (${operation})`;
        
        if (mode === 'error' || strict) {
          console.error(`[pan-topic-validator] ❌ ${message}`);
          this._publish('topic.validation.error', { topic, operation, message });
          
          if (strict) {
            throw new Error(`Topic validation failed: ${message}`);
          }
        } else if (mode === 'warn') {
          console.warn(`[pan-topic-validator] ⚠️ ${message}`);
          this._suggestSimilar(topic);
          this._publish('topic.validation.warning', { topic, operation, message });
        }
      }
    } else {
      // Topic found - validate usage
      this._validateUsage(topic, operation, definition);
    }
  }
  
  _findTopic(topic) {
    // Direct match
    if (this._topics.has(topic)) {
      return this._topics.get(topic);
    }
    
    // Try to match parameterized topics
    // e.g., "users.item.state.123" should match "{resource}.item.state.{id}"
    for (const [pattern, def] of this._topics) {
      if (pattern.includes('{')) {
        const regex = new RegExp('^' + pattern.replace(/\{[^}]+\}/g, '[^.]+') + '$');
        if (regex.test(topic)) {
          return def;
        }
      }
    }
    
    return null;
  }
  
  _validateUsage(topic, operation, definition) {
    const mode = this.getAttribute('mode') || 'warn';
    
    // Check if topic is used correctly based on its type
    if (operation === 'publish' && definition.type === 'request' && !definition.published) {
      // Publishing to a request topic that's typically only subscribed to
      if (mode !== 'silent') {
        console.info(`[pan-topic-validator] ℹ️ Publishing to request topic: ${topic}`);
      }
    }
    
    // Warn if subscribing to a state topic without retained option
    // (We can't easily check this here, but could add heuristics)
  }
  
  _suggestSimilar(topic) {
    const parts = topic.toLowerCase().split('.');
    const suggestions = [];
    
    for (const [known] of this._topics) {
      const knownParts = known.toLowerCase().split('.');
      let score = 0;
      
      // Simple similarity: count matching parts
      for (const part of parts) {
        if (knownParts.some(kp => kp.includes(part) || part.includes(kp))) {
          score++;
        }
      }
      
      // Check for common typos
      if (this._levenshtein(topic, known) <= 3) {
        score += 2;
      }
      
      if (score > 0) {
        suggestions.push({ topic: known, score });
      }
    }
    
    suggestions.sort((a, b) => b.score - a.score);
    
    if (suggestions.length > 0) {
      const top = suggestions.slice(0, 3).map(s => s.topic);
      console.info(`[pan-topic-validator] 💡 Did you mean: ${top.join(', ')}?`);
    }
  }
  
  _levenshtein(a, b) {
    const matrix = [];
    
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        if (b.charAt(i - 1) === a.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[b.length][a.length];
  }
  
  _publish(topic, data) {
    const panBus = document.querySelector('pan-bus');
    if (panBus?._bus?.publish) {
      // Use internal reference to avoid our own intercept
      const bus = panBus._bus;
      const originalPublish = Object.getPrototypeOf(bus).publish || bus.publish;
      originalPublish.call(bus, { topic, data });
    }
  }
  
  _log(...args) {
    if (this.hasAttribute('debug')) {
      console.log('[pan-topic-validator]', ...args);
    }
  }
  
  // Public API
  
  /**
   * Check if a topic is known in the dictionary
   */
  isKnownTopic(topic) {
    return this._findTopic(topic) !== null;
  }
  
  /**
   * Get topic definition
   */
  getTopicDefinition(topic) {
    return this._findTopic(topic);
  }
  
  /**
   * Get all unknown topics encountered
   */
  getUnknownTopics() {
    return [...this._unknownTopics];
  }
  
  /**
   * Get dictionary stats
   */
  getStats() {
    return this._dictionary?.stats || null;
  }
  
  /**
   * List all topics by namespace
   */
  listTopics(namespace = null) {
    if (!this._dictionary) return [];
    
    if (namespace) {
      return this._dictionary.namespaces[namespace] || [];
    }
    
    return Object.keys(this._dictionary.topics);
  }
}

customElements.define('pan-topic-validator', PanTopicValidator);
