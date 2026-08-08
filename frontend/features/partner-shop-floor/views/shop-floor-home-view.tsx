'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerUiModeToggle } from '@/features/partner-shop-floor/components/partner-ui-mode-toggle';
import { ShopFloorTile } from '@/features/partner-shop-floor/components/shop-floor-tile';
import { countFloorOrders } from '@/features/partner-shop-floor/lib/floor-status';
import { SHOP_FLOOR_HOME_TILES } from '@/features/partner-shop-floor/lib/shop-floor-nav';
import type { ShopFloorTileTone } from '@/features/partner-shop-floor/components/shop-floor-tile';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listPartnerOrders } from '@/services/partner';

const TILE_TONES: ShopFloorTileTone[] = ['order', 'today', 'ready', 'print'];

export function ShopFloorHomeView() {
  const ordersQ = useQuery({
    queryKey: queryKeys.partnerOrders({ surface: 'floor', page_size: 50 }),
    queryFn: () => listPartnerOrders({ page: 1, page_size: 50, bucket: 'active' }),
    staleTime: STALE.partnerAnalytics,
  });

  const counts = countFloorOrders(ordersQ.data?.items ?? []);

  return (
    <PartnerContent className="flex min-h-full flex-col gap-5 pb-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Shop Floor</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Char bade buttons — naya order, aaj ka kaam, ready, print.
        </p>
      </header>

      {/* No KPI charts — TTI budget ~2.5s mid Android; badge counts only. */}
      <div
        className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
        data-testid="shop-floor-home-tiles"
        data-no-charts="true"
      >
        {SHOP_FLOOR_HOME_TILES.map((tile, index) => {
          const tone = TILE_TONES[index] ?? 'order';
          let badgeCount = 0;
          if (tile.href === '/partner/floor/today') badgeCount = counts.todayAttention;
          if (tile.href === '/partner/floor/ready') badgeCount = counts.readyAttention;

          return (
            <ShopFloorTile
              key={tile.href}
              href={tile.href}
              label={tile.label}
              english={tile.english}
              icon={tile.icon}
              tone={tone}
              badgeCount={badgeCount}
            />
          );
        })}
      </div>

      <footer className="mt-auto space-y-3 border-t border-border/60 pt-4">
        <PartnerUiModeToggle compact />
        <p className="text-center text-xs text-muted-foreground">
          Full analytics aur settings ke liye{' '}
          <Link href="/partner/floor/more" className="font-medium text-primary underline-offset-2 hover:underline">
            More
          </Link>{' '}
          ya Advanced Mode.
        </p>
      </footer>
    </PartnerContent>
  );
}
