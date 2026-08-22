import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner ops fixes — Prompt 12 QA smoke (mocked API).
 * Covers: M04/M06 create order (total spent + decimal qty), M08 customers nav,
 * M13 template download, M18 storefront save, M19 orders paid/pending columns.
 */
const describeOpsFixes =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function mockCreateOrderApis(page: Page) {
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
            total: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
          inbox: { overdue: 0, new: 0, reviewing: 0 },
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
          laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
          laundry_name: 'Quick Wash Koramangala',
          period: 'week',
          period_label_ist: 'This week (IST)',
          kpis: {
            orders_today: 0,
            orders_yesterday: 0,
            orders_week: 0,
            orders_prev_week: 0,
            orders_month: 0,
            orders_prev_month: 0,
            revenue_today_inr: '0.00',
            revenue_yesterday_inr: '0.00',
            revenue_week_inr: '0.00',
            revenue_prev_week_inr: '0.00',
            revenue_month_inr: '0.00',
            revenue_prev_month_inr: '0.00',
          },
          status_snapshot: { in_process: 0, ready_for_delivery: 0, completed: 0 },
          chart_series: [],
          status_donut: { in_process: 0, ready: 0, completed: 0 },
          top_services: [],
          payment_summary: {
            cash_paid_inr: '0.00',
            upi_paid_inr: '0.00',
            wallet_tracked: false,
            pending_inr: '0.00',
          },
          bottom: {
            customers_total: 0,
            customers_new_week: 0,
            customers_repeat: 0,
            avg_order_value_inr: '0.00',
            avg_delivery_minutes: 0,
            avg_rating: '0.00',
            review_count: 0,
          },
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/analytics/**', async (route) => {
    if (route.request().url().includes('/analytics/dashboard')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/services**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: 'svc-wash-fold',
              name: 'Wash & Fold',
              category: 'wash',
              price_inr: '80.00',
              unit: 'kg',
              is_active: true,
              catalog_status: 'active',
            },
            {
              id: 'svc-wash-iron',
              name: 'Wash & Iron',
              category: 'wash',
              price_inr: '90.00',
              unit: 'kg',
              is_active: true,
              catalog_status: 'active',
            },
          ],
          page: 1,
          page_size: 10,
          total_records: 2,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/price-list**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: { items: [], offered_count: 0, total_catalog_items: 0 }, meta: {} }),
    });
  });

  await page.route('**/api/v1/partner/garment-catalog**', async (route) => {
    const url = route.request().url();
    if (url.includes('/template') || url.includes('/summary')) {
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
          user_id: 'user-create-order',
          name: 'Counter Guest',
          phone: '+919876543210',
          email: null,
          registered: true,
          order_count: 3,
          last_order_at: '2026-01-15T00:00:00.000Z',
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/customer-insights**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              user_id: 'user-create-order',
              name: 'Counter Guest',
              phone: '+919876543210',
              lifetime_spend_inr: '1250.00',
              segment_label: 'Regular',
              order_count: 3,
            },
          ],
          page: 1,
          page_size: 15,
          total_records: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/walk-in-orders', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as {
      items: { service_id: string; quantity: number }[];
    };
    expect(body.items[0]?.quantity).toBe(2.5);
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'order-1',
          tracking_code: 'WH-001',
          customer_name: 'Counter Guest',
          customer_phone: '+919876543210',
          total_inr: '200.00',
          status: 'received',
        },
        meta: {},
      }),
    });
  });
}

