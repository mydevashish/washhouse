'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { fadeUp, stagger } from '@/features/discover/marketplace/motion';

/** Soft root margin — avoid aggressive negative margins that miss tall/dynamic sections. */
const VIEWPORT = {
  once: true,
  margin: '0px 0px -10% 0px' as const,
  amount: 0.01,
};

/** If IntersectionObserver never fires (late mount, nested scroll, etc.), force visible. */
const VISIBILITY_FALLBACK_MS = 700;

const EASE_OUT = [0.16, 1, 0.3, 1] as const;

function useForceVisible(enabled: boolean, ms = VISIBILITY_FALLBACK_MS) {
  const [forceVisible, setForceVisible] = useState(false);

  useEffect(() => {
    if (!enabled || forceVisible) return;
    const id = window.setTimeout(() => setForceVisible(true), ms);
    return () => window.clearTimeout(id);
  }, [enabled, forceVisible, ms]);

  return forceVisible;
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const forceVisible = useForceVisible(!reduce);
  const show = Boolean(reduce || inView || forceVisible);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={show ? 'visible' : 'hidden'}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: 0.08, delayChildren: delay },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const forceVisible = useForceVisible(!reduce);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={fadeUp}
      // Independent safety net when parent never reaches "visible" (WCAG 2.4.7).
      animate={forceVisible ? 'visible' : undefined}
      initial="hidden"
      transition={{ duration: 0.45, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

export function FadeInStagger({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, VIEWPORT);
  const forceVisible = useForceVisible(!reduce);
  const show = Boolean(reduce || inView || forceVisible);

  if (reduce) return <div className={className}>{children}</div>;

  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={show ? 'visible' : 'hidden'}
      variants={stagger}
    >
      {children}
    </motion.div>
  );
}
