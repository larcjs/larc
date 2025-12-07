/**
 * Configuration for PAN autoloader
 */
export interface AutoloadConfig {
  /** Full CDN URL (e.g., 'https://unpkg.com/pan@latest/') */
  baseUrl?: string | null;

  /** Relative path from baseUrl (default: './components/') */
  componentsPath?: string;

  /** File extension for components (default: '.mjs') */
  extension?: string;

  /** IntersectionObserver margin in pixels (default: 600) */
  rootMargin?: number;

  /** Computed full path for component loading (read-only) */
  resolvedComponentsPath?: string;

  /** Optional custom component path mappings */
  componentPaths?: Record<string, string>;

  /** Optional custom path resolver function */
  resolveComponent?: (tagName: string) => string | null | undefined;

  /** Optional path utilities */
  paths?: {
    resolve(aliasOrPath: string, subpath?: string): string;
    join(...parts: string[]): string;
    component(componentName: string): string;
  };
}

/**
 * Global window configuration for PAN autoloader
 */
declare global {
  interface Window {
    /** PAN autoloader configuration */
    panAutoload?: AutoloadConfig;

    /** Internal flag indicating PAN bus is ready */
    __panReady?: boolean;
  }
}
