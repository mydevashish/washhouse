import { isHashNavLinkActive, parseHashHref } from '@/lib/navigation/nav-active';

export type DiscoverSectionNavLink = {
  href: string;
  label: string;
};

export const DISCOVER_SECTION_NAV_LINKS: readonly DiscoverSectionNavLink[] = [
  { href: '/discover#how-it-works', label: 'How it works' },
  { href: '/discover#services', label: 'Services' },
  { href: '/discover#pricing', label: 'Pricing' },
  { href: '/discover#partners', label: 'Partners' },
] as const;

export const DISCOVER_SECTION_IDS = DISCOVER_SECTION_NAV_LINKS.map(
  ({ href }) => parseHashHref(href).hash!,
);

const DISCOVER_SECTION_HREFS = () => DISCOVER_SECTION_NAV_LINKS.map((link) => link.href);

/**
 * Resolves the active discover section from scroll-spy and/or location hash.
 * Scroll-spy wins when a section is in view; hash is the fallback (e.g. mid-scroll animation).
 */
export function resolveDiscoverActiveSection(
  scrollSpySectionId: string | null,
  currentHash: string,
): string | null {
  if (scrollSpySectionId && DISCOVER_SECTION_IDS.includes(scrollSpySectionId)) {
    return scrollSpySectionId;
  }

  const normalizedHash = currentHash.replace(/^#/, '');
  if (normalizedHash && DISCOVER_SECTION_IDS.includes(normalizedHash)) {
    return normalizedHash;
  }

  return null;
}

/** Whether a discover section nav link should show active styling. */
export function isDiscoverSectionNavLinkActive(
  pathname: string,
  href: string,
  activeSectionId: string | null,
): boolean {
  if (activeSectionId === null) return false;

  const { hash } = parseHashHref(href);
  if (!hash) return false;

  return (
    pathname === '/discover' &&
    isHashNavLinkActive(pathname, href, activeSectionId, DISCOVER_SECTION_HREFS())
  );
}
