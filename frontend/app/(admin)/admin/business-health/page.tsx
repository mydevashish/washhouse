import { RoleGuard } from '@/components/auth/role-guard';
import { AdminBusinessHealthView } from '@/features/admin/views/admin-business-health-view';

export const metadata = { title: 'Admin · Business health' };

export default function AdminBusinessHealthPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminBusinessHealthView />
    </RoleGuard>
  );
}
