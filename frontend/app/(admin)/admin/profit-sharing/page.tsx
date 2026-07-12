import { RoleGuard } from '@/components/auth/role-guard';
import { AdminProfitSharingView } from '@/features/admin/views/admin-profit-sharing-view';

export const metadata = { title: 'Profit Sharing' };

export default function AdminProfitSharingPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminProfitSharingView />
    </RoleGuard>
  );
}
