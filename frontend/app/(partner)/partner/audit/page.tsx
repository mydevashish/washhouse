import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerAuditView } from '@/features/partner/views/partner-audit-view';

export const metadata = { title: 'Partner · Activity' };

export default function PartnerAuditPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerAuditView />
    </RoleGuard>
  );
}
