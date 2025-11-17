/**
 * @fileoverview React hook for publishing PAN messages
 */

import { useCallback } from 'react';
import { usePanClient } from './usePanClient.js';

/**
 * Hook to get a publish function for sending PAN messages
 * 
 * @param {Object} [options] - Client options
 * @returns {{ publish: Function, ready: boolean, error: Error | null }}
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { publish, ready } = usePanPublish();
 *   
 *   const handleClick = () => {
 *     publish({
 *       topic: 'button.clicked',
 *       data: { buttonId: 'submit' }
 *     });
 *   };
 *   
 *   return <button onClick={handleClick} disabled={!ready}>Submit</button>;
 * }
 * ```
 * 
 * @example
 * ```jsx
 * // Publish with options
 * const { publish } = usePanPublish();
 * 
 * publish({
 *   topic: 'user.created',
 *   data: { id: 123, name: 'Alice' },
 *   retain: true,
 *   id: 'user-123'
 * });
 * ```
 */
export function usePanPublish(options = {}) {
  const { client, ready, error } = usePanClient(options);

  const publish = useCallback((message) => {
    if (!client || !ready) {
      console.warn('PAN client not ready, message not published:', message);
      return;
    }

    try {
      client.publish(message);
    } catch (err) {
      console.error('Failed to publish message:', err);
    }
  }, [client, ready]);

  return { publish, ready, error };
}
