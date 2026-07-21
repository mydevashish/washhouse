'use client';

import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

import type { CatalogCategory } from '@/features/laundry-price-list/types';
import {
  getPricingCategoryMood,
  type PricingCategoryMoodVariant,
} from '@/features/marketing/pricing/pricing-category-mood-map';
import { cn } from '@/lib/utils';

type PricingCategoryMoodProps = {
  /** Catalog category — used when `variant` is omitted. */
  category?: CatalogCategory;
  /** Explicit mood loop (special-care / services tiles). */
  variant?: PricingCategoryMoodVariant;
  className?: string;
};

/**
 * Soft atelier micro-loop on the editorial photo edge (steam / fabric / hang).
 * Decorative only — paused off-screen, hard-stopped under reduced-motion.
 * Never mounts on tickets; prices stay above this plane.
 */
export function PricingCategoryMood({
  category,
  variant: variantProp,
  className,
}: PricingCategoryMoodProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reduce = useReducedMotion();
  const inView = useInView(ref, { amount: 0.2, margin: '8% 0px' });
  const variant =
    variantProp ?? (category ? getPricingCategoryMood(category) : 'fabric');
  const moodOn = Boolean(!reduce && inView);

  if (reduce) {
    return null;
  }

  return (
    <div
      ref={ref}
      className={cn('pricing-category-mood', className)}
      data-mood={moodOn ? 'on' : 'off'}
      data-variant={variant}
      aria-hidden
    >
      <div className="pricing-category-mood__canvas">
        <MoodSvg variant={variant} />
      </div>
    </div>
  );
}

function MoodSvg({ variant }: { variant: PricingCategoryMoodVariant }) {
  switch (variant) {
    case 'steam':
      return <SteamMoodSvg />;
    case 'hang':
      return <HangMoodSvg />;
    case 'fabric':
    default:
      return <FabricMoodSvg />;
  }
}

/** Soft rising steam wisps — wash / fold mood. */
function SteamMoodSvg() {
  return (
    <svg
      className="pricing-category-mood__svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <g className="pricing-category-mood__steam pricing-category-mood__steam--a" fill="none">
        <path
          d="M72 168 C68 138 88 126 78 98 C70 76 92 62 86 40"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.35"
        />
      </g>
      <g className="pricing-category-mood__steam pricing-category-mood__steam--b" fill="none">
        <path
          d="M148 172 C142 140 166 128 156 96 C148 72 172 56 164 28"
          stroke="currentColor"
          strokeWidth="12"
          strokeLinecap="round"
          opacity="0.28"
        />
      </g>
      <g className="pricing-category-mood__steam pricing-category-mood__steam--c" fill="none">
        <path
          d="M228 170 C234 142 212 130 222 100 C230 78 208 62 216 36"
          stroke="currentColor"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.32"
        />
      </g>
    </svg>
  );
}

/** Soft fabric drape undulation along the photo edge. */
function FabricMoodSvg() {
  return (
    <svg
      className="pricing-category-mood__svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMax meet"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <g className="pricing-category-mood__fabric" fill="currentColor">
        <path
          className="pricing-category-mood__fabric-sheet"
          d="M0 118 C40 102 70 132 110 118 C150 104 180 134 220 120 C260 106 290 128 320 114 V180 H0 Z"
          opacity="0.22"
        />
        <path
          className="pricing-category-mood__fabric-hem"
          d="M0 138 C45 124 75 150 120 136 C165 122 195 148 240 134 C280 122 300 140 320 132 V180 H0 Z"
          opacity="0.16"
        />
      </g>
    </svg>
  );
}

/** Hanging garment silhouette — subtle sway from a peg. */
function HangMoodSvg() {
  return (
    <svg
      className="pricing-category-mood__svg"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMaxYMin meet"
      xmlns="http://www.w3.org/2000/svg"
      focusable="false"
    >
      <g className="pricing-category-mood__hang" fill="currentColor">
        <circle cx="268" cy="18" r="3.5" opacity="0.35" />
        <path
          d="M268 22 V34"
          stroke="currentColor"
          strokeWidth="1.5"
          opacity="0.4"
          fill="none"
        />
        <path
          className="pricing-category-mood__hang-body"
          d="M248 36 C252 34 264 32 268 32 C272 32 284 34 288 36 L294 48 C286 52 278 54 268 54 C258 54 250 52 242 48 Z M250 52 L246 118 C250 124 258 128 268 128 C278 128 286 124 290 118 L286 52 Z"
          opacity="0.2"
        />
      </g>
    </svg>
  );
}
