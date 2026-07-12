'use client';

import { Store } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { WalkInOrderCard } from '@/features/partner/components/walk-in-order-card';
import { WalkInOrderForm, type WalkInFormValues } from '@/features/partner/components/walk-in-order-form';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getWalkInNextStatus } from '@/features/partner/lib/partner-status';
import { queryKeys } from '@/lib/query-keys';
import { listPartnerServices } from '@/services/partner-service-catalog';
import {
  advanceWalkInOrderStatus,
  createWalkInOrder,
  listWalkInOrders,
} from '@/services/partner-walk-in-orders';

export function PartnerWalkInOrdersView() {
  const enabled = usePartnerQueriesEnabled();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const ordersQ = useQuery({
    queryKey: queryKeys.partnerWalkInOrders(),
    queryFn: listWalkInOrders,
    enabled,
    refetchInterval: enabled ? 45_000 : false,
  });

  const servicesQ = useQuery({
    queryKey: queryKeys.partnerServiceCatalog(),
    queryFn: listPartnerServices,
    enabled,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
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
    mutationFn: ({ id, status }: { id: string; status: string }) => advanceWalkInOrderStatus(id, status),
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

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Walk-in orders"
        description="Record in-shop customers. No online payment — track status and notify customers on WhatsApp."
        actions={
          <Button type="button" className="min-h-[44px]" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Hide form' : 'New entry'}
          </Button>
        }
      />

      {showForm && (
        <div className="rounded-2xl border border-border bg-background p-4 shadow-sm">
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
            />
          )}
        </div>
      )}

      {(!enabled || ordersQ.isPending) && <Skeleton className="h-64 w-full rounded-2xl" />}
      {enabled && ordersQ.isError && (
        <InfoBanner variant="destructive" title="Could not load walk-in orders">
          Refresh the page to try again.
        </InfoBanner>
      )}
      {ordersQ.data && ordersQ.data.length === 0 && !showForm && (
        <EmptyState
          icon={Store}
          title="No walk-in orders yet"
          description="When a customer visits or calls, tap New entry to record their order."
        />
      )}

      {ordersQ.data && ordersQ.data.length > 0 && (
        <div className="grid gap-4 lg:grid-cols-2">
          {ordersQ.data.map((order) => (
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
      )}
    </PartnerContent>
  );
}
