import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerOpsVisualDemoView } from '@/features/partner/views/partner-ops-visual-demo-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Ops visual demo' };

export default function PartnerOpsVisualDemoPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerOpsVisualDemoView />
    </RoleGuard>
  );
}
