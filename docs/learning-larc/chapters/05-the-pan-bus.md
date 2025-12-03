# Chapter 5: The PAN Bus

The Page Area Network (PAN) bus is LARC's event-driven communication backbone. It enables decoupled, scalable component architectures by providing a pub/sub messaging system that works across your entire application.

In this chapter, you'll master the PAN bus: from basic publish/subscribe patterns to advanced message routing, error handling, and debugging techniques. By the end, you'll be able to build complex applications where components communicate seamlessly without tight coupling.

## Understanding Pub/Sub Architecture

Publish/Subscribe (pub/sub) is a messaging pattern where senders (publishers) don't directly target specific receivers (subscribers). Instead, messages are sent to topics, and any component interested in those topics receives them.

### Traditional Communication

Without pub/sub, components need direct references:

```javascript
// ❌ Tight coupling
class LoginButton {
  handleLogin() {
    const user = this.authenticate();

    // Direct reference to other components
    document.querySelector('user-menu').updateUser(user);
    document.querySelector('sidebar').showUserPanel();
    document.querySelector('notification').show('Welcome!');
  }
}
```

**Problems:**

- LoginButton must know about all dependent components
- Adding new components requires modifying LoginButton
- Components can't work independently
- Testing requires mocking all dependencies

### Pub/Sub Communication

With the PAN bus:

```javascript
// ✓ Loose coupling
class LoginButton {
  handleLogin() {
    const user = this.authenticate();

    // Publish event - don't care who listens
    pan.publish('user.logged-in', { user });
  }
}

// Separate components subscribe independently
class UserMenu {
  connectedCallback() {
    pan.subscribe('user.logged-in', ({ user }) => {
      this.updateUser(user);
    });
  }
}

class Sidebar {
  connectedCallback() {
    pan.subscribe('user.logged-in', () => {
      this.showUserPanel();
    });
  }
}

class Notification {
  connectedCallback() {
    pan.subscribe('user.logged-in', () => {
      this.show('Welcome!');
    });
  }
}
```

**Benefits:**

- LoginButton doesn't know about consumers
- Add new subscribers without changing publishers
- Components work independently
- Easy to test in isolation

### The PAN Bus API

The PAN bus provides three core operations:

```javascript
import { pan } from '@larcjs/core';

// 1. Publish - send a message to a topic
pan.publish('topic.name', { data: 'value' });

// 2. Subscribe - listen for messages on a topic
const unsubscribe = pan.subscribe('topic.name', (data) => {
  console.log('Received:', data);
});

// 3. Unsubscribe - stop listening
unsubscribe();
```

That's the foundation. Everything else builds on these three operations.

## Topics and Namespaces

Topics are the routing keys for messages. Well-designed topics make your application's data flow clear and maintainable.

### Topic Naming Conventions

Use dot notation to create hierarchies:

```
domain.entity.action
```

**Examples:**
```
user.profile.updated
user.auth.login
user.auth.logout
user.settings.changed

cart.item.added
cart.item.removed
cart.total.calculated
cart.checkout.started
cart.checkout.completed

notification.info.show
notification.warning.show
notification.error.show

app.theme.changed
app.language.changed
app.route.changed
```

### Namespace Structure

Organize topics by domain:

**User Domain:**
```
user.auth.login
user.auth.logout
user.auth.refresh
user.profile.fetch
user.profile.update
user.settings.fetch
user.settings.update
```

**Shopping Cart Domain:**
```
cart.init
cart.item.add
cart.item.remove
cart.item.update
cart.clear
cart.checkout
```

**Application Domain:**
```
app.ready
app.error
app.navigate
app.theme.change
app.modal.open
app.modal.close
```

### Wildcards

Subscribe to multiple topics using wildcards:

```javascript
// Subscribe to all user events
pan.subscribe('user.*', (data) => {
  console.log('User event:', data);
});

// Subscribe to all auth events across domains
pan.subscribe('*.auth.*', (data) => {
  console.log('Auth event:', data);
});

// Subscribe to ALL events (debugging)
pan.subscribe('*', (topic, data) => {
  console.log(`[${topic}]`, data);
});
```

