'use client';

import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerOrdersHub } from '@/features/partner/orders-hub/partner-orders-hub';

export function PartnerOrdersView() {
  return (
    <PartnerContent className="space-y-5">
      <PartnerOrdersHub />
    </PartnerContent>
  );
}
