'use client';

import { BookNowDialog } from '@/features/marketing/book-now';
import { PromoOfferDialog } from '@/features/marketing/promo/promo-offer-dialog';
import { MobileStickyCta } from '@/components/marketing/mobile-sticky-cta';

/** Client-only marketing overlays (sticky CTA + Book Now dialog) — must not live in RSC shell. */
export function MarketingShellOverlays() {
  return (
    <>
      <PromoOfferDialog />
      <MobileStickyCta />
      <BookNowDialog />
    </>
  );
}
