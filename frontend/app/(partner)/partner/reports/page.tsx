import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerReportsView } from '@/features/partner/views/partner-reports-view';

export const metadata = { title: 'Partner · Reports' };

export default function PartnerReportsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerReportsView />
    </RoleGuard>
  );
}
