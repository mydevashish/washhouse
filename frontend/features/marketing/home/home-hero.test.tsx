import { render, screen } from '@testing-library/react';

import { HERO_SLIDES } from '@/features/marketing/home/hero-slides';
import { MarketingHomeHero } from '@/features/marketing/home/home-hero';
import { HeroStaticFallback } from '@/features/marketing/home/hero-static-fallback';

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
      if (slide.variant === 'delivery' && slide.phoneImage) {
        expect(slide.phoneImage).toMatch(/^\/catalog\/.+\.webp$/);
        expect(slide.phoneImage).not.toMatch(/unsplash/i);
      }
    }
  });
});

describe('Welcome hero promo overlay', () => {
  it('welcome slide copy is 25% OFF with empty code (no invented coupon)', () => {
    const welcome = HERO_SLIDES.find((s) => s.variant === 'welcome');
    expect(welcome).toBeDefined();
    if (welcome?.variant !== 'welcome') return;
    expect(welcome.promo.badge).toBe('25% OFF');
    expect(welcome.promo.code).toBe('');
  });

  it('static fallback shows offer on the banner image for all breakpoints', () => {
    const { container } = render(<HeroStaticFallback />);

    expect(screen.getByText('25% OFF')).toBeInTheDocument();
    expect(screen.getByText('On Your FIRST THREE Orders')).toBeInTheDocument();

    const promo = screen.getByText('25% OFF').closest('[class*="absolute"]');
    expect(promo).toBeTruthy();
    expect(promo?.className).toMatch(/\bbottom-3\b/);
    expect(promo?.className).toMatch(/\bright-3\b/);
    // Must not be mobile-hidden (was: hidden … sm:block)
    expect(promo?.className).not.toMatch(/\bhidden\b/);
    expect(container.textContent).not.toMatch(/WELCOME20/i);
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
