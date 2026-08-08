import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerHomeView } from '@/features/partner-shop-floor/views/partner-home-view';

export const metadata = { title: 'Partner · Home' };

export default function PartnerPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerHomeView />
    </RoleGuard>
  );
}
