'use client';

import Link from 'next/link';
import { Package, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { InfoBanner } from '@/components/ui/info-banner';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type {
  CustomerDeskOrderRow,
  ReorderPrefill,
} from '@/features/partner/customer-desk/types';
import { usePartnerCustomerDeskOrders } from '@/features/partner/customer-desk/hooks';
import { getApiErrorMessage } from '@/lib/api-error-message';

const SOURCE_LABELS: Record<string, string> = {
  online: 'Online',
  walk_in: 'Walk-in',
  assisted_admin: 'Ops assisted',
  assisted_partner: 'Assisted',
};

const PAGE_SIZE = 20;

type Props = {
  profile: { user_id: string | null; phone: string } | null;
  open: boolean;
  onPlaceFirstOrder: () => void;
  onReorder: (prefill: ReorderPrefill) => void;
};

export function PartnerCustomerDeskOrdersTab({
  profile,
  open,
  onPlaceFirstOrder,
  onReorder,
}: Props) {
  const [page, setPage] = useState(1);
  const profileKey = profile ? `${profile.user_id ?? ''}:${profile.phone}` : '';

  useEffect(() => {
    setPage(1);
  }, [profileKey]);

  const ordersQ = usePartnerCustomerDeskOrders(profile, open, { page, page_size: PAGE_SIZE });
  const data = ordersQ.data;

  if (ordersQ.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true" aria-label="Loading orders">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (ordersQ.isError) {
    return (
      <QueryErrorState
        title="Could not load orders"
        message={getApiErrorMessage(ordersQ.error)}
        onRetry={() => void ordersQ.refetch()}
        isRetrying={ordersQ.isFetching}
      />
    );
  }

  if (!data?.items.length) {
    return (
      <div className="space-y-3">
        <InfoBanner variant="default" title="Only your laundry">
          Past orders here are scoped to your shop. Other laundries&apos; orders for the same
          customer never appear — even if they ordered elsewhere on WashHouse.
        </InfoBanner>
        <EmptyState
          icon={Package}
          title="No past orders at your laundry"
          description="Place a doorstep order or record a walk-in for this caller."
          secondaryAction={{ label: 'New order', onClick: onPlaceFirstOrder }}
        />
      </div>
    );
  }

  const totalPages = Math.max(1, data.total_pages || 1);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing only orders at your laundry ({data.total_records} total).
      </p>
      <ul className="space-y-2" aria-label="Past orders at your laundry">
        {data.items.map((order) => (
          <li key={order.id}>
            <OrderHistoryCard order={order} onReorder={onReorder} />
          </li>
        ))}
      </ul>
      {totalPages > 1 || data.has_next || data.has_previous ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Page {data.page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              disabled={!data.has_previous || ordersQ.isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-[44px]"
              disabled={!data.has_next || ordersQ.isFetching}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function OrderHistoryCard({
  order,
  onReorder,
}: {
  order: CustomerDeskOrderRow;
  onReorder: (prefill: ReorderPrefill) => void;
}) {
  const sourceLabel = SOURCE_LABELS[order.order_source] ?? order.order_source;

  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-semibold">#{order.tracking_code}</span>
            <Badge variant="outline" className="text-[10px] font-medium">
              {order.status.replace(/_/g, ' ')}
            </Badge>
            <Badge variant="secondary" className="text-[10px] font-medium">
              {sourceLabel}
            </Badge>
          </div>
          {order.item_summary ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">{order.item_summary}</p>
          ) : null}
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">
            {formatInr(Number(order.total_inr))}
          </p>
          <ClientDate
            iso={order.created_at}
            mode="date"
            className="text-[11px] text-muted-foreground"
          />
        </div>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        <Button
          type="button"
          variant="default"
          size="sm"
          className="h-8 gap-1.5 text-xs"
          onClick={() =>
            onReorder({
              orderId: order.id,
              trackingCode: order.tracking_code,
              itemSummary: order.item_summary,
            })
          }
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Reorder
        </Button>
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href={`/partner/orders?q=${encodeURIComponent(order.tracking_code)}`}>
            View in orders
          </Link>
        </Button>
      </div>
    </article>
  );
}
