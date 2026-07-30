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

test.describe('touch scroll — discover reviews (home no longer embeds testimonials)', () => {
  test('mobile /discover still renders customer testimonials', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/discover');
    await page.waitForLoadState('domcontentloaded');

    const reviews = page.getByRole('region', { name: /customer testimonials/i });
    await reviews.scrollIntoViewIfNeeded();
    await expect(reviews).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('heading', { name: /trusted by thousands/i }),
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /what our customers say/i }),
    ).toHaveCount(0);
  });
});

test.describe('touch scroll — pricing rack strip', () => {
  test('mobile pricing rack scrolls horizontally without blocking vertical page scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    const menHeading = page.getByRole('heading', { name: /^men$/i });
    await menHeading.scrollIntoViewIfNeeded();
    await expect(menHeading).toBeVisible({ timeout: 20_000 });

    const rack = page.locator('.pricing-category-rack').filter({
      has: page.getByRole('heading', { name: /^men$/i }),
    });
    const strip = rack.locator('.pricing-rack-scroller');
    await expect(strip).toBeVisible();

    const metrics = await strip.evaluate((el) => {
      el.scrollLeft = 0;
      const scrollLeftBefore = el.scrollLeft;
      el.scrollLeft = 160;
      return {
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
        scrollLeftBefore,
        scrollLeftAfter: el.scrollLeft,
      };
    });

    expect(
      metrics.scrollWidth,
      'rack content must overflow so swipe/keyboard can scroll',
    ).toBeGreaterThan(metrics.clientWidth + 8);
    expect(
      metrics.scrollLeftAfter,
      'horizontal scrollLeft must advance (programmatic proxy for swipe/keyboard)',
    ).toBeGreaterThan(8);

    await assertVerticalScrollOverTarget(page, strip);
  });
});

/**
 * Manual QA — required for real touch devices (Playwright touch synthesis is unreliable):
 * 1. DevTools device toolbar → 390×844, 375, 414, 768 widths.
 * 2. Visit /pricing, scroll to Men rack; swipe tags horizontally; then swipe vertically.
 * 3. Also touch hero carousel on /; /discover reviews; tab bar / filter chips; swipe vertically.
 * 4. Page must scroll; horizontal swipe moves rack / carousel when clearly horizontal.
 * 5. No stuck scroll on nested overflow-x regions.
 * Home `/` no longer embeds Services preview or testimonials carousel.
 */
