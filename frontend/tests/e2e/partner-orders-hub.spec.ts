import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner Customers & Orders Hub — four pillar tiles + workspace modals.
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

  await page.route('**/api/v1/partner/coupons**', async (route) => {
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

  await page.route('**/api/v1/partner/analytics/dashboard**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Koramangala Demo',
          period: 'week',
          period_label_ist: 'This week (IST)',
          kpis: {
            orders_today: 3,
            orders_yesterday: 2,
            orders_week: 12,
            orders_prev_week: 10,
            orders_month: 40,
            orders_prev_month: 35,
            revenue_today_inr: '1200.00',
            revenue_yesterday_inr: '1000.00',
            revenue_week_inr: '3500.00',
            revenue_prev_week_inr: '3000.00',
            revenue_month_inr: '8000.00',
            revenue_prev_month_inr: '7000.00',
          },
          status_snapshot: { in_process: 2, ready_for_delivery: 1, completed: 30 },
          chart_series: [],
          status_donut: { in_process: 2, ready: 1, completed: 30 },
          top_services: [],
          payment_summary: {
            cash_paid_inr: '500.00',
            upi_paid_inr: '700.00',
            wallet_tracked: false,
            pending_inr: '0.00',
          },
          bottom: {
            customers_total: 18,
            customers_new_week: 2,
            customers_repeat: 10,
            avg_order_value_inr: '416.67',
            avg_delivery_minutes: 120,
            avg_rating: '4.50',
            review_count: 12,
          },
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/analytics/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Koramangala Demo',
          avg_rating: '4.5',
          review_count: 12,
          orders_total: 40,
          orders_today: 3,
          orders_pending: 1,
          orders_in_progress: 2,
          orders_ready: 1,
          pickup_requests: 1,
          orders_delivered: 30,
          customers_count: 18,
          revenue_inr: '10000',
          revenue_today_inr: '1200',
          revenue_this_month_inr: '8000',
          revenue_week_inr: '3500',
          revenue_yesterday_inr: '1000',
          revenue_prev_week_inr: '3000',
          revenue_prev_month_inr: '7000',
          growth_today_pct: '20.00',
          growth_week_pct: '16.67',
          growth_month_pct: '14.29',
          effective_commission_rate: '10.00',
          commission_today_inr: '120.00',
          commission_week_inr: '350.00',
          commission_month_inr: '800.00',
          partner_net_today_inr: '1080.00',
          partner_net_week_inr: '3150.00',
          partner_net_month_inr: '7200.00',
          revenue_walk_in_today_inr: '400.00',
          revenue_doorstep_today_inr: '800.00',
          revenue_walk_in_week_inr: '1000.00',
          revenue_doorstep_week_inr: '2500.00',
          revenue_walk_in_month_inr: '2500.00',
          revenue_doorstep_month_inr: '5500.00',
        },
        meta: {},
      }),
    });
  });
}

describeHub('Partner Orders Hub smoke', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('four pillars, modals, nav IA, and legacy redirects', async ({ page }) => {
    await mockHubApis(page);
    await loginAsPartner(page);

    await page.goto('/partner/orders');
    await expect(page.locator('#main-content main .page-title').filter({ hasText: /^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('partner-orders-page-new-order')).toBeVisible();

    await page.goto('/partner/orders?workspace=customers');
    await expect(page.getByTestId('hub-workspace-customers')).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/workspace=customers/);
    await page.keyboard.press('Escape');
    await expect(page).not.toHaveURL(/workspace=customers/);

    await page.getByRole('button', { name: /open navigation menu/i }).click();
    const partnerNav = page.getByRole('navigation', { name: /partner navigation/i });
    await expect(partnerNav.getByRole('link', { name: /^customers$/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /orders/i })).toBeVisible();
    await expect(partnerNav.getByRole('link', { name: /^coupons$/i })).toHaveCount(0);
    await expect(partnerNav.getByRole('link', { name: /^services$/i })).toHaveCount(0);
    await page.keyboard.press('Escape');

    await page.goto('/partner/customers');
    await expect(page).toHaveURL(/\/partner\/customers/);
    await expect(page.locator('#main-content main .page-title').filter({ hasText: /^customers$/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/partner/customer-desk?phone=%2B919876543210');
    await expect(page).toHaveURL(/workspace=customers/);
    await expect(page).toHaveURL(/phone=%2B919876543210/);

    await page.goto('/partner/booking-requests');
    await expect(page).toHaveURL(/\/partner\/booking-requests/);
    await expect(page.locator('#main-content main .page-title').filter({ hasText: /^booking requests$/i })).toBeVisible({
      timeout: 15_000,
    });

    await page.goto('/partner/new-order');
    await expect(page).toHaveURL(/\/partner\/new-order/);

    await page.goto('/partner/walk-in-orders');
    await expect(page).toHaveURL(/workspace=orders/);
    await expect(page).toHaveURL(/chip=walk_in/);

    await page.goto('/partner/coupons');
    await expect(page).toHaveURL(/workspace=coupons/);
    await expect(page.getByTestId('hub-workspace-coupons')).toBeVisible({ timeout: 15_000 });
  });

  test('P8 matrix: orders workspace pagination, customer scope link, settings English', async ({
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

    await page.goto('/partner/orders?workspace=orders');
    await expect(page.getByTestId('hub-workspace-orders')).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => ordersPageSize).toBe('10');

    await page.goto('/partner/orders');
    await page.goto('/partner/orders?workspace=customers');
    await expect(page.getByTestId('hub-workspace-customers')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('link', { name: /view orders for hub directory riya/i })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('link', { name: /view orders for hub directory riya/i }).click();
    await expect(page).toHaveURL(/workspace=orders/);
    await expect(page).toHaveURL(/phone=%2B919876543210/);

    // Settings: no Shop Floor mode toggle; English help (matrix rows 6–7).
    await page.goto('/partner/settings');
    await expect(page.locator('#main-content main .page-title').filter({ hasText: /^settings$/i })).toBeVisible({
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
