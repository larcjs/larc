# Error Handling and Debugging

Quick reference for error handling and debugging in LARC applications. For detailed tutorials, see *Learning LARC* Chapter 14.

## Overview

Handle errors gracefully through component-level error boundaries, centralized error monitoring, and message tracing. LARC's isolated component architecture naturally contains errors, preventing cascading failures.

**Key Concepts**:

- Error boundaries contain failures within components
- Global error handlers monitor application health
- Message tracing tracks pub/sub flows
- Structured logging provides debugging context
- DevTools integration for professional debugging

## Quick Example

```javascript
class ResilientComponent extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = bus.subscribe('data.fetch', async (msg) => {
      try {
        const data = await this.fetchData(msg.data.id);
        bus.publish('data.loaded', { data });
      } catch (error) {
        bus.publish('app.error', {
          component: 'ResilientComponent',
          error: error.message,
          context: { id: msg.data.id }
        });
        this.showError(error);
      }
    });
  }

  showError(error) {
    this.innerHTML = `
      <div class="error">
        Error: ${error.message}
        <button onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}
```

## Error Handling Patterns

| Pattern | Description | Use Case |
|---------|-------------|----------|
| Try-catch blocks | Catch synchronous errors | Immediate operations |
| Promise `.catch()` | Handle async errors | Fetch, timeouts |
| Error boundaries | Contain component failures | Prevent cascading failures |
| Global error handler | Catch unhandled errors | Last line of defense |
| Error messages | Publish via PAN bus | Centralized monitoring |

### Component Error Boundary

```javascript
class ErrorBoundary extends HTMLElement {
  constructor() {
    super();
    this.error = null;
  }

  connectedCallback() {
    this.renderContent();
    
    // Catch errors from child components
    this.addEventListener('error', (e) => {
      this.error = e.error || e;
      this.renderContent();
      e.stopPropagation();
    });
  }

  renderContent() {
    if (this.error) {
      this.innerHTML = `
        <div class="error-boundary">
          <h3>Something went wrong</h3>
          <p>${this.error.message}</p>
          <button onclick="location.reload()">Reload</button>
        </div>
      `;
    }
  }
}
```

### Global Error Monitor

```javascript
class ErrorMonitor extends HTMLElement {
  constructor() {
    super();
    this.errors = [];
  }

  connectedCallback() {
    // Subscribe to error messages
    this.unsubscribe = bus.subscribe('app.error', (msg) => {
      this.logError(msg.data);
    });

    // Catch global errors
    window.addEventListener('error', (e) => {
      this.logError({
        message: e.message,
        source: e.filename,
        line: e.lineno
      });
    });

    // Catch promise rejections
    window.addEventListener('unhandledrejection', (e) => {
      this.logError({
        message: e.reason?.message || 'Promise rejected',
        stack: e.reason?.stack
      });
    });
  }

  logError(error) {
    const entry = {
      ...error,
      timestamp: new Date().toISOString(),
      url: location.href
    };

    this.errors.push(entry);
    console.error('[App Error]', entry);

    // Send to error tracking service
    this.reportError(entry);
  }

  reportError(error) {
    if (window.errorTracker) {
      window.errorTracker.captureException(error);
    }
  }
}
```

## Message Tracing

### Enable Bus Debugging

```html
<pan-bus debug="true" enable-tracing="true"></pan-bus>
```

### Custom Message Tracer

```javascript
class MessageTracer extends HTMLElement {
  constructor() {
    super();
    this.log = [];
    this.tracing = false;
  }

  connectedCallback() {
    this.unsubscribe = bus.subscribe('*', (msg) => {
      if (!this.tracing) return;

      this.log.push({
        topic: msg.topic,
        data: msg.data,
        timestamp: performance.now()
      });

      console.log(
        `%c[MSG] ${msg.topic}`,
        'color: blue; font-weight: bold',
        msg.data
      );
    });
  }

  startTracing() {
    this.tracing = true;
    this.log = [];
  }

  stopTracing() {
    this.tracing = false;
    return this.log;
  }

