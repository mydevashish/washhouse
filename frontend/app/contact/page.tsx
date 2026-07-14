import type { Metadata } from 'next';

import { MarketingShell } from '@/components/layout/marketing-shell';
import { WASHHOUSE_BRAND_NAME } from '@/components/brand/washhouse-logo';
import { ContactPageView } from '@/features/marketing/contact';
import { CONTACT_SUBJECTS, type ContactSubject } from '@/features/marketing/contact/contact-constants';

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

const VALID_SUBJECTS = new Set(CONTACT_SUBJECTS.map((s) => s.value));

type ContactPageProps = {
  searchParams: Promise<{ subject?: string }>;
};

export default async function ContactPage({ searchParams }: ContactPageProps) {
  const { subject } = await searchParams;
  const defaultSubject =
    subject && VALID_SUBJECTS.has(subject as ContactSubject)
      ? (subject as ContactSubject)
      : undefined;

  return (
    <MarketingShell>
      <ContactPageView defaultSubject={defaultSubject} />
    </MarketingShell>
  );
}
