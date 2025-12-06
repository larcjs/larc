# Chapter 18: Error Handling and Debugging

> "The only thing more satisfying than writing code that works is understanding why code that doesn't work... doesn't work." — Ancient Developer Proverb

Error handling in LARC is like being a detective in a noir film—except instead of following a femme fatale through shadowy streets, you're following messages through a bus topology. The good news? LARC's message-passing architecture makes debugging surprisingly tractable. The bad news? You still have to actually do the debugging.

## Error Boundaries: Containing the Chaos

In traditional frameworks, errors cascade like dominoes in a Rube Goldberg machine. One component explodes, and suddenly your entire application is showing a white screen of death. LARC's component isolation means errors are naturally contained—but you still need to handle them gracefully.

### Understanding Error Propagation

When a LARC component throws an error during message handling, the error is caught at the component boundary. The component's state remains unchanged, and the error is logged. Other components continue merrily on their way, blissfully unaware of their sibling's existential crisis.

```javascript
// A component with a bug
class BuggyCounter extends Component {
  init() {
    this.state = { count: 0 };
  }

  receive(type, data) {
    if (type === 'increment') {
      // Oops, typo in property name
      this.state.cont++; // This will throw
    }
  }

  render() {
    return html`<div>Count: ${this.state.count}</div>`;
  }
}
```

When this component receives an 'increment' message, it'll throw a TypeError. But here's the beautiful part: the error doesn't take down your app. The counter just stays at zero, looking sheepish.

### Implementing Error Handlers

You can catch and handle errors within your components explicitly:

```javascript
class ResilientCounter extends Component {
  init() {
    this.state = { count: 0, error: null };
  }

  receive(type, data) {
    try {
      if (type === 'increment') {
        // Intentionally buggy operation
        if (data.shouldFail) {
          throw new Error('Increment failed: cosmic rays detected');
        }
        this.state.count++;
        this.state.error = null;
      } else if (type === 'reset-error') {
        this.state.error = null;
      }
    } catch (error) {
      this.state.error = error.message;
      // Emit error to the bus for centralized handling
      this.emit('app-error', {
        component: this.constructor.name,
        error: error.message,
        timestamp: Date.now()
      });
    }
  }

  render() {
    if (this.state.error) {
      return html`
        <div class="error-state">
          <p>😱 Error: ${this.state.error}</p>
          <button onclick=${() => this.receive('reset-error')}>
            Try Again
          </button>
        </div>
      `;
    }

    return html`
      <div>
        <p>Count: ${this.state.count}</p>
        <button onclick=${() => this.receive('increment')}>+1</button>
      </div>
    `;
  }
}
```

This component catches errors, stores them in state, and emits an 'app-error' message to the bus. This pattern gives you three levels of defense:

1. **Local recovery**: The component can display an error state
2. **Global awareness**: Other components can react to the error
3. **Continued operation**: The app keeps running

### Global Error Handler Component

Create a dedicated error handler that listens to all error messages:

```javascript
class ErrorMonitor extends Component {
  init() {
    this.state = {
      errors: [],
      maxErrors: 50 // Keep last 50 errors
    };
    this.on('app-error', this.logError);
    this.on('*', this.catchUnhandledErrors);
  }

  logError(data) {
    const errorEntry = {
      ...data,
      id: crypto.randomUUID()
    };

    this.state.errors.unshift(errorEntry);

    // Trim to max size
    if (this.state.errors.length > this.state.maxErrors) {
      this.state.errors.length = this.state.maxErrors;
    }

    // Send to external error tracking service
    this.reportToErrorService(errorEntry);
  }

  catchUnhandledErrors(type, data) {
    // Wrap all message handlers to catch uncaught errors
    // This is more advanced - see the DevTools section
  }

  reportToErrorService(error) {
    // Integration with Sentry, LogRocket, etc.
    if (window.errorTracker) {
      window.errorTracker.captureMessage(error);
    }
  }

  render() {
    if (this.state.errors.length === 0) {
      return html`<div class="error-monitor">No errors 🎉</div>`;
    }

    return html`
      <div class="error-monitor">
        <h3>Error Log (${this.state.errors.length})</h3>
        <ul>
          ${this.state.errors.map(err => html`
            <li key=${err.id}>
              <strong>${err.component}</strong>: ${err.error}
              <span class="timestamp">
                ${new Date(err.timestamp).toLocaleTimeString()}
              </span>
            </li>
          `)}
        </ul>
      </div>
    `;
  }
}
```

