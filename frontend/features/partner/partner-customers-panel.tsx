'use client';



import { useQuery } from '@tanstack/react-query';

import { Users } from 'lucide-react';

import Link from 'next/link';



import { ClientDate } from '@/components/ui/client-date';

import { Card, CardContent } from '@/components/ui/card';

import { EmptyState } from '@/components/ui/empty-state';

import { InfoBanner } from '@/components/ui/info-banner';

import { Skeleton } from '@/components/ui/skeleton';

import { formatInr } from '@/features/discover/detail/order-pricing';

import { queryKeys } from '@/lib/query-keys';

import { listPartnerCustomerInsights } from '@/services/customer-insights';



export function PartnerCustomersPanel() {

  const customersQ = useQuery({

    queryKey: queryKeys.partnerCustomerInsights('top', ''),

    queryFn: () => listPartnerCustomerInsights({ list_type: 'top', limit: 5 }),

  });



  if (customersQ.isLoading) {

    return (

      <div className="space-y-3" aria-busy="true">

        {Array.from({ length: 4 }).map((_, i) => (

          <Skeleton key={i} className="h-20 w-full rounded-xl" />

        ))}

      </div>

    );

  }



  if (customersQ.isError) {

    return (

      <InfoBanner variant="destructive" title="Could not load customers">

        Please try again in a moment.

      </InfoBanner>

    );

  }



  const customers = customersQ.data?.items ?? [];



  if (!customers.length) {

    return (

      <EmptyState

        icon={Users}

        title="No customers yet"

        description="When people order from your shop, they will appear here."

      />

    );

  }



  return (

    <div className="space-y-4">

      <p className="text-sm text-muted-foreground">

        Top customers by lifetime spend.{' '}

        <Link href="/partner/customers" className="font-medium text-primary hover:underline">

          View all insights

        </Link>

      </p>

      <ul className="space-y-3">

        {customers.map((c) => (

          <li key={c.user_id}>

            <Card>

              <CardContent className="flex items-center justify-between gap-4 p-5">

                <div className="min-w-0">

                  <p className="text-lg font-bold text-foreground">{c.name}</p>

                  <p className="mt-1 text-sm text-muted-foreground">

                    {c.order_count} {c.order_count === 1 ? 'order' : 'orders'}

                    {c.last_order_at && (

                      <>

                        {' · Last '}

                        <ClientDate iso={c.last_order_at} mode="date" />

                      </>

                    )}

                  </p>

                </div>

                <p className="shrink-0 text-lg font-bold tabular-nums text-foreground">

                  {formatInr(Number(c.lifetime_spend_inr))}

                </p>

              </CardContent>

            </Card>

          </li>

        ))}

      </ul>

    </div>

  );

}

