import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Partner · People' };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/**
 * Spec landing for People pillar. Nav keeps Customers + Staff as separate items;
 * this route redirects so bookmarks/docs don’t 404.
 */
export default async function PartnerPeopleRedirectPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const raw = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  if (raw === 'staff') {
    permanentRedirect('/partner/staff');
  }
  permanentRedirect(buildOrdersHubPath('/partner/orders', 'directory', params));
}
