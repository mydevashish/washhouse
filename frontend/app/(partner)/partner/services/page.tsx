import { permanentRedirect } from 'next/navigation';

import { PARTNER_ORDERS_HUB_WORKSPACE_SERVICES_HREF } from '@/features/partner/lib/partner-nav';

export const metadata = { title: 'Service Catalog' };

/** Legacy route → Orders Hub services workspace modal (Your shop catalog bookmark). */
export default function PartnerServicesRedirectPage() {
  permanentRedirect(PARTNER_ORDERS_HUB_WORKSPACE_SERVICES_HREF);
}
