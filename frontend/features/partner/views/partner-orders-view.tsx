'use client';

import { PartnerOrdersHub } from '@/features/partner/orders-hub/partner-orders-hub';
import { PartnerContent } from '@/features/partner/components/partner-content';

export function PartnerOrdersView() {
  return (
    <PartnerContent className="py-2">
      <PartnerOrdersHub />
    </PartnerContent>
  );
}
