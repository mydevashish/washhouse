import { RoleGuard } from '@/components/auth/role-guard';
import { AdminApprovalsView } from '@/features/admin/views/admin-approvals-view';

export const metadata = { title: 'Admin · Approvals' };

export default function AdminApprovalsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminApprovalsView />
    </RoleGuard>
  );
}
