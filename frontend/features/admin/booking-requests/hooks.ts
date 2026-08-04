'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  addAdminBookingRequestMessage,
  assignAdminBookingRequest,
  claimAdminBookingRequest,
  convertAdminBookingRequest,
  createAdminBookingRequest,
  getAdminBookingRequest,
  getAdminBookingRequestsByPhone,
  listAdminBookingRequests,
  releaseAdminBookingRequest,
  restoreAdminBookingRequest,
  softDeleteAdminBookingRequest,
  suggestAdminBookingRequestLaundries,
  updateAdminBookingRequest,
  type BookingRequestConvertPayload,
} from '@/features/admin/booking-requests/api';
import type {
  BookingRequestAdminCreatePayload,
  BookingRequestListFilters,
  BookingRequestMessagePayload,
  BookingRequestUpdatePayload,
} from '@/features/admin/booking-requests/types';
import {
  looksLikeIndianMobile,
  openRequestsForPhone,
} from '@/features/admin/booking-requests/booking-request-duplicate-banner';
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

export function useAdminBookingRequestsList(filters: BookingRequestListFilters) {
  return useQuery({
    queryKey: queryKeys.adminBookingRequests(filters),
    queryFn: () => listAdminBookingRequests(filters),
    staleTime: 30_000,
  });
}

export function useAdminBookingRequestDetail(id: string | null, open: boolean) {
  return useQuery({
    queryKey: queryKeys.adminBookingRequestDetail(id ?? ''),
    queryFn: () => getAdminBookingRequest(id!),
    enabled: Boolean(id && open),
    staleTime: 15_000,
  });
}

export function useAdminBookingRequestPhoneTimeline(phone: string | null, open: boolean) {
  return useQuery({
    queryKey: queryKeys.adminBookingRequestsByPhone(phone ?? ''),
    queryFn: () => getAdminBookingRequestsByPhone(phone!),
    enabled: Boolean(phone && open),
    staleTime: STALE.adminDashboard,
  });
}

/** Debounced phone lookup for create dialogs — open-request duplicate banner. */
export function useAdminOpenRequestsForPhone(phone: string, enabled: boolean) {
  const debounced = useDebouncedValue(phone.trim(), 400);
  const ready = enabled && looksLikeIndianMobile(debounced);
  const q = useQuery({
    queryKey: queryKeys.adminBookingRequestsByPhone(debounced),
    queryFn: () => getAdminBookingRequestsByPhone(debounced),
    enabled: ready,
    staleTime: 15_000,
  });
  return {
    ...q,
    openRequests: openRequestsForPhone(q.data?.requests),
  };
}

export function useAdminBookingRequestSuggestLaundries(id: string | null, open: boolean) {
  return useQuery({
    queryKey: queryKeys.adminBookingRequestSuggestLaundries(id ?? ''),
    queryFn: () => suggestAdminBookingRequestLaundries(id!),
    enabled: Boolean(id && open),
    staleTime: 30_000,
  });
}

function invalidateBookingCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  id?: string,
  phone?: string | null,
) {
  void queryClient.invalidateQueries({ queryKey: ['admin-booking-requests'] });
  if (id) {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminBookingRequestDetail(id) });
  }
  if (phone) {
    void queryClient.invalidateQueries({
      queryKey: queryKeys.adminBookingRequestsByPhone(phone),
    });
  }
}

export function useBookingRequestMutations(options?: {
  requestId?: string | null;
  phone?: string | null;
  onSettledSuccess?: () => void;
}) {
  const queryClient = useQueryClient();
  const id = options?.requestId ?? undefined;
  const phone = options?.phone;

  const bump = () => {
    invalidateBookingCaches(queryClient, id, phone);
    options?.onSettledSuccess?.();
  };

  const createM = useMutation({
    mutationFn: (payload: BookingRequestAdminCreatePayload) => createAdminBookingRequest(payload),
    onSuccess: () => {
      toast.success('Booking request created');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not create request')),
  });

  const updateM = useMutation({
    mutationFn: (payload: BookingRequestUpdatePayload) =>
      updateAdminBookingRequest(id!, payload),
    onSuccess: () => {
      toast.success('Request updated');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Update failed')),
  });

  const claimM = useMutation({
    mutationFn: () => claimAdminBookingRequest(id!),
    onSuccess: () => {
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not claim request')),
  });

  const assignM = useMutation({
    mutationFn: (input: { laundryId: string; note?: string }) =>
      assignAdminBookingRequest(id!, input.laundryId, input.note),
    onSuccess: () => {
      toast.success('Assigned to laundry');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Assign failed')),
  });

  const releaseM = useMutation({
    mutationFn: () => releaseAdminBookingRequest(id!),
    onSuccess: () => {
      toast.success('Released to admin inbox');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Release failed')),
  });

  const messageM = useMutation({
    mutationFn: (payload: BookingRequestMessagePayload) =>
      addAdminBookingRequestMessage(id!, payload),
    onSuccess: (_data, vars) => {
      toast.success(vars.visibility === 'internal' ? 'Note added' : 'Response logged');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Could not save message')),
  });

  const deleteM = useMutation({
    mutationFn: () => softDeleteAdminBookingRequest(id!),
    onSuccess: () => {
      toast.success('Request soft-deleted');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Delete failed')),
  });

  const restoreM = useMutation({
    mutationFn: () => restoreAdminBookingRequest(id!),
    onSuccess: () => {
      toast.success('Request restored');
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Restore failed')),
  });

  const convertM = useMutation({
    mutationFn: (payload: BookingRequestConvertPayload) => convertAdminBookingRequest(id!, payload),
    onSuccess: (data) => {
      toast.success(`Converted to order ${data.tracking_code}`);
      bump();
    },
    onError: (e) => toast.error(getApiErrorMessage(e, 'Convert failed')),
  });

  return { createM, updateM, claimM, assignM, releaseM, messageM, deleteM, restoreM, convertM };
}
