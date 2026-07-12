'use client';

import { useQuery } from '@tanstack/react-query';

import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';
import { queryKeys } from '@/lib/query-keys';
import { getPublicAppConfig } from '@/services/app-config';

export const OFFLINE_BOOKING_TITLE = 'Book by phone or WhatsApp';

export function offlineBookingBody(laundryName: string): string {
  return `Browse prices below, then contact ${laundryName} to place your order.`;
}

export function useOnlineBookingEnabled() {
  const envEnabled = isOnlineBookingEnabledFromEnv();

  const configQ = useQuery({
    queryKey: queryKeys.appConfig(),
    queryFn: getPublicAppConfig,
    staleTime: 5 * 60_000,
    enabled: envEnabled,
  });

  if (!envEnabled) {
    return { enabled: false, isLoading: false };
  }

  if (configQ.isLoading) {
    return { enabled: false, isLoading: true };
  }

  return {
    enabled: configQ.data?.online_booking_enabled ?? true,
    isLoading: false,
  };
}
