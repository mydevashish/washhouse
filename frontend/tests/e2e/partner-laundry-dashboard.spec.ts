import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner laundry dashboard — live data smoke (Prompt 8).
 * Requires FE :3000, API :8000. Skip with E2E_SKIP_AUTH=1.
 */
const describeDashboard =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

function dashboardPayload(laundryName = 'Demo Laundry') {
  return {
    data: {
      laundry_id: '00000000-0000-4000-8000-000000000001',
      laundry_name: laundryName,
      period: 'week',
      period_label_ist: 'This week (IST)',
      kpis: {
        orders_today: 3,
        orders_yesterday: 2,
        orders_week: 15,
        orders_prev_week: 12,
        orders_month: 42,
        orders_prev_month: 38,
        revenue_today_inr: '1200.00',
        revenue_yesterday_inr: '900.00',
        revenue_week_inr: '8500.00',
        revenue_prev_week_inr: '7200.00',
        revenue_month_inr: '28000.00',
        revenue_prev_month_inr: '25000.00',
      },
      status_snapshot: { in_process: 4, ready_for_delivery: 2, completed: 10 },
      chart_series: [
        { bucket_label: 'Mon', current_revenue_inr: '1000.00', previous_revenue_inr: '800.00' },
      ],
      status_donut: { in_process: 4, ready: 2, completed: 10 },
      top_services: [{ name: 'Wash & Iron', order_lines: 12, share_pct: '40.0' }],
      payment_summary: {
        cash_paid_inr: '500.00',
        upi_paid_inr: '300.00',
        wallet_tracked: false,
        pending_inr: '100.00',
      },
      bottom: {
        customers_total: 40,
        customers_new_week: 5,
        customers_repeat: 35,
        avg_order_value_inr: '476.00',
        avg_delivery_minutes: 144,
        avg_rating: '4.70',
        review_count: 2191,
      },
    },
    meta: {},
  };
}

async function mockLiveDashboardApis(page: Page) {
  await page.route('**/api/v1/partner/analytics/dashboard**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(dashboardPayload()),
    });
  });

  await page.route('**/api/v1/partner/customer-insights/customers**', async (route) => {
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
          page_size: 5,
          total_records: 0,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
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
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/booking-requests**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { inbox: { waiting_contact: 0 }, total: 0 } }),
    });
  });
}

describeDashboard('Partner laundry dashboard — live data', () => {
  test('welcome uses laundry name from dashboard API', async ({ page }) => {
    await mockLiveDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await expect(
      page.locator('#main-content').getByRole('heading', { name: /welcome, demo laundry/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('recent View all navigates to orders hub', async ({ page }) => {
    await mockLiveDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await page.getByRole('link', { name: 'View all recent orders' }).click();
    await expect(page).toHaveURL(/\/partner\/orders(\?|$)/);
  });

  test('ready status View all navigates to ready filter', async ({ page }) => {
    await mockLiveDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await page.getByRole('link', { name: 'View all Ready for Delivery' }).click();
    await expect(page).toHaveURL(/\/partner\/orders\?status=ready/);
  });

  test('create order opens dialog from header', async ({ page }) => {
    await mockLiveDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await page.getByTestId('partner-dashboard-create-order').click();
    await expect(page.getByTestId('partner-create-order-dialog')).toBeVisible();
  });
});
