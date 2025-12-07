/**
 * Configuration for PAN Bus
 */
export interface PanBusConfig {
  /** Maximum retained messages (default: 1000) */
  maxRetained: number;

  /** Maximum message size in bytes (default: 1048576 = 1MB) */
  maxMessageSize: number;

  /** Maximum payload size in bytes (default: 524288 = 512KB) */
  maxPayloadSize: number;

  /** Cleanup interval in milliseconds (default: 30000 = 30s) */
  cleanupInterval: number;

  /** Max messages per client per second (default: 1000) */
  rateLimit: number;

  /** Rate limit window in milliseconds (default: 1000) */
  rateLimitWindow: number;

  /** Allow '*' wildcard subscriptions (default: true) */
  allowGlobalWildcard: boolean;

  /** Enable debug logging (default: false) */
  debug: boolean;
}

/**
 * Statistics from PAN Bus
 */
export interface PanBusStats {
  /** Total messages published */
  published: number;

  /** Total messages delivered */
  delivered: number;

  /** Messages dropped (rate limit, validation failures) */
  dropped: number;

  /** Retained messages evicted (LRU) */
  retainedEvicted: number;

  /** Dead subscriptions cleaned up */
  subsCleanedUp: number;

  /** Total errors */
  errors: number;
}

/**
 * PAN Bus (Enhanced) - Memory-safe, secure message bus
 *
 * Central message bus for the Page Area Network with:
 * - Memory-bounded retained message store with LRU eviction
 * - Automatic cleanup of dead subscriptions
 * - Message validation (size limits, JSON-serializable)
 * - Rate limiting per publisher
 * - Security policies for wildcard subscriptions
 * - Debug mode with comprehensive logging
 */
export class PanBus extends HTMLElement {
  /** Current configuration */
  config: PanBusConfig;

  /** Current statistics */
  stats: PanBusStats;

  /**
   * Observed attributes for configuration
   */
  static readonly observedAttributes: string[];

  constructor();

  connectedCallback(): void;
  disconnectedCallback(): void;
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'pan-bus': PanBus;
  }
}

export default PanBus;
