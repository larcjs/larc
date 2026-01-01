# Testing Strategies

Quick reference for testing LARC applications. For detailed tutorials, see *Learning LARC* Chapter 14.

## Overview

Test LARC applications using unit tests for components, integration tests for message flows, and E2E tests for complete workflows. Message-driven architecture simplifies testing through decoupling and observable side effects.

**Key Concepts**:

- Testing pyramid: Many unit tests, some integration tests, few E2E tests
- Mock PAN bus for isolated component testing
- Test message flows between components
- Use fake timers for interval/timeout testing
- E2E tests verify complete user workflows in real browsers

## Quick Example

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { CounterButton } from '../components/counter-button.mjs';

describe('CounterButton', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('counter-button');
    document.body.appendChild(element);
  });

  it('should increment count when clicked', () => {
    const button = element.querySelector('button');
    
    expect(element.count).toBe(0);
    button.click();
    expect(element.count).toBe(1);
    button.click();
    expect(element.count).toBe(2);
  });
});
```

## Test Environment Setup

### Vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.js']
  }
});
```

### Test Setup

```javascript
// tests/setup.js
import { beforeEach, afterEach } from 'vitest';
import { MockBus } from './mocks/mock-bus.js';

let mockBus;

beforeEach(() => {
  mockBus = new MockBus();
  global.publish = mockBus.publish.bind(mockBus);
  global.subscribe = mockBus.subscribe.bind(mockBus);
});

afterEach(() => {
  mockBus.reset();
  document.body.innerHTML = '';
});

export function getMockBus() {
  return mockBus;
}
```

## Mock PAN Bus

```javascript
// tests/mocks/mock-bus.js
class MockBus {
  constructor() {
    this.subscriptions = new Map();
    this.published = [];
  }

  publish(topic, data) {
    this.published.push({ topic, data, timestamp: Date.now() });
    
    // Trigger subscriptions
    const handlers = this.subscriptions.get(topic) || [];
    handlers.forEach(handler => handler({ topic, data }));
    
    // Trigger wildcard subscriptions
    this.getWildcardHandlers(topic).forEach(handler => {
      handler({ topic, data });
    });
  }

  subscribe(pattern, handler) {
    if (!this.subscriptions.has(pattern)) {
      this.subscriptions.set(pattern, []);
    }
    
    this.subscriptions.get(pattern).push(handler);
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(pattern);
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    };
  }

  getWildcardHandlers(topic) {
    const handlers = [];
    for (const [pattern, patternHandlers] of this.subscriptions) {
      if (this.matchesPattern(topic, pattern)) {
        handlers.push(...patternHandlers);
      }
    }
    return handlers;
  }

  matchesPattern(topic, pattern) {
    if (pattern === '*') return true;
    if (pattern === topic) return false;
    
    const patternParts = pattern.split('.');
    const topicParts = topic.split('.');
    
    if (patternParts.length !== topicParts.length) return false;
    
    return patternParts.every((part, i) => 
      part === '*' || part === topicParts[i]
    );
  }

  reset() {
    this.subscriptions.clear();
    this.published = [];
  }

  // Test helpers
  getPublished(topic) {
    return this.published.filter(msg => msg.topic === topic);
  }

  getLastPublished(topic) {
    const messages = this.getPublished(topic);
    return messages[messages.length - 1];
  }

  wasPublished(topic, data) {
    return this.published.some(msg =>
      msg.topic === topic &&
      JSON.stringify(msg.data) === JSON.stringify(data)
    );
  }
}

export { MockBus };
```

## Unit Testing Patterns

| Pattern | Description | Example |
|---------|-------------|---------|
| Component creation | Create and mount component | `document.createElement('my-component')` |
| Attribute testing | Test attribute changes | `element.setAttribute('value', 'test')` |
| Event testing | Simulate user interactions | `button.click()` |
| Spy methods | Verify method calls | `vi.spyOn(element, 'method')` |
| Mock fetch | Stub network requests | `global.fetch = vi.fn()` |

### Testing Attributes

```javascript
it('should update when attributes change', () => {
  element.setAttribute('username', 'Alice');
  expect(element.textContent).toContain('Alice');
  
  element.setAttribute('username', 'Bob');
  expect(element.textContent).toContain('Bob');
  expect(element.textContent).not.toContain('Alice');
});
```

### Testing Message Publishing

```javascript
it('should publish notification', () => {
  const mockBus = getMockBus();
  
  element.showNotification('Hello');
  
  const published = mockBus.getLastPublished('notification.show');
  expect(published).toBeDefined();
  expect(published.data.message).toBe('Hello');
});
```

