# Core Concepts

## Introduction: The Building Blocks

If you're coming from a traditional framework background, LARC might seem... sparse. There's no virtual DOM, no reconciliation algorithm, no elaborate lifecycle methods. What you get instead is something arguably more powerful: a set of composable primitives that work together through a simple, consistent interface.

This chapter covers the core concepts that make LARC tick. If you understand these fundamentals, you'll understand 90% of what you need to build production applications. The remaining 10% is just knowing which components already exist so you don't reinvent the wheel.

Let's start at the heart of it all: the message bus.

## The Message Bus: Your Application's Nervous System

### What Is a Message Bus?

Think of the message bus as your application's nervous system. Just as your nervous system carries signals between different parts of your body without those parts needing to know about each other directly, the message bus carries messages between components without creating coupling between them.

Here's the elegant part: the entire bus is just a custom element sitting in your DOM:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <pan-bus></pan-bus>

  <!-- Your app goes here -->
  <my-dashboard></my-dashboard>
</body>
</html>
```

That's it. No configuration files, no initialization boilerplate, no plugin registration. The `<pan-bus>` element listens for specific DOM events and routes them to interested parties. It's just HTML doing HTML things.

### How Does It Work?

The bus operates using the browser's built-in event system. Components communicate by dispatching CustomEvents that bubble up through the DOM. The bus catches these events, processes them according to its routing rules, and dispatches delivery events to subscribers.

Here's the beautiful part: because it's all DOM events, it works across shadow DOM boundaries, through iframes (with appropriate setup), and with any framework that can dispatch events—which is to say, all of them.

Let's look at a concrete example:

```javascript
// Component A publishes a message
document.dispatchEvent(new CustomEvent('pan:publish', {
  detail: {
    topic: 'user.logged-in',
    data: { userId: '123', name: 'Alice' }
  },
  bubbles: true,
  composed: true
}));

// Component B subscribes and receives it
document.addEventListener('pan:deliver', (e) => {
  if (e.detail.topic === 'user.logged-in') {
    console.log('User logged in:', e.detail.data.name);
  }
});
```

But typing out CustomEvent constructors gets tedious fast. That's why LARC provides the PanClient helper:

```javascript
import { PanClient } from '@larc-app/core';

const client = new PanClient();
await client.ready();

// Publishing is now simple
client.publish({
  topic: 'user.logged-in',
  data: { userId: '123', name: 'Alice' }
});

// So is subscribing
client.subscribe('user.logged-in', (msg) => {
  console.log('User logged in:', msg.data.name);
});
```

Much better. But we can do more.

### Configuration and Capabilities

The `<pan-bus>` element accepts configuration through attributes:

```html
<pan-bus
  max-retained="1000"
  max-message-size="1048576"
  debug="true"
  allow-global-wildcard="false">
</pan-bus>
```

These settings control memory usage, security policies, and debugging output. In production, you'll want to tune these based on your app's needs. During development, `debug="true"` is invaluable for understanding message flow.

The bus also tracks statistics:

```javascript
// Request stats
const response = await client.request('pan:sys.stats', {});
console.log(response.data);
// {
//   published: 1234,
//   delivered: 5678,
//   dropped: 0,
//   retained: 42,
//   subscriptions: 18,
//   clients: 5
// }
```

These metrics help you understand your application's communication patterns and spot potential performance issues before they become problems.

## Pub/Sub Pattern: Fire and Forget (But Don't Actually Forget)

### The Classic Pattern

Publish/subscribe (pub/sub) is the bread and butter of message-based architectures. A component publishes a message about something that happened. Other components subscribe to messages they care about. Neither knows the other exists.

Here's a real-world example from an e-commerce app:

```javascript
// Shopping cart component
class ShoppingCart extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    this.render();
  }

  async addItem(product) {
    this.items.push(product);

    // Tell the world what happened
    this.client.publish({
      topic: 'cart.item-added',
      data: {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: 1
      }
    });

    this.render();
  }
}
```

Now, anywhere in your application, components can react to items being added to the cart:

```javascript
// Notification badge component
class CartBadge extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    this.count = 0;
    this.render();

    // Listen for cart changes
    this.client.subscribe('cart.item-added', () => {
      this.count++;
      this.render();
    });

    this.client.subscribe('cart.item-removed', () => {
      this.count--;
      this.render();
    });
  }
}

