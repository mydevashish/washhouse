import { test, expect, type Page, type Route } from '@playwright/test';

import { loginAsAdmin, loginAsPartner } from './helpers/auth';

/**
 * Pagination contract smoke — Partner Orders + Admin laundries.
 * Asserts network requests use page_size=10 and Next advances page.
 * Requires: FE :3000, API :8000 (auth). Skip with E2E_SKIP_AUTH=1.
 */
const describePagination =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

type PaginatedPayload = {
  items: Array<Record<string, unknown>>;
  page: number;
  page_size: number;
  total_records: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
};

function paginatedEnvelope(data: PaginatedPayload) {
  return JSON.stringify({ data, meta: {} });
}

async function fulfillPartnerOrders(route: Route) {
  if (route.request().method() !== 'GET') {
    await route.continue();
    return;
  }
  const url = new URL(route.request().url());
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('page_size') || '10');
  const safeSize = [10, 25, 50, 100].includes(pageSize) ? pageSize : 10;
  const total = 23;
  const start = (page - 1) * safeSize;
  const items = Array.from({ length: Math.max(0, Math.min(safeSize, total - start)) }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(start + i).padStart(12, '0')}`,
    tracking_code: `TRK${start + i + 1}`,
    status: 'confirmed',
    payment_status: 'paid',
    customer_name: `Customer ${start + i + 1}`,
    total_inr: '499.00',
    created_at: new Date().toISOString(),
  }));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: paginatedEnvelope({
      items,
      page,
      page_size: safeSize,
      total_records: total,
      total_pages: Math.ceil(total / safeSize),
      has_next: start + items.length < total,
      has_previous: page > 1,
    }),
  });
}

async function fulfillAdminLaundriesManagement(route: Route) {
  if (route.request().method() !== 'GET') {
    await route.continue();
    return;
  }
  const url = new URL(route.request().url());
  const page = Number(url.searchParams.get('page') || '1');
  const pageSize = Number(url.searchParams.get('page_size') || '10');
  const safeSize = [10, 25, 50, 100].includes(pageSize) ? pageSize : 10;
  const total = 15;
  const start = (page - 1) * safeSize;
  const items = Array.from({ length: Math.max(0, Math.min(safeSize, total - start)) }, (_, i) => ({
    id: `11111111-1111-4111-8111-${String(start + i).padStart(12, '0')}`,
    name: `Laundry ${start + i + 1}`,
    owner_name: 'Owner',
    owner_email: 'owner@demo.dlm',
    city: 'Bengaluru',
    status: 'approved',
    global_commission_rate: '10.00',
    custom_commission_rate: null,
    effective_commission_rate: '10.00',
    orders_count: 0,
    revenue_inr: '0',
    rating: '0',
    review_count: 0,
    created_at: new Date().toISOString(),
  }));
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: paginatedEnvelope({
      items,
      page,
      page_size: safeSize,
      total_records: total,
      total_pages: Math.ceil(total / safeSize),
      has_next: start + items.length < total,
      has_previous: page > 1,
    }),
  });
}

async function mockPartnerShellApis(page: Page) {
  await page.route('**/api/v1/partner/analytics/summary**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          laundry_name: 'Pagination Demo',
          orders_total: 23,
          orders_in_progress: 3,
          orders_ready: 1,
          revenue_today_inr: '0',
        },
        meta: {},
      }),
    });
  });
  await page.route('**/api/v1/partner/booking-requests**', async (route) => {
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
            total_pages: 1,
            has_next: false,
            has_previous: false,
          },
        },
      }),
    });
  });
  await page.route('**/api/v1/partner/orders**', fulfillPartnerOrders);
}

describePagination('Pagination contract smoke', () => {
  test('Partner Orders defaults to page_size=10 and Next requests page=2', async ({ page }) => {
    await mockPartnerShellApis(page);
    await loginAsPartner(page);

    const firstList = page.waitForRequest(
      (req) =>
        req.method() === 'GET' &&
        req.url().includes('/api/v1/partner/orders') &&
        !req.url().includes('/partner/orders/'),
    );
    await page.goto('/partner/orders');
    const first = await firstList;
    const firstUrl = new URL(first.url());
    expect(Number(firstUrl.searchParams.get('page') || '1')).toBe(1);
    expect(Number(firstUrl.searchParams.get('page_size') || '10')).toBe(10);

    await expect(page.getByRole('button', { name: /next page/i })).toBeVisible({ timeout: 30_000 });

    const secondList = page.waitForRequest((req) => {
      if (req.method() !== 'GET' || !req.url().includes('/api/v1/partner/orders')) return false;
      const u = new URL(req.url());
      return u.searchParams.get('page') === '2';
    });
    await page.getByRole('button', { name: /next page/i }).click();
    const second = await secondList;
    const secondUrl = new URL(second.url());
    expect(secondUrl.searchParams.get('page')).toBe('2');
    expect(Number(secondUrl.searchParams.get('page_size') || '10')).toBe(10);
  });

  test('Admin laundries defaults to page_size=10 and Next requests page=2', async ({ page }) => {
    await page.route('**/api/v1/admin/laundries/management**', fulfillAdminLaundriesManagement);
    await page.route('**/api/v1/admin/dashboard**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: { orders_today: 0, orders_total: 0 }, meta: {} }),
      });
    });
    await loginAsAdmin(page);

    const firstList = page.waitForRequest(
      (req) =>
        req.method() === 'GET' && req.url().includes('/api/v1/admin/laundries/management'),
    );
    await page.goto('/admin/laundries');
    const first = await firstList;
    const firstUrl = new URL(first.url());
    expect(Number(firstUrl.searchParams.get('page') || '1')).toBe(1);
    expect(Number(firstUrl.searchParams.get('page_size') || '10')).toBe(10);

    await expect(page.getByRole('button', { name: /next page/i })).toBeVisible({ timeout: 30_000 });

    const secondList = page.waitForRequest((req) => {
      if (req.method() !== 'GET' || !req.url().includes('/api/v1/admin/laundries/management')) {
        return false;
      }
      return new URL(req.url()).searchParams.get('page') === '2';
    });
    await page.getByRole('button', { name: /next page/i }).click();
    const second = await secondList;
    expect(new URL(second.url()).searchParams.get('page')).toBe('2');
    expect(Number(new URL(second.url()).searchParams.get('page_size') || '10')).toBe(10);
  });
});
