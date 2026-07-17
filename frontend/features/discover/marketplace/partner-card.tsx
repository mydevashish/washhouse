'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, BadgeCheck, Clock, MapPin, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import {
  comparePriceAriaSummary,
  getComparePriceLines,
} from '@/features/discover/lib/compare-price-lines';
import { getLaundryImage, getPartnerMeta } from '@/features/discover/marketplace/laundry-images';
import type { LaundryListItem } from '@/services/laundries';
import { cn } from '@/lib/utils';

type PartnerCardProps = {
  laundry: LaundryListItem;
  index: number;
};

export function PartnerCard({ laundry, index }: PartnerCardProps) {
  const reduce = useReducedMotion();
  const image = getLaundryImage(laundry.slug, index);
  const { distanceKm, deliveryMin } = getPartnerMeta(laundry.slug);
  const rating = Number(laundry.avg_rating);
  const priceLines = getComparePriceLines(laundry);
  const priceAria = comparePriceAriaSummary(laundry);
  const ariaPrice = priceAria ? `, ${priceAria}` : '';

  return (
    <motion.article
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-bg-0 shadow-soft',
        'motion-safe:transition-shadow motion-safe:hover:border-brand-500/30 motion-safe:hover:shadow-pop',
      )}
      whileHover={reduce ? undefined : { y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/discover/${laundry.id}`}
        className="flex h-full flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
        aria-label={`View ${laundry.name}, rated ${rating.toFixed(1)} stars${ariaPrice}`}
      >
        <div className="relative aspect-[16/10] overflow-hidden bg-bg-2">
          <Image
            src={image}
            alt=""
            fill
            className="object-cover motion-safe:transition-transform motion-safe:duration-300 motion-safe:group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          {laundry.is_verified && (
            <Badge variant="success" className="absolute left-3 top-3 bg-bg-0/95 shadow-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
              Verified
            </Badge>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <h3 className="text-lg font-semibold text-fg-0 group-hover:text-brand-500">{laundry.name}</h3>
          <p className="mt-1 text-sm text-fg-2">{laundry.city}</p>

          <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <div className="flex items-center gap-1.5">
              <dt className="sr-only">Rating</dt>
              <dd className="inline-flex items-center gap-1 font-semibold text-fg-0">
                <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />
                {rating.toFixed(1)}
                <span className="font-normal text-fg-2">({laundry.review_count} reviews)</span>
              </dd>
            </div>
            <div className="flex items-center gap-1.5 text-fg-1">
              <dt className="sr-only">Distance</dt>
              <dd className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                {distanceKm} km
              </dd>
            </div>
            <div className="flex items-center gap-1.5 text-fg-1">
              <dt className="sr-only">Delivery time</dt>
              <dd className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-brand-500" aria-hidden />
                ~{deliveryMin} min
              </dd>
            </div>
          </dl>

          <div className="mt-auto flex items-end justify-between gap-3 pt-5">
            <div className="min-w-0 text-sm">
              {priceLines.length > 0 ? (
                <ul className="space-y-0.5 font-semibold text-success">
                  {priceLines.map((line) => (
                    <li key={line.key}>
                      from {line.amountLabel}
                      {line.unitSuffix ?? ''}{' '}
                      <span className="font-normal text-fg-2">{line.label}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-medium text-fg-2">See prices on store</p>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-brand-500">
              View & book
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
