'use client';

import { AlertTriangle, ShieldAlert, Store, User } from 'lucide-react';

import { AdminPanel } from '@/features/admin/components/admin-panel';
import { FraudRiskBadge } from '@/features/admin/components/fraud-risk-badge';
import type { DisputeFraudRiskContext, DisputePartyRiskProfile } from '@/services/disputes';
import { cn } from '@/lib/utils';

type Props = {
  risk: DisputeFraudRiskContext;
  customerName?: string | null;
  partnerName?: string | null;
};

const OVERALL_BORDER: Record<string, string> = {
  low: 'ring-emerald-500/40',
  medium: 'ring-amber-500/50',
  high: 'ring-orange-500/60',
  critical: 'ring-destructive/70',
};

const OVERALL_BG: Record<string, string> = {
  low: 'from-emerald-500/5 to-transparent',
  medium: 'from-amber-500/10 to-transparent',
  high: 'from-orange-500/10 to-transparent',
  critical: 'from-destructive/15 to-transparent',
};

export function DisputeFraudRiskPanel({ risk, customerName, partnerName }: Props) {
  const level = risk.overall_risk_level;

  return (
    <AdminPanel
      title="Fraud risk indicators"
      bodyClassName={cn(
        'space-y-3 bg-gradient-to-br p-3',
        OVERALL_BG[level] ?? OVERALL_BG.low,
      )}
      className={cn('ring-2', OVERALL_BORDER[level] ?? OVERALL_BORDER.low)}
      toolbar={<FraudRiskBadge level={level} className="text-xs" />}
    >
      <div className="flex items-start gap-2 rounded-lg border border-border/60 bg-background/80 px-3 py-2">
        <ShieldAlert
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0',
            level === 'critical' && 'text-destructive',
            level === 'high' && 'text-orange-600',
            level === 'medium' && 'text-amber-600',
            level === 'low' && 'text-emerald-600',
          )}
          aria-hidden
        />
        <p className="text-xs text-muted-foreground">
          Overall dispute risk is{' '}
          <span className="font-semibold text-foreground">{risk.overall_risk_label}</span>
          {level === 'critical' || level === 'high' ? ' — review evidence carefully before refund.' : '.'}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <PartyRiskCard
          title="Customer"
          subtitle={customerName}
          icon={User}
          profile={risk.customer}
        />
        {risk.partner ? (
          <PartyRiskCard
            title="Partner"
            subtitle={partnerName ?? undefined}
            icon={Store}
            profile={risk.partner}
          />
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-dashed border-border px-3 py-8 text-xs text-muted-foreground">
            No partner linked to this order
          </div>
        )}
      </div>
    </AdminPanel>
  );
}

function PartyRiskCard({
  title,
  subtitle,
  icon: Icon,
  profile,
}: {
  title: string;
  subtitle?: string | null;
  icon: typeof User;
  profile: DisputePartyRiskProfile;
}) {
  const barColor =
    profile.risk_level === 'critical'
      ? 'bg-destructive'
      : profile.risk_level === 'high'
        ? 'bg-orange-500'
        : profile.risk_level === 'medium'
          ? 'bg-amber-500'
          : 'bg-emerald-500';

  return (
    <div className="space-y-3 rounded-lg border border-border bg-card/90 p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <Icon className="h-3.5 w-3.5" aria-hidden />
            {title}
          </p>
          {subtitle && <p className="truncate text-sm font-medium">{subtitle}</p>}
        </div>
        <FraudRiskBadge level={profile.risk_level} />
      </div>

      <div>
        <div className="mb-1 flex items-baseline justify-between">
          <span className="text-[11px] text-muted-foreground">{title} risk score</span>
          <span className="text-lg font-bold tabular-nums">{profile.risk_score}</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barColor)}
            style={{ width: `${profile.risk_score}%` }}
            role="progressbar"
            aria-valuenow={profile.risk_score}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${title} risk score ${profile.risk_score}`}
          />
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Trust score {profile.trust_score}/100</p>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[11px]">
        <Metric label="Dispute frequency" value={`${profile.dispute_frequency_30d} (30d)`} hint={profile.dispute_frequency_pct} />
        <Metric label="Refund rate" value={profile.refund_rate_pct} />
        <Metric label="Previous claims" value={String(profile.previous_claims)} />
        <Metric label="Previous complaints" value={String(profile.previous_complaints)} />
      </dl>

      {(profile.risk_level === 'high' || profile.risk_level === 'critical') && (
        <p className="flex items-center gap-1 text-[10px] font-medium text-destructive">
          <AlertTriangle className="h-3 w-3" aria-hidden />
          Elevated fraud signals detected
        </p>
      )}
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold tabular-nums text-foreground">
        {value}
        {hint && <span className="ml-1 font-normal text-muted-foreground">({hint} of activity)</span>}
      </dd>
    </div>
  );
}
