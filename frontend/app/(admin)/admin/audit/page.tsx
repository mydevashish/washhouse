import { RoleGuard } from '@/components/auth/role-guard';
import { AdminAuditView } from '@/features/admin/views/admin-audit-view';

export const metadata = { title: 'Admin · Audit logs' };

export default function AdminAuditPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminAuditView />
    </RoleGuard>
  );
}
