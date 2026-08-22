import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Shop Floor happy-path journey — mirrors docs/qa/partner-shop-floor-usability.md:
 * 1. Cloth Wall: 3 shirts + 1 saree (pictures only)
 * 2. Print tags (color token visible)
 * 3. Print bill
 * 4. Today: washing → ready
 * 5. Print center: find by phone → reprint tags
 *
 * Mocks partner APIs. Skip with E2E_SKIP_AUTH=1.
 */
const describeJourney =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const SHIRT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const SAREE_ID = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';
const ORDER_ID = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
const PHONE = '9876543210';

function priceListItem(overrides: Record<string, unknown>) {
  return {
    suggested_dry_clean_inr: '69.00',
    suggested_press_inr: '15.00',
    suggested_price_inr: null,
    suggested_dry_clean_paise: 6900,
    suggested_press_paise: 1500,
    suggested_price_paise: null,
    dry_clean_inr: '69.00',
    press_inr: '15.00',
    price_inr: null,
    dry_clean_paise: 6900,
    press_paise: 1500,
    price_paise: null,
    is_offered: true,
    has_override: true,
    allows_press: true,
    price_mode: 'dual',
    currency: 'INR',
    unit: 'piece',
    ...overrides,
  };
}

function orderPayload(status: string) {
  return {
    id: ORDER_ID,
    laundry_id: '00000000-0000-4000-8000-000000000001',
    status,
    tracking_code: 'DLMJOURNEY1',
    color_token: 'red',
    token_code: 'R-42',
    token_day_number: 42,
    pickup_at: new Date().toISOString(),
    delivery_at: new Date(Date.now() + 86400000).toISOString(),
    subtotal_inr: '346.00',
    delivery_fee_inr: '0.00',
    // cgst_inr: '31.14',
    // sgst_inr: '31.14',
    total_inr: '408.28',
    payment_status: 'pending',
    customer_name: 'Journey Partner',
    customer_phone: PHONE,
    partner_notes: null,
    user_id: null,
    expected_ready_at: null,
    order_source: 'walk_in',
    items: [
      {
        service_name: 'Shirt / T-shirt · Dry clean',
        quantity: 3,
        line_total_inr: '207.00',
      },
      {
        service_name: 'Saree (normal) · Dry clean',
        quantity: 1,
        line_total_inr: '139.00',
      },
    ],
  };
}

