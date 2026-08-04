import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { CustomerDeskView } from '@/features/admin/customer-desk';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Admin · Customer Desk' };

function CustomerDeskFallback() {
  return (
    <div className="space-y-4 p-4 sm:p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full max-w-xl" />
    </div>
  );
}

export default function AdminCustomerDeskPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <Suspense fallback={<CustomerDeskFallback />}>
        <CustomerDeskView />
      </Suspense>
    </RoleGuard>
  );
}
