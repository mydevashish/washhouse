import {
  isMarketingNavLinkActive,
  MARKETING_NAV_LINKS,
} from '@/lib/navigation/marketing-nav';

describe('isMarketingNavLinkActive', () => {
  it('activates Home only on /', () => {
    expect(isMarketingNavLinkActive('/', '/', '')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/', '')).toBe(false);
  });

  it('activates Services on /services', () => {
    expect(isMarketingNavLinkActive('/services', '/services', '')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/pricing', '')).toBe(false);
  });

  it('activates Pricing on /pricing', () => {
    expect(isMarketingNavLinkActive('/pricing', '/pricing', '')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/pricing', '')).toBe(false);
    expect(isMarketingNavLinkActive('/pricing', '/services', '')).toBe(false);
  });

  it('keeps Services active for hashes on /services', () => {
    expect(isMarketingNavLinkActive('/services', '/services', 'pricing')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/pricing', 'pricing')).toBe(false);
  });

  it('never marks more than one MARKETING_NAV_LINKS item active at once', () => {
    const scenarios: Array<{ pathname: string; currentHash: string }> = [
      { pathname: '/', currentHash: '' },
      { pathname: '/services', currentHash: '' },
      { pathname: '/services', currentHash: 'pricing' },
      { pathname: '/pricing', currentHash: '' },
      { pathname: '/about', currentHash: '' },
    ];

    for (const { pathname, currentHash } of scenarios) {
      const activeCount = MARKETING_NAV_LINKS.filter(({ href }) =>
        isMarketingNavLinkActive(pathname, href, currentHash),
      ).length;
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });
});
