import {
  ADMIN_NAV_FLAT,
  ADMIN_ORDERS_HUB_HREF,
  ADMIN_ORDERS_HUB_SEARCH_ALIASES,
} from '@/features/admin/lib/admin-nav';
import {
  PARTNER_NAV_FLAT,
  PARTNER_ORDERS_HUB_HREF,
  PARTNER_ORDERS_HUB_SEARCH_ALIASES,
} from '@/features/partner/lib/partner-nav';
import { MARKETING_FOOTER_GROUPS } from '@/lib/navigation/marketing-footer';
import type { AppContext, SearchItem } from '@/lib/navigation/types';

const MARKETING_ITEMS: SearchItem[] = MARKETING_FOOTER_GROUPS.flatMap((group) =>
  group.links.map((link) => ({
    id: `m-${link.href}`,
    label: link.label,
    href: link.href,
    group: group.title,
    keywords: `${group.title.toLowerCase()} marketing`,
  })),
);

const CUSTOMER_ITEMS: SearchItem[] = [
  { id: 'c-discover', label: 'Discover laundries', href: '/discover', group: 'Pages', keywords: 'browse search' },
  { id: 'c-orders', label: 'My orders', href: '/orders', group: 'Pages', keywords: 'bookings tracking' },
  { id: 'c-account', label: 'Account settings', href: '/account', group: 'Pages', keywords: 'profile addresses' },
  ...MARKETING_ITEMS,
];

const ADMIN_EXTRA: SearchItem[] = [
  { id: 'a-approvals', label: 'Approval center', href: '/admin/approvals', group: 'Actions', keywords: 'pending laundry' },
  { id: 'a-audit', label: 'Audit logs', href: '/admin/audit', group: 'Monitoring', keywords: 'security trail' },
  ...ADMIN_ORDERS_HUB_SEARCH_ALIASES.map((alias) => ({
    id: alias.id,
    label: alias.label,
    href: alias.href,
    group: 'Orders Hub',
    keywords: alias.keywords,
  })),
];

const PARTNER_EXTRA: SearchItem[] = [
  {
    id: 'p-new-order',
    label: 'New Order',
    href: '/partner/new-order',
    group: 'Operations',
    keywords: 'create walk-in assisted desk order',
  },
  { id: 'p-storefront', label: 'Storefront builder', href: '/partner/storefront', group: 'Shop', keywords: 'brand gallery' },
  { id: 'p-pickups', label: 'Pickup requests', href: '/partner/pickups', group: 'Operations', keywords: 'collection' },
  ...PARTNER_ORDERS_HUB_SEARCH_ALIASES.map((alias) => ({
    id: alias.id,
    label: alias.label,
    href: alias.href,
    group: 'Orders Hub',
    keywords: alias.keywords,
  })),
];

function ordersHubKeywords(href: string, role: 'admin' | 'partner'): string {
  const hub = role === 'admin' ? ADMIN_ORDERS_HUB_HREF : PARTNER_ORDERS_HUB_HREF;
  if (href !== hub) return href;
  return `${href} orders hub desk requests directory customers booking`;
}

export function getSearchIndex(app: AppContext): SearchItem[] {
  if (app === 'admin') {
    return [
      ...ADMIN_NAV_FLAT.map((n) => ({
        id: `a-${n.href}`,
        label: n.label,
        href: n.href,
        group: 'Admin',
        keywords: ordersHubKeywords(n.href, 'admin'),
      })),
      ...ADMIN_EXTRA,
    ];
  }
  if (app === 'partner') {
    return [
      ...PARTNER_NAV_FLAT.map((n) => ({
        id: `p-${n.href}`,
        label: n.label,
        href: n.href,
        group: 'Partner',
        keywords: ordersHubKeywords(n.href, 'partner'),
      })),
      ...PARTNER_EXTRA,
    ];
  }
  return CUSTOMER_ITEMS;
}

export function filterSearchItems(items: SearchItem[], query: string): SearchItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items.slice(0, 12);
  return items
    .filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.href.toLowerCase().includes(q) ||
        item.keywords?.toLowerCase().includes(q),
    )
    .slice(0, 12);
}
