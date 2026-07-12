'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Package } from 'lucide-react';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { OrderStatusBadge } from '@/features/orders/order-status-badge';
import { formatInr } from '@/features/discover/detail/order-pricing';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listOrders } from '@/services/orders';

function OrdersListSkeleton() {
  return (
    <ul className="space-y-3" aria-busy="true" aria-label="Loading orders">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-24 w-full rounded-xl" />
        </li>
      ))}
    </ul>
  );
}

export function OrdersList() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.orders(),
    queryFn: () => listOrders({ limit: 50, offset: 0 }),
    staleTime: STALE.orders,
  });

  if (isLoading) return <OrdersListSkeleton />;

  if (isError) {
    return (
      <QueryErrorState
        title="Could not load orders"
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!data?.length) {
    return (
      <EmptyState
        icon={Package}
        title="No orders yet"
        description="Book a laundry from Discover — pickup, wash, and delivery in a few taps."
        action={{ label: 'Find a laundry', href: '/discover' }}
      />
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((o) => (
        <li key={o.id}>
          <Link
            href={`/orders/${o.id}`}
            className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Card className="overflow-hidden rounded-2xl border-0 shadow-soft ring-1 ring-border/60 transition-all group-hover:shadow-[var(--shadow-card-hover)] group-hover:ring-primary/30">
              <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                <div
                  className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 sm:flex"
                  aria-hidden
                >
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-lg font-bold text-foreground">#{o.tracking_code}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <OrderStatusBadge status={o.status} />
                    <Badge variant="outline" className="capitalize">
                      {o.payment_status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm font-semibold tabular-nums text-foreground">
                    {formatInr(Number(o.total_inr))}
                  </p>
                </div>
                <ChevronRight
                  className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </CardContent>
            </Card>
          </Link>
        </li>
      ))}
    </ul>
  );
}
