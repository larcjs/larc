import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/pan-modal.html';

async function modalOpenState(page) {
  return page.evaluate(() => {
    const modal = document.querySelector('pan-modal');
    const backdrop = modal?.shadowRoot.querySelector('.modal-backdrop');
    return backdrop?.classList.contains('active') ?? false;
  });
}

test.describe('pan-modal component', () => {
  test('responds to PAN show/hide topics', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() => window.pan?.bus && customElements.get('pan-modal'));

    // Give modal time to set up subscriptions
    await page.waitForTimeout(200);

    // Show modal
    await page.evaluate(() => window.pan.bus.publish('modal.demo.show', {}));
    await expect.poll(async () => modalOpenState(page), { timeout: 5000 }).toBe(true);

    // Hide modal
    await page.evaluate(() => window.pan.bus.publish('modal.demo.hide', {}));
    await expect.poll(async () => modalOpenState(page), { timeout: 5000 }).toBe(false);
  });

  test('toggle topic switches modal state', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() => window.pan?.bus && customElements.get('pan-modal'));

    expect(await modalOpenState(page)).toBe(false);
    await page.evaluate(() => window.pan.bus.publish('modal.demo.toggle', {}));
    await expect.poll(async () => modalOpenState(page)).toBe(true);

    await page.evaluate(() => window.pan.bus.publish('modal.demo.toggle', {}));
    await expect.poll(async () => modalOpenState(page)).toBe(false);
  });
});
