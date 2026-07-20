import { render, screen } from '@testing-library/react';

import { HERO_SLIDES } from '@/features/marketing/home/hero-slides';
import { MarketingHomeHero } from '@/features/marketing/home/home-hero';

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function MockHeroCarousel() {
      return <div data-testid="hero-carousel" />;
    },
}));

describe('MarketingHomeHero images', () => {
  it('hero slides use owned 16:9 marketing heroes (not remote stock)', () => {
    const slideSrcs = HERO_SLIDES.map((slide) => slide.image);
    expect(new Set(slideSrcs).size).toBe(HERO_SLIDES.length);

    for (const slide of HERO_SLIDES) {
      expect(slide.image).toMatch(/^\/marketing\/heroes\/[\w-]+\.webp$/);
      expect(slide.image).not.toMatch(/unsplash/i);
      if (slide.variant === 'delivery') {
        expect(slide.phoneImage).toMatch(/^\/catalog\/.+\.webp$/);
        expect(slide.phoneImage).not.toMatch(/unsplash/i);
      }
    }
  });
});

describe('MarketingHomeHero sticky CTAs', () => {
  it('renders mobile CTAs in document flow below the carousel, not as an overlay', () => {
    render(<MarketingHomeHero />);

    const stickyCta = screen.getByTestId('hero-carousel').nextElementSibling;
    expect(stickyCta).toHaveAttribute('data-marketing-sticky-cta');
    expect(stickyCta?.className).not.toMatch(/\babsolute\b/);
    expect(stickyCta?.className).toMatch(/\bsm:hidden\b/);
  });
});
