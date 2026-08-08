'use client';

import Link from 'next/link';

import {
  SHOP_FLOOR_NAV_ITEMS,
  isShopFloorNavActive,
} from '@/features/partner-shop-floor/lib/shop-floor-nav';
import { cn } from '@/lib/utils';

type ShopFloorBottomNavProps = {
  pathname: string;
};

/** Mobile primary nav — 5 destinations, ≥64px tap targets. */
export function ShopFloorBottomNav({ pathname }: ShopFloorBottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md supports-[backdrop-filter]:bg-background/90 lg:hidden"
      aria-label="Shop Floor navigation"
    >
      <ul className="grid grid-cols-5 gap-0.5 px-1 pt-1">
        {SHOP_FLOOR_NAV_ITEMS.map(({ href, label, english, icon: Icon }) => {
          const active = isShopFloorNavActive(pathname, href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  'flex min-h-16 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-1.5 text-center transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )}
                aria-current={active ? 'page' : undefined}
                aria-label={`${label} — ${english}`}
              >
                <Icon className="h-6 w-6 shrink-0" aria-hidden strokeWidth={2} />
                <span className="max-w-full truncate text-[10px] font-semibold leading-tight">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
