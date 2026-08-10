import { permanentRedirect } from 'next/navigation';

import { PARTNER_ORDERS_HUB_WORKSPACE_COUPONS_HREF } from '@/features/partner/lib/partner-nav';

export const metadata = { title: 'Partner · Coupons' };

/** Legacy route → Orders Hub coupons workspace modal. */
export default function PartnerCouponsRedirectPage() {
  permanentRedirect(PARTNER_ORDERS_HUB_WORKSPACE_COUPONS_HREF);
}