  exportLog() {
    const blob = new Blob([JSON.stringify(this.log, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `message-trace-${Date.now()}.json`;
    a.click();
  }
}
```

## Structured Logging

```javascript
class Logger {
  constructor() {
    this.level = 'info'; // debug, info, warn, error
  }

  log(level, message, context = {}) {
    if (!this.shouldLog(level)) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.getSessionId()
    };

    this.output(entry);
    this.send(entry);
  }

  shouldLog(level) {
    const levels = ['debug', 'info', 'warn', 'error'];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }

  output(entry) {
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

  send(entry) {
    if (entry.level === 'error' || entry.level === 'warn') {
      navigator.sendBeacon('/api/logs', JSON.stringify(entry));
    }
  }

  getSessionId() {
    return sessionStorage.getItem('sessionId') || 'unknown';
  }

  debug(message, context) { this.log('debug', message, context); }
  info(message, context) { this.log('info', message, context); }
  warn(message, context) { this.log('warn', message, context); }
  error(message, context) { this.log('error', message, context); }
}

// Global logger instance
const logger = new Logger();
export { logger };
```

**Usage**:
```javascript
import { logger } from './logger.js';

class UserService {
  async login(username, password) {
    logger.info('User login attempt', { username });

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      logger.info('User logged in', { username, userId: data.userId });
      return data;
    } catch (error) {
      logger.error('Login failed', { username, error: error.message });
      throw error;
    }
  }
}
```

## DevTools Integration

### Custom Console Formatters

```javascript
// Enable custom formatters in Chrome DevTools
if (window.devtoolsFormatters) {
  window.devtoolsFormatters.push({
    header(obj) {
      if (!obj?.__larcMessage) return null;

      return ['div', { style: 'color: #00f; font-weight: bold' },
        `[LARC] ${obj.topic}`
      ];
    },
    hasBody(obj) {
      return obj?.__larcMessage;
    },
    body(obj) {
      return ['div', {},
        ['div', {}, `Topic: ${obj.topic}`],
        ['div', {}, `Data: `, ['object', { object: obj.data }]],
        ['div', {}, `Time: ${new Date(obj.timestamp).toISOString()}`]
      ];
    }
  });
}
```

### Performance Monitoring

```javascript
class PerformanceMonitor extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = bus.subscribe('*', (msg) => {
      const mark = `msg-${msg.topic}-${Date.now()}`;
      performance.mark(mark);

      setTimeout(() => {
        performance.measure(msg.topic, mark);
        const entries = performance.getEntriesByType('measure');
        const latest = entries[entries.length - 1];

        if (latest.duration > 16) { // Slower than 60fps
          console.warn(`Slow handler: ${msg.topic} took ${latest.duration}ms`);
          bus.publish('performance.warning', {
            topic: msg.topic,
            duration: latest.duration
          });
        }

        performance.clearMarks(mark);
        performance.clearMeasures(msg.topic);
      }, 0);
    });
  }
}
```

## Common Pitfalls

### Message Type Typos

**Problem**: Misspelled message topics  
**Solution**: Use constants

```javascript
// messages.js
export const MSG = {
  USER_LOGIN: 'user.login',
  USER_LOGOUT: 'user.logout',
  CART_UPDATE: 'cart.update'
};

// Usage
import { MSG } from './messages.js';

bus.publish(MSG.USER_LOGIN, { userId: 123 });
bus.subscribe(MSG.USER_LOGIN, (msg) => { /* works */ });
```

### Infinite Message Loops

**Problem**: A → B → A → B forever  
**Solution**: Loop detection

```javascript
class LoopDetector extends HTMLElement {
  constructor() {
    super();
    this.stack = [];
  }

  connectedCallback() {
    this.unsubscribe = bus.subscribe('*', (msg) => {
      this.stack.push(msg.topic);

      const recent = this.stack.slice(-5);
      const counts = {};
      recent.forEach(t => counts[t] = (counts[t] || 0) + 1);

      if (Object.values(counts).some(c => c >= 3)) {
        console.error('Message loop detected:', recent);
        bus.publish('system.loop-detected', { sequence: recent });
      }

      setTimeout(() => this.stack.shift(), 1000);
    });
  }
}
```

### Async Race Conditions

**Problem**: Multiple overlapping async operations  
**Solution**: Request ID tracking

```javascript
class DataLoader extends HTMLElement {
  constructor() {
    super();
    this.requestId = 0;
  }

