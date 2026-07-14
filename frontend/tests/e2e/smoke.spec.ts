import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /clean clothes\. happy life/i }),
  ).toBeVisible();
});

test('discover page loads', async ({ page }) => {
  await page.goto('/discover');
  await expect(
    page.getByRole('heading', { name: /professional laundry service at your doorstep/i }),
  ).toBeVisible();
});
