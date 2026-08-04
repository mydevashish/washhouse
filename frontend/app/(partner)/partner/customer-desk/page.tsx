import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Partner · Customer Desk' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Find customer tab. */
export default async function PartnerCustomerDeskRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/partner/orders', 'desk', await searchParams));
}
