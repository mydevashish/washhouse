import {
  MARKETING_DECORATIVE_BANNERS,
  MARKETING_HERO_IMAGES,
} from '@/features/marketing/catalog/marketing-hero-images';
import {
  WASHHOUSE_CATALOG_PHOTOS,
  WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS,
} from '@/features/marketing/catalog/washhouse-catalog-photos';

function expectMeaningfulAlt(alt: string) {
  expect(alt.trim()).not.toBe('');
  expect(alt.length).toBeGreaterThan(12);
}

describe('washhouse catalog photo accessibility', () => {
  it('gives every catalog tile a non-empty descriptive alt', () => {
    for (const [key, photo] of Object.entries(WASHHOUSE_CATALOG_PHOTOS)) {
      expectMeaningfulAlt(photo.alt);
    }
  });

  it('gives supplemental and marketing hero photos non-empty descriptive alts', () => {
    for (const photo of Object.values(WASHHOUSE_CATALOG_SUPPLEMENTAL_PHOTOS)) {
      expectMeaningfulAlt(photo.alt);
    }
    for (const photo of Object.values(MARKETING_HERO_IMAGES)) {
      expectMeaningfulAlt(photo.alt);
    }
  });

  it('defines contrast scrims for decorative banner backgrounds', () => {
    for (const banner of Object.values(MARKETING_DECORATIVE_BANNERS)) {
      expectMeaningfulAlt(banner.photo.alt);
      expect(banner.overlayClassName).toMatch(/from-/);
      expect(banner.overlayClassName).toMatch(/dark:/);
    }
  });
});
