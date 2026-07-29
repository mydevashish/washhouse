import { test, expect, type Page, type Locator } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

import { E2E_ACCOUNTS, loginAsAdmin, loginAsCustomer, loginAsPartner } from './helpers/auth';

/**
 * Critical-path a11y: axe + keyboard + touch targets.
 * Expects FE :3000 and API :8000 with QA seed accounts.
 */
const describeA11y =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function assertNoBlockingAxe(page: Page, label: string) {
  // Transient toasts can race axe color-contrast; clear before scanning.
  await page.evaluate(() => {
    document.querySelectorAll('[data-sonner-toast]').forEach((el) => el.remove());
  });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .exclude('[data-sonner-toaster]')
    .analyze();

  const blocking = results.violations.filter(
    (v) => v.impact === 'critical' || v.impact === 'serious',
  );

  expect(blocking, `${label}: ${JSON.stringify(blocking, null, 2)}`).toEqual([]);
}

async function assertMinTouchTarget(locator: Locator, label: string, minPx = 44) {
  const box = await locator.boundingBox();
  expect(box, `${label} should be visible`).not.toBeNull();
  expect(box!.height, `${label} height ≥ ${minPx}`).toBeGreaterThanOrEqual(minPx);
  expect(box!.width, `${label} width ≥ ${minPx}`).toBeGreaterThanOrEqual(minPx);
}

describeA11y('a11y critical paths', () => {
  test('axe — login', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 30_000 });
    await assertNoBlockingAxe(page, '/login');
  });

  test('axe — discover', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: /choose a laundry near you/i })).toBeVisible({
      timeout: 30_000,
    });
    await assertNoBlockingAxe(page, '/discover');
  });

  test('axe — checkout (after login + cart)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsCustomer(page);
    await page.goto('/discover');
    await expect
      .poll(async () => page.locator('a[href^="/discover/"]').count(), { timeout: 30_000 })
      .toBeGreaterThan(0);
    await page.locator('a[href^="/discover/"]').first().click();
    await page.waitForURL(/\/discover\/[^/]+/, { timeout: 30_000 });

    const addBtn = page.getByRole('button', { name: /add service/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 30_000 });
    await addBtn.click();

    const checkoutCta = page.getByRole('button', { name: /^continue to checkout$/i }).first();
    if (await checkoutCta.isVisible({ timeout: 10_000 }).catch(() => false)) {
      await checkoutCta.click();
      await page.waitForURL(/\/checkout\//, { timeout: 30_000 });
    } else {
      // Fallback: navigate directly with laundry id from URL.
      const laundryId = page.url().split('/discover/')[1]?.split(/[?#]/)[0];
      expect(laundryId).toBeTruthy();
      await page.goto(`/checkout/${laundryId}`);
      await page.waitForURL(/\/checkout\//, { timeout: 30_000 });
    }
    await expect(page.locator('#main-content').first()).toBeVisible({ timeout: 20_000 });
    await assertNoBlockingAxe(page, '/checkout');
  });

  test('axe — partner orders', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({ timeout: 60_000 });
    await assertNoBlockingAxe(page, '/partner/orders');
  });

  test('axe — admin dashboard', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsAdmin(page);
    await expect(page.getByRole('heading', { name: /^overview$/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    await assertNoBlockingAxe(page, '/admin');
  });

  test('keyboard — login → discover → open laundry', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/login');
    await expect(page.locator('#login-email')).toBeVisible({ timeout: 30_000 });

    await page.locator('#login-email').focus();
    await page.keyboard.type(E2E_ACCOUNTS.customer.email);
    await page.keyboard.press('Tab');
    await page.keyboard.type(E2E_ACCOUNTS.customer.password);
    await page.keyboard.press('Tab');
    // Land on Sign in submit (skip OTP toggle if present via Enter on form).
    await page.locator('form').getByRole('button', { name: /^sign in$/i }).focus();
    await page.keyboard.press('Enter');
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });

    await page.goto('/discover');
    await expect
      .poll(async () => page.locator('a[href^="/discover/"]').count(), { timeout: 30_000 })
      .toBeGreaterThan(0);

    const firstLaundry = page.locator('a[href^="/discover/"]').first();
    await firstLaundry.focus();
    await expect(firstLaundry).toBeFocused();
    await page.keyboard.press('Enter');
    await page.waitForURL(/\/discover\/[^/]+/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('touch targets — customer order cancel/refresh + partner accept', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Partner order update buttons (mobile card stack).
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({ timeout: 60_000 });

    const filterTab = page.getByRole('tab', { name: /needs action|all/i }).first();
    if (await filterTab.isVisible().catch(() => false)) {
      await assertMinTouchTarget(filterTab, 'partner order filter tab');
    }

    const accept = page.getByRole('button', { name: /accept order/i }).first();
    const advance = page.getByRole('button', { name: /mark |picked|ready|out for|deliver/i }).first();
    if (await accept.isVisible().catch(() => false)) {
      await assertMinTouchTarget(accept, 'partner Accept order');
    } else if (await advance.isVisible().catch(() => false)) {
      await assertMinTouchTarget(advance, 'partner advance status');
    }

    // Customer tracking actions — open most recent order if present.
    await page.context().clearCookies();
    await loginAsCustomer(page);
    await page.goto('/orders');
    const orderLink = page.locator('a[href^="/orders/"]').first();
    if (await orderLink.isVisible({ timeout: 15_000 }).catch(() => false)) {
      await orderLink.click();
      await page.waitForURL(/\/orders\/[^/]+/, { timeout: 30_000 });
      const refresh = page.getByRole('button', { name: /refresh status/i });
      await expect(refresh).toBeVisible({ timeout: 20_000 });
      await assertMinTouchTarget(refresh, 'customer Refresh status');
      const cancel = page.getByRole('button', { name: /cancel order/i });
      if (await cancel.isVisible().catch(() => false)) {
        await assertMinTouchTarget(cancel, 'customer Cancel order');
      }
    }
  });
});
