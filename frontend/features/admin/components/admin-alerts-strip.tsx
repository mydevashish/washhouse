'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Store } from 'lucide-react';

import type { AdminDashboard } from '@/services/admin';
import { formatInr } from '@/features/discover/detail/order-pricing';

type AdminAlertsStripProps = {
  dashboard?: AdminDashboard;
};

export function AdminAlertsStrip({ dashboard }: AdminAlertsStripProps) {
  const pending = dashboard?.laundries_pending ?? 0;
  const complaints = dashboard?.complaints_open ?? 0;

  if (!pending && !complaints) {
    return (
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl bg-muted/40 px-3 py-2 text-xs text-muted-foreground ring-1 ring-border/40">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
          All clear
        </span>
        {dashboard && (
          <>
            <span className="text-border">|</span>
            <span>
              <strong className="text-foreground">{dashboard.orders_today}</strong> orders today
            </span>
            <span className="text-border">|</span>
            <span className="tabular-nums">{formatInr(Number(dashboard.revenue_month_inr))} MTD</span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {pending > 0 && (
        <Link
          href="/admin/approvals"
          className="inline-flex items-center gap-2 rounded-lg bg-warning-muted px-3 py-1.5 text-xs font-medium text-warning ring-1 ring-warning/25 hover:opacity-90"
        >
          <Store className="h-3.5 w-3.5" aria-hidden />
          {pending} pending approval{pending !== 1 ? 's' : ''}
          <ArrowRight className="h-3 w-3 opacity-60" />
        </Link>
      )}
      {complaints > 0 && (
        <Link
          href="/admin/notifications"
          className="inline-flex items-center gap-2 rounded-lg bg-danger-muted px-3 py-1.5 text-xs font-medium text-danger ring-1 ring-danger/25 hover:opacity-90"
        >
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
          {complaints} complaint{complaints !== 1 ? 's' : ''}
          <ArrowRight className="h-3 w-3 opacity-60" />
        </Link>
      )}
    </div>
  );
}
