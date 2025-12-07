/**
 * @larcjs/core-types
 *
 * TypeScript type definitions for @larcjs/core
 *
 * Install alongside @larcjs/core for full TypeScript support:
 * ```
 * npm install @larcjs/core
 * npm install -D @larcjs/core-types
 * ```
 *
 * @example
 * import { PanClient } from '@larcjs/core/pan-client.mjs';
 * import type { PanMessage, SubscribeOptions } from '@larcjs/core-types';
 *
 * const client = new PanClient();
 * client.subscribe<{ userId: number }>('user.updated', (msg: PanMessage) => {
 *   console.log(msg.data.userId);
 * });
 */

// Re-export all types
export * from './types/message.js';
export * from './types/subscription.js';
export * from './types/config.js';
export * from './types/routing.js';

// Re-export components
export * from './components/pan-client.js';
export * from './components/pan-bus.js';
export * from './components/pan-autoload.js';
