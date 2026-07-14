'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

import {
  isOnlineBookingEnabledFromEnv,
  resolveOnlineBookingEnabled,
  warnOnlineBookingFlagMismatch,
} from '@/lib/online-booking';
import { queryKeys } from '@/lib/query-keys';
import { getPublicAppConfig } from '@/services/app-config';

export const OFFLINE_BOOKING_TITLE = 'Book by phone or WhatsApp';

export function offlineBookingBody(laundryName: string): string {
  return `Browse prices below, then contact ${laundryName} to place your order.`;
}

export function useOnlineBookingEnabled() {
  const envAllows = isOnlineBookingEnabledFromEnv();

  const configQ = useQuery({
    queryKey: queryKeys.appConfig(),
    queryFn: getPublicAppConfig,
    staleTime: 5 * 60_000,
    enabled: envAllows,
  });

  const apiEnabled = configQ.data?.online_booking_enabled;

  useEffect(() => {
    if (!envAllows || configQ.isLoading || configQ.isError || apiEnabled === undefined) return;
    warnOnlineBookingFlagMismatch(envAllows, apiEnabled);
  }, [envAllows, configQ.isLoading, configQ.isError, apiEnabled]);

  if (!envAllows) {
    return { enabled: false, isLoading: false };
  }

  if (configQ.isLoading) {
    return { enabled: false, isLoading: true };
  }

  if (configQ.isError || apiEnabled === undefined) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[DLM] Could not load GET /config; using NEXT_PUBLIC_FEATURE_ONLINE_BOOKING as fallback.',
      );
    }
    return { enabled: envAllows, isLoading: false };
  }

  return {
    enabled: resolveOnlineBookingEnabled(envAllows, apiEnabled),
    isLoading: false,
  };
}
