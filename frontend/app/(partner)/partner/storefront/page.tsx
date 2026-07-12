'use client';

import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerStorefrontBuilderView } from '@/features/partner/storefront/partner-storefront-builder-view';

export default function PartnerStorefrontPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerStorefrontBuilderView />
    </RoleGuard>
  );
}
