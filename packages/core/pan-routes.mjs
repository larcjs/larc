/**
 * @fileoverview PAN Routes - Runtime-configurable message routing
 *
 * Extends PAN bus with declarative routing rules that can be configured at runtime.
 * Routes define rules for matching messages and performing actions (emit, forward, log, call).
 *
 * @example
 * // Add a route programmatically
 * pan.routes.add({
 *   name: 'Login -> Dashboard',
 *   enabled: true,
 *   match: { type: 'user.login.success' },
 *   actions: [
 *     { type: 'EMIT', message: { type: 'ui.show.dashboard' } }
 *   ]
 * });
 *
 * @example
 * // Add a route with filtering and transformation
 * pan.routes.add({
 *   name: 'High temp alert',
 *   enabled: true,
 *   match: {
 *     type: 'sensor.update',
 *     where: { op: 'gt', path: 'payload.temperature', value: 30 }
 *   },
 *   transform: {
 *     op: 'pick',
 *     paths: ['payload.temperature', 'meta.source']
 *   },
 *   actions: [
 *     {
 *       type: 'EMIT',
 *       message: { type: 'ui.alert.highTemp' },
 *       inherit: ['payload', 'meta']
 *     },
 *     {
 *       type: 'LOG',
 *       level: 'warn',
 *       template: 'High temp from {{meta.source}}: {{payload.temperature}}°C'
 *     }
 *   ]
 * });
 */

/**
 * Get value from nested object path
 * @private
 */
function getPath(obj, path) {
  if (!path || !obj) return undefined;
  const parts = path.split('.');
  let result = obj;
  for (const part of parts) {
    if (result === null || result === undefined) return undefined;
    result = result[part];
  }
  return result;
}

/**
 * Set value at nested object path
 * @private
 */
function setPath(obj, path, value) {
  if (!path || !obj) return;
  const parts = path.split('.');
  let target = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in target) || typeof target[part] !== 'object') {
      target[part] = {};
    }
    target = target[part];
  }
  target[parts[parts.length - 1]] = value;
}

/**
 * Generate unique ID
 * @private
 */
