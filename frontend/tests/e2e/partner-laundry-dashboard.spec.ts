import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner laundry dashboard redesign — Prompt 8 smoke.
 * Requires FE :3000, API :8000. Skip with E2E_SKIP_AUTH=1.
 */
const describeDashboard =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

function overviewPayload(period: string, ordersCount: number) {
  return {
    data: {
      period,
      period_label_ist: period === 'today' ? 'Today (IST)' : period === 'week' ? 'This week (IST)' : 'This month (IST)',
      period_start_utc: '2026-08-09T18:30:00.000Z',
      period_end_utc: '2026-08-10T18:30:00.000Z',
      orders_count: ordersCount,
      pending_orders_count: 2,
      revenue_gross_inr: '1200.00',
      revenue_net_inr: '1080.00',
      commission_inr: '120.00',
      effective_commission_rate: '10.00',
      pending_payment_count: 1,
      pending_payment_inr: '200.00',
      customers_count_period: 5,
      customers_count_all_time: 40,
      chart_series: [{ bucket_label: 'Mon', orders: ordersCount, revenue_gross: '1200', revenue_net: '1080' }],
    },
    meta: {},
  };
}

async function mockDashboardApis(page: Page) {
  await page.route('**/api/v1/partner/analytics/overview**', async (route) => {
    const url = new URL(route.request().url());
    const period = url.searchParams.get('period') ?? 'today';
    const ordersCount = period === 'week' ? 15 : period === 'month' ? 42 : 3;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overviewPayload(period, ordersCount)),
    });
  });

  await page.route('**/api/v1/partner/analytics/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Demo Laundry',
          orders_today: 3,
          orders_pending: 1,
          orders_in_progress: 2,
          orders_ready: 1,
          revenue_today_inr: '1200',
          revenue_week_inr: '3500',
          revenue_prev_week_inr: '3000',
          revenue_this_month_inr: '8000',
          revenue_prev_month_inr: '7000',
          customers_count: 18,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/operations/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          todays_pickups: 1,
          todays_deliveries: 1,
          delayed_orders: 0,
          pending_tasks: 0,
          active_drivers: 1,
          assigned_drivers: 1,
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
      body: JSON.stringify({
        data: [],
        meta: { inbox: { waiting_contact: 0 }, total: 0 },
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
      body: JSON.stringify({ data: { items: [], total_records: 0 }, meta: {} }),
    });
  });
}


describeDashboard('Partner laundry dashboard', () => {
  test('period toggle refetches overview KPI counts', async ({ page }) => {
    await mockDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    const overview = page.getByRole('region', { name: 'Quick overview' });
    await expect(overview.getByText('3', { exact: true }).first()).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('partner-dashboard-period-week').click();
    await expect(overview.getByText('15', { exact: true }).first()).toBeVisible();

    await page.getByTestId('partner-dashboard-period-month').click();
    await expect(overview.getByText('42', { exact: true }).first()).toBeVisible();
  });

  test('create order modal opens from recent orders CTA', async ({ page }) => {
    await mockDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await page.getByTestId('partner-dashboard-create-order').click();
    await expect(page.getByTestId('partner-create-order-dialog')).toBeVisible();
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible();
  });

  test('tags section appears below recent orders with search field', async ({ page }) => {
    await mockDashboardApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    const recent = page.getByTestId('partner-dashboard-recent-orders');
    const tags = page.getByTestId('partner-dashboard-tags');
    await expect(recent).toBeVisible({ timeout: 30_000 });
    await expect(tags).toBeVisible();
    await expect(page.getByTestId('partner-dashboard-tags-search')).toBeVisible();

    const tagsFollowsRecent = await page.evaluate(() => {
      const recentEl = document.querySelector('[data-testid="partner-dashboard-recent-orders"]');
      const tagsEl = document.querySelector('[data-testid="partner-dashboard-tags"]');
      if (!recentEl || !tagsEl) return false;
      return Boolean(recentEl.compareDocumentPosition(tagsEl) & Node.DOCUMENT_POSITION_FOLLOWING);
    });
    expect(tagsFollowsRecent).toBe(true);
  });
});
