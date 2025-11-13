/**
 * Playground Loader
 *
 * Conditionally loads pan-bus only if not already registered
 * (e.g., by browser extension)
 */

// Only load pan-bus if not already defined
if (!customElements.get('pan-bus')) {
  await import('../core/src/components/pan-bus.mjs');
}

// Now load playground components
import('./playground.mjs');
