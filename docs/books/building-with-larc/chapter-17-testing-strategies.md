# Testing Strategies

> "Testing shows the presence, not the absence of bugs. But not testing shows the presence of unemployment."
>
> — Edsger W. Dijkstra (with career advice added)

Testing is the art of proving your code works before users prove it doesn't. It's insurance against regressions, documentation that stays up-to-date, and confidence that your refactoring didn't break everything.

In this chapter, we'll explore testing strategies for LARC applications: unit testing web components, integration testing message flows, end-to-end testing with complete PAN applications, mocking the message bus, testing async operations, and building test utilities that make testing a joy rather than a chore.

By the end of this chapter, you'll have a comprehensive testing strategy that catches bugs early, runs fast, and doesn't make you want to skip writing tests.

## The Testing Pyramid for LARC

The testing pyramid guides our testing strategy:

```
           /\
          /  \        E2E Tests (Few)
         /____\       - Full application
        /      \      - Real browser
       /        \     - Slow, brittle
      /----------\
     /            \   Integration Tests (Some)
    /              \  - Multiple components
   /                \ - Message flows
  /------------------\- Medium speed
 /                    \
/______________________\ Unit Tests (Many)

    - Single components
    - Pure functions
    - Fast, focused
```

Most tests should be unit tests. Fewer integration tests. Even fewer E2E tests.

## Unit Testing Components

Unit tests verify individual components in isolation. Let's use Vitest (modern, fast) or Mocha (classic, reliable).

### Setting Up Vitest

```bash
npm install -D vitest happy-dom
```

Create a test configuration:

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

Create test setup:

```javascript
// tests/setup.js

import { beforeEach, afterEach } from 'vitest';

// Clean up DOM after each test
afterEach(() => {
  document.body.innerHTML = '';
});
```

### Testing a Simple Component

Let's test a counter component:

```javascript
// components/counter-button.mjs

class CounterButton extends HTMLElement {
  constructor() {
    super();
    this.count = 0;
  }

  connectedCallback() {
    this.render();
  }

  increment() {
    this.count++;
    this.render();
  }

  render() {
    this.innerHTML = `
      <button id="increment">
        Count: ${this.count}
      </button>
    `;

    this.querySelector('#increment').addEventListener('click', () => {
      this.increment();
    });
  }
}

customElements.define('counter-button', CounterButton);

export { CounterButton };
```

Test it:

```javascript
// tests/counter-button.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { CounterButton } from '../components/counter-button.mjs';

describe('CounterButton', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('counter-button');
    document.body.appendChild(element);
  });

  it('should render with initial count of 0', () => {
    expect(element.count).toBe(0);
    expect(element.textContent).toContain('Count: 0');
  });

  it('should increment count when button is clicked', () => {
    const button = element.querySelector('button');

    button.click();
    expect(element.count).toBe(1);
    expect(element.textContent).toContain('Count: 1');

    button.click();
    expect(element.count).toBe(2);
    expect(element.textContent).toContain('Count: 2');
  });

  it('should call increment method when clicked', () => {
    const incrementSpy = vi.spyOn(element, 'increment');
    const button = element.querySelector('button');

    button.click();

    expect(incrementSpy).toHaveBeenCalledTimes(1);
  });
});
```

Run tests:

```bash
npm test
```

### Testing Components with Attributes

```javascript
// components/user-badge.mjs

class UserBadge extends HTMLElement {
  static get observedAttributes() {
    return ['username', 'role'];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const username = this.getAttribute('username') || 'Anonymous';
    const role = this.getAttribute('role') || 'User';

    this.innerHTML = `
      <div class="user-badge">
        <span class="username">${username}</span>
        <span class="role">${role}</span>
      </div>
    `;
  }
}

customElements.define('user-badge', UserBadge);
export { UserBadge };
```

Test it:

