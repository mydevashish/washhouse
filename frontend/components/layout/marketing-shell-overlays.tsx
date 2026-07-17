'use client';

import { MobileStickyCta } from '@/components/marketing/mobile-sticky-cta';

/** Client-only marketing overlays (sticky CTA) — must not live in RSC shell. */
export function MarketingShellOverlays() {
  return <MobileStickyCta />;
}
