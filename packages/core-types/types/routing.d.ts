/**
 * PAN Routes - Dynamic Message Routing Types
 * @module @larcjs/core-types/routing
 */

import type { PanMessage } from './message';

/**
 * Route matching criteria
 */
export interface RouteMatch {
  /** Match message type(s) */
  type?: string | string[];
  /** Match message topic(s) */
  topic?: string | string[];
  /** Match message source */
  source?: string;
  /** Match any of these tags */
  tags?: string[];
  /** Match any of these tags (alias for tags) */
  tagsAny?: string[];
  /** Match all of these tags */
  tagsAll?: string[];
  /** Complex predicate matching */
  where?: RoutePredicate;
}

/**
 * Predicate for complex message matching
 */
export interface RoutePredicate {
  /** Predicate operator */
  op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'regex' | 'and' | 'or' | 'not';
  /** Path to value in message (e.g., 'payload.temperature') */
  path?: string;
  /** Value to compare against */
  value?: any;
  /** Child predicates for 'and' / 'or' operators */
  children?: RoutePredicate[];
  /** Child predicate for 'not' operator */
  child?: RoutePredicate;
}

/**
 * Message transformation configuration
 */
export interface RouteTransform {
  /** Transform operation */
  op: 'pick' | 'map' | 'custom';
  /** Paths to pick from message (for 'pick' operation) */
  paths?: string[];
  /** Transform function (for 'map' operation) */
  fn?: (value: any) => any;
  /** ID of registered transform function (for 'custom' operation) */
  fnId?: string;
}

/**
 * Route action configuration
 */
export interface RouteAction {
  /** Action type */
  type: 'EMIT' | 'FORWARD' | 'LOG' | 'CALL';
  /** Message to emit (for EMIT action) */
  message?: Partial<PanMessage>;
  /** Fields to inherit from original message */
  inherit?: string[];
  /** Topic to forward to (for FORWARD action) */
  topic?: string;
  /** Log level (for LOG action) */
  level?: 'debug' | 'info' | 'warn' | 'error';
  /** Log template with {{path}} placeholders (for LOG action) */
  template?: string;
  /** ID of registered handler (for CALL action) */
  handlerId?: string;
}

/**
 * Route configuration
 */
export interface RouteConfig {
  /** Human-readable route name */
  name: string;
  /** Whether route is enabled (default: true) */
  enabled?: boolean;
  /** Message matching criteria */
  match?: RouteMatch;
  /** Message transformation */
  transform?: RouteTransform;
  /** Actions to execute when route matches */
  actions: RouteAction[];
}

/**
 * Route information (includes runtime metadata)
 */
export interface RouteInfo extends RouteConfig {
  /** Unique route ID */
  id: string;
  /** Timestamp when route was created */
  created: number;
  /** Timestamp when route was last updated */
  updated: number;
}

/**
 * Routing statistics
 */
export interface RouteStats {
  /** Total number of routes */
  routeCount: number;
  /** Total route evaluations */
  routesEvaluated: number;
  /** Total route matches */
  routesMatched: number;
  /** Total actions executed */
  actionsExecuted: number;
  /** Total errors */
  errors: number;
}

/**
 * Route change event
 */
export interface RouteChangeEvent {
  /** Type of change */
  action: 'add' | 'update' | 'remove' | 'enable' | 'disable' | 'clear';
  /** ID of affected route */
  routeId?: string;
  /** Route data */
  route?: RouteInfo;
}

/**
 * Route error event
 */
export interface RouteErrorEvent {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** Original error */
  error: Error;
  /** Additional context */
  context?: any;
}

/**
 * Storage adapter interface for route persistence
 */
export interface StorageAdapter {
  /** Get item from storage */
  getItem(key: string): Promise<string | null> | string | null;
  /** Set item in storage */
  setItem(key: string, value: string): Promise<void> | void;
  /** Remove item from storage */
  removeItem(key: string): Promise<void> | void;
}

/**
 * Routing Manager - manages message routing rules
 */
export interface RoutingManager {
  /**
   * Add a new route
   * @param route - Route configuration
   * @returns Route ID
   */
  add(route: RouteConfig): string;

  /**
   * Update an existing route
   * @param id - Route ID
   * @param patch - Partial route config to update
   */
  update(id: string, patch: Partial<RouteConfig>): void;

  /**
   * Remove a route
   * @param id - Route ID
   */
  remove(id: string): void;

  /**
   * List all routes
   * @returns Array of route information
   */
  list(): RouteInfo[];

  /**
   * Get a specific route
   * @param id - Route ID
   * @returns Route information or undefined
   */
  get(id: string): RouteInfo | undefined;

  /**
   * Enable a route
   * @param id - Route ID
   */
  enable(id: string): void;

  /**
   * Disable a route
   * @param id - Route ID
   */
  disable(id: string): void;

  /**
   * Clear all routes
   */
  clear(): void;

  /**
   * Process a message through routing system
   * @param message - PAN message
   * @returns Array of matched routes
   */
  processMessage(message: PanMessage): RouteInfo[];

  /**
   * Register a custom action handler
   * @param id - Handler ID
   * @param handler - Handler function
   * @returns Unregister function
   */
  registerHandler(id: string, handler: (msg: PanMessage) => void): () => void;

  /**
   * Register a custom transform function
   * @param id - Transform ID
   * @param fn - Transform function
   * @returns Unregister function
   */
  registerTransform(id: string, fn: (value: any) => any): () => void;

  /**
   * Subscribe to route changes
   * @param listener - Change listener
   * @returns Unsubscribe function
   */
  onChange(listener: (change: RouteChangeEvent) => void): () => void;

  /**
   * Subscribe to routing errors
   * @param listener - Error listener
   * @returns Unsubscribe function
   */
  onError(listener: (error: RouteErrorEvent) => void): () => void;

  /**
   * Get routing statistics
   * @returns Current statistics
   */
  getStats(): RouteStats;

  /**
   * Reset routing statistics
   */
  resetStats(): void;

  /**
   * Set storage adapter for route persistence
   * @param adapter - Storage adapter
   */
  setStorage(adapter: StorageAdapter): void;
}

/**
 * Global PAN interface extension for routing
 */
declare global {
  interface Window {
    pan: {
      routes: RoutingManager;
      [key: string]: any;
    };
  }
}
