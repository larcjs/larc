import { test, expect } from '@playwright/test';

const fixturePath = '/packages/ui/tests/fixtures/pan-card.html';

test.describe('pan-card component', () => {
  test('renders header, body, footer, and actions', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() => customElements.get('pan-card'));

    const headerText = await page.locator('pan-card').evaluate((el) => {
      return el.shadowRoot.querySelector('.card-header')?.textContent?.trim();
    });
    expect(headerText).toBe('Test Header');

    // Wait for slot content to be assigned and check body content
    const bodyText = await page.locator('pan-card').evaluate((el) => {
      const slot = el.shadowRoot.querySelector('.card-body slot');
      const assignedNodes = slot?.assignedNodes() || [];
      return assignedNodes.map(n => n.textContent).join('').trim();
    });
    expect(bodyText).toContain('This is body content');

    const footerText = await page.locator('pan-card').evaluate((el) => {
      return el.shadowRoot.querySelector('.card-footer')?.textContent?.trim();
    });
    expect(footerText).toBe('Footer copy');

    const actionsCount = await page.locator('pan-card').evaluate((el) => {
      return el.shadowRoot.querySelectorAll('.card-actions slot').length;
    });
    expect(actionsCount).toBe(1);
  });

  test('reacts to attribute changes', async ({ page }) => {
    await page.goto(fixturePath);
    await page.waitForFunction(() => customElements.get('pan-card'));

    await page.evaluate(() => {
      const card = document.querySelector('pan-card');
      card.setAttribute('header', 'Runtime Header');
      card.setAttribute('variant', 'danger');
      card.setAttribute('elevation', '3');
    });

    const newHeader = await page.locator('pan-card').evaluate((el) => {
      return el.shadowRoot.querySelector('.card-header')?.textContent?.trim();
    });
    expect(newHeader).toBe('Runtime Header');

    const classes = await page.locator('pan-card').evaluate((el) => {
      return el.shadowRoot.querySelector('.card').className;
    });
    expect(classes).toContain('variant-danger');
    expect(classes).toContain('elevation-3');
  });
});
