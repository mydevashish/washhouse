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
  test('mobile services strip scrolls horizontally without blocking vertical page scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const strip = page.getByRole('region', {
      name: /browse our laundry services/i,
    });
    await strip.scrollIntoViewIfNeeded();
    await expect(strip).toBeVisible();

    await expect(strip).toHaveClass(/horizontal-scroll-native/);
    await expect(strip).not.toHaveClass(/horizontal-scroll-touch/);

    const touchAction = await strip.evaluate((el) => getComputedStyle(el).touchAction);
    // Browsers may serialize `pan-x pan-y pinch-zoom` as the `manipulation` keyword.
    expect(
      /pan-x|manipulation/i.test(touchAction),
      `native overflow-x strips must allow horizontal pan (got: ${touchAction})`,
    ).toBe(true);
    expect(touchAction).not.toMatch(/^pan-y(\s|$)/);

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
      'carousel content must overflow so swipe/keyboard can scroll',
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
 * 2. Visit /, scroll to “Our Laundry Services”; swipe cards horizontally; then swipe vertically.
 * 3. Also touch hero carousel / testimonials / tab bar / filter chips; swipe vertically.
 * 4. Page must scroll; horizontal swipe moves services strip / carousel when clearly horizontal.
 * 5. No stuck scroll on nested overflow-x regions.
 */
