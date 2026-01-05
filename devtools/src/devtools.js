/**
 * DevTools panel creation
 * This runs when DevTools opens and creates the PAN panel
 */

// Debug logging - enable via: chrome.storage.local.set({ panDevToolsDebug: true })
let debugEnabled = false;
chrome.storage.local.get('panDevToolsDebug', (result) => {
  debugEnabled = result.panDevToolsDebug === true;
});
const debug = (...args) => debugEnabled && console.log('[PAN DevTools]', ...args);

// Create the PAN Inspector panel
chrome.devtools.panels.create(
  'PAN',
  'icons/icon-16.png',
  'panel.html',
  function(panel) {
    debug('Panel created');
  }
);
