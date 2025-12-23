import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/pan-chart.html';

test.describe('pan-chart component', () => {
  test('registers and renders without errors', async ({ page }) => {
    await page.goto(fixturePath);

    // Wait for custom element to be defined
    await page.waitForFunction(() => customElements.get('pan-chart'));

    // Check that element exists in DOM
    const element = await page.locator('pan-chart');
    await expect(element).toBeAttached();

    // Check for JavaScript errors
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));

    // Give component time to initialize
    await page.waitForTimeout(500);

    expect(errors).toHaveLength(0);
  });
});
