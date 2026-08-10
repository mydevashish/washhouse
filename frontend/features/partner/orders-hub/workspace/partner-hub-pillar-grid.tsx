import { cn } from '@/lib/utils';

/** Responsive 2×2 (mobile) → 4-across (lg) layout for hub pillar tiles. */
export function PartnerHubPillarGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('grid auto-rows-fr grid-cols-2 items-stretch gap-2 lg:grid-cols-4 lg:gap-3', className)}
      data-testid="hub-pillar-grid"
    >
      {children}
    </div>
  );
}
