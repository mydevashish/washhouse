import { RoleGuard } from '@/components/auth/role-guard';
import { PlatformPartnerEarningsView } from '@/features/platform-partner/views/platform-partner-earnings-view';

export const metadata = { title: 'My Earnings' };

const PLATFORM_PARTNER_ROLES = ['platform_partner', 'admin', 'super_admin'] as const;

export default function PlatformPartnerEarningsPage() {
  return (
    <RoleGuard roles={[...PLATFORM_PARTNER_ROLES]}>
      <PlatformPartnerEarningsView />
    </RoleGuard>
  );
}
