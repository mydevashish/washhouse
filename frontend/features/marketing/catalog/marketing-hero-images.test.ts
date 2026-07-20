import {
  MARKETING_DECORATIVE_BANNERS,
  MARKETING_HERO_IMAGES,
} from '@/features/marketing/catalog/marketing-hero-images';
import { SERVICE_PREVIEW_ITEMS } from '@/features/marketing/home/services-data';
import { HERO_SLIDES } from '@/features/marketing/home/hero-slides';

function expectMeaningfulAlt(alt: string) {
  expect(alt.trim()).not.toBe('');
  expect(alt.length).toBeGreaterThan(12);
}

describe('marketing hero images', () => {
  it('defines four distinct 16:9 heroes under /marketing/heroes/', () => {
    const srcs = Object.values(MARKETING_HERO_IMAGES).map((photo) => photo.src);
    expect(srcs).toHaveLength(4);
    expect(new Set(srcs).size).toBe(4);
    for (const src of srcs) {
      expect(src).toMatch(/^\/marketing\/heroes\/[\w-]+\.webp$/);
    }
  });

  it('gives every hero a non-empty descriptive alt', () => {
    for (const photo of Object.values(MARKETING_HERO_IMAGES)) {
      expectMeaningfulAlt(photo.alt);
    }
  });

  it('maps carousel slides to unique marketing heroes (not catalog tiles)', () => {
    const slideSrcs = HERO_SLIDES.map((slide) => slide.image);
    expect(new Set(slideSrcs).size).toBe(HERO_SLIDES.length);
    for (const src of slideSrcs) {
      expect(src).toMatch(/^\/marketing\/heroes\//);
      expect(src).not.toMatch(/^\/catalog\//);
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

describe('homepage service preview images', () => {
  it('uses a unique image per service card', () => {
    const srcs = SERVICE_PREVIEW_ITEMS.map((item) => item.image);
    expect(srcs).toHaveLength(7);
    expect(new Set(srcs).size).toBe(7);
  });
});
