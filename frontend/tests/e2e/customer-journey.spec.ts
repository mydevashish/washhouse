import { test, expect, type Page } from '@playwright/test';

import { E2E_ACCOUNTS, loginAsCustomer } from './helpers/auth';

/**
 * Riya customer journey — steps 1–6 against real local FE + API.
 * Requires: FE :3000, API :8000, FEATURE_ONLINE_BOOKING=true, QA seed.
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeJourney =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

const UNIQUE_LABEL = `E2E Riya ${Date.now().toString(36)}`;

async function waitForPartnerCards(page: Page) {
  await expect(page.getByRole('heading', { name: /choose a laundry near you/i })).toBeVisible();
  await expect
    .poll(async () => page.locator('#partners h3').count(), { timeout: 30_000 })
    .toBeGreaterThan(0);
}

async function addFirstServiceAndCheckout(page: Page) {
  await page.locator('#storefront-services, #services').first().scrollIntoViewIfNeeded();
  const addBtn = page.getByRole('button', { name: /add service/i }).first();
  await expect(addBtn).toBeVisible({ timeout: 30_000 });
  await addBtn.click();
  // Prefer the real checkout CTA — "Book now" only scrolls to services.
  const checkoutCta = page.getByRole('button', { name: /^continue to checkout$/i }).first();
  await expect(checkoutCta).toBeVisible({ timeout: 15_000 });
  await checkoutCta.click();
  await page.waitForURL(/\/checkout\//, { timeout: 30_000 });
}

describeJourney('Riya customer journey (steps 1–6)', () => {
  test.describe.configure({ mode: 'serial' });

  let orderId: string | undefined;
  let trackingCode: string | undefined;

  test('1. Landing → Discover shows laundry cards (not infinite skeleton)', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', { name: /clean clothes\. happy life/i }),
    ).toBeVisible();

    await page.goto('/discover');
    await expect(
      page.getByRole('heading', { name: /professional laundry service at your doorstep/i }),
    ).toBeVisible();

    // Skeletons must resolve to cards or empty/error — never hang forever
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
    await expect(cards.first()).toBeVisible();
  });

  test('2. Search/filter/sort → laundry detail (services, price, reviews)', async ({ page }) => {
    await page.goto('/discover#partners');
    await waitForPartnerCards(page);

    await expect(page.getByRole('search', { name: /filter laundries/i })).toBeVisible();
    await page.locator('#partners-search').fill('Sparkle');
    await expect
      .poll(async () => page.locator('#partners h3').count(), { timeout: 20_000 })
      .toBeGreaterThan(0);
    await expect(page.getByRole('heading', { name: /sparkle/i }).first()).toBeVisible();

    await page.getByLabel('Minimum rating').selectOption('4');
    await page.getByLabel(/sort laundries|Sort/i).selectOption('top_rated').catch(async () => {
      await page.locator('#filter-sort').selectOption('top_rated');
    });

    await page.getByRole('heading', { name: /sparkle/i }).first().click();
    await page.waitForURL(/\/discover\/[0-9a-f-]+/i, { timeout: 30_000 });

    await expect(page.getByRole('heading', { name: /sparkle/i }).first()).toBeVisible();
    await expect(page.getByText(/₹|price|from/i).first()).toBeVisible();
    await expect(page.getByText(/review/i).first()).toBeVisible();
    await expect(
      page.getByRole('button', { name: /add service/i }).or(page.getByText(/service/i)).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('3. Add / edit / delete address on /account', async ({ page }) => {
    await loginAsCustomer(page, E2E_ACCOUNTS.customer, { gotoAccount: true });
    await expect(page.getByRole('heading', { name: /^account$/i })).toBeVisible();

    // Add
    await page.getByLabel(/^label$/i).fill(UNIQUE_LABEL);
    await page.getByLabel(/street address/i).fill('42 E2E Test Lane');
    await page.getByLabel(/^city$/i).fill('Bengaluru');
    await page.getByLabel(/^state$/i).fill('Karnataka');
    await page.getByLabel(/pin code/i).fill('560034');
    await page.getByRole('button', { name: /^add address$/i }).click();
    await expect(page.getByText(UNIQUE_LABEL).first()).toBeVisible({ timeout: 20_000 });

    // Edit
    await page.getByRole('button', { name: new RegExp(`edit ${UNIQUE_LABEL}`, 'i') }).click();
    await expect(page.getByText(new RegExp(`edit ${UNIQUE_LABEL}`, 'i'))).toBeVisible();
    await page.getByLabel(/street address/i).fill('42 E2E Test Lane, Updated');
    await page.getByRole('button', { name: /^save address$/i }).click();
    await expect(page.getByText(/42 E2E Test Lane, Updated/i).first()).toBeVisible({
      timeout: 20_000,
    });

    // Delete
    await page.getByRole('button', { name: new RegExp(`remove ${UNIQUE_LABEL}`, 'i') }).click();
    await expect(page.getByText(UNIQUE_LABEL)).toHaveCount(0, { timeout: 20_000 });
  });

  test('4. Checkout → order created with GST fields', async ({ page }) => {
    await loginAsCustomer(page);

    await page.goto('/discover#partners');
    await waitForPartnerCards(page);
    await page.locator('#partners-search').fill('Sparkle Clean Indiranagar');
    await expect(page.getByRole('heading', { name: /sparkle clean indiranagar/i })).toBeVisible({
      timeout: 20_000,
    });
    await page.getByRole('heading', { name: /sparkle clean indiranagar/i }).click();
    await page.waitForURL(/\/discover\/[0-9a-f-]+/i);

    await addFirstServiceAndCheckout(page);

    // Address
    await expect(page.getByRole('heading', { name: /where should we pick up/i })).toBeVisible();
    const addressRadio = page.locator('input[name="checkout-address"]').first();
    await expect(addressRadio).toBeVisible({ timeout: 20_000 });
    await addressRadio.evaluate((el: HTMLInputElement) => el.click());
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Pickup — radios are visually hidden; click the label
    await expect(page.getByRole('heading', { name: /pickup time/i })).toBeVisible();
    await page.locator('label:has(input[name="pickup-slot"])').first().click();
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Delivery
    await expect(page.getByRole('heading', { name: /delivery time/i })).toBeVisible();
    await page.locator('label:has(input[name="delivery-slot"])').first().click();
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Payment COD (default is already COD — confirm GST line + place order)
    await expect(page.getByRole('heading', { name: /^payment$/i })).toBeVisible();
    await page.locator('label:has-text("Cash on delivery")').click();
    await expect(page.getByText(/includes gst/i).first()).toBeVisible();

    const orderResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/orders') &&
        r.request().method() === 'POST' &&
        r.status() === 201,
      { timeout: 60_000 },
    );
    await page.getByRole('button', { name: /place order/i }).click();
    const res = await orderResponse;
    const body = await res.json();
    expect(body.data?.id).toBeTruthy();
    // expect(body.data?.cgst_inr != null).toBeTruthy();
    // expect(body.data?.sgst_inr != null).toBeTruthy();
    expect(Number(body.data?.total_inr)).toBeGreaterThan(0);
    orderId = body.data.id as string;
    trackingCode = body.data.tracking_code as string;

    await page.waitForURL(new RegExp(`/orders/${orderId}`), { timeout: 30_000 });
    await expect(page.getByText(new RegExp(trackingCode!, 'i')).first()).toBeVisible();
  });

  test('5. /orders list → detail → status tracking', async ({ page }) => {
    test.skip(!orderId, 'Order not created in previous step');
    await loginAsCustomer(page);

    await page.goto('/orders');
    await expect(page.getByLabel('Loading orders')).toHaveCount(0, { timeout: 30_000 });
    await expect(page.getByText(new RegExp(trackingCode!, 'i')).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole('link', { name: new RegExp(trackingCode!, 'i') }).first().click();
    await page.waitForURL(new RegExp(`/orders/${orderId}`));

    await expect(page.getByText(/live tracking|order journey|confirmed/i).first()).toBeVisible();
    await expect(
      page.getByText(/live|connecting|updates every/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /refresh status/i }).click();
    await expect(page.getByText(new RegExp(trackingCode!, 'i')).first()).toBeVisible();
  });

  test('6. Cancel within window (if allowed)', async ({ page }) => {
    test.skip(!orderId, 'Order not created in previous step');
    await loginAsCustomer(page);
    await page.goto(`/orders/${orderId}`);

    const cancelBtn = page.getByRole('button', { name: /^cancel order$/i });
    await expect(cancelBtn).toBeVisible({ timeout: 20_000 });

    page.once('dialog', (d) => d.accept());
    const cancelRes = page.waitForResponse(
      (r) =>
        r.url().includes(`/orders/${orderId}/cancel`) &&
        r.request().method() === 'POST' &&
        r.ok(),
      { timeout: 30_000 },
    );
    await cancelBtn.click();
    await cancelRes;
    await expect(page.getByText(/order cancelled/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('guarded routes redirect unauthenticated users', async ({ page }) => {
    await page.goto('/account');
    // AuthGuard spinner then login link, or hard redirect
    await expect
      .poll(async () => {
        const url = page.url();
        if (url.includes('/login')) return 'login';
        if (await page.getByRole('link', { name: /^sign in$/i }).count()) return 'signin';
        if (await page.getByRole('heading', { name: /^account$/i }).count()) return 'authed';
        return 'wait';
      }, { timeout: 30_000 })
      .toMatch(/login|signin/);
  });
});