```javascript
// tests/user-badge.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { UserBadge } from '../components/user-badge.mjs';

describe('UserBadge', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('user-badge');
    document.body.appendChild(element);
  });

  it('should render with default values', () => {
    expect(element.textContent).toContain('Anonymous');
    expect(element.textContent).toContain('User');
  });

  it('should render with provided attributes', () => {
    element.setAttribute('username', 'Alice');
    element.setAttribute('role', 'Admin');

    expect(element.textContent).toContain('Alice');
    expect(element.textContent).toContain('Admin');
  });

  it('should update when attributes change', () => {
    element.setAttribute('username', 'Bob');
    expect(element.textContent).toContain('Bob');

    element.setAttribute('username', 'Charlie');
    expect(element.textContent).toContain('Charlie');
    expect(element.textContent).not.toContain('Bob');
  });

  it('should have correct CSS classes', () => {
    element.setAttribute('username', 'Alice');

    const badge = element.querySelector('.user-badge');
    const username = element.querySelector('.username');
    const role = element.querySelector('.role');

    expect(badge).not.toBeNull();
    expect(username).not.toBeNull();
    expect(role).not.toBeNull();
  });
});
```

## Mocking the PAN Bus

Testing message-driven components requires mocking the message bus.

### Creating a Mock Bus

```javascript
// tests/mocks/mock-bus.js

class MockBus {
  constructor() {
    this.subscriptions = new Map();
    this.published = [];
  }

  // Mock publish function
  publish(topic, data) {
    this.published.push({ topic, data, timestamp: Date.now() });

    // Trigger subscriptions
    const handlers = this.subscriptions.get(topic) || [];
    handlers.forEach(handler => {
      handler({ topic, data });
    });

    // Trigger wildcard subscriptions
    const wildcardHandlers = this.getWildcardHandlers(topic);
    wildcardHandlers.forEach(handler => {
      handler({ topic, data });
    });
  }

  // Mock subscribe function
  subscribe(pattern, handler) {
    if (!this.subscriptions.has(pattern)) {
      this.subscriptions.set(pattern, []);
    }

    this.subscriptions.get(pattern).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(pattern);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    };
  }

  // Get handlers for wildcard patterns
  getWildcardHandlers(topic) {
    const handlers = [];

    for (const [pattern, patternHandlers] of this.subscriptions) {
      if (this.matchesPattern(topic, pattern)) {
        handlers.push(...patternHandlers);
      }
    }

    return handlers;
  }

  // Simple wildcard matching
  matchesPattern(topic, pattern) {
    if (pattern === '*') return true;
    if (pattern === topic) return false; // Exact match handled separately

    const patternParts = pattern.split('.');
    const topicParts = topic.split('.');

    if (patternParts.length !== topicParts.length) {
      return false;
    }

    return patternParts.every((part, i) => {
      return part === '*' || part === topicParts[i];
    });
  }

  // Reset the bus
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

### Using the Mock Bus

```javascript
// tests/setup.js

import { beforeEach, afterEach } from 'vitest';
import { MockBus } from './mocks/mock-bus.js';

let mockBus;

beforeEach(() => {
  mockBus = new MockBus();

  // Replace global publish and subscribe
  global.publish = mockBus.publish.bind(mockBus);
  global.subscribe = mockBus.subscribe.bind(mockBus);
});

afterEach(() => {
  mockBus.reset();
  document.body.innerHTML = '';
});

// Export for use in tests
export function getMockBus() {
  return mockBus;
}
```

### Testing Message-Driven Components

```javascript
// components/notification-display.mjs

import { subscribe } from '../pan.js';

class NotificationDisplay extends HTMLElement {
  constructor() {
    super();
    this.notifications = [];
  }

  connectedCallback() {
    this.unsubscribe = subscribe('notification.show', (msg) => {
      this.addNotification(msg.data);
    });

    this.render();
  }

  addNotification(notification) {
    this.notifications.push(notification);
    this.render();
  }

