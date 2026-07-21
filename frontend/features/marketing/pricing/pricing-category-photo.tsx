'use client';

import { useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, useState, type CSSProperties } from 'react';

import type { CatalogCategory } from '@/features/laundry-price-list/types';
import { PricingCategoryMood } from '@/features/marketing/pricing/pricing-category-mood';
import { PRICING_CATEGORY_PHOTO_SIZES } from '@/features/marketing/pricing/lib/prefetch-pricing-product-image';
import {
  getPricingCategoryImage,
  type PricingCategoryImage,
} from '@/features/marketing/pricing/pricing-category-images';
import { useAtelierProductSway } from '@/features/marketing/pricing/use-atelier-product-sway';
import { cn } from '@/lib/utils';

type PricingCategoryPhotoProps = {
  category: CatalogCategory;
  /** Active product frame — when set, crossfades as the rack scrolls. */
  image?: PricingCategoryImage;
  /** Product name for the soft atelier plate under the frame (optional). */
  productLabel?: string;
  /** Eager-load the first in-view category; others lazy. */
  priority?: boolean;
  /**
   * Soft CSS/SVG mood loop on the photo edge (motion path only).
   * Off for reduced-motion static guide — photo alone is the fallback.
   */
  mood?: boolean;
  /** Soft hang sway (atelier-tag-sway). Off for reduced-motion static guide. */
  sway?: boolean;
  className?: string;
};

/** Desktop crossfade; mobile CSS shortens to ~280ms — keep timer in sync. */
const CROSSFADE_MS_DESKTOP = 420;
const CROSSFADE_MS_MOBILE = 280;

function crossfadeMs(): number {
  if (typeof window === 'undefined') return CROSSFADE_MS_DESKTOP;
  return window.matchMedia('(max-width: 767px)').matches
    ? CROSSFADE_MS_MOBILE
    : CROSSFADE_MS_DESKTOP;
}

/**
 * Editorial category / product photo for the price-guide rate card.
 * Fixed 4/3 aspect at every breakpoint so category racks share one photo height
 * (no CLS, no md→lg aspect flip). White-canvas catalog tiles use object-contain.
 * When `image` changes with the settled tag, a dual-buffer crossfade runs
 * (opacity + scale only). Soft hang sway reuses atelier-tag-sway on a parent
 * layer so it never fights the crossfade. Reduced-motion swaps instantly.
 * Never more than two layers — rapid scroll cannot stack fades.
 */
