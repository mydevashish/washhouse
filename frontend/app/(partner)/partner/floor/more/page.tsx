import { RoleGuard } from '@/components/auth/role-guard';
import { ShopFloorMoreView } from '@/features/partner-shop-floor/views/shop-floor-more-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · More' };

export default function PartnerFloorMorePage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <ShopFloorMoreView />
    </RoleGuard>
  );
}
