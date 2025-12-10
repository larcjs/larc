// Reactive store (EventTarget + Proxy) and bind helper
// Usage:
//   import { createStore, bind } from './pan-store.js';
//   const store = createStore({ name:'Ada' });
//   const unbind = bind(el, store, { 'input[name=name]':'name' });

export function createStore(initial = {}) {
  const bus = new EventTarget();
  let updating = false; // guards against feedback loops
  let state = structuredClone(initial);
  const middleware = []; // Middleware functions
  const derived = new Map(); // Derived/computed values

  const proxy = new Proxy(state, {
    set(obj, key, value) {
      if (Object.is(obj[key], value)) return true;

      const oldValue = obj[key];
      obj[key] = value;

      // Run middleware
      if (!updating) {
        for (const fn of middleware) {
          try {
            fn({ key, value, oldValue, state: proxy });
          } catch (e) {
            console.error('Middleware error:', e);
          }
        }

        bus.dispatchEvent(new CustomEvent('state', { detail: { key, value, oldValue, state: proxy } }));

        // Update derived values that depend on this key
        updateDerivedValues(key);
      }

      return true;
    },

    get(obj, key) {
      // Check if it's a derived value
      if (derived.has(key)) {
        return derived.get(key).compute();
      }
      return obj[key];
    }
  });

  const setAll = (obj = {}) => {
    updating = true;
    try { for (const [k,v] of Object.entries(obj)) proxy[k] = v; }
    finally {
      updating = false;
      bus.dispatchEvent(new CustomEvent('state', { detail: { keys: Object.keys(obj), state: proxy } }));
    }
  };

  const updateDerivedValues = (changedKey) => {
    for (const [derivedKey, derivedConfig] of derived.entries()) {
      if (derivedConfig.deps.includes(changedKey)) {
        const newValue = derivedConfig.compute();
        bus.dispatchEvent(new CustomEvent('derived', {
          detail: { key: derivedKey, value: newValue, state: proxy }
        }));
      }
    }
  };

  return {
    state: proxy,

    subscribe(fn) {
      bus.addEventListener('state', fn);
      return () => bus.removeEventListener('state', fn);
    },

    snapshot() { return JSON.parse(JSON.stringify(proxy)); },

    set(k, v){ proxy[k] = v; },

    patch(obj){ if (obj && typeof obj === 'object') setAll(obj); },

    update(fn){
      const cur = JSON.parse(JSON.stringify(proxy));
      const next = fn(cur) || cur;
      setAll(next);
    },

    // NEW: Select nested value by path
    select(path) {
      const keys = path.split('.');
      let value = proxy;
      for (const key of keys) {
        if (value == null) return undefined;
        value = value[key];
      }
      return value;
    },

    // NEW: Derive computed value from dependencies
    derive(key, deps, computeFn) {
      if (typeof deps === 'function') {
        computeFn = deps;
        deps = Object.keys(state);
      }

      const compute = () => {
        const values = deps.map(dep => proxy[dep]);
        return computeFn(...values);
      };

      derived.set(key, { deps, compute });

      // Subscribe to changes in dependencies
      const unsub = this.subscribe(({ detail }) => {
        if (detail.key && deps.includes(detail.key)) {
          updateDerivedValues(detail.key);
        }
      });

      return () => {
        derived.delete(key);
        unsub();
      };
    },

    // NEW: Batch multiple updates together
    batch(fn) {
      updating = true;
      const changes = [];

      try {
        fn({
          set: (k, v) => {
            const oldValue = proxy[k];
            state[k] = v;
            changes.push({ key: k, value: v, oldValue });
          },
          state: proxy
        });
      } finally {
        updating = false;
        if (changes.length > 0) {
          bus.dispatchEvent(new CustomEvent('state', {
            detail: { batch: true, changes, state: proxy }
          }));
        }
      }
    },

    // NEW: Add middleware
    use(fn) {
      middleware.push(fn);
      return () => {
        const index = middleware.indexOf(fn);
        if (index > -1) middleware.splice(index, 1);
      };
    },

    // NEW: Reset to initial state
    reset() {
      setAll(structuredClone(initial));
    },

    // NEW: Check if key exists
    has(key) {
      return key in proxy || derived.has(key);
    },

    // NEW: Delete key
    delete(key) {
      if (key in proxy) {
        const oldValue = proxy[key];
        delete state[key];
        bus.dispatchEvent(new CustomEvent('state', {
          detail: { key, deleted: true, oldValue, state: proxy }
        }));
        return true;
      }
      return false;
    },

    // NEW: Get all keys (including derived)
    keys() {
      return [...Object.keys(state), ...derived.keys()];
    },

    _setAll: setAll,
  };
}

export function bind(el, store, map, opts={}){
  const events = opts.events || ['input','change'];
  const isCheck = (n) => n.type === 'checkbox';
  const isRadio = (n) => n.type === 'radio';
  const get = (n) => isCheck(n) ? !!n.checked : isRadio(n) ? n.value : n.value;
  const set = (n, v) => {
    if (isCheck(n)) n.checked = !!v;
    else if (isRadio(n)) n.checked = n.value === String(v);
    else n.value = v ?? '';
  };

  // UI -> Store
  const unsubs = [];
  for (const [selector, key] of Object.entries(map||{})){
    el.querySelectorAll(selector).forEach(n=>{
      const updateStore = () => { store.state[key] = get(n); };
      for (const ev of events) n.addEventListener(ev, updateStore);
      unsubs.push(()=>{ for (const ev of events) n.removeEventListener(ev, updateStore); });
      set(n, store.state[key]);
    });
  }

  // Store -> UI
  const unsub = store.subscribe(({ detail:{ key, value } })=>{
    for (const [selector, k] of Object.entries(map||{})){
      if (k !== key) continue;
      el.querySelectorAll(selector).forEach(n=> set(n, value));
    }
  });

  return () => { try { unsub(); } catch {}; unsubs.forEach(f=>{ try{ f(); }catch{} }); };
}

export default { createStore, bind };

