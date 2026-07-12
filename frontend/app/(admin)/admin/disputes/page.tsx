import { RoleGuard } from '@/components/auth/role-guard';
import { AdminDisputesPanel } from '@/features/admin/admin-disputes-panel';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { DisputeAnalyticsLink } from '@/features/admin/views/admin-dispute-analytics-view';

export const metadata = { title: 'Admin · Disputes' };

export default function AdminDisputesPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Dispute management"
          description="Enterprise dispute queue — filter, investigate, and resolve at scale with full order evidence."
          actions={<DisputeAnalyticsLink />}
        />
        <AdminDisputesPanel />
      </AdminContent>
    </RoleGuard>
  );
}
