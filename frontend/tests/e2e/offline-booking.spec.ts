import { test, expect } from '@playwright/test';

import { OFFLINE_BOOKING_TITLE } from '../../lib/hooks/use-online-booking-enabled';

test.describe('Offline booking mode', () => {
  // Isolated to --project=offline-booking (:3001, NEXT_PUBLIC_FEATURE_ONLINE_BOOKING=false).
  // Do not gate on process.env — shell/.env.local often has FEATURE=true and would skip all coverage.
  test.beforeEach(({}, testInfo) => {
    test.skip(
      testInfo.project.name !== 'offline-booking',
      'Run with --project=offline-booking (webServer :3001, online booking off)',
    );
  });

  test('guest sees call-to-book banner and contact on laundry detail', async ({ page }) => {
    await page.goto('/discover');
    await expect(page.getByRole('heading', { name: /nearby laundries/i })).toBeVisible();

    const laundryLink = page.locator('a[href^="/discover/"]').first();
    await expect(laundryLink).toBeVisible();
    const href = await laundryLink.getAttribute('href');
    expect(href).toMatch(/^\/discover\/.+/);

    await laundryLink.click();
    await expect(page).toHaveURL(/\/discover\/.+/);

    await expect(page.getByRole('note').filter({ hasText: OFFLINE_BOOKING_TITLE })).toBeVisible();
    await expect(page.getByRole('button', { name: /^call shop$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^whatsapp shop$/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in to call/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /sign in for whatsapp/i })).toHaveCount(0);
  });

  test('guest sees browse-only price list without checkout actions', async ({ page }) => {
    await page.goto('/discover');
    const laundryLink = page.locator('a[href^="/discover/"]').first();
    await laundryLink.click();
    await expect(page).toHaveURL(/\/discover\/.+/);

    await expect(page.getByText(/price list/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /^add service$/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /continue to checkout/i })).toHaveCount(0);
    await expect(page.locator('text=/₹/')).toBeVisible();
  });

  test('guest call and WhatsApp do not redirect to login', async ({ page }) => {
    await page.goto('/discover');
    const laundryLink = page.locator('a[href^="/discover/"]').first();
    const contactResponse = page.waitForResponse(
      (res) => res.url().includes('/contact') && res.request().method() === 'GET' && res.ok(),
    );
    await laundryLink.click();
    await expect(page).toHaveURL(/\/discover\/.+/);

    const contact = await (await contactResponse).json();
    expect(contact.data.requires_login).toBe(false);
    expect(contact.data.phone).toBeTruthy();
    expect(contact.data.whatsapp_url).toMatch(/^https:\/\/wa\.me\//);

    await page.getByRole('button', { name: /^call shop$/i }).first().click();
    await expect(page).not.toHaveURL(/\/login/);

    const whatsappPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: /^whatsapp shop$/i }).first().click();
    const whatsappPage = await whatsappPromise;
    expect(whatsappPage.url()).toMatch(/^https:\/\/wa\.me\//);
    await whatsappPage.close();
  });

  test('signed-in customer can use contact actions', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('customer@demo.dlm');
    await page.getByLabel('Password').fill('Customer@1234');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page).toHaveURL(/\/(discover|dashboard|home)?/);

    await page.goto('/discover');
    const laundryLink = page.locator('a[href^="/discover/"]').first();
    await laundryLink.click();

    await expect(page.getByRole('button', { name: /^call shop$/i }).first()).toBeVisible();
    await page.getByRole('button', { name: /^call shop$/i }).first().click();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('checkout route redirects to laundry detail', async ({ page }) => {
    await page.goto('/discover');
    const laundryLink = page.locator('a[href^="/discover/"]').first();
    const href = await laundryLink.getAttribute('href');
    expect(href).toBeTruthy();

    const laundryId = href!.replace('/discover/', '');
    await page.goto(`/checkout/${laundryId}`);
    await expect(page).toHaveURL(new RegExp(`/discover/${laundryId}`));
    await expect(page.getByRole('note').filter({ hasText: OFFLINE_BOOKING_TITLE })).toBeVisible();
  });

  test('partner can open walk-in orders page', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('partner.koramangala@demo.dlm');
    await page.getByLabel('Password').fill('Partner@1234');
    await page.getByRole('button', { name: /^sign in$/i }).click();

    await expect(page).toHaveURL(/\/partner/);
    await page.goto('/partner/walk-in-orders');
    await expect(page.getByRole('heading', { name: /walk-in orders/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /new entry/i })).toBeVisible();
  });

  test('marketing sticky CTA emphasizes Book Pickup + WhatsApp', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const stickyCta = page.locator('[data-marketing-sticky-cta].fixed');
    await expect(stickyCta).toBeVisible();
    await expect(stickyCta).toHaveAttribute('data-booking-mode', 'offline');
    await expect(stickyCta.getByRole('button', { name: /book pickup/i })).toBeVisible();
    await expect(stickyCta.getByRole('link', { name: /chat on whatsapp/i })).toBeVisible();
    await expect(stickyCta.getByRole('button', { name: /find stores/i })).toHaveCount(0);
    await expect(stickyCta.getByRole('link', { name: /call now/i })).toHaveCount(0);
    await expect(stickyCta.getByRole('link', { name: /book nearest/i })).toHaveCount(0);
  });

  test('sticky Book Pickup opens Schedule a pickup dialog', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const stickyCta = page.locator('[data-marketing-sticky-cta].fixed');
    await stickyCta.getByRole('button', { name: /book pickup/i }).click();

    const dialog = page.getByTestId('book-now-dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: /schedule a pickup/i })).toBeVisible();
    // Radix Dialog moves focus into the modal (close control or first field).
    await expect
      .poll(async () =>
        dialog.evaluate((el) => el.contains(document.activeElement) || el === document.activeElement),
      )
      .toBe(true);
  });

  test('Find stores remains reachable via floating FAB when sticky is visible', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const fab = page.getByRole('group', { name: /quick contact/i });
    const findStores = fab.getByRole('link', { name: /find stores/i });
    await expect(findStores).toBeVisible();
    await expect(findStores).toHaveAttribute('href', '/stores');
    await findStores.click();
    await expect(page).toHaveURL(/\/stores/);
  });

  test('final CTA band keeps WhatsApp-primary offline copy', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const band = page.locator('[data-marketing-bottom-cta]');
    await band.scrollIntoViewIfNeeded();
    await expect(band).toHaveAttribute('data-booking-mode', 'offline');
    await expect(band.getByRole('link', { name: /^whatsapp$/i })).toBeVisible();
    await expect(band.getByRole('link', { name: /find stores/i })).toHaveAttribute(
      'href',
      '/stores',
    );
    await expect(band.getByText(/browse stores near you, chat on whatsapp/i)).toBeVisible();
  });
});