// Analytics component
class AnalyticsTracker extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    this.client.subscribe('cart.*', (msg) => {
      // Send to analytics service
      this.trackEvent(msg.topic, msg.data);
    });
  }

  trackEvent(action, data) {
    // Send to your analytics provider
    console.log('Analytics:', action, data);
  }
}
```

Notice how neither the cart badge nor the analytics tracker needed to be registered anywhere or injected with dependencies. They just listen for messages they care about. Add them to the DOM, and they work. Remove them, and they stop working. No cleanup code needed (the bus automatically removes dead subscriptions).

### Wildcards: Subscribe to Patterns

One of the most powerful features of LARC's pub/sub system is pattern matching. Instead of subscribing to individual topics, you can subscribe to patterns:

```javascript
// Subscribe to all cart-related messages
client.subscribe('cart.*', (msg) => {
  console.log('Cart event:', msg.topic, msg.data);
});

// Subscribe to all user-related messages
client.subscribe('users.*', (msg) => {
  console.log('User event:', msg.topic, msg.data);
});

// Subscribe to everything (use sparingly!)
client.subscribe('*', (msg) => {
  console.log('Any event:', msg.topic, msg.data);
});
```

The wildcard `*` matches any segment of a topic. So `cart.*` matches `cart.item-added` and `cart.checkout-started`, but not `cart.items.updated` (which has multiple segments after `cart`).

This makes it trivial to build components that react to entire categories of events without knowing the specific topics ahead of time.

### The Global Wildcard Problem

You might be wondering: "What about security? Can any component spy on all messages?"

Yes, by default. That's actually intentional for most applications—it makes debugging and monitoring much easier. But for sensitive applications, you can disable the global wildcard:

```html
<pan-bus allow-global-wildcard="false"></pan-bus>
```

Now attempts to subscribe to `*` will be rejected. Components can still use specific wildcards like `users.*`, just not the nuclear option.

## Topics and Routing: Addressing Your Messages

### Naming Conventions

Topics in LARC follow a hierarchical naming convention similar to DNS or Java packages. The convention is:

```
entity.resource.action
```

For example:

- `users.list.state` - The current state of the user list
- `users.item.save` - Request to save a user item
- `cart.checkout.started` - Notification that checkout has started
- `api.users.error` - Error from the users API

This hierarchy serves two purposes:

1. **Organization**: It groups related topics together
2. **Routing**: It enables wildcard subscriptions and routing rules

Here are some real-world examples:

```javascript
// State management topics
'users.list.state'      // Current list of users
'users.filter.state'    // Current filter settings
'users.pagination.state' // Current page/offset

// Action topics
'users.item.save'       // Save a user
'users.item.delete'     // Delete a user
'users.list.refresh'    // Refresh the list

// Event topics
'users.item.saved'      // User was saved
'users.item.deleted'    // User was deleted
'users.list.changed'    // List has changed

// API topics
'api.users.request'     // API request initiated
'api.users.success'     // API request succeeded
'api.users.error'       // API request failed
```

### Semantic Routing

The beauty of hierarchical topics is that you can build semantic routing rules. For example, you might want to:

1. Log all API errors to your monitoring service
2. Cache all `*.state` messages for new components
3. Persist all `*.settings` changes to localStorage
4. Throttle high-frequency UI events

LARC's routing system (enabled with `enable-routing="true"`) lets you configure these behaviors declaratively. But even without routing, the topic structure helps you reason about message flow.

### Anti-Patterns to Avoid

Some topic naming patterns to avoid:

**Too Generic:**
```javascript
// Bad: What user? What data?
'update'
'change'
'event'

