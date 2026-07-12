import type { Metadata } from 'next';

import { PublicShell } from '@/components/layout/public-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { ContactPageView } from '@/features/marketing/contact';

const title = `Contact us — ${WASHHOUSE_BRAND_NAME}`;
const description =
  'Get in touch with The WashHouse — support email, phone, WhatsApp, and a message form. We reply within one business day (IST).';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    type: 'website',
  },
};

export default function ContactPage() {
  return (
    <PublicShell>
      <ContactPageView />
    </PublicShell>
  );
}
