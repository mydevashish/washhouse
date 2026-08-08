'use client';

import { PartnerLogisticsView } from '@/features/partner/views/partner-logistics-view';

/** Legacy route — shared Logistics board locked to deliveries. */
export function PartnerDeliveriesView() {
  return (
    <PartnerLogisticsView
      initialTab="deliveries"
      showTabNav={false}
      title="Deliveries"
      description="Ready and out-for-delivery runs — same board as Logistics › Out for delivery."
    />
  );
}
