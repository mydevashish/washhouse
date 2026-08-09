import { cn } from '@/lib/utils';

export function PartnerOpsSectionLabel({
  children,
  id,
  className,
  as: Component = 'p',
}: {
  children: React.ReactNode;
  /** For `aria-labelledby` on grouped sections. */
  id?: string;
  className?: string;
  as?: 'p' | 'span' | 'h2' | 'h3';
}) {
  return (
    <Component
      id={id}
      className={cn('text-xs uppercase tracking-[.24em] text-muted-foreground', className)}
    >
      {children}
    </Component>
  );
}
