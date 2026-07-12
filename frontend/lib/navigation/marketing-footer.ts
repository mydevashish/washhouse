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
    id: 'company',
    title: 'Company',
    links: [
      { href: '/', label: 'Home' },
      { href: '/about', label: 'About' },
      { href: '/services', label: 'Services' },
      { href: '/stores', label: 'Stores' },
    ],
  },
  {
    id: 'partner',
    title: 'Partner',
    links: [{ href: '/franchise', label: 'Franchise' }],
  },
  {
    id: 'legal',
    title: 'Legal',
    links: [
      { href: '/terms', label: 'Terms' },
      { href: '/privacy', label: 'Privacy' },
    ],
  },
  {
    id: 'support',
    title: 'Support',
    links: [{ href: '/contact', label: 'Contact' }],
  },
] as const;
