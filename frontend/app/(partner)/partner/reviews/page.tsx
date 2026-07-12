import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerReviewsView } from '@/features/partner/views/partner-reviews-view';

export const metadata = { title: 'Partner · Reviews' };

export default function PartnerReviewsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerReviewsView />
    </RoleGuard>
  );
}
