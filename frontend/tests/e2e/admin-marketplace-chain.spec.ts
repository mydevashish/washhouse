import { test, expect, type Page } from '@playwright/test';

import { E2E_ACCOUNTS, loginAsAdmin, loginAsCustomer, loginAsPartner } from './helpers/auth';

/**
 * Anita admin journey — admin surfaces + role gates against local FE + API + QA seed.
 * Cross-role register→approve→order chain is covered by pytest
 * `backend/tests/api/test_admin_marketplace_chain.py` (deterministic).
 *
 * Requires: FE :3000, API :8000, seed_qa (admin@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeJourney =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function expectAdminHeading(page: Page, title: RegExp) {
  await expect(page.locator('#main-content').getByRole('heading', { name: title }).first()).toBeVisible({
    timeout: 30_000,
  });
}

async function expectNoForeverSpinner(page: Page) {
  const skeletons = page.locator('#main-content [aria-busy="true"]');
  await expect
    .poll(async () => skeletons.count(), { timeout: 15_000 })
    .toBeLessThanOrEqual(2);
}

describeJourney('Anita admin marketplace chain', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. /admin dashboard KPIs + charts load', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin(\/|$)/);
    await expectAdminHeading(page, /^overview$/i);

    // Mental model <10s: KPI labels resolve (not forever skeletons).
    await expect(page.getByText(/laundries|customers|orders|revenue|commission|pending/i).first()).toBeVisible({
      timeout: 10_000,
    });
    await expectNoForeverSpinner(page);

    const dashError = page.getByRole('heading', { name: /could not load/i });
    if (await dashError.isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: /try again|retry/i }).first()).toBeVisible();
    }
  });

  test('2. /admin/approvals: queue + confirmation dialog for approve/reject', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/admin/approvals');
    await expectAdminHeading(page, /approval/i);

    const approveBtn = page.getByRole('button', { name: /^approve$/i }).first();
    const empty = page.getByText(/queue is clear/i);

    await expect
      .poll(async () => {
        if ((await approveBtn.count()) > 0) return 'queue';
        if ((await empty.count()) > 0) return 'empty';
        return 'pending';
      }, { timeout: 30_000 })
      .not.toBe('pending');

    if ((await approveBtn.count()) > 0) {
      await approveBtn.click();
      await expect(page.getByRole('heading', { name: /approve laundry\?/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^cancel$/i })).toBeVisible();
      // Cancel — do not mutate shared seed laundry accidentally.
      await page.getByRole('button', { name: /^cancel$/i }).click();
      await expect(page.getByRole('heading', { name: /approve laundry\?/i })).toHaveCount(0);

      const rejectBtn = page.getByRole('button', { name: /^reject$/i }).first();
      if ((await rejectBtn.count()) > 0) {
        await rejectBtn.click();
        await expect(page.getByRole('heading', { name: /reject laundry\?/i })).toBeVisible();
        await page.getByRole('button', { name: /^cancel$/i }).click();
      }
    }
  });

  test('3. Core admin modules load (laundries → settings)', async ({ page }) => {
    await loginAsAdmin(page);

    const routes: Array<{ path: string; heading: RegExp }> = [
      { path: '/admin/laundries', heading: /laundry|laundries/i },
      { path: '/admin/customers', heading: /customer/i },
      { path: '/admin/orders', heading: /order/i },
      { path: '/admin/revenue', heading: /revenue/i },
      { path: '/admin/commission', heading: /commission/i },
      { path: '/admin/audit', heading: /audit/i },
      { path: '/admin/notifications', heading: /notification|alert/i },
      { path: '/admin/settings', heading: /setting|platform|config/i },
      { path: '/admin/disputes', heading: /dispute|complaint/i },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await expectAdminHeading(page, route.heading);
      await expectNoForeverSpinner(page);
    }
  });

  test('4. Customer and partner tokens cannot use /admin shell', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/admin');
    const denied = page.getByRole('heading', { name: /access not allowed/i });
    const login = page.getByRole('heading', { name: /sign in|admin sign in/i });
    await expect(denied.or(login)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /^overview$/i })).toHaveCount(0);

    await loginAsPartner(page);
    await page.goto('/admin');
    await expect(denied.or(login)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /^overview$/i })).toHaveCount(0);
  });

  test('5. Admin remains on /admin after re-login (role home)', async ({ page }) => {
    await loginAsAdmin(page, E2E_ACCOUNTS.admin);
    await expect(page).toHaveURL(/\/admin(\/|$)/);
    await expectAdminHeading(page, /^overview$/i);
  });
});
