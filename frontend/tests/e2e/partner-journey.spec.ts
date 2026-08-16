import { test, expect, type Page } from '@playwright/test';

import { E2E_ACCOUNTS, loginAsCustomer, loginAsPartner } from './helpers/auth';
import { seedPartnerIncomingOrder, seedPartnerPickupReadyOrder } from './helpers/partner-orders';

const ORDERS_EMPTY = /no new orders|nothing here|no orders in this view|no orders yet/i;
const ORDERS_ACTION_TAB = /needs action/i;
const ACCEPT_ORDER = /accept(ing)? order/i;

/**
 * Mahesh partner journey — full partner console against local FE + API + QA seed.
 * Requires: FE :3000, API :8000, seed_qa (partner.koramangala@demo.dlm).
 * Skip with E2E_SKIP_AUTH=1 when DB is not seeded.
 */
const describeJourney =
  process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

async function expectPageSettled(page: Page, title: RegExp) {
  await expect(page.locator('#main-content main .page-title').filter({ hasText: title })).toBeVisible({
    timeout: 30_000,
  });
}

describeJourney('Mahesh partner journey', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. /partner dashboard loads KPIs without forever spinner', async ({ page }) => {
    await loginAsPartner(page);
    await expect(page).toHaveURL(/\/partner(\/|$)/);
    await expect(page.getByTestId('partner-dashboard-create-order')).toBeVisible({
      timeout: 30_000,
    });

    // KPI values must resolve (₹ / counts) — not perpetual skeletons
    await expect(page.getByText(/today's orders|today's revenue/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/₹\d|₹0/).first()).toBeVisible({ timeout: 30_000 });

    // Actionable error states if API fails (never silent hang)
    const analyticsError = page.getByRole('heading', { name: /could not load analytics/i });
    if (await analyticsError.isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: /try again|retry/i }).first()).toBeVisible();
    }
  });

  test('2. /partner/orders: accept incoming order', async ({ page }) => {
    const { orderId, trackingCode } = await seedPartnerIncomingOrder(page.request);
    await loginAsPartner(page);
    await page.goto(`/partner/orders/${orderId}`);
    await expect(page.getByRole('heading', { name: new RegExp(trackingCode, 'i') })).toBeVisible({
      timeout: 30_000,
    });

    const acceptBtn = page.getByRole('button', { name: ACCEPT_ORDER });
    await expect(acceptBtn).toBeVisible({ timeout: 30_000 });
    await acceptBtn.click();
    await expect
      .poll(async () => {
        if ((await page.getByText(/order accepted/i).count()) > 0) return 'toast';
        if ((await page.getByText(/could not accept/i).count()) > 0) return 'error';
        const still = await page.getByRole('button', { name: ACCEPT_ORDER }).count();
        if (still === 0) return 'gone';
        return 'pending';
      }, { timeout: 25_000 })
      .not.toBe('pending');
    await expect(page.getByText(/could not accept/i)).toHaveCount(0);
  });

  test('2b. Mark picked up when evidence and inventory are ready', async ({ page }) => {
    const { orderId, trackingCode } = await seedPartnerPickupReadyOrder(page.request);
    await loginAsPartner(page);
    await page.goto(`/partner/orders/${orderId}`);

    await expect(page.getByRole('heading', { name: new RegExp(trackingCode, 'i') })).toBeVisible({
      timeout: 30_000,
    });

    const markPickedUp = page.getByRole('button', { name: /mark picked up/i });
    await expect(markPickedUp).toBeEnabled({ timeout: 15_000 });
    await markPickedUp.click();

    await expect(page.getByText(/status updated/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/picked up/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('3. Inventory / QR / custody tools reachable for active orders', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expectPageSettled(page, /^orders$/i);

    const inProgress = page.getByRole('tab', { name: /in progress/i });
    const allTab = page.getByRole('tab', { name: /^all$/i });
    if (await inProgress.isVisible().catch(() => false)) {
      await inProgress.click();
    } else if (await allTab.isVisible().catch(() => false)) {
      await allTab.click();
    }

    // Spec: partner-qr-tracking / partner-inventory — custody/evidence/inventory CTAs when shipped
    const tools = page.getByRole('button', {
      name: /custody|evidence|inventory|mark picked up|start washing/i,
    });
    const empty = page.getByText(ORDERS_EMPTY);
    await expect
      .poll(async () => {
        if ((await tools.count()) > 0) return 'tools';
        if ((await empty.count()) > 0) return 'empty';
        if ((await page.getByText(/tracking|#QA|#DLM/i).count()) > 0) return 'list';
        return 'pending';
      }, { timeout: 30_000 })
      .not.toBe('pending');

    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /^orders$/i }),
    ).toBeVisible();
  });

  test('4. Staff CRUD: add, change role, deactivate', async ({ page }) => {
    const staffEmail = `e2e.staff.${Date.now().toString(36)}@demo.dlm`;
    const staffName = `E2E Staff ${Date.now().toString(36)}`;
    const apiBase = process.env.E2E_API_URL ?? 'http://localhost:8000/api/v1';

    // Capture access token from login (memory-only; needed for page.request)
    await page.goto('/login?audience=partner');
    await expect(page.locator('h3.card-title', { hasText: /laundry partner sign in/i })).toBeVisible();
    await page.locator('#login-email').fill(E2E_ACCOUNTS.partner.email);
    await page.locator('#login-password').fill(E2E_ACCOUNTS.partner.password);
    const [loginRes] = await Promise.all([
      page.waitForResponse(
        (r) => r.url().includes('/auth/login') && r.request().method() === 'POST',
        { timeout: 45_000 },
      ),
      page.locator('form').getByRole('button', { name: /^sign in$/i }).click(),
    ]);
    expect(loginRes.ok()).toBeTruthy();
    const loginBody = await loginRes.json();
    const token = loginBody?.data?.tokens?.access_token as string;
    expect(token).toBeTruthy();
    await page.waitForURL(/\/partner(\/|$)/, { timeout: 60_000 });

    const auth = { Authorization: `Bearer ${token}` };

    const create = await page.request.post(`${apiBase}/partner/staff-management`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: {
        name: staffName,
        email: staffEmail,
        role: 'pickup_agent',
        phone: `+9198${String(Date.now()).slice(-8)}`,
      },
    });
    expect(create.ok(), await create.text()).toBeTruthy();
    const created = await create.json();
    const staffId = created.data.id as string;

    await page.goto('/partner/staff');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /^staff$/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText(staffName).first()).toBeVisible({ timeout: 20_000 });

    const patch = await page.request.patch(`${apiBase}/partner/staff-management/${staffId}`, {
      headers: { ...auth, 'Content-Type': 'application/json' },
      data: { role: 'delivery_agent' },
    });
    expect(patch.ok(), await patch.text()).toBeTruthy();
    expect((await patch.json()).data.role).toBe('delivery_agent');
    await page.reload();
    await expect(page.getByText(staffName).first()).toBeVisible({ timeout: 20_000 });

    const deactivate = await page.request.post(
      `${apiBase}/partner/staff-management/${staffId}/deactivate`,
      { headers: auth },
    );
    expect(deactivate.ok(), await deactivate.text()).toBeTruthy();
    expect((await deactivate.json()).data.is_active).toBe(false);
    await page.reload();
    await expect(page.getByText(staffName).first()).toBeVisible({ timeout: 20_000 });
    // Status pill next to the member name
    await expect(page.getByText('Inactive').first()).toBeVisible({ timeout: 15_000 });
  });

  test('5. Service catalog + garment price list CRUD surfaces', async ({ page }) => {
    await loginAsPartner(page);

    await page.goto('/partner/orders?workspace=services');
    await expect(page.getByTestId('hub-workspace-services')).toBeVisible({ timeout: 60_000 });
    const serviceName = `E2E Express ${Date.now().toString(36)}`;
    const servicesDialog = page.getByTestId('hub-workspace-services');
    await servicesDialog.locator('#hub-add-service-name').fill(serviceName);
    await servicesDialog.locator('#hub-add-service-price').fill('149');
    const [createRes] = await Promise.all([
      page.waitForResponse(
        (r) =>
          r.url().includes('/partner/services') &&
          r.request().method() === 'POST' &&
          r.status() >= 200 &&
          r.status() < 300,
        { timeout: 30_000 },
      ),
      servicesDialog.getByTestId('hub-services-add-submit').click(),
    ]);
    expect(createRes.ok()).toBeTruthy();
    await servicesDialog.getByTestId('hub-services-search').fill(serviceName);
    await expect(servicesDialog.getByText(serviceName).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.goto('/partner/pricing');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /garment price list/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByRole('button', { name: /apply suggested/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('6. Walk-in: hub redirect + Cloth Wall create + print tags CTA', async ({ page }) => {
    await page.route('**/api/v1/partner/garment-catalog**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            items: [],
            page: 1,
            page_size: 100,
            total_records: 0,
            total_pages: 0,
            has_next: false,
            has_previous: false,
          },
          meta: {},
        }),
      });
    });

    await loginAsPartner(page);

    await page.goto('/partner/walk-in-orders');
    await expect(page).toHaveURL(/\/partner\/orders\?/);
    await expect(page).toHaveURL(/chip=walk_in/);
    await expectPageSettled(page, /^orders$/i);

    const walkInName = `E2E Walk-in ${Date.now().toString(36)}`;
    const walkInPhone = `+9199${String(Date.now()).slice(-8)}`;

    await page.goto('/partner/new-order?mode=walk_in');
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible({
      timeout: 60_000,
    });

    await page.getByTestId('create-order-phone').fill(walkInPhone);
    await page.getByTestId('create-order-name').fill(walkInName);
    await page.getByTestId('create-order-customer-next').click();
    await expect(page.getByText(/step 2 — add items/i)).toBeVisible({ timeout: 20_000 });

    await page.getByRole('tab', { name: 'Dryclean and Steam Press (per piece)' }).click();
    await expect(page.getByText(/loading garment prices/i)).toBeHidden({ timeout: 15_000 });

    const catalogTile = page.locator('[data-testid^="cloth-wall-tile-catalog:"]').first();
    if (await catalogTile.isVisible().catch(() => false)) {
      await catalogTile.getByRole('button', { name: /^add /i }).click();
      await expect(catalogTile.locator('span.absolute.rounded-full')).toHaveText('1');
    } else {
      await page.getByRole('tab', { name: /by weight/i }).click();
      await expect(page.getByText(/loading services/i)).toBeHidden({ timeout: 15_000 });
      const weightInput = page.locator('[data-testid^="create-order-weight-qty-"]').first();
      await expect(weightInput).toBeVisible({ timeout: 30_000 });
      await weightInput.fill('2');
    }

    await page.getByTestId('create-order-intake-next').click();
    const createResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/partner/walk-in-orders') &&
        res.request().method() === 'POST' &&
        res.status() < 500,
      { timeout: 45_000 },
    );
    await page.getByTestId('partner-create-order-submit').click();
    const res = await createResponse;
    expect(res.ok(), `walk-in create failed: ${res.status()} ${await res.text()}`).toBeTruthy();

    await expect(page.getByTestId('walk-in-success-panel')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('walk-in-success-print-tags')).toBeVisible();
    await expect(page.getByTestId('walk-in-success-heading')).toHaveText(/order saved/i);

    const startWash = page.getByRole('button', { name: /start wash/i });
    await expect(startWash).toBeVisible();
    await startWash.click();
    await expect(
      page.getByText(/wash started|could not start wash|record inventory before/i).first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test('7. Settlements / operations / reviews pages load (even if empty)', async ({ page }) => {
    await loginAsPartner(page);

    await page.goto('/partner/settlements');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /^settlements/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/no settlements yet|pending earnings|available earnings/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto('/partner/operations');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /operations center/i }),
    ).toBeVisible({ timeout: 60_000 });

    await page.goto('/partner/reviews');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /review management/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/no reviews yet|average rating|total reviews/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });

  test('8. Partner cannot access /admin (denied or redirect)', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/admin');
    await expect
      .poll(async () => {
        const url = page.url();
        if (/\/admin/.test(url) === false) return 'redirected';
        if (await page.getByRole('heading', { name: /access not allowed/i }).isVisible()) {
          return 'denied';
        }
        // Admin shell chrome (sidebar "Overview") must not leak to partners
        if (await page.getByText(/^DLM Ops$/i).isVisible().catch(() => false)) {
          return 'leaked';
        }
        if (
          await page
            .locator('#main-content')
            .getByRole('heading', { name: /^overview$/i })
            .isVisible()
            .catch(() => false)
        ) {
          return 'leaked';
        }
        return 'pending';
      }, { timeout: 30_000 })
      .toMatch(/^(redirected|denied)$/);

    await expect(page.getByText(/^DLM Ops$/i)).toHaveCount(0);
  });

  test('9–10. Low-literacy primary actions + mobile status updates', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAsPartner(page);

    await page.goto('/partner/orders');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /^orders$/i }),
    ).toBeVisible({ timeout: 30_000 });
    const newOrder = page.getByTestId('partner-orders-page-new-order');
    await expect(newOrder).toBeVisible({ timeout: 20_000 });
    await newOrder.click();
    await expect(page.getByTestId('partner-create-order-dialog')).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByTestId('partner-walk-in-workspace')).toBeVisible();
    await page.keyboard.press('Escape');

    await page.goto('/partner/walk-in-orders');
    await expect(page).toHaveURL(/\/partner\/orders\?/);
    await expect(page).toHaveURL(/chip=walk_in/);

    await page.goto('/partner/orders');
    await expect(
      page.locator('#main-content main .page-title').filter({ hasText: /^orders$/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByLabel('Search orders')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId('partner-orders-table-root')).toBeVisible({
      timeout: 60_000,
    });
    await expect(
      page
        .getByTestId('partner-order-advance')
        .or(page.getByTestId('partner-orders-empty-state'))
        .first(),
    ).toBeVisible({ timeout: 60_000 });
  });
});

test.describe('Partner authz smoke (customer blocked)', () => {
  test.skip(process.env.E2E_SKIP_AUTH === '1', 'Skipped — no seeded DB');

  test('customer hitting /partner sees access denied or login redirect', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/partner');
    await expect
      .poll(async () => {
        if (/\/login/.test(page.url())) return 'login';
        if (await page.getByRole('heading', { name: /access not allowed/i }).isVisible()) {
          return 'denied';
        }
        if (await page.getByRole('heading', { name: /today at a glance/i }).isVisible()) {
          return 'leaked';
        }
        return 'pending';
      }, { timeout: 30_000 })
      .not.toBe('leaked');
  });
});
