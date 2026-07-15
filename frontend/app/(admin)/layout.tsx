import { OptionalAuthRefresh } from '@/components/auth/optional-auth-refresh';
import { AdminShell } from '@/components/layout/admin-shell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminShell>
      <OptionalAuthRefresh />
      {children}
    </AdminShell>
  );
}
