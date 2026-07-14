'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { GlassSurface } from '@/components/ui/glass-surface';
import { GLASS_MOBILE_SOLID_CARD } from '@/features/marketing/shared/marketing-layout';
import { usePrefersReducedMotion } from '@/lib/hooks/use-prefers-reduced-motion';
import { cn } from '@/lib/utils';

export type MarketingGlassCardCta = {
  href: string;
  label: string;
  className?: string;
  /** Use `success` for WhatsApp / positive outbound actions */
  tone?: 'brand' | 'success';
};

export type MarketingGlassCardProps = {
  className?: string;
  glassVariant?: 'default' | 'strong' | 'subtle';
  /** Solid card fallback below md — keeps ≤1 glass surface per section on mobile */
  solidOnMobile?: boolean;
  enableHoverLift?: boolean;
  imageSlot?: ReactNode;
  iconSlot?: ReactNode;
  title?: ReactNode;
  titleId?: string;
  description?: ReactNode;
  cta?: MarketingGlassCardCta;
  children?: ReactNode;
};

const ctaToneClass: Record<NonNullable<MarketingGlassCardCta['tone']>, string> = {
  brand: '',
  success: 'bg-success text-success-foreground hover:bg-success/90',
};

export function MarketingGlassCard({
  className,
  glassVariant = 'default',
  solidOnMobile = true,
  enableHoverLift = false,
  imageSlot,
  iconSlot,
  title,
  titleId,
  description,
  cta,
  children,
}: MarketingGlassCardProps) {
  const reduce = usePrefersReducedMotion();
  const lift = enableHoverLift && !reduce;

  return (
    <article
      className={cn(
        'h-full',
        lift &&
          'lg:transition-[transform,box-shadow] lg:duration-200 lg:hover:-translate-y-1 lg:hover:shadow-[var(--shadow-card-hover)]',
      )}
    >
      <GlassSurface
        variant={glassVariant}
        className={cn(
          'flex h-full flex-col rounded-2xl p-5 sm:p-6',
          solidOnMobile && [GLASS_MOBILE_SOLID_CARD, 'max-md:ring-1 max-md:ring-border/60'],
          className,
        )}
      >
        {imageSlot ? <div className="mb-4 overflow-hidden rounded-xl">{imageSlot}</div> : null}

        {iconSlot ? <div className="shrink-0">{iconSlot}</div> : null}

        {title ? (
          <h3
            id={titleId}
            className={cn(
              'font-bold text-foreground',
              iconSlot || imageSlot ? 'mt-4' : undefined,
              typeof title === 'string' ? 'text-lg sm:text-xl' : undefined,
            )}
          >
            {title}
          </h3>
        ) : null}

        {description ? (
          <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}

        {children}

        {cta ? (
          <Button
            asChild
            size="default"
            className={cn(
              'mt-5 h-11 min-h-11 w-full rounded-full',
              cta.tone === 'success' && ctaToneClass.success,
              cta.className,
            )}
          >
            <Link href={cta.href}>{cta.label}</Link>
          </Button>
        ) : null}
      </GlassSurface>
    </article>
  );
}
