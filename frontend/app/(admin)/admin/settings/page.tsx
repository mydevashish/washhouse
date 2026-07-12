import { RoleGuard } from '@/components/auth/role-guard';
import { AdminSettingsView } from '@/features/admin/views/admin-settings-view';

export const metadata = { title: 'Admin · Settings' };

export default function AdminSettingsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminSettingsView />
    </RoleGuard>
  );
}
