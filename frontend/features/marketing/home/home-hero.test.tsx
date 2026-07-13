import { render, screen } from '@testing-library/react';

import { MarketingHomeHero } from '@/features/marketing/home/home-hero';

jest.mock('next/dynamic', () => ({
  __esModule: true,
  default: () =>
    function MockHeroCarousel() {
      return <div data-testid="hero-carousel" />;
    },
}));

describe('MarketingHomeHero sticky CTAs', () => {
  it('renders mobile CTAs in document flow below the carousel, not as an overlay', () => {
    render(<MarketingHomeHero />);

    const stickyCta = screen.getByTestId('hero-carousel').nextElementSibling;
    expect(stickyCta).toHaveAttribute('data-marketing-sticky-cta');
    expect(stickyCta?.className).not.toMatch(/\babsolute\b/);
    expect(stickyCta?.className).toMatch(/\bsm:hidden\b/);
  });
});
