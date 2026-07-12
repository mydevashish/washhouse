import { RoleGuard } from '@/components/auth/role-guard';
import { AdminPlatformConfigView } from '@/features/admin/views/admin-platform-config-view';

export const metadata = { title: 'Admin · Platform Configuration Center' };

export default function AdminConfigurationPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminPlatformConfigView />
    </RoleGuard>
  );
}