  render() {
    this.innerHTML = `
      <div class="notifications">
        ${this.notifications.map(n => `
          <div class="notification notification-${n.type}">
            ${n.message}
          </div>
        `).join('')}
      </div>
    `;
  }

  disconnectedCallback() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}

customElements.define('notification-display', NotificationDisplay);
export { NotificationDisplay };
```

Test it:

```javascript
// tests/notification-display.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { NotificationDisplay } from '../components/notification-display.mjs';
import { getMockBus } from './setup.js';

describe('NotificationDisplay', () => {
  let element;
  let mockBus;

  beforeEach(() => {
    mockBus = getMockBus();
    element = document.createElement('notification-display');
    document.body.appendChild(element);
  });

  it('should start with no notifications', () => {
    expect(element.notifications).toHaveLength(0);
    expect(element.querySelector('.notification')).toBeNull();
  });

  it('should display notification when message is published', () => {
    publish('notification.show', {
      type: 'info',
      message: 'Hello, World!'
    });

    expect(element.notifications).toHaveLength(1);
    expect(element.textContent).toContain('Hello, World!');
    expect(element.querySelector('.notification-info')).not.toBeNull();
  });

  it('should display multiple notifications', () => {
    publish('notification.show', { type: 'info', message: 'First' });
    publish('notification.show', { type: 'warning', message: 'Second' });
    publish('notification.show', { type: 'error', message: 'Third' });

    expect(element.notifications).toHaveLength(3);
    expect(element.textContent).toContain('First');
    expect(element.textContent).toContain('Second');
    expect(element.textContent).toContain('Third');
  });

  it('should unsubscribe when disconnected', () => {
    element.remove();

    // Publish after removal
    publish('notification.show', { type: 'info', message: 'After removal' });

    // Should not have been added
    expect(element.notifications).toHaveLength(0);
  });
});
```

## Integration Testing Message Flows

Integration tests verify multiple components working together through message flows.

```javascript
// tests/integration/shopping-cart.test.js

import { describe, it, expect, beforeEach } from 'vitest';
import { ProductCatalog } from '../../components/product-catalog.mjs';
import { ShoppingCart } from '../../components/shopping-cart.mjs';
import { CartBadge } from '../../components/cart-badge.mjs';
import { getMockBus } from '../setup.js';

describe('Shopping Cart Integration', () => {
  let catalog;
  let cart;
  let badge;
  let mockBus;

  beforeEach(() => {
    mockBus = getMockBus();

    // Create components
    catalog = document.createElement('product-catalog');
    cart = document.createElement('shopping-cart');
    badge = document.createElement('cart-badge');

    // Add to DOM
    document.body.appendChild(catalog);
    document.body.appendChild(cart);
    document.body.appendChild(badge);
  });

  it('should update cart and badge when product is added', () => {
    // Simulate adding product
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    // Cart should contain the item
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].name).toBe('Widget');

    // Badge should show count
    expect(badge.itemCount).toBe(1);
    expect(badge.textContent).toContain('1');
  });

  it('should publish cart.updated when item is added', () => {
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    // Verify cart.updated was published
    const updated = mockBus.getLastPublished('cart.updated');
    expect(updated).not.toBeUndefined();
    expect(updated.data.items).toHaveLength(1);
    expect(updated.data.total).toBe(10);
  });

  it('should handle multiple items', () => {
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 2
    });

    publish('cart.item.added', {
      productId: 2,
      name: 'Gadget',
      price: 20,
      quantity: 1
    });

    expect(cart.items).toHaveLength(2);
    expect(badge.itemCount).toBe(3); // 2 widgets + 1 gadget
  });

  it('should update quantities for duplicate items', () => {
    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    publish('cart.item.added', {
      productId: 1,
      name: 'Widget',
      price: 10,
      quantity: 1
    });

    // Should have one item with quantity 2
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(2);
  });
});
```

## Testing Async Operations

Many LARC operations are async. Test them properly.

### Testing Promises

```javascript
// components/data-loader.mjs

