'use client';



import { IndianRupee, TrendingUp } from 'lucide-react';



import { Card, CardContent } from '@/components/ui/card';

import { InfoBanner } from '@/components/ui/info-banner';

import { Skeleton } from '@/components/ui/skeleton';

import { formatInr } from '@/features/discover/detail/order-pricing';

import type { PartnerAnalytics } from '@/services/partner';



type PartnerRevenuePanelProps = {

  stats?: PartnerAnalytics;

  isLoading: boolean;

  isError: boolean;

};



export function PartnerRevenuePanel({ stats, isLoading, isError }: PartnerRevenuePanelProps) {

  if (isLoading) {

    return (

      <div className="space-y-4" aria-busy="true">

        <Skeleton className="h-32 w-full rounded-2xl" />

        <Skeleton className="h-24 w-full rounded-2xl" />

      </div>

    );

  }



  if (isError || !stats) {

    return (

      <InfoBanner variant="destructive" title="Could not load revenue">

        Please try again in a moment.

      </InfoBanner>

    );

  }



  return (

    <div className="space-y-4">

      <p className="text-sm text-muted-foreground">

        Revenue from completed (delivered) orders. Simple totals — no spreadsheets needed.

      </p>



      <Card className="border-primary/20 bg-gradient-to-br from-primary/10 to-background">

        <CardContent className="p-6">

          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">

            <IndianRupee className="h-4 w-4" aria-hidden />

            Total earned

          </p>

          <p className="mt-2 text-4xl font-bold tabular-nums text-foreground">

            {formatInr(Number(stats.revenue_inr))}

          </p>

          <p className="mt-2 text-sm text-muted-foreground">All delivered orders</p>

        </CardContent>

      </Card>



      <Card>

        <CardContent className="flex items-center gap-4 p-6">

          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">

            <TrendingUp className="h-6 w-6" aria-hidden />

          </div>

          <div>

            <p className="text-sm text-muted-foreground">This month</p>

            <p className="text-2xl font-bold tabular-nums text-foreground">

              {formatInr(Number(stats.revenue_this_month_inr))}

            </p>

          </div>

        </CardContent>

      </Card>



      <div className="grid grid-cols-2 gap-3">

        {[

          ['Delivered orders', stats.orders_delivered],

          ['Total customers', stats.customers_count],

        ].map(([label, value]) => (

          <Card key={label}>

            <CardContent className="p-4 text-center">

              <p className="text-2xl font-bold text-foreground">{value}</p>

              <p className="mt-1 text-xs text-muted-foreground">{label}</p>

            </CardContent>

          </Card>

        ))}

      </div>

    </div>

  );

}

