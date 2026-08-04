import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Admin · Customers' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Directory tab. */
export default async function AdminCustomersRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/admin/orders', 'directory', await searchParams));
}
