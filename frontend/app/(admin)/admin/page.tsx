import { RoleGuard } from '@/components/auth/role-guard';
import { AdminOverviewView } from '@/features/admin/views/admin-overview-view';

export const metadata = { title: 'Admin · Overview' };

export default function AdminOverviewPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminOverviewView />
    </RoleGuard>
  );
}
