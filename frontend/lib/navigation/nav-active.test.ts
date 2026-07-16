import {
  getSamePageHash,
  isHashNavLinkActive,
  isPathNavLinkActive,
} from '@/lib/navigation/nav-active';

const MARKETING_HREFS = [
  '/',
  '/services',
  '/services#pricing',
  '/about',
  '/franchise',
  '/contact',
] as const;

const ADMIN_HREFS = [
  '/admin',
  '/admin/business-health',
  '/admin/revenue/analytics',
  '/admin/revenue',
  '/admin/disputes',
  '/admin/disputes/analytics',
] as const;

const ADMIN_EXACT_ROOTS = ['/admin'] as const;

describe('isHashNavLinkActive', () => {
  it('activates Home only on /', () => {
    expect(isHashNavLinkActive('/', '/', '', MARKETING_HREFS)).toBe(true);
    expect(isHashNavLinkActive('/services', '/', '', MARKETING_HREFS)).toBe(false);
  });

  it('activates Services on /services without hash', () => {
    expect(isHashNavLinkActive('/services', '/services', '', MARKETING_HREFS)).toBe(true);
    expect(isHashNavLinkActive('/services', '/services', 'pricing', MARKETING_HREFS)).toBe(false);
  });

  it('activates Pricing on /services#pricing', () => {
    expect(
      isHashNavLinkActive('/services', '/services#pricing', 'pricing', MARKETING_HREFS),
    ).toBe(true);
    expect(isHashNavLinkActive('/services', '/services', 'pricing', MARKETING_HREFS)).toBe(false);
  });

  it('never marks more than one marketing href active at once', () => {
    const scenarios: Array<{ pathname: string; currentHash: string }> = [
      { pathname: '/', currentHash: '' },
      { pathname: '/services', currentHash: '' },
      { pathname: '/services', currentHash: 'pricing' },
      { pathname: '/about', currentHash: '' },
    ];

    for (const { pathname, currentHash } of scenarios) {
      const activeCount = MARKETING_HREFS.filter((href) =>
        isHashNavLinkActive(pathname, href, currentHash, MARKETING_HREFS),
      ).length;
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });
});

describe('isPathNavLinkActive', () => {
  it('keeps /admin exact on overview only', () => {
    expect(isPathNavLinkActive('/admin', '/admin', ADMIN_HREFS, ADMIN_EXACT_ROOTS)).toBe(true);
    expect(
      isPathNavLinkActive('/admin/revenue', '/admin', ADMIN_HREFS, ADMIN_EXACT_ROOTS),
    ).toBe(false);
  });

  it('prefers the longest matching admin href', () => {
    expect(
      isPathNavLinkActive(
        '/admin/revenue/analytics',
        '/admin/revenue/analytics',
        ADMIN_HREFS,
        ADMIN_EXACT_ROOTS,
      ),
    ).toBe(true);
    expect(
      isPathNavLinkActive(
        '/admin/revenue/analytics',
        '/admin/revenue',
        ADMIN_HREFS,
        ADMIN_EXACT_ROOTS,
      ),
    ).toBe(false);
    expect(
      isPathNavLinkActive(
        '/admin/disputes/analytics',
        '/admin/disputes/analytics',
        ADMIN_HREFS,
        ADMIN_EXACT_ROOTS,
      ),
    ).toBe(true);
    expect(
      isPathNavLinkActive(
        '/admin/disputes/analytics',
        '/admin/disputes',
        ADMIN_HREFS,
        ADMIN_EXACT_ROOTS,
      ),
    ).toBe(false);
  });
});

describe('getSamePageHash', () => {
  it('returns hash only when already on the target path', () => {
    expect(getSamePageHash('/services', '/services#pricing')).toBe('pricing');
    expect(getSamePageHash('/about', '/services#pricing')).toBeNull();
  });
});
