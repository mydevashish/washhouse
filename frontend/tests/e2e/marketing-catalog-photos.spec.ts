import { test, expect, type Locator, type Page } from '@playwright/test';

const CATALOG_ROUTES = ['/', '/pricing', '/services'] as const;

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));

  expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.clientWidth);
}

async function waitForCatalogImageComplete(img: Locator) {
  await expect(img).toBeVisible();
  await img.evaluate((el: HTMLImageElement) => {
    if (el.complete) {
      if (el.naturalWidth > 0) return;
      throw new Error('catalog image failed to decode');
    }
    return new Promise<void>((resolve, reject) => {
      const done = () => resolve();
      el.addEventListener('load', done, { once: true });
      el.addEventListener('error', () => reject(new Error('catalog image failed to load')), {
        once: true,
      });
    });
  });
}

function catalogImageLocator(scope: Page | Locator) {
  // next/image encodes paths as %2Fcatalog%2F… — match either form.
  return scope.locator('img[src*="catalog"]');
}

async function waitForAnyCatalogImage(page: Page) {
  await expect(async () => {
    let img = catalogImageLocator(page).first();
    if ((await catalogImageLocator(page).count()) === 0) {
      await page.mouse.wheel(0, 720);
      throw new Error('catalog image not in DOM yet — scrolling');
    }

    try {
      await waitForCatalogImageComplete(img);
    } catch {
      await img.scrollIntoViewIfNeeded();
      await waitForCatalogImageComplete(img);
    }
  }).toPass({ timeout: 20_000 });
}

async function expectCatalogImageOnPage(page: Page) {
  await waitForAnyCatalogImage(page);

  const catalogImg = catalogImageLocator(page).first();
  const src = await catalogImg.getAttribute('src');
  expect(src, 'catalog images must use local /catalog/ WebP assets').toBeTruthy();
  expect(decodeURIComponent(src!)).toMatch(/\/catalog\/.+\.webp/);
}

test.describe('marketing catalog photos', () => {
  for (const route of CATALOG_ROUTES) {
    test(`loads at least one catalog image on ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      await expectCatalogImageOnPage(page);
    });
  }

  test('pricing rack scroll syncs product photo src', async ({ page }) => {
    test.setTimeout(45_000);

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/pricing');
    await page.waitForLoadState('domcontentloaded');

    const menHeading = page.getByRole('heading', { name: /^men$/i });
    await menHeading.scrollIntoViewIfNeeded();
    await expect(menHeading).toBeVisible();

    const rack = page.locator('.pricing-category-rack').filter({
      has: page.getByRole('heading', { name: /^men$/i }),
    });
    const scroller = rack.locator('.pricing-rack-scroller');
    const photo = rack.locator('.pricing-category-photo__layer--front img');

    await waitForCatalogImageComplete(photo);

    const canScroll = await scroller.evaluate(
      (el) => el.scrollWidth > el.clientWidth + 8,
    );
    expect(canScroll, 'Men rack must overflow so scroll can change the spotlight').toBe(true);

    const initialSrc = await photo.getAttribute('src');
    expect(initialSrc).toBeTruthy();

    await scroller.locator('[data-rack-item="8"]').scrollIntoViewIfNeeded();

    await expect
      .poll(async () => photo.getAttribute('src'), {
        message: 'rack photo src should change after scrolling price tags',
        timeout: 15_000,
      })
      .not.toBe(initialSrc);
  });
});

test.describe('marketing catalog photos — mobile overflow', () => {
  test('375px — no horizontal overflow at services and special-care scrollers', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const servicesStrip = page.getByRole('region', {
      name: /browse our laundry services/i,
    });
    await servicesStrip.scrollIntoViewIfNeeded();
    await expect(servicesStrip).toBeVisible();
    await waitForCatalogImageComplete(catalogImageLocator(servicesStrip).first());
    await expectNoHorizontalOverflow(page);

    const specialCare = page
      .locator('section')
      .filter({
        has: page.getByRole('heading', { name: /special care for delicate items/i }),
      });
    await specialCare.scrollIntoViewIfNeeded();
    await expect(specialCare).toBeVisible();
    await waitForCatalogImageComplete(catalogImageLocator(specialCare).first());
    await expectNoHorizontalOverflow(page);
  });

  test('375px — no horizontal overflow on /services', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/services');
    await page.waitForLoadState('domcontentloaded');

    await expectCatalogImageOnPage(page);
    await expectNoHorizontalOverflow(page);
  });
});
