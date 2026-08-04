import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerCustomerDeskView } from '@/features/partner/customer-desk';
import { Skeleton } from '@/components/ui/skeleton';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Customer Desk' };

function CustomerDeskFallback() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full max-w-xl" />
    </div>
  );
}

export default function PartnerCustomerDeskPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <Suspense fallback={<CustomerDeskFallback />}>
        <PartnerCustomerDeskView />
      </Suspense>
    </RoleGuard>
  );
}
