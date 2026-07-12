import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerServiceCatalogView } from '@/features/partner/views/partner-service-catalog-view';

export const metadata = { title: 'Service Catalog' };

export default function PartnerServicesPage() {
  return (
    <RoleGuard roles={['partner', 'partner_staff']}>
      <PartnerServiceCatalogView />
    </RoleGuard>
  );
}
