/**
 * LARC Configuration
 * Central configuration for path resolution across the monorepo
 *
 * This config can be loaded automatically by the enhanced autoloader or
 * manually via import when needed.
 *
 * @example
 * // In your HTML
 * <script type="module" src="/larc-config.mjs"></script>
 * <script type="module" src="/core/src/pan.mjs"></script>
 *
 * @example
 * // In your JS modules
 * import { paths } from '/larc-config.mjs';
 * import { PanClient } from paths.resolve('@larc/core', 'components/pan-client.mjs');
 */

/**
 * Environment detection
 */
const isDevelopment = window.location.hostname === 'localhost' ||
                      window.location.hostname === '127.0.0.1' ||
                      window.location.protocol === 'file:';

/**
 * Path aliases for different resources
 * These work like package.json "paths" in TypeScript
 */
export const aliases = {
  '@larc/core': isDevelopment
    ? '/core/src'
    : 'https://unpkg.com/@larcjs/core@1.0.0/src',

  '@larc/components': isDevelopment
    ? '/ui/src'
    : 'https://unpkg.com/@larcjs/components@1.0.0/src',

  '@larc/examples': isDevelopment
    ? '/examples'
    : 'https://unpkg.com/@larcjs/examples@1.0.0',

  '@larc/site': isDevelopment
    ? '/site'
    : 'https://larcjs.github.io/site',
};

/**
 * Base paths for different resource types
 */
export const basePaths = {
  root: '/',
  core: '/core/src',
  components: '/ui/src',
  examples: '/examples',
  site: '/site',
  assets: '/examples/assets',
};

/**
 * Component-specific paths (for autoloader)
 */
export const componentPaths = {
  // Core components
  'pan-bus': '@larc/core/components/pan-bus.mjs',
  'pan-client': '@larc/core/components/pan-client.mjs',

  // Data components
  'pan-data-table': '@larc/components/components/pan-data-table.mjs',
  'pan-data-provider': '@larc/components/components/pan-data-provider.mjs',
  'pan-form': '@larc/components/components/pan-form.mjs',

  // UI components
  'pan-card': '@larc/components/components/pan-card.mjs',
  'pan-modal': '@larc/components/components/pan-modal.mjs',
  'pan-tabs': '@larc/components/components/pan-tabs.mjs',
  'pan-dropdown': '@larc/components/components/pan-dropdown.mjs',

  // Utility components
  'pan-inspector': '@larc/components/components/pan-inspector.mjs',
  'pan-theme-provider': '@larc/components/components/pan-theme-provider.mjs',
  'pan-theme-toggle': '@larc/components/components/pan-theme-toggle.mjs',

  // Store components
  'pan-invoice-store': '@larc/components/components/pan-invoice-store.mjs',

  // Site-specific components
  'pan-demo-nav': '@larc/site/components/pan-demo-nav.mjs',
  'pan-demo-viewer': '@larc/site/components/pan-demo-viewer.mjs',
};

/**
 * Path resolver utility
 * Resolves aliases and relative paths to absolute URLs
 */
export const paths = {
  /**
   * Resolve an alias or path to an absolute URL
   * @param {string} aliasOrPath - Alias like '@larc/core' or relative path
   * @param {string} [subpath] - Optional subpath to append
   * @returns {string} Resolved absolute URL
   *
   * @example
   * paths.resolve('@larc/core', 'components/pan-bus.mjs')
   * // => './core/src/components/pan-bus.mjs' (dev)
   * // => 'https://unpkg.com/@larcjs/core@1.0.0/src/components/pan-bus.mjs' (prod)
   */
  resolve(aliasOrPath, subpath = '') {
    // Check if it's an alias
    if (aliases[aliasOrPath]) {
      const base = aliases[aliasOrPath];
      return subpath ? this.join(base, subpath) : base;
    }

    // Check if it starts with an alias
    for (const [alias, basePath] of Object.entries(aliases)) {
      if (aliasOrPath.startsWith(alias + '/')) {
        const remainder = aliasOrPath.slice(alias.length + 1);
        return this.join(basePath, remainder);
      }
    }

    // Return as-is with optional subpath
    return subpath ? this.join(aliasOrPath, subpath) : aliasOrPath;
  },

  /**
   * Join path segments correctly
   * @param {string} base - Base path
   * @param {string} path - Path to append
   * @returns {string} Joined path
   */
  join(base, path) {
    const normalizedBase = base.endsWith('/') ? base : base + '/';
    const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
    return normalizedBase + normalizedPath;
  },

  /**
   * Get path for a specific component
   * @param {string} componentName - Component tag name
   * @returns {string} Resolved component path
   */
  component(componentName) {
    // Check explicit mapping
    if (componentPaths[componentName]) {
      return this.resolve(componentPaths[componentName]);
    }

    // Default: assume it's in components directory
    return this.resolve('@larc/components', `components/${componentName}.mjs`);
  },

  /**
   * Get import map for use with importmap
   * @returns {Object} Import map object
   */
  toImportMap() {
    const imports = {};

    // Add aliases
    for (const [alias, path] of Object.entries(aliases)) {
      imports[alias + '/'] = path.endsWith('/') ? path : path + '/';
    }

    // Add component mappings
    for (const [name, path] of Object.entries(componentPaths)) {
      imports[name] = this.resolve(path);
    }

    return { imports };
  }
};

/**
 * Configuration for pan-autoload
 */
export const autoloadConfig = {
  baseUrl: null,  // Use relative paths
  componentsPath: '/ui/src/components/',
  extension: '.mjs',
  rootMargin: 600,

  // Custom component resolver
  resolveComponent(tagName) {
    return paths.component(tagName);
  }
};

/**
 * Apply configuration to window.panAutoload
 * This runs automatically when the config is loaded
 */
if (typeof window !== 'undefined') {
  // Merge with existing config
  window.panAutoload = Object.assign(
    window.panAutoload || {},
    autoloadConfig,
    {
      paths,
      aliases,
      componentPaths
    }
  );

  // Add global helper for easy imports in scripts
  window.larcResolve = paths.resolve.bind(paths);
}

// Export everything
export default {
  aliases,
  basePaths,
  componentPaths,
  paths,
  autoloadConfig,
  isDevelopment
};
