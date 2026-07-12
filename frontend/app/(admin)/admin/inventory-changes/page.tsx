import { AdminInventoryChangesPanel } from '@/features/admin/admin-inventory-changes-panel';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

export const metadata = { title: 'Inventory changes' };

export default function AdminInventoryChangesPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Inventory change requests"
          description="Review partner requests to modify locked pickup inventory."
        />
        <AdminInventoryChangesPanel />
      </AdminContent>
    </RoleGuard>
  );
}
