/**
 * @fileoverview PAN Security Utilities
 *
 * Security helpers for PAN framework:
 * - HTTPS enforcement
 * - XSS prevention
 * - Input sanitization
 * - Security best practices
 */

const DEFAULT_ALLOWED_TAGS = new Set([
  'a',
  'abbr',
  'b',
  'blockquote',
  'br',
  'code',
  'dd',
  'div',
  'dl',
  'dt',
  'em',
  'figcaption',
  'figure',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'kbd',
  'li',
  'mark',
  'ol',
  'p',
  'pre',
  'q',
  's',
  'section',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const DEFAULT_ALLOWED_ATTRS = new Set([
  'alt',
  'class',
  'colspan',
  'data-theme',
  'dir',
  'height',
  'href',
  'id',
  'lang',
  'name',
  'ref',
  'rel',
  'role',
  'rowspan',
  'scope',
  'src',
  'tabindex',
  'target',
  'title',
  'type',
  'value',
  'width',
]);

const URI_ATTRS = new Set([
  'href',
  'src',
  'xlink:href',
  'action',
  'formaction',
  'poster',
]);

const DROP_CONTENT_TAGS = new Set([
  'base',
  'iframe',
  'link',
  'meta',
  'noscript',
  'object',
  'script',
  'style',
  'template',
]);

/**
 * Check if running in production and enforce HTTPS
 * @param {Object} options - Configuration options
 * @param {boolean} [options.enforce=true] - Whether to enforce HTTPS
 * @param {string[]} [options.allowedHosts=[]] - Hosts exempt from HTTPS (e.g., localhost)
 */
export function enforceHTTPS(options = {}) {
  const {
    enforce = true,
    allowedHosts = ['localhost', '127.0.0.1', '[::1]'],
  } = options;

  if (!enforce) return;

  // Check if we're on HTTPS or an allowed host
  const isHTTPS = location.protocol === 'https:';
  const hostname = location.hostname;
  const isAllowedHost = allowedHosts.some(host => hostname === host);

  if (!isHTTPS && !isAllowedHost) {
    console.error('🔒 PAN Security: HTTPS is required in production');
    console.error(`Current URL: ${location.href}`);
    console.error('Redirecting to HTTPS...');

    // Redirect to HTTPS - construct URL safely using location properties
    // instead of user-controllable location.href
    const safeURL = new URL(location.href);
    safeURL.protocol = 'https:';
    location.replace(safeURL.href);
  }
}

/**
 * Sanitize HTML to prevent XSS
 *
 * @param {string} html - HTML string to sanitize
 * @param {Object} options - Optional configuration
 * @param {string[]} [options.allowedTags] - Override allowed tag list
 * @param {string[]} [options.allowedAttributes] - Override allowed attribute list
 * @param {boolean} [options.allowCustomElements=false] - Allow custom elements (tag-name contains "-")
 * @returns {string} Sanitized HTML
 */
export function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') return '';

  if (typeof document === 'undefined' || typeof document.createElement !== 'function') {
    return escapeHTML(html);
  }

  const template = document.createElement('template');
  template.innerHTML = html;

  const config = createSanitizeConfig(options);
  sanitizeTree(template.content, config);

  return template.innerHTML;
}

/**
 * Safe innerHTML setter that sanitizes content
 *
 * @param {HTMLElement} element - Element to set content on
 * @param {string} html - HTML content (will be sanitized)
 * @param {Object} options - Optional sanitizer overrides
 */
export function safeSetHTML(element, html, options = {}) {
  if (!element) return;

  if (typeof html !== 'string') {
    element.textContent = '';
    return;
  }

  element.innerHTML = sanitizeHTML(html, options);
}

/**
 * Create a safe text node (alternative to innerHTML)
 *
 * @param {string} text - Text content
 * @returns {Text} Text node
 */
export function createTextNode(text) {
  return document.createTextNode(text || '');
}

/**
 * Safely create an element with attributes
 *
 * @param {string} tag - Element tag name
 * @param {Object} attrs - Attributes to set
 * @param {string} content - Text content (not HTML)
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, content = '') {
  const element = document.createElement(tag);

  // Set attributes safely
  for (const [key, value] of Object.entries(attrs)) {
    // Skip event handlers
    if (key.startsWith('on')) {
      console.warn(`Skipping event handler attribute: ${key}`);
      continue;
    }

    // Skip dangerous attributes
    if (['innerHTML', 'outerHTML'].includes(key)) {
      console.warn(`Skipping dangerous attribute: ${key}`);
      continue;
    }

    element.setAttribute(key, value);
  }

  // Set text content (not HTML)
  if (content) {
    element.textContent = content;
  }

  return element;
}

/**
 * Validate URL to prevent javascript: and data: schemes
 *
 * @param {string} url - URL to validate
 * @returns {boolean} True if URL is safe
 */
export function isSafeURL(url) {
  if (!url || typeof url !== 'string') return false;

  const trimmed = url.trim().toLowerCase();

  // Block dangerous protocols
  const dangerousProtocols = [
    'javascript:',
    'data:',
    'vbscript:',
    'file:',
  ];

  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`Blocked dangerous URL protocol: ${protocol}`);
      return false;
    }
  }

  return true;
}

