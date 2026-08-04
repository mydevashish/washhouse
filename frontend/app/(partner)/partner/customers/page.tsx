import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Partner · Customer Insights Dashboard' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Directory tab. */
export default async function PartnerCustomersRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/partner/orders', 'directory', await searchParams));
}
