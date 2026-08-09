import { cn } from '@/lib/utils';

type PartnerOrdersHubSectionProps = {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** When true, children render inside the standard hub card shell. */
  bordered?: boolean;
  contentClassName?: string;
};

/** Labeled block for Customers & Orders — keeps sections aligned with readable detail copy. */
export function PartnerOrdersHubSection({
  id,
  title,
  description,
  children,
  className,
  bordered = true,
  contentClassName,
}: PartnerOrdersHubSectionProps) {
  return (
    <section className={cn('space-y-2', className)} aria-labelledby={id}>
      <header className="space-y-0.5">
        <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </header>
      {bordered ? (
        <div
          className={cn(
            'rounded-xl border border-border/60 bg-card p-3 shadow-soft sm:p-4',
            contentClassName,
          )}
        >
          {children}
        </div>
      ) : (
        <div className={contentClassName}>{children}</div>
      )}
    </section>
  );
}
