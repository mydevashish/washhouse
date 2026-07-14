import { test, expect } from '@playwright/test';

const IGNORED_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Failed to load resource.*404/i,
  /net::ERR_/i,
];

function isIgnoredConsoleError(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

test.describe('marketing homepage smoke', () => {
  test('homepage loads with hero and key sections', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /clean clothes\. happy life/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: /promotional highlights/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /how it works/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /why choose us/i })).toBeVisible();
  });

  test('hero carousel navigates with next control and dots', async ({ page }) => {
    await page.goto('/');
    const carousel = page.getByRole('region', { name: /promotional highlights/i });

    await expect(
      carousel.getByRole('heading', { name: /clean clothes\. happy life/i }),
    ).toBeVisible();

    await page.getByRole('button', { name: /next slide/i }).click();
    await expect(
      carousel.getByRole('heading', { name: /expert care for every fabric/i }),
    ).toBeVisible();

    await page.getByRole('tab', { name: /go to slide 4: we pick/i }).click();
    await expect(
      carousel.getByRole('heading', { name: /we pick\. we clean\. we deliver/i }),
    ).toBeVisible();
  });

  test('homepage has no unexpected console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnoredConsoleError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: /next slide/i })).toBeVisible();

    expect(errors, errors.join('\n')).toEqual([]);
  });

  test('dark mode renders homepage without console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnoredConsoleError(msg.text())) {
        errors.push(msg.text());
      }
    });

    await page.addInitScript(() => {
      localStorage.setItem('dlm-theme', 'dark');
      document.documentElement.classList.add('dark');
    });

    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: /next slide/i })).toBeVisible();

    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(
      page.getByRole('heading', { name: /clean clothes\. happy life/i }),
    ).toBeVisible();
    expect(errors, errors.join('\n')).toEqual([]);
  });
});

test.describe('staff portal access', () => {
  test('navbar links to staff portal on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const staffLink = page.getByRole('link', { name: /staff login/i });
    await expect(staffLink).toBeVisible();
    await staffLink.click();
    await expect(page).toHaveURL(/\/staff$/);
    await expect(page.getByRole('heading', { name: /staff portal/i })).toBeVisible();
  });

  test('staff portal offers laundry and admin login', async ({ page }) => {
    await page.goto('/staff');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.getByRole('link', { name: /laundry login/i }).first()).toHaveAttribute(
      'href',
      '/login?audience=partner',
    );
    await expect(page.getByRole('link', { name: /admin login/i }).first()).toHaveAttribute(
      'href',
      '/login?audience=admin',
    );
  });

  test('homepage partner strip links to staff portal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const partnerHeading = page.getByRole('heading', { name: /already onboarded/i });
    await partnerHeading.scrollIntoViewIfNeeded();
    await expect(partnerHeading).toBeVisible();

    await expect(page.getByRole('link', { name: /open portal/i })).toHaveAttribute(
      'href',
      '/staff',
    );
  });
});

test.describe('marketing contact form', () => {
  test('contact form validates required fields on submit', async ({ page }) => {
    await page.goto('/contact');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByRole('alert').first()).toBeVisible();
    await expect(page.getByText(/name is required/i)).toBeVisible();
    await expect(page.getByText(/phone is required/i)).toBeVisible();
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });

  test('contact form rejects invalid phone', async ({ page }) => {
    await page.goto('/contact');
    await page.getByLabel(/your name/i).fill('Test User');
    await page.getByLabel(/^phone/i).fill('12345');
    await page.getByLabel(/^message/i).fill('This is a test message for validation.');
    await page.getByRole('button', { name: /send message/i }).click();

    await expect(page.getByText(/valid mobile number/i)).toBeVisible();
  });
});

test.describe('mobile sticky CTA', () => {
  test('sticky CTA is visible at top of homepage on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const stickyCta = page.locator('[data-marketing-sticky-cta].fixed');
    await expect(stickyCta).toBeVisible();
    await expect(stickyCta.getByRole('link', { name: /book on whatsapp/i })).toBeVisible();
    await expect(stickyCta.getByRole('link', { name: /call now/i })).toBeVisible();
    await expect(stickyCta).not.toHaveClass(/opacity-0/);
  });

  test('sticky CTA hides when final CTA band scrolls into view', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const stickyCta = page.locator('[data-marketing-sticky-cta].fixed');
    await expect(stickyCta).toBeVisible();

    await page.locator('[data-marketing-bottom-cta]').scrollIntoViewIfNeeded();
    await expect(stickyCta).toHaveClass(/opacity-0/);
  });
});
