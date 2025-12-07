/**
 * @larcjs/components-types
 *
 * TypeScript type definitions for @larcjs/components
 *
 * Install alongside @larcjs/components for full TypeScript support:
 * ```
 * npm install @larcjs/components
 * npm install -D @larcjs/components-types @larcjs/core-types
 * ```
 *
 * @example
 * import type { PanRouter, PanStore, PanTable } from '@larcjs/components-types';
 *
 * const router: PanRouter = document.querySelector('pan-router')!;
 * const store: PanStore = document.querySelector('pan-store')!;
 */

import type { PanClient } from '@larcjs/core-types';

/**
 * Base interface for all LARC components
 * All LARC components extend HTMLElement and typically include a PanClient
 */
export interface LarcComponent extends HTMLElement {
  /** PAN client for messaging */
  client?: PanClient;

  /** Component is connected to DOM */
  connectedCallback?(): void;

  /** Component is disconnected from DOM */
  disconnectedCallback?(): void;

  /** Attribute changed */
  attributeChangedCallback?(name: string, oldValue: string | null, newValue: string | null): void;
}

/**
 * Router component for client-side navigation
 */
export interface PanRouter extends LarcComponent {
  /** Navigate to a route */
  navigate(path: string): void;

  /** Get current route */
  getCurrentRoute(): { path: string; params: Record<string, string> };

  /** Register a route */
  addRoute(path: string, handler: (params: Record<string, string>) => void): void;
}

/**
 * Store component for state management
 */
export interface PanStore<T = any> extends LarcComponent {
  /** Get current state */
  getState(): T;

  /** Set state */
  setState(state: Partial<T>): void;

  /** Subscribe to state changes */
  subscribe(callback: (state: T) => void): () => void;
}

/**
 * Table component for data display
 */
export interface PanTable extends LarcComponent {
  /** Set table data */
  setData(data: any[]): void;

  /** Get selected rows */
  getSelectedRows(): any[];

  /** Clear selection */
  clearSelection(): void;
}

/**
 * Form component for user input
 */
export interface PanForm extends LarcComponent {
  /** Get form data */
  getData(): Record<string, any>;

  /** Set form data */
  setData(data: Record<string, any>): void;

  /** Validate form */
  validate(): boolean;

  /** Reset form */
  reset(): void;
}

/**
 * Modal dialog component
 */
export interface PanModal extends LarcComponent {
  /** Show modal */
  show(): void;

  /** Hide modal */
  hide(): void;

  /** Is modal open */
  isOpen(): boolean;
}

/**
 * Card component for content containers
 */
export interface PanCard extends LarcComponent {
  /** Card title */
  title?: string;

  /** Card is collapsed */
  collapsed?: boolean;

  /** Toggle collapsed state */
  toggle(): void;
}

/**
 * Inspector component for debugging PAN messages
 */
export interface PanInspector extends LarcComponent {
  /** Clear message log */
  clear(): void;

  /** Pause message capture */
  pause(): void;

  /** Resume message capture */
  resume(): void;
}

/**
 * Tabs component for tabbed interfaces
 */
export interface PanTabs extends LarcComponent {
  /** Select tab by index */
  selectTab(index: number): void;

  /** Get active tab index */
  getActiveTab(): number;
}

/**
 * Dropdown select component
 */
export interface PanDropdown extends LarcComponent {
  /** Get selected value */
  getValue(): string;

  /** Set selected value */
  setValue(value: string): void;

  /** Get all options */
  getOptions(): Array<{ value: string; label: string }>;
}

/**
 * Date picker component
 */
export interface PanDatePicker extends LarcComponent {
  /** Get selected date */
  getDate(): Date | null;

  /** Set selected date */
  setDate(date: Date): void;
}

/**
 * WebSocket connector component
 */
export interface PanWebSocket extends LarcComponent {
  /** Connect to WebSocket server */
  connect(url: string): void;

