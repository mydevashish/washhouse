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
  Users,
  AlertOctagon,
  Wallet,
  Star,
} from 'lucide-react';

import { isPathNavLinkActive } from '@/lib/navigation/nav-active';

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'approvals' | 'complaints' | 'inventoryChanges' | 'fraudAlerts';
};

export type AdminNavSection = {
  id: string;
  label: string;
  items: AdminNavItem[];
};

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
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/orders', label: 'Orders', icon: Package },
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    items: [
      { href: '/admin/revenue/analytics', label: 'Revenue analytics', icon: BarChart3 },
      { href: '/admin/settlements', label: 'Settlements', icon: Wallet },
      { href: '/admin/profit-sharing', label: 'Profit sharing', icon: Percent },
      { href: '/admin/revenue', label: 'Transactions', icon: IndianRupee },
      { href: '/admin/commission', label: 'Commission', icon: Percent },
    ],
  },
  {
    id: 'approvals',
    label: 'Approvals',
    items: [
      { href: '/admin/approvals', label: 'Approval center', icon: ClipboardCheck, badgeKey: 'approvals' },
      { href: '/admin/inventory-changes', label: 'Inventory changes', icon: ClipboardList, badgeKey: 'inventoryChanges' },
      { href: '/admin/disputes', label: 'Disputes', icon: AlertTriangle, badgeKey: 'complaints' },
      { href: '/admin/disputes/analytics', label: 'Dispute analytics', icon: BarChart3 },
      { href: '/admin/reviews/moderation', label: 'Review moderation', icon: Star },
      { href: '/admin/trust-scores', label: 'Trust scores', icon: Shield },
    ],
  },
  {
    id: 'monitoring',
    label: 'Monitoring',
    items: [
      { href: '/admin/audit', label: 'Audit logs', icon: FileText },
      { href: '/admin/fraud', label: 'Fraud detection', icon: AlertOctagon, badgeKey: 'fraudAlerts' },
      { href: '/admin/notifications', label: 'Notifications', icon: Bell, badgeKey: 'complaints' },
      { href: '/admin/announcements', label: 'Announcement Center', icon: Megaphone },
      { href: '/admin/customer-experience', label: 'Customer experience', icon: Store },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    items: [
      { href: '/admin/configuration', label: 'Configuration Center', icon: Settings },
      { href: '/admin/settings', label: 'Settings', icon: Settings },
    ],
  },
];

/** Flat list for breadcrumbs and search. */
export const ADMIN_NAV_FLAT = ADMIN_NAV_SECTIONS.flatMap((s) => s.items);

export function isAdminNavActive(pathname: string, href: string): boolean {
  return isPathNavLinkActive(pathname, href, ADMIN_NAV_FLAT.map((item) => item.href), ['/admin']);
}

export function getAdminPageTitle(pathname: string): string {
  return ADMIN_NAV_FLAT.find((n) => isAdminNavActive(pathname, n.href))?.label ?? 'Admin';
}
