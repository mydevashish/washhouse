import type { Metadata } from 'next';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { ServicesPageView } from '@/features/marketing/services';

const title = `Laundry services — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Wash & fold, dry cleaning, steam press, express turnaround, and monthly plans — book through verified laundries on The WashHouse. Indicative pricing; final rates set by each store.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function ServicesPage() {
  return (
    <MarketingShell>
      <ServicesPageView />
    </MarketingShell>
  );
}
