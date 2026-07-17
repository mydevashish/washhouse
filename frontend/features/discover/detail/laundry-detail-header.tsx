'use client';

import Image from 'next/image';
import { BadgeCheck, Clock, MapPin, ShieldCheck, Star, Truck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ClientLocaleNumber } from '@/components/ui/client-locale-number';
import { getLaundryInitials } from '@/features/discover/detail/service-icons';
import { deliveryLabel } from '@/features/discover/lib/laundry-meta';
import type { LaundryDetail } from '@/services/laundries';
import type { LaundryMeta } from '@/features/discover/lib/laundry-meta';

type LaundryDetailHeaderProps = {
  laundry: LaundryDetail;
  coverImage: string;
  meta: Pick<LaundryMeta, 'distanceKm' | 'deliveryHours'>;
  startPrice: number;
};

export function LaundryDetailHeader({
  laundry,
  coverImage,
  meta,
  startPrice,
}: LaundryDetailHeaderProps) {
  const rating = Number(laundry.avg_rating);
  const initials = getLaundryInitials(laundry.name);

  return (
    <header className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="relative aspect-[5/3] max-h-[220px] w-full bg-muted sm:aspect-[21/9] sm:max-h-[260px]">
        <Image
          src={coverImage}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 1280px"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
          aria-hidden
        />
      </div>

      <div className="relative bg-card px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        <div className="-mt-12 flex items-start gap-3 sm:-mt-14 sm:gap-4">
          <div
            className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border-4 border-card bg-primary text-xl font-bold text-primary-foreground shadow-soft sm:h-[5.5rem] sm:w-[5.5rem]"
            aria-hidden
          >
            {initials}
          </div>

          <div className="min-w-0 flex-1 space-y-3 pt-1 sm:pt-2">
            <div className="flex flex-wrap items-center gap-2">
              {laundry.is_verified && (
                <Badge className="border-0 bg-success-muted text-foreground">
                  <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                  Verified
                </Badge>
              )}
              <Badge variant="success">
                <Truck className="h-3.5 w-3.5" aria-hidden />
                Free pickup
              </Badge>
            </div>

            <div>
              <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {laundry.name}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground sm:text-base">
                <MapPin className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                {laundry.city} · {meta.distanceKm} km away
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="rating-pill">
                <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />
                {rating.toFixed(1)} · <ClientLocaleNumber value={laundry.review_count} /> reviews
              </span>
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0 text-success" aria-hidden />
                Quality checked
              </span>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-muted/30 sm:grid-cols-4">
          <StatCell label="Rating" value={`${rating.toFixed(1)} ★`} highlight />
          <StatCell label="Reviews" value={<ClientLocaleNumber value={laundry.review_count} />} />
          <StatCell
            label="Delivery"
            value={
              <span className="inline-flex items-center justify-center gap-1.5">
                <Clock className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />
                {deliveryLabel(meta.deliveryHours)}
              </span>
            }
          />
          <StatCell
            label="Starts at"
            value={
              <span className="inline-flex items-baseline justify-center gap-0.5">
                <span className="font-semibold text-primary">₹{startPrice}</span>
                <span className="text-xs font-normal text-muted-foreground">/kg</span>
              </span>
            }
          />
        </dl>
      </div>
    </header>
  );
}

function StatCell({
  label,
  value,
  highlight,
}: {
  label: string;
  value: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`px-3 py-4 text-center sm:px-4 sm:py-5 ${highlight ? 'bg-primary/5' : 'bg-card'}`}
    >
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground sm:text-xs">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-semibold tabular-nums text-foreground sm:text-base">
        {value}
      </dd>
    </div>
  );
}