// Good: Specific and hierarchical
'users.item.updated'
'settings.theme.changed'
'cart.item-added'
```

**Too Specific:**
```javascript
// Bad: Can't subscribe to patterns
'user-123-updated'
'product-abc-added-to-cart'

// Good: Use data payload for specifics
'users.item.updated'  // data: { userId: '123' }
'cart.item-added'     // data: { productId: 'abc' }
```

**Mixed Concerns:**
```javascript
// Bad: Mixing entity types
'users-and-posts.updated'

// Good: Separate topics
'users.item.updated'
'posts.item.updated'
```

## Message Lifecycle: Birth, Death, and Resurrection

### The Lifecycle of a Message

When you publish a message, it goes through several stages:

1. **Creation**: You publish the message via `client.publish()`
2. **Validation**: The bus validates message size and serializability
3. **Enrichment**: The bus adds metadata (id, timestamp)
4. **Routing**: The bus applies routing rules (if enabled)
5. **Delivery**: The bus dispatches to all matching subscribers
6. **Retention**: If marked `retain: true`, the message is cached
7. **Cleanup**: After delivery, the message object is eligible for GC

Let's look at each stage in detail.

### Message Structure

A complete message has this shape:

```javascript
{
  topic: 'users.item.saved',        // Required: hierarchical topic
  data: { id: '123', name: 'Alice' }, // Required: the payload
  id: 'a1b2c3d4-...',               // Auto-generated UUID
  ts: 1698765432000,                 // Auto-generated timestamp
  retain: true,                      // Optional: cache this message
  replyTo: 'pan:$reply:...',        // Optional: for request/reply
  correlationId: 'req-123',         // Optional: for correlation
  headers: {                         // Optional: custom metadata
    'x-user-id': '123',
    'x-trace-id': 'abc-def'
  }
}
```

You only provide `topic` and `data`. The bus fills in the rest.

### Validation and Size Limits

The bus validates messages before processing them:

```javascript
// This will be rejected
client.publish({
  topic: 'users.item.save',
  data: {
    name: 'Alice',
    profilePicture: gigabyteSizedBinaryBlob  // Too large!
  }
});
```

Default limits:

- Max message size: 1MB
- Max payload size: 512KB

Why two limits? The message size includes metadata, headers, and the payload. The payload limit is separate because payloads are what users control.

If you need to send large data, don't send it through the bus. Instead, send a reference:

```javascript
// Good: Send a reference
client.publish({
  topic: 'upload.completed',
  data: {
    fileId: 'abc-123',
    url: '/api/files/abc-123',
    size: 10485760,  // 10MB
    type: 'image/jpeg'
  }
});
```

### Retained Messages: The Last Value Cache

One of the most useful features of the message bus is message retention. When you publish a message with `retain: true`, the bus caches it:

```javascript
// Publish current state
client.publish({
  topic: 'users.list.state',
  data: { users: [...], total: 100 },
  retain: true
});
```

Now when a component subscribes to `users.list.state`, it immediately receives the last published value. This is perfect for state synchronization:

```javascript
// New component gets current state immediately
class UserList extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    // Request retained messages
    this.client.subscribe('users.list.state', (msg) => {
      this.users = msg.data.users;
      this.render();
    }, { retained: true });  // <- This is the key
  }
}
```

The component doesn't need to know how to fetch the initial state. It doesn't need to make an API call. It just asks for retained messages and gets the current state instantly.

### Memory Management

The bus limits retained messages to prevent memory leaks. By default, it keeps 1000 retained messages using an LRU (Least Recently Used) eviction policy. When the limit is reached, the oldest unused message is evicted.

You can tune this:

```html
<pan-bus max-retained="5000"></pan-bus>
```

But be careful. Retained messages live in memory for the lifetime of the page. If you're retaining large objects or high-frequency updates, you can consume significant memory.

A good rule of thumb: only retain state snapshots, not events.

```javascript
// Good: Retain state
client.publish({
  topic: 'users.list.state',
  data: { users: [...] },
  retain: true
});

