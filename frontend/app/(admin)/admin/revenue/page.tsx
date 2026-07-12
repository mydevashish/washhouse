import { RoleGuard } from '@/components/auth/role-guard';
import { AdminRevenuePageClient } from '@/features/admin/views/admin-revenue-page-client';

export const metadata = { title: 'Admin · Revenue' };

export default function AdminRevenuePage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminRevenuePageClient />
    </RoleGuard>
  );
}