**Wildcard Patterns:**

- `user.*` - All user events (user.login, user.logout, etc.)
- `*.created` - All create events (user.created, post.created, etc.)
- `user.*.updated` - All user update events (user.profile.updated, user.settings.updated, etc.)
- `*` - All events

### Topic Best Practices

**1. Be Specific:**
```javascript
// ✓ Good - clear intent
pan.publish('cart.item.added', { item, quantity });

// ❌ Bad - vague
pan.publish('cart.update', { type: 'add', item, quantity });
```

**2. Use Consistent Tense:**
```javascript
// ✓ Good - past tense for events that happened
pan.publish('user.logged-in', { user });
pan.publish('data.loaded', { data });

// ❌ Bad - mixed tense
pan.publish('user.login', { user });  // Is this a command or event?
```

**3. Include Context:**
```javascript
// ✓ Good - data includes context
pan.publish('task.completed', {
  taskId: 123,
  userId: 456,
  completedAt: new Date()
});

// ❌ Bad - missing context
pan.publish('task.done', { id: 123 });
```

**4. Avoid Over-Nesting:**
```javascript
// ✓ Good - clear and concise
pan.publish('user.profile.updated', { user });

// ❌ Bad - too nested
pan.publish('app.domain.user.entity.profile.action.updated', { user });
```

## Publishing Messages

Publishing is straightforward, but there are patterns and options to understand.

### Basic Publishing

```javascript
pan.publish('event.name', { any: 'data' });
```

The data can be anything JSON-serializable:

```javascript
// Simple value
pan.publish('counter.updated', 42);

// Object
pan.publish('user.logged-in', {
  userId: 123,
  username: 'john',
  email: 'john@example.com'
});

// Array
pan.publish('items.loaded', [
  { id: 1, name: 'Item 1' },
  { id: 2, name: 'Item 2' }
]);

// Null/undefined
pan.publish('data.cleared', null);
```

### Publishing from Components

Publish in response to user actions or state changes:

```javascript
class AddToCartButton extends HTMLElement {
  connectedCallback() {
    this.addEventListener('click', this.handleClick);
  }

  async handleClick() {
    const productId = this.getAttribute('product-id');
    const quantity = parseInt(this.getAttribute('quantity') || 1);

    // Publish intent
    pan.publish('cart.item.add-requested', { productId, quantity });

    try {
      // Perform action
      await this.addToCart(productId, quantity);

      // Publish success
      pan.publish('cart.item.added', {
        productId,
        quantity,
        timestamp: Date.now()
      });
    } catch (error) {
      // Publish failure
      pan.publish('cart.item.add-failed', {
        productId,
        quantity,
        error: error.message
      });
    }
  }

  async addToCart(productId, quantity) {
    const response = await fetch('/api/cart/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity })
    });

    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }

    return response.json();
  }
}
```

### Event Metadata

Include metadata for debugging and auditing:

```javascript
function publishWithMetadata(topic, data) {
  pan.publish(topic, {
    ...data,
    _meta: {
      timestamp: Date.now(),
      source: 'UserComponent',
      userId: currentUser?.id,
      sessionId: sessionId
    }
  });
}

// Usage
publishWithMetadata('order.placed', {
  orderId: 12345,
  total: 99.99
});
```

### Batch Publishing

Publish multiple events efficiently:

```javascript
function syncLocalChanges(changes) {
  changes.forEach(change => {
    switch (change.type) {
      case 'add':
        pan.publish('data.item.added', change.item);
        break;
      case 'update':
        pan.publish('data.item.updated', change.item);
        break;
      case 'delete':
        pan.publish('data.item.deleted', { id: change.id });
        break;
    }
  });

  // Publish batch complete
  pan.publish('data.sync.completed', {
    changesCount: changes.length,
    timestamp: Date.now()
  });
}
```

## Subscribing to Events

Subscriptions are how components react to events they care about.

