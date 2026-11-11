/**
 * TypeScript definitions for pan-bus-enhanced.mjs
 */

export interface PanMessage<T = unknown> {
  topic: string;
  data: T;
  id?: string;
  ts?: number;
  retain?: boolean;
  replyTo?: string;
  correlationId?: string;
  headers?: Record<string, string>;
}

export interface PanBusConfig {
  maxRetained: number;
  maxMessageSize: number;
  maxPayloadSize: number;
  cleanupInterval: number;
  rateLimit: number;
  rateLimitWindow: number;
  allowGlobalWildcard: boolean;
  debug: boolean;
}

export interface PanBusStats {
  published: number;
  delivered: number;
  dropped: number;
  retained: number;
  retainedEvicted: number;
  subsCleanedUp: number;
  subscriptions: number;
  clients: number;
  errors: number;
  config: PanBusConfig;
}

export class PanBusEnhanced extends HTMLElement {
  constructor();

  /** One entry per subscribed pattern; `subId` is absent for subscriptions made by older clients */
  subs: Array<{ pattern: string; el: Element | Document; clientId?: string; subId?: string; retained?: boolean }>;
  /** Registered clients, removed on `pan:bye` or when their host element is disconnected */
  clients: Map<string, { el: Element | Document; caps: string[] }>;

  static get observedAttributes(): string[];

  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
  connectedCallback(): void;
  disconnectedCallback(): void;

  static matches(topic: string, pattern: string): boolean;
}

export default PanBusEnhanced;
