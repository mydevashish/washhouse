import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Package,
  Radio,
  Settings,
  Sparkles,
  Star,
  Truck,
  UserCog,
  Wallet,
} from 'lucide-react';

import { isPathNavLinkActive } from '@/lib/navigation/nav-active';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

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

/** Orders list page. */
export const PARTNER_ORDERS_HREF = '/partner/orders';

/** Backward-compatible alias for legacy hub code paths. */
export const PARTNER_ORDERS_HUB_HREF = PARTNER_ORDERS_HREF;

/** Customer directory page. */
export const PARTNER_CUSTOMERS_HREF = '/partner/customers';

/** Sidebar / page title for the unified hub. */
export const PARTNER_CUSTOMERS_ORDERS_LABEL = 'Customers & Orders';

/** Legacy customers path — redirects to hub customers workspace modal. */
export const PARTNER_PEOPLE_CUSTOMERS_HREF = PARTNER_CUSTOMERS_HREF;

/** Logistics hub — Pickups / Deliveries / Done today. */
export const PARTNER_LOGISTICS_HREF = '/partner/logistics';

/** Legacy logistics paths map onto the Logistics hub for active state / titles. */
export const PARTNER_LOGISTICS_ALIASES = ['/partner/pickups', '/partner/deliveries'] as const;

/** Legacy intake bookmark — opens create dialog on the hub (`?tab=create`). */
export const PARTNER_NEW_ORDER_HREF = buildOrdersHubPath('/partner/orders', 'create');

/** Legacy coupons bookmark — redirects to hub workspace modal. */
export const PARTNER_COUPONS_HREF = '/partner/coupons';

/** Hub workspace deep links (pillars modal). */
export const PARTNER_ORDERS_HUB_WORKSPACE_CUSTOMERS_HREF = `${PARTNER_ORDERS_HREF}?workspace=customers`;
export const PARTNER_ORDERS_HUB_WORKSPACE_COUPONS_HREF = `${PARTNER_ORDERS_HREF}?workspace=coupons`;
export const PARTNER_ORDERS_HUB_WORKSPACE_SERVICES_HREF = `${PARTNER_ORDERS_HREF}?workspace=services`;

/**
 * Paths that belong to Customers & Orders Hub for active state / titles.
 * Intake + print modules stay reachable but highlight the hub.
 * Legacy `/partner/floor/today|ready|more` permanently redirect (P7).
 */
export const PARTNER_ORDERS_HUB_ALIASES = [
  '/partner/customer-desk',
  '/partner/booking-requests',
  '/partner/walk-in-orders',
  '/partner/new-order',
  '/partner/floor/new',
  '/partner/floor/print',
  PARTNER_COUPONS_HREF,
] as const;

/** Search / quick-action aliases — old labels resolve into hub tabs / intake. */
export const PARTNER_ORDERS_HUB_SEARCH_ALIASES: ReadonlyArray<{
  id: string;
  label: string;
  href: string;
  keywords: string;
}> = [
  {
    id: 'p-orders-hub',
    label: PARTNER_CUSTOMERS_ORDERS_LABEL,
    href: PARTNER_ORDERS_HREF,
    keywords: 'customers orders hub queue crm',
  },
  {
    id: 'p-orders-hub-desk',
    label: 'Find customer',
    href: PARTNER_ORDERS_HUB_WORKSPACE_CUSTOMERS_HREF,
    keywords: 'find customer phone lookup desk assisted customer desk',
  },
  {
    id: 'p-orders-hub-requests',
    label: 'Booking requests',
    href: '/partner/booking-requests',
    keywords: 'leads inbox requests booking',
  },
  {
    id: 'p-orders-hub-directory',
    label: 'Customers',
    href: PARTNER_CUSTOMERS_HREF,
    keywords: 'directory insights customers analytics people',
  },
  {
    id: 'p-ops-services',
    label: 'Services',
    href: PARTNER_ORDERS_HUB_WORKSPACE_SERVICES_HREF,
    keywords: 'service catalog dry clean wash fold pricing crud',
  },
  {
    id: 'p-orders-hub-new-order',
    label: 'New Order',
    href: PARTNER_NEW_ORDER_HREF,
    keywords: 'new order create walk-in cloth wall intake',
  },
  {
    id: 'p-partner-coupons',
    label: 'Coupons',
    href: PARTNER_ORDERS_HUB_WORKSPACE_COUPONS_HREF,
    keywords: 'coupon discount promo code crud',
  },
  {
    id: 'p-orders-hub-walk-in',
    label: 'Walk-in orders',
    href: `${PARTNER_ORDERS_HUB_HREF}?chip=walk_in&source=walk_in`,
    keywords: 'walk-in counter offline',
  },
  {
    id: 'p-orders-hub-print',
    label: 'Print center',
    href: '/partner/floor/print',
    keywords: 'print tags bill invoice',
  },
];

/**
 * Owner Command Center nav — single Customers & Orders workplace under Operations.
 * Shop Floor display mode is retiring; this is the only partner shell after migration.
 */
export const PARTNER_NAV_SECTIONS: PartnerNavSection[] = [
  {
    id: 'today',
    label: 'Dashboard',
    items: [{ href: '/partner', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { href: PARTNER_CUSTOMERS_HREF, label: 'Customers', icon: UserCog },
      {
        href: PARTNER_ORDERS_HREF,
        label: 'Orders',
        icon: Package,
        badgeKeys: ['orders', 'bookingRequests'],
      },
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
    items: [{ href: '/partner/staff', label: 'Staff', icon: UserCog }],
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

/** Map legacy desk/BR/customers/intake/print paths onto the Customers & Orders Hub pathname. */
export function resolvePartnerNavPathname(pathname: string): string {
  const path = stripNavQuery(pathname);
  if (path === PARTNER_CUSTOMERS_HREF || path.startsWith(`${PARTNER_CUSTOMERS_HREF}/`)) {
    return PARTNER_CUSTOMERS_HREF;
  }
  if (path === PARTNER_ORDERS_HREF || path.startsWith(`${PARTNER_ORDERS_HREF}/`)) {
    return PARTNER_ORDERS_HREF;
  }
  if (
    PARTNER_ORDERS_HUB_ALIASES.some(
      (alias) => path === alias || path.startsWith(`${alias}/`),
    )
  ) {
    return PARTNER_ORDERS_HREF;
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

export function isPartnerNavActive(
  pathname: string,
  href: string,
  opts?: PartnerNavActiveOptions,
): boolean {
  const effectiveHref = stripNavQuery(href);
  const effectivePath = resolvePartnerNavPathname(pathname);
  const tab = opts?.tab ?? null;

  if (effectiveHref === PARTNER_ORDERS_HREF && tab === 'create') {
    return true;
  }

  return isPathNavLinkActive(effectivePath, effectiveHref, navFlatPaths(), ['/partner']);
}

export function getPartnerPageTitle(pathname: string, tab?: string | null): string {
  const effectivePath = resolvePartnerNavPathname(pathname);
  if (effectivePath === PARTNER_ORDERS_HREF && tab === 'create') {
    return 'New order';
  }
  return (
    PARTNER_NAV_FLAT.find((n) => isPartnerNavActive(effectivePath, n.href, { tab }))?.label ??
    'Partner'
  );
}
