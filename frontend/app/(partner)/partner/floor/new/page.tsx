import { permanentRedirect } from 'next/navigation';

import { buildPartnerHubOrderCreateHref } from '@/features/partner/orders-hub/workspace/partner-hub-order-create-url';

export const metadata = { title: 'Partner · New order' };

/** Cloth Wall intake → dedicated new-order page. */
export default function PartnerFloorNewOrderPage() {
  permanentRedirect(buildPartnerHubOrderCreateHref());
}
