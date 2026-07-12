import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /doorstep laundry/i })).toBeVisible();
});

test('discover page loads', async ({ page }) => {
  await page.goto('/discover');
  await expect(page.getByRole('heading', { name: /nearby laundries/i })).toBeVisible();
});
