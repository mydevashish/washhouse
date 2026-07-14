export type MarketingNavLink = {
  href: string;
  label: string;
};

export const MARKETING_NAV_LINKS: readonly MarketingNavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/services', label: 'Services' },
  { href: '/services#pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
  { href: '/franchise', label: 'Franchise' },
  { href: '/contact', label: 'Contact' },
] as const;

export const MARKETING_BOOK_NOW_HREF = '/discover#laundries';

/** Laundry partners and platform admins — staff portal chooser */
export const MARKETING_STAFF_HREF = '/staff';