function generateId() {
  return `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Deep clone object
 * @private
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof Array) return obj.map(item => deepClone(item));
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = deepClone(obj[key]);
    }
  }
  return cloned;
}

/**
 * Evaluate a predicate against a message
 * @private
 */
function evaluatePredicate(message, predicate) {
  if (!predicate) return true;

  const { op, path, value, children, child } = predicate;

  try {
    switch (op) {
      case 'eq':
        return getPath(message, path) === value;

      case 'neq':
        return getPath(message, path) !== value;

      case 'gt':
        return getPath(message, path) > value;

      case 'gte':
        return getPath(message, path) >= value;

      case 'lt':
        return getPath(message, path) < value;

      case 'lte':
        return getPath(message, path) <= value;

      case 'in':
        return Array.isArray(value) && value.includes(getPath(message, path));

      case 'regex': {
        const val = getPath(message, path);
        if (typeof val !== 'string') return false;
        const regex = new RegExp(value);
        return regex.test(val);
      }

      case 'and':
        return Array.isArray(children) && children.every(c => evaluatePredicate(message, c));

      case 'or':
        return Array.isArray(children) && children.some(c => evaluatePredicate(message, c));

      case 'not':
        return !evaluatePredicate(message, child);

      default:
        console.warn(`[PAN Routes] Unknown predicate operator: ${op}`);
        return false;
    }
  } catch (err) {
    console.error(`[PAN Routes] Predicate evaluation error:`, err);
    return false;
  }
}

/**
 * Check if message matches route criteria
 * @private
 */
function matchesRoute(message, match) {
  if (!match) return true;

  // Match type
  if (match.type) {
    const types = Array.isArray(match.type) ? match.type : [match.type];
    if (!types.includes(message.type)) return false;
  }

  // Match topic
  if (match.topic) {
    const topics = Array.isArray(match.topic) ? match.topic : [match.topic];
    if (!topics.includes(message.topic)) return false;
  }

  // Match source
  if (match.source) {
    const sources = Array.isArray(match.source) ? match.source : [match.source];
    const msgSource = message.meta?.source || message.source;
    if (!sources.includes(msgSource)) return false;
  }

  // Match tags (any)
  if (match.tagsAny && Array.isArray(match.tagsAny)) {
    const messageTags = message.meta?.tags || [];
    if (!match.tagsAny.some(tag => messageTags.includes(tag))) return false;
  }

  // Match tags (all)
  if (match.tagsAll && Array.isArray(match.tagsAll)) {
    const messageTags = message.meta?.tags || [];
    if (!match.tagsAll.every(tag => messageTags.includes(tag))) return false;
  }

  // Match where predicate
  if (match.where) {
    if (!evaluatePredicate(message, match.where)) return false;
  }

  return true;
}

/**
 * Apply transform to message
 * @private
 */
function applyTransform(message, transform, transformFns) {
  if (!transform) return message;

  try {
    const { op } = transform;

    switch (op) {
      case 'identity':
        return message;

      case 'pick': {
        const picked = { ...message };
        if (!transform.paths || !Array.isArray(transform.paths)) return picked;

        // Create new payload/meta with only picked paths
        const newPayload = {};
        const newMeta = {};

        for (const path of transform.paths) {
          const value = getPath(message, path);
          if (value !== undefined) {
            setPath(path.startsWith('payload.') ? newPayload : newMeta, path, value);
          }
        }

        return {
          ...picked,
          payload: Object.keys(newPayload).length > 0 ? newPayload : picked.payload,
          meta: Object.keys(newMeta).length > 0 ? newMeta : picked.meta
        };
      }

      case 'map': {
        if (!transform.fnId || !transformFns.has(transform.fnId)) {
          console.warn(`[PAN Routes] Transform function not found: ${transform.fnId}`);
          return message;
        }

        const fn = transformFns.get(transform.fnId);
        const value = getPath(message, transform.path);
        const transformed = fn(value);

        const result = deepClone(message);
        setPath(result, transform.path, transformed);
        return result;
      }

      case 'custom': {
        if (!transform.fnId || !transformFns.has(transform.fnId)) {
          console.warn(`[PAN Routes] Transform function not found: ${transform.fnId}`);
          return message;
        }

        const fn = transformFns.get(transform.fnId);
        return fn(message);
      }

      default:
        console.warn(`[PAN Routes] Unknown transform operator: ${op}`);
        return message;
    }
  } catch (err) {
    console.error(`[PAN Routes] Transform error:`, err);
    return message;
  }
}

/**
 * Interpolate template string with message data
 * @private
 */
function interpolateTemplate(template, message) {
  if (!template || typeof template !== 'string') return '';

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const value = getPath(message, path.trim());
    return value !== undefined ? String(value) : match;
  });
}

/**
 * Execute route action
 * @private
 */
function executeAction(action, message, context) {
  const { bus, handlers, logger } = context;

  try {
    switch (action.type) {
      case 'EMIT': {
        const newMessage = { ...action.message };

        // Inherit from original message
        if (action.inherit && Array.isArray(action.inherit)) {
          for (const field of action.inherit) {
            if (field === 'payload' && message.payload) {
              newMessage.payload = { ...message.payload, ...newMessage.payload };
            } else if (field === 'meta' && message.meta) {
              newMessage.meta = { ...message.meta, ...newMessage.meta };
            }
          }
        }

        // Emit on bus
        if (bus && typeof bus.publish === 'function') {
          bus.publish(newMessage.topic || newMessage.type, newMessage.payload, {
            ...newMessage,
            retain: newMessage.retain || false
          });
        }
        break;
      }

      case 'FORWARD': {
        const forwarded = { ...message };

        if (action.topic) {
          forwarded.topic = action.topic;
        }

        if (action.typeOverride) {
          forwarded.type = action.typeOverride;
        }

        if (bus && typeof bus.publish === 'function') {
          bus.publish(forwarded.topic || forwarded.type, forwarded.payload || forwarded.data, forwarded);
        }
        break;
      }

      case 'LOG': {
        const level = action.level || 'info';
        const template = action.template || '{{type}}: {{payload}}';
        const logMessage = interpolateTemplate(template, message);

        if (logger && typeof logger[level] === 'function') {
          logger[level](`[PAN Routes]`, logMessage, message);
        } else {
          console[level]?.(`[PAN Routes]`, logMessage, message) || console.log(`[PAN Routes]`, logMessage, message);
        }
        break;
      }

      case 'CALL': {
        if (!action.handlerId || !handlers.has(action.handlerId)) {
          console.warn(`[PAN Routes] Handler not found: ${action.handlerId}`);
          break;
        }

        const handler = handlers.get(action.handlerId);
        handler(message);
        break;
      }

      default:
        console.warn(`[PAN Routes] Unknown action type: ${action.type}`);
    }
  } catch (err) {
    console.error(`[PAN Routes] Action execution error:`, err);
    throw err;
  }
}

/**
 * PAN Routes Manager
 */
export class PanRoutesManager {
  constructor(bus = null) {
    this.bus = bus;
    this.routes = new Map(); // id -> route
    this.transformFns = new Map(); // fnId -> function
    this.handlers = new Map(); // handlerId -> function
    this.storage = null;
    this.logger = null;
    this.changeListeners = [];
    this.errorListeners = [];
    this.enabled = true;

    // Control message guard
    this.controlGuard = null;

    // Statistics
    this.stats = {
      routesEvaluated: 0,
      routesMatched: 0,
      actionsExecuted: 0,
      errors: 0
    };
  }

  /**
   * Add a new route
   */
  add(routeInput) {
    try {
      const route = {
        id: routeInput.id || generateId(),
        name: routeInput.name || `Route ${this.routes.size + 1}`,
        enabled: routeInput.enabled !== false,
        order: routeInput.order || 0,
        match: routeInput.match || {},
        transform: routeInput.transform || null,
        actions: routeInput.actions || [],
        meta: {
          createdBy: routeInput.meta?.createdBy || 'system',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: routeInput.meta?.tags || []
        }
      };

      // Validate route
      if (!route.actions || route.actions.length === 0) {
        throw new Error('Route must have at least one action');
      }

      this.routes.set(route.id, route);
      this._notifyChange();
      this._persist();

      return route;
    } catch (err) {
      this._handleError('ADD_ROUTE_FAILED', err, { routeInput });
      throw err;
    }
  }

  /**
   * Update existing route
   */
  update(id, patch) {
    try {
      const route = this.routes.get(id);
      if (!route) {
        throw new Error(`Route not found: ${id}`);
      }

      const updated = {
        ...route,
        ...patch,
        id: route.id, // Prevent ID change
        meta: {
          ...route.meta,
          ...(patch.meta || {}),
          updatedAt: Date.now()
        }
      };

      this.routes.set(id, updated);
      this._notifyChange();
      this._persist();

      return updated;
    } catch (err) {
      this._handleError('UPDATE_ROUTE_FAILED', err, { id, patch });
      throw err;
    }
  }

  /**
   * Remove a route
   */
  remove(id) {
    try {
      const existed = this.routes.delete(id);
      if (existed) {
        this._notifyChange();
        this._persist();
      }
      return existed;
    } catch (err) {
      this._handleError('REMOVE_ROUTE_FAILED', err, { id });
      throw err;
    }
  }

  /**
   * Enable a route
   */
  enable(id) {
    this.update(id, { enabled: true });
  }

  /**
   * Disable a route
   */
  disable(id) {
    this.update(id, { enabled: false });
  }

  /**
   * Get a route by ID
   */
  get(id) {
    return this.routes.get(id);
  }

  /**
   * List routes with optional filtering
   */
  list(filter = {}) {
    let routes = Array.from(this.routes.values());

    if (filter.enabled !== undefined) {
      routes = routes.filter(r => r.enabled === filter.enabled);
    }

    // Sort by order, then by creation time
    routes.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.meta?.createdAt || 0) - (b.meta?.createdAt || 0);
    });

    return routes;
  }

  /**
   * Clear all routes
   */
  clear() {
    this.routes.clear();
    this._notifyChange();
    this._persist();
  }

  /**
   * Register a transform function
   */
  registerTransformFn(fnId, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Transform must be a function');
    }
    this.transformFns.set(fnId, fn);
  }

  /**
   * Register a handler function
   */
  registerHandler(handlerId, fn) {
    if (typeof fn !== 'function') {
      throw new Error('Handler must be a function');
    }
    this.handlers.set(handlerId, fn);
  }

  /**
   * Use storage provider for persistence
   */
  useStorage(storage) {
    this.storage = storage;
    // Load initial routes
    if (storage && typeof storage.load === 'function') {
      storage.load().then(routes => {
        if (Array.isArray(routes)) {
          routes.forEach(r => this.add(r));
        }
      }).catch(err => {
        console.error('[PAN Routes] Failed to load routes from storage:', err);
      });
    }
  }

  /**
   * Set logger for LOG actions
   */
  useLogger(logger) {
    this.logger = logger;
  }

  /**
   * Set control guard for security
   */
  setControlGuard(guard) {
    this.controlGuard = guard;
  }

  /**
   * Subscribe to route changes
   */
  onRoutesChanged(listener) {
    this.changeListeners.push(listener);
    return () => {
      const idx = this.changeListeners.indexOf(listener);
      if (idx !== -1) this.changeListeners.splice(idx, 1);
    };
  }

  /**
   * Subscribe to routing errors
   */
  onError(listener) {
    this.errorListeners.push(listener);
    return () => {
      const idx = this.errorListeners.indexOf(listener);
      if (idx !== -1) this.errorListeners.splice(idx, 1);
    };
  }

  /**
   * Process a message through the routing system
   */
  processMessage(message) {
    if (!this.enabled || this.routes.size === 0) return;

    const matchedRoutes = [];
    const routes = this.list({ enabled: true });

    // Find matching routes
    for (const route of routes) {
      this.stats.routesEvaluated++;

      if (matchesRoute(message, route.match)) {
        this.stats.routesMatched++;
        matchedRoutes.push(route);
      }
    }

    // Execute actions for each matched route
    for (const route of matchedRoutes) {
      try {
        // Apply transform
        const transformedMessage = applyTransform(message, route.transform, this.transformFns);

        // Execute actions
        const context = {
          bus: this.bus,
          handlers: this.handlers,
          logger: this.logger
        };

        for (const action of route.actions) {
          executeAction(action, transformedMessage, context);
          this.stats.actionsExecuted++;
        }
      } catch (err) {
        this._handleError('ROUTE_EXECUTION_FAILED', err, {
          routeId: route.id,
          routeName: route.name,
          message
        });
      }
    }

    return matchedRoutes;
  }

  /**
   * Handle control messages
   */
  handleControlMessage(message) {
    // Check control guard
    if (this.controlGuard && !this.controlGuard(message)) {
      console.warn('[PAN Routes] Control message rejected by guard:', message);
      return;
    }

    const { type, payload } = message;

    try {
      switch (type) {
        case 'pan.routes.add':
          return this.add(payload.route);

        case 'pan.routes.update':
          return this.update(payload.id, payload.patch);

        case 'pan.routes.remove':
          return this.remove(payload.id);

        case 'pan.routes.enable':
          this.enable(payload.id);
          return { success: true };

        case 'pan.routes.disable':
          this.disable(payload.id);
          return { success: true };

        case 'pan.routes.list':
          return this.list(payload || {});

        case 'pan.routes.clear':
          this.clear();
          return { success: true };

        default:
          console.warn(`[PAN Routes] Unknown control message type: ${type}`);
          return null;
      }
    } catch (err) {
      this._handleError('CONTROL_MESSAGE_FAILED', err, { type, payload });
      throw err;
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      ...this.stats,
      routeCount: this.routes.size,
      enabledRouteCount: this.list({ enabled: true }).length,
      transformFnCount: this.transformFns.size,
      handlerCount: this.handlers.size
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      routesEvaluated: 0,
      routesMatched: 0,
      actionsExecuted: 0,
      errors: 0
    };
  }

  /**
   * Enable/disable routing system
   */
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  /**
   * Notify change listeners
   * @private
   */
  _notifyChange() {
    const routes = this.list();
    this.changeListeners.forEach(listener => {
      try {
        listener(routes);
      } catch (err) {
        console.error('[PAN Routes] Change listener error:', err);
      }
    });
  }

  /**
   * Persist routes to storage
   * @private
   */
  _persist() {
    if (this.storage && typeof this.storage.save === 'function') {
      const routes = this.list();
      this.storage.save(routes).catch(err => {
        console.error('[PAN Routes] Failed to save routes:', err);
      });
    }
  }

  /**
   * Handle error
   * @private
   */
  _handleError(code, error, details = {}) {
    this.stats.errors++;

    const errorData = {
      code,
      message: error.message || String(error),
      details,
      timestamp: Date.now()
    };

    this.errorListeners.forEach(listener => {
      try {
        listener(errorData);
      } catch (err) {
        console.error('[PAN Routes] Error listener failed:', err);
      }
    });

    console.error(`[PAN Routes] ${code}:`, error, details);
  }
}

export default PanRoutesManager;
