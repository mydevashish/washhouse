'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { isAxiosError } from 'axios';

import {
  createPartnerAssistedOrder,
  listPartnerCustomerOrdersByPhone,
  listPartnerCustomerOrdersByUser,
  lookupPartnerCustomer,
  quotePartnerAssistedOrder,
} from '@/features/partner/customer-desk/api';
import {
  guestDeskProfile,
  type AssistedOrderCreatePayload,
  type CustomerDeskLookupParams,
  type CustomerDeskOrdersFilters,
  type CustomerDeskProfile,
  customerDeskLookupKey,
} from '@/features/partner/customer-desk/types';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';

export function usePartnerCustomerDeskLookup(
  params: CustomerDeskLookupParams | null,
  enabled: boolean,
) {
  const partnerEnabled = usePartnerQueriesEnabled();
  const key = params ? customerDeskLookupKey(params) : '';
  return useQuery({
    queryKey: queryKeys.partnerCustomerDeskLookup(key),
    queryFn: async (): Promise<CustomerDeskProfile> => {
      try {
        return await lookupPartnerCustomer(params!);
      } catch (err) {
        // Unknown phone at this laundry → guest stub so counter can still create.
        if (
          isAxiosError(err) &&
          err.response?.status === 404 &&
          params &&
          'phone' in params
        ) {
          return guestDeskProfile(params.phone);
        }
        throw err;
      }
    },
    enabled: Boolean(partnerEnabled && enabled && params && key),
    staleTime: STALE.partnerAnalytics,
    retry: false,
  });
}

export function usePartnerCustomerDeskOrders(
  profile: { user_id: string | null; phone: string } | null,
  open: boolean,
  filters: CustomerDeskOrdersFilters = {},
) {
  const partnerEnabled = usePartnerQueriesEnabled();
  const userId = profile?.user_id ?? null;
  const phone = profile?.phone ?? '';
  const page = filters.page ?? 1;

  return useQuery({
    queryKey: queryKeys.partnerCustomerDeskOrders(userId ?? phone, { ...filters, page }),
    queryFn: () =>
      userId
        ? listPartnerCustomerOrdersByUser(userId, { page_size: 10, ...filters, page })
        : listPartnerCustomerOrdersByPhone(phone, { page_size: 10, ...filters, page }),
    enabled: Boolean(partnerEnabled && open && profile && (userId || phone)),
    staleTime: 15_000,
  });
}

export function usePartnerAssistedOrderMutations(options?: {
  onCreated?: (trackingCode: string) => void;
}) {
  const queryClient = useQueryClient();

  const invalidateDesk = (phone?: string) => {
    void queryClient.invalidateQueries({ queryKey: ['partner-customer-desk'] });
    if (phone) {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.partnerCustomerDeskLookup(phone),
      });
    }
    void queryClient.invalidateQueries({ queryKey: ['partner-orders'] });
  };

  const quoteM = useMutation({
    mutationFn: (payload: AssistedOrderCreatePayload) => quotePartnerAssistedOrder(payload),
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not quote order')),
  });

  const createM = useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: AssistedOrderCreatePayload;
      idempotencyKey: string;
    }) => createPartnerAssistedOrder(payload, idempotencyKey),
    onSuccess: (data, vars) => {
      toast.success(`Order ${data.tracking_code} created`);
      invalidateDesk(vars.payload.phone);
      options?.onCreated?.(data.tracking_code);
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create assisted order')),
  });

  return { quoteM, createM };
}
