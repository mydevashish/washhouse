import { test, expect } from '@playwright/test';

const demoLaundries = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Quick Wash Koramangala',
    slug: 'demo-quick-wash-koramangala',
    city: 'Bengaluru',
    avg_rating: '4.60',
    review_count: 128,
    is_verified: true,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Sparkle Clean Indiranagar',
    slug: 'demo-sparkle-indiranagar',
    city: 'Bengaluru',
    avg_rating: '4.80',
    review_count: 256,
    is_verified: true,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    name: 'FreshFold HSR Layout',
    slug: 'demo-freshfold-hsr',
    city: 'Bengaluru',
    avg_rating: '4.40',
    review_count: 89,
    is_verified: true,
  },
];

test.describe('/discover laundry listing', () => {
  test('shows laundries from API instead of 0 nearby', async ({ page }) => {
    await page.route('**/api/v1/laundries', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: demoLaundries,
          meta: { request_id: 'req_e2e', timestamp: new Date().toISOString() },
        }),
      });
    });

    await page.goto('/discover');

    await expect(page.getByRole('heading', { name: /premium laundries nearby/i })).toBeVisible();
    await expect(page.getByText('3 laundries nearby')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole('heading', { name: 'Quick Wash Koramangala', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Sparkle Clean Indiranagar', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'FreshFold HSR Layout', level: 3 })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View shop' })).toHaveCount(3);
  });
});
