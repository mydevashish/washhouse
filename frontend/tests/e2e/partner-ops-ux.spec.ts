import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner Ops UX Phase 1 (A+B+C) smoke — dashboard, new order, order detail stepper.
 * Requires: FE :3000, API :8000, seed_qa. Skip with E2E_SKIP_AUTH=1.
 */
const describeOps =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function mockPartnerOpsApis(page: Page) {
  await page.route('**/api/v1/partner/analytics/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Demo Laundry',
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

  await page.route('**/api/v1/partner/operations/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          todays_pickups: 2,
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

  const sampleOrder = {
    id: '11111111-1111-4111-8111-111111111111',
    laundry_id: '00000000-0000-4000-8000-000000000001',
    status: 'washing',
    tracking_code: 'WH-TEST-001',
    pickup_at: new Date().toISOString(),
    delivery_at: new Date(Date.now() + 86400000).toISOString(),
    subtotal_inr: '200',
    delivery_fee_inr: '0',
    cgst_inr: '0',
    sgst_inr: '0',
    total_inr: '200',
    payment_status: 'pending',
    customer_name: 'Test Customer',
    customer_phone: '+919876543210',
    order_source: 'walk_in',
    items: [{ service_name: 'Wash & Fold', quantity: 2, line_total_inr: '200' }],
  };

  await page.route('**/api/v1/partner/orders/**', async (route) => {
    const url = route.request().url();
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    if (url.includes(sampleOrder.id)) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: sampleOrder, meta: {} }),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/partner/orders', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [sampleOrder], meta: {} }),
    });
  });

  await page.route('**/api/v1/partner/services**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          {
            id: '22222222-2222-4222-8222-222222222222',
            name: 'Wash & Fold',
            category: 'wash',
            price_inr: '100',
            is_active: true,
            catalog_status: 'active',
          },
        ],
        meta: {},
      }),
    });
  });
}

describeOps('Partner Ops UX Phase 1', () => {
  test('A: dashboard KPIs and recent orders', async ({ page }) => {
    await mockPartnerOpsApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');
    await expect(page.getByRole('heading', { name: /^dashboard$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/today's orders/i).first()).toBeVisible();
    await expect(page.getByText(/recent orders/i).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /new order/i }).first()).toBeVisible();
  });

  test('B: new order workspace loads walk-in mode', async ({ page }) => {
    await mockPartnerOpsApis(page);
    await page.route('**/api/v1/partner/price-list**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { offered_count: 0, total_catalog_items: 0, items: [] },
          meta: {},
        }),
      });
    });
    await loginAsPartner(page);
    await page.goto('/partner/new-order');
    await expect(page.getByRole('heading', { name: /^new order$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('cloth-wall-phone')).toBeVisible();
    await expect(page.getByTestId('list-mode-toggle')).toBeVisible();
    await expect(page.getByTestId('cloth-wall-customer-next')).toBeVisible();
  });

  test('C: order detail shows status stepper', async ({ page }) => {
    await mockPartnerOpsApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/orders/11111111-1111-4111-8111-111111111111');
    await expect(page.getByRole('heading', { name: /order #wh-test-001/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('list', { name: /order status progress/i })).toBeVisible();
    await expect(page.getByText(/washing/i).first()).toBeVisible();
  });
});
