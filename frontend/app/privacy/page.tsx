import type { Metadata } from 'next';

import { PublicShell } from '@/components/layout/public-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { PrivacyContent } from '@/features/marketing/legal';

const title = `Privacy Policy — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'How The WashHouse collects, uses, and protects your data in India — orders, UPI payments, OTP login, location for nearby stores, and your rights under Indian privacy law.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function PrivacyPage() {
  return (
    <PublicShell>
      <PrivacyContent />
    </PublicShell>
  );
}
