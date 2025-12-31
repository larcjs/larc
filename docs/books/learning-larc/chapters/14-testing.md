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

Use in tests:

```javascript
import { fetchMock } from './fetch-mock.js';

describe('UserList Component', () => {
  beforeEach(() => {
    fetchMock.enable();
    fetchMock.mock('/api/users', [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' }
    ]);
  });

  afterEach(() => {
    fetchMock.disable();
  });

  it('loads and displays users', async () => {
    const el = await fixture(html`<user-list></user-list>`);
    await el.updateComplete;

    const users = el.shadowRoot.querySelectorAll('.user');
    expect(users.length).to.equal(2);
  });
});
```

## Visual Regression Testing

Catch visual changes with screenshot comparison:

```javascript
// visual.test.js
import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('button should match snapshot', async ({ page }) => {
    await page.goto('/components/button');

    const button = page.locator('app-button');
    await expect(button).toHaveScreenshot('button-default.png');
  });

  test('button hover state', async ({ page }) => {
    await page.goto('/components/button');

    const button = page.locator('app-button');
    await button.hover();
    await expect(button).toHaveScreenshot('button-hover.png');
  });

  test('dark mode theme', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-theme-toggle]').click();

    await expect(page).toHaveScreenshot('homepage-dark.png', {
      fullPage: true
    });
  });
});
```

Run visual tests:

```bash
# First run creates baseline screenshots
npx playwright test visual.test.js

# Subsequent runs compare against baseline
npx playwright test visual.test.js

# Update baselines when changes are intentional
npx playwright test visual.test.js --update-snapshots
```

## Test Coverage

Track which code is tested:

```javascript
// web-test-runner.config.js
export default {
  coverage: true,
  coverageConfig: {
    threshold: {
      statements: 80,
      branches: 75,
      functions: 80,
      lines: 80
    },
    include: ['src/**/*.js'],
    exclude: ['src/**/*.test.js', 'src/test/**']
  }
};
```

Generate coverage reports:

```bash
npx wtr --coverage

# View HTML report
open coverage/index.html
```

### What to Test

Focus on:
- **Public API** - Methods users will call
- **Edge cases** - Empty inputs, null values, errors
- **State changes** - Component updates correctly
- **User interactions** - Clicks, typing, form submission
- **Integration points** - Component communication

Skip testing:
- **Framework internals** - Trust Web Components API
- **Third-party libraries** - They have their own tests
- **Trivial code** - Simple getters/setters

## Component Testing Patterns

### Testing Async Loading

```javascript
it('shows loading state then data', async () => {
  const el = await fixture(html`<user-profile user-id="1"></user-profile>`);

  // Should show loading initially
  expect(el.shadowRoot.querySelector('.loading')).to.exist;

  // Wait for data
  await waitUntil(() => !el.loading);

  // Should show user data
  expect(el.shadowRoot.querySelector('.user-name')).to.have.text('Alice');
  expect(el.shadowRoot.querySelector('.loading')).to.not.exist;
});
```

### Testing Error States

```javascript
it('displays error message on fetch failure', async () => {
  fetchMock.mock('/api/users', { error: 'Server error' }, { status: 500 });

  const el = await fixture(html`<user-list></user-list>`);
  await el.updateComplete;

  expect(el.shadowRoot.querySelector('.error')).to.have.text('Failed to load users');
});
```

### Testing Form Validation

```javascript
it('validates email format', async () => {
  const el = await fixture(html`<login-form></login-form>`);

  const emailInput = el.shadowRoot.querySelector('#email');
  const form = el.shadowRoot.querySelector('form');

  // Invalid email
  emailInput.value = 'notanemail';
  emailInput.dispatchEvent(new Event('input'));

  expect(el.errors.email).to.equal('Invalid email format');

  // Valid email
  emailInput.value = 'user@example.com';
  emailInput.dispatchEvent(new Event('input'));

  expect(el.errors.email).to.be.undefined;
});
```

### Testing Component Communication

```javascript
it('publishes event on button click', async () => {
  const el = await fixture(html`<add-todo></add-todo>`);

  let publishedData = null;
  mockPan.subscribe('todo.added', (msg) => {
    publishedData = msg.data;
  });

  el.shadowRoot.querySelector('#todo-input').value = 'Buy milk';
  el.shadowRoot.querySelector('button').click();

  expect(publishedData).to.deep.equal({ text: 'Buy milk' });
});
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm test

      - name: Run E2E tests
        run: npx playwright test

      - name: Upload test results
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - report

test:
  stage: test
  image: node:18
  cache:
    paths:
      - node_modules/
  script:
    - npm ci
    - npm test
    - npx playwright test
  artifacts:
    when: always
    paths:
      - coverage/
      - test-results/
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

coverage:
  stage: report
  image: node:18
  script:
    - npx nyc report --reporter=text-summary
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
```

