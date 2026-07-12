import type { Metadata } from 'next';

import { PublicShell } from '@/components/layout/public-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { StoresPageView } from '@/features/marketing/stores';

const title = `Our stores — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Find a verified WashHouse laundry near you. Search by area, compare ratings and delivery times, and book doorstep pickup with UPI or COD.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function StoresPage() {
  return (
    <PublicShell>
      <StoresPageView />
    </PublicShell>
  );
}
