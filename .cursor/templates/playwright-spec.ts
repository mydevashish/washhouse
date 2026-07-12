// Template: Playwright spec
// Save as: frontend/tests/e2e/<feature>.spec.ts
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('<Feature>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('happy path', async ({ page }) => {
    // 1. Arrange
    // 2. Act
    // 3. Assert
    await expect(page.getByRole('heading', { name: /doorstep laundry/i })).toBeVisible();
  });

  test('keyboard navigates primary CTA', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('passes axe scan', async ({ page }) => {
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();
    const critical = result.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(critical).toEqual([]);
  });
});

test.describe('Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('layout works on small phones', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});
