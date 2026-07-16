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

async function mockLaundriesApi(page: import('@playwright/test').Page) {
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
}

test.describe('/discover page section nav', () => {
  test('highlights Pricing after navigating to /discover#pricing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await mockLaundriesApi(page);
    await page.goto('/discover#pricing');
    await page.waitForLoadState('domcontentloaded');

    const sectionNav = page.getByRole('navigation', { name: 'Page sections' });
    await expect(sectionNav).toBeVisible();

    const activeLinks = sectionNav.locator('a[aria-current="true"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks).toHaveText('Pricing');

    await expect(page.locator('#pricing')).toBeVisible();
  });
});

test.describe('/discover laundry listing', () => {
  test('shows laundries from API instead of 0 nearby', async ({ page }) => {
    await mockLaundriesApi(page);

    await page.goto('/discover');

    await expect(page.getByRole('heading', { name: /choose a laundry near you/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick Wash Koramangala', level: 3 })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: 'Sparkle Clean Indiranagar', level: 3 })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'FreshFold HSR Layout', level: 3 })).toBeVisible();
  });
});