// Bad: Don't retain events
client.publish({
  topic: 'users.item.clicked',  // Ephemeral event
  data: { userId: '123' },
  retain: false  // or just omit it
});
```

## Components and Composition: Building Blocks

### What Is a Component in LARC?

In LARC, a component is just a Web Component—a custom element that follows the W3C standard. No special base class, no framework-specific lifecycle methods. Just plain JavaScript classes extending `HTMLElement`:

```javascript
class UserCard extends HTMLElement {
  connectedCallback() {
    // Element was added to DOM
    this.client = new PanClient(this);
    this.render();
  }

  disconnectedCallback() {
    // Element was removed from DOM
    // (PanClient automatically cleans up subscriptions)
  }

  render() {
    this.innerHTML = `
      <div class="user-card">
        <h3>${this.getAttribute('name')}</h3>
        <p>${this.getAttribute('email')}</p>
      </div>
    `;
  }
}

customElements.define('user-card', UserCard);
```

Use it like any HTML element:

```html
<user-card name="Alice" email="alice@example.com"></user-card>
```

### Communication Patterns

Components in LARC communicate through three primary patterns:

**1. Attributes (Parent -> Child)**

The standard HTML way. Parent sets attributes, child reads them:

```html
<user-card user-id="123"></user-card>
```

```javascript
class UserCard extends HTMLElement {
  static get observedAttributes() {
    return ['user-id'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'user-id') {
      this.loadUser(newValue);
    }
  }
}
```

**2. Events (Child -> Parent)**

Components dispatch events to notify parents of changes:

```javascript
class UserCard extends HTMLElement {
  handleClick() {
    this.dispatchEvent(new CustomEvent('user-selected', {
      detail: { userId: this.userId },
      bubbles: true
    }));
  }
}
```

```javascript
// Parent listens
document.querySelector('user-card').addEventListener('user-selected', (e) => {
  console.log('User selected:', e.detail.userId);
});
```

**3. Messages (Anyone -> Anyone)**

For cross-cutting concerns, use the message bus:

```javascript
class UserCard extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    // Listen for updates to this user
    this.client.subscribe('users.item.updated', (msg) => {
      if (msg.data.id === this.userId) {
        this.update(msg.data);
      }
    });
  }

  handleSave() {
    // Notify the world
    this.client.publish({
      topic: 'users.item.updated',
      data: { id: this.userId, ...this.getData() }
    });
  }
}
```

### Composition Examples

Here's how components compose in practice:

```html
<!-- Dashboard composed of smaller components -->
<user-dashboard>
  <header-bar>
    <user-menu></user-menu>
    <notification-badge></notification-badge>
  </header-bar>

  <main-content>
    <user-list>
      <!-- user-card elements will be inserted here -->
    </user-list>

    <user-details>
      <!-- Details shown when user is selected -->
    </user-details>
  </main-content>
</user-dashboard>
```

Each component is independent. The `<user-menu>` publishes `user.logged-out` when the user logs out. The `<user-list>` subscribes to that message and clears itself. No direct coupling needed.

### The Autoloader: Zero-Config Imports

One of LARC's killer features is the autoloader. Instead of explicitly importing every component:

```javascript
// Traditional way (tedious!)
import './user-dashboard.js';
import './header-bar.js';
import './user-menu.js';
import './notification-badge.js';
import './main-content.js';
import './user-list.js';
import './user-details.js';
```

Just load the autoloader and use components:

```html
<script type="module" src="/core/pan.mjs"></script>

<!-- Components load automatically when used -->
<user-dashboard></user-dashboard>
```

The autoloader uses IntersectionObserver to progressively load components as they approach the viewport. Components not in view aren't loaded until needed, saving bandwidth and parse time.

## State Management Strategies

### The Three Flavors of State

State in LARC comes in three flavors:

1. **Local State**: Confined to a single component
2. **Shared State**: Accessed by multiple components
3. **Persistent State**: Survives page reloads

Let's tackle each one.

### Local State: Keep It Simple

For state that only matters to one component, use instance variables:

```javascript
class Counter extends HTMLElement {
  constructor() {
    super();
    this.count = 0;  // Local state
  }

