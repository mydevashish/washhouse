import type { Metadata } from 'next';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { FranchisePageView } from '@/features/marketing/franchise';

const title = `Franchise — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Become a The WashHouse partner. Low investment, setup & training, marketing support, and a proven laundry franchise model across India.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function FranchisePage() {
  return (
    <MarketingShell>
      <FranchisePageView />
    </MarketingShell>
  );
}
