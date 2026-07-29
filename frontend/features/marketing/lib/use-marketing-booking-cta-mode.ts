'use client';

import { useMarketingBookingModeSnapshot } from '@/features/marketing/lib/marketing-booking-mode-context';
import { useMounted } from '@/lib/hooks/use-mounted';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

/**
 * Marketing contact CTA mode (sticky bar + final CTA band).
 *
 * SSR + hydration always use the server snapshot (or env fallback) so React Query
 * `/config` cannot flip offline↔online mid-hydrate. After mount, keep that value
 * while `/config` loads (avoid WhatsApp-primary flash), then follow the API.
 */
export function useMarketingBookingCtaMode(): {
  onlineBooking: boolean;
  isLoading: boolean;
} {
  const snapshot = useMarketingBookingModeSnapshot();
  const envAllows = isOnlineBookingEnabledFromEnv();
  const ssrOnlineBooking = snapshot ?? envAllows;
  const { enabled, isLoading } = useOnlineBookingEnabled();
  const mounted = useMounted();

  if (!mounted || isLoading) {
    return { onlineBooking: ssrOnlineBooking, isLoading: true };
  }

  return {
    onlineBooking: enabled,
    isLoading: false,
  };
}
