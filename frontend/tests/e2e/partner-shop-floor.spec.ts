import { test, expect, type Page } from '@playwright/test';

import { loginAsPartner } from './helpers/auth';

/**
 * Shop Floor Cloth Wall smoke — add 2 shirts via photo and submit.
 * Mocks price-list + walk-in create. Skip with E2E_SKIP_AUTH=1.
 */
const describeFloor =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const SHIRT_ID = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

async function mockClothWallApis(page: Page) {
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
          offered_count: 1,
          total_catalog_items: 1,
          items: [
            {
              catalog_item_id: SHIRT_ID,
              slug: 'men-shirt-tshirt',
              name: 'Shirt / T-shirt',
              category: 'men',
              unit: 'piece',
              sort_order: 10,
              currency: 'INR',
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
            },
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
    expect(body.items).toHaveLength(1);
    expect(body.items[0]?.catalog_item_id).toBe(SHIRT_ID);
    expect(body.items[0]?.quantity).toBe(2);

    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          laundry_id: '00000000-0000-4000-8000-000000000001',
          status: 'confirmed',
          tracking_code: 'DLMCLOTH01',
          color_token: 'red',
          token_code: 'R-42',
          token_day_number: 42,
          pickup_at: new Date().toISOString(),
          delivery_at: new Date(Date.now() + 86400000).toISOString(),
          subtotal_inr: '138.00',
          delivery_fee_inr: '0.00',
          cgst_inr: '12.42',
          sgst_inr: '12.42',
          total_inr: '162.84',
          payment_status: 'pending',
          customer_name: body.customer_name,
          customer_phone: body.customer_phone,
          partner_notes: null,
          user_id: null,
          expected_ready_at: null,
          items: [
            {
              service_name: 'Shirt / T-shirt · Dry clean',
              quantity: 2,
              line_total_inr: '138.00',
            },
          ],
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/orders/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/tags**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          order_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          laundry_id: '00000000-0000-4000-8000-000000000001',
          laundry_name: 'Demo Laundry',
          color_token: 'red',
          token_code: 'R-42',
          token_day_number: 42,
          token_assigned_on: '2026-08-08',
          customer_name: 'Floor Test',
          customer_phone: '9876543210',
          customer_phone_last4: '3210',
          tracking_code: 'DLMCLOTH01',
          piece_count: 2,
          line_count: 1,
          created_at: new Date().toISOString(),
          per_piece: false,
          tags: [
            { kind: 'bag_master', label: 'Bag', quantity: 2, qty_index: '2 pcs' },
            {
              kind: 'item',
              label: 'Shirt / T-shirt · Dry clean',
              service_name: 'Shirt / T-shirt · Dry clean',
              quantity: 2,
              qty_index: '×2',
            },
          ],
        },
        meta: {},
      }),
    });
  });

  await page.route(
    '**/api/v1/partner/orders/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/invoice**',
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            order_id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
            laundry_id: '00000000-0000-4000-8000-000000000001',
            laundry_name: 'Demo Laundry',
            laundry_address: '12 MG Road',
            laundry_city: 'Bengaluru',
            laundry_gstin: null,
            invoice_number: 'WH-2026-DLMCLOTH01',
            color_token: 'red',
            token_code: 'R-42',
            token_day_number: 42,
            token_assigned_on: '2026-08-08',
            customer_name: 'Floor Test',
            customer_phone: '9876543210',
            customer_phone_last4: '3210',
            tracking_code: 'DLMCLOTH01',
            created_at: new Date().toISOString(),
            currency: 'INR',
            subtotal_inr: '138.00',
            delivery_fee_inr: '0.00',
            gst_rate: '18.00',
            cgst_inr: '12.42',
            sgst_inr: '12.42',
            total_inr: '162.84',
            payment_status: 'pending',
            lines: [
              {
                service_name: 'Shirt / T-shirt · Dry clean',
                quantity: 2,
                unit_price_inr: '69.00',
                line_total_inr: '138.00',
              },
            ],
          },
          meta: {},
        }),
      });
    },
  );
}

