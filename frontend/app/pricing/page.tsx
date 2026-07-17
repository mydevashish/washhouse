import type { Metadata } from 'next';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { PricingPageView } from '@/features/marketing/pricing';

const title = `Pricing — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Transparent pricing on The WashHouse — indicative starting-from rates by category, shared across partner stores. Find a location near you when you are ready to book.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function PricingPage() {
  return (
    <MarketingShell>
      <PricingPageView />
    </MarketingShell>
  );
}
