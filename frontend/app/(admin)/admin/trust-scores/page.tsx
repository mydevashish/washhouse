import { RoleGuard } from '@/components/auth/role-guard';
import { AdminTrustScoresTabs } from '@/features/admin/admin-trust-scores-tabs';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

export const metadata = { title: 'Admin · Trust scores' };

export default function AdminTrustScoresPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Trust scores"
          description="Customer risk scoring (internal) and partner Laundry Trust Score — visible to partners on their dashboard."
        />
        <AdminTrustScoresTabs />
      </AdminContent>
    </RoleGuard>
  );
}
