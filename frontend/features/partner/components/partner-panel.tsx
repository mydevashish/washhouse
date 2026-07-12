import { cn } from '@/lib/utils';

export function PartnerPanel({
  title,
  description,
  meta,
  toolbar,
  children,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  meta?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
}) {
  const hasHeader = title || description || meta || toolbar;
  return (
    <section className="overflow-hidden rounded-lg bg-card shadow-soft ring-1 ring-border/60">
      {hasHeader && (
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            {title && <h2 className="card-title">{title}</h2>}
            {(description || meta) && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {description}
                {description && meta ? ' · ' : null}
                {meta}
              </p>
            )}
          </div>
          {toolbar && <div className="flex flex-wrap gap-2">{toolbar}</div>}
        </div>
      )}
      <div className={cn(hasHeader && 'border-t border-border/50', bodyClassName)}>{children}</div>
    </section>
  );
}
