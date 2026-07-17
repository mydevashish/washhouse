import { test, expect } from '@playwright/test';

const laundryId = '11111111-1111-1111-1111-111111111111';

const priceList = {
  laundry_id: laundryId,
  has_published_list: true,
  item_count: 3,
  items: [
    {
      catalog_item_id: 'c1',
      slug: 'kg-wash-fold',
      name: 'Wash & Fold',
      category: 'laundry_by_kg',
      unit: 'kg',
      sort_order: 10,
      currency: 'INR',
      price_mode: 'single',
      dry_clean_inr: null,
      press_inr: null,
      price_inr: '79.00',
      dry_clean_paise: null,
      press_paise: null,
      price_paise: 7900,
    },
    {
      catalog_item_id: 'c2',
      slug: 'men-shirt',
      name: 'Shirt / T-shirt',
      category: 'men',
      unit: 'piece',
      sort_order: 10,
      currency: 'INR',
      price_mode: 'dual',
      dry_clean_inr: '75.00',
      press_inr: '20.00',
      price_inr: null,
      dry_clean_paise: 7500,
      press_paise: 2000,
      price_paise: null,
    },
    {
      catalog_item_id: 'c3',
      slug: 'women-saree',
      name: 'Saree (normal)',
      category: 'women',
      unit: 'piece',
      sort_order: 10,
      currency: 'INR',
      price_mode: 'dual',
      dry_clean_inr: '139.00',
      press_inr: '49.00',
      price_inr: null,
      dry_clean_paise: 13900,
      press_paise: 4900,
      price_paise: null,
    },
  ],
};

test.describe('laundry price list (store detail)', () => {
  test('shows category headings and store prices on seeded laundry', async ({ page }) => {
    await page.route(`**/api/v1/laundries/${laundryId}/price-list**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: priceList,
          meta: { request_id: 'req_e2e_price', timestamp: new Date().toISOString() },
        }),
      });
    });

    // Force discover detail (tabs) — simpler than full storefront payload.
    await page.route(`**/api/v1/laundries/${laundryId}/storefront**`, async (route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          error: { code: 'NOT_FOUND', message: 'No storefront', details: [] },
          meta: { request_id: 'req_e2e', timestamp: new Date().toISOString() },
        }),
      });
    });

    await page.route(`**/api/v1/laundries/${laundryId}`, async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith(`/laundries/${laundryId}`)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              id: laundryId,
              name: 'Quick Wash Koramangala',
              slug: 'demo-quick-wash-koramangala',
              city: 'Bengaluru',
              avg_rating: '4.60',
              review_count: 12,
              is_verified: true,
              description: 'Demo laundry for price list smoke',
              address_line: '1 Demo Road',
              services: [
                {
                  id: 'svc-1',
                  name: 'Wash & Fold',
                  category: 'wash',
                  unit: 'kg',
                  price_inr: '99.00',
                  is_active: true,
                },
              ],
            },
            meta: { request_id: 'req_e2e', timestamp: new Date().toISOString() },
          }),
        });
        return;
      }
      await route.fallback();
    });

    await page.route('**/api/v1/config**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { online_booking_enabled: false },
          meta: { request_id: 'req_e2e', timestamp: new Date().toISOString() },
        }),
      });
    });

    await page.goto(`/discover/${laundryId}`);

    await expect(page.getByRole('heading', { name: 'Quick Wash Koramangala' })).toBeVisible({
      timeout: 20_000,
    });

    await page.getByRole('tab', { name: /Prices/i }).click();

    const panel = page.locator('#panel-prices');
    await expect(panel.getByRole('heading', { name: 'Price list' })).toBeVisible({
      timeout: 15_000,
    });
    await expect(panel.getByRole('heading', { name: /Wash rates/i })).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Men', exact: true })).toBeVisible();
    await expect(panel.getByRole('heading', { name: 'Women', exact: true })).toBeVisible();

    await expect(panel.getByRole('cell', { name: '75 rupees' }).first()).toBeVisible();
    await expect(panel.getByRole('cell', { name: '20 rupees' }).first()).toBeVisible();
    await expect(panel.getByRole('cell', { name: '79 rupees' }).first()).toBeVisible();
    await expect(panel.getByText('₹75').first()).toBeVisible();
    await expect(panel.getByText('₹79').first()).toBeVisible();

    await expect(
      panel.getByRole('button', { name: /Book pickup|Schedule pickup|View services/i }).first(),
    ).toBeVisible();
  });
});