describeOpsFixes('partner ops fixes — create order', () => {
  test('enters decimal service qty 2.5 on create tab', async ({ page }) => {
    await mockCreateOrderApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/orders?tab=create');

    await expect(page.getByTestId('partner-create-order-dialog')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible();

    await page.getByTestId('create-order-phone').fill('9876543210');
    await page.getByTestId('create-order-name').fill('Counter Guest');
    await expect(page.getByTestId('partner-customer-total-spent')).toContainText('₹1,250', {
      timeout: 15_000,
    });

    await page.getByTestId('create-order-customer-next').click();
    await expect(page.getByTestId('create-order-intake-next')).toBeVisible();

    await page.getByTestId('create-order-weight-qty-wash-fold').fill('2.5');
    await page.getByTestId('create-order-intake-next').click();
    await page.getByTestId('partner-dashboard-create-order-save').click();

    await expect(page.getByText(/Order WH-001 saved/i)).toBeVisible({ timeout: 15_000 });
  });
});

async function mockCustomersApis(page: Page) {
  let customerName = 'Counter Guest';

  await page.route('**/api/v1/partner/customer-insights/dashboard**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          total_customers: 1,
          segments: { new: 0, active: 1, vip: 0, at_risk: 0, inactive: 0 },
          lists: { top: 1, repeat: 1, vip: 0, inactive: 0, high_risk: 0 },
          avg_retention_score: '80',
          avg_lifetime_spend_inr: '1250.00',
          avg_order_value_inr: '416.67',
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
              user_id: 'user-create-order',
              name: customerName,
              phone: '+919876543210',
              lifetime_spend_inr: '1250.00',
              order_count: 3,
              avg_order_value_inr: '416.67',
              last_order_at: '2026-01-15T00:00:00.000Z',
              first_order_at: '2025-12-01T00:00:00.000Z',
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

  await page.route('**/api/v1/partner/customers/lookup**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user_id: 'user-create-order',
          name: customerName,
          phone: '+919876543210',
          email: 'guest@example.com',
          registered: true,
          order_count: 3,
          last_order_at: '2026-01-15T00:00:00.000Z',
          gender: null,
          notes: null,
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/customers/user-create-order', async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as { name: string };
    customerName = body.name;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          user_id: 'user-create-order',
          name: customerName,
          phone: '+919876543210',
          email: 'guest@example.com',
          gender: null,
          notes: null,
          registered: true,
        },
        meta: {},
      }),
    });
  });
}

describeOpsFixes('partner ops fixes — garment catalog', () => {
  test('download template triggers file save', async ({ page }) => {
    await page.route('**/api/v1/partner/garment-catalog/template**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: Buffer.from('mock-template'),
        headers: {
          'content-disposition': 'attachment; filename="garment-catalog-template.xlsx"',
        },
      });
    });

    await page.route('**/api/v1/partner/garment-catalog/summary**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { total: 0, visible: 0, categories: 0 }, meta: {} }),
      });
    });

    await page.route('**/api/v1/partner/garment-catalog?**', async (route) => {
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

    await loginAsPartner(page);
    await page.goto('/partner/services');
    await expect(page.getByTestId('partner-services-page')).toBeVisible({ timeout: 30_000 });

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-template-btn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/garment-catalog-template/i);
  });
});

describeOpsFixes('partner ops fixes — customers', () => {
  test('sidebar Customers loads list and edit saves name', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await mockCustomersApis(page);
    await loginAsPartner(page);
    await page.goto('/partner');

    await page.getByTestId('partner-nav-customers').click();
    await expect(page).toHaveURL(/\/partner\/customers$/);
    await expect(page.getByTestId('partner-customers-view')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('owner-customer-grid')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('Counter Guest')).toBeVisible();

    await page.getByTestId('partner-customer-edit-trigger').click();
    await expect(page.getByTestId('partner-customer-edit-sheet')).toBeVisible();
    await page.getByTestId('partner-customer-edit-name').fill('Priya Updated');
    await page.getByTestId('partner-customer-edit-save').click();

    await expect(page.getByText(/Customer updated/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('Priya Updated')).toBeVisible();
  });
});

