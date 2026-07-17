'use client';

import { MarketingNavbar } from '@/components/layout/global-navbar/marketing-navbar';
import { FloatingContactActions } from '@/components/marketing/floating-contact-actions';
import { HashScrollHandler } from '@/components/navigation/hash-scroll-handler';

/** Client chrome for marketing pages — navbar + FAB contact actions. */
export function MarketingShellChrome() {
  return (
    <>
      <HashScrollHandler />
      <MarketingNavbar />
      <FloatingContactActions />
    </>
  );
}
