'use client';

import { ArrowUpRight, type LucideIcon } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { PartnerOpsSurface } from '@/features/partner/components/ops-visual/partner-ops-surface';
import type { PartnerHubWorkspaceId } from '@/features/partner/orders-hub/workspace/partner-hub-workspace-types';
import { cn } from '@/lib/utils';

export type PartnerHubPillarCardProps = {
  id: PartnerHubWorkspaceId;
  title: string;
  icon: LucideIcon;
  primaryMetric: string;
  secondaryMetric: string;
  loading?: boolean;
  onOpen: () => void;
  className?: string;
};

export function PartnerHubPillarCard({
  id,
  title,
  icon: Icon,
  primaryMetric,
  secondaryMetric,
  loading = false,
  onOpen,
  className,
}: PartnerHubPillarCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      data-testid={`hub-pillar-${id}`}
      className={cn(
        'group h-full w-full text-left',
        'rounded-[32px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'motion-safe:active:scale-[0.99]',
        className,
      )}
      aria-label={`${title}. ${primaryMetric}. ${secondaryMetric}. Open workspace`}
    >
      <PartnerOpsSurface
        variant="muted"
        className="flex h-full min-h-[7.25rem] flex-col justify-between !p-3 sm:!p-3.5"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-background/80 ring-1 ring-border/60">
            <Icon className="h-4 w-4 text-foreground" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
            Open
            <ArrowUpRight
              className="h-3.5 w-3.5 transition-transform motion-safe:group-hover:translate-x-0.5 motion-safe:group-hover:-translate-y-0.5"
              aria-hidden
            />
          </span>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-sm font-semibold tracking-tight text-foreground">{title}</p>
          {loading ? (
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <p className="text-sm font-medium tabular-nums text-foreground">{primaryMetric}</p>
              <p className="text-[11px] leading-snug text-muted-foreground">{secondaryMetric}</p>
            </>
          )}
        </div>
      </PartnerOpsSurface>
    </button>
  );
}
