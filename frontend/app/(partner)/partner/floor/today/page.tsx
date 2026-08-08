import { RoleGuard } from '@/components/auth/role-guard';
import { ShopFloorTodayView } from '@/features/partner-shop-floor/views/shop-floor-today-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Aaj ka Kaam' };

export default function PartnerFloorTodayPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <ShopFloorTodayView />
    </RoleGuard>
  );
}
