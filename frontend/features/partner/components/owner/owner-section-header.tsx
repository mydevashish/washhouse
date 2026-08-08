import { cn } from '@/lib/utils';

export function OwnerSectionHeader({
  title,
  description,
  action,
  className,
}: {
  title: string;
  /** Short “what this section is for”. */
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">{title}</h2>
        {description ? (
          <p className="mt-0.5 max-w-xl text-xs text-muted-foreground sm:text-sm">{description}</p>
        ) : null}
      </div>
      {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
    </div>
  );
}
