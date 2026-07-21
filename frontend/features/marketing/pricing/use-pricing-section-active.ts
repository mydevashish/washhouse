'use client';

import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

/**
 * Section in-view flag for pausing continuous atmosphere (steam / wave / mist).
 * Starts active so SSR + first paint keep static layers visible; IO then gates motion.
 */
export function usePricingSectionActive<T extends HTMLElement = HTMLElement>(
  amount = 0.06,
) {
  const ref = useRef<T>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount, margin: '12% 0px' });
  const atmosphereOn = Boolean(!reduce && inView);

  return { ref, reduce, inView, atmosphereOn } as const;
}
