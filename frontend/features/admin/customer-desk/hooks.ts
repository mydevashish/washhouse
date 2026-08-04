'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  createAdminAssistedOrder,
  listAdminCustomerOrdersByPhone,
  listAdminCustomerOrdersByUser,
  lookupAdminCustomer,
  quoteAdminAssistedOrder,
} from '@/features/admin/customer-desk/api';
import type {
  AssistedOrderCreatePayload,
  CustomerDeskLookupParams,
  CustomerDeskOrdersFilters,
} from '@/features/admin/customer-desk/types';
import { customerDeskLookupKey } from '@/features/admin/customer-desk/types';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';

export function useAdminCustomerDeskLookup(
  params: CustomerDeskLookupParams | null,
  enabled: boolean,
) {
  const key = params ? customerDeskLookupKey(params) : '';
  return useQuery({
    queryKey: queryKeys.adminCustomerDeskLookup(key),
    queryFn: () => lookupAdminCustomer(params!),
    enabled: Boolean(enabled && params && key),
    staleTime: STALE.adminDashboard,
    retry: false,
  });
}

export function useAdminCustomerDeskOrders(
  profile: { user_id: string | null; phone: string } | null,
  open: boolean,
  filters: CustomerDeskOrdersFilters = {},
) {
  const userId = profile?.user_id ?? null;
  const phone = profile?.phone ?? '';
  const page = filters.page ?? 1;

  return useQuery({
    queryKey: queryKeys.adminCustomerDeskOrders(userId ?? phone, { ...filters, page }),
    queryFn: () =>
      userId
        ? listAdminCustomerOrdersByUser(userId, { page_size: 20, ...filters, page })
        : listAdminCustomerOrdersByPhone(phone, { page_size: 20, ...filters, page }),
    enabled: Boolean(open && profile && (userId || phone)),
    staleTime: 15_000,
  });
}

export function useAdminAssistedOrderMutations(options?: {
  onCreated?: (trackingCode: string) => void;
}) {
  const queryClient = useQueryClient();

  const invalidateDesk = (phone?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['admin-customer-desk'] });
    if (phone) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.adminCustomerDeskLookup(phone),
      });
    }
  };

  const quoteM = useMutation({
    mutationFn: (payload: AssistedOrderCreatePayload) => quoteAdminAssistedOrder(payload),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not quote order')),
  });

  const createM = useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: AssistedOrderCreatePayload;
      idempotencyKey: string;
    }) => createAdminAssistedOrder(payload, idempotencyKey),
    onSuccess: (data, vars) => {
      toast.success(`Order ${data.tracking_code} created`);
      invalidateDesk(vars.payload.phone);
      options?.onCreated?.(data.tracking_code);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create assisted order')),
  });

  return { quoteM, createM };
}
