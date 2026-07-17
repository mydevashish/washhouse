import { isHashNavLinkActive } from '@/lib/navigation/nav-active';

export type MarketingNavLink = {
  href: string;
  label: string;
};

export { getSamePageHash, parseHashHref } from '@/lib/navigation/nav-active';

const MARKETING_NAV_HREFS = () => MARKETING_NAV_LINKS.map((link) => link.href);

/**
 * Whether a marketing nav link should show active styling.
 * `currentHash` is the location hash without the leading `#` (empty when none).
 */
export function isMarketingNavLinkActive(
  pathname: string,
  href: string,
  currentHash: string,
): boolean {
  return isHashNavLinkActive(pathname, href, currentHash, MARKETING_NAV_HREFS());
}

export const MARKETING_NAV_LINKS: readonly MarketingNavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/franchise', label: 'Franchise' },
  { href: '/contact', label: 'Contact' },
] as const;

/**
 * Deep-link that opens the Book Now dialog (`BookNowDialog` watches `?book=1`).
 * Prefer `BookNowCta` / `BookNowLink` for in-app clicks (no full-page navigation).
 */
export const MARKETING_BOOK_NOW_HREF = '/?book=1';

/** Full-page laundry directory — use when browsing stores is the primary action. */
export const MARKETING_STORES_HREF = '/stores';

/** Laundry partners and platform admins — staff portal chooser */
export const MARKETING_STAFF_HREF = '/staff';
