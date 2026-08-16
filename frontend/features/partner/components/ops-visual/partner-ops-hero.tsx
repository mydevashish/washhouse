import Image from 'next/image';

import { PartnerOpsSectionLabel } from '@/features/partner/components/ops-visual/partner-ops-section-label';
import { cn } from '@/lib/utils';

export function PartnerOpsHero({
  badge,
  eyebrow,
  hint,
  title,
  titleAs: TitleTag = 'h2',
  description,
  imageSrc,
  imageAlt = '',
  actions,
  variant = 'default',
  className,
}: {
  badge?: React.ReactNode;
  /** Uppercase label above title (order-demo “Featured service”). */
  eyebrow?: string;
  /** Short muted line beside badge (order-demo top row). */
  hint?: string;
  title: string;
  /** Page title when used once per view (e.g. partner home greeting). */
  titleAs?: 'h1' | 'h2';
  description?: string;
  imageSrc?: string;
  imageAlt?: string;
  actions?: React.ReactNode;
  variant?: 'default' | 'compact';
  className?: string;
}) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        isCompact ? 'grid gap-3' : 'grid gap-4 lg:grid-cols-[1.2fr_0.8fr]',
        className,
      )}
    >
      <div className={cn('space-y-4', isCompact && 'space-y-2')}>
        {(badge || hint || actions) && (
          <div className="flex flex-wrap items-center gap-3">
            {badge}
            {hint && !isCompact ? (
              <p className="text-sm text-muted-foreground">{hint}</p>
            ) : null}
            {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
          </div>
        )}
        <div className={cn('space-y-2', isCompact && 'space-y-1')}>
          {eyebrow && !isCompact ? <PartnerOpsSectionLabel>{eyebrow}</PartnerOpsSectionLabel> : null}
          <TitleTag
            className={cn(
              TitleTag === 'h1' ? 'page-title' : 'text-base font-semibold tracking-tight text-foreground',
              isCompact && TitleTag !== 'h1' && 'text-sm',
            )}
          >
            {title}
          </TitleTag>
          {description ? (
            <p className={cn('text-muted-foreground', isCompact ? 'text-sm' : 'text-sm leading-6')}>
              {description}
            </p>
          ) : null}
        </div>
      </div>
      {imageSrc && !isCompact ? (
        <div className="relative min-h-[12rem] overflow-hidden rounded-xl bg-muted/30">
          <Image
            src={imageSrc}
            alt={imageAlt}
            width={640}
            height={420}
            className="h-full w-full object-cover"
            sizes="(min-width: 1024px) 40vw, 100vw"
          />
        </div>
      ) : null}
    </div>
  );
}
