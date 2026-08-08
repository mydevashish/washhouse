import { RoleGuard } from '@/components/auth/role-guard';
import { ShopFloorReadyView } from '@/features/partner-shop-floor/views/shop-floor-ready-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Ready / Diya' };

export default function PartnerFloorReadyPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <ShopFloorReadyView />
    </RoleGuard>
  );
}
