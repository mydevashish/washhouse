'use client';

import { Package } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { usePartnerOrders, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';

export function PartnerOrdersView() {
  const enabled = usePartnerQueriesEnabled();
  const ordersQ = usePartnerOrders();

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title="Orders" description="Accept, process, and deliver customer orders." />

      {(!enabled || ordersQ.isPending) && <Skeleton className="h-96 w-full rounded-2xl" />}
      {enabled && ordersQ.isError && (
        <InfoBanner variant="destructive" title="Could not load orders">
          Refresh the page to try again.
        </InfoBanner>
      )}
      {ordersQ.data && ordersQ.data.length === 0 && (
        <EmptyState
          icon={Package}
          title="No orders yet"
          description="When customers book your laundry, orders appear here instantly."
        />
      )}
      {enabled && ordersQ.data && ordersQ.data.length > 0 && (
        <PartnerOrdersTable orders={ordersQ.data} />
      )}
    </PartnerContent>
  );
}
