import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Admin · Customer Desk' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Find customer tab. */
export default async function AdminCustomerDeskRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/admin/orders', 'desk', await searchParams));
}
