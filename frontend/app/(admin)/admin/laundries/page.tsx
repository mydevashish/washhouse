import { RoleGuard } from '@/components/auth/role-guard';
import { AdminLaundriesView } from '@/features/admin/views/admin-laundries-view';

export const metadata = { title: 'Admin · Laundries' };

export default function AdminLaundriesPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminLaundriesView />
    </RoleGuard>
  );
}
