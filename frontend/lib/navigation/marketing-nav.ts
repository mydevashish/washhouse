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
  { href: '/services#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/franchise', label: 'Franchise' },
  { href: '/contact', label: 'Contact' },
] as const;

export const MARKETING_BOOK_NOW_HREF = '/discover#partners';

/** Laundry partners and platform admins — staff portal chooser */
export const MARKETING_STAFF_HREF = '/staff';