## Test-Driven Development (TDD)

Write tests first, then implement:

### Example: Building a Counter Component

**Step 1: Write the test**

```javascript
// counter.test.js
describe('Counter', () => {
  it('starts at zero', async () => {
    const counter = await fixture(html`<app-counter></app-counter>`);
    expect(counter.shadowRoot.querySelector('.count').textContent).to.equal('0');
  });

  it('increments when plus button clicked', async () => {
    const counter = await fixture(html`<app-counter></app-counter>`);

    counter.shadowRoot.querySelector('.plus-btn').click();
    await counter.updateComplete;

    expect(counter.shadowRoot.querySelector('.count').textContent).to.equal('1');
  });

  it('decrements when minus button clicked', async () => {
    const counter = await fixture(html`<app-counter></app-counter>`);

    counter.shadowRoot.querySelector('.plus-btn').click();
    await counter.updateComplete;

    counter.shadowRoot.querySelector('.minus-btn').click();
    await counter.updateComplete;

    expect(counter.shadowRoot.querySelector('.count').textContent).to.equal('0');
  });

  it('never goes below zero', async () => {
    const counter = await fixture(html`<app-counter></app-counter>`);

    counter.shadowRoot.querySelector('.minus-btn').click();
    await counter.updateComplete;

    expect(counter.shadowRoot.querySelector('.count').textContent).to.equal('0');
  });
});
```

**Step 2: Run tests (they fail)**

```bash
npx wtr
# All tests fail - component doesn't exist yet
```

**Step 3: Implement minimal code**

```javascript
// counter.js
class Counter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.count = 0;
  }

  connectedCallback() {
    this.render();
  }

  increment() {
    this.count++;
    this.render();
  }

  decrement() {
    if (this.count > 0) {
      this.count--;
      this.render();
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <div>
        <button class="minus-btn">-</button>
        <span class="count">${this.count}</span>
        <button class="plus-btn">+</button>
      </div>
    `;

    this.shadowRoot.querySelector('.plus-btn').addEventListener('click', () => this.increment());
    this.shadowRoot.querySelector('.minus-btn').addEventListener('click', () => this.decrement());
  }

  get updateComplete() {
    return Promise.resolve();
  }
}

customElements.define('app-counter', Counter);
```

**Step 4: Run tests (they pass)**

```bash
npx wtr
# All tests pass!
```

**Step 5: Refactor with confidence**

Tests ensure refactoring doesn't break functionality.

## Advanced Testing Patterns

### Testing Custom Events

```javascript
it('dispatches custom event with detail', async () => {
  const el = await fixture(html`<product-card></product-card>`);

  let eventDetail = null;
  el.addEventListener('add-to-cart', (e) => {
    eventDetail = e.detail;
  });

  el.shadowRoot.querySelector('.add-btn').click();

  expect(eventDetail).to.deep.equal({
    productId: 123,
    quantity: 1
  });
});
```

### Testing Slots

```javascript
it('renders slotted content', async () => {
  const el = await fixture(html`
    <card-component>
      <h2 slot="title">My Title</h2>
      <p>My content</p>
    </card-component>
  `);

  const title = el.shadowRoot.querySelector('slot[name="title"]');
  const assignedNodes = title.assignedNodes();

  expect(assignedNodes[0].textContent).to.equal('My Title');
});
```

### Testing Accessibility

```javascript
import { expect } from '@open-wc/testing';

it('is accessible', async () => {
  const el = await fixture(html`<my-button>Click me</my-button>`);

  await expect(el).to.be.accessible();
});

