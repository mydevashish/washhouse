import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerPriceListView } from '@/features/partner-price-list';

export const metadata = { title: 'Garment price list' };

export default function PartnerPricingPage() {
  return (
    <RoleGuard roles={['partner']}>
      <PartnerPriceListView />
    </RoleGuard>
  );
}
