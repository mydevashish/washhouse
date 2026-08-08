import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Package,
  PlusCircle,
  Radio,
  Settings,
  Sparkles,
  Star,
  Store,
  Truck,
  UserCog,
  Users,
  Wallet,
} from 'lucide-react';

import { isPathNavLinkActive } from '@/lib/navigation/nav-active';

export type PartnerNavBadgeKey = 'orders' | 'pickups' | 'notifications' | 'bookingRequests';

export type PartnerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Single badge source. */
  badgeKey?: PartnerNavBadgeKey;
  /** Multiple badge sources summed onto one chip (Orders Hub). */
  badgeKeys?: PartnerNavBadgeKey[];
};

export type PartnerNavSection = {
  id: string;
  label: string;
  items: PartnerNavItem[];
};

/** Orders Hub home — collapsed Desk / Booking requests / insights land here. */
export const PARTNER_ORDERS_HUB_HREF = '/partner/orders';

/** People › Customers — legacy path redirects to Orders Hub `?tab=directory`. */
export const PARTNER_PEOPLE_CUSTOMERS_HREF = '/partner/customers';

/** Logistics hub — Pickups / Deliveries / Done today. */
export const PARTNER_LOGISTICS_HREF = '/partner/logistics';

/** Legacy logistics paths map onto the Logistics hub for active state / titles. */
export const PARTNER_LOGISTICS_ALIASES = ['/partner/pickups', '/partner/deliveries'] as const;

/**
 * Legacy ops paths that belong to Orders Hub (Prompt 2 redirects).
 * Active state / titles / breadcrumbs treat these as Orders.
 * `/partner/customers` is People › Customers (not Orders) — see isPartnerNavActive.
 */
export const PARTNER_ORDERS_HUB_ALIASES = [
  '/partner/customer-desk',
  '/partner/booking-requests',
] as const;

/** Search / quick-action aliases — old labels resolve into hub tabs. */
export const PARTNER_ORDERS_HUB_SEARCH_ALIASES: ReadonlyArray<{
  id: string;
  label: string;
  href: string;
  keywords: string;
}> = [
  {
    id: 'p-orders-hub-desk',
    label: 'Customer Desk',
    href: `${PARTNER_ORDERS_HUB_HREF}?tab=desk`,
    keywords: 'find customer phone lookup desk assisted',
  },
  {
    id: 'p-orders-hub-requests',
    label: 'Booking requests',
    href: `${PARTNER_ORDERS_HUB_HREF}?tab=requests`,
    keywords: 'leads inbox requests booking',
  },
  {
    id: 'p-orders-hub-directory',
    label: 'Customer insights',
    href: `${PARTNER_ORDERS_HUB_HREF}?tab=directory`,
    keywords: 'directory insights customers analytics people',
  },
  {
    id: 'p-people-customers',
    label: 'Customers',
    href: PARTNER_PEOPLE_CUSTOMERS_HREF,
    keywords: 'people customers directory',
  },
  {
    id: 'p-orders-hub-find',
    label: 'Find customer',
    href: `${PARTNER_ORDERS_HUB_HREF}?tab=desk`,
    keywords: 'desk phone search orders hub',
  },
];

/**
 * Advanced Mode Owner Command Center nav — 5 pillars + secondary shop/system.
 * Shop Floor Mode uses its own nav; do not shrink this for floor literacy.
 */