## Message Tracing: Following the Breadcrumbs

The hardest bugs to debug are the ones where you *know* you sent a message, but nothing happened. Did it get lost in the mail? Did the recipient get it and ignore you? Is this a metaphor for dating?

### Built-in Message Tracing

LARC's bus system can be configured to trace all messages:

```javascript
import { createBus } from 'larc';

const bus = createBus({
  debug: true, // Enable debug mode
  traceMessages: true // Log all messages
});

// Now every message will be logged
bus.emit('user-login', { username: 'detective' });
// Console: [LARC] user-login → { username: 'detective' }
```

But debug mode in production is like wearing a tuxedo to a demolition derby—technically impressive, but not practical. Instead, implement selective tracing:

```javascript
class MessageTracer extends Component {
  init() {
    this.state = {
      trace: false,
      messageLog: [],
      tracedTypes: new Set(['user-action', 'api-error', 'navigation'])
    };

    // Listen to ALL messages
    this.on('*', this.traceMessage);

    // Control tracing
    this.on('enable-trace', () => this.state.trace = true);
    this.on('disable-trace', () => this.state.trace = false);
    this.on('clear-trace', () => this.state.messageLog = []);
  }

  traceMessage(type, data) {
    if (!this.state.trace && !this.state.tracedTypes.has(type)) {
      return; // Skip if tracing is off and not a traced type
    }

    const entry = {
      timestamp: performance.now(),
      type,
      data: JSON.parse(JSON.stringify(data)), // Deep clone
      stack: new Error().stack // Capture call stack
    };

    this.state.messageLog.push(entry);

    // Log to console with styling
    console.log(
      `%c[LARC] ${type}`,
      'color: #00f; font-weight: bold',
      data
    );
  }

  render() {
    return html`
      <div class="message-tracer">
        <button onclick=${() => this.receive('enable-trace')}>
          Start Tracing
        </button>
        <button onclick=${() => this.receive('disable-trace')}>
          Stop Tracing
        </button>
        <button onclick=${() => this.receive('clear-trace')}>
          Clear Log
        </button>
        <div class="trace-log">
          ${this.state.messageLog.map((entry, i) => html`
            <div key=${i} class="trace-entry">
              <span class="time">${entry.timestamp.toFixed(2)}ms</span>
              <span class="type">${entry.type}</span>
              <pre>${JSON.stringify(entry.data, null, 2)}</pre>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
```

### Message Flow Visualization

Sometimes you need to see the big picture. Build a message flow diagram:

```javascript
class MessageFlowVisualizer extends Component {
  init() {
    this.state = {
      nodes: new Map(), // component name -> position
      edges: [], // { from, to, type, timestamp }
      recording: false
    };

    this.on('*', this.recordMessage);
  }

  recordMessage(type, data) {
    if (!this.state.recording) return;

    // Track which component sent this
    const sourceComponent = this.identifySource();

    // Track which components might handle this
    const targetComponents = this.identifyTargets(type);

    targetComponents.forEach(target => {
      this.state.edges.push({
        from: sourceComponent,
        to: target,
        type,
        timestamp: Date.now()
      });
    });

    // Auto-prune old edges after 10 seconds
    const cutoff = Date.now() - 10000;
    this.state.edges = this.state.edges.filter(e => e.timestamp > cutoff);
  }

  identifySource() {
    // Analyze call stack to identify sending component
    const stack = new Error().stack;
    // Parse stack frames to find component name
    // (Implementation details depend on your naming conventions)
    return 'UnknownSource';
  }

  identifyTargets(type) {
    // This would require introspection of registered handlers
    // For now, return placeholder
    return ['ComponentA', 'ComponentB'];
  }

  render() {
    // Render as a force-directed graph using D3.js or similar
    // For brevity, showing simplified version
    return html`
      <div class="flow-visualizer">
        <button onclick=${() => this.state.recording = !this.state.recording}>
          ${this.state.recording ? 'Stop' : 'Start'} Recording
        </button>
        <svg width="800" height="600">
          ${this.state.edges.map((edge, i) => html`
            <line key=${i}
              x1=${this.getNodeX(edge.from)}
              y1=${this.getNodeY(edge.from)}
              x2=${this.getNodeX(edge.to)}
              y2=${this.getNodeY(edge.to)}
              stroke="#888"
              stroke-width="2" />
          `)}
        </svg>
      </div>
    `;
  }

  getNodeX(nodeName) {
    // Calculate position for node
    return 100; // Placeholder
  }

  getNodeY(nodeName) {
    return 100; // Placeholder
  }
}
```

## DevTools Integration: Professional Debugging

Browser DevTools are your best friend, but they're even better when your framework plays nice with them.

### Custom Console Formatters

Make LARC messages beautiful in the console:

```javascript
// Add custom formatter for LARC messages
if (window.devtoolsFormatters) {
  window.devtoolsFormatters.push({
    header(obj) {
      if (!obj || !obj.__larcMessage) return null;

      return ['div', { style: 'color: #0066cc; font-weight: bold' },
        ['span', {}, `📨 LARC Message: ${obj.type}`]
      ];
    },
    hasBody(obj) {
      return obj && obj.__larcMessage;
    },
    body(obj) {
      return ['div', {},
        ['div', {}, `Type: ${obj.type}`],
        ['div', {}, `Data: `, ['object', { object: obj.data }]],
        ['div', {}, `Timestamp: ${new Date(obj.timestamp).toISOString()}`]
      ];
    }
  });
}

// Wrap bus.emit to add metadata
const originalEmit = bus.emit;
bus.emit = function(type, data) {
  const message = {
    __larcMessage: true,
    type,
    data,
    timestamp: Date.now()
  };
  console.log(message);
  return originalEmit.call(this, type, data);
};
```

### Source Maps and Stack Traces

When errors occur, you want meaningful stack traces:

```javascript
class ErrorReporter extends Component {
  init() {
    // Catch global errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        source: event.filename,
        line: event.lineno,
        column: event.colno,
        stack: event.error?.stack
      });
    });

    // Catch promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack
      });
    });
  }

  handleError(error) {
    // Parse stack trace to extract meaningful info
    const frames = this.parseStackTrace(error.stack);

    this.emit('fatal-error', {
      ...error,
      frames,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    });
  }

  parseStackTrace(stack) {
    if (!stack) return [];

    return stack.split('\n')
      .slice(1) // Skip first line (error message)
      .map(line => {
        // Parse format: "at functionName (file:line:col)"
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          return {
            function: match[1],
            file: match[2],
            line: parseInt(match[3]),
            column: parseInt(match[4])
          };
        }
        return null;
      })
      .filter(Boolean);
  }

  render() {
    return null; // Invisible component
  }
}
```

### Performance Profiling

Use the Performance API to identify bottlenecks:

```javascript
class PerformanceMonitor extends Component {
  init() {
    this.state = {
      measurements: []
    };

    this.on('*', this.measureMessageHandling);
  }

  measureMessageHandling(type, data) {
    const markName = `message-${type}-${Date.now()}`;
    performance.mark(markName);

    // Measure next tick (after handlers complete)
    setTimeout(() => {
      performance.measure(type, markName);

      const entries = performance.getEntriesByType('measure');
      const latest = entries[entries.length - 1];

      if (latest.duration > 16) { // Slower than 60fps
        console.warn(`Slow message handler: ${type} took ${latest.duration}ms`);
        this.emit('performance-warning', {
          type,
          duration: latest.duration
        });
      }

      performance.clearMarks(markName);
      performance.clearMeasures(type);
    }, 0);
  }

  render() {
    return null;
  }
}
```

## Logging Strategies: Write Once, Debug Forever

Good logging is like leaving a trail of breadcrumbs, except the breadcrumbs are actually useful and don't get eaten by birds.

### Structured Logging

Don't just log strings. Log objects with context:

```javascript
class Logger extends Component {
  init() {
    this.state = {
      level: 'info', // debug, info, warn, error
      transports: [this.consoleTransport, this.remoteTransport]
    };

    this.on('log', this.handleLog);
  }

  handleLog({ level, message, context }) {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.getSessionId(),
      userId: this.getUserId()
    };

    this.state.transports.forEach(transport => {
      transport(entry);
    });
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    const currentIndex = levels.indexOf(this.state.level);
    const requestedIndex = levels.indexOf(level);
    return requestedIndex >= currentIndex;
  }

  consoleTransport(entry) {
    const styles = {
      debug: 'color: gray',
      info: 'color: blue',
      warn: 'color: orange',
      error: 'color: red; font-weight: bold'
    };

    console.log(
      `%c[${entry.level.toUpperCase()}] ${entry.message}`,
      styles[entry.level],
      entry.context
    );
  }

  remoteTransport(entry) {
    // Send to logging service
    if (entry.level === 'error' || entry.level === 'warn') {
      navigator.sendBeacon('/api/logs', JSON.stringify(entry));
    }
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  getUserId() {
    return localStorage.getItem('userId') || 'anonymous';
  }

  render() {
    return null;
  }
}

// Usage in other components
class UserProfile extends Component {
  async loadUserData(userId) {
    this.emit('log', {
      level: 'info',
      message: 'Loading user profile',
      context: { userId }
    });

    try {
      const data = await fetch(`/api/users/${userId}`).then(r => r.json());
      this.state.user = data;

      this.emit('log', {
        level: 'info',
        message: 'User profile loaded',
        context: { userId, username: data.username }
      });
    } catch (error) {
      this.emit('log', {
        level: 'error',
        message: 'Failed to load user profile',
        context: { userId, error: error.message }
      });
    }
  }
}
```

### Log Aggregation and Search

Build a searchable log viewer:

```javascript
class LogViewer extends Component {
  init() {
    this.state = {
      logs: [],
      filter: '',
      levelFilter: 'all'
    };

    this.on('log', (data) => {
      this.state.logs.push(data);
      // Keep only last 1000 logs
      if (this.state.logs.length > 1000) {
        this.state.logs.shift();
      }
    });
  }

  get filteredLogs() {
    return this.state.logs.filter(log => {
      const matchesLevel = this.state.levelFilter === 'all' ||
                          log.level === this.state.levelFilter;
      const matchesText = !this.state.filter ||
                          JSON.stringify(log).toLowerCase()
                            .includes(this.state.filter.toLowerCase());
      return matchesLevel && matchesText;
    });
  }

  exportLogs() {
    const blob = new Blob(
      [JSON.stringify(this.state.logs, null, 2)],
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    a.click();
  }

  render() {
    return html`
      <div class="log-viewer">
        <div class="controls">
          <input
            type="text"
            placeholder="Filter logs..."
            value=${this.state.filter}
            oninput=${(e) => this.state.filter = e.target.value}
          />
          <select
            onchange=${(e) => this.state.levelFilter = e.target.value}
          >
            <option value="all">All Levels</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>
          <button onclick=${() => this.exportLogs()}>Export</button>
          <button onclick=${() => this.state.logs = []}>Clear</button>
        </div>
        <div class="log-entries">
          ${this.filteredLogs.map((log, i) => html`
            <div key=${i} class="log-entry level-${log.level}">
              <span class="timestamp">${log.timestamp}</span>
              <span class="level">${log.level}</span>
              <span class="message">${log.message}</span>
              <details>
                <summary>Context</summary>
                <pre>${JSON.stringify(log.context, null, 2)}</pre>
              </details>
            </div>
          `)}
        </div>
      </div>
    `;
  }
}
```

## Common Pitfalls and Solutions

Let's address the bugs that keep you up at night (or at least keep you Googling until 2 AM).

### Pitfall #1: Message Type Typos

```javascript
// Component A emits
this.emit('user-loged-in', { userId: 123 }); // Typo!

// Component B listens
this.on('user-logged-in', (data) => { /* never called */ });
```

**Solution**: Use constants for message types:

```javascript
// messages.js
export const Messages = {
  USER_LOGGED_IN: 'user-logged-in',
  USER_LOGGED_OUT: 'user-logged-out',
  CART_UPDATED: 'cart-updated'
};

// Usage
import { Messages } from './messages.js';

this.emit(Messages.USER_LOGGED_IN, { userId: 123 });
this.on(Messages.USER_LOGGED_IN, (data) => { /* works! */ });
```

### Pitfall #2: Infinite Message Loops

```javascript
class BadCounter extends Component {
  init() {
    this.state = { count: 0 };
    this.on('increment', () => {
      this.state.count++;
      this.emit('count-changed', { count: this.state.count });
    });
    this.on('count-changed', () => {
      this.emit('increment'); // INFINITE LOOP!
    });
  }
}
```

**Solution**: Add loop detection:

```javascript
class LoopDetector extends Component {
  init() {
    this.messageStack = [];
    this.on('*', this.detectLoop);
  }

  detectLoop(type) {
    this.messageStack.push(type);

    // Check for cycles
    const lastFive = this.messageStack.slice(-5);
    if (this.hasCycle(lastFive)) {
      console.error('Message loop detected:', lastFive);
      this.emit('message-loop-detected', { sequence: lastFive });
    }

    // Clean up old messages
    setTimeout(() => this.messageStack.shift(), 1000);
  }

  hasCycle(sequence) {
    // Simple cycle detection: same message repeated 3+ times
    const counts = {};
    sequence.forEach(type => counts[type] = (counts[type] || 0) + 1);
    return Object.values(counts).some(count => count >= 3);
  }

  render() {
    return null;
  }
}
```

### Pitfall #3: Stale Closures in Handlers

```javascript
class StaleCounter extends Component {
  init() {
    this.state = { count: 0 };

    // This handler captures the initial value of count
    this.on('log-count', () => {
      console.log(this.state.count); // Always logs 0!
    });

    this.on('increment', () => {
      this.state.count++;
    });
  }
}
```

**Solution**: Always access `this.state` directly, never capture it:

```javascript
class FreshCounter extends Component {
  init() {
    this.state = { count: 0 };

    // Access this.state.count at call time
    this.on('log-count', () => {
      console.log(this.state.count); // Always current!
    });
  }
}
```

### Pitfall #4: Async Race Conditions

```javascript
class RacyLoader extends Component {
  async loadData(id) {
    const data = await fetch(`/api/items/${id}`).then(r => r.json());
    this.state.currentItem = data; // May be stale if user clicked again!
  }
}
```

**Solution**: Track request IDs:

```javascript
class SafeLoader extends Component {
  init() {
    this.state = {
      currentItem: null,
      loading: false
    };
    this.currentRequestId = 0;
  }

  async loadData(id) {
    const requestId = ++this.currentRequestId;
    this.state.loading = true;

    try {
      const data = await fetch(`/api/items/${id}`).then(r => r.json());

      // Only update if this is still the latest request
      if (requestId === this.currentRequestId) {
        this.state.currentItem = data;
        this.state.loading = false;
      }
    } catch (error) {
      if (requestId === this.currentRequestId) {
        this.state.loading = false;
        this.emit('load-error', { error: error.message });
      }
    }
  }
}
```

## Debugging Checklist

When something goes wrong, work through this checklist:

1. **Is the message being sent?**
   - Add a console.log right before `emit()`
   - Check the MessageTracer component

2. **Is the message type spelled correctly?**
   - Use message constants
   - Enable strict type checking

3. **Is the handler registered?**
   - Check that `this.on()` is called in `init()`
   - Verify the component is instantiated

4. **Is the handler being called?**
   - Add console.log at the start of the handler
   - Use the browser debugger with breakpoints

5. **Is the state updating?**
   - Log state before and after updates
   - Check for typos in property names

6. **Is the render being triggered?**
   - LARC should re-render after state changes
   - Check for errors in render method

7. **Are there async issues?**
   - Use request IDs for async operations
   - Check Promise rejection handling

8. **Is there a message loop?**
   - Use the LoopDetector component
   - Review message flow diagram

## Conclusion

Debugging LARC applications is like detective work with better tooling. The message-passing architecture gives you clear boundaries and audit trails. Components fail independently. Errors are contained. And with the right monitoring in place, you'll know about problems before your users do.

Remember: the best debugging session is the one you don't have to do because you wrote good error handling in the first place. But when things do go wrong (and they will), you're now armed with the tools to track down bugs faster than a caffeinated squirrel.

In the next chapter, we'll explore advanced patterns that will make your LARC applications more powerful—and hopefully won't introduce too many new bugs to debug.
