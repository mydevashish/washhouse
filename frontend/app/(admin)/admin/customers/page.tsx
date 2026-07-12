import { RoleGuard } from '@/components/auth/role-guard';
import { AdminCustomersView } from '@/features/admin/views/admin-customers-view';

export const metadata = { title: 'Admin · Customers' };

export default function AdminCustomersPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminCustomersView />
    </RoleGuard>
  );
}
