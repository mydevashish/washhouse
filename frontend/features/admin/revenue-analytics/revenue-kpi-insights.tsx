'use client';

import { AlertTriangle, Info, Sparkles } from 'lucide-react';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import type { RevenueInsight } from '@/services/revenue-analytics';
import { cn } from '@/lib/utils';

const ICON: Record<string, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  success: Sparkles,
};

const STYLE: Record<string, string> = {
  info: 'text-muted-foreground',
  warning: 'text-warning',
  success: 'text-success',
};

type Props = { insights: RevenueInsight[] };

export function RevenueKpiInsights({ insights }: Props) {
  if (!insights.length) return null;

  return (
    <AdminPanel title="KPI insights" description="Auto-generated from period data" bodyClassName="p-3">
      <ul className="space-y-2">
        {insights.map((item, i) => {
          const Icon = ICON[item.severity] ?? Info;
          return (
            <li
              key={`${item.text}-${i}`}
              className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs"
            >
              <Icon className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', STYLE[item.severity])} aria-hidden />
              <span className="text-foreground">{item.text}</span>
            </li>
          );
        })}
      </ul>
    </AdminPanel>
  );
}
