'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, type KeyboardEvent } from 'react';

import { Badge } from '@/components/ui/badge';
import {
  ORDERS_HUB_TAB_LABELS,
  ORDERS_HUB_TABS,
  type OrdersHubBasePath,
  type OrdersHubTab,
  buildOrdersHubPath,
} from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';

type OrdersHubTabsProps = {
  basePath: OrdersHubBasePath;
  active: OrdersHubTab;
  /** Optional counts shown on tab labels (e.g. open booking requests). */
  badges?: Partial<Record<OrdersHubTab, number>>;
  /** Optional label overrides (e.g. partner directory → Customers). */
  labels?: Partial<Record<OrdersHubTab, string>>;
};

export function OrdersHubTabs({ basePath, active, badges, labels }: OrdersHubTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectTab = useCallback(
    (tab: OrdersHubTab) => {
      router.replace(buildOrdersHubPath(basePath, tab, searchParams), { scroll: false });
    },
    [basePath, router, searchParams],
  );

  const onTabListKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
      if (!keys.includes(event.key)) return;

      const currentIndex = ORDERS_HUB_TABS.indexOf(active);
      let nextIndex = currentIndex;
      if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ORDERS_HUB_TABS.length;
      if (event.key === 'ArrowLeft') {
        nextIndex = (currentIndex - 1 + ORDERS_HUB_TABS.length) % ORDERS_HUB_TABS.length;
      }
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = ORDERS_HUB_TABS.length - 1;

      event.preventDefault();
      const next = ORDERS_HUB_TABS[nextIndex];
      if (next) selectTab(next);
    },
    [active, selectTab],
  );

  return (
    <div
      className="-mx-1 max-w-full overflow-x-auto px-1"
      role="tablist"
      aria-label="Orders hub"
      data-testid="orders-hub-tabs"
      onKeyDown={onTabListKeyDown}
    >
      <div className="inline-flex min-w-full gap-0.5 rounded-lg bg-muted/60 p-0.5 sm:min-w-0 sm:flex sm:flex-wrap">
        {ORDERS_HUB_TABS.map((tab) => {
          const count = badges?.[tab] ?? 0;
          const label = labels?.[tab] ?? ORDERS_HUB_TAB_LABELS[tab];
          const selected = active === tab;
          return (
            <button
              key={tab}
              id={`orders-hub-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`orders-hub-panel-${tab}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => selectTab(tab)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors duration-200',
                'h-9 sm:h-8',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                selected
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {label}
              {count > 0 ? (
                <Badge
                  variant="destructive"
                  className="min-w-[1.25rem] justify-center px-1.5 text-[10px] leading-none"
                  data-testid={`orders-hub-tab-badge-${tab}`}
                >
                  {count > 99 ? '99+' : count}
                </Badge>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
