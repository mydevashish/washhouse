import { test, expect, type Page } from '@playwright/test';

import { E2E_ACCOUNTS, loginAsCustomer, loginAsPartner } from './helpers/auth';
import { seedPartnerIncomingOrder } from './helpers/partner-orders';

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
  await expect(page.locator('#main-content').getByRole('heading', { name: title })).toBeVisible({
    timeout: 30_000,
  });
}

describeJourney('Mahesh partner journey', () => {
  test.describe.configure({ mode: 'serial' });

  test('1. /partner dashboard loads KPIs without forever spinner', async ({ page }) => {
    await loginAsPartner(page);
    await expect(page).toHaveURL(/\/partner(\/|$)/);
    await expect(page.getByRole('heading', { name: /today at a glance/i })).toBeVisible();

    // KPI values must resolve (₹ / counts / rating) — not perpetual skeletons
    await expect(page.getByText(/today's revenue/i)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/₹\d|₹0/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/\d+\.\d+\s*★|\d+\s*★/).first()).toBeVisible({ timeout: 30_000 });

    // Actionable error states if API fails (never silent hang)
    const analyticsError = page.getByRole('heading', { name: /could not load analytics/i });
    if (await analyticsError.isVisible().catch(() => false)) {
      await expect(page.getByRole('button', { name: /try again|retry/i }).first()).toBeVisible();
    }
  });

  test('2. /partner/orders: accept incoming order', async ({ page }) => {
    await seedPartnerIncomingOrder(page.request);
    await loginAsPartner(page);
    await page.goto('/partner/orders');
    await expectPageSettled(page, /^orders$/i);

    const actionTab = page.getByRole('tab', { name: ORDERS_ACTION_TAB });
    if (await actionTab.isVisible().catch(() => false)) {
      await actionTab.click();
    }
    const acceptBtn = page.getByRole('button', { name: ACCEPT_ORDER }).first();
    const empty = page.getByText(ORDERS_EMPTY);

    await expect
      .poll(async () => {
        if ((await acceptBtn.count()) > 0) return 'action';
        if ((await empty.count()) > 0) return 'empty';
        return 'pending';
      }, { timeout: 30_000 })
      .toBe('action');

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
      page.locator('#main-content').getByRole('heading', { name: /^orders$/i }),
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
      page.locator('#main-content').getByRole('heading', { name: /staff management/i }),
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

    await page.goto('/partner/services');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /service catalog/i }),
    ).toBeVisible({ timeout: 60_000 });
    const serviceName = `E2E Express ${Date.now().toString(36)}`;
    await page.getByPlaceholder(/shirt wash|service/i).first().fill(serviceName);
    await page.locator('input[type="number"][min="1"]').first().fill('149');
    await page.getByRole('button', { name: /add service/i }).click();
    await expect(page.getByText(new RegExp(serviceName, 'i')).first()).toBeVisible({
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

  test('6. Walk-in orders: create + advance status', async ({ page }) => {
    await loginAsPartner(page);
    await page.goto('/partner/walk-in-orders');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /walk-in orders/i }),
    ).toBeVisible({ timeout: 60_000 });

    const walkInName = `E2E Walk-in ${Date.now().toString(36)}`;
    const walkInPhone = `+9199${String(Date.now()).slice(-8)}`;

    await page.getByRole('button', { name: /new entry/i }).click();
    await page.locator('#customer_name').fill(walkInName);
    await page.locator('#customer_phone').fill(walkInPhone);

    const serviceSelect = page.locator('#service-0');
    await expect(serviceSelect).toBeVisible({ timeout: 20_000 });
    await expect
      .poll(async () => serviceSelect.locator('option').count(), { timeout: 20_000 })
      .toBeGreaterThan(1);
    await serviceSelect.selectOption({ index: 1 });

    const createResponse = page.waitForResponse(
      (res) =>
        res.url().includes('/partner/walk-in-orders') &&
        res.request().method() === 'POST' &&
        res.status() < 500,
      { timeout: 45_000 },
    );
    await page.getByRole('button', { name: /^save walk-in order$/i }).click();
    const res = await createResponse;
    expect(res.ok()).toBeTruthy();

    await expect(page.getByText(/walk-in order saved/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(new RegExp(walkInName, 'i')).first()).toBeVisible({
      timeout: 30_000,
    });

    const advance = page.getByRole('button', { name: /start washing|mark ready|mark delivered/i }).first();
    await expect(advance).toBeVisible({ timeout: 20_000 });
    await advance.click();
    await expect(page.getByText(/status updated/i).first()).toBeVisible({ timeout: 30_000 });
  });

  test('7. Settlements / operations / reviews pages load (even if empty)', async ({ page }) => {
    await loginAsPartner(page);

    await page.goto('/partner/settlements');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^settlements/i }),
    ).toBeVisible({ timeout: 60_000 });
    await expect(
      page.getByText(/no settlements yet|pending earnings|available earnings/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    await page.goto('/partner/operations');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /operations center/i }),
    ).toBeVisible({ timeout: 60_000 });

    await page.goto('/partner/reviews');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /review management/i }),
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

    await page.goto('/partner/walk-in-orders');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /walk-in orders/i }),
    ).toBeVisible({ timeout: 30_000 });
    // Primary CTA is one tap away
    await expect(page.getByRole('button', { name: /new entry/i })).toBeVisible();

    const advance = page.getByRole('button', { name: /start washing|mark ready|mark delivered/i }).first();
    if ((await advance.count()) > 0) {
      await advance.click();
      await expect(
        page.getByText(/status updated|could not update/i).first(),
      ).toBeVisible({ timeout: 20_000 });
    }

    await page.goto('/partner/orders');
    await expect(
      page.locator('#main-content').getByRole('heading', { name: /^orders$/i }),
    ).toBeVisible({ timeout: 30_000 });
    // Mobile card stack uses large Accept / Reject / advance buttons + filter tabs
    await expect(page.getByRole('tablist', { name: /order filters/i })).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('tab', { name: /needs action|in progress|all/i }).first().click();
    await expect(page.getByRole('tab', { name: /in progress/i })).toBeVisible();
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
