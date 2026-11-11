/**
 * TypeScript definitions for pan-bus.mjs
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

export interface Subscription {
  pattern: string;
  el: Element;
  clientId?: string;
  /** Unique subscription id (absent for subscriptions made by older clients). */
  subId?: string;
  retained?: boolean;
}

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
export interface PanDeliverEvent<T = unknown> extends CustomEvent<PanMessage<T>> {
  panSubId?: string;
}

export class PanBus extends HTMLElement {
  constructor();

  /** One entry per subscribed pattern. */
  subs: Subscription[];
  /** Registered clients, removed on `pan:bye` or when their host element is disconnected. */
  clients: Map<string, { el: Element | Document; caps: string[] }>;

  connectedCallback(): void;
  disconnectedCallback(): void;

  static matches(topic: string, pattern: string): boolean;
}

export default PanBus;
