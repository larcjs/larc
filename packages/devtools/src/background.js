/**
 * Background service worker
 * Routes messages between content scripts and DevTools panels
 */

// Debug logging - enable via: chrome.storage.local.set({ panDevToolsDebug: true })
let debugEnabled = false;
chrome.storage.local.get('panDevToolsDebug', (result) => {
  debugEnabled = result.panDevToolsDebug === true;
});
chrome.storage.onChanged.addListener((changes) => {
  if (changes.panDevToolsDebug) {
    debugEnabled = changes.panDevToolsDebug.newValue === true;
  }
});
const debug = (...args) => debugEnabled && console.log('[PAN DevTools]', ...args);

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

        debug('Panel connected for tab', tabId);
      }
    });

    // Clean up on disconnect
    port.onDisconnect.addListener(() => {
      // Find and remove this port from connections
      for (const [tabId, p] of connections.entries()) {
        if (p === port) {
          connections.delete(tabId);
          debug('Panel disconnected for tab', tabId);
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
        debug('Error forwarding message:', e);
        connections.delete(tabId);
      }
    }
  }

  return true;
});

debug('Background service worker loaded');
