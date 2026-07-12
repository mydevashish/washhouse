import { RoleGuard } from '@/components/auth/role-guard';
import { AdminNotificationsView } from '@/features/admin/views/admin-notifications-view';

export const metadata = { title: 'Admin · Notifications' };

export default function AdminNotificationsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminNotificationsView />
    </RoleGuard>
  );
}