describeOpsFixes('partner ops fixes — orders paid/pending', () => {
  test('orders hub table shows total paid and pending columns', async ({ page }) => {
    await loginAsPartner(page);

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
            items: [
              {
                id: 'order-partial-e2e',
                laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                status: 'confirmed',
                tracking_code: 'WH-PAYMENT01',
                pickup_at: '2026-01-15T10:00:00.000Z',
                delivery_at: '2026-01-16T10:00:00.000Z',
                created_at: '2026-01-15T09:00:00.000Z',
                subtotal_inr: '400.00',
                delivery_fee_inr: '0.00',
                // cgst_inr: '36.00',
                // sgst_inr: '36.00',
                total_inr: '472.00',
                paid_inr: '200.00',
                pending_inr: '272.00',
                payment_status: 'pending_cod',
                customer_name: 'Partial Guest',
                customer_phone: '+919876543210',
                order_source: 'walk_in',
                items: [],
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

    await page.route('**/api/v1/partner/analytics/overview**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
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
          meta: {
            pagination: {
              page: 1,
              page_size: 10,
              total: 0,
              total_pages: 0,
              has_next: false,
              has_previous: false,
            },
            inbox: { overdue: 0, new: 0, reviewing: 0 },
          },
        }),
      });
    });

    await page.goto('/partner/orders');
    await expect(page.getByTestId('partner-orders-table-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('partner-orders-table-desktop').getByText('₹472').first()).toBeVisible();
    await expect(page.getByTestId('partner-orders-table-desktop').getByText('₹200').first()).toBeVisible();
    await expect(page.getByTestId('partner-orders-table-desktop').getByText('₹272').first()).toBeVisible();
    await expect(page.getByTestId('partner-order-unpaid-badge')).toBeVisible();
  });
});

function buildAnalyticsSummaryBody(
  period: string,
  net: string,
  gross: string,
  label: string,
  dateFrom: string | null = null,
  dateTo: string | null = null,
) {
  return {
    data: {
      laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      laundry_name: 'Quick Wash Koramangala',
      avg_rating: '4.50',
      review_count: 1,
      orders_total: 1,
      orders_today: 0,
      orders_pending: 0,
      orders_in_progress: 0,
      orders_ready: 0,
      pickup_requests: 0,
      orders_delivered: 1,
      customers_count: 1,
      revenue_inr: gross,
      revenue_today_inr: gross,
      revenue_this_month_inr: gross,
      revenue_week_inr: gross,
      revenue_yesterday_inr: '0.00',
      revenue_prev_week_inr: '0.00',
      revenue_prev_month_inr: '0.00',
      growth_today_pct: null,
      growth_week_pct: null,
      growth_month_pct: null,
      effective_commission_rate: '10.00',
      commission_today_inr: '0.00',
      commission_week_inr: '0.00',
      commission_month_inr: '0.00',
      partner_net_today_inr: net,
      partner_net_week_inr: net,
      partner_net_month_inr: net,
      revenue_walk_in_today_inr: gross,
      revenue_doorstep_today_inr: '0.00',
      revenue_walk_in_week_inr: gross,
      revenue_doorstep_week_inr: '0.00',
      revenue_walk_in_month_inr: gross,
      revenue_doorstep_month_inr: '0.00',
      period_scope: {
        period,
        period_label_ist: label,
        date_from: dateFrom,
        date_to: dateTo,
        revenue_gross_inr: gross,
        commission_inr: '0.00',
        partner_net_inr: net,
        revenue_walk_in_inr: gross,
        revenue_doorstep_inr: '0.00',
        growth_pct: null,
        prior_period_label: 'prior period',
        chart_series: [{ bucket_label: '09:00', revenue_gross_inr: gross, partner_net_inr: net }],
      },
    },
    meta: {},
  };
}

