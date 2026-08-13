import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerServiceCatalogView } from '@/features/partner/views/partner-service-catalog-view';

export const metadata = { title: 'Partner · Service Catalog' };

export default function PartnerServicesPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerServiceCatalogView />
    </RoleGuard>
  );
}
