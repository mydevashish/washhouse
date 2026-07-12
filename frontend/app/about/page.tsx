import type { Metadata } from 'next';

import { PublicShell } from '@/components/layout/public-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { AboutPageView } from '@/features/marketing/about';

const title = `About us — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Learn how The WashHouse is making doorstep laundry effortless across India — verified partners, live tracking, GST-compliant pricing, and UPI or COD.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function AboutPage() {
  return (
    <PublicShell>
      <AboutPageView />
    </PublicShell>
  );
}
