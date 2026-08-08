import { permanentRedirect } from 'next/navigation';

import {
  buildPartnerOrdersQueuePath,
  chipPresetUrlPatch,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';

export const metadata = { title: 'Partner · Ready today' };

/**
 * Legacy Shop Floor Ready board → Customers & Orders hub “Ready today” chip.
 */
export default function PartnerFloorReadyRedirectPage() {
  permanentRedirect(buildPartnerOrdersQueuePath(chipPresetUrlPatch('ready_today')));
}
