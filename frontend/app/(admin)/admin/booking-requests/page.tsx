import { RoleGuard } from '@/components/auth/role-guard';
import { AdminBookingRequestsDatatable } from '@/features/admin/booking-requests';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';

export const metadata = { title: 'Admin · Booking requests' };

export default function AdminBookingRequestsPage() {
  return (
    <RoleGuard roles={['admin', 'super_admin']}>
      <AdminContent className="space-y-5">
        <AdminPageHeader
          title="Booking requests"
          description="Triage unassigned Book Now leads — assign partners, WhatsApp customers, and track SLA."
        />
        <AdminBookingRequestsDatatable />
      </AdminContent>
    </RoleGuard>
  );
}