import { publish } from '../pan.js';

class DataLoader extends HTMLElement {
  async connectedCallback() {
    try {
      publish('data.loading', { loading: true });

      const response = await fetch('/api/data');
      const data = await response.json();

      publish('data.loaded', { data });
    } catch (error) {
      publish('data.error', { error: error.message });
    } finally {
      publish('data.loading', { loading: false });
    }
  }
}

customElements.define('data-loader', DataLoader);
export { DataLoader };
```

Test it:

```javascript
// tests/data-loader.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataLoader } from '../components/data-loader.mjs';
import { getMockBus } from './setup.js';

describe('DataLoader', () => {
  let mockBus;

  beforeEach(() => {
    mockBus = getMockBus();

    // Mock fetch
    global.fetch = vi.fn();
  });

  it('should publish loading state', async () => {
    fetch.mockResolvedValueOnce({
      json: async () => ({ items: [] })
    });

    const element = document.createElement('data-loader');
    document.body.appendChild(element);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    // Check loading messages
    const loadingMessages = mockBus.getPublished('data.loading');
    expect(loadingMessages).toHaveLength(2);
    expect(loadingMessages[0].data.loading).toBe(true);
    expect(loadingMessages[1].data.loading).toBe(false);
  });

  it('should publish data when loaded successfully', async () => {
    const mockData = { items: [1, 2, 3] };

    fetch.mockResolvedValueOnce({
      json: async () => mockData
    });

    const element = document.createElement('data-loader');
    document.body.appendChild(element);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const loaded = mockBus.getLastPublished('data.loaded');
    expect(loaded).not.toBeUndefined();
    expect(loaded.data.data).toEqual(mockData);
  });

  it('should publish error when fetch fails', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const element = document.createElement('data-loader');
    document.body.appendChild(element);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 0));

    const error = mockBus.getLastPublished('data.error');
    expect(error).not.toBeUndefined();
    expect(error.data.error).toBe('Network error');
  });
});
```

### Testing with Async/Await

Use async/await in tests:

```javascript
it('should load data', async () => {
  fetch.mockResolvedValueOnce({
    json: async () => ({ data: 'test' })
  });

  const element = document.createElement('data-loader');
  document.body.appendChild(element);

  // Wait for component to finish loading
  await vi.waitFor(() => {
    expect(mockBus.wasPublished('data.loaded', { data: { data: 'test' } })).toBe(true);
  });
});
```

### Testing Timeouts and Intervals

```javascript
// components/auto-saver.mjs

import { subscribe } from '../pan.js';

class AutoSaver extends HTMLElement {
  constructor() {
    super();
    this.saveInterval = 5000; // 5 seconds
    this.intervalId = null;
  }

  connectedCallback() {
    this.intervalId = setInterval(() => {
      publish('data.save', { timestamp: Date.now() });
    }, this.saveInterval);
  }

  disconnectedCallback() {
    clearInterval(this.intervalId);
  }
}

customElements.define('auto-saver', AutoSaver);
export { AutoSaver };
```

Test it:

```javascript
// tests/auto-saver.test.js

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AutoSaver } from '../components/auto-saver.mjs';
import { getMockBus } from './setup.js';

describe('AutoSaver', () => {
  let mockBus;

  beforeEach(() => {
    mockBus = getMockBus();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should save at regular intervals', () => {
    const element = document.createElement('auto-saver');
    document.body.appendChild(element);

    // Fast-forward 5 seconds
    vi.advanceTimersByTime(5000);
    expect(mockBus.getPublished('data.save')).toHaveLength(1);

    // Fast-forward another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(mockBus.getPublished('data.save')).toHaveLength(2);

    // Fast-forward another 5 seconds
    vi.advanceTimersByTime(5000);
    expect(mockBus.getPublished('data.save')).toHaveLength(3);
  });

  it('should stop saving when disconnected', () => {
    const element = document.createElement('auto-saver');
    document.body.appendChild(element);

    vi.advanceTimersByTime(5000);
    expect(mockBus.getPublished('data.save')).toHaveLength(1);

    element.remove();

    // Should not save after removal
    vi.advanceTimersByTime(5000);
    expect(mockBus.getPublished('data.save')).toHaveLength(1);
  });
});
```

## End-to-End Testing

E2E tests verify the entire application in a real browser. Use Playwright or Cypress.

### Setting Up Playwright

```bash
npm install -D @playwright/test
npx playwright install
```

Create a test:

```javascript
// tests/e2e/shopping-cart.spec.js

