import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerDeliveriesView } from '@/features/partner/views/partner-deliveries-view';

export const metadata = { title: 'Partner · Deliveries' };

export default function PartnerDeliveriesPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerDeliveriesView />
    </RoleGuard>
  );
}
