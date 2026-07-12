import { RoleGuard } from '@/components/auth/role-guard';
import { PlatformPartnerDashboardView } from '@/features/platform-partner/views/platform-partner-dashboard-view';

export const metadata = { title: 'Platform Partner Dashboard' };

const PLATFORM_PARTNER_ROLES = ['platform_partner', 'admin', 'super_admin'] as const;

export default function PlatformPartnerPage() {
  return (
    <RoleGuard roles={[...PLATFORM_PARTNER_ROLES]}>
      <PlatformPartnerDashboardView />
    </RoleGuard>
  );
}
