'use client';

import { useMounted } from '@/lib/hooks/use-mounted';
import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

/**
 * Marketing contact CTA mode (sticky bar + final CTA band).
 *
 * SSR + the hydration pass always use the env flag so server HTML matches the
 * first client paint (React Query `/config` must not flip offline↔online mid-hydrate).
 * After mount, keep env while `/config` loads (avoid WhatsApp-primary flash), then follow API.
 */
export function useMarketingBookingCtaMode(): {
  onlineBooking: boolean;
  isLoading: boolean;
} {
  const envAllows = isOnlineBookingEnabledFromEnv();
  const { enabled, isLoading } = useOnlineBookingEnabled();
  const mounted = useMounted();

  if (!mounted || isLoading) {
    return { onlineBooking: envAllows, isLoading: true };
  }

  return {
    onlineBooking: enabled,
    isLoading: false,
  };
}