async function mockRevenueAnalyticsApis(page: Page) {
  await page.route('**/api/v1/partner/analytics/summary**', async (route) => {
    const url = new URL(route.request().url());
    const period = url.searchParams.get('period') ?? 'today';
    const dateFrom = url.searchParams.get('date_from');
    const dateTo = url.searchParams.get('date_to');

    const byPeriod: Record<string, { net: string; gross: string; label: string }> = {
      today: { net: '85.00', gross: '100.00', label: 'Today' },
      week: { net: '900.00', gross: '1000.00', label: 'This week' },
      month: { net: '7200.00', gross: '8000.00', label: 'This month' },
      year: { net: '45000.00', gross: '50000.00', label: 'This year (2026, IST)' },
      custom: { net: '1200.00', gross: '1400.00', label: `${dateFrom} – ${dateTo} (IST)` },
    };
    const cfg = byPeriod[period] ?? byPeriod.today;
    if (!cfg) {
      await route.fulfill({ status: 500, body: 'Missing analytics mock config' });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(
        buildAnalyticsSummaryBody(period, cfg.net, cfg.gross, cfg.label, dateFrom, dateTo),
      ),
    });
  });
}

async function mockReportsOrdersApis(page: Page) {
  await page.route('**/api/v1/partner/orders**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const url = new URL(route.request().url());
    const dateFrom = url.searchParams.get('date_from') ?? '';
    const dateTo = url.searchParams.get('date_to') ?? '';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: 'ord-report-1',
              laundry_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
              status: 'delivered',
              tracking_code: 'WH-REPORT01',
              pickup_at: '2026-01-15T10:00:00.000Z',
              delivery_at: '2026-01-16T10:00:00.000Z',
              created_at: '2026-01-15T09:00:00.000Z',
              subtotal_inr: '400.00',
              delivery_fee_inr: '0.00',
              // cgst_inr: '36.00',
              // sgst_inr: '36.00',
              total_inr: '472.00',
              paid_inr: '472.00',
              pending_inr: '0.00',
              payment_status: 'paid',
              customer_name: 'Report Guest',
              customer_phone: '+919876543210',
              order_source: 'walk_in',
              items: [{ service_name: 'Wash & Fold', quantity: 1 }],
            },
          ],
          page: 1,
          page_size: 5000,
          total_records: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: { requested_range: { date_from: dateFrom, date_to: dateTo } },
      }),
    });
  });
}

describeOpsFixes('partner ops fixes — revenue', () => {
  test('week / year / custom range filters KPIs', async ({ page }) => {
    await mockRevenueAnalyticsApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/revenue');

    await expect(page.getByTestId('partner-revenue-period-bar')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('partner-revenue-net')).toContainText('₹85', { timeout: 15_000 });
    await expect(page.getByTestId('partner-revenue-gross')).toContainText('₹100');

    const weekRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/partner/analytics/summary') &&
        new URL(req.url()).searchParams.get('period') === 'week',
    );
    await page.getByTestId('partner-revenue-period-week').click();
    await weekRequest;
    await expect(page.getByTestId('partner-revenue-net')).toContainText('₹900');
    await expect(page.getByTestId('partner-revenue-gross')).toContainText('₹1,000');

    const yearRequest = page.waitForRequest(
      (req) =>
        req.url().includes('/partner/analytics/summary') &&
        new URL(req.url()).searchParams.get('period') === 'year',
    );
    await page.getByTestId('partner-revenue-period-year').click();
    await yearRequest;
    await expect(page.getByTestId('partner-revenue-net')).toContainText('₹45,000');
    await expect(page.getByTestId('partner-revenue-gross')).toContainText('₹50,000');

    await page.getByTestId('partner-revenue-period-custom').click();
    await page.getByTestId('partner-revenue-date-from').fill('2026-08-01');
    const customRequest = page.waitForRequest(
      (req) => {
        const url = new URL(req.url());
        return (
          req.url().includes('/partner/analytics/summary') &&
          url.searchParams.get('period') === 'custom' &&
          url.searchParams.get('date_from') === '2026-08-01' &&
          url.searchParams.get('date_to') === '2026-08-16'
        );
      },
    );
    await page.getByTestId('partner-revenue-date-to').fill('2026-08-16');
    await customRequest;
    await expect(page.getByTestId('partner-revenue-net')).toContainText('₹1,200');
    await expect(page.getByTestId('partner-revenue-gross')).toContainText('₹1,400');
  });
});

