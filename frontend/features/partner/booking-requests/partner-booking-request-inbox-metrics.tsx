'use client';

import { AlertTriangle, ClipboardList, Loader2, MessageCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { BookingRequestInboxMeta } from '@/features/partner/booking-requests/types';

type Props = {
  inbox: BookingRequestInboxMeta | undefined;
  assignedTotal?: number;
  loading?: boolean;
  onAssignedClick?: () => void;
  onOverdueClick?: () => void;
  onContactedClick?: () => void;
};

function MetricCard({
  label,
  value,
  icon: Icon,
  onClick,
  tone = 'default',
}: {
  label: string;
  value: number;
  icon: typeof ClipboardList;
  onClick?: () => void;
  tone?: 'default' | 'warning' | 'danger';
}) {
  const toneClass =
    tone === 'danger'
      ? 'ring-destructive/30'
      : tone === 'warning'
        ? 'ring-warning/30'
        : 'ring-border/60';

  return (
    <button
      type="button"
      disabled={!onClick}
      onClick={onClick}
      className={cn(
        'flex min-w-[140px] flex-1 items-center gap-3 rounded-lg bg-card px-3 py-2.5 text-left shadow-soft ring-1',
        toneClass,
        onClick && 'transition-colors hover:bg-muted/40',
      )}
    >
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-md',
          tone === 'danger'
            ? 'bg-destructive/10 text-destructive'
            : tone === 'warning'
              ? 'bg-warning-muted text-warning'
              : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="text-lg font-semibold tabular-nums text-foreground">{value}</p>
      </div>
    </button>
  );
}

export function PartnerBookingRequestInboxMetrics({
  inbox,
  assignedTotal,
  loading,
  onAssignedClick,
  onOverdueClick,
  onContactedClick,
}: Props) {
  if (loading && !inbox && assignedTotal === undefined) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <MetricCard
        label="Assigned"
        value={assignedTotal ?? 0}
        icon={ClipboardList}
        onClick={onAssignedClick}
      />
      <MetricCard
        label="Overdue"
        value={inbox?.overdue ?? 0}
        icon={AlertTriangle}
        onClick={onOverdueClick}
        tone="danger"
      />
      <MetricCard
        label="Needs contact"
        value={assignedTotal ?? inbox?.overdue ?? 0}
        icon={MessageCircle}
        onClick={onAssignedClick}
        tone="warning"
      />
    </div>
  );
}
