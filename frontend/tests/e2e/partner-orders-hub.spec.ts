import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner Orders Hub smoke — tabs, nav IA, search → place-order, legacy redirects.
 * Requires: FE :3000, API :8000, seed_qa (partner.koramangala@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeHub =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function mockHubApis(page: Page) {
  await page.route('**/api/v1/partner/booking-requests**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [],
        meta: {
          pagination: {
            page: 1,
            page_size: 20,
            total: 3,
            total_pages: 1,
            has_next: false,
            has_previous: false,
          },
          inbox: { overdue: 1, new: 0, reviewing: 0 },
        },
      }),
    });
  });

  await page.route('**/api/v1/partner/orders**', async (route) => {
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

  await page.route('**/api/v1/partner/customers/lookup**', async (route) => {
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

  await page.route('**/api/v1/partner/customers/orders?**', async (route) => {
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

  await page.route('**/api/v1/partner/customer-insights/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          total_customers: 0,
          avg_lifetime_spend_inr: '0',
          avg_order_value_inr: '0',
          avg_retention_score: 0,
          segments: { new: 0, active: 0, vip: 0, at_risk: 0, inactive: 0 },
          lists: { top: 0, repeat: 0, vip: 0, inactive: 0, high_risk: 0 },
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/customer-insights/customers**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { items: [], total: 0 },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/services**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: '55555555-5555-4555-8555-555555555555',
            name: 'Wash & Fold',
            price_inr: '100.00',
            is_active: true,
            catalog_status: 'active',
          },
        ],
        meta: {},
      }),
    });
  });
}

describeHub('Partner Orders Hub smoke', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hub tabs, search → place-order, nav IA, and legacy redirects', async ({ page }) => {
    await mockHubApis(page);
    await loginAsPartner(page);

    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('partner-orders-hub')).toBeVisible();
    await expect(page.getByTestId('orders-hub-tabs')).toBeVisible();
    await expect(page.getByTestId('orders-hub-panel-orders')).toBeVisible();
    await expect(page.getByRole('heading', { name: /find customer/i })).toBeVisible();

    await expect(page.getByTestId('orders-hub-tab-badge-requests')).toHaveText('3');
    await expect(page.getByTestId('orders-hub-header-requests-badge')).toHaveText('3');

    // Operations nav: walk-in / pickups / deliveries / ops center stay; CRM collapsed into Orders.
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    const partnerNav = page.getByRole('navigation', { name: /partner navigation/i });
    await expect(partnerNav.getByRole('link', { name: /^orders$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^walk-in orders$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^pickup requests$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^deliveries$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^operations center$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^customer desk$/i })).toHaveCount(0);
    await expect(partnerNav.getByRole('link', { name: /^booking requests$/i })).toHaveCount(0);
    await expect(partnerNav.getByRole('link', { name: /^customer insights$/i })).toHaveCount(0);
    await page.getByRole('button', { name: /^close$/i }).click();

    await page.getByRole('tab', { name: /find customer/i }).click();
    await expect(page).toHaveURL(/tab=desk/);
    await expect(page.getByTestId('orders-hub-panel-desk')).toBeVisible();
    await expect(page.getByRole('heading', { name: /counter search/i })).toBeVisible();
    await expect(page.getByText(/your laundry only/i)).toBeVisible();

    // Search → place-order path (laundry-scoped desk).
    const phone = page.getByPlaceholder(/98765/);
    await phone.fill('9876543210');
    await page.getByRole('button', { name: /^new order$/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await dialog.getByRole('tab', { name: /new order/i }).click();
    await expect(dialog.getByRole('button', { name: /place doorstep order/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(dialog.getByRole('link', { name: /walk-in/i })).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('tab', { name: /requests/i }).click();
    await expect(page).toHaveURL(/tab=requests/);
    await expect(page.getByTestId('orders-hub-panel-requests')).toBeVisible();
    await expect(page.getByRole('button', { name: /new request/i })).toBeVisible();

    await page.getByRole('tab', { name: /directory/i }).click();
    await expect(page).toHaveURL(/tab=directory/);
    await expect(page.getByTestId('orders-hub-panel-directory')).toBeVisible();
    await expect(page.getByText(/total customers/i)).toBeVisible();

    await page.goto('/partner/customer-desk?phone=%2B919876543210');
    await expect(page).toHaveURL(/\/partner\/orders\?.*tab=desk/);
    await expect(page).toHaveURL(/phone=%2B919876543210/);
    await expect(page.getByTestId('orders-hub-panel-desk')).toBeVisible();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 20_000 });

    await page.goto('/partner/booking-requests');
    await expect(page).toHaveURL(/\/partner\/orders\?tab=requests/);

    await page.goto('/partner/customers');
    await expect(page).toHaveURL(/\/partner\/orders\?tab=directory/);
  });
});
