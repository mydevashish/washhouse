import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Admin · Booking requests' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Requests tab. */
export default async function AdminBookingRequestsRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/admin/orders', 'requests', await searchParams));
}
