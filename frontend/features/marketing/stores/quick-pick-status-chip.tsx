'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';

import { StoreDistanceBadge } from '@/features/marketing/stores/store-distance-badge';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

type QuickPickStatusChipProps = {
  /** True when GPS ranked stores with real haversine distance. */
  nearYou: boolean;
  /** Distance for #1 store — only pass when !distanceIsApproximate. */
  distanceKm?: number | null;
  className?: string;
};

/**
 * Hero status chip for the stores quick-pick sheet.
 * “Near you · X km” only when real GPS distance is known; otherwise “Featured”.
 * Distance fades in when GPS resolves (opacity only).
 */
export function QuickPickStatusChip({
  nearYou,
  distanceKm,
  className,
}: QuickPickStatusChipProps) {
  const reduce = useReducedMotion();
  const showDistance =
    nearYou && distanceKm != null && Number.isFinite(distanceKm);

  const Icon = nearYou ? MapPin : Sparkles;

  return (
    <motion.span
      key={nearYou ? 'near' : 'featured'}
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium',
        'bg-primary/10 text-primary ring-1 ring-primary/20',
        className,
      )}
      initial={reduce ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduce ? 0 : 0.15, ease: EASE_OUT }}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {nearYou ? 'Near you' : 'Featured'}
      {showDistance && distanceKm != null ? (
        <>
          <span aria-hidden>·</span>
          <StoreDistanceBadge distanceKm={distanceKm} />
        </>
      ) : null}
    </motion.span>
  );
}
