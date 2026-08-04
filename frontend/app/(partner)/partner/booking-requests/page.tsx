import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerBookingRequestsInbox } from '@/features/partner/booking-requests';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = { title: 'Partner · Booking requests' };

export default function PartnerBookingRequestsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerContent className="space-y-5">
        <PartnerPageHeader
          title="Booking requests"
          description="Handle leads assigned to your laundry — WhatsApp customers, update status, and log phone follow-ups."
        />
        <Suspense fallback={<Skeleton className="h-64 w-full rounded-2xl" />}>
          <PartnerBookingRequestsInbox />
        </Suspense>
      </PartnerContent>
    </RoleGuard>
  );
}
