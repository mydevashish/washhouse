export type MarketingFooterLink = {
  href: string;
  label: string;
};

export type MarketingFooterGroup = {
  id: string;
  title: string;
  links: readonly MarketingFooterLink[];
};

export const MARKETING_FOOTER_GROUPS: readonly MarketingFooterGroup[] = [
  {
    id: 'quick-links',
    title: 'Quick Links',
    links: [
      { href: '/', label: 'Home' },
      { href: '/services', label: 'Services' },
      { href: '/pricing', label: 'Pricing' },
      { href: '/about', label: 'About' },
      { href: '/franchise', label: 'Franchise' },
      { href: '/contact', label: 'Contact' },
    ],
  },
  {
    id: 'our-services',
    title: 'Our Services',
    links: [
      { href: '/services#wash-fold', label: 'Wash & Fold' },
      { href: '/services#dry-clean', label: 'Dry Cleaning' },
      { href: '/services#steam-iron', label: 'Steam Iron / Press' },
      { href: '/services#express', label: 'Express / Same-day' },
      { href: '/services#subscription', label: 'Monthly Plans' },
      { href: '/stores', label: 'Find a Store' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    links: [
      { href: '/contact', label: 'Contact Us' },
      { href: '/services#faq', label: 'FAQ' },
      { href: '/terms', label: 'Terms of Service' },
      { href: '/privacy', label: 'Privacy Policy' },
    ],
  },
  {
    id: 'partners-staff',
    title: 'Partners & Staff',
    links: [
      { href: '/staff', label: 'Staff Portal' },
      { href: '/login?audience=partner', label: 'Laundry Login' },
      { href: '/login?audience=admin', label: 'Admin Login' },
      { href: '/franchise', label: 'Become a Partner' },
    ],
  },
] as const;
