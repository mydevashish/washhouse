import { RoleGuard } from '@/components/auth/role-guard';
import { AdminOrdersTable } from '@/features/admin/admin-orders-table';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

export const metadata = { title: 'Admin · Orders' };

export default function AdminOrdersPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Orders"
          description="All platform orders with laundry, customer, and payment context."
        />
        <AdminOrdersTable />
      </AdminContent>
    </RoleGuard>
  );
}
