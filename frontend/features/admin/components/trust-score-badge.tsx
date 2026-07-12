'use client';

import { cn } from '@/lib/utils';
import { TRUST_LEVEL_LABELS, type TrustScoreLevel } from '@/services/trust-score';

type TrustScoreBadgeProps = {
  level: TrustScoreLevel | string;
  score?: number;
  className?: string;
};

export function TrustScoreBadge({ level, score, className }: TrustScoreBadgeProps) {
  const label = TRUST_LEVEL_LABELS[level as TrustScoreLevel] ?? level;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        level === 'gold' && 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        level === 'silver' && 'bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100',
        level === 'bronze' && 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
        level === 'high_risk' && 'bg-destructive/15 text-destructive',
        className,
      )}
    >
      {label}
      {score != null && <span className="tabular-nums opacity-80">({score})</span>}
    </span>
  );
}
