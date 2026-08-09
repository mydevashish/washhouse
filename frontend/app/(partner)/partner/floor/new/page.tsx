import { permanentRedirect } from 'next/navigation';

import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

export const metadata = { title: 'Partner · New order' };

/** Cloth Wall intake lives on the hub Create order tab. */
export default function PartnerFloorNewOrderPage() {
  permanentRedirect(buildOrdersHubPath('/partner/orders', 'create'));
}
