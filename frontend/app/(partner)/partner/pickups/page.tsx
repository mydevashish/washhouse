import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerPickupsView } from '@/features/partner/views/partner-pickups-view';

export const metadata = { title: 'Partner · Pickups' };

export default function PartnerPickupsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerPickupsView />
    </RoleGuard>
  );
}
