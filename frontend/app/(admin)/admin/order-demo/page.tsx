import { RoleGuard } from '@/components/auth/role-guard';
import { AdminOrderDemoView } from '@/features/admin/views/admin-order-demo-view';

export const metadata = { title: 'Admin · Laundry demo' };

export default function AdminOrderDemoPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminOrderDemoView />
    </RoleGuard>
  );
}