### Basic Subscription

```javascript
const unsubscribe = pan.subscribe('event.name', (data) => {
  console.log('Received:', data);
});

// Later, when done
unsubscribe();
```

### Component Lifecycle Integration

Subscribe in `connectedCallback`, unsubscribe in `disconnectedCallback`:

```javascript
class NotificationDisplay extends HTMLElement {
  connectedCallback() {
    // Subscribe to notification events
    this.unsubscribeInfo = pan.subscribe('notification.info', this.showInfo);
    this.unsubscribeWarning = pan.subscribe('notification.warning', this.showWarning);
    this.unsubscribeError = pan.subscribe('notification.error', this.showError);
  }

  disconnectedCallback() {
    // Clean up subscriptions
    this.unsubscribeInfo();
    this.unsubscribeWarning();
    this.unsubscribeError();
  }

  showInfo = (data) => {
    this.showNotification('info', data.message);
  }

  showWarning = (data) => {
    this.showNotification('warning', data.message);
  }

  showError = (data) => {
    this.showNotification('error', data.message);
  }

  showNotification(type, message) {
    // Render notification UI
  }
}
```

### Multiple Subscriptions Helper

Manage multiple subscriptions easily:

```javascript
class SubscriptionManager {
  constructor() {
    this.subscriptions = [];
  }

  subscribe(topic, handler) {
    const unsubscribe = pan.subscribe(topic, handler);
    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  unsubscribeAll() {
    this.subscriptions.forEach(unsubscribe => unsubscribe());
    this.subscriptions = [];
  }
}

// Usage in component
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.subs = new SubscriptionManager();
  }

  connectedCallback() {
    this.subs.subscribe('user.login', this.handleLogin);
    this.subs.subscribe('user.logout', this.handleLogout);
    this.subs.subscribe('app.theme.changed', this.handleThemeChange);
  }

  disconnectedCallback() {
    this.subs.unsubscribeAll();
  }

  handleLogin = (data) => { /* ... */ }
  handleLogout = (data) => { /* ... */ }
  handleThemeChange = (data) => { /* ... */ }
}
```

### Conditional Subscriptions

Subscribe only when conditions are met:

```javascript
class UserDashboard extends HTMLElement {
  connectedCallback() {
    // Subscribe to user-specific events only when user is logged in
    this.unsubscribeAuth = pan.subscribe('auth.state.changed', ({ isAuthenticated, user }) => {
      if (isAuthenticated) {
        this.subscribeToUserEvents(user.id);
      } else {
        this.unsubscribeFromUserEvents();
      }
    });
  }

  subscribeToUserEvents(userId) {
    this.unsubscribeUserActivity = pan.subscribe('user.activity', (data) => {
      if (data.userId === userId) {
        this.updateActivity(data);
      }
    });

    this.unsubscribeUserNotifications = pan.subscribe('user.notifications', (data) => {
      if (data.userId === userId) {
        this.showNotification(data);
      }
    });
  }

  unsubscribeFromUserEvents() {
    if (this.unsubscribeUserActivity) {
      this.unsubscribeUserActivity();
      this.unsubscribeUserActivity = null;
    }

    if (this.unsubscribeUserNotifications) {
      this.unsubscribeUserNotifications();
      this.unsubscribeUserNotifications = null;
    }
  }
}
```

### Filtering Events

Filter events in the subscriber:

```javascript
pan.subscribe('task.updated', (task) => {
  // Only handle tasks assigned to current user
  if (task.assignedTo === currentUser.id) {
    this.updateTaskDisplay(task);
  }
});

pan.subscribe('notification.*', (notification) => {
  // Only show high-priority notifications
  if (notification.priority >= 3) {
    this.showNotification(notification);
  }
});
```

## Message Patterns

The PAN bus supports several messaging patterns for different use cases.

### 1. Fire and Forget

Most common pattern. Publish and continue without waiting:

