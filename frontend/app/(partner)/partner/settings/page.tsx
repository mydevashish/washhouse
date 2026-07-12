import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerSettingsView } from '@/features/partner/views/partner-settings-view';

export const metadata = { title: 'Partner · Settings' };

export default function PartnerSettingsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerSettingsView />
    </RoleGuard>
  );
}
