import { cn } from '@/lib/utils';

/** Unified container for tables, filters, and dense admin content. */
export function AdminPanel({
  title,
  description,
  meta,
  toolbar,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  meta?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const hasHeader = title || description || meta || toolbar;

  return (
    <section
      className={cn(
        'overflow-hidden rounded-lg bg-card shadow-soft ring-1 ring-border/60',
        className,
      )}
    >
      {hasHeader && (
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold text-foreground">{title}</h2>}
            {(description || meta) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
                {description && meta ? ' · ' : null}
                {meta}
              </p>
            )}
          </div>
          {toolbar ? <div className="flex shrink-0 flex-wrap items-center gap-2">{toolbar}</div> : null}
        </div>
      )}
      <div className={cn(hasHeader && 'border-t border-border/50', bodyClassName)}>{children}</div>
    </section>
  );
}

export function AdminFilterBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end gap-2 rounded-lg bg-muted/40 p-2.5 ring-1 ring-border/60',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AdminFilterField({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('min-w-[120px]', className)}>
      <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