### Testing Message Subscriptions

```javascript
it('should update on message', () => {
  publish('data.updated', { value: 42 });
  
  expect(element.value).toBe(42);
  expect(element.textContent).toContain('42');
});
```

## Integration Testing

Test multiple components communicating via PAN bus:

```javascript
describe('Shopping Cart Integration', () => {
  let catalog, cart, badge;

  beforeEach(() => {
    catalog = document.createElement('product-catalog');
    cart = document.createElement('shopping-cart');
    badge = document.createElement('cart-badge');
    
    document.body.append(catalog, cart, badge);
  });

  it('should update cart and badge when product added', () => {
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Widget');
    expect(badge.itemCount).toBe(1);
  });

  it('should publish cart.updated message', () => {
    const mockBus = getMockBus();
    
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    const updated = mockBus.getLastPublished('cart.updated');
    expect(updated.data.items).toHaveLength(1);
    expect(updated.data.total).toBe(10);
  });
});
```

## Testing Async Operations

### Testing Promises

```javascript
it('should load data', async () => {
  global.fetch = vi.fn().mockResolvedValueOnce({
    json: async () => ({ items: [1, 2, 3] })
  });

  const element = document.createElement('data-loader');
  document.body.appendChild(element);

  await vi.waitFor(() => {
    const loaded = getMockBus().getLastPublished('data.loaded');
    expect(loaded).toBeDefined();
    expect(loaded.data.items).toEqual([1, 2, 3]);
  });
});
```

### Testing Errors

```javascript
it('should handle fetch errors', async () => {
  global.fetch = vi.fn().mockRejectedValueOnce(
    new Error('Network error')
  );

  const element = document.createElement('data-loader');
  document.body.appendChild(element);

  await new Promise(resolve => setTimeout(resolve, 0));

  const error = getMockBus().getLastPublished('data.error');
  expect(error.data.error).toBe('Network error');
});
```

### Testing Timers

```javascript
it('should save at intervals', () => {
  vi.useFakeTimers();
  
  const element = document.createElement('auto-saver');
  document.body.appendChild(element);

  vi.advanceTimersByTime(5000);
  expect(getMockBus().getPublished('data.save')).toHaveLength(1);

  vi.advanceTimersByTime(5000);
  expect(getMockBus().getPublished('data.save')).toHaveLength(2);

  vi.useRealTimers();
});
```

## E2E Testing with Playwright

### Setup

```bash
npm install -D @playwright/test
npx playwright install
```

### E2E Test Example

```javascript
// tests/e2e/shopping-cart.spec.js
import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should add item to cart', async ({ page }) => {
    await page.click('button:has-text("Add to Cart")');

    const badge = page.locator('cart-badge');
    await expect(badge).toContainText('1');

    const cart = page.locator('shopping-cart');
    await expect(cart).toContainText('Widget');
    await expect(cart).toContainText('$10');
  });

  test('should persist cart after reload', async ({ page }) => {
    await page.click('button:has-text("Add to Cart")');
    await page.reload();

    const cart = page.locator('shopping-cart');
    await expect(cart).toContainText('Widget');
  });
});
```

### Testing Theme Switching

```javascript
test('should toggle dark mode', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const html = page.locator('html');
  await expect(html).toHaveAttribute('data-theme', 'light');

  await page.click('button:has-text("Dark")');
  await expect(html).toHaveAttribute('data-theme', 'dark');

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'dark');
});
```

## Test Utilities

### Component Test Harness

```javascript
// tests/utils/component-harness.js
class ComponentHarness {
  constructor(tagName, attributes = {}) {
    this.element = document.createElement(tagName);
    
    for (const [key, value] of Object.entries(attributes)) {
      this.element.setAttribute(key, value);
    }
    
    document.body.appendChild(this.element);
  }

  query(selector) {
    return this.element.querySelector(selector);
  }

  text() {
    return this.element.textContent.trim();
  }

  click(selector) {
    const el = selector ? this.query(selector) : this.element;
    el.click();
    return this;
  }

  type(selector, value) {
    const input = this.query(selector);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return this;
  }

  async waitFor(condition, timeout = 1000) {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (condition(this.element)) return;
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    throw new Error('Timeout waiting for condition');
  }

  destroy() {
    this.element.remove();
  }
}

export { ComponentHarness };
```

**Usage**:
```javascript
const harness = new ComponentHarness('user-profile', { 'user-id': '123' });
await harness.waitFor(el => el.textContent.includes('Alice'));
expect(harness.text()).toContain('Alice');
harness.destroy();
```

