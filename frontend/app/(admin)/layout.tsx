import { OptionalAuthRefresh } from '@/components/auth/optional-auth-refresh';
import { RoleGuard } from '@/components/auth/role-guard';
import { AdminShell } from '@/components/layout/admin-shell';

/** Gate the whole admin chrome — not just page bodies — so non-admins never see ops nav. */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OptionalAuthRefresh />
      <RoleGuard roles={['admin', 'super_admin']}>
        <AdminShell>{children}</AdminShell>
      </RoleGuard>
    </>
  );
}
