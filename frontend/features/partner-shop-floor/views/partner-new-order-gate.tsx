'use client';

import { useSearchParams } from 'next/navigation';

import { PartnerNewOrderView } from '@/features/partner/views/partner-new-order-view';
import { ClothWallNewOrderView } from '@/features/partner-shop-floor/views/cloth-wall-new-order-view';

/**
 * `/partner/new-order` — Cloth Wall walk-in wizard by default;
 * `?mode=assisted` keeps the doorstep assisted desk flow.
 * Hub FAB / header sheet chooses the mode (P3).
 */
export function PartnerNewOrderGate() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  if (mode === 'assisted') {
    return <PartnerNewOrderView />;
  }

  return (
    <ClothWallNewOrderView
      title="New order"
      description="Walk-in Cloth Wall — phone, tap clothes, confirm, then print tags"
    />
  );
}
