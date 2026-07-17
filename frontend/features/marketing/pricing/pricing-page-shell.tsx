'use client';

import type { ReactNode } from 'react';
import { useReducedMotion } from 'framer-motion';

import '@/features/marketing/pricing/pricing-atelier.css';

/** Page shell: shared atelier tokens + steam/wave flags gated by reduced-motion. */
export function PricingPageShell({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion();

  return (
    <div
      className="pricing-page"
      data-steam={reduce ? 'off' : 'on'}
      data-wave={reduce ? 'off' : 'on'}
    >
      {children}
    </div>
  );
}
