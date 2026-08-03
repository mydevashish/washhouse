'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

import { FadeIn, FadeInItem } from '@/features/discover/marketplace/fade-in';
import { Section } from '@/features/discover/marketplace/section';
import { useMounted } from '@/lib/hooks/use-mounted';
import { PRELAUNCH_STATS, PRELAUNCH_STAT_VALUE } from '@/lib/prelaunch-stats';
import { cn } from '@/lib/utils';

const STATS = [
  { value: 10000, suffix: '+', label: 'Orders completed' },
  { value: 500, suffix: '+', label: 'Laundry partners' },
  { value: 50, suffix: '+', label: 'Cities' },
  { value: 98, suffix: '%', label: 'Customer satisfaction' },
] as const;

function statValueClassName(prelaunch: boolean) {
  return cn(
    'font-bold tracking-tight text-on-hero',
    prelaunch
      ? 'text-lg text-on-hero/90 sm:text-xl lg:text-2xl'
      : 'text-2xl tabular-nums sm:text-3xl lg:text-4xl',
  );
}

function AnimatedStat({
  value,
  suffix,
  label,
}: {
  value: number;
  suffix: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const mounted = useMounted();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (PRELAUNCH_STATS) return;
    if (!mounted) return;
    if (!inView || reduce) {
      setDisplay(value);
      return;
    }
    const duration = 1200;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.floor(eased * value));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [mounted, inView, value, reduce]);

  return (
    <div ref={ref} className="text-center">
      <p
        className={statValueClassName(PRELAUNCH_STATS)}
        aria-live={PRELAUNCH_STATS ? undefined : 'polite'}
      >
        {PRELAUNCH_STATS
          ? PRELAUNCH_STAT_VALUE
          : `${mounted ? display.toLocaleString('en-IN') : '0'}${suffix}`}
      </p>
      <p className="mt-1.5 text-sm font-medium text-on-hero-muted">{label}</p>
    </div>
  );
}

export function StatsSection() {
  const reduce = useReducedMotion();

  return (
    <Section id="stats" className="py-12 sm:py-16 lg:py-20" tone="default" ariaLabel="Platform statistics">
      <motion.div
        className="overflow-hidden rounded-xl bg-gradient-to-r from-brand-500 via-brand-600 to-brand-900 px-5 py-8 shadow-pop sm:px-8 sm:py-10"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <p className="mb-6 text-center text-xs font-semibold uppercase tracking-wider text-on-hero-muted sm:mb-8">
          By the numbers
        </p>
        <FadeIn>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STATS.map((s) => (
              <FadeInItem key={s.label}>
                <AnimatedStat {...s} />
              </FadeInItem>
            ))}
          </div>
        </FadeIn>
      </motion.div>
    </Section>
  );
}