  /** Disconnect from server */
  disconnect(): void;

  /** Send message */
  send(data: any): void;

  /** Connection status */
  isConnected(): boolean;
}

/**
 * Server-sent events connector
 */
export interface PanSSE extends LarcComponent {
  /** Connect to SSE endpoint */
  connect(url: string): void;

  /** Disconnect from endpoint */
  disconnect(): void;

  /** Connection status */
  isConnected(): boolean;
}

/**
 * JWT authentication component
 */
export interface PanJWT extends LarcComponent {
  /** Get current token */
  getToken(): string | null;

  /** Set token */
  setToken(token: string): void;

  /** Clear token */
  clearToken(): void;

  /** Decode token */
  decode(): any;

  /** Check if token is expired */
  isExpired(): boolean;
}

/**
 * Theme provider component
 */
export interface PanThemeProvider extends LarcComponent {
  /** Get current theme */
  getTheme(): string;

  /** Set theme */
  setTheme(theme: string): void;

  /** Get available themes */
  getThemes(): string[];
}

/**
 * Theme toggle component
 */
export interface PanThemeToggle extends LarcComponent {
  /** Toggle between themes */
  toggle(): void;

  /** Get current theme */
  getCurrentTheme(): string;
}

/**
 * Pagination component
 */
export interface PanPagination extends LarcComponent {
  /** Current page */
  page: number;

  /** Items per page */
  pageSize: number;

  /** Total items */
  total: number;

  /** Go to specific page */
  goToPage(page: number): void;

  /** Go to next page */
  nextPage(): void;

  /** Go to previous page */
  previousPage(): void;
}

/**
 * Search bar component
 */
export interface PanSearchBar extends LarcComponent {
  /** Get search query */
  getQuery(): string;

  /** Set search query */
  setQuery(query: string): void;

  /** Clear search */
  clear(): void;
}

/**
 * Markdown editor component
 */
export interface PanMarkdownEditor extends LarcComponent {
  /** Get markdown content */
  getContent(): string;

  /** Set markdown content */
  setContent(content: string): void;

  /** Get HTML preview */
  getHTML(): string;
}

/**
 * Markdown renderer component
 */
export interface PanMarkdownRenderer extends LarcComponent {
  /** Set markdown to render */
  setMarkdown(markdown: string): void;

  /** Get rendered HTML */
  getHTML(): string;
}

/**
 * Chart component
 */
export interface PanChart extends LarcComponent {
  /** Set chart data */
  setData(data: any): void;

  /** Update chart */
  update(): void;

  /** Chart type */
  type: 'line' | 'bar' | 'pie' | 'scatter';
}

/**
 * File upload component
 */
export interface FileUpload extends LarcComponent {
  /** Get uploaded files */
  getFiles(): File[];

  /** Clear files */
  clear(): void;

  /** Maximum file size in bytes */
  maxSize: number;

  /** Allowed file types */
  accept: string;
}

/**
 * Drag and drop list component
 */
export interface DragDropList extends LarcComponent {
  /** Get list items */
  getItems(): any[];

  /** Set list items */
  setItems(items: any[]): void;

  /** Reorder items */
  reorder(fromIndex: number, toIndex: number): void;
}

/**
 * Data connector component for REST APIs
 */
export interface PanDataConnector extends LarcComponent {
  /** Fetch data */
  fetch(url: string, options?: RequestInit): Promise<any>;

  /** Set base URL */
  setBaseURL(url: string): void;

  /** Get base URL */
  getBaseURL(): string;
}

/**
 * GraphQL connector component
 */
export interface PanGraphQLConnector extends LarcComponent {
  /** Execute query */
  query(query: string, variables?: Record<string, any>): Promise<any>;

  /** Execute mutation */
  mutate(mutation: string, variables?: Record<string, any>): Promise<any>;

  /** Set endpoint */
  setEndpoint(url: string): void;
}

