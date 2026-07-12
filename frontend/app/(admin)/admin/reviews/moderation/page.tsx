import { RoleGuard } from '@/components/auth/role-guard';
import { AdminReviewManagementView } from '@/features/admin/views/admin-review-management-view';

export const metadata = { title: 'Admin · Review moderation' };

export default function AdminReviewManagementPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminReviewManagementView />
    </RoleGuard>
  );
}
