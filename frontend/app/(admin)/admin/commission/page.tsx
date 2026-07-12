import { RoleGuard } from '@/components/auth/role-guard';
import { AdminCommissionView } from '@/features/admin/views/admin-commission-view';

export const metadata = { title: 'Admin · Commission' };

export default function AdminCommissionPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminCommissionView />
    </RoleGuard>
  );
}
