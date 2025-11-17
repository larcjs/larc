/**
 * @fileoverview React hook for subscribing to PAN messages
 */

import { useEffect, useRef } from 'react';
import { usePanClient } from './usePanClient.js';

/**
 * Hook to subscribe to PAN messages with automatic cleanup
 * 
 * @param {string|string[]} topics - Topic or array of topics to subscribe to
 * @param {Function} handler - Message handler function
 * @param {Object} [options] - Subscription options
 * @param {boolean} [options.retained] - Whether to receive retained messages
 * @param {AbortSignal} [options.signal] - AbortSignal for cancellation
 * @param {Object} [options.clientOptions] - Options to pass to usePanClient
 * @returns {{ ready: boolean, error: Error | null }}
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { ready } = usePanSubscribe('user.updated', (msg) => {
 *     console.log('User updated:', msg.data);
 *   });
 *   
 *   if (!ready) return <div>Connecting...</div>;
 *   
 *   return <div>Listening for updates...</div>;
 * }
 * ```
 * 
 * @example
 * ```jsx
 * // Subscribe to multiple topics
 * usePanSubscribe(['user.*', 'app.ready'], (msg) => {
 *   console.log('Message:', msg.topic, msg.data);
 * });
 * ```
 */
export function usePanSubscribe(topics, handler, options = {}) {
  const { retained, signal, clientOptions } = options;
  const { client, ready, error } = usePanClient(clientOptions);
  const handlerRef = useRef(handler);
  const unsubscribeRef = useRef(null);

  // Keep handler ref up to date
  useEffect(() => {
    handlerRef.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!client || !ready) return;

    // Subscribe with stable handler
    const stableHandler = (msg) => {
      handlerRef.current(msg);
    };

    try {
      const unsubscribe = client.subscribe(
        topics,
        stableHandler,
        { retained, signal }
      );
      
      unsubscribeRef.current = unsubscribe;

      // Cleanup function
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
          unsubscribeRef.current = null;
        }
      };
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }
  }, [client, ready, topics, retained, signal]);

  return { ready, error };
}
