'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getPartnerNextStatus } from '@/features/partner/lib/partner-status';
import { useMounted } from '@/lib/hooks/use-mounted';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination/types';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  acceptOrder,
  getPartnerAnalytics,
  listPartnerOrders,
  rejectOrder,
  updateOrderStatus,
  type PartnerOrdersListParams,
} from '@/services/partner';
import { useAuthStore } from '@/store/auth.store';

/** Partner APIs require a bearer token — skip fetches during SSR / before auth. */
export function usePartnerQueriesEnabled() {
  const mounted = useMounted();
  const accessToken = useAuthStore((s) => s.accessToken);
  return mounted && Boolean(accessToken);
}

export function usePartnerAnalytics() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerAnalytics(),
    queryFn: getPartnerAnalytics,
    staleTime: STALE.partnerAnalytics,
    enabled,
  });
}

/**
 * Server-paginated partner orders. Default page_size=10.
 * Prefer analytics/ops endpoints for KPI counts — do not treat this as a full dump.
 */
export function usePartnerOrders(params: PartnerOrdersListParams = {}) {
  const enabled = usePartnerQueriesEnabled();
  const request: PartnerOrdersListParams = {
    page: params.page ?? 1,
    page_size: params.page_size ?? DEFAULT_PAGE_SIZE,
    sort_by: params.sort_by ?? 'created_at',
    sort_order: params.sort_order ?? 'desc',
    bucket: params.bucket ?? 'all',
    search: params.search,
    status: params.status,
    order_source: params.order_source,
  };

  return useQuery({
    queryKey: queryKeys.partnerOrders(request),
    queryFn: () => listPartnerOrders(request),
    staleTime: STALE.partnerAnalytics,
    enabled,
    // Only poll small action queues — never unbounded lists.
    refetchInterval:
      enabled && request.bucket === 'action' && (request.page_size ?? 10) <= 10 ? 45_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function usePartnerOrderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-order'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomers() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsPickups() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDeliveries() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDoneToday() });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptOrder,
    onSuccess: () => {
      toast.success('Order accepted');
      invalidate();
    },
    onError: () => toast.error('Could not accept order'),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: () => {
      toast.success('Order rejected');
      invalidate();
    },
    onError: () => toast.error('Could not reject order'),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      toast.success('Status updated');
      invalidate();
    },
    onError: () => toast.error('Could not update status'),
  });

  function advanceOrder(
    orderId: string,
    currentStatus: string,
    orderSource?: 'online' | 'walk_in' | null,
  ) {
    const next = getPartnerNextStatus(currentStatus, orderSource);
    if (!next) return;
    advanceMutation.mutate({ id: orderId, status: next });
  }

  return {
    acceptMutation,
    rejectMutation,
    advanceMutation,
    advanceOrder,
    isBusy:
      acceptMutation.isPending || rejectMutation.isPending || advanceMutation.isPending,
  };
}
