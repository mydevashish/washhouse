'use client';

import { PartnerLogisticsView } from '@/features/partner/views/partner-logistics-view';

/** Legacy route — shared Logistics board locked to pickups. */
export function PartnerPickupsView() {
  return (
    <PartnerLogisticsView
      initialTab="pickups"
      showTabNav={false}
      title="Pickups"
      description="Orders waiting for collection — same board as Logistics › Needs pickup."
    />
  );
}
