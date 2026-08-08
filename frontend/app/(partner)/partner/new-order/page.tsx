import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerNewOrderGate } from '@/features/partner-shop-floor/views/partner-new-order-gate';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · New Order' };

function NewOrderFallback() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function PartnerNewOrderPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <Suspense fallback={<NewOrderFallback />}>
        <PartnerNewOrderGate />
      </Suspense>
    </RoleGuard>
  );
}