it('has correct ARIA attributes', async () => {
  const el = await fixture(html`<dialog-box></dialog-box>`);

  const dialog = el.shadowRoot.querySelector('[role="dialog"]');
  expect(dialog).to.have.attribute('aria-modal', 'true');
  expect(dialog).to.have.attribute('aria-labelledby');
});
```

### Testing Keyboard Navigation

```javascript
it('navigates with arrow keys', async () => {
  const el = await fixture(html`
    <tab-panel>
      <tab-item>Tab 1</tab-item>
      <tab-item>Tab 2</tab-item>
      <tab-item>Tab 3</tab-item>
    </tab-panel>
  `);

  const tabs = el.shadowRoot.querySelectorAll('tab-item');

  // Focus first tab
  tabs[0].focus();

  // Press arrow right
  tabs[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));

  expect(document.activeElement).to.equal(tabs[1]);
});
```

## Performance Testing

Test component performance:

```javascript
it('renders large list efficiently', async () => {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`
  }));

  const startTime = performance.now();

  const el = await fixture(html`<virtual-list .items=${items}></virtual-list>`);
  await el.updateComplete;

  const renderTime = performance.now() - startTime;

  // Should render in under 100ms
  expect(renderTime).to.be.lessThan(100);

  // Should only render visible items
  const renderedItems = el.shadowRoot.querySelectorAll('.item');
  expect(renderedItems.length).to.be.lessThan(50);
});
```

## Troubleshooting Tests

### Problem: Tests Pass Locally but Fail in CI

**Symptom**: Tests work on your machine but fail in GitHub Actions

**Solution**: Common issues:

```javascript
// 1. Timing issues - add proper waits
await waitUntil(() => el.shadowRoot.querySelector('.data'));

// 2. Browser differences - use consistent browser
// playwright.config.js
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
]

// 3. Port conflicts - use random ports
const port = Math.floor(Math.random() * 10000) + 50000;
```

### Problem: Flaky Tests

**Symptom**: Tests sometimes pass, sometimes fail

**Solution**:

```javascript
// Bad: Fixed timeout
await new Promise(resolve => setTimeout(resolve, 1000));

// Good: Wait for condition
await waitUntil(() => el.dataLoaded);

// Bad: Race condition
el.loadData();
expect(el.data).to.exist;

// Good: Wait for async
await el.loadData();
expect(el.data).to.exist;
```

### Problem: Slow Tests

**Symptom**: Test suite takes too long

**Solution**:

```javascript
// 1. Run tests in parallel
// web-test-runner.config.js
export default {
  concurrency: 10,
  nodeResolve: true
};

// 2. Mock expensive operations
beforeEach(() => {
  fetchMock.mock('/api/expensive', cachedData);
});

// 3. Skip browser for pure logic
describe('pure functions', () => {
  it('calculates correctly', () => {
    expect(calculateTotal([1, 2, 3])).to.equal(6);
  });
});
```

## Best Practices

1. **Test behavior, not implementation** - Test what users see, not internal details
2. **Keep tests focused** - One assertion per test when possible
3. **Use descriptive names** - Test names should document behavior
4. **Avoid test interdependence** - Each test should run independently
5. **Mock external dependencies** - Don't rely on real APIs
6. **Test error paths** - Test failures, not just successes
7. **Run tests often** - Catch bugs early
8. **Maintain test code** - Refactor tests like production code
9. **Use setup/teardown** - DRY principle applies to tests
10. **Achieve good coverage** - Aim for 80%+, but focus on critical paths

## Exercises

### Exercise 1: Test a Todo Component

Write comprehensive tests for a todo component:
- Renders list of todos
- Adds new todo when form submitted
- Toggles complete status on click
- Deletes todo when delete button clicked
- Shows empty state when no todos
- Validates input before adding

**Bonus**: Test keyboard shortcuts (Enter to submit, Escape to clear).

### Exercise 2: E2E Shopping Flow

Create E2E tests for shopping cart:
- Browse products
- Add items to cart
- Update quantities
- Apply coupon code
- Complete checkout
- Verify order confirmation

**Bonus**: Test as guest and authenticated user.

### Exercise 3: Visual Regression Suite

Set up visual regression testing:
- Capture screenshots of all components
- Test different states (hover, focus, disabled)
- Test responsive breakpoints
- Test dark/light themes
- Integrate into CI pipeline

**Bonus**: Add Percy or Chromatic for cloud-based visual testing.

### Exercise 4: TDD Calculator

Build a calculator component using TDD:
- Write tests first for basic operations (+, -, ×, ÷)
- Implement each operation one at a time
- Add tests for edge cases (divide by zero, overflow)
- Add memory functions (MC, MR, M+, M-)
- Keep tests passing throughout

**Bonus**: Add scientific functions (sin, cos, sqrt).

---

## Summary

Testing ensures your LARC applications work correctly and continue working as you make changes:

- **Unit tests** verify individual components in isolation
- **Integration tests** verify components work together
- **E2E tests** verify complete user workflows
- **Visual regression tests** catch unintended visual changes
- **Test coverage** ensures critical code is tested
- **CI/CD integration** catches problems before deployment
- **TDD** helps design better components

Good tests give you confidence to refactor, add features, and deploy. They're not overhead—they're insurance that saves time debugging production issues.

---

## Further Reading

**For complete testing reference:**
- *Building with LARC* Chapter 13: Testing Strategies - All testing patterns and tools
- *Building with LARC* Appendix E: Recipes and Patterns - Testing recipes and examples
- [@open-wc/testing documentation](https://open-wc.org/docs/testing/testing-package/)
- [Playwright documentation](https://playwright.dev/)
