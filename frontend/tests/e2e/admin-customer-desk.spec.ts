import { test, expect, type Page } from '@playwright/test';

import { loginAsAdmin } from './helpers/auth';

/**
 * Admin Customer Desk smoke — search → desk → orders → assisted create → admin orders.
 * Requires: FE :3000, API :8000, seed_qa (admin@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeDesk =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const TRACKING = 'DLMDESKADM1';
const LAUNDRY_ID = '44444444-4444-4444-8444-444444444444';
const SERVICE_ID = '55555555-5555-4555-8555-555555555555';

async function mockDeskApis(page: Page) {
  await page.route('**/api/v1/admin/customer-desk/orders', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: '11111111-1111-4111-8111-111111111111',
          tracking_code: TRACKING,
          status: 'confirmed',
          total_inr: '271.40',
          currency: 'INR',
          order_source: 'assisted_admin',
          user_id: null,
          created_by_user_id: '22222222-2222-4222-8222-222222222222',
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
          name: 'Desk Caller',
          phone: '+919876543210',
          email: null,
          registered: false,
          order_count: 1,
          last_order_at: new Date().toISOString(),
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/admin/customers/orders?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              tracking_code: 'DLMPAST001',
              status: 'delivered',
              order_source: 'walk_in',
              laundry_id: LAUNDRY_ID,
              laundry_name: 'Sparkle Wash',
              customer_name: 'Desk Caller',
              customer_phone: '+919876543210',
              subtotal_inr: '200.00',
              delivery_fee_inr: '0.00',
              cgst_inr: '18.00',
              sgst_inr: '18.00',
              total_inr: '236.00',
              currency: 'INR',
              pickup_at: new Date().toISOString(),
              delivery_at: new Date().toISOString(),
              created_at: new Date().toISOString(),
              created_by_user_id: null,
              item_summary: 'Wash & Fold ×1',
            },
          ],
          page: 1,
          page_size: 20,
          total_records: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
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
      body: JSON.stringify({
        data: [
          {
            id: LAUNDRY_ID,
            name: 'Sparkle Wash',
            city: 'Bengaluru',
            status: 'approved',
          },
        ],
        meta: {},
      }),
    });
  });

  await page.route(`**/api/v1/laundries/${LAUNDRY_ID}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: LAUNDRY_ID,
          name: 'Sparkle Wash',
          city: 'Bengaluru',
          services: [
            {
              id: SERVICE_ID,
              name: 'Wash & Fold',
              price_inr: '100.00',
              is_active: true,
            },
          ],
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
          items: [
            {
              id: '11111111-1111-4111-8111-111111111111',
              tracking_code: TRACKING,
              status: 'confirmed',
              laundry_id: LAUNDRY_ID,
              total_inr: '271.40',
              customer_phone: '+919876543210',
              customer_name: 'Desk Caller',
              order_source: 'assisted_admin',
              created_at: new Date().toISOString(),
            },
          ],
          page: 1,
          page_size: 20,
          total_records: 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });
}

describeDesk('Admin Customer Desk smoke', () => {
  test('search phone → desk → past orders → assisted create → admin orders', async ({ page }) => {
    await mockDeskApis(page);
    await loginAsAdmin(page);

    await page.goto('/admin/customer-desk');
    await expect(page).toHaveURL(/\/admin\/orders\?tab=desk/);
    await expect(page.getByRole('heading', { name: /^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /customer search/i })).toBeVisible();
    await expect(page.getByTestId('orders-hub-tabs')).toBeVisible();

    await page.getByLabel(/phone number/i).fill('9876543210');
    await page.getByRole('button', { name: /look up/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    const ordersTab = dialog.getByRole('tab', { name: /^orders$/i });
    await ordersTab.click();
    await expect(dialog.getByText(/DLMPAST001/i)).toBeVisible({ timeout: 15_000 });

    await dialog.getByRole('tab', { name: /place order/i }).click();
    await expect(dialog.getByRole('form', { name: /assisted doorstep/i })).toBeVisible({
      timeout: 15_000,
    });

    await dialog.getByLabel(/customer name/i).fill('Desk Caller');
    await dialog.locator('#desk-laundry').selectOption(LAUNDRY_ID);
    await dialog.getByLabel(/address line 1/i).fill('12 MG Road');
    await dialog.getByLabel(/^city$/i).fill('Bengaluru');
    await dialog.getByLabel(/pincode/i).fill('560001');
    await expect(dialog.locator('#desk-service-0')).toBeEnabled({ timeout: 15_000 });
    await dialog.locator('#desk-service-0').selectOption(SERVICE_ID);
    await dialog.getByRole('button', { name: /place doorstep order/i }).click();

    await page.goto('/admin/orders');
    await expect(page.getByText(TRACKING).first()).toBeVisible({ timeout: 30_000 });
  });
});
