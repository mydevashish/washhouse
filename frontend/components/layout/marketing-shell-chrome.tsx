'use client';

import dynamic from 'next/dynamic';

import { MarketingNavbar } from '@/components/layout/global-navbar/marketing-navbar';

const FloatingContactActions = dynamic(
  () =>
    import('@/components/marketing/floating-contact-actions').then((m) => ({
      default: m.FloatingContactActions,
    })),
  { ssr: false },
);

/** Client chrome for marketing pages — navbar + deferred FAB contact actions. */
export function MarketingShellChrome() {
  return (
    <>
      <MarketingNavbar />
      <FloatingContactActions />
    </>
  );
}