describeFloor('Partner Shop Floor Cloth Wall', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('add 2 shirts via photo and submit to success panel', async ({ page }) => {
    await mockClothWallApis(page);
    await loginAsPartner(page);

    await page.goto('/partner/floor/new');
    await expect(page.getByRole('heading', { name: /naya order/i })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByTestId('cloth-wall-phone').fill('9876543210');
    await page.getByTestId('cloth-wall-name').fill('Floor Test');
    await page.getByTestId('cloth-wall-customer-next').click();

    await expect(page.getByTestId('cloth-wall-step')).toBeVisible();
    const tile = page.getByTestId(`cloth-wall-tile-catalog:${SHIRT_ID}`);
    await expect(tile).toBeVisible();

    await tile.getByRole('button', { name: /add shirt/i }).click();
    await tile.getByRole('button', { name: /add shirt/i }).click();
    await expect(tile.getByText('2')).toBeVisible();

    await page.getByTestId('cloth-wall-sticky-bar').getByRole('button', { name: /confirm/i }).click();
    await page.getByTestId('cloth-wall-submit').click();

    await expect(page.getByTestId('walk-in-success-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/DLMCLOTH01/i)).toBeVisible();
    await expect(page.getByTestId('color-token-chip')).toContainText('R-42');
    await expect(page.getByTestId('print-tags-link')).toBeVisible();
    await expect(page.getByTestId('print-bill-link')).toBeVisible();
    await expect(page.getByTestId('print-gst-invoice-link')).toBeVisible();
    await expect(page.getByRole('button', { name: /start wash/i })).toBeVisible();

    await page.getByTestId('print-tags-link').click();
    await expect(page).toHaveURL(/\/partner\/floor\/print\/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb\/tags/);
    await expect(page.getByTestId('print-order-tags')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('tag-token-code').first()).toHaveText('R-42');
    await expect(page.getByTestId('tag-bag-master')).toBeVisible();
    await expect(page.locator('.tag-card').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^print$/i })).toBeVisible();

    await page.goto('/partner/floor/print/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/bill');
    await expect(page.getByTestId('print-order-bill')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('bill-invoice-number')).toContainText('WH-2026-DLMCLOTH01');
    await expect(page.getByTestId('bill-cgst')).toContainText('CGST (9.00%)');
    await expect(page.getByTestId('bill-sgst')).toContainText('SGST (9.00%)');
    await expect(page.getByTestId('bill-total')).toContainText('162.84');
    await expect(page.getByTestId('bill-line').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /^print$/i })).toBeVisible();

    await page.goto('/partner/floor/print/bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb/invoice');
    await expect(page.getByTestId('print-order-invoice')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('invoice-number')).toHaveText('WH-2026-DLMCLOTH01');
    await expect(page.getByTestId('invoice-cgst')).toContainText('CGST (9.00%)');
    await expect(page.getByTestId('invoice-total')).toContainText('162.84');
    await expect(page.getByRole('button', { name: /^print$/i })).toBeVisible();
  });
});

const FLOOR_ORDER_ID = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function baseFloorOrder(status: string) {
  return {
    id: FLOOR_ORDER_ID,
    laundry_id: '00000000-0000-4000-8000-000000000001',
    status,
    tracking_code: 'DLMFLOOR01',
    color_token: 'red',
    token_code: 'R-42',
    token_day_number: 42,
    pickup_at: new Date().toISOString(),
    delivery_at: new Date(Date.now() + 86400000).toISOString(),
    subtotal_inr: '138.00',
    delivery_fee_inr: '0.00',
    cgst_inr: '12.42',
    sgst_inr: '12.42',
    total_inr: '162.84',
    payment_status: 'pending',
    customer_name: 'Floor Advance',
    customer_phone: '9876543210',
    order_source: 'walk_in',
    items: [
      {
        service_name: 'Shirt / T-shirt · Dry clean',
        quantity: 2,
        line_total_inr: '138.00',
      },
    ],
  };
}

async function mockFloorBoardApis(page: Page) {
  let status = 'confirmed';
  const patches: string[] = [];

  await page.route(`**/api/v1/partner/orders/${FLOOR_ORDER_ID}/status`, async (route) => {
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
      body: JSON.stringify({ data: baseFloorOrder(status), meta: {} }),
    });
  });

  await page.route('**/api/v1/partner/orders', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [baseFloorOrder(status)], meta: {} }),
    });
  });

  return { getStatus: () => status, getPatches: () => patches };
}

describeFloor('Partner Shop Floor Today + Ready', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('advance one walk-in order through simplified steps', async ({ page }) => {
    const board = await mockFloorBoardApis(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('dlm.partner_ui_mode', 'shop_floor');
    });
    await loginAsPartner(page);

    await page.goto('/partner');
    await expect(page.getByTestId('shop-floor-home-tiles')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('shop-floor-tile-badge').first()).toBeVisible();

    await page.goto('/partner/floor/today');
    await expect(page.getByTestId('shop-floor-today')).toBeVisible({ timeout: 15_000 });
    const card = page.getByTestId('today-order-card');
    await expect(card).toBeVisible();
    await expect(card.getByTestId('color-token-chip')).toContainText('R-42');
    await expect(card.getByTestId('floor-photo-stack')).toContainText('2 pcs');

    // Received → Washing
    await expect(card.getByTestId('floor-advance-cta')).toHaveAttribute(
      'data-floor-action',
      'start_wash',
    );
    await card.getByTestId('floor-advance-cta').click();
    await expect
      .poll(() => board.getStatus(), { timeout: 10_000 })
      .toBe('washing');
    await expect(card).toHaveAttribute('data-floor-status', 'washing');

    // Washing → Ready
    await expect(card.getByTestId('floor-advance-cta')).toHaveAttribute(
      'data-floor-action',
      'mark_ready',
    );
    await card.getByTestId('floor-advance-cta').click();
    await expect
      .poll(() => board.getStatus(), { timeout: 10_000 })
      .toBe('ready');

    // Ready board → Diya confirm → Given (delivered)
    await page.goto('/partner/floor/ready');
    await expect(page.getByTestId('shop-floor-ready')).toBeVisible({ timeout: 15_000 });
    const readyCard = page.getByTestId('ready-order-card');
    await expect(readyCard).toBeVisible();
    await expect(readyCard.getByTestId('print-bill-link')).toBeVisible();
    await expect(readyCard.getByTestId('floor-call-link')).toHaveAttribute(
      'href',
      /tel:\+919876543210/,
    );

    await readyCard.getByTestId('floor-give-cta').click();
    await expect(page.getByRole('heading', { name: /kapde de diye/i })).toBeVisible();
    await page.getByRole('button', { name: /diya \/ given/i }).click();
    await expect
      .poll(() => board.getStatus(), { timeout: 10_000 })
      .toBe('delivered');
    expect(board.getPatches()).toEqual(['washing', 'ready', 'delivered']);
  });
});
