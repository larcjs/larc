# Testing

Testing isn't optional. It's how you know your code works, how you prevent regressions, and how you confidently refactor. LARC applications benefit from the same testing strategies as any JavaScript application, with some patterns specific to Web Components.

## Unit Testing Components

The `@open-wc/testing` library provides excellent utilities for testing Web Components:

```javascript
// user-card.test.js
import { expect, fixture, html } from '@open-wc/testing';
import '../components/user-card.js';

describe('UserCard', () => {
  it('renders user name and email', async () => {
    const el = await fixture(html`
      <user-card></user-card>
    `);

    el.user = { name: 'Alice', email: 'alice@example.com' };
    await el.updateComplete;

    const name = el.shadowRoot.querySelector('.name');
    const email = el.shadowRoot.querySelector('.email');

    expect(name.textContent).to.equal('Alice');
    expect(email.textContent).to.equal('alice@example.com');
  });

  it('dispatches follow event when button clicked', async () => {
    const el = await fixture(html`<user-card></user-card>`);
    el.user = { id: 1, name: 'Alice' };

    let eventDetail = null;
    el.addEventListener('follow', (e) => {
      eventDetail = e.detail;
    });

    el.shadowRoot.querySelector('.follow-btn').click();

    expect(eventDetail).to.deep.equal({ userId: 1 });
  });

  it('shows loading state initially', async () => {
    const el = await fixture(html`<user-card loading></user-card>`);

    const spinner = el.shadowRoot.querySelector('.spinner');
    expect(spinner).to.exist;
  });
});
```

## Testing PAN Bus Integration

Mock the PAN bus to test component communication:

```javascript
// pan-mock.js
class MockPanBus {
  constructor() {
    this.messages = [];
    this.subscriptions = new Map();
  }

  publish(topic, data) {
    this.messages.push({ topic, data });
    const handlers = this.subscriptions.get(topic) || [];
    handlers.forEach(handler => handler(data));
  }

  subscribe(topic, handler) {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, []);
    }
    this.subscriptions.get(topic).push(handler);
    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic, handler) {
    const handlers = this.subscriptions.get(topic) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) handlers.splice(index, 1);
  }

  clear() {
    this.messages = [];
    this.subscriptions.clear();
  }
}

export const mockPan = new MockPanBus();
```

Use it in tests:

```javascript
import { mockPan } from './pan-mock.js';

describe('NotificationList', () => {
  beforeEach(() => mockPan.clear());

  it('displays notifications from PAN bus', async () => {
    const el = await fixture(html`<notification-list></notification-list>`);

    mockPan.publish('notification.new', {
      id: 1,
      message: 'Hello world'
    });

    await el.updateComplete;

    const notifications = el.shadowRoot.querySelectorAll('.notification');
    expect(notifications.length).to.equal(1);
    expect(notifications[0].textContent).to.include('Hello world');
  });
});
```

## Integration Testing

Test components working together:

```javascript
describe('Shopping Cart Integration', () => {
  it('updates cart when product added', async () => {
    const cart = await fixture(html`<shopping-cart></shopping-cart>`);
    const product = await fixture(html`
      <product-card .product=${{ id: 1, name: 'Widget', price: 10 }}>
      </product-card>
    `);

    // Simulate add to cart
    product.shadowRoot.querySelector('.add-btn').click();

    await cart.updateComplete;

    expect(cart.items.length).to.equal(1);
    expect(cart.total).to.equal(10);
  });
});
```

## End-to-End Testing with Playwright

For full user flow testing, Playwright provides excellent browser automation:

```javascript
// e2e/login.spec.js
import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test('successful login redirects to dashboard', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'user@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toHaveText('Dashboard');
  });

  test('invalid credentials show error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    await expect(page.locator('.error')).toHaveText('Invalid credentials');
    await expect(page).toHaveURL('/login');
  });
});
```

## Mocking Fetch Requests

Control network responses in tests:

```javascript
// fetch-mock.js
class FetchMock {
  constructor() {
    this.mocks = new Map();
    this.originalFetch = window.fetch;
  }

  mock(url, response, options = {}) {
    this.mocks.set(url, { response, options });
  }

  enable() {
    window.fetch = async (url, config) => {
      const mock = this.mocks.get(url);
      if (mock) {
        if (mock.options.delay) {
          await new Promise(r => setTimeout(r, mock.options.delay));
        }
        return new Response(JSON.stringify(mock.response), {
          status: mock.options.status || 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return this.originalFetch(url, config);
    };
  }

  disable() {
    window.fetch = this.originalFetch;
    this.mocks.clear();
  }
}

export const fetchMock = new FetchMock();
```
