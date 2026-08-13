'use client';

import { PartnerHubServicesWorkspaceBody, usePartnerHubServices } from '@/features/partner/orders-hub/workspace/partner-hub-services-workspace';

export function PartnerServiceCatalogView() {
  const servicesQ = usePartnerHubServices();

  return (
    <div className="space-y-4" data-testid="partner-services-page">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Service catalog</h1>
          <p className="text-sm text-muted-foreground">
            Add, update, and manage your service list for walk-in and customer bookings.
          </p>
        </div>
      </div>

      <PartnerHubServicesWorkspaceBody servicesQ={servicesQ} />
    </div>
  );
}