export const PARTNER_NAV_SECTIONS: PartnerNavSection[] = [
  {
    id: 'today',
    label: 'Today',
    items: [{ href: '/partner', label: 'Today', icon: LayoutDashboard }],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { href: '/partner/new-order', label: 'New Order', icon: PlusCircle },
      {
        href: PARTNER_ORDERS_HUB_HREF,
        label: 'Orders',
        icon: Package,
        badgeKeys: ['orders', 'bookingRequests'],
      },
      { href: '/partner/walk-in-orders', label: 'Walk-in orders', icon: Store },
    ],
  },
  {
    id: 'logistics',
    label: 'Logistics',
    items: [
      {
        href: PARTNER_LOGISTICS_HREF,
        label: 'Logistics',
        icon: Truck,
        badgeKey: 'pickups',
      },
    ],
  },
  {
    id: 'people',
    label: 'People',
    items: [
      { href: PARTNER_PEOPLE_CUSTOMERS_HREF, label: 'Customers', icon: Users },
      { href: '/partner/staff', label: 'Staff', icon: UserCog },
    ],
  },
  {
    id: 'money',
    label: 'Money',
    items: [
      { href: '/partner/revenue', label: 'Revenue', icon: Wallet },
      { href: '/partner/settlements', label: 'Settlements', icon: IndianRupee },
      { href: '/partner/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    id: 'shop',
    label: 'Your shop',
    items: [
      { href: '/partner/storefront', label: 'Storefront builder', icon: Sparkles },
      { href: '/partner/services', label: 'Service catalog', icon: ClipboardList },
      { href: '/partner/pricing', label: 'Garment prices', icon: IndianRupee },
      { href: '/partner/reviews', label: 'Reviews', icon: Star },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
      { href: '/partner/operations', label: 'Operations center', icon: Radio },
      { href: '/partner/notifications', label: 'Notifications', icon: Bell, badgeKey: 'notifications' },
      { href: '/partner/audit', label: 'Audit logs', icon: FileText },
      { href: '/partner/settings', label: 'Settings', icon: Settings },
    ],
  },
];

export const PARTNER_NAV_FLAT = PARTNER_NAV_SECTIONS.flatMap((s) => s.items);

export function partnerNavBadgeKeys(item: PartnerNavItem): PartnerNavBadgeKey[] {
  if (item.badgeKeys?.length) return item.badgeKeys;
  return item.badgeKey ? [item.badgeKey] : [];
}

/** Strip `?query` so `/partner/orders?tab=desk` matches the Orders nav item. */
export function stripNavQuery(hrefOrPath: string): string {
  const q = hrefOrPath.indexOf('?');
  return q === -1 ? hrefOrPath : hrefOrPath.slice(0, q);
}

export function getNavHrefTab(hrefOrPath: string): string | null {
  const q = hrefOrPath.indexOf('?');
  if (q === -1) return null;
  return new URLSearchParams(hrefOrPath.slice(q + 1)).get('tab');
}

/** Map legacy desk/BR paths onto the Orders Hub pathname; logistics aliases → hub. */
export function resolvePartnerNavPathname(pathname: string): string {
  const path = stripNavQuery(pathname);
  if (
    PARTNER_ORDERS_HUB_ALIASES.some(
      (alias) => path === alias || path.startsWith(`${alias}/`),
    )
  ) {
    return PARTNER_ORDERS_HUB_HREF;
  }
  if (
    PARTNER_LOGISTICS_ALIASES.some(
      (alias) => path === alias || path.startsWith(`${alias}/`),
    )
  ) {
    return PARTNER_LOGISTICS_HREF;
  }
  return path;
}

export type PartnerNavActiveOptions = {
  /** Current `?tab=` on Orders Hub (from useSearchParams). */
  tab?: string | null;
};

function navFlatPaths(): string[] {
  return PARTNER_NAV_FLAT.map((item) => stripNavQuery(item.href));
}

function isPeopleCustomersPath(pathname: string, tab?: string | null): boolean {
  const path = stripNavQuery(pathname);
  if (path === '/partner/customers' || path.startsWith('/partner/customers/')) return true;
  return path === PARTNER_ORDERS_HUB_HREF && tab === 'directory';
}

export function isPartnerNavActive(
  pathname: string,
  href: string,
  opts?: PartnerNavActiveOptions,
): boolean {
  const hrefTab = getNavHrefTab(href);
  const effectiveHref = stripNavQuery(href);
  const tab = opts?.tab ?? null;

  // People › Customers (directory tab / legacy customers route)
  if (
    effectiveHref === PARTNER_PEOPLE_CUSTOMERS_HREF ||
    (effectiveHref === PARTNER_ORDERS_HUB_HREF && hrefTab === 'directory')
  ) {
    return isPeopleCustomersPath(pathname, tab);
  }

  // Orders hub — yield directory tab to People › Customers
  if (effectiveHref === PARTNER_ORDERS_HUB_HREF && !hrefTab) {
    if (isPeopleCustomersPath(pathname, tab)) return false;
    return isPathNavLinkActive(
      resolvePartnerNavPathname(pathname),
      effectiveHref,
      navFlatPaths(),
      ['/partner'],
    );
  }

  const effectivePath = resolvePartnerNavPathname(pathname);
  return isPathNavLinkActive(effectivePath, effectiveHref, navFlatPaths(), ['/partner']);
}

export function getPartnerPageTitle(pathname: string, tab?: string | null): string {
  if (isPeopleCustomersPath(pathname, tab)) return 'Customers';
  const effectivePath = resolvePartnerNavPathname(pathname);
  return (
    PARTNER_NAV_FLAT.find((n) => isPartnerNavActive(effectivePath, n.href, { tab }))?.label ??
    'Partner'
  );
}
