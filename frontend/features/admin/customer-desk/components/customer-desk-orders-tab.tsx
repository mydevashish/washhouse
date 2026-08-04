'use client';

import Link from 'next/link';
import { Package } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/features/admin/lib/admin-badges';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { CustomerDeskOrderRow } from '@/features/admin/customer-desk/types';
import { useAdminCustomerDeskOrders } from '@/features/admin/customer-desk/hooks';
import { getApiErrorMessage } from '@/lib/api-error-message';

const SOURCE_LABELS: Record<string, string> = {
  online: 'Online',
  walk_in: 'Walk-in',
  assisted_admin: 'Assisted',
  assisted_partner: 'Partner assisted',
};

const PAGE_SIZE = 20;

type Props = {
  profile: { user_id: string | null; phone: string } | null;
  open: boolean;
  onPlaceFirstOrder: () => void;
};

export function CustomerDeskOrdersTab({ profile, open, onPlaceFirstOrder }: Props) {
  const [page, setPage] = useState(1);
  const profileKey = profile ? `${profile.user_id ?? ''}:${profile.phone}` : '';

  useEffect(() => {
    setPage(1);
  }, [profileKey]);

  const ordersQ = useAdminCustomerDeskOrders(profile, open, { page, page_size: PAGE_SIZE });
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
      <EmptyState
        icon={Package}
        title="No past orders yet"
        description="Place a doorstep order for this caller, or create a booking request if the laundry is unknown."
        secondaryAction={{ label: 'Place first order', onClick: onPlaceFirstOrder }}
      />
    );
  }

  const totalPages = Math.max(1, data.total_pages || 1);

  return (
    <div className="space-y-3">
      <ul className="space-y-2" aria-label="Past orders">
        {data.items.map((order) => (
          <li key={order.id}>
            <OrderHistoryCard order={order} />
          </li>
        ))}
      </ul>
      {totalPages > 1 || data.has_next || data.has_previous ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <p className="text-xs text-muted-foreground" aria-live="polite">
            Page {data.page} of {totalPages} · {data.total_records} order
            {data.total_records === 1 ? '' : 's'}
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

function OrderHistoryCard({ order }: { order: CustomerDeskOrderRow }) {
  const sourceLabel = SOURCE_LABELS[order.order_source] ?? order.order_source;

  return (
    <article className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-xs font-semibold">#{order.tracking_code}</span>
            <OrderStatusBadge status={order.status} />
            <Badge variant="outline" className="text-[10px] font-medium">
              {sourceLabel}
            </Badge>
          </div>
          <p className="truncate text-sm font-medium">{order.laundry_name}</p>
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
      <div className="mt-2.5">
        <Button asChild variant="outline" size="sm" className="h-8 text-xs">
          <Link href={`/admin/orders?q=${encodeURIComponent(order.tracking_code)}`}>
            View in orders
          </Link>
        </Button>
      </div>
    </article>
  );
}
