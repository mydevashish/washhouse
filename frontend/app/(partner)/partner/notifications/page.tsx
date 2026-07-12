import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerNotificationsView } from '@/features/partner/views/partner-notifications-view';

export const metadata = { title: 'Partner · Notifications' };

export default function PartnerNotificationsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerNotificationsView />
    </RoleGuard>
  );
}
