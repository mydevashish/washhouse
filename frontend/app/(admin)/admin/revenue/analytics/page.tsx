import { RoleGuard } from '@/components/auth/role-guard';
import { AdminRevenueAnalyticsView } from '@/features/admin/views/admin-revenue-analytics-view';

export const metadata = { title: 'Admin · Revenue Analytics' };

export default function AdminRevenueAnalyticsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminRevenueAnalyticsView />
    </RoleGuard>
  );
}
