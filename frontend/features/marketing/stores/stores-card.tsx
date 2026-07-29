'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Clock, MapPin, MessageCircle, Phone, Star, Store } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClientLocaleNumber } from '@/components/ui/client-locale-number';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { deliveryLabel } from '@/features/discover/lib/laundry-meta';
import {
  getStoreCardFallbackClass,
  getStoreCardOverlayClass,
  storeCardStaggerDelay,
} from '@/features/marketing/stores/stores-card-visual';
import { StoresServicePreview } from '@/features/marketing/stores/stores-service-preview';
import { useCardInView } from '@/features/marketing/stores/use-card-in-view';
import { StoreDistanceBadge } from '@/features/marketing/stores/store-distance-badge';
import {
  STORE_WHATSAPP_OUTLINE_CLASS,
  useStoreContactActions,
} from '@/features/marketing/stores/use-store-contact-actions';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { getLaundry } from '@/services/laundries';

const CONTACT_SOURCE = 'stores_directory' as const;
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type StoresCardProps = {
  laundry: EnrichedLaundry;
  /** Position in the grid — drives stagger delay (capped). */
  index?: number;
  /** Featured density for nearest #1 on /stores. */
  variant?: 'default' | 'featured';
  className?: string;
};

/**
 * Premium marketing directory card — cover photo, trust, place, speed, service peek.
 * Contact info is fetched only when the card enters the viewport (lazy; see useCardInView).
 * Motion: entry stagger, hover lift + cover parallax (md+), verified/rating nudge — reduced-motion safe.
 */
export function StoresCard({
  laundry,
  index = 0,
  variant = 'default',
  className,
}: StoresCardProps) {
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const { ref: cardRef, inView } = useCardInView<HTMLElement>();
  const [imgFailed, setImgFailed] = useState(false);
  const rating = Number(laundry.avg_rating);
  const overlayClass = getStoreCardOverlayClass(laundry.slug);
  const fallbackClass = getStoreCardFallbackClass(laundry.slug);
  const isFeatured = variant === 'featured';

  const prefetchDetail = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.laundry(laundry.id),
      queryFn: () => getLaundry(laundry.id),
      staleTime: STALE.laundryDetail,
    });
  }, [queryClient, laundry.id]);

  const {
    storeHref,
    showCall,
    showWhatsApp,
    showContactActions,
    isPending,
    callAriaLabel,
    whatsappAriaLabel,
    handleCall,
    handleWhatsApp,
  } = useStoreContactActions({
    laundryId: laundry.id,
    laundryName: laundry.name,
    source: CONTACT_SOURCE,
    enabled: inView,
  });

  const showDistance = !laundry.distanceIsApproximate;

  return (
    <motion.article
      ref={cardRef}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60',
        'transition-[box-shadow,ring-color] duration-200 ease-out',
        'hover:shadow-pop hover:ring-primary/35',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
        isFeatured && 'ring-primary/25',
        className,
      )}
      aria-label={`${laundry.name}, ${laundry.city}`}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduce ? undefined : { y: -3 }}
      transition={{
        duration: reduce ? 0 : 0.28,
        delay: reduce ? 0 : storeCardStaggerDelay(index),
        ease: EASE_OUT,
      }}
    >
      <Link
        href={storeHref}
        className={cn(
          'relative block overflow-hidden outline-none',
          isFeatured ? 'aspect-[4/3] md:aspect-[21/9]' : 'aspect-[5/3]',
          fallbackClass,
        )}
        onMouseEnter={prefetchDetail}
        onFocus={prefetchDetail}
        aria-label={`Open ${laundry.name}`}
      >
        {!imgFailed ? (
          <Image
            src={laundry.image}
            alt=""
            fill
            className={cn(
              'object-cover transition-transform duration-500 ease-out will-change-transform',
              // Phone: light scale. md+: subtle cover parallax on hover/focus-within.
              'motion-safe:group-hover:scale-[1.04]',
              'motion-safe:md:group-hover:scale-[1.07] motion-safe:md:group-hover:-translate-y-1',
              'motion-safe:md:group-focus-within:scale-[1.07] motion-safe:md:group-focus-within:-translate-y-1',
              'motion-reduce:transform-none motion-reduce:transition-none',
            )}
            sizes={
              isFeatured
                ? '(max-width: 768px) 100vw, (max-width: 1280px) 100vw, 1024px'
                : '(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 520px'
            }
            onError={() => setImgFailed(true)}
            {...(isFeatured ? { priority: true } : {})}
          />
        ) : null}
        <div className={cn('absolute inset-0', overlayClass)} aria-hidden />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {isFeatured && (
            <Badge className="border-0 bg-primary text-primary-foreground shadow-md">
              Closest to you
            </Badge>
          )}
          {laundry.is_verified && (
            <motion.div
              initial={reduce ? false : { opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: reduce ? 0 : storeCardStaggerDelay(index) + 0.12,
                duration: reduce ? 0 : 0.22,
                ease: EASE_OUT,
              }}
            >
              <Badge className="border-0 bg-card/95 text-foreground shadow-md backdrop-blur">
                <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden />
                Verified
              </Badge>
            </motion.div>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 pt-10 sm:p-4">
          <h3 className="text-lg font-bold tracking-tight text-white text-balance drop-shadow-sm sm:text-xl">
            {laundry.name}
          </h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-sm text-white/90">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">
              {showDistance ? (
                <>
                  <StoreDistanceBadge distanceKm={laundry.distanceKm} />
                  <span aria-hidden> · </span>
                  {laundry.city}
                </>
              ) : (
                laundry.city
              )}
            </span>
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
          <motion.span
            className="inline-flex items-center gap-1 font-semibold text-foreground"
            initial={reduce ? false : { opacity: 0.6 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reduce ? 0 : storeCardStaggerDelay(index) + 0.16,
              duration: reduce ? 0 : 0.2,
            }}
          >
            <Star
              className={cn(
                'h-3.5 w-3.5 fill-rating text-rating',
                !reduce && 'motion-safe:transition-transform motion-safe:duration-150',
                !reduce && 'motion-safe:group-hover:scale-110',
              )}
              aria-hidden
            />
            {Number.isFinite(rating) ? rating.toFixed(1) : '—'}
          </motion.span>
          <span className="text-muted-foreground">
            <ClientLocaleNumber value={laundry.review_count} /> reviews
          </span>
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden />
            {deliveryLabel(laundry.deliveryHours)}
          </span>
        </div>

        <StoresServicePreview laundry={laundry} className="min-h-[1.75rem]" />

        {/* Match quick-pick: Open store primary + icon-only contact; never wrap on 360px */}
        <div
          className="mt-auto flex flex-nowrap items-center gap-2 border-t border-border/60 pt-3"
          role="group"
          aria-label={`Actions for ${laundry.name}`}
        >
          <Button
            type="button"
            size="sm"
            className="h-11 min-h-11 min-w-0 flex-1 gap-1.5 px-3 active:scale-[0.98] motion-reduce:active:scale-100"
            asChild
          >
            <Link
              href={storeHref}
              onMouseEnter={prefetchDetail}
              onFocus={prefetchDetail}
            >
              <Store className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Open store</span>
            </Link>
          </Button>
          {showContactActions && showCall && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0"
              disabled={isPending}
              aria-label={callAriaLabel}
              onClick={() => void handleCall()}
            >
              <Phone className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {showContactActions && showWhatsApp && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className={cn('h-11 w-11 shrink-0', STORE_WHATSAPP_OUTLINE_CLASS)}
              disabled={isPending}
              aria-label={whatsappAriaLabel}
              onClick={() => void handleWhatsApp()}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
