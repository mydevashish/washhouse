'use client';

import { useEffect, useMemo, useState } from 'react';
import { Timer } from 'lucide-react';

import { BookingRequestSlaBadge } from '@/features/admin/booking-requests/booking-request-badges';

function formatDuration(seconds: number): string {
  const abs = Math.abs(seconds);
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return `${d}d ${h % 24}h`;
  }
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${Math.max(abs, 1)}s`;
}

type Props = {
  slaBadge: string;
  slaAgeSeconds: number;
  createdAt: string;
  compact?: boolean;
};

/** Live age countdown for pre-contact SLA (fresh / aging / overdue). */
export function BookingRequestSlaCell({ slaBadge, slaAgeSeconds, createdAt, compact }: Props) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);

  const liveAge = useMemo(() => {
    const createdMs = new Date(createdAt).getTime();
    if (Number.isNaN(createdMs)) return slaAgeSeconds;
    return Math.max(0, Math.floor((nowMs - createdMs) / 1000));
  }, [createdAt, nowMs, slaAgeSeconds]);

  const terminal = slaBadge === 'met' || slaBadge === 'na';

  return (
    <div className="min-w-[110px] space-y-1">
      <BookingRequestSlaBadge badge={slaBadge} />
      {!compact && !terminal && (
        <p className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <Timer className="h-3 w-3 shrink-0" aria-hidden />
          Age {formatDuration(liveAge)}
        </p>
      )}
      {!compact && slaBadge === 'overdue' && (
        <p className="text-[10px] font-medium text-destructive">Needs contact</p>
      )}
    </div>
  );
}
