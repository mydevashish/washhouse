import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  BarChart3,
  Bell,
  ClipboardCheck,
  ClipboardList,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Megaphone,
  Package,
  Percent,
  Settings,
  Shield,
  Store,
  AlertOctagon,
  Wallet,
  Star,
} from 'lucide-react';

import { isPathNavLinkActive } from '@/lib/navigation/nav-active';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'approvals' | 'complaints' | 'inventoryChanges' | 'fraudAlerts' | 'bookingRequests';
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

/** Orders Hub home — collapsed Customers / Desk / Booking requests land here. */
export const ADMIN_ORDERS_HUB_HREF = '/admin/orders';

/**
 * Legacy ops paths that belong to Orders Hub (Prompt 2 redirects).
 * Active state / titles / breadcrumbs treat these as Orders.
 */
export const ADMIN_ORDERS_HUB_ALIASES = [
  '/admin/customers',
  '/admin/customer-desk',
  '/admin/booking-requests',
] as const;

/** Search / quick-action aliases — old labels resolve into hub tabs. */
export const ADMIN_ORDERS_HUB_SEARCH_ALIASES: ReadonlyArray<{
  id: string;
  label: string;
  href: string;
  keywords: string;
}> = [
  {
    id: 'a-orders-hub-desk',
    label: 'Customer Desk',
    href: `${ADMIN_ORDERS_HUB_HREF}?tab=desk`,
    keywords: 'find customer phone lookup desk assisted',
  },
  {
    id: 'a-orders-hub-requests',
    label: 'Booking requests',
    href: `${ADMIN_ORDERS_HUB_HREF}?tab=requests`,
    keywords: 'leads inbox requests booking',
  },
  {
    id: 'a-orders-hub-directory',
    label: 'Customers',
    href: `${ADMIN_ORDERS_HUB_HREF}?tab=directory`,
    keywords: 'directory customers table',
  },
  {
    id: 'a-orders-hub-find',
    label: 'Find customer',
    href: `${ADMIN_ORDERS_HUB_HREF}?tab=desk`,
    keywords: 'desk phone search orders hub',
  },
];

export const ADMIN_NAV_SECTIONS: AdminNavSection[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    items: [
      { href: '/admin', label: 'Overview', icon: LayoutDashboard },
      { href: '/admin/business-health', label: 'Business health', icon: BarChart3 },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    items: [
      { href: '/admin/laundries', label: 'Laundries', icon: Store },
      {
        href: ADMIN_ORDERS_HUB_HREF,
        label: 'Orders',
        icon: Package,
        badgeKey: 'bookingRequests',
      },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { href: '/admin/revenue/analytics', label: 'Revenue analytics', icon: BarChart3 },
      { href: '/admin/settlements', label: 'Settlements', icon: Wallet },
      // { href: '/admin/profit-sharing', label: 'Profit sharing', icon: Percent },
      { href: '/admin/revenue', label: 'Transactions', icon: IndianRupee },
      { href: '/admin/commission', label: 'Commission', icon: Percent },
    ],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    items: [
      { href: '/admin/approvals', label: 'Approval center', icon: ClipboardCheck, badgeKey: 'approvals' },
      // { href: '/admin/inventory-changes', label: 'Inventory changes', icon: ClipboardList, badgeKey: 'inventoryChanges' },
      // { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badgeKey: 'complaints' },
      // { href: '/admin/disputes/analytics', label: 'Dispute analytics', icon: BarChart3 },
      // { href: '/admin/reviews/moderation', label: 'Review moderation', icon: Star },
      // { href: '/admin/trust-scores', label: 'Trust scores', icon: Shield },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    items: [
      { href: '/admin/audit', label: 'Audit logs', icon: FileText },
      // { href: '/admin/fraud', label: 'Fraud detection', icon: AlertOctagon, badgeKey: 'fraudAlerts' },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell, badgeKey: 'complaints' },
      { href: '/admin/announcements', label: 'Announcement Center', icon: Megaphone },
      // { href: '/admin/customer-experience', label: 'Customer experience', icon: Store },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      // { href: '/admin/configuration', label: 'Configuration Center', icon: Settings },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Flat list for breadcrumbs and search. */
export const ADMIN_NAV_FLAT = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);

/** Strip `?query` so `/admin/orders?tab=desk` matches the Orders nav item. */
export function stripNavQuery(hrefOrPath: string): string {
  const q = hrefOrPath.indexOf('?');
  return q === -1 ? hrefOrPath : hrefOrPath.slice(0, q);
}

/** Map legacy desk/BR/customers paths onto the Orders Hub pathname. */
export function resolveAdminNavPathname(pathname: string): string {
  const path = stripNavQuery(pathname);
  if (
    ADMIN_ORDERS_HUB_ALIASES.some(
      (alias) => path === alias || path.startsWith(`${alias}/`),
    )
  ) {
    return ADMIN_ORDERS_HUB_HREF;
  }
  return path;
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  const effectivePath = resolveAdminNavPathname(pathname);
  const effectiveHref = stripNavQuery(href);
  return isPathNavLinkActive(
    effectivePath,
    effectiveHref,
    ADMIN_NAV_FLAT.map((item) => item.href),
    ['/admin'],
  );
}

export function getAdminPageTitle(pathname: string): string {
  const effectivePath = resolveAdminNavPathname(pathname);
  return ADMIN_NAV_FLAT.find((n) => isAdminNavActive(effectivePath, n.href))?.label ?? 'Admin';
}
