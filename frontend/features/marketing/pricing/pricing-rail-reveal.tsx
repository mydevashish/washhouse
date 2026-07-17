'use client';

import { useRef, type ReactNode } from 'react';
import {
  motion,
  useInView,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';

import { duration, easing } from '@/lib/motion';
import { cn } from '@/lib/utils';

type PricingRailRevealProps = {
  children: ReactNode;
  className?: string;
  /**
   * Travel direction along the hanging rail.
   * Positive = enter from the right; negative = from the left.
   */
  direction?: 1 | -1;
  /** Slightly longer travel for larger blocks (hero / CTA). */
  distance?: number;
};

/**
 * Section / station reveal: subtle horizontal slide + fade
 * (hanging-rail travel), not generic fade-up cards.
 * Transform + opacity only; frozen when out of view or reduced-motion.
 */
export function PricingRailReveal({
  children,
  className,
  direction = 1,
  distance = 28,
}: PricingRailRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount: 0.12, margin: '10% 0px' });
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'start 0.7'],
  });

  const motionActive = Boolean(inView && !reduce);
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [0, 0] : [distance * direction, 0],
  );
  const opacity = useTransform(scrollYProgress, [0, 1], reduce ? [1, 1] : [0, 1]);

  if (reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={motionActive ? { x, opacity } : { x: 0, opacity: 1 }}
    >
      {children}
    </motion.div>
  );
}

type PricingRailInViewProps = {
  children: ReactNode;
  className?: string;
  direction?: 1 | -1;
  distance?: number;
  delay?: number;
};

/** Once-in-view rail entrance (hero / CTA copy). */
export function PricingRailInView({
  children,
  className,
  direction = 1,
  distance = 24,
  delay = 0,
}: PricingRailInViewProps) {
  const reduce = useReducedMotion();

  return (
    <motion.div
      className={cn(className)}
      initial={reduce ? false : { opacity: 0, x: distance * direction }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.35 }}
      transition={{
        duration: reduce ? 0 : duration.slow,
        ease: easing.out,
        delay: reduce ? 0 : delay,
      }}
    >
      {children}
    </motion.div>
  );
}
