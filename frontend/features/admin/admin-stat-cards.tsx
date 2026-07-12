'use client';

import { IndianRupee, Package, Store, TrendingUp, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatInr } from '@/features/discover/detail/order-pricing';
import type { AdminDashboard } from '@/services/admin';

type AdminStatCardsProps = {
  data: AdminDashboard | undefined;
  isLoading: boolean;
};

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  gradient,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
  gradient: string;
  loading?: boolean;
}) {
  return (
    <Card className={`overflow-hidden border-0 bg-gradient-to-br ${gradient} shadow-soft`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-28" />
            ) : (
              <p className="mt-1.5 text-xl font-bold tabular-nums tracking-tight text-foreground">
                {value}
              </p>
            )}
            {sub && !loading && (
              <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
            )}
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-background/80 shadow-sm">
            <Icon className="h-5 w-5 text-primary" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AdminStatCards({ data, isLoading }: AdminStatCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        label="Platform revenue"
        value={data ? formatInr(Number(data.revenue_total_inr)) : '—'}
        sub={data ? `${formatInr(Number(data.revenue_month_inr))} this month` : undefined}
        icon={IndianRupee}
        gradient="from-emerald-500/15 via-card to-card"
        loading={isLoading}
      />
      <StatCard
        label="Total orders"
        value={data ? String(data.orders_total) : '—'}
        sub={data ? `${data.orders_in_progress} in progress` : undefined}
        icon={Package}
        gradient="from-primary/15 via-card to-card"
        loading={isLoading}
      />
      <StatCard
        label="Users"
        value={data ? String(data.users_total) : '—'}
        sub="Registered on platform"
        icon={Users}
        gradient="from-info-muted via-card to-card"
        loading={isLoading}
      />
      <StatCard
        label="Active laundries"
        value={data ? String(data.laundries_approved) : '—'}
        sub={data ? `${data.laundries_pending} pending approval` : undefined}
        icon={Store}
        gradient="from-warning-muted via-card to-card"
        loading={isLoading}
      />
    </div>
  );
}

export function AdminGrowthBanner({ data }: { data?: AdminDashboard }) {
  if (!data) return null;
  return (
    <Card className="border-0 bg-hero-gradient text-on-hero shadow-pop">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-on-hero-muted">
            Marketplace health
          </p>
          <p className="mt-1.5 text-base font-semibold">
            {data.laundries_approved} live laundries · {data.orders_total} orders placed
          </p>
        </div>
        <TrendingUp className="h-8 w-8 text-on-hero-muted" aria-hidden />
      </CardContent>
    </Card>
  );
}
