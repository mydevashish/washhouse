'use client';

import Image from 'next/image';
import { useState, type MouseEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageCircle, Navigation, Phone, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { getStoreCardFallbackClass } from '@/features/marketing/stores/stores-card-visual';
import { StoreNavSurface } from '@/features/marketing/stores/store-nav-surface';
import { StoreDistanceBadge } from '@/features/marketing/stores/store-distance-badge';
import {
  STORE_WHATSAPP_OUTLINE_CLASS,
  useStoreContactActions,
} from '@/features/marketing/stores/use-store-contact-actions';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const CONTACT_SOURCE = 'stores_quick_pick' as const;

type QuickPickCompactRowProps = {
  laundry: EnrichedLaundry;
  /** Stagger index among secondary rows (0-based). */
  index?: number;
  /** Called when the thumb/name link navigates (e.g. close the quick-pick drawer). */
  onNavigate?: () => void;
  className?: string;
};

/**
 * Dense secondary store row for the quick-pick sheet.
 * Thumb + name link to the storefront on `lg+` only (temp gate — see StoreNavSurface);
 * Call / Message / Get Location stay separate.
 */
export function QuickPickCompactRow({
  laundry,
  index = 0,
  onNavigate,
  className,
}: QuickPickCompactRowProps) {
  const reduce = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const rating = Number(laundry.avg_rating);
  const fallbackClass = getStoreCardFallbackClass(laundry.slug);

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
  });

  const showDistance = !laundry.distanceIsApproximate;
  const ratingLabel =
    Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null;

  const stopAnd =
    (action: () => void | Promise<void>) => (e: MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      void action();
    };

  return (
    <motion.li
      className={cn(
        'flex flex-col gap-2 rounded-xl border border-border/80 bg-card p-2.5',
        className,
      )}
      aria-label={`${laundry.name}, ${laundry.city}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.22,
        delay: reduce ? 0 : 0.04 * (index + 1),
        ease: EASE_OUT,
      }}
    >
      <StoreNavSurface
        href={storeHref}
        onClick={onNavigate}
        ariaLabel={`Open ${laundry.name}`}
        className="flex min-w-0 items-center gap-3 rounded-lg"
      >
        <span
          className={cn(
            'relative h-12 w-12 shrink-0 overflow-hidden rounded-lg sm:h-14 sm:w-14',
            fallbackClass,
          )}
        >
          {!imgFailed ? (
            <Image
              src={laundry.image}
              alt=""
              fill
              className={cn(
                'object-cover',
                'motion-safe:transition-transform motion-safe:duration-300',
                'motion-reduce:transform-none motion-reduce:transition-none',
              )}
              sizes="56px"
              onError={() => setImgFailed(true)}
            />
          ) : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-foreground">
            {laundry.name}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            {ratingLabel && (
              <Star className="h-3 w-3 shrink-0 fill-rating text-rating" aria-hidden />
            )}
            <span className="truncate">
              {ratingLabel && (
                <>
                  {ratingLabel}
                  <span aria-hidden> · </span>
                </>
              )}
              {laundry.city}
              {showDistance && (
                <>
                  <span aria-hidden> · </span>
                  <StoreDistanceBadge distanceKm={laundry.distanceKm} />
                </>
              )}
            </span>
          </span>
        </span>
      </StoreNavSurface>

      {showContactActions ? (
        <div
          className="flex flex-wrap gap-2"
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
      ) : null}
    </motion.li>
  );
}
