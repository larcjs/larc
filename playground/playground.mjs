/**
 * LARC Playground - Main Entry Point
 * 
 * Loads all playground components and sets up the main UI
 */

// Import pan-bus for PAN communication
import '../core/src/components/pan-bus.mjs';

// Import playground components
import './components/pg-palette.mjs';
import './components/pg-canvas.mjs';
import './components/pg-properties.mjs';
import './components/pg-exporter.mjs';
import './components/pg-bus-monitor.mjs';

// Setup header button functionality
document.addEventListener('DOMContentLoaded', () => {
  const bottomPanel = document.getElementById('bottom-panel');
  const codePanel = document.getElementById('code-panel');
  const busPanel = document.getElementById('bus-panel');
  const toggleCodeBtn = document.getElementById('toggle-code');
  const toggleBusBtn = document.getElementById('toggle-bus-monitor');

  // Toggle code exporter
  toggleCodeBtn.addEventListener('click', () => {
    const isHidden = bottomPanel.hasAttribute('hidden');
    
    if (isHidden) {
      bottomPanel.removeAttribute('hidden');
      codePanel.removeAttribute('hidden');
      busPanel.setAttribute('hidden', '');
      toggleCodeBtn.textContent = 'Hide Code';
    } else {
      bottomPanel.setAttribute('hidden', '');
      toggleCodeBtn.textContent = 'View Code';
    }
  });

  // Toggle bus monitor
  toggleBusBtn.addEventListener('click', () => {
    const isHidden = bottomPanel.hasAttribute('hidden');
    
    if (isHidden) {
      bottomPanel.removeAttribute('hidden');
      busPanel.removeAttribute('hidden');
      codePanel.setAttribute('hidden', '');
      toggleBusBtn.textContent = 'Hide Monitor';
    } else {
      bottomPanel.setAttribute('hidden', '');
      toggleBusBtn.textContent = 'PAN Monitor';
    }
  });
});
