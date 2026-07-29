import { test, expect } from '@playwright/test';

test('home page loads', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /clean clothes\. happy life/i }),
  ).toBeVisible();
});

test('discover page loads laundry cards or empty (not infinite skeleton)', async ({ page }) => {
  await page.goto('/discover');
  await expect(
    page.getByRole('heading', { name: /professional laundry service at your doorstep/i }),
  ).toBeVisible();

  // Resolve loading state — cards, empty, or error; never hang on skeleton
  await expect(page.getByLabel('Loading laundries')).toHaveCount(0, { timeout: 30_000 });
  const empty = page.getByRole('heading', { name: /no partners in your area yet/i });
  const error = page.getByRole('heading', { name: /could not load laundries/i });
  const cards = page.locator('#partners h3');
  await expect
    .poll(async () => {
      if ((await empty.count()) > 0 || (await error.count()) > 0) return 'terminal';
      if ((await cards.count()) > 0) return 'cards';
      return 'pending';
    })
    .not.toBe('pending');
});

test('forgot password: login link → submit shows success UI', async ({ page }) => {
  await page.route('**/api/v1/auth/password/forgot', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: { message: 'If the email exists, a reset code was sent' },
        meta: {},
      }),
    });
  });

  await page.goto('/login');
  await page.getByRole('link', { name: /forgot password\?/i }).click();
  await expect(page).toHaveURL(/\/forgot-password/);
  await expect(page.getByRole('heading', { name: /forgot password/i })).toBeVisible();

  await page.locator('#forgot-email').fill('customer@demo.dlm');
  await page.getByRole('button', { name: /send reset code/i }).click();

  await expect(page.getByTestId('forgot-password-success')).toBeVisible();
  await expect(page.getByText(/if an account exists/i).first()).toBeVisible();
  await expect(page.getByRole('button', { name: /enter reset code/i })).toBeVisible();
});

test('reset password page renders with token query', async ({ page }) => {
  await page.goto('/reset-password?token=123456&email=customer%40demo.dlm');
  await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  await expect(page.locator('#reset-email')).toHaveValue('customer@demo.dlm');
  await expect(page.locator('#reset-code')).toHaveValue('123456');
  await expect(page.getByRole('button', { name: /update password/i })).toBeVisible();
});

test('legal and partners pages use marketing navbar', async ({ page }) => {
  for (const { path, heading } of [
    { path: '/terms', heading: /terms/i },
    { path: '/privacy', heading: /privacy/i },
    { path: '/partners', heading: /grow with dlm/i },
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
    await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible();
  }
});
