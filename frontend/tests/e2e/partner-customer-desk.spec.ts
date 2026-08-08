import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner Customer Desk smoke — lookup → scoped history → assisted form + walk-in.
 * Requires: FE :3000, API :8000, seed_qa (partner.koramangala@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeDesk =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const TRACKING = 'DLMDESKPRT1';
const SERVICE_ID = '55555555-5555-4555-8555-555555555555';

async function mockPartnerDeskApis(page: Page) {
  await page.route('**/api/v1/partner/customer-desk/orders', async (route) => {
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
          order_source: 'assisted_partner',
          user_id: null,
          created_by_user_id: '22222222-2222-4222-8222-222222222222',
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
          name: 'Desk Regular',
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

  await page.route('**/api/v1/partner/customers/orders?**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [
            {
              id: '33333333-3333-4333-8333-333333333333',
              tracking_code: 'DLMPASTPRT',
              status: 'delivered',
              order_source: 'walk_in',
              laundry_id: '44444444-4444-4444-8444-444444444444',
              laundry_name: 'Your laundry',
              customer_name: 'Desk Regular',
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
            id: SERVICE_ID,
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

describeDesk('Partner Customer Desk smoke', () => {
  test('lookup opens desk, shows scoped orders, assisted create, walk-in still works', async ({
    page,
  }) => {
    await mockPartnerDeskApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/customer-desk');
    await expect(page).toHaveURL(/\/partner\/orders\?tab=desk/);
    await expect(page.getByRole('heading', { name: /customers & orders|^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /counter search/i })).toBeVisible();
    await expect(page.getByTestId('orders-hub-tabs')).toBeVisible();

    await expect(page.getByText(/your laundry only/i)).toBeVisible();

    const phone = page.getByPlaceholder(/98765/);
    await phone.fill('9876543210');
    await page.getByRole('button', { name: /^new order$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });

    const ordersTab = dialog.getByRole('tab', { name: /^orders$/i });
    if (await ordersTab.isVisible().catch(() => false)) {
      await ordersTab.click();
      await expect(
        dialog.getByText(/DLMPASTPRT|showing only orders at your laundry|no past orders/i).first(),
      ).toBeVisible({ timeout: 15_000 });
    }

    await dialog.getByRole('tab', { name: /new order/i }).click();
    await expect(dialog.getByRole('button', { name: /place doorstep order/i })).toBeVisible({
      timeout: 15_000,
    });

    await dialog.getByLabel(/customer name/i).fill('Desk Regular');
    await dialog.getByLabel(/address line 1/i).fill('12 MG Road');
    await dialog.getByLabel(/^city$/i).fill('Bengaluru');
    await dialog.getByLabel(/pincode/i).fill('560001');

    const service = dialog.locator('#partner-desk-service-0, #desk-service-0').first();
    if (await service.isVisible().catch(() => false)) {
      await service.selectOption(SERVICE_ID);
    }

    await dialog.getByRole('button', { name: /place doorstep order/i }).click();

    // Walk-in alternate remains available from desk
    const walkIn = dialog.getByRole('link', { name: /walk-in/i });
    await expect(walkIn).toBeVisible();
    await walkIn.click();
    await expect(page).toHaveURL(/\/partner\/new-order/);
    await expect(page).toHaveURL(/mode=walk_in/);
    await expect(page.getByRole('heading', { name: /new order/i })).toBeVisible({
      timeout: 30_000,
    });
  });

  test('Orders hub finds customer without leaving Orders', async ({ page }) => {
    await mockPartnerDeskApis(page);
    await page.route('**/api/v1/partner/booking-requests**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0, page: 1, page_size: 5 } }),
      });
    });
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /customers & orders|^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: /find customer/i })).toBeVisible();
    await expect(page.getByTestId('partner-orders-today-strip')).toBeVisible();

    const phone = page.getByPlaceholder(/98765/);
    await phone.fill('9876543210');
    await page.getByRole('button', { name: /^new order$/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await dialog.getByRole('tab', { name: /new order/i }).click();
    await expect(dialog.getByRole('button', { name: /place doorstep order/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/partner\/orders/);
  });

  test('Full Customer Desk deep-link opens Find customer hub tab', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expect(page.getByRole('heading', { name: /customers & orders|^orders$/i })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('link', { name: /full customer desk/i }).click();
    await expect(page).toHaveURL(/\/partner\/orders\?tab=desk/);
    await expect(page.getByRole('heading', { name: /counter search/i })).toBeVisible();
  });
});
