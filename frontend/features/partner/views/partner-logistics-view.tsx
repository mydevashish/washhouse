'use client';

import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { OwnerLogisticsBoard } from '@/features/partner/components/owner/owner-logistics-board';
import type { LogisticsBoardTab } from '@/features/partner/lib/owner-logistics';

export function PartnerLogisticsView({
  initialTab = 'pickups',
  showTabNav = true,
  title = 'Logistics',
  description = 'Pickups, deliveries, and today’s completed runs — picture-first.',
}: {
  initialTab?: LogisticsBoardTab;
  showTabNav?: boolean;
  title?: string;
  description?: string;
}) {
  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader title={title} description={description} />
      <OwnerLogisticsBoard
        initialTab={initialTab}
        showTabNav={showTabNav}
        showBoardHeader={showTabNav}
      />
    </PartnerContent>
  );
}
