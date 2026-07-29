import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerPriceListView } from '@/features/partner-price-list';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Garment price list' };

export default function PartnerPricingPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerPriceListView />
    </RoleGuard>
  );
}
