import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import path from 'node:path';

import { loginAsPartner } from './helpers/auth';

/**
 * Partner garment service catalog — Prompt 9 smoke (mocked APIs).
 * Covers template download, bulk upload, price edit, category bulk delete, axe.
 */
const describeCatalog =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const FIXTURE = path.join(__dirname, '../fixtures/garment-import-sample.csv');

const GARMENT_ID = '11111111-1111-4111-8111-111111111111';
const LAUNDRY_ID = '22222222-2222-4222-8222-222222222222';

const SAMPLE_ITEM = {
  id: GARMENT_ID,
  laundry_id: LAUNDRY_ID,
  category: 'men',
  name: 'T Shirt',
  garment_code: 'TF',
  image_url: null,
  resolved_image_url: '/images/garments/placeholder.svg',
  platform_catalog_item_id: null,
  is_visible: true,
  sort_order: 1,
  rates: {
    dry_cleaning: { price_inr: '59', price_paise: 5900 },
    steam_press: { price_inr: '15', price_paise: 1500 },
  },
};

async function mockGarmentCatalogApis(page: Page, options?: { listEmpty?: boolean }) {
  const listEmpty = options?.listEmpty ?? false;

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
      body: JSON.stringify({
        data: {
          total: listEmpty ? 0 : 1,
          visible: listEmpty ? 0 : 1,
          categories: listEmpty ? 0 : 1,
        },
        meta: {},
      }),
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
          items: listEmpty ? [] : [SAMPLE_ITEM],
          page: 1,
          page_size: 20,
          total_records: listEmpty ? 0 : 1,
          total_pages: 1,
          has_next: false,
          has_previous: false,
        },
        meta: {},
      }),
    });
  });

  await page.route(`**/api/v1/partner/garment-catalog/${GARMENT_ID}**`, async (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      const body = route.request().postDataJSON() as {
        rates?: { dry_cleaning?: { price_inr: string } };
      };
      const updated = {
        ...SAMPLE_ITEM,
        rates: {
          ...SAMPLE_ITEM.rates,
          dry_cleaning: {
            price_inr: body.rates?.dry_cleaning?.price_inr ?? '65',
            price_paise: 6500,
          },
        },
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: updated, meta: {} }),
      });
      return;
    }
    await route.continue();
  });

  await page.route('**/api/v1/partner/garment-catalog/bulk-delete**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { deleted_count: 1 },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/garment-catalog/import/preview**', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          preview_id: '00000000-0000-4000-8000-000000000099',
          summary: {
            total_rows: 3,
            valid_count: 3,
            error_count: 0,
            create_count: 3,
            update_count: 0,
          },
          valid_rows: [
            {
              row_number: 2,
              garment_code: 'TF',
              name: 'T Shirt',
              category: 'men',
              is_visible: true,
              rates: { dry_cleaning: 59, steam_press: 15 },
            },
            {
              row_number: 3,
              garment_code: 'JE',
              name: 'Jeans',
              category: 'men',
              is_visible: true,
              rates: { dry_cleaning: 79, steam_press: 12 },
            },
            {
              row_number: 4,
              garment_code: 'SA',
              name: 'Saree',
              category: 'women',
              is_visible: true,
              rates: { dry_cleaning: 99, steam_press: 20 },
            },
          ],
          error_rows: [],
        },
        meta: {},
      }),
    });
  });

  await page.route('**/api/v1/partner/garment-catalog/import', async (route) => {
    if (route.request().method() !== 'POST' || route.request().url().includes('/preview')) {
      await route.continue();
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          imported_count: 3,
          created_count: 3,
          updated_count: 0,
          skipped_error_count: 0,
        },
        meta: {},
      }),
    });
  });
}

describeCatalog('Partner garment service catalog', () => {
  test.beforeEach(async ({ page }) => {
    await mockGarmentCatalogApis(page);
    await loginAsPartner(page);
    await page.goto('/partner/services');
    await expect(page.getByTestId('partner-services-page')).toBeVisible({ timeout: 30_000 });
  });

  test('downloads import template', async ({ page }) => {
    const downloadPromise = page.waitForEvent('download');
    await page.getByTestId('download-template-btn').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/garment-catalog-template/i);
  });

  test('uploads 3-row csv through wizard', async ({ page }) => {
    await page.getByTestId('bulk-upload-btn').click();
    await expect(page.getByTestId('bulk-upload-dialog')).toBeVisible();

    await page.getByTestId('bulk-upload-file-input').setInputFiles(FIXTURE);

    await expect(page.getByTestId('bulk-upload-summary')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('import-row-valid-2')).toBeVisible();

    await page.getByTestId('import-confirm-btn').click();

    const result = page.getByTestId('bulk-upload-result');
    await expect(result).toBeVisible({ timeout: 15_000 });
    await expect(result).toHaveAttribute('role', 'status');
    await expect(page.getByText(/3 imported/i)).toBeVisible();
  });

  test('edits one dry clean price', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await expect(page.getByTestId('garment-catalog-table')).toBeVisible({ timeout: 15_000 });

    await page.getByTestId('garment-edit-btn-TF').click();
    await expect(page.getByTestId('garment-form-sheet')).toBeVisible();

    const rateInput = page.getByTestId('garment-rate-dry_cleaning');
    await rateInput.fill('65');
    await page.getByTestId('garment-form-save-btn').click();

    await expect(page.getByTestId('garment-form-sheet')).toBeHidden({ timeout: 15_000 });
  });

  test('bulk deletes one category with confirm', async ({ page }) => {
    await page.getByTestId('bulk-delete-btn').click();
    await expect(page.getByTestId('bulk-delete-dialog')).toBeVisible();

    await page.getByTestId('bulk-delete-mode-category').check();
    await page.getByTestId('bulk-delete-category-select').selectOption('men');
    await page.getByTestId('bulk-delete-confirm-btn').click();

    await expect(page.getByTestId('bulk-delete-dialog')).toBeHidden({ timeout: 15_000 });
  });

  test('axe — no critical or serious violations', async ({ page }) => {
    await page.evaluate(() => {
      document.querySelectorAll('[data-sonner-toast]').forEach((el) => el.remove());
    });

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('[data-sonner-toaster]')
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious',
    );
    expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
  });
});
