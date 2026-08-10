'use client';

import { Suspense } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import {
  PartnerHubCreateOrderProvider,
  PartnerHubCreateOrderUrlListener,
} from '@/features/partner/orders-hub/workspace/partner-hub-create-order';
import { PartnerHubPillarsRow } from '@/features/partner/orders-hub/workspace/partner-hub-customers-pillar';
import { usePartnerHubLegacyHubRedirect } from '@/features/partner/orders-hub/workspace/use-partner-hub-workspace-url';

function HubFallback() {
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );
}

function PartnerOrdersHubBody() {
  usePartnerHubLegacyHubRedirect();

  return (
    <>
      <PartnerHubCreateOrderUrlListener />
      <h1 className="sr-only">Customers & Orders</h1>
      <PartnerHubPillarsRow />
    </>
  );
}

/** Partner Customers & Orders — four pillar tiles; detail in workspace modals. */
export function PartnerOrdersHub() {
  return (
    <PartnerHubCreateOrderProvider>
      <div data-testid="partner-orders-hub">
        <Suspense fallback={<HubFallback />}>
          <PartnerOrdersHubBody />
        </Suspense>
      </div>
    </PartnerHubCreateOrderProvider>
  );
}
