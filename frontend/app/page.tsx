import type { Metadata } from 'next';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { MarketingHomepage } from '@/features/marketing/home';

const title = `${WASHHOUSE_BRAND_NAME} — Doorstep laundry pickup & delivery`;
const description =
  'Discover trusted laundries near you. Free doorstep pickup, live order tracking, and delivery home. Pay with UPI or COD — GST on every order.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <MarketingShell>
      <MarketingHomepage />
    </MarketingShell>
  );
}
