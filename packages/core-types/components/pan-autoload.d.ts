import type { AutoloadConfig } from '../types/config.js';

/**
 * PAN Autoload - Progressive loading of Web Components on demand
 *
 * Automatically discovers and loads custom elements as they approach the viewport
 * using IntersectionObserver. Eliminates the need for manual imports and
 * customElements.define() calls, enabling true zero-build development.
 *
 * @example
 * // Configure before importing
 * window.panAutoload = {
 *   baseUrl: 'https://unpkg.com/@larcjs/core@latest/',
 *   extension: '.mjs'
 * };
 *
 * // Import the autoloader
 * import '@larcjs/core/pan.mjs';
 *
 * // Just use your components
 * <my-widget></my-widget>
 * <pan-card></pan-card>
 */

/**
 * Global configuration for PAN autoloader
 * Set window.panAutoload before importing pan.mjs to configure
 */
declare global {
  interface Window {
    panAutoload?: AutoloadConfig;
  }
}

export type { AutoloadConfig };
