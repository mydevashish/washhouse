'use client';

import { PartnerDashboardPeriodProvider } from '@/features/partner/dashboard/partner-dashboard-period';
import { PartnerLaundryDashboardView } from '@/features/partner/views/partner-laundry-dashboard-view';

/** `/partner` — WashHouse ops dashboard (demo layout, live APIs). */
export function PartnerHomeView() {
  return (
    <PartnerDashboardPeriodProvider>
      <PartnerLaundryDashboardView />
    </PartnerDashboardPeriodProvider>
  );
}
