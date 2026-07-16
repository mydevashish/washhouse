import {
  DISCOVER_SECTION_IDS,
  DISCOVER_SECTION_NAV_LINKS,
  isDiscoverSectionNavLinkActive,
  resolveDiscoverActiveSection,
} from '@/lib/navigation/discover-nav';

describe('resolveDiscoverActiveSection', () => {
  it('prefers scroll-spy when a section is in view', () => {
    expect(resolveDiscoverActiveSection('services', 'pricing')).toBe('services');
  });

  it('falls back to location hash when scroll-spy is idle', () => {
    expect(resolveDiscoverActiveSection(null, 'pricing')).toBe('pricing');
  });

  it('returns null when neither scroll-spy nor hash match', () => {
    expect(resolveDiscoverActiveSection(null, '')).toBeNull();
    expect(resolveDiscoverActiveSection(null, 'unknown')).toBeNull();
  });
});

describe('isDiscoverSectionNavLinkActive', () => {
  it('activates only the matching section on /discover', () => {
    expect(
      isDiscoverSectionNavLinkActive('/discover', '/discover#pricing', 'pricing'),
    ).toBe(true);
    expect(
      isDiscoverSectionNavLinkActive('/discover', '/discover#services', 'pricing'),
    ).toBe(false);
  });

  it('never marks more than one discover section active at once', () => {
    const scenarios: Array<{ scrollSpy: string | null; hash: string }> = [
      { scrollSpy: 'how-it-works', hash: '' },
      { scrollSpy: null, hash: 'services' },
      { scrollSpy: 'pricing', hash: 'partners' },
      { scrollSpy: null, hash: '' },
    ];

    for (const { scrollSpy, hash } of scenarios) {
      const activeId = resolveDiscoverActiveSection(scrollSpy, hash);
      const activeCount = DISCOVER_SECTION_NAV_LINKS.filter((link) =>
        isDiscoverSectionNavLinkActive('/discover', link.href, activeId),
      ).length;
      expect(activeCount).toBeLessThanOrEqual(1);
    }
  });

  it('covers every configured discover section id', () => {
    expect(DISCOVER_SECTION_IDS).toEqual(['how-it-works', 'services', 'pricing', 'partners']);
  });
});
