'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getPartnerNextStatus } from '@/features/partner/lib/partner-status';
import { useMounted } from '@/lib/hooks/use-mounted';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  acceptOrder,
  getPartnerAnalytics,
  listPartnerOrders,
  rejectOrder,
  updateOrderStatus,
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

export function usePartnerOrders() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerOrders(),
    queryFn: listPartnerOrders,
    staleTime: STALE.partnerAnalytics,
    enabled,
    refetchInterval: enabled ? 45_000 : false,
    refetchIntervalInBackground: false,
  });
}

export function usePartnerOrderMutations() {
  const queryClient = useQueryClient();

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerOrders() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerCustomers() });
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
