'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { Skeleton } from '@/components/ui/skeleton';
import { PartnerWalkInOrderWorkspace } from '@/features/partner/components/ops-visual';

function NewOrderFallback() {
  return (
    <div className="space-y-4" role="status" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}

/** `/partner/new-order` — walk-in / doorstep intake (no hub tab). */
export function PartnerNewOrderGate() {
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const fulfillment =
    searchParams.get('fulfillment') === 'doorstep' || mode === 'assisted' ? 'doorstep' : 'walk_in';

  return (
    <Suspense fallback={<NewOrderFallback />}>
      <PartnerWalkInOrderWorkspace
        embedded
        initialName={searchParams.get('name') ?? ''}
        initialPhone={searchParams.get('phone') ?? ''}
        initialFulfillment={fulfillment}
      />
    </Suspense>
  );
}
