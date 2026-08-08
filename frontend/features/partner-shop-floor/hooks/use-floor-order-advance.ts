'use client';

import { useCallback, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getFloorAdvancePlan } from '@/features/partner-shop-floor/lib/floor-status';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { acceptOrder, updateOrderStatus, type PartnerOrder } from '@/services/partner';

function invalidateFloorQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  void queryClient.invalidateQueries({ queryKey: ['partner-order'] });
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerAnalytics() });
  void queryClient.invalidateQueries({ queryKey: queryKeys.partnerWalkInOrders() });
}

function patchOrdersCache(
  queryClient: ReturnType<typeof useQueryClient>,
  latest: PartnerOrder,
) {
  queryClient.setQueriesData<{ items: PartnerOrder[] }>({ queryKey: ['partner-orders'] }, (prev) => {
    if (!prev || !Array.isArray(prev.items)) return prev;
    return {
      ...prev,
      items: prev.items.map((row) => (row.id === latest.id ? { ...row, ...latest } : row)),
    };
  });
}

/**
 * Executes Shop Floor advance via existing accept + PATCH status APIs.
 * Chains doorstep washing→ironing→ready when needed.
 */
export function useFloorOrderAdvance() {
  const queryClient = useQueryClient();
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);

  const advance = useCallback(
    async (order: PartnerOrder) => {
      const plan = getFloorAdvancePlan(order.status, order.order_source);
      if (!plan) {
        toast.error('Is order pe abhi advance nahi ho sakta');
        return null;
      }

      setBusyOrderId(order.id);
      try {
        let latest: PartnerOrder = order;

        if (plan.acceptFirst) {
          latest = await acceptOrder(order.id);
          patchOrdersCache(queryClient, latest);
        }

        for (const status of plan.patchStatuses) {
          latest = await updateOrderStatus(order.id, status);
          patchOrdersCache(queryClient, latest);
        }

        invalidateFloorQueries(queryClient);

        if (plan.action === 'start_wash') {
          toast.success('Dhulai shuru — bag washing mein');
        } else if (plan.action === 'mark_ready') {
          toast.success('Ready — customer le sakta hai');
        } else if (plan.action === 'mark_given') {
          toast.success('Diya — order complete');
        } else if (plan.action === 'accept') {
          toast.success('Order accept ho gaya');
        } else {
          toast.success('Status update ho gaya');
        }

        return latest;
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Status update fail hua'));
        return null;
      } finally {
        setBusyOrderId(null);
      }
    },
    [queryClient],
  );

  return {
    advance,
    busyOrderId,
    isBusy: busyOrderId !== null,
  };
}
