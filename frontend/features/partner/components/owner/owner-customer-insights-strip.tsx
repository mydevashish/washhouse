'use client';

import Link from 'next/link';
import { RefreshCw, Star, UserPlus } from 'lucide-react';

import { formatInr } from '@/features/discover/detail/order-pricing';
import { buildOrdersHubPath } from '@/lib/navigation/orders-hub';
import { cn } from '@/lib/utils';
import type { CustomerInsightRow } from '@/services/customer-insights';
import type { CustomerCrmInsights } from '@/features/partner/lib/owner-customer-crm';

function InsightTile({
  label,
  value,
  hint,
  icon: Icon,
  loading,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: typeof UserPlus;
  loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <Icon className="h-3.5 w-3.5 text-muted-foreground/70" aria-hidden />
      </div>
      <p className={cn('mt-1 text-xl font-semibold tabular-nums', loading && 'animate-pulse text-muted-foreground')}>
        {loading ? '—' : value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function OwnerCustomerInsightsStrip({
  insights,
  loading,
}: {
  insights: CustomerCrmInsights;
  loading?: boolean;
}) {
  return (
    <section aria-label="Customer insights" className="space-y-3" data-testid="owner-customer-insights">
      <div className="grid gap-3 sm:grid-cols-3">
        <InsightTile
          label="New this week"
          value={String(insights.newThisWeek)}
          hint="First order in last 7 days"
          icon={UserPlus}
          loading={loading}
        />
        <InsightTile
          label="Repeat rate"
          value={insights.repeatRatePct != null ? `${insights.repeatRatePct}%` : '—'}
          hint="Customers with 2+ orders"
          icon={RefreshCw}
          loading={loading}
        />
        <InsightTile
          label="Top spenders"
          value={String(insights.topCustomers.length)}
          hint="Shown below"
          icon={Star}
          loading={loading}
        />
      </div>

      {insights.topCustomers.length > 0 ? (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Top by revenue</p>
          <ol className="mt-2 space-y-1.5">
            {insights.topCustomers.map((c: CustomerInsightRow, idx) => (
              <li key={c.user_id} className="flex items-center justify-between gap-2 text-sm">
                <Link
                  href={buildOrdersHubPath('/partner/orders', 'desk', { user_id: c.user_id })}
                  className="min-w-0 truncate font-medium text-foreground hover:underline"
                >
                  <span className="mr-1.5 tabular-nums text-muted-foreground">{idx + 1}.</span>
                  {c.name}
                </Link>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {formatInr(Number(c.lifetime_spend_inr))}
                </span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}
    </section>
  );
}
