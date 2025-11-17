/**
 * @fileoverview React hook for accessing/creating PAN client instances
 */

import { useEffect, useRef, useState } from 'react';

/**
 * Hook to get or create a PAN client instance
 * 
 * @param {Object} options - Configuration options
 * @param {HTMLElement|Document} [options.host] - Host element for the client
 * @param {string} [options.busSelector] - Selector for the PAN bus element
 * @returns {{ client: import('@larcjs/core').PanClient | null, ready: boolean, error: Error | null }}
 * 
 * @example
 * ```jsx
 * function MyComponent() {
 *   const { client, ready } = usePanClient();
 *   
 *   if (!ready) return <div>Loading...</div>;
 *   
 *   return <div>Client ready!</div>;
 * }
 * ```
 */
export function usePanClient(options = {}) {
  const { host, busSelector } = options;
  const [client, setClient] = useState(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    let clientInstance = null;

    async function initializeClient() {
      try {
        // Dynamically import PanClient
        const { PanClient } = await import('@larcjs/core/pan-client.mjs');
        
        if (!mounted) return;

        // Create client instance
        clientInstance = new PanClient(host, busSelector);
        clientRef.current = clientInstance;

        // Wait for client to be ready
        await clientInstance.ready();
        
        if (!mounted) return;

        setClient(clientInstance);
        setReady(true);
        setError(null);
      } catch (err) {
        if (!mounted) return;
        
        console.error('Failed to initialize PAN client:', err);
        setError(err);
        setReady(false);
      }
    }

    initializeClient();

    return () => {
      mounted = false;
      // Client cleanup happens when component unmounts
      // Individual subscriptions should clean themselves up
    };
  }, [host, busSelector]);

  return { client, ready, error };
}
