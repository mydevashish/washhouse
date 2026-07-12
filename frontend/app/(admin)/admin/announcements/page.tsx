import { RoleGuard } from '@/components/auth/role-guard';
import { AdminAnnouncementCenterView } from '@/features/admin/views/admin-announcement-center-view';

export const metadata = { title: 'Admin · Announcement Center' };

export default function AdminAnnouncementsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminAnnouncementCenterView />
    </RoleGuard>
  );
}
