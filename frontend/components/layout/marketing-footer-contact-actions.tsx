'use client';

import dynamic from 'next/dynamic';

const FloatingContactActions = dynamic(
  () =>
    import('@/components/marketing/floating-contact-actions').then((m) => ({
      default: m.FloatingContactActions,
    })),
  { ssr: false },
);

export function MarketingFooterContactActions() {
  return <FloatingContactActions variant="inline" />;
}