export function PricingCategoryPhoto({
  category,
  image,
  productLabel,
  priority = false,
  mood = true,
  sway = true,
  className,
}: PricingCategoryPhotoProps) {
  const reduce = useReducedMotion();
  const { ref: swayRef, swayOn } = useAtelierProductSway<HTMLDivElement>();
  const fallback = getPricingCategoryImage(category);
  const target = image ?? fallback;

  const [front, setFront] = useState(target);
  const [back, setBack] = useState<PricingCategoryImage | null>(null);
  const [backKey, setBackKey] = useState(0);
  /** Front is at rest (visible) or waiting to enter. */
  const [frontVisible, setFrontVisible] = useState(true);
  const [animating, setAnimating] = useState(false);
  const [plateLabel, setPlateLabel] = useState(productLabel ?? '');

  const frontRef = useRef(front);
  /** Last fully settled frame — used as crossfade “from” so rapid scroll never blanks. */
  const settledRef = useRef(target);
  const frontSrcRef = useRef(target.src);
  const pendingSrcRef = useRef<string | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);

  frontRef.current = front;

  useEffect(() => {
    if (productLabel) setPlateLabel(productLabel);
  }, [productLabel]);

  useEffect(() => {
    if (target.src === frontSrcRef.current) {
      setFront(target);
      settledRef.current = target;
      return;
    }

    if (clearTimerRef.current) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
    startedRef.current = false;

    if (reduce) {
      frontSrcRef.current = target.src;
      pendingSrcRef.current = null;
      settledRef.current = target;
      setFront(target);
      setBack(null);
      setFrontVisible(true);
      setAnimating(false);
      return;
    }

    // Dual-buffer from the last settled frame (not an unloaded pending front).
    setBack(settledRef.current);
    setBackKey((k) => k + 1);
    frontSrcRef.current = target.src;
    pendingSrcRef.current = target.src;
    setFront(target);
    setFrontVisible(false);
    setAnimating(false);
  }, [target, reduce]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    };
  }, []);

  const beginCrossfade = () => {
    if (startedRef.current) return;
    if (pendingSrcRef.current !== front.src) return;
    startedRef.current = true;
    pendingSrcRef.current = null;

    // Paint opacity:0 / scale before enabling transitions.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimating(true);
        setFrontVisible(true);
        clearTimerRef.current = setTimeout(() => {
          settledRef.current = frontRef.current;
          setBack(null);
          setAnimating(false);
          clearTimerRef.current = null;
        }, crossfadeMs());
      });
    });
  };

  // Cached images may skip onLoadingComplete; don't leave the frame blank.
  useEffect(() => {
    if (reduce || frontVisible || pendingSrcRef.current !== front.src) return;
    const fallbackTimer = window.setTimeout(() => {
      beginCrossfade();
    }, 120);
    return () => window.clearTimeout(fallbackTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- start when front src waits to enter
  }, [front.src, frontVisible, reduce]);

  const enableSway = Boolean(sway && !reduce && swayOn);
  const swayPhaseAlt = category === 'women' || category === 'kids' || category === 'household';

  return (
    <figure
      className={cn('pricing-category-photo-sync', className)}
      data-synced={image ? 'on' : 'off'}
    >
      <div
        ref={swayRef}
        className={cn(
          'pricing-category-photo relative w-full overflow-hidden',
          'aspect-[4/3]',
        )}
      >
        <div
          className="pricing-category-photo__sway"
          data-sway={enableSway ? 'on' : 'off'}
          data-phase={swayPhaseAlt ? 'alt' : 'main'}
          style={
            {
              '--tag-sway-amp': '0.65deg',
              animationDelay: enableSway ? '-1.1s' : undefined,
            } as CSSProperties
          }
        >
          {back ? (
            <div
              key={`back-${backKey}-${back.src}`}
              className="pricing-category-photo__layer pricing-category-photo__layer--back absolute inset-0"
              data-animating={animating ? 'true' : 'false'}
              data-fading={animating ? 'true' : 'false'}
              aria-hidden
            >
              <Image
                src={back.src}
                alt=""
                fill
                decoding="async"
                className="object-contain"
                sizes={PRICING_CATEGORY_PHOTO_SIZES}
              />
            </div>
          ) : null}

          <div
            className="pricing-category-photo__layer pricing-category-photo__layer--front absolute inset-0"
            data-visible={frontVisible ? 'true' : 'false'}
            data-animating={animating ? 'true' : 'false'}
            data-reduce={reduce ? 'true' : 'false'}
          >
            <Image
              key={front.src}
              src={front.src}
              alt={front.alt}
              fill
              priority={priority}
              loading={priority ? undefined : 'lazy'}
              decoding="async"
              fetchPriority={priority ? 'high' : 'auto'}
              className="object-contain"
              sizes={PRICING_CATEGORY_PHOTO_SIZES}
              onLoadingComplete={beginCrossfade}
              onError={beginCrossfade}
            />
          </div>
        </div>

        {mood ? <PricingCategoryMood category={category} /> : null}
      </div>

      {plateLabel ? (
        <figcaption className="pricing-category-photo__plate" aria-live="polite">
          <span className="pricing-category-photo__plate-mark" aria-hidden />
          <span
            key={plateLabel}
            className="pricing-category-photo__plate-name"
            title={plateLabel}
          >
            {plateLabel}
          </span>
        </figcaption>
      ) : null}
    </figure>
  );
}
