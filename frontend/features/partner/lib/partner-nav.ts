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

/**
 * Legacy ops paths that belong to Orders Hub (Prompt 2 redirects).
 * Active state / titles / breadcrumbs treat these as Orders.
 */
export const PARTNER_ORDERS_HUB_ALIASES = [
  '/partner/customers',
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
    keywords: 'directory insights customers analytics',
  },
  {
    id: 'p-orders-hub-find',
    label: 'Find customer',
    href: `${PARTNER_ORDERS_HUB_HREF}?tab=desk`,
    keywords: 'desk phone search orders hub',
  },
];

export const PARTNER_NAV_SECTIONS: PartnerNavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [{ href: '/partner', label: 'Overview', icon: LayoutDashboard }],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { href: '/partner/operations', label: 'Operations center', icon: Radio },
      { href: '/partner/new-order', label: 'New Order', icon: PlusCircle },
      {
        href: PARTNER_ORDERS_HUB_HREF,
        label: 'Orders',
        icon: Package,
        badgeKeys: ['orders', 'bookingRequests'],
      },
      { href: '/partner/walk-in-orders', label: 'Walk-in orders', icon: Store },
      { href: '/partner/pickups', label: 'Pickup requests', icon: ClipboardList, badgeKey: 'pickups' },
      { href: '/partner/deliveries', label: 'Deliveries', icon: Truck },
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
    id: 'management',
    label: 'Management',
    items: [{ href: '/partner/staff', label: 'Staff', icon: UserCog }],
  },
  {
    id: 'business',
    label: 'Business',
    items: [
      { href: '/partner/revenue', label: 'Pricing & revenue', icon: Wallet },
      { href: '/partner/settlements', label: 'Settlements', icon: Wallet },
      { href: '/partner/reports', label: 'Reports', icon: BarChart3 },
    ],
  },
  {
    id: 'system',
    label: 'System',
    items: [
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

/** Map legacy desk/BR/insights paths onto the Orders Hub pathname. */
export function resolvePartnerNavPathname(pathname: string): string {
  const path = stripNavQuery(pathname);
  if (
    PARTNER_ORDERS_HUB_ALIASES.some(
      (alias) => path === alias || path.startsWith(`${alias}/`),
    )
  ) {
    return PARTNER_ORDERS_HUB_HREF;
  }
  return path;
}

export function isPartnerNavActive(pathname: string, href: string): boolean {
  const effectivePath = resolvePartnerNavPathname(pathname);
  const effectiveHref = stripNavQuery(href);
  return isPathNavLinkActive(
    effectivePath,
    effectiveHref,
    PARTNER_NAV_FLAT.map((item) => item.href),
    ['/partner'],
  );
}

export function getPartnerPageTitle(pathname: string): string {
  const effectivePath = resolvePartnerNavPathname(pathname);
  return PARTNER_NAV_FLAT.find((n) => isPartnerNavActive(effectivePath, n.href))?.label ?? 'Partner';
}
