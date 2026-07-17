import { test, expect } from '@playwright/test';

const IGNORED_CONSOLE_PATTERNS = [
  /favicon\.ico/i,
  /Failed to load resource.*404/i,
  /net::ERR_/i,
];

function isIgnoredConsoleError(text: string): boolean {
  return IGNORED_CONSOLE_PATTERNS.some((pattern) => pattern.test(text));
}

test.describe('marketing homepage layout', () => {
  async function expectNoHorizontalOverflow(page: import('@playwright/test').Page) {
    const metrics = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
  }

  test('homepage has no horizontal overflow at 1280×800', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.getByRole('button', { name: /next slide/i })).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });

  test('homepage has no horizontal overflow at 390×844', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.waitForLoadState('load');
    await expect(page.locator('[data-marketing-sticky-cta].fixed')).toBeVisible();

    await expectNoHorizontalOverflow(page);
  });
});

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

test.describe('marketing navbar', () => {
  async function expectSingleActiveNavLink(
    page: import('@playwright/test').Page,
    navLabel: 'Main navigation' | 'Mobile navigation',
    linkName: string,
  ) {
    const nav = page.getByRole('navigation', { name: navLabel }).first();
    await expect(nav).toBeVisible();
    const activeLinks = nav.locator('a[aria-current="page"]');
    await expect(activeLinks).toHaveCount(1);
    await expect(activeLinks).toHaveText(linkName);
  }

  test('desktop nav shows only Services active on /services', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');

    await expectSingleActiveNavLink(page, 'Main navigation', 'Services');
  });

  test('desktop nav shows only Pricing active on /pricing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    await expectSingleActiveNavLink(page, 'Main navigation', 'Pricing');
  });

  test('mobile nav shows only Services active on /services', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expectSingleActiveNavLink(page, 'Mobile navigation', 'Services');
  });

  test('mobile nav shows only Pricing active on /pricing', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('nav[aria-label="Main navigation"] a[aria-current="page"]')).toHaveText(
      'Pricing',
    );

    await page.getByRole('button', { name: /open menu/i }).click();
    await expectSingleActiveNavLink(page, 'Mobile navigation', 'Pricing');
  });

  test('desktop nav link Services navigates to /services', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Services' })
      .click();

    await expect(page).toHaveURL(/\/services$/);
    await expect(
      page.getByRole('heading', { name: /laundry services, explained/i }),
    ).toBeVisible();
  });

  test('mobile hamburger Services navigates to /services', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /open menu/i }).click();
    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Services' })
      .click();

    await expect(page).toHaveURL(/\/services$/);
  });

  test('Pricing link navigates to /pricing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Pricing' })
      .click();

    await expect(page).toHaveURL(/\/pricing$/);
    await expect(
      page.getByRole('heading', {
        name: /transparent pricing\. every laundry sets their own rates/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/starting from/i).first()).toBeVisible();
    await expect(
      page.getByRole('heading', { name: /price guide by category/i }),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /^men$/i })).toBeVisible();
    // Hanging tags (default motion) or reduced-motion tables both expose “from ₹”
    await expect(page.getByText(/from ₹/i).first()).toBeVisible();
    const firstTag = page.locator('.pricing-price-tag').first();
    if (await firstTag.count()) {
      await expect(firstTag).toBeVisible();
      await expect(firstTag).toHaveAttribute('tabindex', '0');
      await expect(firstTag).toHaveAttribute('aria-label', /starting from/i);
    }
    await expect(
      page.getByRole('link', { name: /browse stores/i }).first(),
    ).toBeVisible();
  });

  test('Pricing from Services navigates to /pricing', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');

    await page
      .getByRole('navigation', { name: 'Main navigation' })
      .getByRole('link', { name: 'Pricing' })
      .click();

    await expect(page).toHaveURL(/\/pricing$/);
    await expectSingleActiveNavLink(page, 'Main navigation', 'Pricing');
  });

  test('mobile Pricing navigates to /pricing and marks active', async ({ page }) => {
    await page.setViewportSize({ width: 412, height: 915 });
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('button', { name: /open menu/i }).click();
    await expectSingleActiveNavLink(page, 'Mobile navigation', 'Services');

    await page
      .getByRole('navigation', { name: 'Mobile navigation' })
      .getByRole('link', { name: 'Pricing' })
      .click();

    await expect(page).toHaveURL(/\/pricing$/);
    await page.getByRole('button', { name: /open menu/i }).click();
    await expectSingleActiveNavLink(page, 'Mobile navigation', 'Pricing');
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

  test('Request brochure from home franchise teaser opens Contact with Franchise subject', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const teaser = page.getByRole('region', { name: /become a the washhouse partner/i });
    await teaser.scrollIntoViewIfNeeded();
    await teaser.getByRole('link', { name: /request brochure/i }).click();

    await expect(page).toHaveURL(/\/contact\?subject=franchise/);
    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.locator('#contact-subject')).toHaveValue('franchise');
  });

  test('Request brochure from franchise page opens Contact with Franchise subject', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/franchise');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /request brochure/i }).first().click();

    await expect(page).toHaveURL(/\/contact\?subject=franchise/);
    await expect(page.locator('#contact-form')).toBeVisible();
    await expect(page.locator('#contact-subject')).toHaveValue('franchise');
  });

  test('direct /contact?subject=franchise pre-selects Franchise', async ({ page }) => {
    await page.goto('/contact?subject=franchise#contact-form');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('#contact-subject')).toHaveValue('franchise');
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
