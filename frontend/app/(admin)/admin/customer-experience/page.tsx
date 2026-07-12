import { RoleGuard } from '@/components/auth/role-guard';
import { AdminCustomerExperienceView } from '@/features/admin/views/admin-customer-experience-view';

export const metadata = { title: 'Customer Experience' };

export default function AdminCustomerExperiencePage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminCustomerExperienceView />
    </RoleGuard>
  );
}
