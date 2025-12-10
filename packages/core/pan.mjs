/**
 * @fileoverview PAN Autoload - Progressive loading of Web Components on demand
 *
 * Automatically discovers and loads custom elements as they approach the viewport.
 * Zero build, zero config - just include pan.mjs and use your components.
 *
 * @example
 * // Simplest usage - just include pan.mjs
 * <script type="module" src="https://larcjs.com/pan.mjs"></script>
 * <pan-card></pan-card>
 *
 * @example
 * // Multiple paths - local first, CDN fallback
 * <script type="module">
 *   window.panAutoload = {
 *     paths: [
 *       './',                              // Check local first
 *       '/ui/',                            // Then project ui folder
 *       'https://unpkg.com/@larcjs/ui/'    // CDN fallback
 *     ]
 *   };
 * </script>
 * <script type="module" src="/pan.mjs"></script>
 *
 * @example
 * // Override specific component path
 * <my-card data-module="/custom/special-card.mjs"></my-card>
 */

/**
 * @typedef {Object} AutoloadConfig
 * @property {string[]} paths - Array of paths to search for components (default: ['./'])
 * @property {string} extension - File extension for components (default: '.mjs')
 * @property {number} rootMargin - IntersectionObserver margin in pixels (default: 600)
 */

// Merge user configuration from window.panAutoload if provided
const userConfig = (typeof window !== 'undefined' && window.panAutoload) || {};

/**
 * Active configuration
 * @type {AutoloadConfig}
 */
const config = {
  paths: userConfig.paths || ['./'],
  extension: userConfig.extension || '.mjs',
  rootMargin: userConfig.rootMargin ?? 600,
};

// Normalize extension
if (!config.extension.startsWith('.')) {
  config.extension = `.${config.extension}`;
}

// Resolve paths relative to this script's location
const baseUrl = new URL('./', import.meta.url).href;
const resolvedPaths = config.paths.map(p => {
  if (p.startsWith('http://') || p.startsWith('https://') || p.startsWith('/')) {
    return p.endsWith('/') ? p : `${p}/`;
  }
  try {
    return new URL(p, baseUrl).href;
  } catch {
    return p.endsWith('/') ? p : `${p}/`;
  }
});

/**
 * Cache of successfully resolved component URLs
 * @type {Map<string, string>}
 */
const resolvedComponents = new Map();

/**
 * Set of currently loading module URLs
 * @type {Set<string>}
 */
const loading = new Set();

/**
 * WeakSet of observed elements
 * @type {WeakSet<Element>}
 */
const observed = new WeakSet();

/**
 * IntersectionObserver for progressive loading
 */
const io = typeof IntersectionObserver !== 'undefined'
  ? new IntersectionObserver((entries) => {
      for (const { isIntersecting, target } of entries) {
        if (!isIntersecting) continue;
        io.unobserve(target);
        maybeLoadFor(target);
      }
    }, { rootMargin: `${config.rootMargin}px` })
  : null;

/**
 * Check if a node is an undefined custom element
 * @param {Node} node
 * @returns {boolean}
 */
function isCustomTag(node) {
  return (
    node?.nodeType === 1 &&
    node.tagName?.includes('-') &&
    !customElements.get(node.localName)
  );
}

/**
 * Try to load a component from multiple paths
 * @param {string} tag - Component tag name
 * @returns {Promise<string|null>} - Resolved URL or null
 */
async function resolveComponent(tag) {
  // Check cache first
  if (resolvedComponents.has(tag)) {
    return resolvedComponents.get(tag);
  }

  const filename = `${tag}${config.extension}`;

  for (const basePath of resolvedPaths) {
    const url = `${basePath}${filename}`;
    try {
      // Try to fetch with HEAD to check existence without downloading
      const response = await fetch(url, { method: 'HEAD' });
      if (response.ok) {
        resolvedComponents.set(tag, url);
        return url;
      }
    } catch {
      // Path didn't work, try next
    }
  }

  // If HEAD requests fail (CORS), try import directly from first path
  const fallbackUrl = `${resolvedPaths[0]}${filename}`;
  resolvedComponents.set(tag, fallbackUrl);
  return fallbackUrl;
}

/**
 * Load component module for an element
 * @param {Element} el
 * @returns {Promise<void>}
 */
export async function maybeLoadFor(el) {
  if (!el || !isCustomTag(el)) return;

  const tag = el.localName;

  // Check for explicit data-module override
  const explicit = el.getAttribute('data-module');
  const url = explicit || await resolveComponent(tag);

  if (!url || loading.has(url) || customElements.get(tag)) return;

  loading.add(url);
  try {
    const mod = await import(url);
    if (!customElements.get(tag) && mod?.default instanceof Function) {
      customElements.define(tag, mod.default);
    }
  } catch (err) {
    console.warn(`[pan] Failed to load ${url} for <${tag}>`, err);
  } finally {
    loading.delete(url);
  }
}

/**
 * Observe a DOM tree for undefined custom elements
 * @param {Document|Element} root
 */
export function observeTree(root = document) {
  if (!root || observed.has(root)) return;

  const nodes = root.querySelectorAll?.(':not(:defined)') || [];
  nodes.forEach((el) => {
    if (isCustomTag(el) && !observed.has(el)) {
      observed.add(el);
      io ? io.observe(el) : maybeLoadFor(el);
    }
  });

  if (isCustomTag(root) && !observed.has(root)) {
    observed.add(root);
    io ? io.observe(root) : maybeLoadFor(root);
  }
}

/**
 * Set up MutationObserver for dynamic content
 */
function setupMutationObserver() {
  if (typeof MutationObserver === 'undefined') return;

  new MutationObserver((mutations) => {
    for (const mut of mutations) {
      if (mut.type === 'childList') {
        mut.addedNodes.forEach((node) => observeTree(node));
      } else if (mut.type === 'attributes' && mut.attributeName === 'data-module') {
        if (isCustomTag(mut.target)) {
          io ? io.observe(mut.target) : maybeLoadFor(mut.target);
        }
      }
    }
  }).observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['data-module'],
  });
}

/**
 * Ensure pan-bus exists and is loaded
 */
async function ensurePanBus() {
  let bus = document.querySelector('pan-bus');

  if (!bus) {
    bus = document.createElement('pan-bus');
    (document.body || document.documentElement).prepend(bus);
  }

  // Use lite version by default unless debug/routing needed
  const needsFull = bus.hasAttribute('debug') ||
                    bus.hasAttribute('enable-routing') ||
                    bus.hasAttribute('enable-tracing');

  if (!needsFull && !bus.hasAttribute('data-module')) {
    bus.setAttribute('data-module', new URL('./pan-bus-lite.mjs', import.meta.url).href);
  }

  await maybeLoadFor(bus);
}

/**
 * Initialize the autoloader
 */
function init() {
  if (typeof document === 'undefined') return;

  ensurePanBus().then(() => {
    observeTree(document);
    setupMutationObserver();

    // Non-blocking scan of existing elements
    const scan = () => {
      document.querySelectorAll(':not(:defined)').forEach((el) => {
        if (isCustomTag(el)) maybeLoadFor(el);
      });
    };

    typeof requestIdleCallback === 'function'
      ? requestIdleCallback(scan)
      : scan();
  });
}

// Start autoloading
init();

/**
 * Public API
 */
export const panAutoload = {
  config,
  paths: resolvedPaths,
  observeTree,
  maybeLoadFor,
  resolveComponent,
};

if (typeof window !== 'undefined') {
  window.panAutoload = Object.assign(window.panAutoload || {}, panAutoload);
}

export default panAutoload;
