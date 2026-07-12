import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerOperationsView } from '@/features/partner/views/partner-operations-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Operations' };

export default function PartnerOperationsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerOperationsView />
    </RoleGuard>
  );
}
