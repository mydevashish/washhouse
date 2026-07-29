'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ChevronRight, MessageCircle, Phone, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { getStoreCardFallbackClass } from '@/features/marketing/stores/stores-card-visual';
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
  className?: string;
};

/**
 * Dense secondary store row for the quick-pick sheet.
 * Primary hit target opens the store; Call / WhatsApp stay icon-only.
 */
export function QuickPickCompactRow({
  laundry,
  index = 0,
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
  });

  const showDistance = !laundry.distanceIsApproximate;
  const ratingLabel =
    Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null;

  return (
    <motion.li
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border/80 bg-card p-2 pr-1.5',
        className,
      )}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduce ? 0 : 0.22,
        delay: reduce ? 0 : 0.04 * (index + 1),
        ease: EASE_OUT,
      }}
    >
      <Link
        href={storeHref}
        className={cn(
          'flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none',
          'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          'active:scale-[0.99] motion-reduce:active:scale-100',
        )}
        aria-label={`Open ${laundry.name}`}
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
              className="object-cover"
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
        <ChevronRight
          className="h-4 w-4 shrink-0 text-muted-foreground"
          aria-hidden
        />
      </Link>

      {(showContactActions && (showCall || showWhatsApp)) && (
        <div
          className="flex shrink-0 items-center gap-1"
          role="group"
          aria-label={`Contact ${laundry.name}`}
        >
          {showCall && (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-11 w-11 shrink-0"
              disabled={isPending}
              aria-label={callAriaLabel}
              onClick={() => void handleCall()}
            >
              <Phone className="h-4 w-4" aria-hidden />
            </Button>
          )}
          {showWhatsApp && (
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
      )}
    </motion.li>
  );
}
