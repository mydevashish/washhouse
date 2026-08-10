'use client';

import Link from 'next/link';
import { Headset, Store } from 'lucide-react';
import { buildPartnerCreateOrderHref } from '@/features/partner/customer-desk/phone';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Input } from '@/components/ui/input';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { WalkInOrderCard } from '@/features/partner/components/walk-in-order-card';
import {
  WalkInOrderForm,
  type WalkInFormPrefill,
  type WalkInFormValues,
} from '@/features/partner/components/walk-in-order-form';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getWalkInNextStatus } from '@/features/partner/lib/partner-status';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { useServerList } from '@/lib/pagination/use-server-list';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerServices } from '@/services/partner-service-catalog';
import {
  advanceWalkInOrderStatus,
  createWalkInOrder,
  listWalkInOrders,
  type WalkInOrder,
} from '@/services/partner-walk-in-orders';

export function PartnerWalkInOrdersView() {
  const enabled = usePartnerQueriesEnabled();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone');
  const nameParam = searchParams.get('name');
  const newParam = searchParams.get('new');

  const deskPrefill = useMemo<WalkInFormPrefill | null>(() => {
    if (!phoneParam && !nameParam) return null;
    return {
      customer_phone: phoneParam ?? undefined,
      customer_name: nameParam ?? undefined,
    };
  }, [phoneParam, nameParam]);

  const [showForm, setShowForm] = useState(Boolean(newParam === '1' || deskPrefill));
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (newParam === '1' || deskPrefill) setShowForm(true);
  }, [newParam, deskPrefill]);

  const list = useServerList<WalkInOrder>({
    queryKey: queryKeys.partnerWalkInOrders(),
    fetcher: (params) => listWalkInOrders(params),
    defaultPageSize: 10,
    enabled,
  });

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-walk-in-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
  };

  function normalizePhone(raw: string): string {
    const trimmed = raw.replace(/\s/g, '');
    return trimmed.startsWith('+') ? trimmed : `+${trimmed}`;
  }

  const createMutation = useMutation({
    mutationFn: createWalkInOrder,
    onSuccess: () => {
      toast.success('Walk-in order saved');
      setShowForm(false);
      invalidate();
    },
    onError: () => toast.error('Could not save walk-in order'),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      advanceWalkInOrderStatus(id, status),
    onMutate: ({ id }) => setBusyOrderId(id),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: () => toast.error('Could not update status'),
    onSettled: () => setBusyOrderId(null),
  });

  function handleCreate(values: WalkInFormValues) {
    createMutation.mutate({
      customer_name: values.customer_name,
      customer_phone: normalizePhone(values.customer_phone),
      notes: values.notes || undefined,
      expected_ready_at: values.expected_ready_at
        ? new Date(values.expected_ready_at).toISOString()
        : undefined,
      items: values.items.map((item) => ({
        service_id: item.service_id,
        quantity: item.quantity,
      })),
    });
  }

  const orders = list.rows;

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Walk-in orders"
        description="Record in-shop customers. No online payment — track status and notify customers on WhatsApp."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm" className="min-h-[44px] gap-1.5">
              <Link href={buildOrdersHubPath('/partner/orders', 'desk')}>
                <Headset className="h-3.5 w-3.5" aria-hidden />
                Find customer
              </Link>
            </Button>
            <Button asChild size="sm" className="min-h-[44px]">
              <Link href={buildPartnerCreateOrderHref()}>New Order</Link>
            </Button>
            <Button type="button" variant="outline" className="min-h-[44px]" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Hide quick form' : 'Quick form'}
            </Button>
          </div>
        }
      />

      {showForm && (
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
          {deskPrefill ? (
            <InfoBanner variant="default" title="Prefill from Customer Desk" className="mb-4">
              Phone and name were filled from the desk. Add services and save the walk-in.
            </InfoBanner>
          ) : null}
          {servicesQ.isPending && <Skeleton className="h-64 w-full rounded-xl" />}
          {servicesQ.isError && (
            <InfoBanner variant="destructive" title="Could not load services">
              Add services in your catalog before recording walk-in orders.
            </InfoBanner>
          )}
          {servicesQ.data && (
            <WalkInOrderForm
              services={servicesQ.data}
              onSubmit={handleCreate}
              isSubmitting={createMutation.isPending}
              prefill={deskPrefill}
            />
          )}
        </div>
      )}

      <Input
        value={list.search}
        onChange={(e) => list.setSearch(e.target.value)}
        placeholder="Search name, phone, or tracking code"
        aria-label="Search walk-in orders"
        className="min-h-[44px]"
      />

      {list.isLoading && <Skeleton className="h-64 w-full rounded-2xl" />}
      {enabled && list.isError && (
        <QueryErrorState
          title="Could not load walk-in orders"
          message={getApiErrorMessage(list.error)}
          onRetry={() => void list.refetch()}
          isRetrying={list.isFetching}
        />
      )}
      {enabled && !list.isLoading && orders.length === 0 && !showForm && (
        <EmptyState
          icon={Store}
          title="No walk-in orders yet"
          description="When a customer visits or calls, tap New entry to record their order."
        />
      )}

      {enabled && orders.length > 0 && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {orders.map((order) => (
              <WalkInOrderCard
                key={order.id}
                order={order}
                isAdvancing={busyOrderId === order.id && advanceMutation.isPending}
                onAdvance={() => {
                  const next = getWalkInNextStatus(order.status);
                  if (next) advanceMutation.mutate({ id: order.id, status: next });
                }}
              />
            ))}
          </div>
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
        </>
      )}
    </PartnerContent>
  );
}