  increment() {
    this.count++;
    this.render();
  }

  render() {
    this.innerHTML = `
      <button onclick="this.parentElement.increment()">
        Count: ${this.count}
      </button>
    `;
  }
}
```

No store needed. No reducers. Just regular JavaScript variables.

### Shared State: Use Retained Messages

When multiple components need the same state, publish it as a retained message:

```javascript
// Producer: Publishes state
class UserListProvider extends HTMLElement {
  async connectedCallback() {
    this.client = new PanClient(this);

    // Load users
    const users = await this.fetchUsers();

    // Publish as retained state
    this.client.publish({
      topic: 'users.list.state',
      data: { users },
      retain: true
    });
  }

  async fetchUsers() {
    const response = await fetch('/api/users');
    return response.json();
  }
}

// Consumer: Subscribes to state
class UserList extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    this.client.subscribe('users.list.state', (msg) => {
      this.users = msg.data.users;
      this.render();
    }, { retained: true });  // Get current value immediately
  }
}

// Another consumer: Also subscribes
class UserCount extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    this.client.subscribe('users.list.state', (msg) => {
      this.count = msg.data.users.length;
      this.render();
    }, { retained: true });
  }
}
```

All three components are decoupled. The provider doesn't know about the consumers. The consumers don't know about each other. They just agree on a topic name.

### The State Publisher Pattern

For complex state, create dedicated state publisher components:

```javascript
class ShoppingCartState extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);
    this.items = [];

    // Listen for state changes
    this.client.subscribe('cart.item.add', (msg) => {
      this.items.push(msg.data);
      this.publishState();
    });

    this.client.subscribe('cart.item.remove', (msg) => {
      this.items = this.items.filter(i => i.id !== msg.data.id);
      this.publishState();
    });

    this.client.subscribe('cart.clear', () => {
      this.items = [];
      this.publishState();
    });

    // Publish initial state
    this.publishState();
  }

  publishState() {
    this.client.publish({
      topic: 'cart.state',
      data: {
        items: this.items,
        total: this.calculateTotal(),
        count: this.items.length
      },
      retain: true
    });
  }

  calculateTotal() {
    return this.items.reduce((sum, item) => sum + item.price, 0);
  }
}
```

Now any component can:

- Read the cart state by subscribing to `cart.state`
- Modify the cart by publishing to `cart.item.add`, `cart.item.remove`, etc.

The state component acts as a single source of truth, similar to a Redux store, but without the boilerplate.

### Persistent State: Add Storage

For state that should survive page reloads, use the `<pan-storage>` component:

```javascript
// Automatically persists to localStorage
class SettingsState extends HTMLElement {
  connectedCallback() {
    this.client = new PanClient(this);

    // Load from storage
    const stored = localStorage.getItem('settings');
    this.settings = stored ? JSON.parse(stored) : this.getDefaults();

    this.publishState();

    // Listen for changes
    this.client.subscribe('settings.update', (msg) => {
      this.settings = { ...this.settings, ...msg.data };
      this.save();
      this.publishState();
    });
  }

  save() {
    localStorage.setItem('settings', JSON.stringify(this.settings));
  }

  publishState() {
    this.client.publish({
      topic: 'settings.state',
      data: this.settings,
      retain: true
    });
  }

  getDefaults() {
    return {
      theme: 'light',
      language: 'en',
      notifications: true
    };
  }
}
```

Or use LARC's built-in `<pan-storage>` component which handles persistence automatically:

```html
<pan-storage
  key="settings"
  topic="settings.state"
  storage="localStorage">
</pan-storage>
```

Now any updates to `settings.state` are automatically persisted.

## Event Envelopes and Metadata

### The Message Envelope

Every message is wrapped in an envelope that carries metadata:

```javascript
{
  topic: 'users.item.saved',
  data: { id: '123', name: 'Alice' },
  id: 'a1b2c3d4-5678-90ab-cdef-1234567890ab',
  ts: 1698765432000,
  headers: {
    'x-user-id': '123',
    'x-trace-id': 'trace-abc-def'
  }
}
```

### Message IDs

Every message gets a unique ID (UUID v4). This enables:

1. **Deduplication**: Ignore messages you've already processed
2. **Tracing**: Track messages through your system
3. **Debugging**: Identify specific messages in logs

```javascript
// Track processed messages
class DeduplicatingSubscriber extends HTMLElement {
  constructor() {
    super();
    this.processed = new Set();
  }

