'use client';

import { useOnlineBookingEnabled } from '@/lib/hooks/use-online-booking-enabled';
import { isOnlineBookingEnabledFromEnv } from '@/lib/online-booking';

/**
 * Marketing contact CTA mode (sticky bar + final CTA band).
 * While `/config` loads, prefer the env flag so online defaults do not flash WhatsApp-primary.
 */
export function useMarketingBookingCtaMode(): {
  onlineBooking: boolean;
  isLoading: boolean;
} {
  const envAllows = isOnlineBookingEnabledFromEnv();
  const { enabled, isLoading } = useOnlineBookingEnabled();

  return {
    onlineBooking: isLoading ? envAllows : enabled,
    isLoading,
  };
}
