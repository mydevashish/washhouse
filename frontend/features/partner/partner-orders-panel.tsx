'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Package, RefreshCw } from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import { getPartnerNextStatus, isOrderNeedsAction } from '@/features/partner/lib/partner-status';
import {
  acceptOrder,
  listPartnerOrders,
  rejectOrder,
  updateOrderStatus,
} from '@/services/partner';
import { queryKeys } from '@/lib/query-keys';
import { cn } from '@/lib/utils';

type Filter = 'action' | 'active' | 'done' | 'all';

export function PartnerOrdersPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('action');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'accept' | 'reject' | 'advance' | null>(null);

  const ordersQ = useQuery({
    queryKey: queryKeys.partnerOrders(),
    queryFn: listPartnerOrders,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomers() });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptOrder,
    onMutate: (id) => {
      setBusyId(id);
      setBusyAction('accept');
    },
    onSuccess: () => {
      toast.success('Order accepted');
      invalidate();
    },
    onError: () => toast.error('Could not accept — try again'),
    onSettled: () => {
      setBusyId(null);
      setBusyAction(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onMutate: (id) => {
      setBusyId(id);
      setBusyAction('reject');
    },
    onSuccess: () => {
      toast.success('Order rejected');
      invalidate();
    },
    onError: () => toast.error('Could not reject — try again'),
    onSettled: () => {
      setBusyId(null);
      setBusyAction(null);
    },
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onMutate: ({ id }) => {
      setBusyId(id);
      setBusyAction('advance');
    },
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: () => toast.error('Update failed — try again'),
    onSettled: () => {
      setBusyId(null);
      setBusyAction(null);
    },
  });

  const orders = ordersQ.data ?? [];

  const filtered = useMemo(() => {
    switch (filter) {
      case 'action':
        return orders.filter((o) => isOrderNeedsAction(o.status, o.order_source));
      case 'active':
        return orders.filter(
          (o) =>
            o.status !== 'delivered' &&
            o.status !== 'cancelled' &&
            !isOrderNeedsAction(o.status, o.order_source),
        );
      case 'done':
        return orders.filter((o) => o.status === 'delivered' || o.status === 'cancelled');
      default:
        return orders;
    }
  }, [orders, filter]);

  const actionCount = orders.filter((o) => isOrderNeedsAction(o.status, o.order_source)).length;

  const filters: { id: Filter; label: string }[] = [
    { id: 'action', label: `New (${actionCount})` },
    { id: 'active', label: 'In progress' },
    { id: 'done', label: 'Done' },
    { id: 'all', label: 'All' },
  ];

  if (ordersQ.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (ordersQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load orders">
        Pull to refresh or tap the button below.
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full"
          onClick={() => void ordersQ.refetch()}
        >
          Try again
        </Button>
      </InfoBanner>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          Tap a big button to accept, reject, or move an order forward.
        </p>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="shrink-0"
          aria-label="Refresh orders"
          onClick={() => void ordersQ.refetch()}
        >
          <RefreshCw className={cn('h-4 w-4', ordersQ.isFetching && 'animate-spin')} />
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            variant={filter === f.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f.id)}
            className="shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Package}
          title={filter === 'action' ? 'No new orders' : 'Nothing here'}
          description={
            filter === 'action'
              ? 'New customer orders will show up here. Check back soon.'
              : 'Try another filter above.'
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((order) => {
            const next = getPartnerNextStatus(order.status, order.order_source);
            return (
              <li key={order.id}>
                <PartnerOrderCard
                  order={order}
                  onAccept={() => acceptMutation.mutate(order.id)}
                  onReject={() => rejectMutation.mutate(order.id)}
                  onAdvance={() => {
                    if (next) advanceMutation.mutate({ id: order.id, status: next });
                  }}
                  isAccepting={busyId === order.id && busyAction === 'accept'}
                  isRejecting={busyId === order.id && busyAction === 'reject'}
                  isAdvancing={busyId === order.id && busyAction === 'advance'}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
