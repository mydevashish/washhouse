import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerWalkInOrdersView } from '@/features/partner/views/partner-walk-in-orders-view';

export const metadata = { title: 'Partner · Walk-in orders' };

export default function PartnerWalkInOrdersPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerWalkInOrdersView />
    </RoleGuard>
  );
}
