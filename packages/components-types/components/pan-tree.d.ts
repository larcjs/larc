/**
 * PAN Tree Component - Collapsible tree with drag-drop and inline editing
 * @module components/pan-tree
 */

/**
 * Tree node data structure
 */
export interface TreeNode {
  /** Unique identifier for the node */
  id: string;

  /** Display label for the node */
  label: string;

  /** Optional custom icon */
  icon?: string;

  /** Child nodes */
  children?: TreeNode[];

  /** Additional custom data */
  data?: Record<string, any>;
}

/**
 * Tree node with computed path information
 */
export interface TreeNodeWithPath {
  /** The node data */
  node: TreeNode;

  /** Array index path from root to node */
  path: number[];
}

/**
 * PAN Tree Component
 *
 * A collapsible tree component with support for:
 * - Hierarchical data display
 * - Expand/collapse functionality
 * - Drag-and-drop reordering (when editable)
 * - Inline label editing (when editable)
 * - PAN message bus integration
 *
 * @example
 * ```html
 * <pan-tree
 *   resource="documents"
 *   editable
 *   expanded
 *   icon-open="📂"
 *   icon-closed="📁">
 * </pan-tree>
 * ```
 *
 * @example
 * ```typescript
 * // Set tree data via PAN
 * pc.publish({
 *   topic: 'documents.data.set',
 *   data: {
 *     tree: [
 *       {
 *         id: '1',
 *         label: 'Projects',
 *         children: [
 *           { id: '1-1', label: 'Website', children: [] }
 *         ]
 *       }
 *     ]
 *   }
 * });
 *
 * // Listen for selections
 * pc.subscribe('documents.node.select', (msg) => {
 *   console.log('Selected:', msg.data.node.label);
 * });
 * ```
 */
export class PanTree extends HTMLElement {
  /**
   * Observed attributes
   */
  static readonly observedAttributes: readonly [
    'resource',
    'data',
    'url',
    'editable',
    'expanded',
    'indent',
    'icon-open',
    'icon-closed',
    'icon-leaf'
  ];

  /**
   * Create a new PAN Tree component
   */
  constructor();

  /**
   * Resource name for PAN topic prefix
   * @default 'tree'
   */
  get resource(): string;

  /**
   * Whether the tree is editable (drag-drop and inline editing)
   * @default false
   */
  get editable(): boolean;

  /**
   * Whether all nodes should start expanded
   * @default false
   */
  get allExpanded(): boolean;

  /**
   * Indentation per tree level in pixels
   * @default 20
   */
  get indent(): number;

  /**
   * Icon for expanded folders
   * @default '▼'
   */
  get iconOpen(): string;

  /**
   * Icon for collapsed folders
   * @default '▶'
   */
  get iconClosed(): string;

  /**
   * Icon for leaf nodes
   * @default '•'
   */
  get iconLeaf(): string;

  /**
   * Current tree data
   */
  tree: TreeNode[];

  /**
   * Set of expanded node IDs
   */
  expandedNodes: Set<string>;

  /**
   * Load tree data from data attribute or URL
   */
  loadData(): Promise<void>;

  /**
   * Expand all nodes in the tree
   */
  expandAll(): void;

  /**
   * Expand a specific node by ID
   * @param id - Node ID to expand
   */
  expandNode(id: string): void;

  /**
   * Collapse a specific node by ID
   * @param id - Node ID to collapse
   */
  collapseNode(id: string): void;

  /**
   * Toggle expand/collapse state of a node
   * @param id - Node ID to toggle
   */
  toggleNode(id: string): void;

  /**
   * Find a node by its ID
   * @param id - Node ID to find
   * @param nodes - Nodes to search (defaults to tree root)
   * @param path - Current path (used internally)
   * @returns Node with its path, or null if not found
   */
  findNodeById(id: string, nodes?: TreeNode[], path?: number[]): TreeNodeWithPath | null;

  /**
   * Get a node by its array index path
   * @param path - Array of indices from root to node
   * @param nodes - Nodes to traverse (defaults to tree root)
   * @returns The node at the path, or null if not found
   */
  getNodeByPath(path: number[], nodes?: TreeNode[]): TreeNode | null;

  /**
   * Move a node from one location to another
   * @param fromPath - Source path
   * @param toPath - Destination path
   */
  moveNode(fromPath: number[], toPath: number[]): void;

  /**
   * Render the component
   */
  render(): void;

  /**
   * Lifecycle: Component connected to DOM
   */
  connectedCallback(): void;

  /**
   * Lifecycle: Component disconnected from DOM
   */
  disconnectedCallback(): void;

  /**
   * Lifecycle: Attribute changed
   */
  attributeChangedCallback(name: string, oldValue: string | null, newValue: string | null): void;
}

/**
 * PAN Message Interfaces for pan-tree
 */

/**
 * Message to set tree data
 */
export interface TreeDataSetMessage {
  topic: `${string}.data.set`;
  data: {
    tree: TreeNode[];
  };
}

/**
 * Message to expand a node
 */
export interface TreeNodeExpandMessage {
  topic: `${string}.node.expand`;
  data: {
    id: string;
  };
}

/**
 * Message to collapse a node
 */
export interface TreeNodeCollapseMessage {
  topic: `${string}.node.collapse`;
  data: {
    id: string;
  };
}

/**
 * Message to toggle a node's expand/collapse state
 */
export interface TreeNodeToggleMessage {
  topic: `${string}.node.toggle`;
  data: {
    id: string;
  };
}

/**
 * Message published when a node is selected
 */
export interface TreeNodeSelectMessage {
  topic: `${string}.node.select`;
  data: {
    id: string;
    node: TreeNode;
    path: number[];
  };
}

/**
 * Message published when a node label is edited
 */
export interface TreeNodeEditMessage {
  topic: `${string}.node.edit`;
  data: {
    id: string;
    oldLabel: string;
    newLabel: string;
    node: TreeNode;
  };
}

/**
 * Message published when a node is moved
 */
export interface TreeNodeMoveMessage {
  topic: `${string}.node.move`;
  data: {
    nodeId: string;
    node: TreeNode;
    fromPath: number[];
    toPath: number[];
  };
}

/**
 * Message published when a node is expanded
 */
export interface TreeNodeExpandedMessage {
  topic: `${string}.node.expanded`;
  data: {
    id: string;
    node: TreeNode;
  };
}

/**
 * Message published when a node is collapsed
 */
export interface TreeNodeCollapsedMessage {
  topic: `${string}.node.collapsed`;
  data: {
    id: string;
    node: TreeNode;
  };
}

/**
 * Union of all tree message types
 */
export type TreeMessage =
  | TreeDataSetMessage
  | TreeNodeExpandMessage
  | TreeNodeCollapseMessage
  | TreeNodeToggleMessage
  | TreeNodeSelectMessage
  | TreeNodeEditMessage
  | TreeNodeMoveMessage
  | TreeNodeExpandedMessage
  | TreeNodeCollapsedMessage;

export default PanTree;