  connectedCallback() {
    this.client = new PanClient(this);

    this.client.subscribe('events.*', (msg) => {
      if (this.processed.has(msg.id)) {
        console.log('Duplicate message, ignoring:', msg.id);
        return;
      }

      this.processed.add(msg.id);
      this.process(msg);
    });
  }
}
```

### Timestamps

Messages include a timestamp (milliseconds since epoch). Use it for:

1. **Ordering**: Process messages in chronological order
2. **TTL**: Ignore stale messages
3. **Metrics**: Measure message latency

```javascript
// Ignore stale messages
this.client.subscribe('stock.price.updated', (msg) => {
  const age = Date.now() - msg.ts;

  if (age > 5000) {  // More than 5 seconds old
    console.log('Ignoring stale price update');
    return;
  }

  this.updatePrice(msg.data);
});
```

### Custom Headers

Add your own metadata with headers:

```javascript
client.publish({
  topic: 'api.request',
  data: { endpoint: '/users' },
  headers: {
    'x-user-id': currentUser.id,
    'x-trace-id': traceId,
    'x-request-id': requestId
  }
});
```

Headers are perfect for:

- Correlation across service boundaries
- User context for multi-tenant systems
- Debugging and tracing
- Custom routing rules

### The Request/Reply Pattern

The envelope supports request/reply with `replyTo` and `correlationId`:

```javascript
// Under the hood, client.request() does this:
const correlationId = crypto.randomUUID();
const replyTo = `pan:$reply:${clientId}:${correlationId}`;

// Publish request
client.publish({
  topic: 'users.get',
  data: { id: '123' },
  replyTo,
  correlationId
});

