'use client';

import { motion, useReducedMotion } from 'framer-motion';

import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type StoreDistanceBadgeProps = {
  distanceKm: number;
  className?: string;
};

/**
 * Fades in when real GPS distance resolves — opacity only, reduced-motion off.
 */
export function StoreDistanceBadge({ distanceKm, className }: StoreDistanceBadgeProps) {
  const reduce = useReducedMotion();
  if (!Number.isFinite(distanceKm)) return null;

  return (
    <motion.span
      className={cn('tabular-nums', className)}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: EASE_OUT }}
    >
      {distanceKm} km
    </motion.span>
  );
}
