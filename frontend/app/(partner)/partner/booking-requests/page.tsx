import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Partner · Booking requests' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** Legacy route → Orders Hub Requests tab. */
export default async function PartnerBookingRequestsRedirectPage({ searchParams }: PageProps) {
  permanentRedirect(buildOrdersHubPath('/partner/orders', 'requests', await searchParams));
}
