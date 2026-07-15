import { test, expect, type Locator, type Page } from '@playwright/test';

/** Viewports from 19-responsive-design.md device matrix (phone + tablet). */
const MOBILE_VIEWPORTS = [
  { name: 'iPhone SE', width: 375, height: 812 },
  { name: 'iPhone Plus', width: 414, height: 896 },
  { name: 'iPad portrait', width: 768, height: 1024 },
] as const;

/**
 * Wheel over the target is a reliable headless proxy for “vertical scroll is not blocked”
 * when the pointer is on a horizontal carousel/strip. True touch swipe QA is manual (below).
 */
async function assertVerticalScrollOverTarget(page: Page, target: Locator) {
  await target.scrollIntoViewIfNeeded();
  const box = await target.boundingBox();
  if (!box) throw new Error('Target element has no bounding box');

  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.wheel(0, 160);
  await page.waitForTimeout(100);
  const scrollAfter = await page.evaluate(() => window.scrollY);

  expect(
    scrollAfter,
    'page should scroll vertically when the pointer is over the horizontal region',
  ).toBeGreaterThan(scrollBefore);
}

async function assertTouchFriendlyHorizontalRegion(locator: Locator) {
  await expect(locator).toHaveClass(/horizontal-scroll-touch/);

  const touchAction = await locator.evaluate((el) => getComputedStyle(el).touchAction);
  expect(
    touchAction,
    'below lg, touch-action must prefer vertical pan (not touch-pan-x)',
  ).toMatch(/pan-y/);
  expect(touchAction).not.toMatch(/^pan-x$/);
}

test.describe('touch scroll — marketing hero carousel', () => {
  for (const viewport of MOBILE_VIEWPORTS) {
    test(`/${viewport.name} hero carousel is touch-scroll friendly`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      const carousel = page.getByRole('region', { name: /promotional highlights/i });
      await expect(carousel).toBeVisible();

      await assertTouchFriendlyHorizontalRegion(carousel);
      await assertVerticalScrollOverTarget(page, carousel);
    });
  }
});

test.describe('touch scroll — testimonials carousel', () => {
  test('mobile testimonials carousel is touch-scroll friendly', async ({ page }) => {
    await page.route(/marketing\/testimonials/, (route) => route.abort());

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const heading = page.getByRole('heading', { name: /what our customers say/i });
    await heading.scrollIntoViewIfNeeded();
    await expect(heading).toBeVisible({ timeout: 20_000 });

    const carousel = page.getByRole('region', { name: /customer reviews/i });
    await expect(carousel).toBeVisible({ timeout: 10_000 });

    await assertTouchFriendlyHorizontalRegion(carousel);
    await assertVerticalScrollOverTarget(page, carousel);
  });
});

test.describe('touch scroll — services preview strip', () => {
  test('mobile services strip is touch-scroll friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const strip = page.getByRole('region', {
      name: /browse our laundry services/i,
    });
    await strip.scrollIntoViewIfNeeded();
    await expect(strip).toBeVisible();

    await assertTouchFriendlyHorizontalRegion(strip);
    await assertVerticalScrollOverTarget(page, strip);
  });
});

/**
 * Manual QA — required for real touch devices (Playwright touch synthesis is unreliable):
 * 1. DevTools device toolbar → 375, 414, 768 widths.
 * 2. Visit /, /discover, /discover/[id], /services, /stores, /franchise, /partner/orders.
 * 3. Touch hero carousel / testimonials / tab bar / filter chips; swipe vertically.
 * 4. Page must scroll; horizontal swipe may move carousel/tabs only when clearly horizontal.
 * 5. No stuck scroll on nested overflow-x regions.
 */
