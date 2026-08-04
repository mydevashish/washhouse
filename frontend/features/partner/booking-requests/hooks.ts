'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  looksLikeIndianMobile,
  openRequestsForPhone,
} from '@/features/admin/booking-requests/booking-request-duplicate-banner';
import {
  addPartnerBookingRequestMessage,
  convertPartnerBookingRequest,
  createPartnerBookingRequest,
  getPartnerBookingRequest,
  getPartnerBookingRequestsByPhone,
  listPartnerBookingRequests,
  releasePartnerBookingRequest,
  updatePartnerBookingRequest,
} from '@/features/partner/booking-requests/api';
import type {
  BookingRequestListFilters,
  BookingRequestMessagePayload,
  BookingRequestPartnerCreatePayload,
  BookingRequestUpdatePayload,
} from '@/features/partner/booking-requests/types';
import type { BookingRequestConvertPayload } from '@/features/admin/booking-requests/api';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { STALE } from '@/lib/query-config';
import { queryKeys } from '@/lib/query-keys';

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function usePartnerBookingRequestsList(filters: BookingRequestListFilters) {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerBookingRequests(filters),
    queryFn: () => listPartnerBookingRequests(filters),
    enabled,
    staleTime: 30_000,
  });
}

/** Lightweight badge source: assigned (needs first contact) + inbox meta. */
export function usePartnerBookingRequestsBadge() {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerBookingRequests({ page: 1, page_size: 1, status: 'assigned', sort: 'sla' }),
    queryFn: () =>
      listPartnerBookingRequests({ page: 1, page_size: 1, status: 'assigned', sort: 'sla' }),
    enabled,
    staleTime: 60_000,
  });
}

export function usePartnerBookingRequestDetail(id: string | null, open: boolean) {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerBookingRequestDetail(id ?? ''),
    queryFn: () => getPartnerBookingRequest(id!),
    enabled: enabled && Boolean(id && open),
    staleTime: 15_000,
  });
}

export function usePartnerBookingRequestPhoneTimeline(phone: string | null, open: boolean) {
  const enabled = usePartnerQueriesEnabled();
  return useQuery({
    queryKey: queryKeys.partnerBookingRequestsByPhone(phone ?? ''),
    queryFn: () => getPartnerBookingRequestsByPhone(phone!),
    enabled: enabled && Boolean(phone && open),
    staleTime: STALE.partnerAnalytics,
  });
}

/** Debounced phone lookup for partner create — open-request duplicate banner. */
export function usePartnerOpenRequestsForPhone(phone: string, dialogOpen: boolean) {
  const partnerEnabled = usePartnerQueriesEnabled();
  const debounced = useDebouncedValue(phone.trim(), 400);
  const ready = partnerEnabled && dialogOpen && looksLikeIndianMobile(debounced);
  const q = useQuery({
    queryKey: queryKeys.partnerBookingRequestsByPhone(debounced),
    queryFn: () => getPartnerBookingRequestsByPhone(debounced),
    enabled: ready,
    staleTime: 15_000,
  });
  return {
    ...q,
    openRequests: openRequestsForPhone(q.data?.requests),
  };
}

function invalidatePartnerBookingCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  phone?: string | null,
) {
  void queryClient.invalidateQueries({ queryKey: ['partner-booking-requests'] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerBookingRequestDetail(id) });
  }
  if (phone) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.partnerBookingRequestsByPhone(phone),
    });
  }
}

export function usePartnerBookingRequestMutations(options?: {
  requestId?: string | null;
  phone?: string | null;
  onSettledSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const id = options?.requestId ?? undefined;
  const phone = options?.phone;

  const bump = () => {
    invalidatePartnerBookingCaches(queryClient, id, phone);
    options?.onSettledSuccess?.();
  };

  const createM = useMutation({
    mutationFn: (payload: BookingRequestPartnerCreatePayload) =>
      createPartnerBookingRequest(payload),
    onSuccess: () => {
      toast.success('Booking request created for your laundry');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create request')),
  });

  const updateM = useMutation({
    mutationFn: (payload: BookingRequestUpdatePayload) =>
      updatePartnerBookingRequest(id!, payload),
    onSuccess: () => {
      toast.success('Request updated');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Update failed')),
  });

  const releaseM = useMutation({
    mutationFn: () => releasePartnerBookingRequest(id!),
    onSuccess: () => {
      toast.success('Released to admin inbox');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Release failed')),
  });

  const messageM = useMutation({
    mutationFn: (payload: BookingRequestMessagePayload) =>
      addPartnerBookingRequestMessage(id!, payload),
    onSuccess: (_data, vars) => {
      toast.success(vars.visibility === 'internal' ? 'Note added' : 'Response logged');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save message')),
  });

  const convertM = useMutation({
    mutationFn: (payload: BookingRequestConvertPayload) =>
      convertPartnerBookingRequest(id!, payload),
    onSuccess: (data) => {
      toast.success(`Converted to order ${data.tracking_code}`);
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Convert failed')),
  });

  return { createM, updateM, releaseM, messageM, convertM };
}
