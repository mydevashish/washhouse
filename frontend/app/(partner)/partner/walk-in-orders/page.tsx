import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { PartnerWalkInOrdersView } from '@/features/partner/views/partner-walk-in-orders-view';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Partner · Walk-in orders' };

function WalkInFallback() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

export default function PartnerWalkInOrdersPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <Suspense fallback={<WalkInFallback />}>
        <PartnerWalkInOrdersView />
      </Suspense>
    </RoleGuard>
  );
}
