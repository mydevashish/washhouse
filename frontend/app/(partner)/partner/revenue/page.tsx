import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerRevenueView } from '@/features/partner/views/partner-revenue-view';

export const metadata = { title: 'Partner · Revenue' };

export default function PartnerRevenuePage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerRevenueView />
    </RoleGuard>
  );
}
