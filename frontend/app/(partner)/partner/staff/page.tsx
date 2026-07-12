import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerStaffView } from '@/features/partner/views/partner-staff-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Staff' };

export default function PartnerStaffPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerStaffView />
    </RoleGuard>
  );
}
