'use client';



import { memo, useCallback } from 'react';

import Image from 'next/image';

import Link from 'next/link';

import { useQueryClient } from '@tanstack/react-query';

import { BadgeCheck, Clock, MapPin, Star, Truck } from 'lucide-react';



import { Badge } from '@/components/ui/badge';
import { ClientLocaleNumber } from '@/components/ui/client-locale-number';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardFooter } from '@/components/ui/card';

import { getLaundryInitials } from '@/features/discover/detail/service-icons';

import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';

import { deliveryLabel } from '@/features/discover/lib/laundry-meta';

import { queryKeys } from '@/lib/query-keys';

import { STALE } from '@/lib/query-config';

import { getLaundry } from '@/services/laundries';



type LaundryCardProps = {

  laundry: EnrichedLaundry;

};



function LaundryCardComponent({ laundry }: LaundryCardProps) {

  const queryClient = useQueryClient();

  const rating = Number(laundry.avg_rating);

  const initials = getLaundryInitials(laundry.name);



  const prefetchDetail = useCallback(() => {

    void queryClient.prefetchQuery({

      queryKey: queryKeys.laundry(laundry.id),

      queryFn: () => getLaundry(laundry.id),

      staleTime: STALE.laundryDetail,

    });

  }, [queryClient, laundry.id]);



  return (

    <Card

      variant="interactive"

      className="group flex h-full flex-col overflow-hidden rounded-2xl border-0 bg-card p-0 shadow-soft ring-1 ring-border/60"

    >

      <div className="relative aspect-[4/3] overflow-hidden bg-muted sm:aspect-[16/10]">

        <Image

          src={laundry.image}

          alt=""

          fill

          className="object-cover transition-transform duration-500 group-hover:scale-105"

          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"

        />

        <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 via-transparent to-transparent" />



        <div className="absolute left-3 top-3 flex flex-wrap gap-2">

          {laundry.is_verified && (

            <Badge className="border-0 bg-card/95 text-foreground shadow-md backdrop-blur">

              <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden />

              Verified

            </Badge>

          )}

        </div>

        <Badge className="absolute right-3 top-3 border-0 bg-success text-success-foreground shadow-md">

          <Truck className="h-3.5 w-3.5" aria-hidden />

          Free pickup

        </Badge>



        <div

          className="absolute bottom-3 left-3 flex h-10 w-10 items-center justify-center rounded-lg border-2 border-card bg-primary text-xs font-bold text-primary-foreground shadow-lg"

          aria-hidden

        >

          {initials}

        </div>

      </div>



      <CardContent className="flex flex-1 flex-col gap-2.5 p-4">

        <div>

          <h3 className="card-title group-hover:text-primary">

            {laundry.name}

          </h3>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">

            <span className="inline-flex items-center gap-1 font-semibold text-foreground">

              <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />

              {rating.toFixed(1)}

            </span>

            <span className="text-muted-foreground">

              (<ClientLocaleNumber value={laundry.review_count} /> reviews)

            </span>

          </div>

        </div>



        <ul className="space-y-2 text-sm text-muted-foreground">

          <li className="flex items-center gap-2">

            <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />

            <span>

              <span className="font-medium text-foreground">{laundry.distanceKm} km</span> ·{' '}

              {laundry.city}

            </span>

          </li>

          <li className="flex items-center gap-2">

            <Clock className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />

            {deliveryLabel(laundry.deliveryHours)}

          </li>

        </ul>



        <p className="mt-auto pt-1">

          <span className="text-sm text-muted-foreground">Starting </span>

          <span className="text-2xl font-bold text-foreground">₹{laundry.startPrice}</span>

          <span className="text-sm font-medium text-muted-foreground">/kg</span>

        </p>

      </CardContent>



      <CardFooter className="border-t border-border/60 bg-muted/30 p-4 pt-0 sm:p-5">

        <Button asChild className="h-12 w-full rounded-xl text-base font-bold" size="lg">

          <Link

            href={`/discover/${laundry.id}`}

            onMouseEnter={prefetchDetail}

            onFocus={prefetchDetail}

          >

            View shop

          </Link>

        </Button>

      </CardFooter>

    </Card>

  );

}



export const LaundryCard = memo(LaundryCardComponent);

