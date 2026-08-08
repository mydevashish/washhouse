'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { ConfirmActionDialog } from '@/features/admin/components/confirm-action-dialog';
import { FloorBoardEmpty } from '@/features/partner-shop-floor/components/floor-board-empty';
import { FloorOrderCard } from '@/features/partner-shop-floor/components/floor-order-card';
import { useFloorOrderAdvance } from '@/features/partner-shop-floor/hooks/use-floor-order-advance';
import { getFloorAdvancePlan, phoneLast4 } from '@/features/partner-shop-floor/lib/floor-status';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listPartnerOrders, type PartnerOrder } from '@/services/partner';

export function ShopFloorReadyView() {
  const { advance, busyOrderId } = useFloorOrderAdvance();
  const [confirmOrder, setConfirmOrder] = useState<PartnerOrder | null>(null);

  const ordersQ = useQuery({
    queryKey: queryKeys.partnerOrders({ surface: 'floor-ready', status: 'ready', page_size: 50 }),
    queryFn: () => listPartnerOrders({ page: 1, page_size: 50, status: 'ready' }),
    staleTime: STALE.partnerAnalytics,
    // Rely on mutation invalidation + window focus — do not poll 50-row boards.
  });

  const readyOrders = useMemo(() => {
    return (ordersQ.data?.items ?? []).slice(0, 24);
  }, [ordersQ.data?.items]);

  const confirmPlan = confirmOrder
    ? getFloorAdvancePlan(confirmOrder.status, confirmOrder.order_source)
    : null;

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4" data-testid="shop-floor-ready">
      <PartnerPanel
        title="Ready / Diya"
        description="Customer ko kapde do — bill print ya call."
        bodyClassName="space-y-4 p-4"
      >
        {ordersQ.isLoading ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Ready bags load ho rahe hain…
          </p>
        ) : null}

        {ordersQ.isError ? (
          <QueryErrorState
            title="Ready list load nahi hui"
            message={getApiErrorMessage(ordersQ.error, 'Try again')}
            onRetry={() => void ordersQ.refetch()}
            isRetrying={ordersQ.isFetching}
          />
        ) : null}

        {!ordersQ.isLoading && !ordersQ.isError && readyOrders.length === 0 ? (
          <FloorBoardEmpty
            title="Koi Ready bag nahi"
            instruction="Jab washing khatam ho, Aaj ka Kaam se Ready dabao — phir yahan dikhega."
            imageSrc="/catalog/services/quality-check.webp"
            imageAlt="Clothes ready for quality check"
            actionHref="/partner/floor/today"
            actionLabel="Aaj ka Kaam dekho"
          />
        ) : null}

        <ul className="space-y-3">
          {readyOrders.map((order) => {
            const plan = getFloorAdvancePlan(order.status, order.order_source);
            return (
              <FloorOrderCard
                key={order.id}
                order={order}
                plan={plan}
                variant="ready"
                advancing={busyOrderId === order.id}
                onGive={() => setConfirmOrder(order)}
              />
            );
          })}
        </ul>
      </PartnerPanel>

      <ConfirmActionDialog
        open={Boolean(confirmOrder)}
        onOpenChange={(open) => {
          if (!open) setConfirmOrder(null);
        }}
        title="Kapde de diye?"
        description={
          confirmOrder
            ? `${confirmOrder.customer_name}${
                phoneLast4(confirmOrder.customer_phone)
                  ? ` (···${phoneLast4(confirmOrder.customer_phone)})`
                  : ''
              } · ${confirmOrder.token_code ?? confirmOrder.tracking_code} · ${formatInr(
                Number(confirmOrder.total_inr),
              )}. Diya confirm karoge?`
            : ''
        }
        confirmLabel={confirmPlan?.label ?? 'Diya / Given'}
        pending={busyOrderId === confirmOrder?.id}
        onConfirm={() => {
          if (!confirmOrder) return;
          void advance(confirmOrder).then((result) => {
            if (result) setConfirmOrder(null);
          });
        }}
      />
    </div>
  );
}