import { test, expect } from '@playwright/test';

test.describe('Shopping Cart', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should add item to cart', async ({ page }) => {
    // Click add to cart button
    await page.click('button:has-text("Add to Cart")');

    // Verify cart badge updates
    const badge = page.locator('cart-badge');
    await expect(badge).toContainText('1');

    // Verify cart displays item
    const cart = page.locator('shopping-cart');
    await expect(cart).toContainText('Widget');
    await expect(cart).toContainText('$10');
  });

  test('should calculate total correctly', async ({ page }) => {
    // Add multiple items
    await page.click('button:has-text("Add to Cart")').first();
    await page.click('button:has-text("Add to Cart")').nth(1);

    // Verify total
    const cart = page.locator('shopping-cart');
    await expect(cart).toContainText('Total: $30');
  });

  test('should persist cart across page reloads', async ({ page }) => {
    // Add item to cart
    await page.click('button:has-text("Add to Cart")');

    // Reload page
    await page.reload();

    // Verify cart still has item
    const cart = page.locator('shopping-cart');
    await expect(cart).toContainText('Widget');
  });
});
```

Run E2E tests:

```bash
npx playwright test
```

### Testing Theme Switching

```javascript
// tests/e2e/theme.spec.js

import { test, expect } from '@playwright/test';

test.describe('Theme Switching', () => {
  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check initial theme
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'light');

    // Click dark mode button
    await page.click('button:has-text("Dark")');

    // Verify theme changed
    await expect(html).toHaveAttribute('data-theme', 'dark');

    // Verify styles applied
    const body = page.locator('body');
    const bgColor = await body.evaluate(el =>
      getComputedStyle(el).backgroundColor
    );
    expect(bgColor).toBe('rgb(17, 24, 39)'); // Dark background
  });

  test('should persist theme preference', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Switch to dark mode
    await page.click('button:has-text("Dark")');

    // Reload page
    await page.reload();

    // Verify theme persisted
    const html = page.locator('html');
    await expect(html).toHaveAttribute('data-theme', 'dark');
  });
});
```

## Test Utilities and Helpers

Build reusable utilities to make testing easier.

### Component Test Harness

```javascript
// tests/utils/component-harness.js

class ComponentHarness {
  constructor(tagName, attributes = {}) {
    this.element = document.createElement(tagName);

    // Set attributes
    for (const [key, value] of Object.entries(attributes)) {
      this.element.setAttribute(key, value);
    }

    document.body.appendChild(this.element);
  }

  // Query within component
  query(selector) {
    return this.element.querySelector(selector);
  }

  queryAll(selector) {
    return this.element.querySelectorAll(selector);
  }

  // Get text content
  text() {
    return this.element.textContent.trim();
  }

  // Click element
  click(selector) {
    const el = selector ? this.query(selector) : this.element;
    el.click();
    return this;
  }

  // Type into input
  type(selector, value) {
    const input = this.query(selector);
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return this;
  }

