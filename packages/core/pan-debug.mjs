/**
 * @fileoverview PAN Debug - Message tracing and debugging utilities
 *
 * Provides introspection and debugging capabilities for PAN message flows.
 * Tracks messages as they pass through the bus and routing system.
 *
 * @example
 * // Enable tracing
 * pan.debug.enableTracing({ maxBuffer: 100, sampleRate: 1.0 });
 *
 * // Get trace history
 * const trace = pan.debug.getTrace();
 * console.log(`Captured ${trace.length} messages`);
 *
 * // Disable tracing
 * pan.debug.disableTracing();
 */

/**
 * PAN Debug Manager
 */
export class PanDebugManager {
  constructor() {
    this.enabled = false;
    this.traceBuffer = [];
    this.maxBuffer = 1000;
    this.sampleRate = 1.0;
    this.messageCount = 0;
  }

  /**
   * Enable message tracing
   */
  enableTracing(options = {}) {
    this.enabled = true;
    this.maxBuffer = options.maxBuffer !== undefined ? options.maxBuffer : 1000;
    this.sampleRate = options.sampleRate !== undefined ? options.sampleRate : 1.0;

    // Validate sample rate
    if (this.sampleRate < 0) this.sampleRate = 0;
    if (this.sampleRate > 1) this.sampleRate = 1;

    console.log(`[PAN Debug] Tracing enabled (buffer: ${this.maxBuffer}, sample rate: ${this.sampleRate})`);
  }

  /**
   * Disable message tracing
   */
  disableTracing() {
    this.enabled = false;
    console.log(`[PAN Debug] Tracing disabled (captured ${this.traceBuffer.length} messages)`);
  }

  /**
   * Record a message trace
   */
  trace(message, matchedRoutes = []) {
    if (!this.enabled) return;

    this.messageCount++;

    // Sample check
    if (this.sampleRate < 1.0 && Math.random() > this.sampleRate) {
      return;
    }

    const entry = {
      message: this._sanitizeMessage(message),
      matchedRoutes: matchedRoutes.map(route => ({
        id: route.id,
        name: route.name,
        actions: route.actions.map(a => a.type),
        error: null
      })),
      ts: Date.now(),
      sequence: this.messageCount
    };

    this.traceBuffer.push(entry);

    // Trim buffer if over limit
    while (this.traceBuffer.length > this.maxBuffer) {
      this.traceBuffer.shift();
    }
  }

  /**
   * Record a routing error
   */
  traceError(message, route, error) {
    if (!this.enabled) return;

    // Find existing trace entry for this message
    const entry = this.traceBuffer
      .slice()
      .reverse()
      .find(e => e.message.id === message.id);

    if (entry) {
      const routeTrace = entry.matchedRoutes.find(r => r.id === route.id);
      if (routeTrace) {
        routeTrace.error = {
          message: error.message || String(error),
          stack: error.stack
        };
      }
    }
  }

  /**
   * Get trace buffer
   */
  getTrace() {
    return [...this.traceBuffer];
  }

  /**
   * Clear trace buffer
   */
  clearTrace() {
    this.traceBuffer = [];
    this.messageCount = 0;
    console.log('[PAN Debug] Trace buffer cleared');
  }

  /**
   * Get trace statistics
   */
  getStats() {
    const stats = {
      enabled: this.enabled,
      messageCount: this.messageCount,
      bufferSize: this.traceBuffer.length,
      maxBuffer: this.maxBuffer,
      sampleRate: this.sampleRate
    };

    if (this.traceBuffer.length > 0) {
      stats.oldestMessage = this.traceBuffer[0].ts;
      stats.newestMessage = this.traceBuffer[this.traceBuffer.length - 1].ts;
      stats.timespan = stats.newestMessage - stats.oldestMessage;
    }

    return stats;
  }

  /**
   * Query trace buffer
   */
  query(filter = {}) {
    let results = [...this.traceBuffer];

    // Filter by topic
    if (filter.topic) {
      results = results.filter(e => e.message.topic === filter.topic);
    }

    // Filter by type
    if (filter.type) {
      results = results.filter(e => e.message.type === filter.type);
    }

    // Filter by matched routes
    if (filter.hasRoutes !== undefined) {
      if (filter.hasRoutes) {
        results = results.filter(e => e.matchedRoutes.length > 0);
      } else {
        results = results.filter(e => e.matchedRoutes.length === 0);
      }
    }

    // Filter by errors
    if (filter.hasErrors !== undefined) {
      if (filter.hasErrors) {
        results = results.filter(e =>
          e.matchedRoutes.some(r => r.error !== null)
        );
      } else {
        results = results.filter(e =>
          !e.matchedRoutes.some(r => r.error !== null)
        );
      }
    }

    // Filter by time range
    if (filter.startTs) {
      results = results.filter(e => e.ts >= filter.startTs);
    }
    if (filter.endTs) {
      results = results.filter(e => e.ts <= filter.endTs);
    }

    // Limit results
    if (filter.limit && filter.limit > 0) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  /**
   * Export trace as JSON
   */
  export() {
    return JSON.stringify(this.traceBuffer, null, 2);
  }

  /**
   * Import trace from JSON
   */
  import(json) {
    try {
      const data = JSON.parse(json);
      if (Array.isArray(data)) {
        this.traceBuffer = data;
        console.log(`[PAN Debug] Imported ${data.length} trace entries`);
      }
    } catch (err) {
      console.error('[PAN Debug] Failed to import trace:', err);
      throw err;
    }
  }

  /**
   * Sanitize message for storage (remove circular refs, etc.)
   * @private
   */
  _sanitizeMessage(message) {
    try {
      // Simple approach: JSON stringify/parse to remove circular refs
      return JSON.parse(JSON.stringify(message));
    } catch (err) {
      // Fallback: basic copy
      return {
        id: message.id,
        type: message.type,
        topic: message.topic,
        ts: message.ts,
        error: 'Failed to serialize message'
      };
    }
  }
}

/**
 * Create snapshot of current PAN state
 */
export function captureSnapshot(bus, routes, debug) {
  const snapshot = {
    timestamp: Date.now(),
    bus: null,
    routes: null,
    debug: null
  };

  // Capture bus stats
  if (bus && typeof bus.stats === 'object') {
    snapshot.bus = {
      stats: { ...bus.stats },
      subscriptions: bus.subs ? bus.subs.length : 0,
      retained: bus.retained ? bus.retained.size : 0
    };
  }

  // Capture routing stats
  if (routes && typeof routes.getStats === 'function') {
    snapshot.routes = routes.getStats();
  }

  // Capture debug stats
  if (debug && typeof debug.getStats === 'function') {
    snapshot.debug = debug.getStats();
  }

  return snapshot;
}

export default PanDebugManager;
