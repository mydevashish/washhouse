import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner Customers & Orders Hub smoke — tabs, chips, nav IA, desk path, legacy redirects.
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
            page_size: 10,
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
      body: JSON.stringify({
        data: {
          items: [],
          page: 1,
          page_size: 10,
          total_records: 0,
          total_pages: 0,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
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
          page_size: 10,
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
          new_this_week: 0,
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
        data: {
          items: [
            {
              user_id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
              name: 'Hub Directory Riya',
              phone: '+919876543210',
              lifetime_spend_inr: '1200.00',
              order_count: 3,
              avg_order_value_inr: '400.00',
              last_order_at: new Date().toISOString(),
              first_order_at: new Date().toISOString(),
              retention_score: 80,
              segment: 'active',
              segment_label: 'Active',
              is_high_risk: false,
              dispute_count: 0,
              risk_label: 'Low',
            },
          ],
          page: 1,
          page_size: 10,
          total_records: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
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

  await page.route('**/api/v1/partner/analytics/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_name: 'Koramangala Demo',
          avg_rating: 4.5,
          review_count: 12,
        },
        meta: {},
      }),
    });
  });
}

describeHub('Partner Orders Hub smoke', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('hub tabs, chips, search, nav IA, and legacy redirects', async ({ page }) => {
    await mockHubApis(page);
    await loginAsPartner(page);

    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /customers & orders/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/customers and their orders in one place/i)).toBeVisible();
    await expect(page.getByTestId('partner-orders-hub')).toBeVisible();
    await expect(page.getByTestId('orders-hub-tabs')).toBeVisible();
    await expect(page.getByTestId('orders-hub-panel-orders')).toBeVisible();
    await expect(page.getByTestId('partner-orders-shortcut-chips')).toBeVisible();
    await expect(page.getByTestId('partner-orders-filter-bar')).toBeVisible();
    await expect(page.getByTestId('partner-orders-empty-state')).toBeVisible();

    await expect(page.getByTestId('orders-hub-tab-badge-requests')).toHaveText('3');
    await expect(page.getByTestId('orders-hub-header-requests-badge')).toHaveText('3');

    // Shortcut chips — Ready today / Walk-in in ≤ 2 taps; URL deep-links.
    await page.getByTestId('partner-orders-chip-ready_today').click();
    await expect(page).toHaveURL(/chip=ready_today/);
    await expect(page).toHaveURL(/status=ready/);
    await page.getByTestId('partner-orders-chip-walk_in').click();
    await expect(page).toHaveURL(/chip=walk_in/);
    await expect(page).toHaveURL(/source=walk_in/);

    await expect(page.getByTestId('partner-orders-chip-print')).toHaveAttribute(
      'href',
      '/partner/floor/print',
    );

    // Operations nav: single Customers & Orders workplace (P1).
    await page.getByRole('button', { name: /open navigation menu/i }).click();
    const partnerNav = page.getByRole('navigation', { name: /partner navigation/i });
    await expect(partnerNav.getByRole('link', { name: /customers & orders/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^new order$/i })).toHaveCount(0);
    await expect(partnerNav.getByRole('link', { name: /^walk-in orders$/i })).toHaveCount(0);
    await page.getByRole('button', { name: /^close$/i }).click();

    await page.getByRole('tab', { name: /find customer/i }).click();
    await expect(page).toHaveURL(/tab=desk/);
    await expect(page.getByTestId('orders-hub-panel-desk')).toBeVisible();
    await expect(page.getByRole('heading', { name: /counter search/i })).toBeVisible();
    await expect(page.getByText(/your laundry only/i)).toBeVisible();

    // Search -> place-order path (laundry-scoped desk).
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

    await page.getByRole('tab', { name: /customers/i }).click();
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

    // P3 - intake FAB + walk-in list redirect into hub.
    await page.goto('/partner/orders');
    await page.getByTestId('partner-orders-new-order-fab').click();
    await expect(page.getByTestId('partner-orders-new-order-sheet')).toBeVisible();
    await expect(page.getByTestId('partner-intake-choice-walk-in')).toHaveAttribute(
      'href',
      '/partner/new-order?mode=walk_in',
    );
    await expect(page.getByTestId('partner-intake-choice-doorstep')).toHaveAttribute(
      'href',
      '/partner/new-order?mode=assisted',
    );
    await page.keyboard.press('Escape');

    await page.goto('/partner/walk-in-orders');
    await expect(page).toHaveURL(/\/partner\/orders\?/);
    await expect(page).toHaveURL(/chip=walk_in/);
    await expect(page).toHaveURL(/source=walk_in/);
  });

  test('P8 matrix: chips, pagination default 10, directory scope, settings English', async ({
    page,
  }) => {
    await mockHubApis(page);

    let ordersPageSize: string | null = null;
    await page.route('**/api/v1/partner/orders**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const url = new URL(route.request().url());
      ordersPageSize = url.searchParams.get('page_size');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: [
              {
                id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
                laundry_id: '00000000-0000-4000-8000-000000000001',
                tracking_code: 'DLMREADY01',
                customer_name: 'Ready Customer',
                customer_phone: '+919876543210',
                status: 'ready',
                order_source: 'online',
                payment_status: 'paid',
                subtotal_inr: '250.00',
                delivery_fee_inr: '0.00',
                cgst_inr: '0.00',
                sgst_inr: '0.00',
                total_inr: '250.00',
                pickup_at: new Date().toISOString(),
                delivery_at: new Date().toISOString(),
                items: [{ service_name: 'Wash', quantity: 1, line_total_inr: '250.00' }],
              },
            ],
            page: 1,
            page_size: 10,
            total_records: 1,
            total_pages: 1,
            has_next: false,
            has_previous: false,
          },
          meta: {},
        }),
      });
    });

    await loginAsPartner(page);

    // Needs action chip deep-link.
    await page.goto('/partner/orders');
    await expect(page.getByTestId('partner-orders-hub')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('partner-orders-chip-needs_action').click();
    await expect(page).toHaveURL(/chip=needs_action/);

    // Pagination default 10 (matrix row 8).
    await expect.poll(() => ordersPageSize).toBe('10');

    // Ready lens + print actions on row (matrix row 3/4).
    await page.getByTestId('partner-orders-chip-ready_today').click();
    await expect(page).toHaveURL(/chip=ready_today/);
    await expect(page.getByTestId('print-order-actions').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('print-bill-link').first()).toBeVisible();
    await expect(page.getByTestId('print-gst-invoice-link').first()).toBeVisible();

    // Directory → View orders scopes hub (matrix row 5).
    await page.getByRole('tab', { name: /customers/i }).click();
    await expect(page).toHaveURL(/tab=directory/);
    await expect(page.getByTestId('owner-customer-card')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /view orders for hub directory riya/i }).click();
    await expect(page).toHaveURL(/\/partner\/orders\?/);
    await expect(page).toHaveURL(/phone=%2B919876543210/);
    await expect(page).toHaveURL(/customer=/);
    await expect(page.getByTestId('partner-customer-scope-bar')).toBeVisible({ timeout: 15_000 });

    // Settings: no Shop Floor mode toggle; English help (matrix rows 6–7).
    await page.goto('/partner/settings');
    await expect(page.getByRole('heading', { name: /^settings$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-testid="partner-ui-mode-toggle"]')).toHaveCount(0);
    await expect(page.getByRole('radio', { name: /shop floor|advanced/i })).toHaveCount(0);
    await expect(
      page.getByText(/orders, customers, and printing live under/i),
    ).toBeVisible();
    await expect(page.getByText(/no separate shop floor display mode/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /open customers & orders/i })).toBeVisible();
  });
});
