import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerSettlementsView } from '@/features/partner/views/partner-settlements-view';

export const metadata = { title: 'Partner · Settlements' };

export default function PartnerSettlementsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerSettlementsView />
    </RoleGuard>
  );
}
