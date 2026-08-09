'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';

/**
 * `/partner/new-order` — legacy bookmark; always opens Customers & Orders → Create order tab.
 */
export function PartnerNewOrderGate() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const mode = params.get('mode');
    if (mode === 'assisted') {
      params.delete('mode');
      params.set('fulfillment', 'doorstep');
    } else if (mode === 'walk_in') {
      params.delete('mode');
    }
    router.replace(buildOrdersHubPath('/partner/orders', 'create', params));
  }, [router, searchParams]);

  return (
    <div className="space-y-4 p-4 sm:p-6" role="status" aria-live="polite">
      <span className="sr-only">Opening create order</span>
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-40 w-full" />
    </div>
  );
}
