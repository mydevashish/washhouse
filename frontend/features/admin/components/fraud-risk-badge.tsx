'use client';

import { cn } from '@/lib/utils';
import { FRAUD_RISK_LABELS, type FraudRiskLevel } from '@/services/fraud-detection';

type FraudRiskBadgeProps = {
  level: FraudRiskLevel | string;
  className?: string;
};

export function FraudRiskBadge({ level, className }: FraudRiskBadgeProps) {
  const label = FRAUD_RISK_LABELS[level as FraudRiskLevel] ?? level;
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        level === 'low' && 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
        level === 'medium' && 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-200',
        level === 'high' && 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200',
        level === 'critical' && 'bg-destructive/15 text-destructive',
        className,
      )}
    >
      {label}
    </span>
  );
}