```javascript
// Publisher
function saveSettings(settings) {
  localStorage.setItem('settings', JSON.stringify(settings));
  pan.publish('settings.saved', settings);
}

// Subscriber
pan.subscribe('settings.saved', (settings) => {
  console.log('Settings updated:', settings);
  updateUI(settings);
});
```

**Use when:**

- Multiple components may react
- You don't need confirmation
- Action is non-critical

### 2. Request/Response

Request data and wait for a response:

```javascript
// Responder
pan.respond('auth.token.get', async () => {
  return localStorage.getItem('authToken');
});

// Requester
const token = await pan.request('auth.token.get');
console.log('Token:', token);
```

**Implementation:**

```javascript
// In PAN library
class PAN {
  request(topic, data, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const responseId = `${topic}:${Date.now()}:${Math.random()}`;

      // Subscribe to response
      const unsubscribe = this.subscribe(`${topic}:response:${responseId}`, (response) => {
        unsubscribe();
        clearTimeout(timer);
        resolve(response);
      });

      // Set timeout
      const timer = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Request timeout: ${topic}`));
      }, timeout);

      // Publish request
      this.publish(`${topic}:request`, {
        ...data,
        _responseId: responseId
      });
    });
  }

  respond(topic, handler) {
    return this.subscribe(`${topic}:request`, async (data) => {
      try {
        const result = await handler(data);
        this.publish(`${topic}:response:${data._responseId}`, result);
      } catch (error) {
        this.publish(`${topic}:response:${data._responseId}`, {
          error: error.message
        });
      }
    });
  }
}
```

**Use when:**

- Need data from another component
- Waiting for response is acceptable
- Asynchronous operations

### 3. Command Pattern

Issue commands that components execute:

```javascript
// Command issuer
pan.publish('modal.open', {
  component: 'user-profile',
  props: { userId: 123 }
});

// Command handler
pan.subscribe('modal.open', ({ component, props }) => {
  const modal = document.createElement('app-modal');
  modal.component = component;
  modal.props = props;
  document.body.appendChild(modal);
});
```

**Use when:**

- Triggering actions in other components
- Implementing undo/redo
- Building command palette UIs

### 4. Event Sourcing

Store events for replay or auditing:

```javascript
const eventStore = [];

// Store all events
pan.subscribe('*', (topic, data) => {
  eventStore.push({
    topic,
    data,
    timestamp: Date.now()
  });
});

// Replay events
function replayEvents(fromTimestamp) {
  eventStore
    .filter(event => event.timestamp >= fromTimestamp)
    .forEach(event => {
      pan.publish(event.topic, event.data);
    });
}

// Get events for debugging
function getEventHistory(topic) {
  return eventStore.filter(event =>
    event.topic === topic || event.topic.startsWith(topic + '.')
  );
}
```

**Use when:**

- Debugging complex interactions
- Implementing undo/redo
- Auditing user actions
- Syncing state across sessions

### 5. Aggregation Pattern

Collect multiple events before acting:

```javascript
class DataAggregator extends HTMLElement {
  constructor() {
    super();
    this.pendingUpdates = new Set();
    this.debounceTimer = null;
  }

  connectedCallback() {
    pan.subscribe('data.item.updated', ({ id }) => {
      this.pendingUpdates.add(id);
      this.scheduleRefresh();
    });
  }

  scheduleRefresh() {
    clearTimeout(this.debounceTimer);

    this.debounceTimer = setTimeout(() => {
      this.refreshItems(Array.from(this.pendingUpdates));
      this.pendingUpdates.clear();
    }, 500);
  }

  async refreshItems(ids) {
    const items = await fetchItems(ids);
    this.render(items);
  }
}
```

**Use when:**

- Avoiding excessive updates
- Batching API requests
- Debouncing rapid events

### 6. Saga Pattern

Coordinate multi-step processes:

```javascript
class CheckoutSaga {
  constructor() {
    this.setupListeners();
  }

  setupListeners() {
    pan.subscribe('checkout.started', this.handleCheckoutStart);
    pan.subscribe('payment.completed', this.handlePaymentComplete);
    pan.subscribe('order.created', this.handleOrderCreated);
  }

