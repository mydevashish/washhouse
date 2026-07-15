'use client';

import useEmblaCarousel from 'embla-carousel-react';
import type { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';

import { HORIZONTAL_SCROLL_TOUCH_CLASS } from '@/lib/horizontal-scroll-touch';

/** Embla horizontal carousel container classes. */
export const MARKETING_CAROUSEL_CONTAINER_CLASS = `flex ${HORIZONTAL_SCROLL_TOUCH_CLASS}`;

/** Below Tailwind `md` (767px): progressive touch-drag guard when pan-y + autoplay pause are not enough. */
export const MARKETING_CAROUSEL_BELOW_MD_MEDIA_QUERY = '(max-width: 767px)';

/** Vertical movement must exceed horizontal by this factor before Embla drag is suppressed on small viewports. */
export const MARKETING_CAROUSEL_VERTICAL_DRAG_RATIO = 1.5;

export function isPredominantlyVerticalCarouselDrag(deltaX: number, deltaY: number): boolean {
  return Math.abs(deltaY) > Math.abs(deltaX) * MARKETING_CAROUSEL_VERTICAL_DRAG_RATIO;
}

function getBelowMdSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia(MARKETING_CAROUSEL_BELOW_MD_MEDIA_QUERY).matches;
}

function subscribeBelowMd(onStoreChange: () => void): () => void {
  const media = window.matchMedia(MARKETING_CAROUSEL_BELOW_MD_MEDIA_QUERY);
  media.addEventListener('change', onStoreChange);
  return () => media.removeEventListener('change', onStoreChange);
}

/** True when viewport is below Tailwind `md` (768px). */
export function useMarketingCarouselBelowMd(): boolean {
  return useSyncExternalStore(subscribeBelowMd, getBelowMdSnapshot, () => false);
}

function isTouchPointerEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return event.type.startsWith('touch');
}

type MarketingCarouselTouchAngleGuard = {
  bind: (element: HTMLElement) => () => void;
  shouldBlockEmblaDrag: (event: MouseEvent | TouchEvent) => boolean;
};

function createMarketingCarouselTouchAngleGuard(): MarketingCarouselTouchAngleGuard {
  let touchStartX = 0;
  let touchStartY = 0;
  let isTracking = false;
  let blocksTouchDrag = false;

  const reset = () => {
    isTracking = false;
    blocksTouchDrag = false;
  };

  return {
    shouldBlockEmblaDrag(event) {
      return isTouchPointerEvent(event) && blocksTouchDrag;
    },

    bind(element) {
      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) {
          reset();
          return;
        }

        isTracking = true;
        blocksTouchDrag = false;
        touchStartX = event.touches[0]!.clientX;
        touchStartY = event.touches[0]!.clientY;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (!isTracking || event.touches.length !== 1) return;

        const deltaX = event.touches[0]!.clientX - touchStartX;
        const deltaY = event.touches[0]!.clientY - touchStartY;

        if (isPredominantlyVerticalCarouselDrag(deltaX, deltaY)) {
          blocksTouchDrag = true;
          event.stopImmediatePropagation();
        }
      };

      const handleTouchEnd = () => {
        reset();
      };

      const passive: AddEventListenerOptions = { passive: true };
      const capturePassive: AddEventListenerOptions = { capture: true, passive: true };

      element.addEventListener('touchstart', handleTouchStart, passive);
      element.addEventListener('touchmove', handleTouchMove, capturePassive);
      element.addEventListener('touchend', handleTouchEnd, passive);
      element.addEventListener('touchcancel', handleTouchEnd, passive);

      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
        element.removeEventListener('touchcancel', handleTouchEnd);
        reset();
      };
    },
  };
}

/**
 * Pauses carousel autoplay on the first touchmove whose delta is predominantly
 * vertical (|dy| > |dx|), so slide transitions do not fight page scroll.
 * Returns a ref callback — merge with Embla's viewport ref.
 */
