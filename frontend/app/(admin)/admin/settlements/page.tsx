import { RoleGuard } from '@/components/auth/role-guard';
import { AdminSettlementsView } from '@/features/admin/views/admin-settlements-view';

export const metadata = { title: 'Admin · Settlements' };

export default function AdminSettlementsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminSettlementsView />
    </RoleGuard>
  );
}
