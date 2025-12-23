import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/x-counter.html';

test.describe('x-counter component', () => {
  test('registers and renders default state', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() =>
      customElements.get('pan-bus') && customElements.get('x-counter')
    );

    await expect(page.locator('x-counter button')).toHaveText('Clicked 0');
  });

  test('increments on click and publishes PAN messages', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() =>
      customElements.get('pan-bus') && customElements.get('x-counter')
    );

    await page.evaluate(() => {
      window.__panMessages = [];
      document.addEventListener('pan:deliver', (event) => {
        if (event.detail?.topic === 'demo:click') {
          window.__panMessages.push(event.detail);
        }
      });
    });

    await page.click('x-counter button');
    await expect(page.locator('x-counter button')).toHaveText('Clicked 1');

    await page.waitForFunction(() => window.__panMessages?.length > 0);
    const message = await page.evaluate(() => window.__panMessages[0]);

    expect(message.topic).toBe('demo:click');
    expect(message.data?.n).toBe(1);
  });
});
