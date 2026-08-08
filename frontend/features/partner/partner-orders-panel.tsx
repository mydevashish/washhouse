'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOrderCard } from '@/features/partner/partner-order-card';
import { usePartnerOrders } from '@/features/partner/hooks/use-partner-operations';
import { getPartnerNextStatus } from '@/features/partner/lib/partner-status';
import {
  acceptOrder,
  listPartnerOrders,
  rejectOrder,
  updateOrderStatus,
  type PartnerOrder,
  type PartnerOrdersBucket,
} from '@/services/partner';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { HORIZONTAL_SCROLL_TOUCH_CLASS } from '@/lib/horizontal-scroll-touch';
import { cn } from '@/lib/utils';

type Filter = PartnerOrdersBucket;

export function PartnerOrdersPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Filter>('action');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<'accept' | 'reject' | 'advance' | null>(null);

  const list = useServerList<PartnerOrder, { bucket: Filter }>({
    queryKey: queryKeys.partnerOrders({ surface: 'panel' }),
    fetcher: (params) => listPartnerOrders(params),
    filters: { bucket: filter },
    defaultSort: { sort_by: 'created_at', sort_order: 'desc' },
    defaultPageSize: 10,
  });

  const actionCountQ = usePartnerOrders({ bucket: 'action', page: 1, page_size: 10 });
  const actionCount = actionCountQ.data?.total_records ?? 0;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
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

  const filters: { id: Filter; label: string }[] = [
    { id: 'action', label: `New (${actionCount})` },
    { id: 'active', label: 'In progress' },
    { id: 'done', label: 'Done' },
    { id: 'all', label: 'All' },
  ];

  if (list.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-12 w-full rounded-xl" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-48 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (list.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load orders">
        Pull to refresh or tap the button below.
        <Button
          type="button"
          variant="outline"
          className="mt-3 w-full min-h-11"
          onClick={() => void list.refetch()}
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
          className="min-h-11 min-w-11 shrink-0"
          aria-label="Refresh orders"
          onClick={() => void list.refetch()}
        >
          <RefreshCw className={cn('h-4 w-4', list.isFetching && 'animate-spin')} />
        </Button>
      </div>

      <div className={cn('flex gap-2 overflow-x-auto pb-1', HORIZONTAL_SCROLL_TOUCH_CLASS)}>
        {filters.map((f) => (
          <Button
            key={f.id}
            type="button"
            variant={filter === f.id ? 'default' : 'secondary'}
            size="sm"
            onClick={() => setFilter(f.id)}
            className="min-h-11 shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold"
          >
            {f.label}
          </Button>
        ))}
      </div>

      {list.rows.length === 0 ? (
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
          {list.rows.map((order) => {
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

      <DataTablePagination
        page={list.page}
        pageCount={list.pageCount}
        pageSize={list.pageSize}
        pageStart={list.pageStart}
        pageEnd={list.pageEnd}
        totalCount={list.totalRecords}
        onPageChange={list.setPage}
        onPageSizeChange={list.setPageSize}
      />
    </div>
  );
}
