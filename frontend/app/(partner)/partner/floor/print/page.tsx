import { RoleGuard } from '@/components/auth/role-guard';
import { ShopFloorPrintView } from '@/features/partner-shop-floor/views/shop-floor-print-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Print' };

export default function PartnerFloorPrintPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <ShopFloorPrintView />
    </RoleGuard>
  );
}