describeOpsFixes('partner ops fixes — reports', () => {
  test('date-filtered CSV export filename has range', async ({ page }) => {
    await mockReportsOrdersApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/reports');

    await expect(page.getByTestId('partner-reports-period-bar')).toBeVisible({ timeout: 15_000 });

    const weekRequest = page.waitForRequest(
      (req) => {
        const url = new URL(req.url());
        return (
          req.url().includes('/partner/orders') &&
          url.searchParams.get('date_from') != null &&
          url.searchParams.get('date_to') != null &&
          url.searchParams.get('page_size') === '5000'
        );
      },
    );
    await page.getByTestId('partner-reports-period-week').click();
    const weekReq = await weekRequest;
    const weekUrl = new URL(weekReq.url());
    const weekFrom = weekUrl.searchParams.get('date_from')!;
    const weekTo = weekUrl.searchParams.get('date_to')!;
    expect(weekFrom).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(weekTo).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(weekFrom <= weekTo).toBeTruthy();

    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('partner-reports-export-orders').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe(`orders-report-${weekFrom}_${weekTo}.csv`);
  });
});

describeOpsFixes('partner ops fixes — storefront', () => {
  test('edit headline → Save → reload persists', async ({ page }) => {
    const laundryId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
    let tagline = 'Original shop tagline';

    await page.route('**/api/v1/partner/storefront**', async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              laundry_id: laundryId,
              template_id: 'premium',
              is_published: true,
              logo_url: null,
              cover_url: null,
              brand_primary: '#1e3a5f',
              brand_secondary: '#c9a227',
              tagline,
              brand_story: null,
              years_in_business: null,
              owner_name: null,
              contact_phone: '+919876543210',
              whatsapp_number: null,
              show_call: true,
              show_whatsapp: true,
              show_callback: true,
              approval_status: 'approved',
              working_hours: {},
              pickup_radius_km: null,
              delivery_radius_km: null,
              facilities: [],
              highlights: [],
              gallery: [],
              machines: [],
              team: [],
              certifications: [],
              videos: [],
              completeness_score: 40,
            },
            meta: {},
          }),
        });
        return;
      }
      if (method === 'PUT') {
        const body = route.request().postDataJSON() as { tagline?: string };
        if (body.tagline) tagline = body.tagline;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              laundry_id: laundryId,
              template_id: 'premium',
              is_published: true,
              logo_url: null,
              cover_url: null,
              brand_primary: '#1e3a5f',
              brand_secondary: '#c9a227',
              tagline,
              brand_story: null,
              years_in_business: null,
              owner_name: null,
              contact_phone: '+919876543210',
              whatsapp_number: null,
              show_call: true,
              show_whatsapp: true,
              show_callback: true,
              approval_status: 'approved',
              working_hours: {},
              pickup_radius_km: null,
              delivery_radius_km: null,
              facilities: [],
              highlights: [],
              gallery: [],
              machines: [],
              team: [],
              certifications: [],
              videos: [],
              completeness_score: 45,
            },
            meta: {},
          }),
        });
        return;
      }
      await route.continue();
    });

    await page.route('**/api/v1/partner/storefront/templates**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: {} }),
      });
    });

    await page.route('**/api/v1/partner/storefront/options**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { facilities: [], gallery_categories: ['store'] },
          meta: {},
        }),
      });
    });

    await loginAsPartner(page);
    await page.goto('/partner/storefront');
    await expect(page.getByTestId('storefront-tagline')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('storefront-tagline').fill('Persisted headline');
    await page.getByTestId('storefront-save').click();
    await expect(page.getByText(/Storefront saved/i)).toBeVisible({ timeout: 10_000 });

    await page.reload();
    await expect(page.getByTestId('storefront-tagline')).toHaveValue('Persisted headline');
  });
});
