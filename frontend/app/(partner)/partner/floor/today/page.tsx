import { permanentRedirect } from 'next/navigation';

import {
  buildPartnerOrdersQueuePath,
  chipPresetUrlPatch,
} from '@/features/partner/orders-hub/partner-orders-hub-queue';

export const metadata = { title: 'Partner · Today’s orders' };

/**
 * Legacy Shop Floor Today board → Customers & Orders hub “Today” chip.
 */
export default function PartnerFloorTodayRedirectPage() {
  permanentRedirect(buildPartnerOrdersQueuePath(chipPresetUrlPatch('today')));
}
