import { cn } from '@/lib/utils';

export type PartnerOpsSurfaceVariant = 'default' | 'muted' | 'flush';

const variantClass: Record<PartnerOpsSurfaceVariant, string> = {
  default:
    'rounded-[32px] border border-border bg-background p-5 shadow-sm dark:border-border/80',
  muted:
    'rounded-[32px] border border-border bg-muted/30 p-5 shadow-sm ring-1 ring-border/40 dark:border-border/80 dark:bg-muted/20 dark:ring-border/60',
  flush:
    'rounded-[32px] border border-border bg-background p-0 shadow-sm overflow-hidden dark:border-border/80',
};

export function PartnerOpsSurface({
  children,
  variant = 'default',
  className,
  as: Component = 'div',
}: {
  children: React.ReactNode;
  variant?: PartnerOpsSurfaceVariant;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  return <Component className={cn(variantClass[variant], className)}>{children}</Component>;
}
