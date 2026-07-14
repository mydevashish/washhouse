'use client';

import dynamic from 'next/dynamic';

const MobileStickyCta = dynamic(
  () =>
    import('@/components/marketing/mobile-sticky-cta').then((m) => ({
      default: m.MobileStickyCta,
    })),
  { ssr: false },
);

/** Client-only marketing overlays (sticky CTA) — must not live in RSC shell. */
export function MarketingShellOverlays() {
  return <MobileStickyCta />;
}
