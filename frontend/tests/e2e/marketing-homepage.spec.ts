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
        name: /transparent pricing\. same rates at every store/i,
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
    await expect(page.getByText(/compare stores/i)).toHaveCount(0);  });

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

  test('Request brochure from home franchise teaser downloads franchise PDF', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const teaser = page.getByRole('region', { name: /become a the washhouse partner/i });
    await teaser.scrollIntoViewIfNeeded();

    const brochureLink = teaser.getByRole('link', { name: /request brochure/i });
    await expect(brochureLink).toHaveAttribute('href', '/brochures/washhouse-franchise.pdf');
    await expect(brochureLink).toHaveAttribute('download', 'washhouse-franchise.pdf');

    const downloadPromise = page.waitForEvent('download');
    await brochureLink.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/washhouse-franchise\.pdf/i);
  });

  test('Request brochure from franchise page downloads franchise PDF', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/franchise');
    await page.waitForLoadState('domcontentloaded');

    const brochureLink = page.getByRole('link', { name: /request brochure/i }).first();
    await expect(brochureLink).toHaveAttribute('href', '/brochures/washhouse-franchise.pdf');
    await expect(brochureLink).toHaveAttribute('download', 'washhouse-franchise.pdf');

    const downloadPromise = page.waitForEvent('download');
    await brochureLink.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/washhouse-franchise\.pdf/i);
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

test.describe('marketing homepage services preview', () => {
  function servicesSection(page: import('@playwright/test').Page) {
    return page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: /our laundry services/i }) });
  }

  function visibleServiceCard(
    page: import('@playwright/test').Page,
    title: RegExp,
  ) {
    return servicesSection(page)
      .locator('li')
      .filter({ has: page.getByRole('heading', { name: title }) })
      .filter({ visible: true });
  }

  test('More Services has View services CTA to /services, not Book Now', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const moreCard = visibleServiceCard(page, /^more services$/i);
    await expect(moreCard).toHaveCount(1);
    await expect(moreCard.getByRole('link', { name: /book now/i })).toHaveCount(0);

    const viewServices = moreCard.getByRole('link', { name: /view services/i });
    await expect(viewServices).toBeVisible();
    await expect(viewServices).toHaveAttribute('href', '/services');
  });

  test('Wash & Fold Book Now opens pickup dialog', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const washCard = visibleServiceCard(page, /^wash & fold$/i);
    await expect(washCard).toHaveCount(1);

    const bookNow = washCard.getByRole('link', { name: /book now/i });
    await expect(bookNow).toBeVisible();
    await bookNow.click();

    const dialog = page.getByTestId('book-now-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByLabel(/^service/i)).toHaveValue('wash-fold');
  });
});

test.describe('marketing Book Now dialog', () => {
  test('navbar Book Now opens dialog without leaving the page', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('banner').getByRole('button', { name: /^book now$/i }).click();

    const dialog = page.getByTestId('book-now-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/(\?|$)/);
  });

  test('?book=1 deep link opens the dialog', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/?book=1');
    await page.waitForLoadState('domcontentloaded');

    const dialog = page.getByTestId('book-now-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByRole('heading', { name: /schedule a pickup/i })).toBeVisible();
  });

  test('Book Now submit happy path posts contact lead and closes dialog', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    await page.route('**/api/v1/marketing/contact', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          data: { id: '11111111-1111-4111-8111-111111111111', status: 'received' },
          meta: {},
        }),
      });
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('banner').getByRole('button', { name: /^book now$/i }).click();

    const dialog = page.getByTestId('book-now-dialog');
    await expect(dialog).toBeVisible({ timeout: 15_000 });

    await dialog.getByLabel(/your name/i).fill('Playwright Tester');
    await dialog.getByLabel(/^phone/i).fill('+919876543210');
    await dialog.getByLabel(/^service/i).selectOption('wash-fold');
    await dialog.getByLabel(/preferred pickup time/i).selectOption('morning');
    await dialog.getByLabel(/notes/i).fill('Near metro, doorbell works.');

    const requestPromise = page.waitForRequest(
      (req) =>
        req.url().includes('/api/v1/marketing/contact') && req.method() === 'POST',
    );

    await dialog.getByRole('button', { name: /schedule pickup/i }).click();

    const request = await requestPromise;
    const body = request.postDataJSON() as {
      name: string;
      phone: string;
      subject: string;
      message: string;
    };
    expect(body.name).toBe('Playwright Tester');
    expect(body.subject).toBe('order-help');
    expect(body.message).toMatch(/Wash & Fold/i);
    expect(body.message).toMatch(/Morning/i);

    await expect(dialog).toBeHidden({ timeout: 10_000 });
  });
});

test.describe('marketing stores directory', () => {
  test('/stores is a simple name + city directory without compare chrome', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/stores');
    await page.waitForLoadState('domcontentloaded');

    await expect(
      page.getByRole('heading', { name: /find a washhouse store near you/i }),
    ).toBeVisible();
    await expect(
      page.getByText(/services and pricing are shared across stores/i).first(),
    ).toBeVisible();
    await expect(page.getByRole('heading', { name: /washhouse stores/i })).toBeVisible();

    // No compare / filter / price chrome from the old discovery-style stores UI
    await expect(page.getByText(/compare/i)).toHaveCount(0);
    await expect(page.getByText(/from ₹/i)).toHaveCount(0);
    await expect(page.getByText(/free pickup/i)).toHaveCount(0);
    await expect(page.getByRole('button', { name: /filters/i })).toHaveCount(0);
    await expect(page.getByLabel(/min rating|max distance|sort by/i)).toHaveCount(0);

    await expect(page.getByLabel(/search laundries/i)).toBeVisible();

    const directory = page.getByRole('list', { name: /washhouse partner stores/i });
    const empty = page.getByRole('heading', { name: /no stores/i });
    await expect(directory.or(empty)).toBeVisible({ timeout: 15_000 });
  });
});
