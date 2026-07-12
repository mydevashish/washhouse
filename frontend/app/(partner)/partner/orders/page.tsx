import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerOrdersView } from '@/features/partner/views/partner-orders-view';

export const metadata = { title: 'Partner · Orders' };

export default function PartnerOrdersPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerOrdersView />
    </RoleGuard>
  );
}