/**
 * IndexedDB storage component
 */
export interface PanIDB extends LarcComponent {
  /** Get item */
  get(key: string): Promise<any>;

  /** Set item */
  set(key: string, value: any): Promise<void>;

  /** Delete item */
  delete(key: string): Promise<void>;

  /** Clear all items */
  clear(): Promise<void>;

  /** Get all keys */
  keys(): Promise<string[]>;
}

/**
 * Schema form component for dynamic forms
 */
export interface PanSchemaForm extends LarcComponent {
  /** Set form schema */
  setSchema(schema: any): void;

  /** Get form data */
  getData(): Record<string, any>;

  /** Set form data */
  setData(data: Record<string, any>): void;

  /** Validate against schema */
  validate(): boolean;
}

/**
 * Validation component
 */
export interface PanValidation extends LarcComponent {
  /** Validate value */
  validate(value: any, rules: any): boolean;

  /** Get validation errors */
  getErrors(): string[];
}

/**
 * Web worker component
 */
export interface PanWorker extends LarcComponent {
  /** Post message to worker */
  postMessage(data: any): void;

  /** Terminate worker */
  terminate(): void;
}

/**
 * Link component for routing
 */
export interface PanLink extends LarcComponent {
  /** Link href */
  href: string;

  /** Navigate to href */
  navigate(): void;
}

/**
 * Fetch component for HTTP requests
 */
export interface PanFetch extends LarcComponent {
  /** Fetch URL */
  url: string;

  /** Fetch method */
  method: string;

  /** Execute fetch */
  fetch(): Promise<any>;
}

/**
 * Tree component for hierarchical data display
 */
export interface PanTree extends LarcComponent {
  /** Current tree data */
  tree: Array<{
    id: string;
    label: string;
    icon?: string;
    children?: any[];
    data?: Record<string, any>;
  }>;

  /** Set of expanded node IDs */
  expandedNodes: Set<string>;

  /** Expand a node by ID */
  expandNode(id: string): void;

  /** Collapse a node by ID */
  collapseNode(id: string): void;

  /** Toggle node expand/collapse */
  toggleNode(id: string): void;

  /** Expand all nodes */
  expandAll(): void;

  /** Find node by ID */
  findNodeById(id: string): { node: any; path: number[] } | null;

  /** Get node by path */
  getNodeByPath(path: number[]): any | null;

  /** Move node from one path to another */
  moveNode(fromPath: number[], toPath: number[]): void;
}

// Global declarations for custom elements
declare global {
  interface HTMLElementTagNameMap {
    'pan-router': PanRouter;
    'pan-store': PanStore;
    'pan-table': PanTable;
    'pan-form': PanForm;
    'pan-modal': PanModal;
    'pan-card': PanCard;
    'pan-inspector': PanInspector;
    'pan-tabs': PanTabs;
    'pan-dropdown': PanDropdown;
    'pan-date-picker': PanDatePicker;
    'pan-websocket': PanWebSocket;
    'pan-sse': PanSSE;
    'pan-jwt': PanJWT;
    'pan-theme-provider': PanThemeProvider;
    'pan-theme-toggle': PanThemeToggle;
    'pan-pagination': PanPagination;
    'pan-search-bar': PanSearchBar;
    'pan-markdown-editor': PanMarkdownEditor;
    'pan-markdown-renderer': PanMarkdownRenderer;
    'pan-chart': PanChart;
    'pan-tree': PanTree;
    'file-upload': FileUpload;
    'drag-drop-list': DragDropList;
    'pan-data-connector': PanDataConnector;
    'pan-graphql-connector': PanGraphQLConnector;
    'pan-idb': PanIDB;
    'pan-schema-form': PanSchemaForm;
    'pan-validation': PanValidation;
    'pan-worker': PanWorker;
    'pan-link': PanLink;
    'pan-fetch': PanFetch;
  }
}

export type {
  LarcComponent
};
