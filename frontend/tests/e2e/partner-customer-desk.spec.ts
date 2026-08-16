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

function ordersHeading(page: Page) {
  return page.locator('#main-content main .page-title').filter({ hasText: /^orders$/i });
}

function customersHeading(page: Page) {
  return page.locator('#main-content main .page-title').filter({ hasText: /^customers$/i });
}

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

  await page.route('**/api/v1/partner/customer-insights/customers**', async (route) => {
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
}

describeDesk('Partner Customer Desk smoke', () => {
  test('lookup opens desk, shows scoped orders, assisted create, walk-in still works', async ({
    page,
  }) => {
    await mockPartnerDeskApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/customer-desk');
    await expect(page).toHaveURL(/workspace=customers/);
    await expect(page.getByTestId('hub-workspace-customers')).toBeVisible({ timeout: 30_000 });

    await page.keyboard.press('Escape');
    await expect(page).not.toHaveURL(/workspace=customers/);
    await expect(ordersHeading(page)).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('partner-orders-page-new-order').click();
    const dialog = page.getByTestId('partner-create-order-dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await dialog.getByTestId('create-order-phone').fill('9876543210');
    await dialog.getByTestId('create-order-name').fill('Desk Regular');
    await page.keyboard.press('Escape');

    await page.goto('/partner/new-order?mode=walk_in');
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible({ timeout: 30_000 });
  });

  test('Orders hub finds customer without leaving Orders', async ({ page }) => {
    await mockPartnerDeskApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expect(ordersHeading(page)).toBeVisible({ timeout: 30_000 });

    await page.getByTestId('partner-orders-page-new-order').click();
    const dialog = page.getByTestId('partner-create-order-dialog');
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await dialog.getByTestId('create-order-phone').fill('9876543210');
    await dialog.getByTestId('create-order-name').fill('Desk Regular');
    await expect(page).toHaveURL(/\/partner\/orders/);
  });

  test('Customers page Find customer opens customers workspace', async ({ page }) => {
    await mockPartnerDeskApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/customers');
    await expect(customersHeading(page)).toBeVisible({ timeout: 30_000 });
    await page.getByRole('link', { name: /^find customer$/i }).click();
    await expect(page).toHaveURL(/workspace=customers/);
    await expect(page.getByTestId('hub-workspace-customers')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('hub-customers-search')).toBeVisible();
  });
});
