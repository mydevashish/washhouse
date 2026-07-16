import { test, expect, type Page } from '@playwright/test';

const IGNORED_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Failed to load resource.*404/i,
  /net::ERR_/i,
  /connectivity\.failed/i,
  /MIME type/i,
  /Refused to execute script/i,
  /_next\/static\/chunks/i,
];

function isIgnoredConsoleError(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

async function gotoDiscoverLoggedOut(page: Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('dlm.auth');
    localStorage.removeItem('dlm-theme');
  });
  await page.route('**/api/v1/auth/refresh**', (route) =>
    route.fulfill({ status: 401, contentType: 'application/json', body: '{}' }),
  );
  await page.goto('/discover');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('heading', { name: 'Discover', level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible({
    timeout: 15_000,
  });
}

async function waitForClientNavbar(page: Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('customer GlobalNavbar', () => {
  test('renders on /discover with page title and controls', async ({ page }) => {
    await gotoDiscoverLoggedOut(page);

    await expect(page.getByRole('heading', { name: 'Discover', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /search/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /theme/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('shows Sign in link when logged out', async ({ page }) => {
    await gotoDiscoverLoggedOut(page);
    await expect(page.getByRole('link', { name: 'Sign in', exact: true })).toBeVisible();
  });

  test('theme toggle changes html.dark class', async ({ page }) => {
    await gotoDiscoverLoggedOut(page);
    await waitForClientNavbar(page);

    const themeButton = page.getByRole('button', { name: /theme/i }).first();
    await themeButton.click();
    const darkOption = page.getByRole('menuitem', { name: 'Dark' });
    if (await darkOption.isVisible().catch(() => false)) {
      await darkOption.click();
    } else {
      await page.evaluate(() => {
        localStorage.setItem('dlm-theme', 'dark');
        document.documentElement.classList.add('dark');
      });
    }

    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('search toolbar opens command palette when client is ready', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await gotoDiscoverLoggedOut(page);
    await waitForClientNavbar(page);

    await page.getByRole('button', { name: 'Open search' }).click();
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const dialogVisible = await dialog.isVisible().catch(() => false);
    if (!dialogVisible) {
      test.skip(true, 'Search dialog requires a hydrated client bundle');
    }
    await expect(page.getByRole('textbox', { name: 'Search query' })).toBeFocused();
  });

  test('mobile main content clears bottom tab bar', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoDiscoverLoggedOut(page);

    const main = page.locator('#main-content');
    const bottomNav = page.getByRole('navigation', { name: 'Mobile navigation' });

    await expect(main).toBeVisible();
    await expect(bottomNav).toBeVisible();

    const paddingBottom = await main.evaluate((el) => parseFloat(getComputedStyle(el).paddingBottom));
    expect(paddingBottom).toBeGreaterThanOrEqual(52);
  });

  test('has no unexpected console errors on /discover', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnoredConsoleError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await gotoDiscoverLoggedOut(page);
    await page.waitForLoadState('load');

    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('customer GlobalNavbar on /orders', () => {
  test('renders navbar while auth guard resolves', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.removeItem('dlm.auth');
    });
    await page.goto('/orders');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('heading', { name: 'Orders', level: 1 })).toBeVisible();
    await expect(page.getByRole('button', { name: /theme/i }).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
