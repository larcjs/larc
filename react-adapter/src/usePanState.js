/**
 * @fileoverview React hook for synced state via PAN bus
 */

import { useState, useCallback } from 'react';
import { usePanSubscribe } from './usePanSubscribe.js';
import { usePanPublish } from './usePanPublish.js';

/**
 * Hook for state that syncs across components via PAN bus
 * 
 * @template T
 * @param {string} topic - Topic to use for state sync
 * @param {T} initialValue - Initial state value
 * @param {Object} [options] - Options
 * @param {boolean} [options.retain] - Whether to retain state messages
 * @param {Object} [options.clientOptions] - Client options
 * @returns {[T, (value: T | ((prev: T) => T)) => void, { ready: boolean, error: Error | null }]}
 * 
 * @example
 * ```jsx
 * function Counter() {
 *   const [count, setCount, { ready }] = usePanState('counter.value', 0, { retain: true });
 *   
 *   if (!ready) return <div>Loading...</div>;
 *   
 *   return (
 *     <div>
 *       <p>Count: {count}</p>
 *       <button onClick={() => setCount(count + 1)}>Increment</button>
 *       <button onClick={() => setCount(prev => prev - 1)}>Decrement</button>
 *     </div>
 *   );
 * }
 * ```
 * 
 * @example
 * ```jsx
 * // Multiple components can share the same state
 * function ComponentA() {
 *   const [user, setUser] = usePanState('app.user', null, { retain: true });
 *   return <div>User: {user?.name}</div>;
 * }
 * 
 * function ComponentB() {
 *   const [user, setUser] = usePanState('app.user', null, { retain: true });
 *   return <button onClick={() => setUser({ name: 'Alice' })}>Set User</button>;
 * }
 * ```
 */
export function usePanState(topic, initialValue, options = {}) {
  const { retain = false, clientOptions } = options;
  const [state, setState] = useState(initialValue);
  const { publish, ready: publishReady, error: publishError } = usePanPublish(clientOptions);

  // Subscribe to state updates from other components
  const { ready: subscribeReady, error: subscribeError } = usePanSubscribe(
    topic,
    (msg) => {
      setState(msg.data);
    },
    { retained: retain, clientOptions }
  );

  // Set state and publish to PAN bus
  const setSharedState = useCallback((value) => {
    setState((prev) => {
      // Handle function updater
      const newValue = typeof value === 'function' ? value(prev) : value;
      
      // Publish to PAN bus
      if (publishReady) {
        publish({
          topic,
          data: newValue,
          retain
        });
      }
      
      return newValue;
    });
  }, [topic, retain, publish, publishReady]);

  const ready = publishReady && subscribeReady;
  const error = publishError || subscribeError;

  return [state, setSharedState, { ready, error }];
}
