import type { LucideIcon } from 'lucide-react';
import {
  ClipboardCheck,
  Ellipsis,
  PackageCheck,
  PlusCircle,
  Printer,
} from 'lucide-react';

import { isPathNavLinkActive } from '@/lib/navigation/nav-active';

export type ShopFloorNavItem = {
  href: string;
  /** Hinglish primary label */
  label: string;
  /** Short English subtitle for a11y / secondary line */
  english: string;
  icon: LucideIcon;
};

/**
 * Shop Floor primary destinations (exactly 4) + More.
 * Naya Order → Cloth Wall (`/partner/floor/new`); Advanced New Order remains `/partner/new-order`.
 */
export const SHOP_FLOOR_NAV_ITEMS: readonly ShopFloorNavItem[] = [
  {
    href: '/partner/floor/new',
    label: 'Naya Order',
    english: 'New order',
    icon: PlusCircle,
  },
  {
    href: '/partner/floor/today',
    label: 'Aaj ka Kaam',
    english: "Today's work",
    icon: ClipboardCheck,
  },
  {
    href: '/partner/floor/ready',
    label: 'Ready / Diya',
    english: 'Ready handoff',
    icon: PackageCheck,
  },
  {
    href: '/partner/floor/print',
    label: 'Print',
    english: 'Print center',
    icon: Printer,
  },
  {
    href: '/partner/floor/more',
    label: 'More',
    english: 'Settings & more',
    icon: Ellipsis,
  },
] as const;

/** Primary floor actions only (home tiles) — excludes More. */
export const SHOP_FLOOR_HOME_TILES = SHOP_FLOOR_NAV_ITEMS.filter(
  (item) => item.href !== '/partner/floor/more',
);

export function countShopFloorNavItems(): number {
  return SHOP_FLOOR_NAV_ITEMS.length;
}

export function isShopFloorNavActive(pathname: string, href: string): boolean {
  return isPathNavLinkActive(
    pathname,
    href,
    SHOP_FLOOR_NAV_ITEMS.map((item) => item.href),
    ['/partner'],
  );
}

export function getShopFloorPageTitle(pathname: string): string | null {
  if (pathname === '/partner' || pathname === '/partner/') {
    return 'Shop Floor';
  }
  const match = SHOP_FLOOR_NAV_ITEMS.find((item) => isShopFloorNavActive(pathname, item.href));
  return match?.label ?? null;
}
