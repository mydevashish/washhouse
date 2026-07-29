'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { cn } from '@/lib/utils';
import { getContactInfo, trackContactEvent } from '@/services/customer-experience';
import { getLaundry } from '@/services/laundries';
import { useAuthStore } from '@/store/auth.store';

const CONTACT_SOURCE = 'stores_directory';
const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type StoresCardProps = {
  laundry: EnrichedLaundry;
  /** Position in the grid — drives stagger delay (capped). */
  index?: number;
  className?: string;
};

/**
 * Premium marketing directory card — cover photo, trust, place, speed, service peek.
 * Contact info is fetched only when the card enters the viewport (lazy; see useCardInView).
 * Motion: entry stagger, hover lift + image scale, verified/rating nudge — reduced-motion safe.
 */
export function StoresCard({ laundry, index = 0, className }: StoresCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const reduce = useReducedMotion();
  const user = useAuthStore((s) => s.user);
  const { ref: cardRef, inView } = useCardInView<HTMLElement>();
  const [imgFailed, setImgFailed] = useState(false);
  const storeHref = `/discover/${laundry.id}`;
  const loginRedirect = `/login?redirect=${encodeURIComponent(storeHref)}`;
  const rating = Number(laundry.avg_rating);
  const overlayClass = getStoreCardOverlayClass(laundry.slug);
  const fallbackClass = getStoreCardFallbackClass(laundry.slug);

  const prefetchDetail = useCallback(() => {
    void queryClient.prefetchQuery({
      queryKey: queryKeys.laundry(laundry.id),
      queryFn: () => getLaundry(laundry.id),
      staleTime: STALE.laundryDetail,
    });
  }, [queryClient, laundry.id]);

  const contactQ = useQuery({
    queryKey: ['contact-info', laundry.id],
    queryFn: () => getContactInfo(laundry.id),
    staleTime: 60_000,
    enabled: inView,
  });

  const trackM = useMutation({
    mutationFn: (event_type: string) =>
      trackContactEvent(laundry.id, { event_type, source: CONTACT_SOURCE }),
  });

  const c = contactQ.data;
  const showCall = Boolean(c?.show_call);
  const showWhatsApp = Boolean(c?.show_whatsapp);
  const showContactActions = Boolean(c?.contact_available && (showCall || showWhatsApp));

  const requireLogin = () => {
    router.push(loginRedirect);
  };

  const handleCall = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    let phone = c?.phone;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('call_click');
      phone = updated.phone ?? phone;
    }
    if (phone) window.location.href = `tel:${phone}`;
  };

  const handleWhatsApp = async () => {
    if (c?.requires_login) {
      requireLogin();
      return;
    }
    let url = c?.whatsapp_url;
    if (user?.role === 'customer') {
      const updated = await trackM.mutateAsync('whatsapp_click');
      url = updated.whatsapp_url ?? url;
    }
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const placeLine = laundry.distanceIsApproximate
    ? laundry.city
    : `${laundry.distanceKm} km · ${laundry.city}`;

  return (
    <motion.article
      ref={cardRef}
      className={cn(
        'group flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60',
        'transition-[box-shadow,ring-color] duration-200 ease-out',
        'hover:shadow-pop hover:ring-primary/35',
        'focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 focus-within:ring-offset-background',
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
          'relative block aspect-[5/3] overflow-hidden outline-none',
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
              'object-cover transition-transform duration-500 ease-out',
              'motion-safe:group-hover:scale-[1.04]',
              'motion-reduce:transform-none',
            )}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 520px"
            onError={() => setImgFailed(true)}
          />
        ) : null}
        <div className={cn('absolute inset-0', overlayClass)} aria-hidden />

        {laundry.is_verified && (
          <motion.div
            className="absolute left-3 top-3"
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

        <div className="absolute inset-x-0 bottom-0 p-4 pt-10">
          <h3 className="text-lg font-bold tracking-tight text-white text-balance drop-shadow-sm sm:text-xl">
            {laundry.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{placeLine}</span>
          </p>
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
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

        <StoresServicePreview laundry={laundry} />

        <div
          className="mt-auto flex flex-wrap items-center gap-2 border-t border-border/60 pt-3"
          role="group"
          aria-label={`Actions for ${laundry.name}`}
        >
          {showContactActions && showCall && (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="h-11 w-11 shrink-0"
              disabled={trackM.isPending}
              aria-label={
                c?.requires_login
                  ? `Sign in to call ${laundry.name}`
                  : `Call ${laundry.name}`
              }
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
              className="h-11 w-11 shrink-0 border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              disabled={trackM.isPending}
              aria-label={
                c?.requires_login
                  ? `Sign in for WhatsApp with ${laundry.name}`
                  : `WhatsApp ${laundry.name}`
              }
              onClick={() => void handleWhatsApp()}
            >
              <MessageCircle className="h-4 w-4" aria-hidden />
            </Button>
          )}
          <Button type="button" size="sm" className="ml-auto h-11 min-w-[7.5rem] gap-1.5 px-4" asChild>
            <Link
              href={storeHref}
              onMouseEnter={prefetchDetail}
              onFocus={prefetchDetail}
            >
              <Store className="h-3.5 w-3.5" aria-hidden />
              Open store
            </Link>
          </Button>
        </div>
      </div>
    </motion.article>
  );
}
