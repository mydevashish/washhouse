import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
  /** Optional — omit for typography-led empties (no illustration). */
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
  secondaryAction?: { label: string; onClick: () => void };
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card variant="ghost" className={cn('border-dashed', className)} role="status">
      <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:px-10 sm:py-14">
        {Icon ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-900/30">
            <Icon className="h-7 w-7" aria-hidden />
          </div>
        ) : null}
        <h3
          className={cn(
            'text-balance text-foreground',
            Icon
              ? 'mt-5 text-lg font-semibold'
              : 'text-2xl font-semibold tracking-tight sm:text-3xl',
          )}
        >
          {title}
        </h3>
        <p
          className={cn(
            'max-w-md leading-relaxed text-muted-foreground',
            Icon ? 'mt-2 text-sm sm:text-base' : 'mt-3 text-base sm:text-lg',
          )}
        >
          {description}
        </p>
        {(action || secondaryAction) && (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {action && (
              <Button asChild size="lg">
                <Link href={action.href}>{action.label}</Link>
              </Button>
            )}
            {secondaryAction && (
              <Button
                type="button"
                variant={action ? 'outline' : 'default'}
                size="lg"
                onClick={secondaryAction.onClick}
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
