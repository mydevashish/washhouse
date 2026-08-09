import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerCouponsView } from '@/features/partner/views/partner-coupons-view';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Coupons' };

function Fallback() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}

export default function PartnerCouponsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <Suspense fallback={<Fallback />}>
        <PartnerCouponsView />
      </Suspense>
    </RoleGuard>
  );
}
