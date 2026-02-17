/**
 * LARC Topic Dictionary
 * Auto-generated - do not edit manually
 * Generated: 2026-02-06T05:43:25.584Z
 */

export type TopicType = "state" | "command" | "event" | "request" | "internal" | "unknown";

export interface TopicDefinition {
  topic: string;
  type: TopicType;
  description: string;
  parameters?: string[];
}

/** All known topics */
export const TOPICS = {
  AUTH: {
    LOGIN_SUCCESS: 'auth.login.success' as const,
    LOGIN_ERROR: 'auth.login.error' as const,
    LOGOUT_SUCCESS: 'auth.logout.success' as const,
    REFRESH_SUCCESS: 'auth.refresh.success' as const,
    REFRESH_ERROR: 'auth.refresh.error' as const,
    STATE: 'auth.state' as const,
    INTERNAL_STATE: 'auth.internal.state' as const,
    REFRESH: 'auth.refresh' as const,
    LOGIN: 'auth.login' as const,
    LOGOUT: 'auth.logout' as const,
    SETTOKEN: 'auth.setToken' as const,
    CHECK: 'auth.check' as const,
    TOKEN_REFRESHED: 'auth.token.refreshed' as const,
    TOKEN_EXPIRED: 'auth.token.expired' as const,
    LOGIN_REQUEST: 'auth.login.request' as const,
    LOGOUT_REQUEST: 'auth.logout.request' as const,
    TOKEN_REFRESH: 'auth.token.refresh' as const,
    STATE_GET: 'auth.state.get' as const,
  },
  USERS: {
    LIST_STATE: 'users.list.state' as const,
    UPDATED: 'users.updated' as const,
  },
  APP: {
    STARTED: 'app.started' as const,
    STATE: 'app.state' as const,
  },
  USER: {
    UPDATED: 'user.updated' as const,
    LOGIN: 'user.login' as const,
  },
  FILE: {
    CONTENT_LOADED: 'file.content-loaded' as const,
    CREATED: 'file.created' as const,
    SELECTED: 'file.selected' as const,
    RENAMED: 'file.renamed' as const,
    DELETED: 'file.deleted' as const,
    SAVE: 'file.save' as const,
    LOAD: 'file.load' as const,
    DELETE: 'file.delete' as const,
    CREATE: 'file.create' as const,
  },
  INVOICE: {
    /** (command) Load an invoice into the editor */
    LOAD: 'invoice.load' as const,
    /** (event) Invoice header field changed */
    HEADER_CHANGED: 'invoice.header.changed' as const,
    /** (event) Line items changed */
    ITEMS_CHANGED: 'invoice.items.changed' as const,
    TOTAL_CALCULATED: 'invoice.total.calculated' as const,
    /** (command) Save the current invoice */
    SAVE: 'invoice.save' as const,
    /** (command) Load a specific invoice by ID */
    LOAD_BY_ID: 'invoice.load-by-id' as const,
    /** (command) Create a new blank invoice */
    NEW: 'invoice.new' as const,
    DELETE: 'invoice.delete' as const,
    EXPORT: 'invoice.export' as const,
    IMPORT: 'invoice.import' as const,
    EXPORT_ALL: 'invoice.export-all' as const,
    CLEAR: 'invoice.clear' as const,
    /** (event) Invoice created, may have due date (subscribed) */
    CREATED: 'invoice.created' as const,
    TOTALS_CHANGED: 'invoice.totals.changed' as const,
    LIST_UPDATED: 'invoice.list-updated' as const,
    CURRENT_CHANGED: 'invoice.current-changed' as const,
    /** (event) Invoice was saved successfully */
    SAVED: 'invoice.saved' as const,
    BROWSER_SHOW: 'invoice.browser.show' as const,
    /** (command) Load the most recent invoice */
    LOAD_LATEST: 'invoice.load.latest' as const,
    /** (event) Invoice totals recalculated */
    TOTALS_UPDATED: 'invoice.totals.updated' as const,
    /** (state) Current invoice data */
    STATE: 'invoice.state' as const,
    ERROR: 'invoice.error' as const,
    ITEMS_CLEAR: 'invoice.items.clear' as const,
    ITEMS_LOAD: 'invoice.items.load' as const,
    EXPORT_PDF: 'invoice.export.pdf' as const,
    DATA_EXPORT: 'invoice.data.export' as const,
    DATA_IMPORT: 'invoice.data.import' as const,
  },
  CONTACT: {
    SCHEMA_SET: 'contact.schema.set' as const,
    DATA_GET: 'contact.data.get' as const,
    SUBMIT: 'contact.submit' as const,
    DATA: 'contact.data' as const,
    SELECTED: 'contact.selected' as const,
  },
  NAV: {
    STATE: 'nav.state' as const,
    BLOCKED: 'nav.blocked' as const,
    GOTO: 'nav.goto' as const,
    BACK: 'nav.back' as const,
    FORWARD: 'nav.forward' as const,
    REPLACE: 'nav.replace' as const,
  },
  MARKDOWN: {
    CONTENT_RESPONSE: 'markdown.content-response' as const,
    CHANGED: 'markdown.changed' as const,
    SAVED: 'markdown.saved' as const,
    SET_CONTENT: 'markdown.set-content' as const,
    GET_CONTENT: 'markdown.get-content' as const,
    RENDER: 'markdown.render' as const,
  },
  STORAGE: {
    /** Queued a mutation */
    QUEUE_ADD: '{storage}.queue.add' as const,
    /** Sync started */
    QUEUE_SYNC: '{storage}.queue.sync' as const,
    /** Mutation synced successfully */
    QUEUE_SUCCESS: '{storage}.queue.success' as const,
    /** Sync error occurred */
    QUEUE_ERROR: '{storage}.queue.error' as const,
    /** Conflict detected */
    QUEUE_CONFLICT: '{storage}.queue.conflict' as const,
    /** Network came online */
    NETWORK_ONLINE: '{storage}.network.online' as const,
    /** Network went offline */
    NETWORK_OFFLINE: '{storage}.network.offline' as const,
  },
  PERSIST: {
    /** All state has been hydrated */
    HYDRATED: 'persist.hydrated' as const,
    /** State was persisted */
    SAVED: 'persist.saved' as const,
    /** Persistence error occurred */
    ERROR: 'persist.error' as const,
  },
  TOPIC: {
    /** Message passed validation */
    VALID: '{topic}.valid' as const,
    /** Message failed validation */
    INVALID: '{topic}.invalid' as const,
    /** (event) Search query changed with {query, filter} */
    SEARCH: '{topic}.search' as const,
    /** (event) Search was cleared */
    CLEAR: '{topic}.clear' as const,
    /** (command) Set search query and/or filter programmatically */
    SET: '{topic}.set' as const,
    /** Topic validation failed */
    VALIDATION_ERROR: 'topic.validation.error' as const,
    /** Topic validation warning (unknown topic) */
    VALIDATION_WARNING: 'topic.validation.warning' as const,
    /** Dictionary loaded successfully */
    VALIDATION_LOADED: 'topic.validation.loaded' as const,
  },
  CHANNEL: {
    /** Broadcast state changes to other tabs */
    SYNC_MESSAGE: '{channel}.sync.message' as const,
    /** Request full state from leader */
    SYNC_REQUEST_STATE: '{channel}.sync.request-state' as const,
    /** Notify when new leader elected */
    SYNC_LEADER_ELECTED: '{channel}.sync.leader-elected' as const,
    /** Conflict detected, resolution needed */
    SYNC_CONFLICT: '{channel}.sync.conflict' as const,
    /** Trigger undo */
    UNDO: '{channel}.undo' as const,
    /** Trigger redo */
    REDO: '{channel}.redo' as const,
    /** Clear history */
    CLEAR: '{channel}.clear' as const,
    /** Take manual snapshot */
    SNAPSHOT: '{channel}.snapshot' as const,
    /** History state changes */
    STATE: '{channel}.state' as const,
  },
  THEME: {
    CHANGED: 'theme.changed' as const,
  },
  HISTORY: {
    UNDO: 'history.undo' as const,
    REDO: 'history.redo' as const,
    CLEAR: 'history.clear' as const,
  },
  WS: {
    CONNECTED: 'ws.connected' as const,
    MESSAGE: 'ws.message' as const,
    DISCONNECTED: 'ws.disconnected' as const,
    ERROR: 'ws.error' as const,
  },
  TODOS: {
    CHANGE: 'todos.change' as const,
    TOGGLE: 'todos.toggle' as const,
    REMOVE: 'todos.remove' as const,
    STATE: 'todos.state' as const,
  },
  TEST: {
    MESSAGE: 'test.message' as const,
  },
  STORE: {
    /** (command) Get an item by key */
    IDB_GET: '{store}.idb.get' as const,
    /** (command) Update or insert an item */
    IDB_PUT: '{store}.idb.put' as const,
    /** (command) Add a new item */
    IDB_ADD: '{store}.idb.add' as const,
    /** (command) Delete an item by key */
    IDB_DELETE: '{store}.idb.delete' as const,
    /** (command) Clear all items from store */
    IDB_CLEAR: '{store}.idb.clear' as const,
    /** (command) List items with optional filters */
    IDB_LIST: '{store}.idb.list' as const,
    /** (command) Query items by index */
    IDB_QUERY: '{store}.idb.query' as const,
    /** (event) Operation completed with result */
    IDB_RESULT: '{store}.idb.result' as const,
    /** (event) Operation failed with error */
    IDB_ERROR: '{store}.idb.error' as const,
    /** (event) IndexedDB store is ready */
    IDB_READY: '{store}.idb.ready' as const,
  },
  MODAL: {
    DEMO_SHOW: 'modal.demo.show' as const,
    DEMO_HIDE: 'modal.demo.hide' as const,
    DEMO_TOGGLE: 'modal.demo.toggle' as const,
  },
  BLOG: {
    WYSIWYG_SETCONTENT: 'blog.wysiwyg.setContent' as const,
    SOURCE_SETCONTENT: 'blog.source.setContent' as const,
    PREVIEW_UPDATE: 'blog.preview.update' as const,
    STORAGE_SAVE: 'blog.storage.save' as const,
    STORAGE_LOAD: 'blog.storage.load' as const,
    MODE_SWITCH: 'blog.mode.switch' as const,
    PREVIEW_TOGGLE: 'blog.preview.toggle' as const,
    SOURCE_CHANGED: 'blog.source.changed' as const,
    WYSIWYG_CHANGED: 'blog.wysiwyg.changed' as const,
    SAVE_REQUEST: 'blog.save.request' as const,
    DRAFT_LOADED: 'blog.draft.loaded' as const,
    META_CHANGED: 'blog.meta.changed' as const,
    META_SET: 'blog.meta.set' as const,
    MODE_CHANGED: 'blog.mode.changed' as const,
  },
  FEATURES: {
    TOGGLE: 'features.toggle' as const,
    AVAILABLE: 'features.available' as const,
    ACTION: 'features.action' as const,
    REGISTER: 'features.register' as const,
  },
  CALENDAR: {
    /** (event) IndexedDB operation completed */
    EVENTS_RESULT: 'calendar.events.result' as const,
    /** (event) IndexedDB store is ready */
    EVENTS_READY: 'calendar.events.ready' as const,
    /** (command) Request list of all events */
    EVENTS_LIST: 'calendar.events.list' as const,
    /** (command) Add a new event */
    EVENTS_ADD: 'calendar.events.add' as const,
    /** (command) Update an event */
    EVENTS_PUT: 'calendar.events.put' as const,
    /** (command) Delete an event */
    EVENTS_DELETE: 'calendar.events.delete' as const,
    /** (event) Event was saved */
    EVENT_SAVED: 'calendar.event.saved' as const,
  },
  CONTACTS: {
    /** (state) Receive contacts from Contact Manager (subscribed) */
    LIST: 'contacts.list' as const,
    /** (event) Contacts were modified (subscribed) */
    UPDATED: 'contacts.updated' as const,
    /** (command) Request list of all contacts */
    IDB_LIST: 'contacts.idb.list' as const,
    /** (event) IndexedDB store is ready */
    IDB_READY: 'contacts.idb.ready' as const,
    /** (event) IndexedDB operation completed */
    IDB_RESULT: 'contacts.idb.result' as const,
    /** (event) IndexedDB operation failed */
    IDB_ERROR: 'contacts.idb.error' as const,
    /** (command) Add a new contact */
    IDB_ADD: 'contacts.idb.add' as const,
    /** (command) Update a contact */
    IDB_PUT: 'contacts.idb.put' as const,
    /** (command) Delete a contact */
    IDB_DELETE: 'contacts.idb.delete' as const,
    /** (event) Search query changed */
    SEARCH_SEARCH: 'contacts.search.search' as const,
    /** (command) Show the contact manager modal */
    MANAGER_SHOW: 'contacts.manager.show' as const,
    /** (command) Show the contact picker (alias) */
    PICKER_SHOW: 'contacts.picker.show' as const,
    /** (event) User selected a contact */
    SELECTED: 'contacts.selected' as const,
  },
  RESOURCE: {
    SELECT: 'resource.select' as const,
  },
  UI: {
    /** (command) Show a toast notification */
    TOAST_SHOW: 'ui.toast.show' as const,
  },
} as const;

/** Topic string literal union type */
export type Topic = typeof TOPICS[keyof typeof TOPICS][keyof typeof TOPICS[keyof typeof TOPICS]];