// Subscribe to reply
client.subscribe(replyTo, (msg) => {
  if (msg.correlationId === correlationId) {
    console.log('Got reply:', msg.data);
  }
});
```

But you don't need to do this manually. Just use `client.request()`:

```javascript
const response = await client.request('users.get', { id: '123' });
console.log('User:', response.data);
```

The client handles correlation automatically and returns a Promise that resolves with the reply or rejects on timeout.

## Putting It All Together

Let's build a complete example that demonstrates all these concepts:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Task Manager</title>
  <script type="module" src="/core/pan.mjs"></script>
</head>
<body>
  <pan-bus debug="true"></pan-bus>

  <task-app>
    <task-form></task-form>
    <task-list></task-list>
    <task-stats></task-stats>
  </task-app>

  <script type="module">
    import { PanClient } from '/core/pan-client.mjs';

    // Task state manager
    class TaskState extends HTMLElement {
      connectedCallback() {
        this.client = new PanClient(this);
        this.tasks = [];

        // Listen for task operations
        this.client.subscribe('tasks.add', (msg) => {
          this.tasks.push({
            id: crypto.randomUUID(),
            ...msg.data,
            completed: false,
            createdAt: Date.now()
          });
          this.publishState();
        });

        this.client.subscribe('tasks.toggle', (msg) => {
          const task = this.tasks.find(t => t.id === msg.data.id);
          if (task) {
            task.completed = !task.completed;
            this.publishState();
          }
        });

        this.client.subscribe('tasks.delete', (msg) => {
          this.tasks = this.tasks.filter(t => t.id !== msg.data.id);
          this.publishState();
        });

        // Publish initial state
        this.publishState();
      }

      publishState() {
        this.client.publish({
          topic: 'tasks.state',
          data: {
            tasks: this.tasks,
            total: this.tasks.length,
            completed: this.tasks.filter(t => t.completed).length,
            pending: this.tasks.filter(t => !t.completed).length
          },
          retain: true
        });
      }
    }

    // Task form
    class TaskForm extends HTMLElement {
      connectedCallback() {
        this.client = new PanClient(this);
        this.render();
      }

      render() {
        this.innerHTML = `
          <form>
            <input type="text" id="title" placeholder="Task title" required>
            <button type="submit">Add Task</button>
          </form>
        `;

        this.querySelector('form').addEventListener('submit', (e) => {
          e.preventDefault();
          const title = this.querySelector('#title').value;

          this.client.publish({
            topic: 'tasks.add',
            data: { title }
          });

          this.querySelector('#title').value = '';
        });
      }
    }

    // Task list
    class TaskList extends HTMLElement {
      connectedCallback() {
        this.client = new PanClient(this);

        this.client.subscribe('tasks.state', (msg) => {
          this.tasks = msg.data.tasks;
          this.render();
        }, { retained: true });
      }

      render() {
        this.innerHTML = `
          <ul>
            ${(this.tasks || []).map(task => `
              <li>
                <input
                  type="checkbox"
                  ${task.completed ? 'checked' : ''}
                  onclick="this.closest('task-list').toggle('${task.id}')">
                <span style="${task.completed ? 'text-decoration: line-through' : ''}">
                  ${task.title}
                </span>
                <button onclick="this.closest('task-list').delete('${task.id}')">
                  Delete
                </button>
              </li>
            `).join('')}
          </ul>
        `;
      }

      toggle(id) {
        this.client.publish({
          topic: 'tasks.toggle',
          data: { id }
        });
      }

      delete(id) {
        this.client.publish({
          topic: 'tasks.delete',
          data: { id }
        });
      }
    }

    // Task stats
    class TaskStats extends HTMLElement {
      connectedCallback() {
        this.client = new PanClient(this);

        this.client.subscribe('tasks.state', (msg) => {
          this.stats = msg.data;
          this.render();
        }, { retained: true });
      }

      render() {
        if (!this.stats) return;

        this.innerHTML = `
          <div>
            Total: ${this.stats.total} |
            Completed: ${this.stats.completed} |
            Pending: ${this.stats.pending}
          </div>
        `;
      }
    }

    // Register components
    customElements.define('task-state', TaskState);
    customElements.define('task-form', TaskForm);
    customElements.define('task-list', TaskList);
    customElements.define('task-stats', TaskStats);

    // Create state manager
    document.body.appendChild(document.createElement('task-state'));
  </script>
</body>
</html>
```

This example demonstrates:

1. **Message Bus**: Coordinates all communication
2. **Pub/Sub**: Components publish and subscribe to topics
3. **Topics**: Hierarchical naming (`tasks.add`, `tasks.state`)
4. **Retained Messages**: State persists for new subscribers
5. **Component Composition**: Independent components work together
6. **State Management**: Centralized state with decoupled consumers

## What We've Learned

You now understand the core concepts that make LARC work:

- **Message Bus**: Your application's event-based nervous system
- **Pub/Sub**: Decoupled communication through topics
- **Topics**: Hierarchical addressing for organization and routing
- **Message Lifecycle**: Creation, validation, delivery, and retention
- **Components**: Standard Web Components using message passing
- **State Management**: Retained messages as distributed state
- **Envelopes**: Metadata for correlation, tracing, and debugging

These primitives combine to create a simple but powerful architecture. No elaborate state management libraries. No dependency injection frameworks. Just components communicating through a message bus.

In the next chapter, we'll explore the component library and see how LARC provides higher-level abstractions on top of these primitives for common patterns like data binding, forms, and API integration.

## Key Takeaways

1. The `<pan-bus>` element is just HTML—drop it in your page and it works
2. Use `PanClient` for a cleaner API than raw CustomEvents
3. Topic hierarchies enable pattern matching and semantic routing
4. Retained messages provide instant state synchronization
5. Components communicate via the bus, not direct references
6. State managers are just components that publish retained state
7. Message envelopes carry metadata for advanced patterns

Now you're ready to build real applications with LARC. Let's dive into the component library.
