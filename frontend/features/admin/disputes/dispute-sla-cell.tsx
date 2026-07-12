'use client';

import { useEffect, useMemo, useState } from 'react';
import { Timer } from 'lucide-react';

import { DisputeSlaBadge } from '@/features/admin/disputes/dispute-badges';
import type { DisputeAdminRow } from '@/services/disputes';

type SlaRow = Pick<
  DisputeAdminRow,
  'sla_deadline_at' | 'sla_status' | 'sla_status_label' | 'sla_hours' | 'overdue_seconds'
>;

function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

function liveSla(row: SlaRow, nowMs: number) {
  const deadlineMs = new Date(row.sla_deadline_at).getTime();
  const remainingSec = Math.floor((deadlineMs - nowMs) / 1000);
  const overdueSec = Math.max(0, -remainingSec);
  return { remainingSec, overdueSec, isBreached: remainingSec <= 0 };
}

type Props = {
  row: SlaRow;
  compact?: boolean;
};

export function DisputeSlaCell({ row, compact }: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const live = useMemo(() => liveSla(row, nowMs), [row, nowMs]);
  const terminal = row.sla_status === 'met' || row.sla_status === 'missed' || row.sla_status === 'na';

  return (
    <div className="min-w-[130px] space-y-1">
      <DisputeSlaBadge label={row.sla_status_label} status={row.sla_status} />
      {!compact && !terminal && (
        <>
          {live.isBreached ? (
            <p className="flex items-center gap-1 text-[10px] font-medium text-destructive">
              <Timer className="h-3 w-3 shrink-0" aria-hidden />
              Breached {formatDuration(live.overdueSec)} ago
            </p>
          ) : (
            <>
              <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <Timer className="h-3 w-3 shrink-0" aria-hidden />
                {formatDuration(live.remainingSec)} left
              </p>
              <p className="text-[10px] text-muted-foreground">
                Escalates in {formatDuration(live.remainingSec)}
              </p>
            </>
          )}
          <p className="text-[10px] text-muted-foreground">SLA: {row.sla_hours}h</p>
        </>
      )}
      {!compact && terminal && row.overdue_seconds > 0 && row.sla_status === 'missed' && (
        <p className="text-[10px] text-destructive">Missed by {formatDuration(row.overdue_seconds)}</p>
      )}
    </div>
  );
}

export const DISPUTE_SLA_STATUSES = [
  { value: 'on_track', label: 'On Track' },
  { value: 'at_risk', label: 'At Risk' },
  { value: 'breached', label: 'Breached' },
] as const;
