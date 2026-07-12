'use client';

import { cn } from '@/lib/utils';
import { LAUNDRY_TRUST_LEVEL_LABELS, type LaundryTrustLevel } from '@/services/laundry-trust-score';

type LaundryTrustScoreBadgeProps = {
  level: LaundryTrustLevel | string;
  score?: number;
  className?: string;
};

export function LaundryTrustScoreBadge({ level, score, className }: LaundryTrustScoreBadgeProps) {
  const label = LAUNDRY_TRUST_LEVEL_LABELS[level as LaundryTrustLevel] ?? level;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        level === 'premium' && 'bg-violet-100 text-violet-900 dark:bg-violet-900/30 dark:text-violet-200',
        level === 'trusted' && 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-200',
        level === 'verified' && 'bg-sky-100 text-sky-900 dark:bg-sky-900/30 dark:text-sky-200',
        level === 'under_review' && 'bg-destructive/15 text-destructive',
        className,
      )}
    >
      {label}
      {score != null && <span className="tabular-nums opacity-80">({score})</span>}
    </span>
  );
}
