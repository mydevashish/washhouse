/** Hub create intent — opens dashboard-style dialog via `?tab=create` on `/partner/orders`. */

export type PartnerHubOrderCreatePrefill = {
  phone?: string | null;
  name?: string | null;
  fulfillment?: 'walk_in' | 'doorstep';
};

export function buildPartnerHubOrderCreateHref(
  prefill: PartnerHubOrderCreatePrefill = {},
): string {
  const params = new URLSearchParams();
  params.set('tab', 'create');
  if (prefill.phone?.trim()) params.set('phone', prefill.phone.trim());
  if (prefill.name?.trim()) params.set('name', prefill.name.trim());
  if (prefill.fulfillment === 'doorstep') {
    params.set('fulfillment', 'doorstep');
    params.set('mode', 'assisted');
  }
  return `/partner/orders?${params.toString()}`;
}
