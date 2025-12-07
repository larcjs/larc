import type { PanMessage, SubscribeOptions, RequestOptions } from '../types/message.js';
import type { MessageHandler, UnsubscribeFunction } from '../types/subscription.js';

/**
 * PAN Client - Simplified API for PAN bus interaction
 *
 * Provides a clean interface for:
 * - Publishing messages
 * - Subscribing to topics (with wildcard support)
 * - Request/reply pattern with automatic correlation
 * - Retained message support
 * - Automatic cleanup with AbortSignal
 */
export class PanClient {
  /**
   * Host element for event dispatch/receive
   */
  readonly host: HTMLElement | Document;

  /**
   * Reference to pan-bus element
   */
  readonly bus: HTMLElement | null;

  /**
   * Unique client identifier
   */
  readonly clientId: string;

  /**
   * Creates a new PAN client
   *
   * @param host - Element to dispatch/receive events from (default: document)
   * @param busSelector - CSS selector for bus element (default: 'pan-bus')
   *
   * @example
   * // Default: use document
   * const client = new PanClient();
   *
   * // Use custom element
   * const myComponent = document.querySelector('my-component');
   * const client = new PanClient(myComponent);
   */
  constructor(host?: HTMLElement | Document, busSelector?: string);

  /**
   * Returns a promise that resolves when the PAN bus is ready
   * Safe to use before bus exists - will wait for pan:sys.ready event
   *
   * @example
   * const client = new PanClient();
   * await client.ready();
   * client.publish({ topic: 'app.started', data: {} });
   */
  ready(): Promise<void>;

  /**
   * Publishes a message to the PAN bus
   * Message will be delivered to all matching subscribers
   *
   * @param msg - Message to publish
   *
   * @example
   * // Simple publish
   * client.publish({
   *   topic: 'user.updated',
   *   data: { id: 123, name: 'Alice' }
   * });
   *
   * // Retained message (last value cached)
   * client.publish({
   *   topic: 'users.list.state',
   *   data: { users: [...] },
   *   retain: true
   * });
   */
  publish<T = any>(msg: PanMessage<T>): void;

  /**
   * Subscribes to one or more topic patterns
   * Returns an unsubscribe function to stop receiving messages
   *
   * @param topics - Topic pattern(s) to subscribe to
   * @param handler - Function to handle received messages
   * @param opts - Subscription options
   * @returns Function to unsubscribe
   *
   * @example
   * // Subscribe to single topic
   * const unsub = client.subscribe('users.updated', (msg) => {
   *   console.log('User updated:', msg.data);
   * });
   *
   * // Subscribe to multiple topics with wildcard
   * client.subscribe(['users.*', 'posts.*'], (msg) => {
   *   console.log('Received:', msg.topic, msg.data);
   * });
   *
   * // Get retained messages immediately
   * client.subscribe('app.state', (msg) => {
   *   console.log('Current state:', msg.data);
   * }, { retained: true });
   *
   * // Automatic cleanup with AbortController
   * const controller = new AbortController();
   * client.subscribe('events.*', handler, { signal: controller.signal });
   * // Later: controller.abort(); // Unsubscribes automatically
   */
  subscribe<T = any>(
    topics: string | string[],
    handler: MessageHandler<T>,
    opts?: SubscribeOptions
  ): UnsubscribeFunction;

  /**
   * Sends a request and waits for a reply
   * Implements request/reply pattern with automatic correlation and timeout
   *
   * @param topic - Request topic
   * @param data - Request payload
   * @param options - Request options
   * @returns Promise that resolves with reply message
   * @throws Error if request times out
   *
   * @example
   * // Simple request
   * try {
   *   const response = await client.request('users.get', { id: 123 });
   *   console.log('User:', response.data);
   * } catch (err) {
   *   console.error('Request failed:', err);
   * }
   *
   * // Custom timeout
   * const response = await client.request('slow.operation', { ... }, {
   *   timeoutMs: 10000  // 10 second timeout
   * });
   */
  request<T = any, R = any>(
    topic: string,
    data: T,
    options?: RequestOptions
  ): Promise<PanMessage<R>>;

  /**
   * Checks if a topic matches a pattern
   * Supports exact match, global wildcard (*), and segment wildcards (users.*)
   *
   * @param topic - Topic to test (e.g., "users.list.state")
   * @param pattern - Pattern to match (e.g., "users.*" or "*")
   * @returns True if topic matches pattern
   *
   * @example
   * PanClient.matches('users.list.state', 'users.*')  // true
   * PanClient.matches('users.list.state', 'users.list.state')  // true
   * PanClient.matches('users.list.state', '*')  // true
   * PanClient.matches('users.list.state', 'posts.*')  // false
   * PanClient.matches('users.item.123', 'users.item.*')  // true
   */
  static matches(topic: string, pattern: string): boolean;
}

export default PanClient;
