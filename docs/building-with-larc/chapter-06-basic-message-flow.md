# Basic Message Flow

> "In the beginning was the Message, and the Message was with the Bus, and the Message was the Bus. And the Bus said, 'Let there be publish-subscribe,' and there was publish-subscribe, and it was good—mostly because it avoided callback hell."
>
> — The Book of Reactive Programming, Chapter 1, Verse 1

If you've made it through the previous chapters, you now understand the philosophical underpinnings of LARC, its architecture, and how to set up a basic application. But philosophy and architecture don't ship features. Messages do.

In this chapter, we'll dive deep into the beating heart of LARC: the message flow. We'll explore how messages are published, how components subscribe to topics, how to use wildcard patterns to listen for multiple message types at once, and how to clean up after yourself when the party's over. Think of this chapter as your field guide to the PAN bus—the communication backbone that makes LARC applications tick.

## The Anatomy of a Message

Before we start slinging messages around like a caffeinated postal worker, let's understand what a message actually is in LARC.

A message in LARC is delightfully simple: it's a plain JavaScript object with two required properties:

```javascript
{
  topic: "user.login",
  data: {
    userId: "12345",
    username: "alice",
    timestamp: Date.now()
  }
}
```

That's it. The `topic` is a string that categorizes the message, and `data` is whatever payload you want to send along for the ride. This simplicity is intentional—LARC doesn't impose schemas, validation, or type systems on your messages. It trusts you to be a responsible adult (though it secretly hopes you're using TypeScript).

The topic follows a hierarchical naming convention using dots as separators, much like DNS names or Java package names. This convention enables powerful pattern matching, as we'll see shortly.

## Publishing Your First Message

Publishing a message is as straightforward as calling a function. In fact, it *is* calling a function:

```javascript
import { publish } from '@larc/core';

// Publish a message
publish('user.login', {
  userId: '12345',
  username: 'alice',
  timestamp: Date.now()
});
```

When you call `publish()`, LARC does several things:

1. It wraps your data in a message envelope with the specified topic
2. It routes the message to all subscribers interested in that topic
3. It optionally stores the message for later retrieval (more on this in a moment)
4. It returns immediately, because publishing is non-blocking

That last point is crucial. Publishing a message doesn't wait for subscribers to process it. It's fire-and-forget, like throwing a message in a bottle into the ocean, except the ocean is your application's memory space and the bottle is a JavaScript object. And unlike real bottles, these arrive instantly—or at least as instantly as the JavaScript event loop allows.

### Publishing from Components

In most real applications, you'll publish messages from within web components. Here's a more realistic example:

```javascript
class LoginForm extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <form id="login-form">
        <input type="text" id="username" placeholder="Username" />
        <input type="password" id="password" placeholder="Password" />
        <button type="submit">Log In</button>
      </form>
    `;

    this.querySelector('#login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });
  }

  async handleLogin() {
    const username = this.querySelector('#username').value;
    const password = this.querySelector('#password').value;

    // Publish a login attempt message
    publish('auth.login.attempt', { username });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      if (response.ok) {
        const user = await response.json();

        // Publish success message
        publish('auth.login.success', {
          userId: user.id,
          username: user.username,
          roles: user.roles,
          timestamp: Date.now()
        });
      } else {
        // Publish failure message
        publish('auth.login.failure', {
          username,
          reason: 'Invalid credentials',
          timestamp: Date.now()
        });
      }
    } catch (error) {
      // Publish error message
      publish('auth.login.error', {
        username,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }
}

customElements.define('login-form', LoginForm);
```

Notice how we're publishing multiple messages at different stages of the login process. This granularity gives other parts of the application fine-grained awareness of what's happening. An analytics component might care about login attempts, while a notification component only cares about successes and failures.

## Subscribing to Topics

Publishing messages into the void is about as useful as shouting into a pillow. To make messages meaningful, you need subscribers—components that listen for specific topics and react accordingly.

Subscribing is just as simple as publishing:

```javascript
import { subscribe } from '@larc/core';

// Subscribe to a topic
const unsubscribe = subscribe('user.login', (message) => {
  console.log('User logged in:', message.data);
});
```

The `subscribe()` function takes two arguments: a topic pattern and a callback function. When a message matching that pattern is published, your callback is invoked with the message object.

Notice that `subscribe()` returns a function. That function, conventionally called `unsubscribe`, removes your subscription when called. More on cleanup later.

### Subscription Example: Notification System

Let's build a component that displays notifications for authentication events:

```javascript
class NotificationCenter extends HTMLElement {
  connectedCallback() {
    this.subscriptions = [];
    this.innerHTML = '<div id="notifications"></div>';

    // Subscribe to success messages
    this.subscriptions.push(
      subscribe('auth.login.success', (msg) => {
        this.showNotification(
          `Welcome back, ${msg.data.username}!`,
          'success'
        );
      })
    );

    // Subscribe to failure messages
    this.subscriptions.push(
      subscribe('auth.login.failure', (msg) => {
        this.showNotification(
          `Login failed: ${msg.data.reason}`,
          'error'
        );
      })
    );

    // Subscribe to error messages
    this.subscriptions.push(
      subscribe('auth.login.error', (msg) => {
        this.showNotification(
          `An error occurred: ${msg.data.error}`,
          'error'
        );
      })
    );
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    this.querySelector('#notifications').appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);
  }

  disconnectedCallback() {
    // Clean up subscriptions
    this.subscriptions.forEach(unsub => unsub());
  }
}

customElements.define('notification-center', NotificationCenter);
```

This component demonstrates several best practices:

1. **Store unsubscribe functions**: Keep references to all your subscriptions so you can clean them up later
2. **React to messages**: The callback functions update the UI in response to published messages
3. **Clean up in disconnectedCallback**: When the component is removed from the DOM, unsubscribe from all topics

## Wildcard Patterns: The Power of Asterisks

Subscribing to individual topics is fine for simple cases, but it gets tedious fast. Imagine subscribing to `auth.login.success`, `auth.login.failure`, `auth.logout.success`, `auth.logout.failure`, `auth.refresh.success`, `auth.refresh.failure`—you'd need six separate subscriptions!

Enter wildcard patterns. LARC supports two wildcard characters:

- `*` matches a single topic segment
- `**` matches zero or more topic segments

Here are some examples:

```javascript
// Match any auth-related login message
subscribe('auth.login.*', (msg) => {
  console.log('Login event:', msg.topic, msg.data);
});

// Match any auth message at any depth
subscribe('auth.**', (msg) => {
  console.log('Auth event:', msg.topic, msg.data);
});

// Match any success message for any operation
subscribe('*.*.success', (msg) => {
  console.log('Success:', msg.topic, msg.data);
});

// Match all messages (use sparingly!)
subscribe('**', (msg) => {
  console.log('All messages:', msg.topic, msg.data);
});
```

The single asterisk (`*`) matches exactly one segment. The pattern `auth.*.success` would match `auth.login.success` and `auth.logout.success`, but not `auth.success` (too few segments) or `auth.user.login.success` (too many segments).

The double asterisk (`**`) is greedier. It matches any number of segments, including zero. The pattern `auth.**` matches `auth.login`, `auth.login.success`, `auth.user.profile.update`, and even just `auth` (though publishing a message with a single-segment topic is unusual).

### Practical Wildcard Example: Audit Logger

Let's build an audit logger that records all authentication-related activities:

```javascript
class AuditLogger extends HTMLElement {
  connectedCallback() {
    this.logs = [];

    // Subscribe to all auth events
    this.unsubscribe = subscribe('auth.**', (msg) => {
      this.logEvent(msg);
    });

    this.render();
  }

  logEvent(msg) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      topic: msg.topic,
      data: msg.data
    };

    this.logs.push(logEntry);

    // Persist to localStorage
    localStorage.setItem('audit-logs', JSON.stringify(this.logs));

    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="audit-logger">
        <h2>Audit Log</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${this.logs.map(log => `
              <tr>
                <td>${log.timestamp}</td>
                <td>${log.topic}</td>
                <td>${JSON.stringify(log.data)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('audit-logger', AuditLogger);
```

This component uses `auth.**` to capture every authentication-related message, regardless of its specific operation or outcome. It's a powerful pattern for cross-cutting concerns like logging, analytics, or debugging.

## Message Retention: The PAN Bus Remembers

One of the more clever features of LARC's PAN bus is message retention. By default, the PAN bus retains the most recent message for each topic. This means that when a component subscribes to a topic, it immediately receives the last published message, if one exists.

This behavior solves a common problem in reactive systems: the "late subscriber" problem. Imagine a component that displays the current user's profile. If it subscribes to `user.profile` after the profile has already been loaded, it would normally miss that message and show stale or empty data. With message retention, it gets the current profile immediately upon subscribing.

Here's an example:

```javascript
// Somewhere early in the app lifecycle
publish('user.profile', {
  userId: '12345',
  username: 'alice',
  email: 'alice@example.com'
});

// Later, a component subscribes
class UserProfile extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('user.profile', (msg) => {
      this.render(msg.data);
    });
    // The callback fires immediately with the retained message
  }

  render(profile) {
    this.innerHTML = `
      <div class="user-profile">
        <h2>${profile.username}</h2>
        <p>${profile.email}</p>
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('user-profile', UserProfile);
```

Even though `user-profile` subscribed after the message was published, it still receives the profile data immediately. This makes components more robust and eliminates race conditions.

### Controlling Retention

Not all messages should be retained. Ephemeral events like `button.clicked` or `mouse.moved` would be pointless to retain—by the time a late subscriber arrives, the event is ancient history.

LARC allows you to control retention on a per-topic basis using a configuration object:

```javascript
import { configure } from '@larc/core';

configure({
  retention: {
    'user.profile': true,        // Retain
    'user.settings': true,        // Retain
    'auth.login.attempt': false,  // Don't retain
    'mouse.*': false,             // Don't retain any mouse events
    '**': true                    // Default: retain everything else
  }
});
```

The retention configuration uses the same wildcard pattern matching as subscriptions. More specific patterns override less specific ones.

### Retention Gotchas

Message retention is powerful, but it has pitfalls:

1. **Memory Usage**: Retained messages live in memory. If you're publishing thousands of unique topics, you'll accumulate thousands of messages. Consider using less granular topics or disabling retention for high-volume streams.

2. **Stale Data**: Retained messages can be stale. If a component subscribes to `user.profile` but the profile was loaded five minutes ago, is that data still valid? Always consider whether you need to refresh data after receiving a retained message.

3. **Surprising Callbacks**: Because subscriptions fire immediately if a retained message exists, your callback might execute synchronously during the `subscribe()` call. If your callback manipulates the DOM or performs side effects, ensure the component is fully initialized first.

## Message Ordering and Synchronization

LARC processes messages synchronously in the order they're published. If you publish three messages in sequence:

```javascript
publish('event.one', { value: 1 });
publish('event.two', { value: 2 });
publish('event.three', { value: 3 });
```

All subscribers will receive them in that exact order: one, two, three. This guarantee simplifies reasoning about message flow and eliminates many race conditions.

However, this guarantee only applies within a single JavaScript execution context. If you publish a message, then await an asynchronous operation, then publish another message, other code may publish messages in between:

```javascript
publish('step.one', {});
await fetch('/api/data'); // Other code runs during this await
publish('step.two', {});
```

If you need strict ordering across asynchronous boundaries, consider batching messages or using sequence numbers:

```javascript
let sequenceNumber = 0;

async function performOperation() {
  const seq = ++sequenceNumber;

  publish('operation.start', { sequence: seq });

  try {
    const result = await doAsyncWork();
    publish('operation.complete', { sequence: seq, result });
  } catch (error) {
    publish('operation.error', { sequence: seq, error: error.message });
  }
}
```

Subscribers can then use the sequence number to reorder messages if needed.

## Unsubscribing and Cleanup

Every `subscribe()` call returns an unsubscribe function. Calling this function removes the subscription and prevents future messages from triggering the callback:

```javascript
const unsubscribe = subscribe('user.login', (msg) => {
  console.log('User logged in:', msg.data);
});

// Later, when you're done listening
unsubscribe();
```

Failing to unsubscribe is a common source of memory leaks and bugs. If a component subscribes to a topic but never unsubscribes, the callback remains in memory even after the component is removed from the DOM. This keeps the component alive, prevents garbage collection, and may cause the callback to fire unexpectedly.

### Cleanup Patterns

The most reliable cleanup pattern is to unsubscribe in the component's `disconnectedCallback()`:

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = subscribe('some.topic', (msg) => {
      this.handleMessage(msg);
    });
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
```

For multiple subscriptions, store them in an array:

```javascript
class MyComponent extends HTMLElement {
  connectedCallback() {
    this.subscriptions = [
      subscribe('topic.one', this.handleOne.bind(this)),
      subscribe('topic.two', this.handleTwo.bind(this)),
      subscribe('topic.three', this.handleThree.bind(this))
    ];
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions = [];
  }
}
```

Or, if you're feeling fancy, use a helper function:

```javascript
class MyComponent extends HTMLElement {
  constructor() {
    super();
    this.subscriptions = new Set();
  }

  subscribe(topic, callback) {
    const unsub = subscribe(topic, callback);
    this.subscriptions.add(unsub);
    return unsub;
  }

  connectedCallback() {
    this.subscribe('topic.one', this.handleOne.bind(this));
    this.subscribe('topic.two', this.handleTwo.bind(this));
    this.subscribe('topic.three', this.handleThree.bind(this));
  }

  disconnectedCallback() {
    this.subscriptions.forEach(unsub => unsub());
    this.subscriptions.clear();
  }
}
```

This pattern wraps the `subscribe()` function and automatically tracks subscriptions, making cleanup effortless.

## Debugging Message Flow

As your application grows, understanding message flow becomes increasingly important. LARC provides several tools to help debug and visualize messages.

### Console Logging

The simplest debugging technique is to log all messages:

```javascript
subscribe('**', (msg) => {
  console.log(`[${msg.topic}]`, msg.data);
});
```

This logs every message published in your application. It's noisy, but invaluable when tracking down mysterious bugs or understanding component interactions.

### Conditional Logging

For more targeted debugging, use patterns:

```javascript
// Log only auth-related messages
subscribe('auth.**', (msg) => {
  console.log(`[AUTH] ${msg.topic}`, msg.data);
});

// Log only errors
subscribe('*.*.error', (msg) => {
  console.error(`[ERROR] ${msg.topic}`, msg.data);
});
```

### Message Inspector Component

For a more sophisticated approach, build a message inspector component:

```javascript
class MessageInspector extends HTMLElement {
  constructor() {
    super();
    this.messages = [];
    this.maxMessages = 100;
    this.filter = '';
  }

  connectedCallback() {
    this.unsubscribe = subscribe('**', (msg) => {
      this.messages.unshift({
        timestamp: new Date().toISOString(),
        topic: msg.topic,
        data: msg.data
      });

      if (this.messages.length > this.maxMessages) {
        this.messages.pop();
      }

      this.render();
    });

    this.render();
  }

  render() {
    const filteredMessages = this.filter
      ? this.messages.filter(m => m.topic.includes(this.filter))
      : this.messages;

    this.innerHTML = `
      <div class="message-inspector">
        <h2>Message Inspector</h2>
        <input
          type="text"
          placeholder="Filter by topic..."
          value="${this.filter}"
          id="filter-input"
        />
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Topic</th>
              <th>Data</th>
            </tr>
          </thead>
          <tbody>
            ${filteredMessages.map(msg => `
              <tr>
                <td>${msg.timestamp}</td>
                <td><code>${msg.topic}</code></td>
                <td><pre>${JSON.stringify(msg.data, null, 2)}</pre></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    const input = this.querySelector('#filter-input');
    if (input) {
      input.addEventListener('input', (e) => {
        this.filter = e.target.value;
        this.render();
      });
    }
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('message-inspector', MessageInspector);
```

Add this component to your app during development, and you'll have a real-time view of all message traffic, complete with filtering capabilities.

## Performance Considerations

The PAN bus is fast, but it's not magic. Publishing messages and invoking callbacks takes time. Here are some guidelines for keeping performance optimal:

1. **Publish sparingly**: Don't publish messages inside tight loops or high-frequency events (like `mousemove`). If you must, throttle or debounce your publications.

2. **Keep callbacks fast**: Subscriber callbacks are invoked synchronously. If a callback does heavy computation or DOM manipulation, it blocks message processing. Consider deferring work with `requestAnimationFrame()` or `setTimeout()`.

3. **Unsubscribe aggressively**: Every active subscription consumes memory and adds overhead to message routing. Unsubscribe as soon as you no longer need messages.

4. **Use specific topics**: Wildcard subscriptions are powerful but expensive. A subscription to `**` matches every message, so its callback runs for every publication. Use the most specific pattern that meets your needs.

5. **Avoid retained message bloat**: If you have hundreds of unique topics, you'll have hundreds of retained messages. Consider whether retention is necessary for each topic.

## Common Patterns and Anti-Patterns

### Pattern: Command-Query Separation

Distinguish between commands (messages that request actions) and events (messages that announce completed actions):

```javascript
// Command: requesting an action
publish('user.profile.update', { userId: '12345', name: 'Alice' });

// Event: announcing a completed action
publish('user.profile.updated', { userId: '12345', name: 'Alice' });
```

Commands are typically imperatives ("update", "delete", "send"), while events are past tense ("updated", "deleted", "sent"). This distinction makes message flow clearer.

### Pattern: Namespacing

Use a consistent namespace hierarchy for topics:

```javascript
// Good: hierarchical namespacing
publish('app.user.profile.updated', { ... });
publish('app.ui.theme.changed', { ... });
publish('app.data.sync.complete', { ... });

// Bad: flat namespace
publish('profileUpdated', { ... });
publish('themeChanged', { ... });
publish('syncComplete', { ... });
```

Hierarchical naming enables powerful wildcard subscriptions and makes the codebase easier to navigate.

### Anti-Pattern: Publishing Without Data

Avoid publishing messages without meaningful data:

```javascript
// Bad
publish('user.login', {});

// Good
publish('user.login', {
  userId: '12345',
  username: 'alice',
  timestamp: Date.now()
});
```

Even if subscribers don't currently need the data, they might in the future. Publishing rich data makes messages more useful and reduces the need for additional queries.

### Anti-Pattern: Overloading Topics

Don't use the same topic for multiple purposes:

```javascript
// Bad: same topic, different meanings
publish('user.action', { type: 'login', userId: '12345' });
publish('user.action', { type: 'logout', userId: '12345' });

// Good: distinct topics
publish('user.login', { userId: '12345' });
publish('user.logout', { userId: '12345' });
```

Overloading topics forces subscribers to inspect message data to determine intent, which defeats the purpose of topic-based routing.

## Wrapping Up

You've now mastered the basics of message flow in LARC. You can publish messages, subscribe to topics, use wildcard patterns, leverage message retention, and clean up subscriptions. These are the fundamental skills you'll use in every LARC application.

In the next chapter, we'll build on this foundation and explore how to create reusable, composable web components that communicate seamlessly via the PAN bus. You'll learn about component lifecycle, Shadow DOM considerations, and patterns for building complex UIs from simple, loosely-coupled components.

But before we move on, take a moment to experiment. Fire up a LARC application, add a `message-inspector` component, and publish some messages. Watch them flow through the system. Subscribe with different wildcard patterns and see how they match. The best way to internalize these concepts is to play with them.

Remember: messages are the lifeblood of a LARC application. Treat them with care, name them thoughtfully, and they'll reward you with a system that's easy to understand, extend, and debug. And when things inevitably go wrong, you'll have the tools to trace message flow and identify the problem.

Now, onward to components.
