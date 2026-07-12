import type { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

export type InfoBannerProps = {
  icon?: LucideIcon;
  title?: string;
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
  className?: string;
};

const variants = {
  default: 'border-brand-500/15 bg-brand-50/60 text-fg-1 dark:border-brand-500/25 dark:bg-brand-900/20',
  success: 'border-success/20 bg-success-muted text-fg-1',
  warning: 'border-warning/20 bg-warning-muted text-fg-1',
  destructive: 'border-danger/20 bg-danger-muted text-fg-1',
};

export function InfoBanner({
  icon: Icon,
  title,
  children,
  variant = 'default',
  className,
}: InfoBannerProps) {
  return (
    <div
      className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', variants[variant], className)}
      role="note"
    >
      {Icon && <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" aria-hidden />}
      <div>
        {title && <p className="font-semibold text-foreground">{title}</p>}
        <div className={cn(title && 'mt-1', 'leading-relaxed')}>{children}</div>
      </div>
    </div>
  );
}
