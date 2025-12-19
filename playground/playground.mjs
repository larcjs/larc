/**
 * LARC Playground - Main Entry Point
 *
 * Loads all playground components and sets up the main UI
 */

// Import playground components
import './components/pg-palette.mjs';
import './components/pg-canvas.mjs';
import './components/pg-properties.mjs';
import './components/pg-exporter.mjs';
import './components/pg-bus-monitor.mjs';

// Import examples
import { getAllExamples, getExample } from './examples.mjs';

// Pan-bus is loaded via the <pan-bus> element in index.html

// Setup header button functionality
function setupPlayground() {
  const bottomPanel = document.getElementById('bottom-panel');
  const codePanel = document.getElementById('code-panel');
  const busPanel = document.getElementById('bus-panel');
  const toggleCodeBtn = document.getElementById('toggle-code');
  const toggleBusBtn = document.getElementById('toggle-bus-monitor');
  const exampleSelect = document.getElementById('load-example');
  const canvas = document.querySelector('pg-canvas');

  if (!exampleSelect || !canvas) {
    console.log('Waiting for DOM elements...');
    return;
  }

  // Populate examples dropdown
  console.log('Loading examples into dropdown...');
  const allExamples = getAllExamples();
  console.log(`Found ${allExamples.length} examples`);

  allExamples.forEach(example => {
    const option = document.createElement('option');
    option.value = example.id;
    option.textContent = `${example.name} - ${example.description}`;
    exampleSelect.appendChild(option);
  });

  // Load example when selected
  exampleSelect.addEventListener('change', async (e) => {
    const exampleId = e.target.value;
    if (!exampleId) return;

    const example = getExample(exampleId);
    if (example && canvas) {
      await canvas.loadExample(example);
    }

    // Reset dropdown
    e.target.value = '';
  });

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
}

// Call setup when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupPlayground);
} else {
  // DOM already loaded (module scripts are deferred)
  setupPlayground();
}

// Show code panel by default after components are loaded
requestAnimationFrame(() => {
  const bottomPanel = document.getElementById('bottom-panel');
  const codePanel = document.getElementById('code-panel');
  const toggleCodeBtn = document.getElementById('toggle-code');

  if (bottomPanel && codePanel && toggleCodeBtn) {
    bottomPanel.removeAttribute('hidden');
    codePanel.removeAttribute('hidden');
    toggleCodeBtn.textContent = 'Hide Code';
  }
});
