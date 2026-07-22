'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

type UseActiveRackItemOptions = {
  /** Horizontal tag scroller. */
  scrollerRef: RefObject<HTMLElement | null>;
  itemCount: number;
  /**
   * Focus line inside the scroller (0–1). Tags closest to this x-ratio win.
   * ~0.28 keeps the left-of-center “atelier spotlight” feel from the rack mock.
   */
  focusRatio?: number;
  /**
   * Idle ms after the last scroll tick before photo/plate may change.
   * Keeps crossfades off the fling path on low-end Android.
   */
  settleMs?: number;
};

export type ActiveRackItemState = {
  /** Live spotlight under the focus line (tags). */
  activeIndex: number;
  /** Settled index for photo + plate (updates after scroll idle / scrollend). */
  photoIndex: number;
  /** True while the scroller is being flicked/dragged. */
  isScrolling: boolean;
};

/**
 * Tracks which hanging price tag is under the rack spotlight while scrolling.
 * Also listens for keyboard focus so tabbing a tag syncs the photo.
 *
 * Spotlight updates every frame; photo index settles after scroll idle so
 * product crossfades do not thrash mid-fling.
 */
export function useActiveRackItem({
  scrollerRef,
  itemCount,
  focusRatio = 0.28,
  settleMs = 90,
}: UseActiveRackItemOptions): ActiveRackItemState {
  const [activeIndex, setActiveIndex] = useState(0);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const activeRef = useRef(0);
  const photoRef = useRef(0);
  const settleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollIdleRef = useRef(false);

  const clampIndex = useCallback(
    (index: number) => Math.min(Math.max(0, index), Math.max(0, itemCount - 1)),
    [itemCount],
  );

  const commitPhoto = useCallback(
    (index: number) => {
      const next = clampIndex(index);
      if (photoRef.current === next) return;
      photoRef.current = next;
      setPhotoIndex(next);
    },
    [clampIndex],
  );

  const schedulePhotoSettle = useCallback(() => {
    if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
    settleTimerRef.current = setTimeout(() => {
      settleTimerRef.current = null;
      scrollIdleRef.current = false;
      setIsScrolling(false);
      commitPhoto(activeRef.current);
    }, settleMs);
  }, [commitPhoto, settleMs]);

  const measure = useCallback(() => {
    const root = scrollerRef.current;
    if (!root || itemCount <= 0) {
      activeRef.current = 0;
      setActiveIndex(0);
      commitPhoto(0);
      return;
    }

    const items = root.querySelectorAll<HTMLElement>('[data-rack-item]');
    if (items.length === 0) {
      activeRef.current = 0;
      setActiveIndex(0);
      commitPhoto(0);
      return;
    }

    // Prefer layout offsets over getBoundingClientRect — fewer forced layouts
    // while the compositor is still settling a touch fling.
    const focusX = root.scrollLeft + root.clientWidth * focusRatio;

    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < items.length; index += 1) {
      const el = items[index];
      if (!el) continue;
      const centerX = el.offsetLeft + el.offsetWidth / 2;
      const distance = Math.abs(centerX - focusX);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    const maxScrollLeft = root.scrollWidth - root.clientWidth;

    if (root.scrollLeft >= maxScrollLeft - 2) {
      bestIndex = items.length - 1;
    }

    const next = clampIndex(bestIndex);

    if (activeRef.current !== next) {
      activeRef.current = next;
      setActiveIndex(next);
    }
  }, [scrollerRef, itemCount, focusRatio, clampIndex, commitPhoto]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root || itemCount <= 0) return;

    measure();
    commitPhoto(activeRef.current);

    let frame = 0;
    const onScroll = () => {
      if (!scrollIdleRef.current) {
        scrollIdleRef.current = true;
        setIsScrolling(true);
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        measure();
        schedulePhotoSettle();
      });
    };

    const onLayout = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        measure();
        commitPhoto(activeRef.current);
      });
    };

    const onScrollEnd = () => {
      if (settleTimerRef.current) {
        clearTimeout(settleTimerRef.current);
        settleTimerRef.current = null;
      }
      scrollIdleRef.current = false;
      setIsScrolling(false);
      measure();
      commitPhoto(activeRef.current);
    };

    const onFocusIn = (event: FocusEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;
      const item = target.closest<HTMLElement>('[data-rack-item]');
      if (!item || !root.contains(item)) return;
      const index = Number(item.dataset.rackItem);
      if (!Number.isFinite(index)) return;
      const next = clampIndex(index);
      activeRef.current = next;
      setActiveIndex(next);
      commitPhoto(next);
      setIsScrolling(false);
    };

    root.addEventListener('scroll', onScroll, { passive: true });
    root.addEventListener('scrollend', onScrollEnd);
    root.addEventListener('focusin', onFocusIn);
    window.addEventListener('resize', onLayout);

    const ro =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => onLayout())
        : null;
    ro?.observe(root);

    return () => {
      cancelAnimationFrame(frame);
      if (settleTimerRef.current) clearTimeout(settleTimerRef.current);
      root.removeEventListener('scroll', onScroll);
      root.removeEventListener('scrollend', onScrollEnd);
      root.removeEventListener('focusin', onFocusIn);
      window.removeEventListener('resize', onLayout);
      ro?.disconnect();
    };
  }, [
    scrollerRef,
    itemCount,
    measure,
    schedulePhotoSettle,
    commitPhoto,
    clampIndex,
  ]);

  const safeActive = clampIndex(activeIndex);
  const safePhoto = clampIndex(photoIndex);

  return {
    activeIndex: safeActive,
    photoIndex: safePhoto,
    isScrolling,
  };
}
