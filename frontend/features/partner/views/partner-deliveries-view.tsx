'use client';

import { Truck } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { isDeliveryStage } from '@/features/partner/lib/partner-derive';
import { usePartnerOrders, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';

export function PartnerDeliveriesView() {
  const enabled = usePartnerQueriesEnabled();
  const ordersQ = usePartnerOrders();
  const deliveries = (enabled ? ordersQ.data ?? [] : []).filter((o) => isDeliveryStage(o.status));

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Deliveries"
        description="Orders ready to go out or already with delivery agents."
      />

      {(!enabled || ordersQ.isPending) && <Skeleton className="h-80 w-full rounded-2xl" />}
      {enabled && !ordersQ.isPending && deliveries.length === 0 && (
        <EmptyState
          icon={Truck}
          title="No deliveries in queue"
          description="Orders marked ready will appear here for dispatch."
        />
      )}
      {deliveries.length > 0 && <PartnerOrdersTable orders={deliveries} filter="all" />}
    </PartnerContent>
  );
}
