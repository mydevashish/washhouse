import { RoleGuard } from '@/components/auth/role-guard';
import { AdminOrdersView } from '@/features/admin/views/admin-orders-view';

export const metadata = { title: 'Admin · Orders' };

export default function AdminOrdersPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminOrdersView />
    </RoleGuard>
  );
}
