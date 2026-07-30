'use client';

import Image from 'next/image';
import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { BadgeCheck, MessageCircle, Navigation, Phone, Star } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { EnrichedLaundry } from '@/features/discover/lib/laundry-meta';
import { resolveStartPrice } from '@/features/discover/lib/laundry-meta';
import {
  getStoreCardFallbackClass,
  getStoreCardOverlayClass,
} from '@/features/marketing/stores/stores-card-visual';
import { StoreDistanceBadge } from '@/features/marketing/stores/store-distance-badge';
import {
  STORE_WHATSAPP_OUTLINE_CLASS,
  useStoreContactActions,
} from '@/features/marketing/stores/use-store-contact-actions';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;
const CONTACT_SOURCE = 'stores_quick_pick' as const;

type QuickPickSpotlightProps = {
  laundry: EnrichedLaundry;
  className?: string;
};

function formatFromPrice(laundry: EnrichedLaundry): string | null {
  const price = laundry.startPrice ?? resolveStartPrice(laundry);
  if (price == null) return null;
  return `From ₹${Math.round(price)}`;
}

/**
 * Primary store card in the quick-pick sheet — cover, trust, Call / Message / Get Location.
 * Name, image, and location are display-only; only contact actions navigate or open apps.
 */
export function QuickPickSpotlight({ laundry, className }: QuickPickSpotlightProps) {
  const reduce = useReducedMotion();
  const [imgFailed, setImgFailed] = useState(false);
  const rating = Number(laundry.avg_rating);
  const fromPrice = formatFromPrice(laundry);
  const overlayClass = getStoreCardOverlayClass(laundry.slug);
  const fallbackClass = getStoreCardFallbackClass(laundry.slug);

  const {
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

  return (
    <motion.article
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60',
        className,
      )}
      aria-label={`${laundry.name}, ${laundry.city}`}
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}
    >
      <div
        className={cn(
          'relative aspect-[16/9] max-h-[40vh] overflow-hidden md:aspect-[4/3] md:max-h-[36vh]',
          fallbackClass,
        )}
      >
        {!imgFailed ? (
          <Image
            src={laundry.image}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 420px"
            onError={() => setImgFailed(true)}
            priority
          />
        ) : null}
        <div className={cn('absolute inset-0', overlayClass)} aria-hidden />

        <div className="absolute left-3 top-3 flex flex-wrap items-center gap-2">
          {laundry.is_verified && (
            <Badge className="border-0 bg-card/95 text-foreground shadow-md backdrop-blur">
              <BadgeCheck className="h-3.5 w-3.5 text-success" aria-hidden />
              Verified
            </Badge>
          )}
          {Number.isFinite(rating) && rating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-sm font-semibold text-foreground shadow-md backdrop-blur">
              <Star className="h-3.5 w-3.5 fill-rating text-rating" aria-hidden />
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="absolute inset-x-0 bottom-0 p-3 pt-8 sm:p-4">
          <h3 className="text-lg font-bold tracking-tight text-white text-balance drop-shadow-sm sm:text-xl">
            {laundry.name}
          </h3>
          <p className="mt-0.5 truncate text-sm text-white/90">
            {showDistance ? (
              <>
                {laundry.city}
                <span aria-hidden> · </span>
                <StoreDistanceBadge distanceKm={laundry.distanceKm} />
              </>
            ) : (
              laundry.city
            )}
          </p>
          {fromPrice && (
            <p className="mt-0.5 text-sm tabular-nums text-white/85">{fromPrice}</p>
          )}
        </div>
      </div>

      {showContactActions ? (
        <div
          className="flex flex-wrap gap-2 p-3 sm:p-4"
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
              onClick={() => void handleCall()}
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
              onClick={() => void handleWhatsApp()}
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
              onClick={() => void handleGetLocation()}
            >
              <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="truncate">Get Location</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="min-h-3 sm:min-h-4" aria-hidden />
      )}
    </motion.article>
  );
}
