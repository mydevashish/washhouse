import { RoleGuard } from '@/components/auth/role-guard';
import { AdminFraudDetectionPanel } from '@/features/admin/admin-fraud-detection-panel';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

export const metadata = { title: 'Admin · Fraud detection' };

export default function AdminFraudPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Fraud detection"
          description="Automated risk signals for customers and partners. Review alerts, acknowledge, and resolve."
        />
        <AdminFraudDetectionPanel />
      </AdminContent>
    </RoleGuard>
  );
}
