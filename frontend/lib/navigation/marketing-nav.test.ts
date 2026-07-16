import {
  isMarketingNavLinkActive,
  MARKETING_NAV_LINKS,
} from '@/lib/navigation/marketing-nav';

describe('isMarketingNavLinkActive', () => {
  it('activates Home only on /', () => {
    expect(isMarketingNavLinkActive('/', '/', '')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/', '')).toBe(false);
  });

  it('activates Services on /services without hash', () => {
    expect(isMarketingNavLinkActive('/services', '/services', '')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/services#pricing', '')).toBe(false);
  });

  it('activates Pricing on /services#pricing', () => {
    expect(isMarketingNavLinkActive('/services', '/services#pricing', 'pricing')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/services', 'pricing')).toBe(false);
  });

  it('keeps Services active for unknown hashes on /services', () => {
    expect(isMarketingNavLinkActive('/services', '/services', 'unknown')).toBe(true);
    expect(isMarketingNavLinkActive('/services', '/services#pricing', 'unknown')).toBe(false);
  });

  it('never marks more than one MARKETING_NAV_LINKS item active at once', () => {
    const scenarios: Array<{ pathname: string; currentHash: string }> = [
      { pathname: '/', currentHash: '' },
      { pathname: '/services', currentHash: '' },
      { pathname: '/services', currentHash: 'pricing' },
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
