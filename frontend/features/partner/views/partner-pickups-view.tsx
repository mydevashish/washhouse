'use client';

import { ClipboardList } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerOrdersTable } from '@/features/partner/components/partner-orders-table';
import { isPickupRequest } from '@/features/partner/lib/partner-derive';
import { usePartnerOrders, usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';

export function PartnerPickupsView() {
  const enabled = usePartnerQueriesEnabled();
  const ordersQ = usePartnerOrders();
  const pickups = (enabled ? ordersQ.data ?? [] : []).filter((o) => isPickupRequest(o.status));

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Pickup requests"
        description="Accept new orders and schedule pickups from customer addresses."
      />

      {(!enabled || ordersQ.isPending) && <Skeleton className="h-80 w-full rounded-2xl" />}
      {enabled && !ordersQ.isPending && pickups.length === 0 && (
        <EmptyState
          icon={ClipboardList}
          title="No pickup requests"
          description="New orders waiting for pickup will show here."
        />
      )}
      {pickups.length > 0 && <PartnerOrdersTable orders={pickups} filter="all" showSearch />}
    </PartnerContent>
  );
}
