'use client';

import { useRouter, useSearchParams } from 'next/navigation';

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
};

export function OrdersHubTabs({ basePath, active, badges }: OrdersHubTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function selectTab(tab: OrdersHubTab) {
    router.replace(buildOrdersHubPath(basePath, tab, searchParams), { scroll: false });
  }

  return (
    <div
      className="-mx-1 max-w-full overflow-x-auto px-1"
      role="tablist"
      aria-label="Orders hub"
      data-testid="orders-hub-tabs"
    >
      <div className="inline-flex min-w-full gap-0.5 rounded-lg bg-muted/60 p-0.5 sm:min-w-0 sm:flex sm:flex-wrap">
        {ORDERS_HUB_TABS.map((tab) => {
          const count = badges?.[tab] ?? 0;
          return (
            <button
              key={tab}
              type="button"
              role="tab"
              aria-selected={active === tab}
              onClick={() => selectTab(tab)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                'min-h-[44px] sm:min-h-[40px]',
                active === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {ORDERS_HUB_TAB_LABELS[tab]}
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
