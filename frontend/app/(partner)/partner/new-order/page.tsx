import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerContent } from '@/features/partner/components/partner-content';
import { PartnerNewOrderGate } from '@/features/partner-shop-floor/views/partner-new-order-gate';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · New Order' };

/** Walk-in / doorstep intake — separate from Customers & Orders pillar hub. */
export default function PartnerNewOrderPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerContent className="py-2">
        <PartnerNewOrderGate />
      </PartnerContent>
    </RoleGuard>
  );
}
