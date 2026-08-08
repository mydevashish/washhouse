'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Button } from '@/components/ui/button';
import { FloorBoardEmpty } from '@/features/partner-shop-floor/components/floor-board-empty';
import { FloorOrderCard } from '@/features/partner-shop-floor/components/floor-order-card';
import { useFloorOrderAdvance } from '@/features/partner-shop-floor/hooks/use-floor-order-advance';
import {
  filterFloorOrders,
  getFloorAdvancePlan,
  FLOOR_STATUS_LABELS,
  type FloorFilter,
} from '@/features/partner-shop-floor/lib/floor-status';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { cn } from '@/lib/utils';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listPartnerOrders } from '@/services/partner';

const FILTERS: { id: FloorFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'received', label: FLOOR_STATUS_LABELS.received.hinglish },
  { id: 'washing', label: FLOOR_STATUS_LABELS.washing.hinglish },
  { id: 'ready', label: FLOOR_STATUS_LABELS.ready.hinglish },
];

export function ShopFloorTodayView() {
  const [filter, setFilter] = useState<FloorFilter>('all');
  const [showGiven, setShowGiven] = useState(false);
  const { advance, busyOrderId } = useFloorOrderAdvance();

  const ordersQ = useQuery({
    queryKey: queryKeys.partnerOrders({ surface: 'floor-today', page_size: 50 }),
    queryFn: () => listPartnerOrders({ page: 1, page_size: 50, bucket: 'all' }),
    staleTime: STALE.partnerAnalytics,
  });

  const visible = useMemo(() => {
    const rows = ordersQ.data?.items ?? [];
    return filterFloorOrders(rows, filter, showGiven).slice(0, 40);
  }, [ordersQ.data?.items, filter, showGiven]);

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="shop-floor-today">
      <PartnerPanel
        title="Aaj ka Kaam"
        description="Color + token se bag dhundo — ek tap se next status."
        bodyClassName="space-y-4 p-4"
      >
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Status filter">
          {FILTERS.map((item) => (
            <Button
              key={item.id}
              type="button"
              size="sm"
              variant={filter === item.id ? 'default' : 'outline'}
              className="min-h-11 px-3"
              role="tab"
              aria-selected={filter === item.id}
              data-testid={`floor-filter-${item.id}`}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </Button>
          ))}
          <Button
            type="button"
            size="sm"
            variant={showGiven ? 'default' : 'outline'}
            className="min-h-11 px-3"
            data-testid="floor-filter-given-toggle"
            onClick={() => setShowGiven((v) => !v)}
          >
            Aaj diya
          </Button>
        </div>

        {ordersQ.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Aaj ke bags load ho rahe hain…
          </p>
        ) : null}

        {ordersQ.isError ? (
          <QueryErrorState
            title="Today list load nahi hui"
            message={getApiErrorMessage(ordersQ.error, 'Try again')}
            onRetry={() => void ordersQ.refetch()}
            isRetrying={ordersQ.isFetching}
          />
        ) : null}

        {!ordersQ.isLoading && !ordersQ.isError && visible.length === 0 ? (
          <FloorBoardEmpty
            title="Abhi koi bag nahi"
            instruction="Pehle Naya Order se bag banao — phir yahan color token dikhega."
            actionHref="/partner/floor/new"
            actionLabel="Naya Order banao"
          />
        ) : null}

        <ul className={cn('space-y-3', visible.length === 0 && 'hidden')}>
          {visible.map((order) => {
            const plan = getFloorAdvancePlan(order.status, order.order_source);
            return (
              <FloorOrderCard
                key={order.id}
                order={order}
                plan={plan}
                variant="today"
                advancing={busyOrderId === order.id}
                onAdvance={() => void advance(order)}
              />
            );
          })}
        </ul>
      </PartnerPanel>
    </div>
  );
}
