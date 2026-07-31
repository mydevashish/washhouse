'use client';

import Image from 'next/image';
import { useState, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, MapPin, MessageCircle, Navigation, Phone } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import {
  getStoreCardFallbackClass,
  getStoreCardOverlayClass,
  storeCardStaggerDelay,
} from '@/features/marketing/stores/stores-card-visual';
import { StoreNavSurface } from '@/features/marketing/stores/store-nav-surface';
import { useCardInView } from '@/features/marketing/stores/use-card-in-view';
import { StoreDistanceBadge } from '@/features/marketing/stores/store-distance-badge';
import {
  STORE_WHATSAPP_OUTLINE_CLASS,
  useStoreContactActions,
} from '@/features/marketing/stores/use-store-contact-actions';
import { cn } from '@/lib/utils';

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
 * Marketing directory card — cover, name, location, Call / Message / Get Location.
 * Cover + name link to the storefront on `lg+` only (temp gate — see StoreNavSurface);
 * contact info is fetched only when the card enters the viewport (lazy; see useCardInView).
 * Contact buttons stay separate.
 */
export function StoresCard({
  laundry,
  index = 0,
  variant = 'default',
  className,
}: StoresCardProps) {
  const reduce = useReducedMotion();
  const { ref: cardRef, inView } = useCardInView<HTMLElement>();
  const [imgFailed, setImgFailed] = useState(false);
  const overlayClass = getStoreCardOverlayClass(laundry.slug);
  const fallbackClass = getStoreCardFallbackClass(laundry.slug);
  const isFeatured = variant === 'featured';

  const {
    storeHref,
    showCall,
    showWhatsApp,
    showDirections,
    showContactActions,
    isPending,
    callAriaLabel,
    whatsappAriaLabel,
    directionsAriaLabel,
    handleCall,
    handleWhatsApp,
    handleGetLocation,
  } = useStoreContactActions({
    laundryId: laundry.id,
    laundryName: laundry.name,
    source: CONTACT_SOURCE,
    enabled: inView,
  });

  const showDistance = !laundry.distanceIsApproximate;

  const stopAnd =
    (action: () => void | Promise<void>) => (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      void action();
    };

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
      <StoreNavSurface
        href={storeHref}
        ariaLabel={`Open ${laundry.name}`}
        className={cn(
          'relative overflow-hidden',
          'block',
          isFeatured ? 'aspect-[4/3] md:aspect-[21/9]' : 'aspect-[5/3]',
          fallbackClass,
        )}
      >
        {!imgFailed ? (
          <Image
            src={laundry.image}
            alt=""
            fill
            className={cn(
              'object-cover transition-transform duration-500 ease-out will-change-transform',
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
      </StoreNavSurface>

      {showContactActions ? (
        <div className="mt-auto flex flex-1 flex-col justify-end p-3 sm:p-4">
          <div
            className="flex flex-wrap gap-2 border-t border-border/60 pt-3"
            role="group"
            aria-label={`Actions for ${laundry.name}`}
          >
            {showCall && (
              <Button
                type="button"
                size="sm"
                className="h-11 min-h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] gap-1.5 px-2.5 active:scale-[0.98] motion-reduce:active:scale-100"
                disabled={isPending}
                aria-label={callAriaLabel}
                onClick={stopAnd(handleCall)}
              >
                <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">Call Store</span>
              </Button>
            )}
            {showWhatsApp && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={cn(
                  'h-11 min-h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] gap-1.5 px-2.5 active:scale-[0.98] motion-reduce:active:scale-100',
                  STORE_WHATSAPP_OUTLINE_CLASS,
                )}
                disabled={isPending}
                aria-label={whatsappAriaLabel}
                onClick={stopAnd(handleWhatsApp)}
              >
                <MessageCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">Message Store</span>
              </Button>
            )}
            {showDirections && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-11 min-h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] gap-1.5 px-2.5 active:scale-[0.98] motion-reduce:active:scale-100"
                disabled={isPending}
                aria-label={directionsAriaLabel}
                onClick={stopAnd(handleGetLocation)}
              >
                <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">Get Location</span>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-auto min-h-3 sm:min-h-4" aria-hidden />
      )}
    </motion.article>
  );
}
