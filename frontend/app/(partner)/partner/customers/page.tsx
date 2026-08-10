import { permanentRedirect } from 'next/navigation';

/** Legacy route → Customers pillar workspace on the hub. */
export default async function PartnerCustomersRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const incoming = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(incoming)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else {
      params.set(key, value);
    }
  }
  params.set('workspace', 'customers');
  params.delete('tab');
  const qs = params.toString();
  permanentRedirect(qs ? `/partner/orders?${qs}` : '/partner/orders?workspace=customers');
}
