'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getPartnerNextStatus } from '@/features/partner/lib/partner-status';
import { useMounted } from '@/lib/hooks/use-mounted';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { DEFAULT_PAGE_SIZE } from '@/lib/pagination/types';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import type { PartnerDashboardPeriod } from '@/features/partner/dashboard/partner-dashboard-period';
import {
  acceptOrder,
  getPartnerAnalytics,
  getPartnerAnalyticsDashboard,
  getPartnerAnalyticsOverview,
  listPartnerOrders,
  rejectOrder,
  updateOrderStatus,
  type PartnerAnalyticsDashboardPeriod,
  type PartnerAnalyticsParams,
  type PartnerOrder,
  type PartnerOrdersListParams,
  type PartnerRevenuePeriod,
} from '@/services/partner';
import { listPartnerCustomerInsights } from '@/services/customer-insights';
import { useAuthStore } from '@/store/auth.store';

/** Partner APIs require a bearer token — skip fetches during SSR / before auth. */
export function usePartnerQueriesEnabled() {
  const mounted = useMounted();
  const accessToken = useAuthStore((s) => s.accessToken);
  return mounted && Boolean(accessToken);
}

export function usePartnerAnalytics(params?: PartnerAnalyticsParams) {
  const enabled = usePartnerQueriesEnabled();
  const requestKey = params
    ? {
        period: params.period,
        ...(params.period === 'custom'
          ? { date_from: params.date_from, date_to: params.date_to }
          : {}),
      }
    : undefined;
  return useQuery({
    queryKey: queryKeys.partnerAnalytics(requestKey),
    queryFn: () => getPartnerAnalytics(params),
    staleTime: STALE.partnerAnalytics,
    enabled: enabled && (params?.period !== 'custom' || Boolean(params.date_from && params.date_to)),
    placeholderData: keepPreviousData,
  });
}

/** Revenue / Money page — always requests ?period= so KPIs match the selected IST window. */
export function usePartnerRevenueAnalytics(
  period: PartnerRevenuePeriod,
  customRange?: { date_from: string; date_to: string },
) {
  const params: PartnerAnalyticsParams =
    period === 'custom' && customRange
      ? { period, date_from: customRange.date_from, date_to: customRange.date_to }
      : { period };
  return usePartnerAnalytics(params);
}

export function usePartnerAnalyticsOverview(period: PartnerDashboardPeriod) {
  const enabled = usePartnerQueriesEnabled() && period !== 'year';
  const overviewPeriod = period === 'year' ? 'week' : period;
  return useQuery({
    queryKey: queryKeys.partnerAnalyticsOverview(overviewPeriod),
    queryFn: () => getPartnerAnalyticsOverview(overviewPeriod),
    staleTime: STALE.partnerAnalytics,
    enabled,
  });
}

/** Live `/partner` franchise dashboard. Default period is week (chart chips). KPIs are always today/week/month. */
export function usePartnerAnalyticsDashboard(period: PartnerAnalyticsDashboardPeriod = 'week') {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerAnalyticsDashboard(period),
    queryFn: () => getPartnerAnalyticsDashboard(period),
    staleTime: STALE.partnerAnalytics,
    enabled,
    placeholderData: keepPreviousData,
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
    payment_status: params.payment_status,
    created_today: params.created_today,
    date_from: params.date_from,
    date_to: params.date_to,
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

export function usePartnerTopCustomers() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: [...queryKeys.partnerCustomerInsights('top'), { page: 1, page_size: 5 }],
    queryFn: () => listPartnerCustomerInsights({ list_type: 'top', page: 1, page_size: 5 }),
    staleTime: STALE.partnerAnalytics,
    enabled,
  });
}

export function usePartnerOrderMutations() {
  const queryClient = useQueryClient();

  const patchOrderInListCaches = (updated: PartnerOrder) => {
    queryClient.setQueriesData<{ items?: PartnerOrder[] }>(
      { queryKey: ['partner-orders'] },
      (old) => {
        if (!old?.items?.length) return old;
        return {
          ...old,
          items: old.items.map((row) => (row.id === updated.id ? { ...row, ...updated } : row)),
        };
      },
    );
  };

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-order'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-analytics'] });
    void queryClient.invalidateQueries({ queryKey: ['partner-analytics-overview'] });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomers() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsPickups() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDeliveries() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOperationsDoneToday() });
  };

  const acceptMutation = useMutation({
    mutationFn: acceptOrder,
    onSuccess: (updated) => {
      toast.success('Order accepted');
      queryClient.setQueryData(queryKeys.partnerOrder(updated.id), updated);
      patchOrderInListCaches(updated);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not accept order')),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectOrder,
    onSuccess: (updated) => {
      toast.success('Order rejected');
      queryClient.setQueryData(queryKeys.partnerOrder(updated.id), updated);
      patchOrderInListCaches(updated);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not reject order')),
  });

  const advanceMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateOrderStatus(id, status),
    onSuccess: (updated, { id }) => {
      toast.success('Status updated');
      queryClient.setQueryData(queryKeys.partnerOrder(id), updated);
      patchOrderInListCaches(updated);
      invalidate();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not update status')),
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
