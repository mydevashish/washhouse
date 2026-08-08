'use client';

import Link from 'next/link';

import {
  SHOP_FLOOR_NAV_ITEMS,
  isShopFloorNavActive,
} from '@/features/partner-shop-floor/lib/shop-floor-nav';
import { cn } from '@/lib/utils';

type ShopFloorSidebarProps = {
  pathname: string;
  laundryName?: string;
  userName?: string;
  onNavigate?: () => void;
};

export function ShopFloorSidebar({
  pathname,
  laundryName,
  userName,
  onNavigate,
}: ShopFloorSidebarProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 border-b border-border/60 px-3 py-3">
        <Link href="/partner" className="block min-w-0" onClick={onNavigate}>
          <p className="truncate text-sm font-semibold">{laundryName ?? 'Your laundry'}</p>
          <p className="text-[10px] text-muted-foreground">Shop Floor</p>
        </Link>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-3" aria-label="Shop Floor navigation">
        <ul className="flex flex-col gap-1">
          {SHOP_FLOOR_NAV_ITEMS.map(({ href, label, english, icon: Icon }) => {
            const active = isShopFloorNavActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  className={cn(
                    'flex min-h-16 items-center gap-3 rounded-xl px-3 py-3 text-base font-semibold transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-muted/70',
                  )}
                  aria-current={active ? 'page' : undefined}
                  aria-label={`${label} — ${english}`}
                >
                  <Icon className="h-6 w-6 shrink-0" aria-hidden strokeWidth={2} />
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate leading-tight">{label}</span>
                    <span
                      className={cn(
                        'truncate text-xs font-medium',
                        active ? 'text-primary-foreground/80' : 'text-muted-foreground',
                      )}
                    >
                      {english}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="shrink-0 border-t border-border/60 px-3 py-2.5 text-[11px] text-muted-foreground">
        <p className="truncate font-medium text-foreground">{userName ?? 'Partner'}</p>
      </div>
    </div>
  );
}
