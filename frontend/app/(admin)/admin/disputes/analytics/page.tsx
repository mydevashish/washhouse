import { RoleGuard } from '@/components/auth/role-guard';
import { AdminDisputeAnalyticsView } from '@/features/admin/views/admin-dispute-analytics-view';

export const metadata = { title: 'Admin · Dispute Analytics' };

export default function AdminDisputeAnalyticsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminDisputeAnalyticsView />
    </RoleGuard>
  );
}