  handleCheckoutStart = async ({ cart }) => {
    try {
      // Step 1: Validate cart
      pan.publish('checkout.validating', { cart });
      await this.validateCart(cart);

      // Step 2: Calculate totals
      pan.publish('checkout.calculating', { cart });
      const totals = await this.calculateTotals(cart);

      // Step 3: Request payment
      pan.publish('payment.requested', { totals });
    } catch (error) {
      pan.publish('checkout.failed', { error: error.message });
    }
  }

  handlePaymentComplete = async ({ paymentId, totals }) => {
    try {
      // Step 4: Create order
      pan.publish('order.creating', { paymentId });
      const order = await this.createOrder(paymentId, totals);

      pan.publish('order.created', { order });
    } catch (error) {
      // Compensating transaction: refund payment
      pan.publish('payment.refund-requested', { paymentId });
      pan.publish('checkout.failed', { error: error.message });
    }
  }

  handleOrderCreated = async ({ order }) => {
    // Step 5: Send confirmation
    pan.publish('order.confirmation-sending', { order });
    await this.sendConfirmation(order);

    // Step 6: Complete checkout
    pan.publish('checkout.completed', { order });
  }
}
```

**Use when:**

- Complex multi-step workflows
- Need to handle failures and rollbacks
- Coordinating multiple services

## Debugging PAN Communication

Debugging event-driven systems requires different techniques than traditional debugging.

### Logging All Events

```javascript
// Enable debug mode
pan.debug(true);

// Or manually subscribe to all events
pan.subscribe('*', (topic, data) => {
  console.group(`[PAN] ${topic}`);
  console.log('Data:', data);
  console.log('Timestamp:', new Date().toISOString());
  console.trace('Stack trace');
  console.groupEnd();
});
```

### Event Inspector

Build a visual event inspector:

```javascript
class PanInspector extends HTMLElement {
  constructor() {
    super();
    this.events = [];
    this.maxEvents = 100;
  }

  connectedCallback() {
    this.render();

    pan.subscribe('*', (topic, data) => {
      this.logEvent(topic, data);
    });
  }

  logEvent(topic, data) {
    this.events.unshift({
      topic,
      data,
      timestamp: Date.now()
    });

    if (this.events.length > this.maxEvents) {
      this.events.pop();
    }

    this.render();
  }

  render() {
    this.innerHTML = `
      <style>
        .pan-inspector {
          position: fixed;
          bottom: 0;
          right: 0;
          width: 400px;
          height: 300px;
          background: white;
          border: 1px solid #ccc;
          overflow: auto;
          font-family: monospace;
          font-size: 12px;
        }

        .event {
          padding: 8px;
          border-bottom: 1px solid #eee;
        }

        .event:hover {
          background: #f5f5f5;
        }

        .topic {
          font-weight: bold;
          color: #667eea;
        }

        .timestamp {
          color: #999;
          font-size: 10px;
        }

        .data {
          margin-top: 4px;
          color: #333;
        }
      </style>

      <div class="pan-inspector">
        <h3>PAN Event Inspector</h3>
        ${this.events.map(event => `
          <div class="event">
            <div class="topic">${event.topic}</div>
            <div class="timestamp">${new Date(event.timestamp).toLocaleTimeString()}</div>
            <div class="data">${JSON.stringify(event.data, null, 2)}</div>
          </div>
        `).join('')}
      </div>
    `;
  }
}

customElements.define('pan-inspector', PanInspector);
```

### Event Filtering

Filter events for specific topics:

```javascript
function filterEvents(pattern) {
  const regex = new RegExp(pattern.replace('*', '.*'));

  pan.subscribe('*', (topic, data) => {
    if (regex.test(topic)) {
      console.log(`[FILTERED] ${topic}:`, data);
    }
  });
}