async function mockJourneyApis(page: Page) {
  let status = 'confirmed';
  const patches: string[] = [];

  await page.route('**/api/v1/partner/price-list**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          offered_count: 2,
          total_catalog_items: 2,
          items: [
            priceListItem({
              catalog_item_id: SHIRT_ID,
              slug: 'men-shirt-tshirt',
              name: 'Shirt / T-shirt',
              category: 'men',
              sort_order: 10,
            }),
            priceListItem({
              catalog_item_id: SAREE_ID,
              slug: 'women-saree-normal',
              name: 'Saree (normal)',
              category: 'women',
              sort_order: 20,
              suggested_dry_clean_inr: '139.00',
              suggested_press_inr: '49.00',
              suggested_dry_clean_paise: 13900,
              suggested_press_paise: 4900,
              dry_clean_inr: '139.00',
              press_inr: '49.00',
              dry_clean_paise: 13900,
              press_paise: 4900,
            }),
          ],
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/services**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: {} }),
    });
  });

  await page.route('**/api/v1/partner/garment-catalog**', async (route) => {
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
          page_size: 100,
          total_records: 0,
          total_pages: 0,
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
      items: { catalog_item_id?: string; quantity: number }[];
      customer_name: string;
      customer_phone: string;
    };
    expect(body.customer_phone.replace(/\D/g, '')).toMatch(/9876543210$/);
    expect(body.items).toHaveLength(2);
    const byId = Object.fromEntries(
      body.items.map((i) => [i.catalog_item_id, i.quantity]),
    );
    expect(byId[SHIRT_ID]).toBe(3);
    expect(byId[SAREE_ID]).toBe(1);

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ data: orderPayload('confirmed'), meta: {} }),
    });
  });

  await page.route('**/api/v1/partner/orders**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    const path = new URL(route.request().url()).pathname;
    if (!/\/partner\/orders\/?$/.test(path)) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          items: [orderPayload(status)],
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

  await page.route(`**/api/v1/partner/orders/${ORDER_ID}/tags**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          order_id: ORDER_ID,
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Demo Laundry',
          color_token: 'red',
          token_code: 'R-42',
          token_day_number: 42,
          token_assigned_on: '2026-08-08',
          customer_name: 'Journey Partner',
          customer_phone: PHONE,
          customer_phone_last4: '3210',
          tracking_code: 'DLMJOURNEY1',
          piece_count: 4,
          line_count: 2,
          created_at: new Date().toISOString(),
          per_piece: false,
          tags: [
            { kind: 'bag_master', label: 'Bag', quantity: 4, qty_index: '4 pcs' },
            {
              kind: 'item',
              label: 'Shirt / T-shirt · Dry clean',
              service_name: 'Shirt / T-shirt · Dry clean',
              quantity: 3,
              qty_index: '×3',
            },
            {
              kind: 'item',
              label: 'Saree (normal) · Dry clean',
              service_name: 'Saree (normal) · Dry clean',
              quantity: 1,
              qty_index: '×1',
            },
          ],
        },
        meta: {},
      }),
    });
  });

  await page.route(`**/api/v1/partner/orders/${ORDER_ID}/invoice**`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          order_id: ORDER_ID,
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Demo Laundry',
          laundry_address: '12 MG Road',
          laundry_city: 'Bengaluru',
          laundry_gstin: null,
          invoice_number: 'WH-2026-DLMJOURNEY1',
          color_token: 'red',
          token_code: 'R-42',
          token_day_number: 42,
          token_assigned_on: '2026-08-08',
          customer_name: 'Journey Partner',
          customer_phone: PHONE,
          customer_phone_last4: '3210',
          tracking_code: 'DLMJOURNEY1',
          created_at: new Date().toISOString(),
          currency: 'INR',
          subtotal_inr: '346.00',
          delivery_fee_inr: '0.00',
          // gst_rate: '18.00',
          // cgst_inr: '31.14',
          // sgst_inr: '31.14',
          total_inr: '408.28',
          payment_status: 'pending',
          lines: [
            {
              service_name: 'Shirt / T-shirt · Dry clean',
              quantity: 3,
              unit_price_inr: '69.00',
              line_total_inr: '207.00',
            },
            {
              service_name: 'Saree (normal) · Dry clean',
              quantity: 1,
              unit_price_inr: '139.00',
              line_total_inr: '139.00',
            },
          ],
        },
        meta: {},
      }),
    });
  });

  await page.route(`**/api/v1/partner/orders/${ORDER_ID}/status`, async (route) => {
    if (route.request().method() !== 'PATCH') {
      await route.continue();
      return;
    }
    const body = route.request().postDataJSON() as { status: string };
    patches.push(body.status);
    status = body.status;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: orderPayload(status), meta: {} }),
    });
  });

  return { getStatus: () => status, getPatches: () => patches };
}

describeJourney('Partner Shop Floor usability journey', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('happy path: create → tags → bill → wash/ready → phone reprint', async ({
    page,
  }) => {
    await mockJourneyApis(page);
    await page.addInitScript(() => {
      // Legacy shop_floor migrates to advanced shell (P6).
      window.localStorage.setItem(
        'dlm.partner_ui_mode',
        JSON.stringify({ state: { mode: 'shop_floor' }, version: 0 }),
      );
      window.localStorage.setItem(
        'dlm.partner_practice_mode',
        JSON.stringify({ state: { enabled: true }, version: 0 }),
      );
    });
    await loginAsPartner(page);

    // Practice banner still available on the single (Advanced) shell
    await page.goto('/partner');
    await expect(page.getByTestId('practice-mode-banner')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('shop-floor-home-tiles')).toHaveCount(0);

    // Task 1 — Cloth Wall on full new-order page (same composer as hub create dialog)
    await page.goto('/partner/new-order?mode=walk_in');
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible({
      timeout: 30_000,
    });
    await page.getByTestId('create-order-phone').fill(PHONE);
    await page.getByTestId('create-order-name').fill('Journey Partner');
    await page.getByTestId('create-order-customer-next').click();
    await expect(page.getByText(/step 2 — add items/i)).toBeVisible({ timeout: 15_000 });
    await page.getByRole('tab', { name: 'Dryclean and Steam Press (per piece)' }).click();
    await expect(page.getByText(/loading garment prices/i)).toBeHidden({ timeout: 15_000 });

    const shirt = page.getByTestId(`cloth-wall-tile-catalog:${SHIRT_ID}`);
    await expect(shirt).toBeVisible();
    await shirt.getByRole('button', { name: /add shirt/i }).click();
    await shirt.getByRole('button', { name: /add shirt/i }).click();
    await shirt.getByRole('button', { name: /add shirt/i }).click();
    await expect(shirt.locator('span.absolute.rounded-full')).toHaveText('3');

    await page.getByRole('tab', { name: /^women$/i }).click();
    const saree = page.getByTestId(`cloth-wall-tile-catalog:${SAREE_ID}`);
    await expect(saree).toBeVisible();
    await saree.getByRole('button', { name: /add saree/i }).click();
    await expect(saree.locator('span.absolute.rounded-full')).toHaveText('1');

    await page.getByTestId('create-order-intake-next').click();
    await page.getByTestId('partner-create-order-submit').click();

    await expect(page.getByTestId('walk-in-success-panel')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('walk-in-success-panel').getByText(/DLMJOURNEY1/i)).toBeVisible();
    await expect(page.getByTestId('color-token-chip')).toContainText('R-42');

    // Task 2 — Print tags + color token
    await page.getByTestId('walk-in-success-print-tags').click();
    await expect(page).toHaveURL(new RegExp(`/partner/floor/print/${ORDER_ID}/tags`));
    await expect(page.getByTestId('print-order-tags')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('tag-token-code').first()).toHaveText('R-42');
    await expect(page.getByTestId('tag-bag-master')).toBeVisible();

    // Task 3 — Print bill
    await page.goto(`/partner/floor/print/${ORDER_ID}/bill`);
    await expect(page.getByTestId('print-order-bill')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('bill-total')).toContainText('408.28');
    // await expect(page.getByTestId('bill-cgst')).toContainText('CGST');
    await expect(page.getByRole('button', { name: /print bill/i })).toBeVisible();

    // Task 4 — Legacy Today board → hub Today chip (boards folded in P7)
    await page.goto('/partner/floor/today');
    await expect(page).toHaveURL(/\/partner\/orders/, { timeout: 15_000 });
    await expect(page).toHaveURL(/chip=today/);
    await expect(page.locator('[data-testid="shop-floor-bottom-nav"]')).toHaveCount(0);

    // Task 5 — Find by phone + reprint tags
    await page.goto('/partner/floor/print');
    await expect(page.getByTestId('shop-floor-print-center')).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('print-center-search').fill(PHONE);
    await expect(page.getByText('Journey Partner')).toBeVisible();
    await expect(page.getByTestId('color-token-chip')).toContainText('R-42');
    await page.getByTestId('print-tags-link').click();
    await expect(page).toHaveURL(new RegExp(`/partner/floor/print/${ORDER_ID}/tags`));
    await expect(page.getByTestId('tag-token-code').first()).toHaveText('R-42');
  });
});
