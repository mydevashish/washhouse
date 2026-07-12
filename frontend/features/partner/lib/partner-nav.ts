import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Bell,
  ClipboardList,
  FileText,
  LayoutDashboard,
  Package,
  Radio,
  Settings,
  Sparkles,
  Star,
  Store,
  Truck,
  Users,
  UserCog,
  Wallet,
} from 'lucide-react';

export type PartnerNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: 'orders' | 'pickups' | 'notifications';
};

export type PartnerNavSection = {
  id: string;
  label: string;
  items: PartnerNavItem[];
};

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
      { href: '/partner/orders', label: 'Orders', icon: Package, badgeKey: 'orders' },
      { href: '/partner/walk-in-orders', label: 'Walk-in orders', icon: Store },
      { href: '/partner/pickups', label: 'Pickup requests', icon: ClipboardList, badgeKey: 'pickups' },
      { href: '/partner/deliveries', label: 'Deliveries', icon: Truck },
      { href: '/partner/customers', label: 'Customer insights', icon: Users },
    ],
  },
  {
    id: 'shop',
    label: 'Your shop',
    items: [
      { href: '/partner/storefront', label: 'Storefront builder', icon: Sparkles },
      { href: '/partner/services', label: 'Service catalog', icon: ClipboardList },
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

export function isPartnerNavActive(pathname: string, href: string): boolean {
  if (href === '/partner') return pathname === '/partner';
  return pathname.startsWith(href);
}

export function getPartnerPageTitle(pathname: string): string {
  return PARTNER_NAV_FLAT.find((n) => isPartnerNavActive(pathname, n.href))?.label ?? 'Partner';
}
