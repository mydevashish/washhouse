import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerServiceCatalogView } from '@/features/partner/views/partner-service-catalog-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Service Catalog' };

export default function PartnerServicesPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerServiceCatalogView />
    </RoleGuard>
  );
}
