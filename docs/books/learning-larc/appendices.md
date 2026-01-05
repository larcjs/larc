# Appendices

## Appendix A: Web Components API Reference

### Custom Elements

**Defining elements:**
```javascript
customElements.define('my-element', MyElement);
customElements.define('my-element', MyElement, { extends: 'button' });
```

**Retrieving definitions:**
```javascript
customElements.get('my-element');  // Returns constructor or undefined
await customElements.whenDefined('my-element');  // Resolves when defined
customElements.upgrade(element);  // Upgrade an element
```

### Lifecycle Callbacks

| Callback | When Called |
|----------|-------------|
| `constructor()` | Element created |
| `connectedCallback()` | Element added to DOM |
| `disconnectedCallback()` | Element removed from DOM |
| `attributeChangedCallback(name, oldVal, newVal)` | Observed attribute changed |
| `adoptedCallback()` | Element moved to new document |

### Shadow DOM

```javascript
// Attach shadow root
const shadow = element.attachShadow({ mode: 'open' });

// Access shadow root
element.shadowRoot  // null if mode is 'closed'

// Slots
const slot = shadow.querySelector('slot');
slot.assignedNodes();  // All assigned nodes
slot.assignedElements();  // Only element nodes
```

## Appendix B: PAN Bus API Reference

### Publishing

```javascript
// Simple publish
pan.publish('topic', data);

// With options
pan.publish('topic', data, { retained: true });
```

### Subscribing

```javascript
// Subscribe
const unsubscribe = pan.subscribe('topic', (data) => {
  console.log(data);
});

// Wildcard subscribe
pan.subscribe('user.*', (data, topic) => {
  console.log(topic, data);
});

// Unsubscribe
unsubscribe();
```

### Request/Response

```javascript
// Request with timeout
const result = await pan.request('service.getData', { id: 1 }, 5000);

// Respond to requests
pan.respond('service.getData', async ({ id }) => {
  return await fetchData(id);
});
```

## Appendix C: Component Quick Reference

| Component | Purpose | Key Attributes |
|-----------|---------|----------------|
| `pan-router` | Client-side routing | `base` |
| `pan-route` | Route definition | `path`, `component` |
| `pan-store` | State management | `persist`, `namespace` |
| `pan-fetch` | Data fetching | `url`, `method`, `auto` |

## Appendix D: Migration Cheat Sheet

### React → LARC

| React | LARC |
|-------|------|
| JSX | Template literals |
| `props` | Attributes/properties |
| `useState` | Instance properties |
| `useEffect` | `connectedCallback` |
| Context | PAN bus |
| Redux | `pan-store` |

### Vue → LARC

| Vue | LARC |
|-----|------|
| Templates | Template literals |
| `v-if` | Ternary in template |
| `v-for` | `array.map()` |
| `computed` | Getters |
| Vuex | `pan-store` |

## Appendix E: Resources

### Official

- Documentation: https://larcjs.com/docs
- GitHub: https://github.com/larcjs/larc
- Examples: https://github.com/larcjs/larc/tree/main/examples

### Web Standards

- MDN Web Components: https://developer.mozilla.org/en-US/docs/Web/Web_Components
- Custom Elements Spec: https://html.spec.whatwg.org/multipage/custom-elements.html
- Shadow DOM Spec: https://dom.spec.whatwg.org/#shadow-trees

### Community

- Discord: https://discord.gg/larc
- Forum: https://forum.larcjs.com