### Message Helper

```javascript
// tests/utils/message-helper.js
class MessageHelper {
  constructor() {
    this.bus = getMockBus();
  }

  async publishAndWait(publishTopic, publishData, waitTopic, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for ${waitTopic}`));
      }, timeout);

      const unsubscribe = subscribe(waitTopic, (msg) => {
        clearTimeout(timeoutId);
        unsubscribe();
        resolve(msg.data);
      });

      publish(publishTopic, publishData);
    });
  }

  assertPublished(topic, data = null) {
    const messages = this.bus.getPublished(topic);
    
    if (messages.length === 0) {
      throw new Error(`Expected message on topic "${topic}"`);
    }
    
    if (data !== null) {
      const match = messages.some(msg =>
        JSON.stringify(msg.data) === JSON.stringify(data)
      );
      
      if (!match) {
        throw new Error(`Expected message with data ${JSON.stringify(data)}`);
      }
    }
  }
}

export { MessageHelper };
```

**Usage**:
```javascript
const helper = new MessageHelper();

const response = await helper.publishAndWait(
  'data.request',
  { id: 123 },
  'data.response'
);

expect(response.id).toBe(123);
helper.assertPublished('data.request', { id: 123 });
```

## Test Coverage

Run tests with coverage:

```bash
npm install -D @vitest/coverage-v8
npx vitest --coverage
```

**Coverage Targets**:

- Overall: 80%+
- Critical paths (auth, payments): 100%
- UI glue code: 50-70% acceptable

## Testing Checklist

| Area | Unit Tests | Integration Tests | E2E Tests |
|------|------------|-------------------|-----------|
| Components render correctly | ✓ | | |
| Attributes update DOM | ✓ | | |
| Messages published | ✓ | | |
| Messages received | ✓ | | |
| Multi-component flows | | ✓ | |
| Message patterns | | ✓ | |
| User workflows | | | ✓ |
| Persistence | | | ✓ |
| Theme switching | | | ✓ |

## Complete Example

```javascript
// Full test suite for notification system
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationDisplay } from '../components/notification-display.mjs';
import { NotificationService } from '../services/notification-service.mjs';
import { getMockBus } from './setup.js';

describe('Notification System', () => {
  let display, service, mockBus;

  beforeEach(() => {
    mockBus = getMockBus();
    
    display = document.createElement('notification-display');
    service = new NotificationService();
    
    document.body.appendChild(display);
  });

  it('should show notification', () => {
    service.show('Hello', 'info');

    expect(display.notifications).toHaveLength(1);
    expect(display.textContent).toContain('Hello');
  });

  it('should auto-dismiss after timeout', async () => {
    vi.useFakeTimers();
    
    service.show('Temporary', 'info', { duration: 3000 });
    
    expect(display.notifications).toHaveLength(1);
    
    vi.advanceTimersByTime(3000);
    
    await vi.waitFor(() => {
      expect(display.notifications).toHaveLength(0);
    });
    
    vi.useRealTimers();
  });

  it('should handle multiple notifications', () => {
    service.show('First', 'info');
    service.show('Second', 'warning');
    service.show('Third', 'error');

    expect(display.notifications).toHaveLength(3);
    expect(mockBus.getPublished('notification.show')).toHaveLength(3);
  });
});
```

## Component Reference

See Chapter 17 (pan-bus) for testing message patterns.

## Cross-References

- **Tutorial**: *Learning LARC* Chapter 14 (Testing)
- **Components**: Chapter 17 (pan-bus testing helpers)
- **Patterns**: Appendix E (Test patterns)
- **Related**: Chapter 12 (Performance), Chapter 14 (Debugging)

## Common Issues

### Tests failing intermittently
**Problem**: Race conditions in async tests  
**Solution**: Use `vi.waitFor()` or `await` properly, avoid fixed timeouts

### Mock bus not working
**Problem**: Components using global `publish`/`subscribe` before mock setup  
**Solution**: Import components after mock setup in `beforeEach`, use dynamic imports

### E2E tests timing out
**Problem**: Waiting for elements that never appear  
**Solution**: Use Playwright's auto-waiting, check network requests, verify app is running

### Coverage not including files
**Problem**: Files not imported by tests  
**Solution**: Add files to test suite or use coverage include patterns

### Memory leaks in tests
**Problem**: Components not cleaned up  
**Solution**: Always remove components in `afterEach`, clear timers with `vi.useRealTimers()`
