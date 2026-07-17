'use client';

import {
  motion,
  useInView,
  useMotionTemplate,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useEffect, useRef, useState, type CSSProperties, type FocusEvent } from 'react';

import {
  formatFromRupee,
  fromRupeeAriaLabel,
} from '@/features/marketing/pricing/lib/format-from-inr';
import type { PricingTagLine } from '@/features/marketing/pricing/lib/tag-price-lines';
import { usePricingMotionBudget } from '@/features/marketing/pricing/pricing-motion-budget';
import { cn } from '@/lib/utils';

type PricingPriceTagProps = {
  name: string;
  unit: string;
  lines: PricingTagLine[];
  /** Deterministic sway phase offset (0–1). */
  swayPhase?: number;
  /** Tag under the rack spotlight — drives left photo sync. */
  spotlight?: boolean;
  className?: string;
};

const UNIT_STUB: Record<string, string> = {
  piece: 'PC',
  kg: 'KG',
  panel: 'PN',
  set: 'SET',
  pair: 'PR',
};

function stubNumberFromName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return String((hash % 900) + 100);
}

function unitStubLabel(unit: string): string {
  return UNIT_STUB[unit] ?? unit.slice(0, 3).toUpperCase();
}

function buildTagAriaLabel(name: string, unit: string, lines: PricingTagLine[]): string {
  const unitSuffix = unit === 'kg' ? ' per kilogram' : '';
  const priceText = lines
    .map((line) => {
      const service = line.service ? `${line.service}: ` : '';
      return `${service}${fromRupeeAriaLabel(line.amountInr)}`;
    })
    .join('; ');
  return `${name}${unitSuffix}: ${priceText}`;
}

/**
 * Laundry-ticket tag on a short wire hook under a metallic screw head.
 * Scroll scrub: spindle-style rotateY flip into facing the user (CSS 3D only),
 * then subtle idle pendulum when settled and in view (budget-capped).
 * Focusable so keyboard users can tab through prices in the rack scroller.
 * No audio / no WebGL.
 */
export function PricingPriceTag({
  name,
  unit,
  lines,
  swayPhase = 0,
  spotlight = false,
  className,
}: PricingPriceTagProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(rootRef, { amount: 0.35, margin: '0px 0px -8% 0px' });
  const { tryClaim, release, version } = usePricingMotionBudget();
  const [hasSwaySlot, setHasSwaySlot] = useState(false);
  const claimedRef = useRef(false);

  const { scrollYProgress } = useScroll({
    target: rootRef,
    offset: ['start end', 'center center'],
  });

  // Spindle flip: near edge-on ticket → face-on as the tag enters the viewport
  const rotateY = useTransform(scrollYProgress, [0, 0.45, 0.85, 1], [86, 42, 8, 0]);
  const rotateZ = useTransform(scrollYProgress, [0, 0.35, 0.7, 1], [6, -5, 1.5, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.18, 1], [0.2, 1, 1]);
  const settleProgress = useTransform(scrollYProgress, [0.88, 1], [0, 1]);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    if (reduce || !inView) {
      setSettled(true);
      return;
    }
    const unsub = settleProgress.on('change', (v) => {
      setSettled(v >= 0.99);
    });
    return unsub;
  }, [settleProgress, reduce, inView]);

  useEffect(() => {
    if (!inView || reduce) {
      if (claimedRef.current) {
        release();
        claimedRef.current = false;
        setHasSwaySlot(false);
      }
      return;
    }

    if (!claimedRef.current) {
      const ok = tryClaim();
      if (ok) {
        claimedRef.current = true;
        setHasSwaySlot(true);
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

  const motionActive = Boolean(inView && !reduce);
  const swayOn = motionActive && hasSwaySlot && settled;
  const scrubTransform = useMotionTemplate`rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
  const ariaLabel = buildTagAriaLabel(name, unit, lines);
  const stubNo = stubNumberFromName(name);
  const unitMark = unitStubLabel(unit);

  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const tag = event.currentTarget;
    const scroller = tag.closest('.pricing-rack-scroller');
    const item = tag.closest<HTMLElement>('[data-rack-item]');
    // Scroll the rack only — never let the page shift sideways on focus.
    if (scroller instanceof HTMLElement && item) {
      const left =
        item.offsetLeft - (scroller.clientWidth - item.offsetWidth) * 0.08;
      scroller.scrollTo({
        left: Math.max(0, left),
        behavior: reduce ? 'auto' : 'smooth',
      });
      return;
    }
    tag.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
      inline: 'nearest',
    });
  };

  return (
    <div
      ref={rootRef}
      className={cn('pricing-price-tag', className)}
      data-sway={swayOn ? 'on' : 'off'}
      data-spotlight={spotlight ? 'on' : 'off'}
      role="group"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-current={spotlight ? 'true' : undefined}
      onFocus={handleFocus}
      style={
        {
          '--tag-sway-amp': `${0.9 + swayPhase * 0.45}deg`,
          animationDelay: swayOn ? `${swayPhase * -1.8}s` : undefined,
        } as CSSProperties
      }
    >
      <span className="pricing-price-tag__screw" aria-hidden>
        <span className="pricing-price-tag__screw-cross" />
      </span>
      <span className="pricing-price-tag__hook" aria-hidden />
      <motion.div
        className="pricing-price-tag__spindle w-full"
        style={
          motionActive
            ? { opacity, transform: scrubTransform }
            : { opacity: 1, transform: 'rotateY(0deg) rotateZ(0deg)' }
        }
      >
        <motion.div
          className="pricing-price-tag__face"
          whileHover={
            motionActive
              ? {
                  filter: 'brightness(1.03)',
                  transition: { duration: 0.12, ease: 'easeOut' },
                }
              : undefined
          }
        >
          <div className="pricing-price-tag__stub" aria-hidden>
            <span className="pricing-price-tag__stub-no">T·{stubNo}</span>
            <span className="pricing-price-tag__care" />
            <span className="pricing-price-tag__stub-unit">{unitMark}</span>
          </div>
          <div className="pricing-price-tag__perf" aria-hidden />
          <p className="pricing-price-tag__name" aria-hidden>
            {name}
          </p>
          <div className="pricing-price-tag__lines" aria-hidden>
            {lines.map((line, i) => (
              <div key={`${line.service ?? 'rate'}-${i}`} className="text-center">
                {line.service ? (
                  <p className="pricing-price-tag__service">{line.service}</p>
                ) : null}
                <p className="pricing-price-tag__price">{formatFromRupee(line.amountInr)}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
