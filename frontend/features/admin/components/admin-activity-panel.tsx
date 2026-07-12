'use client';

import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bell, Store } from 'lucide-react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { AdminDashboard } from '@/services/admin';

type AdminActivityPanelProps = {
  dashboard?: AdminDashboard;
  isLoading: boolean;
};

export function AdminActivityPanel({ dashboard, isLoading }: AdminActivityPanelProps) {
  return (
    <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-border bg-background/80 p-4 xl:block">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" aria-hidden />
          <h2 className="text-sm font-bold text-foreground">Operational alerts</h2>
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <div className="space-y-2">
            {(dashboard?.laundries_pending ?? 0) > 0 && (
              <Link
                href="/admin/approvals"
                className="flex items-start gap-3 rounded-lg border border-warning/30 bg-warning-muted p-3 transition-colors hover:opacity-90"
              >
                <Store className="mt-0.5 h-4 w-4 text-warning" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Pending approvals</p>
                  <p className="text-xs text-muted-foreground">
                    {dashboard?.laundries_pending} laundries need review
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            )}
            {(dashboard?.complaints_open ?? 0) > 0 && (
              <Link
                href="/admin/notifications"
                className="flex items-start gap-3 rounded-lg border border-danger/30 bg-danger-muted p-3 transition-colors hover:opacity-90"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 text-danger" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Open complaints</p>
                  <p className="text-xs text-muted-foreground">{dashboard?.complaints_open} awaiting action</p>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            )}
            {!dashboard?.laundries_pending && !dashboard?.complaints_open && (
              <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                All clear — no high-priority alerts
              </p>
            )}
          </div>
        )}

        <Card className="border-0 shadow-sm ring-1 ring-border/60">
          <CardHeader className="pb-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Today</p>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {isLoading ? (
              <Skeleton className="h-16 w-full" />
            ) : (
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Orders</span>
                  <span className="font-bold tabular-nums">{dashboard?.orders_today ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">In progress</span>
                  <span className="font-bold tabular-nums">{dashboard?.orders_in_progress ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Month revenue</span>
                  <span className="font-bold tabular-nums">
                    {formatInr(Number(dashboard?.revenue_month_inr ?? 0))}
                  </span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </aside>
  );
}
