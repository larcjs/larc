/**
 * PAN (Page Area Network) - TypeScript Definitions
 *
 * Zero-build, framework-agnostic message bus for web component coordination
 */

// ============================================================================
// Message Types
// ============================================================================

export interface PanMessage {
  topic: string;
  data?: any;
  id?: string;
  ts?: number;
  replyTo?: string;
  correlationId?: string;
  retain?: boolean;
  headers?: Record<string, string>;
}

export interface PanSubscribeOptions {
  retained?: boolean;
  signal?: AbortSignal;
}

export type PanMessageHandler = (message: PanMessage) => void;
export type UnsubscribeFunction = () => void;

/** Detail of the `pan:subscribe` event. `subId` is absent for subscriptions made by older clients. */
export interface PanSubscribeDetail {
  clientId?: string;
  /** Unique id of this subscription; the bus tags deliveries for it as `PanDeliverEvent.panSubId`. */
  subId?: string;
  topics: string[];
  options?: { retained?: boolean };
}

/** Detail of the `pan:bye` event sent by `PanClient.dispose()`. */
export interface PanByeDetail {
  /** The disposing client's id. */
  id: string;
}

/**
 * The `pan:deliver` event. `detail` is the message (never modified); `panSubId` names the subscription
 * the delivery is for. It is absent when delivered by an older bus or to an untagged subscription,
 * in which case listeners filter by their own topic patterns.
 */
export interface PanDeliverEvent extends CustomEvent<PanMessage> {
  panSubId?: string;
}

// ============================================================================
// PAN Bus Element
// ============================================================================

export class PanBus extends HTMLElement {
  subs: Array<{
    pattern: string;
    el: HTMLElement | Document;
    clientId: string;
    /** Unique subscription id (absent for subscriptions made by older clients) */
    subId?: string;
    retained?: boolean;
  }>;
  retained: Map<string, PanMessage>;
  clients: Map<string, { el: HTMLElement | Document; caps: string[] }>;

  connectedCallback(): void;
  disconnectedCallback(): void;

  static matches(topic: string, pattern: string): boolean;
}

// ============================================================================
// PAN Client API
// ============================================================================

export class PanClient {
  host: HTMLElement | Document;
  bus: HTMLElement | null;
  clientId: string;

  constructor(host?: HTMLElement | Document, busSelector?: string);

  /**
   * Wait for the bus to be ready
   */
  ready(): Promise<void>;

  /**
   * Tears the client down: unsubscribes every subscription it made and sends `pan:bye` so the bus
   * forgets the client. Safe to call more than once. After `dispose()`, `subscribe()` returns a no-op
   * unsubscribe function. Call it (or the returned unsubscribe functions) from `disconnectedCallback`.
   */
  dispose(): void;

  /**
   * Publish a message to a topic
   */
  publish(msg: PanMessage): void;

  /**
   * Publish a message (convenience method)
   */
  pub(topic: string, data?: any, options?: { retain?: boolean }): void;

  /**
   * Subscribe to one or more topics
   * @returns Unsubscribe function
   */
  subscribe(
    topics: string | string[],
    handler: PanMessageHandler,
    opts?: PanSubscribeOptions
  ): UnsubscribeFunction;

  /**
   * Subscribe to one or more topics (convenience alias)
   * @returns Unsubscribe function
   */
  sub(
    topics: string | string[],
    handler: PanMessageHandler,
    opts?: PanSubscribeOptions
  ): UnsubscribeFunction;

  /**
   * Request/Reply pattern
   * @returns Promise that resolves with the reply message
   */
  request(
    topic: string,
    data?: any,
    options?: { timeoutMs?: number }
  ): Promise<PanMessage>;

  /**
   * Check if a topic matches a pattern
   */
  static matches(topic: string, pattern: string): boolean;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Ensure a pan-bus element exists in the document
 * Creates one if it doesn't exist
 */
export function ensureBus(): HTMLElement;

/**
 * Create a PanClient instance and ensure bus exists
 */
export function createClient(host?: HTMLElement | Document): PanClient;

// ============================================================================
// Default Export
// ============================================================================

export default PanClient;

// ============================================================================
// Global Augmentation
// ============================================================================

declare global {
  interface Window {
    __panReady?: boolean;
  }

  interface HTMLElementTagNameMap {
    'pan-bus': PanBus;
  }

  interface HTMLElementEventMap {
    'pan:deliver': CustomEvent<PanMessage>;
    'pan:publish': CustomEvent<PanMessage>;
    'pan:request': CustomEvent<PanMessage>;
    'pan:reply': CustomEvent<PanMessage>;
    'pan:subscribe': CustomEvent<{
      topics: string[];
      clientId: string;
      options?: PanSubscribeOptions;
    }>;
    'pan:unsubscribe': CustomEvent<{
      topics: string[];
      clientId: string;
    }>;
    'pan:hello': CustomEvent<{
      id: string;
      caps: string[];
    }>;
    'pan:sys.ready': CustomEvent;
  }
}
