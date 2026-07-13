import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const MARKETING_ROUTES = ['/', '/services', '/stores', '/contact'] as const;

for (const route of MARKETING_ROUTES) {
  test.describe(`a11y: ${route}`, () => {
    test('desktop — no critical or serious violations', async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (blocking.length > 0) {
        console.log(JSON.stringify(blocking, null, 2));
      }

      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });

    test('mobile — no critical or serious violations', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const blocking = results.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious',
      );

      if (blocking.length > 0) {
        console.log(JSON.stringify(blocking, null, 2));
      }

      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    });
  });
}
