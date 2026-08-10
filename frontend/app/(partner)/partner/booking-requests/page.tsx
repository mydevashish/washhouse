import { Suspense } from 'react';

import { RoleGuard } from '@/components/auth/role-guard';
import { Skeleton } from '@/components/ui/skeleton';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerBookingRequestsInbox } from '@/features/partner/booking-requests';
import { PARTNER_PORTAL_ROLES } from '@/lib/partner-roles';

export const metadata = { title: 'Partner · Booking requests' };

function InboxFallback() {
  return <Skeleton className="h-96 w-full rounded-2xl" />;
}

export default function PartnerBookingRequestsPage() {
  return (
    <RoleGuard roles={PARTNER_PORTAL_ROLES}>
      <PartnerContent className="space-y-5">
        <PartnerPageHeader
          title="Booking requests"
          description="Doorstep leads — assign, contact, and convert to shop orders."
        />
        <Suspense fallback={<InboxFallback />}>
          <PartnerBookingRequestsInbox />
        </Suspense>
      </PartnerContent>
    </RoleGuard>
  );
}
