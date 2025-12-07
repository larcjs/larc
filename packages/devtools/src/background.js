/**
 * Background service worker
 * Routes messages between content scripts and DevTools panels
 */

// Store connections to DevTools panels
const connections = new Map();

// Listen for connections from DevTools panels
chrome.runtime.onConnect.addListener(function(port) {
  if (port.name === 'devtools-panel') {
    // DevTools panels need to send their inspected tab ID via message
    port.onMessage.addListener((message) => {
      if (message.type === 'INIT' && message.tabId) {
        const tabId = message.tabId;

        // Store connection with inspected tab ID
        connections.set(tabId, port);

        console.log('[PAN DevTools] Panel connected for tab', tabId);
      }
    });

    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
      // Find and remove this port from connections
      for (const [tabId, p] of connections.entries()) {
        if (p === port) {
          connections.delete(tabId);
          console.log('[PAN DevTools] Panel disconnected for tab', tabId);
          break;
        }
      }
    });
  }
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PAN_MESSAGE') {
    const tabId = sender.tab?.id;

    // Forward to connected DevTools panel
    const port = connections.get(tabId);
    if (port) {
      try {
        port.postMessage(message);
      } catch (e) {
        console.error('[PAN DevTools] Error forwarding message:', e);
        connections.delete(tabId);
      }
    }
  }

  return true;
});

console.log('[PAN DevTools] Background service worker loaded');
