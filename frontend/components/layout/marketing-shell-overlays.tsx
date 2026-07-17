'use client';

import { BookNowDialog } from '@/features/marketing/book-now';
import { MobileStickyCta } from '@/components/marketing/mobile-sticky-cta';

/** Client-only marketing overlays (sticky CTA + Book Now dialog) — must not live in RSC shell. */
export function MarketingShellOverlays() {
  return (
    <>
      <MobileStickyCta />
      <BookNowDialog />
    </>
  );
}