  // Wait for condition
  async waitFor(condition, timeout = 1000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      if (condition(this.element)) {
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    throw new Error('Timeout waiting for condition');
  }

  // Clean up
  destroy() {
    this.element.remove();
  }
}

export { ComponentHarness };
```

Use it:

```javascript
// tests/user-profile.test.js

import { describe, it, expect } from 'vitest';
import { ComponentHarness } from './utils/component-harness.js';
import { UserProfile } from '../components/user-profile.mjs';

describe('UserProfile', () => {
  it('should display user information', async () => {
    const harness = new ComponentHarness('user-profile', {
      'user-id': '123'
    });

    // Publish user data
    publish('user.data', {
      userId: '123',
      name: 'Alice',
      email: 'alice@example.com'
    });

    // Wait for render
    await harness.waitFor(el => el.textContent.includes('Alice'));

    expect(harness.text()).toContain('Alice');
    expect(harness.text()).toContain('alice@example.com');

    harness.destroy();
  });
});
```

### Message Bus Test Helper

```javascript
// tests/utils/message-helper.js

import { getMockBus } from '../setup.js';

class MessageHelper {
  constructor() {
    this.bus = getMockBus();
  }

  // Publish and wait for response
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

  // Wait for specific message
  async waitForMessage(topic, predicate = null, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe();
        reject(new Error(`Timeout waiting for ${topic}`));
      }, timeout);

      const unsubscribe = subscribe(topic, (msg) => {
        if (!predicate || predicate(msg.data)) {
          clearTimeout(timeoutId);
          unsubscribe();
          resolve(msg.data);
        }
      });
    });
  }

  // Assert message was published
  assertPublished(topic, data = null) {
    const messages = this.bus.getPublished(topic);

    if (messages.length === 0) {
      throw new Error(`Expected message on topic "${topic}" but none were published`);
    }

    if (data !== null) {
      const match = messages.some(msg =>
        JSON.stringify(msg.data) === JSON.stringify(data)
      );

      if (!match) {
        throw new Error(
          `Expected message on topic "${topic}" with data ${JSON.stringify(data)} ` +
          `but received: ${JSON.stringify(messages.map(m => m.data))}`
        );
      }
    }
  }

  // Assert message was NOT published
  assertNotPublished(topic) {
    const messages = this.bus.getPublished(topic);

    if (messages.length > 0) {
      throw new Error(
        `Expected no messages on topic "${topic}" but ${messages.length} were published`
      );
    }
  }
}

export { MessageHelper };
```

Use it:

```javascript
import { MessageHelper } from './utils/message-helper.js';

it('should respond to data request', async () => {
  const helper = new MessageHelper();

  const element = document.createElement('data-provider');
  document.body.appendChild(element);

  // Publish request and wait for response
  const response = await helper.publishAndWait(
    'data.request',
    { id: 123 },
    'data.response'
  );

  expect(response.id).toBe(123);
  expect(response.data).toBeDefined();
});
```

## Test Coverage

Measure test coverage to identify untested code:

```bash
npm install -D @vitest/coverage-v8
```

Run with coverage:

```bash
npx vitest --coverage
```

Aim for:

- **80%+ overall coverage**
- **100% coverage for critical paths** (auth, payments, data loss scenarios)
- **Lower coverage for UI glue code** (it's okay)

## Wrapping Up

Testing LARC applications is straightforward once you understand the patterns:

1. **Unit tests**: Test components in isolation, mock the message bus
2. **Integration tests**: Test message flows between components
3. **E2E tests**: Test the full application in a real browser
4. **Mock the bus**: Use MockBus for predictable, fast tests
5. **Test async operations**: Use async/await and fake timers
6. **Build utilities**: Create harnesses and helpers to simplify testing

The key insight: message-driven architecture makes testing easier, not harder. Components are decoupled, dependencies are explicit (subscriptions), and side effects are observable (publications).

Write tests. Run them often. Trust them completely. And when a test fails, thank it for catching a bug before your users did.

You've now completed a comprehensive tour of LARC development: theming and styling for beautiful UIs, performance optimization for fast applications, and testing strategies for reliable software. You have all the tools to build production-ready LARC applications.

Now go forth and build something amazing. And remember: untested code is legacy code the moment you write it.
