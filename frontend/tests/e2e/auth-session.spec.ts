import { test, expect } from '@playwright/test';

import {
  loginAsAdmin,
  loginAsCustomer,
  loginAsPartner,
  logoutViaNavbar,
} from './helpers/auth';

/**
 * Auth session smoke — requires local API + QA seed (`seed_qa.py`).
 * Skip automatically when E2E_SKIP_AUTH=1 (CI without seeded DB).
 */
const describeAuth = process.env.E2E_SKIP_AUTH === '1' ? test.describe.skip : test.describe;

describeAuth('auth session smoke (customer / partner / admin)', () => {
  test.describe.configure({ mode: 'serial' });

  test('customer login reaches account and can log out', async ({ page }) => {
    await loginAsCustomer(page, undefined, { gotoAccount: true });
    await expect(page.getByRole('heading', { name: /^account$/i })).toBeVisible();
    await logoutViaNavbar(page);
    await page.goto('/account');
    await expect(page.getByRole('link', { name: /^sign in$/i })).toBeVisible({ timeout: 30_000 });
  });

  test('partner login reaches /partner and can log out', async ({ page }) => {
    await loginAsPartner(page);
    await expect(page).toHaveURL(/\/partner/);
    await logoutViaNavbar(page);
    await page.goto('/partner');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test('admin login reaches /admin and can log out', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page).toHaveURL(/\/admin/);
    await logoutViaNavbar(page);
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 });
  });

  test('wrong password shows clear error toast', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#login-email').fill('customer@demo.dlm');
    await page.locator('#login-password').fill('DefinitelyWrong1!');
    await page.getByRole('button', { name: /^sign in$/i }).click();
    await expect(page.getByText(/invalid|incorrect|credentials|password/i).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(page).toHaveURL(/\/login/);
  });

  test('register is customer-only and links to login + staff', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /^create account$/i })).toBeVisible();
    await expect(page).toHaveTitle(/create account · washhouse/i);
    await expect(page.locator('#reg-name')).toBeVisible();
    await expect(page.locator('#reg-email')).toBeVisible();
    await expect(page.locator('#reg-password')).toBeVisible();
    await expect(page.getByRole('tablist')).toHaveCount(0);
    await expect(page.getByRole('link', { name: /^sign in$/i })).toHaveAttribute('href', '/login');
    await expect(page.getByRole('link', { name: /laundry or admin\?/i })).toHaveAttribute(
      'href',
      '/staff',
    );
  });

  test('customer cannot stay on /admin (access denied or redirect)', async ({ page }) => {
    await loginAsCustomer(page);
    await page.goto('/admin');
    const denied = page.getByRole('heading', { name: /access not allowed/i });
    const login = page.getByRole('heading', { name: /sign in|admin sign in/i });
    await expect(denied.or(login)).toBeVisible({ timeout: 30_000 });
  });
});
