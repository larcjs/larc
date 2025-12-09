/**
 * Test Utilities
 * Helper functions for component testing
 */

import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Core package root (2 levels up from tests/lib/)
const coreRoot = resolve(__dirname, '../..');

/**
 * Convert a relative file path to an HTTP URL for browser testing
 * @param {string} relativePath - Path relative to core package root (e.g., 'tests/fixtures/basic-pan-bus.html')
 * @returns {string} HTTP URL
 */
export function fileUrl(relativePath) {
  // Use HTTP URL for web server at localhost:8080
  // The web server serves from the parent larc-repos directory, so we need to include 'core/'
  return `http://localhost:8080/core/${relativePath}`;
}

/**
 * Wait for custom element to be defined
 * @param {Page} page - Playwright page
 * @param {string} tagName - Custom element tag name
 */
export async function waitForElement(page, tagName) {
  await page.evaluate((tag) => customElements.whenDefined(tag), tagName);
}

/**
 * Create a test page with PAN autoloader
 * @param {Page} page - Playwright page
 * @returns {Promise<void>}
 */
export async function setupPanPage(page) {
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>Test Page</title>
      </head>
      <body>
        <script type="module" src="${fileUrl('../src/pan.mjs')}"></script>
      </body>
    </html>
  `);
}

/**
 * Publish a PAN message from the test page
 * @param {Page} page - Playwright page
 * @param {string} topic - Message topic
 * @param {any} data - Message data
 */
export async function publishMessage(page, topic, data) {
  await page.evaluate(
    ({ topic, data }) => {
      document.dispatchEvent(
        new CustomEvent('pan:publish', {
          detail: { topic, data },
        })
      );
    },
    { topic, data }
  );
}

/**
 * Subscribe to PAN messages and collect them
 * @param {Page} page - Playwright page
 * @param {string} topic - Topic to subscribe to
 * @returns {Promise<any[]>} Array of received messages
 */
export async function collectMessages(page, topic) {
  return page.evaluate((topic) => {
    return new Promise((resolve) => {
      const messages = [];
      const handler = (e) => {
        if (e.detail.topic === topic) {
          messages.push(e.detail.data);
        }
      };
      document.addEventListener('pan:deliver', handler);

      // Clean up after 100ms
      setTimeout(() => {
        document.removeEventListener('pan:deliver', handler);
        resolve(messages);
      }, 100);
    });
  }, topic);
}
