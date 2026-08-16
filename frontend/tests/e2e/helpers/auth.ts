import { expect, type Page } from '@playwright/test';

export type AuthCredentials = {
  email: string;
  password: string;
};

/** Demo/seed accounts — override via E2E_* env vars when needed. */
export const E2E_ACCOUNTS = {
  customer: {
    email: process.env.E2E_CUSTOMER_EMAIL ?? 'customer@demo.dlm',
    password: process.env.E2E_CUSTOMER_PASSWORD ?? 'Customer@1234',
  },
  partner: {
    email: process.env.E2E_PARTNER_EMAIL ?? 'partner.koramangala@demo.dlm',
    password: process.env.E2E_PARTNER_PASSWORD ?? 'Partner@1234',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? 'admin@demo.dlm',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'Admin@1234',
  },
} as const;

async function fillEmailLogin(page: Page, creds: AuthCredentials) {
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 30_000 });
  await page.locator('#login-email').fill(creds.email);
  await page.locator('#login-password').fill(creds.password);
  const submit = page.locator('form').getByRole('button', { name: /^sign in$/i });
  await expect(submit).toBeEnabled();
  const [loginResponse] = await Promise.all([
    page.waitForResponse(
      (res) => res.url().includes('/auth/login') && res.request().method() === 'POST',
      { timeout: 60_000 },
    ),
    submit.click(),
  ]);
  expect(
    loginResponse.ok(),
    `login failed: ${loginResponse.status()} ${await loginResponse.text().catch(() => '')}`,
  ).toBeTruthy();
}

async function expectLoginCard(page: Page, title: RegExp) {
  // Navbar also shows a page title heading — prefer the auth card title.
  await expect(page.locator('h3.card-title', { hasText: title })).toBeVisible({
    timeout: 30_000,
  });
}

/**
 * Customer: `/login` → post-login discover (or `/account` when requesting account).
 */
export async function loginAsCustomer(
  page: Page,
  creds: AuthCredentials = E2E_ACCOUNTS.customer,
  options?: { gotoAccount?: boolean },
) {
  await page.goto('/login');
  // `/login` defaults to partner card copy — customer credentials still use the same form.
  await expect(page.locator('#login-email')).toBeVisible({ timeout: 30_000 });
  await fillEmailLogin(page, creds);
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 60_000 });
  if (options?.gotoAccount) {
    await page.goto('/account');
    await expect(page).toHaveURL(/\/account/);
  }
}

/**
 * Partner: `/login?audience=partner` → `/partner`.
 */
export async function loginAsPartner(
  page: Page,
  creds: AuthCredentials = E2E_ACCOUNTS.partner,
) {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto('/login?audience=partner', { waitUntil: 'domcontentloaded' });
    try {
      await expect(page.locator('#login-email')).toBeVisible({ timeout: 20_000 });
      await fillEmailLogin(page, creds);
      await page.waitForURL(/\/partner(\/|$)/, { timeout: 60_000 });
      await expect(page.locator('[data-partner-shell]')).toBeVisible({ timeout: 60_000 });
      return;
    } catch (error) {
      if (attempt === 1) throw error;
    }
  }
}

/**
 * Admin: `/login?audience=admin` → `/admin`.
 */
export async function loginAsAdmin(
  page: Page,
  creds: AuthCredentials = E2E_ACCOUNTS.admin,
) {
  await page.goto('/login?audience=admin');
  await expectLoginCard(page, /^admin sign in$/i);
  await fillEmailLogin(page, creds);
  await page.waitForURL(/\/admin(\/|$)/, { timeout: 60_000 });
  await expect(page.getByRole('heading', { name: /^overview$/i }).first()).toBeVisible({
    timeout: 60_000,
  });
}

/** Open account menu and click Log out; expect redirect away from gated app. */
export async function logoutViaNavbar(page: Page) {
  await page.getByRole('button', { name: /account menu/i }).click();
  await page.getByRole('menuitem', { name: /log out/i }).click();
  await page.waitForURL(/\/(login|discover|$)/, { timeout: 30_000 });
}