/**
 * Safely set element href (for links)
 *
 * @param {HTMLAnchorElement} element - Link element
 * @param {string} href - URL to set
 */
export function setSafeHref(element, href) {
  if (!element || !href) return;

  if (isSafeURL(href)) {
    element.href = href;
  } else {
    console.error('Blocked unsafe URL:', href);
    element.href = '#';
  }
}

/**
 * Check if Content Security Policy is properly configured
 *
 * @returns {Object} CSP status
 */
export function checkCSP() {
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  const cspHeader = document.querySelector('meta[name="Content-Security-Policy"]');

  const hasCSP = !!(cspMeta || cspHeader);

  if (!hasCSP) {
    console.warn('⚠ PAN Security: No Content-Security-Policy found');
    console.warn('Add CSP meta tag or header for better security');
  }

  return {
    configured: hasCSP,
    meta: cspMeta ? cspMeta.content : null,
    header: cspHeader ? cspHeader.content : null,
  };
}

function createSanitizeConfig(options = {}) {
  const {
    allowedTags = DEFAULT_ALLOWED_TAGS,
    allowedAttributes = DEFAULT_ALLOWED_ATTRS,
    allowCustomElements = false,
  } = options;

  return {
    allowedTags: new Set([...allowedTags].map(tag => tag.toLowerCase())),
    allowedAttributes: new Set([...allowedAttributes].map(attr => attr.toLowerCase())),
    allowCustomElements,
  };
}

function sanitizeTree(root, config) {
  if (!root || !root.querySelectorAll) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  const nodes = [];

  // Collect nodes first so we can safely mutate the tree while iterating
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

  for (const node of nodes) {
    if (!node.isConnected) continue;
    const tagName = node.tagName.toLowerCase();

    if (DROP_CONTENT_TAGS.has(tagName)) {
      node.remove();
      continue;
    }

    const isAllowedTag =
      config.allowedTags.has(tagName) ||
      (config.allowCustomElements && tagName.includes('-'));

    if (!isAllowedTag) {
      unwrapElement(node);
      continue;
    }

    sanitizeAttributes(node, config);
  }
}

function unwrapElement(element) {
  const parent = element.parentNode;
  if (!parent) {
    element.remove();
    return;
  }

  while (element.firstChild) {
    parent.insertBefore(element.firstChild, element);
  }

  parent.removeChild(element);
}

function sanitizeAttributes(element, config) {
  for (const attr of Array.from(element.attributes)) {
    const name = attr.name.toLowerCase();
    const value = attr.value;

    if (name.startsWith('on')) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === 'style') {
      element.removeAttribute(attr.name);
      continue;
    }

    const isAllowedAttribute =
      config.allowedAttributes.has(name) ||
      name.startsWith('data-') ||
      name.startsWith('aria-');

    if (!isAllowedAttribute) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (URI_ATTRS.has(name) && !isSafeURL(value)) {
      element.removeAttribute(attr.name);
      continue;
    }

    if (name === 'target' && value === '_blank') {
      ensureRelForBlankTarget(element);
    }
  }
}

function ensureRelForBlankTarget(element) {
  const rel = element.getAttribute('rel');
  const values = new Set(
    (rel ? rel.split(/\s+/) : []).filter(Boolean).map(token => token.toLowerCase()),
  );

  values.add('noopener');
  values.add('noreferrer');

  element.setAttribute('rel', Array.from(values).join(' ').trim());
}

/**
 * Initialize PAN security features
 *
 * @param {Object} options - Configuration options
 */
export function initSecurity(options = {}) {
  const {
    enforceHTTPS: shouldEnforceHTTPS = true,
    checkCSP: shouldCheckCSP = true,
  } = options;

  console.log('🛡️ PAN Security initializing...');

  // Enforce HTTPS
  if (shouldEnforceHTTPS) {
    enforceHTTPS();
  }

  // Check CSP
  if (shouldCheckCSP) {
    checkCSP();
  }

  console.log('✓ PAN Security initialized');
}

/**
 * Escape HTML special characters
 *
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
export function escapeHTML(text) {
  if (!text || typeof text !== 'string') return '';

  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };

  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Strip all HTML tags from a string
 *
 * @param {string} html - HTML string
 * @returns {string} Plain text
 */
export function stripHTML(html) {
  if (!html || typeof html !== 'string') return '';

  const temp = document.createElement('div');
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || '';
}

export default {
  enforceHTTPS,
  sanitizeHTML,
  safeSetHTML,
  createTextNode,
  createElement,
  isSafeURL,
  setSafeHref,
  checkCSP,
  initSecurity,
  escapeHTML,
  stripHTML,
};