export function useMarketingCarouselVerticalScrollPause(onVerticalScrollIntent: () => void) {
  const cleanupRef = useRef<(() => void) | null>(null);

  const bindVerticalScrollPause = useCallback(
    (element: HTMLElement | null) => {
      cleanupRef.current?.();
      cleanupRef.current = null;
      if (!element) return;

      let touchStartX = 0;
      let touchStartY = 0;
      let isTracking = false;
      let hasPausedForGesture = false;

      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length !== 1) {
          isTracking = false;
          return;
        }

        isTracking = true;
        hasPausedForGesture = false;
        touchStartX = event.touches[0]!.clientX;
        touchStartY = event.touches[0]!.clientY;
      };

      const handleTouchMove = (event: TouchEvent) => {
        if (!isTracking || hasPausedForGesture || event.touches.length !== 1) return;

        const deltaX = event.touches[0]!.clientX - touchStartX;
        const deltaY = event.touches[0]!.clientY - touchStartY;

        if (Math.abs(deltaY) > Math.abs(deltaX)) {
          hasPausedForGesture = true;
          onVerticalScrollIntent();
        }
      };

      const endTouch = () => {
        isTracking = false;
      };

      const opts: AddEventListenerOptions = { passive: true };
      element.addEventListener('touchstart', handleTouchStart, opts);
      element.addEventListener('touchmove', handleTouchMove, opts);
      element.addEventListener('touchend', endTouch, opts);
      element.addEventListener('touchcancel', endTouch, opts);

      cleanupRef.current = () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', endTouch);
        element.removeEventListener('touchcancel', endTouch);
      };
    },
    [onVerticalScrollIntent],
  );

  useEffect(() => () => cleanupRef.current?.(), []);

  return bindVerticalScrollPause;
}

function canResumeAutoplayOnHover(): boolean {
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

/** Resume autoplay on mouse leave — skip touch/coarse pointers (no hover). */
export function shouldResumeCarouselAutoplayOnMouseLeave(): boolean {
  return canResumeAutoplayOnHover();
}

function hasScrollableOverflow(element: Element): boolean {
  const { overflow, overflowX, overflowY } = window.getComputedStyle(element);
  const values = [overflow, overflowX, overflowY];
  return values.some((value) => value === 'auto' || value === 'scroll');
}

export function isInsideNativelyScrollableElement(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  let element: Element | null = target;
  while (element) {
    if (element instanceof HTMLTextAreaElement) return true;
    if (element.hasAttribute('data-scroll-lock')) return true;
    if (hasScrollableOverflow(element)) return true;
    element = element.parentElement;
  }

  return false;
}

export function marketingCarouselWatchDrag(
  _emblaApi: EmblaCarouselType,
  event: MouseEvent | TouchEvent,
): boolean {
  return !isInsideNativelyScrollableElement(event.target);
}

function resolveWatchDrag(
  options: EmblaOptionsType | undefined,
  belowMd: boolean,
  touchAngleGuard: MarketingCarouselTouchAngleGuard,
): EmblaOptionsType['watchDrag'] {
  return (emblaApi, event) => {
    if (!marketingCarouselWatchDrag(emblaApi, event)) {
      return false;
    }

    if (belowMd && isTouchPointerEvent(event) && touchAngleGuard.shouldBlockEmblaDrag(event)) {
      return false;
    }

    const userWatchDrag = options?.watchDrag;
    if (userWatchDrag === false) return false;
    if (typeof userWatchDrag === 'function') {
      return userWatchDrag(emblaApi, event);
    }

    return true;
  };
}

export function useMarketingCarousel(options?: EmblaOptionsType) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const belowMd = useMarketingCarouselBelowMd();
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const touchAngleGuardRef = useRef<MarketingCarouselTouchAngleGuard | null>(null);
  if (!touchAngleGuardRef.current) {
    touchAngleGuardRef.current = createMarketingCarouselTouchAngleGuard();
  }
  const touchAngleGuard = touchAngleGuardRef.current;
  const angleGuardCleanupRef = useRef<(() => void) | null>(null);

  const emblaOptions = useMemo<EmblaOptionsType>(
    () => {
      const currentOptions = optionsRef.current;
      return {
        ...currentOptions,
        dragFree: belowMd ? false : currentOptions?.dragFree,
        watchDrag: resolveWatchDrag(currentOptions, belowMd, touchAngleGuard),
      };
    },
    [belowMd, touchAngleGuard],
  );

  const [emblaRefInternal, emblaApi] = useEmblaCarousel(emblaOptions);

  const emblaRef = useCallback(
    (node: HTMLDivElement | null) => {
      angleGuardCleanupRef.current?.();
      angleGuardCleanupRef.current = null;
      emblaRefInternal(node);
      if (node && belowMd) {
        angleGuardCleanupRef.current = touchAngleGuard.bind(node);
      }
    },
    [belowMd, emblaRefInternal, touchAngleGuard],
  );

  useEffect(() => () => angleGuardCleanupRef.current?.(), []);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.reInit(emblaOptions);
  }, [emblaApi, emblaOptions]);

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi],
  );

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    onSelect();
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi, onSelect]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const root = rootRef.current;
      if (!root?.contains(document.activeElement)) return;

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollNext, scrollPrev],
  );

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    rootRef,
    emblaRef,
    emblaApi,
    selectedIndex,
    scrollPrev,
    scrollNext,
    scrollTo,
    belowMd,
  };
}
