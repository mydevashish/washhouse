import { test, expect } from '@playwright/test';

const onlineMode = process.env.NEXT_PUBLIC_FEATURE_ONLINE_BOOKING !== 'false';

test.describe('Online booking guest contact', () => {
  test.skip(!onlineMode, 'Set NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=true for this project');

  test('guest sees sign-in contact buttons on laundry detail', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: /nearby laundries/i })).toBeVisible();

    const laundryLink = page.locator('a[href^="/discover/"]').first();
    await expect(laundryLink).toBeVisible();

    const contactResponse = page.waitForResponse(
      (res) => res.url().includes('/contact') && res.request().method() === 'GET' && res.ok(),
    );
    await laundryLink.click();
    await expect(page).toHaveURL(/\/discover\/.+/);

    const contact = await (await contactResponse).json();
    expect(contact.data.requires_login).toBe(true);
    expect(contact.data.show_call).toBe(true);
    expect(contact.data.show_whatsapp).toBe(true);
    expect(contact.data.phone).toBeNull();
    expect(contact.data.whatsapp_url).toBeNull();

    await expect(page.getByRole('button', { name: /sign in to call/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in for whatsapp/i }).first()).toBeVisible();
  });

  test('guest sign-in contact buttons redirect to login', async ({ page }) => {
    await page.goto('/discover');
    const laundryLink = page.locator('a[href^="/discover/"]').first();
    await laundryLink.click();
    await expect(page).toHaveURL(/\/discover\/.+/);

    await page.getByRole('button', { name: /sign in to call/i }).first().click();
    await expect(page).toHaveURL(/\/login/);
  });
});
