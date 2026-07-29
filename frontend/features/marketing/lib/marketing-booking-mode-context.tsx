'use client';

import { createContext, useContext } from 'react';

/**
 * Server-resolved online-booking flag for marketing CTAs.
 * Null when rendered outside MarketingShell (tests / non-marketing trees).
 */
const MarketingBookingModeContext = createContext<boolean | null>(null);

export function MarketingBookingModeProvider({
  initialOnlineBooking,
  children,
}: {
  initialOnlineBooking: boolean;
  children: React.ReactNode;
}) {
  return (
    <MarketingBookingModeContext.Provider value={initialOnlineBooking}>
      {children}
    </MarketingBookingModeContext.Provider>
  );
}

/** Snapshot from RSC — same value on server HTML and the hydration pass. */
export function useMarketingBookingModeSnapshot(): boolean | null {
  return useContext(MarketingBookingModeContext);
}
