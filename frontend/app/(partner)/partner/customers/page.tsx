import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerCustomersView } from '@/features/partner/views/partner-customers-view';

export const metadata = { title: 'Partner · Customer Insights Dashboard' };

export default function PartnerCustomersPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerCustomersView />
    </RoleGuard>
  );
}
