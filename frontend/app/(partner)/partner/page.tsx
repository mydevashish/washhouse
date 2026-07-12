import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerOverviewView } from '@/features/partner/views/partner-overview-view';

export const metadata = { title: 'Partner · Overview' };

export default function PartnerPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerOverviewView />
    </RoleGuard>
  );
}
