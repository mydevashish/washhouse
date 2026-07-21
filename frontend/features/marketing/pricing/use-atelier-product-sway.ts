'use client';

import { useInView, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type RefObject } from 'react';

import { usePricingMotionBudget } from '@/features/marketing/pricing/pricing-motion-budget';

type UseAtelierProductSwayOptions = {
  /** Intersection amount (0–1). Photos use a lower bar than tickets. */
  amount?: number;
};

/**
 * Soft hang-sway slot for atelier product frames (opacity/rotateZ via CSS).
 * Shares `PricingMotionBudgetProvider` with rack tags; pauses off-screen and
 * under `prefers-reduced-motion`.
 */
export function useAtelierProductSway<T extends HTMLElement = HTMLElement>(
  options: UseAtelierProductSwayOptions = {},
): { ref: RefObject<T>; swayOn: boolean } {
  const { amount = 0.25 } = options;
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount, margin: '8% 0px' });
  const { tryClaim, release, version } = usePricingMotionBudget();
  const [hasSlot, setHasSlot] = useState(false);
  const claimedRef = useRef(false);

  useEffect(() => {
    if (!inView || reduce) {
      if (claimedRef.current) {
        release();
        claimedRef.current = false;
        setHasSlot(false);
      }
      return;
    }

    if (!claimedRef.current) {
      const ok = tryClaim();
      if (ok) {
        claimedRef.current = true;
        setHasSlot(true);
      }
    }
  }, [inView, reduce, version, tryClaim, release]);

  useEffect(() => {
    return () => {
      if (claimedRef.current) {
        release();
        claimedRef.current = false;
      }
    };
  }, [release]);

  return {
    ref,
    swayOn: Boolean(inView && !reduce && hasSlot),
  };
}