// Usage
filterEvents('user.*');     // Only user events
filterEvents('*.error');    // All error events
filterEvents('cart|order'); // Cart or order events
```

### Performance Monitoring

Track event frequency and performance:

```javascript
class PanMonitor {
  constructor() {
    this.stats = new Map();

    pan.subscribe('*', (topic) => {
      const stat = this.stats.get(topic) || { count: 0, timestamps: [] };

      stat.count++;
      stat.timestamps.push(Date.now());

      // Keep only last 100 timestamps
      if (stat.timestamps.length > 100) {
        stat.timestamps.shift();
      }

      this.stats.set(topic, stat);
    });
  }

  getStats(topic) {
    const stat = this.stats.get(topic);
    if (!stat) return null;

    const timestamps = stat.timestamps;
    const duration = timestamps[timestamps.length - 1] - timestamps[0];
    const frequency = timestamps.length / (duration / 1000);

    return {
      topic,
      count: stat.count,
      frequency: frequency.toFixed(2) + ' events/sec',
      lastEvent: new Date(timestamps[timestamps.length - 1])
    };
  }

  getAllStats() {
    const results = [];

    this.stats.forEach((_, topic) => {
      results.push(this.getStats(topic));
    });

    return results.sort((a, b) => b.count - a.count);
  }

  reset() {
    this.stats.clear();
  }
}

// Usage
const monitor = new PanMonitor();

// Later, check stats
console.table(monitor.getAllStats());
```

### Event Replay

Capture and replay events for testing:

```javascript
class EventRecorder {
  constructor() {
    this.recording = false;
    this.events = [];
  }

  start() {
    this.recording = true;
    this.events = [];

    this.unsubscribe = pan.subscribe('*', (topic, data) => {
      if (this.recording) {
        this.events.push({ topic, data, timestamp: Date.now() });
      }
    });
  }

  stop() {
    this.recording = false;
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    return this.events;
  }

  replay(events, speed = 1) {
    if (!events || events.length === 0) return;

    const startTime = events[0].timestamp;

    events.forEach((event, index) => {
      const delay = (event.timestamp - startTime) / speed;

      setTimeout(() => {
        pan.publish(event.topic, event.data);
      }, delay);
    });
  }

  save(name) {
    localStorage.setItem(`pan-recording-${name}`, JSON.stringify(this.events));
  }

  load(name) {
    const data = localStorage.getItem(`pan-recording-${name}`);
    return data ? JSON.parse(data) : null;
  }
}

// Usage
const recorder = new EventRecorder();

// Start recording
recorder.start();

// ... perform actions ...

// Stop and save
const events = recorder.stop();
recorder.save('my-test-scenario');

// Later, replay
const events = recorder.load('my-test-scenario');
recorder.replay(events, 2); // 2x speed
```

## Summary

This chapter covered:

- **Pub/Sub Architecture**: Decoupled communication via topics
- **Topics and Namespaces**: Organizing events with hierarchical naming
- **Publishing**: Sending messages and event patterns
- **Subscribing**: Receiving and filtering events
- **Message Patterns**: Fire-and-forget, request/response, commands, sagas
- **Debugging**: Logging, inspection, monitoring, and replay tools

The PAN bus is central to LARC applications. Mastering it enables you to build scalable, maintainable applications where components collaborate without tight coupling.

---

## Best Practices

1. **Use descriptive topic names**
   - `user.profile.updated` not `userUpdated`
   - Past tense for events that happened
   - Include context in message data

2. **Clean up subscriptions**
   - Always unsubscribe in `disconnectedCallback`
   - Use subscription managers for multiple subscriptions
   - Avoid memory leaks

3. **Avoid infinite loops**
   - Don't publish the same event you're subscribed to
   - Use different topics for input and output
   - Add loop detection in debug mode

4. **Keep handlers fast**
   - Don't block the event loop
   - Use async/await for long operations
   - Consider debouncing rapid events

5. **Include metadata**
   - Timestamp, source, user ID for debugging
   - Request IDs for tracing
   - Error details for failures

6. **Test event flows**
   - Use event recorders for integration tests
   - Mock pan.publish/subscribe in unit tests
   - Verify event contracts between components