  async loadData(id) {
    const currentRequest = ++this.requestId;

    try {
      const data = await fetch(`/api/data/${id}`).then(r => r.json());

      // Only update if still the latest request
      if (currentRequest === this.requestId) {
        this.data = data;
        this.render();
      }
    } catch (error) {
      if (currentRequest === this.requestId) {
        this.showError(error);
      }
    }
  }
}
```

### Stale Closures

**Problem**: Handler captures old state  
**Solution**: Always access `this.state` directly

```javascript
// Bad
class BadCounter extends HTMLElement {
  connectedCallback() {
    const count = this.count; // Captured at registration time
    this.unsubscribe = bus.subscribe('log', () => {
      console.log(count); // Always logs initial value
    });
  }
}

// Good
class GoodCounter extends HTMLElement {
  connectedCallback() {
    this.unsubscribe = bus.subscribe('log', () => {
      console.log(this.count); // Always current value
    });
  }
}
```

## Debugging Checklist

When something goes wrong:

1. **Is the message being sent?**
   - Add `console.log()` before `publish()`
   - Check MessageTracer

2. **Is the topic correct?**
   - Use message constants
   - Check for typos

3. **Is the handler registered?**
   - Verify `subscribe()` is called
   - Check component is mounted

4. **Is the handler called?**
   - Add breakpoint or `console.log()`
   - Check wildcard patterns

5. **Is state updating?**
   - Log before/after changes
   - Check property names

6. **Is render triggered?**
   - Verify render method runs
   - Check for errors in render

7. **Are there async issues?**
   - Use request IDs
   - Check Promise handling

8. **Is there a loop?**
   - Use LoopDetector
   - Review message flow

## Component Reference

See **pan-debug** (Chapter 21) for browser-based debugging tools.

## Complete Example

```javascript
// Full error handling setup
class App extends HTMLElement {
  connectedCallback() {
    // Global error monitor
    const errorMonitor = document.createElement('error-monitor');
    document.body.appendChild(errorMonitor);

    // Message tracer (dev only)
    if (import.meta.env.DEV) {
      const tracer = document.createElement('message-tracer');
      tracer.startTracing();
      document.body.appendChild(tracer);
    }

    // Loop detector
    const loopDetector = document.createElement('loop-detector');
    document.body.appendChild(loopDetector);

    // Performance monitor
    const perfMonitor = document.createElement('performance-monitor');
    document.body.appendChild(perfMonitor);

    // Subscribe to errors
    this.unsubscribe = bus.subscribe('app.error', (msg) => {
      this.showErrorNotification(msg.data);
    });
  }

  showErrorNotification(error) {
    const notification = document.createElement('div');
    notification.className = 'error-notification';
    notification.textContent = error.message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 5000);
  }
}
```

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 14 (Error Handling & Debugging)
- **Components**: Chapter 21 (pan-debug)
- **Patterns**: Appendix E (Error patterns)
- **Related**: Chapter 12 (Performance), Chapter 13 (Testing)

## Common Issues

### Errors not caught
**Problem**: Errors in async code not handled  
**Solution**: Always use try-catch or `.catch()`, add global error handlers

### Missing stack traces
**Problem**: Error stack is lost  
**Solution**: Preserve `error.stack` when re-throwing or logging

### Too much logging in production
**Problem**: Console spam, performance impact  
**Solution**: Set log level to 'warn' or 'error' in production, use conditional logging

### Can't reproduce bug
**Problem**: Error only happens for some users  
**Solution**: Add user context to logs, enable remote error tracking (Sentry, LogRocket)

### Debug mode left on
**Problem**: Debug code in production  
**Solution**: Use environment variables, build-time dead code elimination
