import type { Metadata } from 'next';

import { PublicShell } from '@/components/layout/public-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { TermsContent } from '@/features/marketing/legal';

const title = `Terms & Conditions — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Terms governing use of The WashHouse doorstep laundry marketplace in India — bookings, payments (UPI, COD), GST, cancellations, and your rights.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function TermsPage() {
  return (
    <PublicShell>
      <TermsContent />
    </PublicShell>
  );
}
