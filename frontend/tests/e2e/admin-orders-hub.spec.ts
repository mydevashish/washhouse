import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

/**
 * Admin Orders Hub smoke — tabs, legacy redirects, desk deep-link.
 * Requires: FE :3000, API :8000, seed_qa (admin@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeHub =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function mockHubApis(page: Page) {
  await page.route('**/api/v1/admin/booking-requests**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [],
          page: 1,
          page_size: 20,
          total: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
          inbox: { new: 2, reviewing: 1, overdue: 0 },
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/admin/orders**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [],
          page: 1,
          page_size: 20,
          total_records: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/admin/users**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [],
          page: 1,
          page_size: 20,
          total_records: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/admin/customers/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user_id: null,
          name: 'Hub Caller',
          phone: '+919876543210',
          email: null,
          registered: false,
          order_count: 0,
          last_order_at: null,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/admin/laundries', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: {} }),
    });
  });
}

describeHub('Admin Orders Hub smoke', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hub tabs, requests badge, legacy redirects, and desk deep-link', async ({ page }) => {
    await mockHubApis(page);
    await loginAsAdmin(page);

    await page.goto('/admin/orders');
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('orders-hub-tabs')).toBeVisible();
    await expect(page.getByTestId('orders-hub-panel-orders')).toBeVisible();
    await expect(page.getByRole('heading', { name: /find customer/i })).toBeVisible();

    await expect(page.getByTestId('orders-hub-tab-badge-requests')).toHaveText('3');
    await expect(page.getByTestId('orders-hub-header-requests-badge')).toHaveText('3');

    // Operations nav: Laundries + Orders only (no collapsed CRM labels).
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    const adminNav = page.getByRole('navigation', { name: /admin navigation/i });
    await expect(adminNav.getByRole('link', { name: /^orders$/i })).toBeVisible();
    await expect(adminNav.getByRole('link', { name: /^laundries$/i })).toBeVisible();
    await expect(adminNav.getByRole('link', { name: /^customer desk$/i })).toHaveCount(0);
    await expect(adminNav.getByRole('link', { name: /^booking requests$/i })).toHaveCount(0);
    await expect(adminNav.getByRole('link', { name: /^customers$/i })).toHaveCount(0);
    await page.getByRole('button', { name: /^close$/i }).click();

    await page.getByRole('tab', { name: /find customer/i }).click();
    await expect(page).toHaveURL(/tab=desk/);
    await expect(page.getByTestId('orders-hub-panel-desk')).toBeVisible();
    await expect(page.getByRole('heading', { name: /customer search/i })).toBeVisible();

    await page.getByRole('tab', { name: /requests/i }).click();
    await expect(page).toHaveURL(/tab=requests/);
    await expect(page.getByTestId('orders-hub-panel-requests')).toBeVisible();
    await expect(page.getByRole('button', { name: /new request/i })).toBeVisible();

    await page.getByRole('tab', { name: /directory/i }).click();
    await expect(page).toHaveURL(/tab=directory/);
    await expect(page.getByTestId('orders-hub-panel-directory')).toBeVisible();
    await expect(page.getByPlaceholder(/search customers/i)).toBeVisible();

    await page.goto('/admin/customer-desk?phone=%2B919876543210');
    await expect(page).toHaveURL(/\/admin\/orders\?.*tab=desk/);
    await expect(page).toHaveURL(/phone=%2B919876543210/);
    await expect(page.getByTestId('orders-hub-panel-desk')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });

    await page.goto('/admin/booking-requests');
    await expect(page).toHaveURL(/\/admin\/orders\?tab=requests/);

    await page.goto('/admin/customers');
    await expect(page).toHaveURL(/\/admin\/orders\?tab=directory/);
  });
});
