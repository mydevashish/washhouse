'use client';

import { usePartnerUiMode } from '@/features/partner-shop-floor/hooks/use-partner-ui-mode';
import { ShopFloorHomeView } from '@/features/partner-shop-floor/views/shop-floor-home-view';
import { PartnerOverviewView } from '@/features/partner/views/partner-overview-view';

/** `/partner` — Shop Floor 4-tile home or Advanced Overview. */
export function PartnerHomeView() {
  const { mode } = usePartnerUiMode();

  if (mode === 'shop_floor') {
    return <ShopFloorHomeView />;
  }

  return <PartnerOverviewView />;
}
