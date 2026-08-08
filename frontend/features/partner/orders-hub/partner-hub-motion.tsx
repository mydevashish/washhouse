'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

const EASE = [0.16, 1, 0.3, 1] as const;

/** Soft fade/slide for hub panels (chip lens, empty, tab body). */
export function HubMotionBlock({
  children,
  className,
  delay = 0,
  role,
  'data-testid': dataTestId,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  role?: string;
  'data-testid'?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return (
      <div className={className} role={role} data-testid={dataTestId}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      role={role}
      data-testid={dataTestId}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Calm press feedback when selecting a shortcut chip. */
export function HubChipMotion({
  children,
  className,
  selected,
}: {
  children: ReactNode;
  className?: string;
  selected: boolean;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    return <span className={cn('inline-flex', className)}>{children}</span>;
  }

  return (
    <motion.span
      className={cn('inline-flex', className)}
      layout
      animate={selected ? { scale: 1 } : { scale: 1 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32, mass: 0.4 }}
      whileTap={{ scale: 0.97 }}
    >
      {children}
    </motion.span>
  );
}
