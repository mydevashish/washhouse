'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Clock3 } from 'lucide-react';

import { buildDeskPrefillHref } from '@/features/partner/customer-desk/phone';
import {
  type PartnerRecentCustomer,
  readRecentCustomersToday,
} from '@/features/partner/lib/partner-recent-customers';
import { cn } from '@/lib/utils';

type Props = {
  className?: string;
  /** Bump to re-read localStorage after desk remembers a phone. */
  refreshKey?: number;
};

/** Last ~8 phones served today (localStorage). Documented as API-optional. */
export function PartnerRecentCustomersStrip({ className, refreshKey = 0 }: Props) {
  const [rows, setRows] = useState<PartnerRecentCustomer[]>([]);

  useEffect(() => {
    setRows(readRecentCustomersToday());
  }, [refreshKey]);

  if (rows.length === 0) return null;

  return (
    <section
      className={cn('space-y-1.5', className)}
      aria-label="Recent customers today"
      data-testid="partner-recent-customers-strip"
    >
      <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        <Clock3 className="h-3 w-3" aria-hidden />
        Recent today
      </div>
      <ul className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {rows.map((row) => {
          const label = row.name?.trim() || row.phone;
          const last4 = row.phone.replace(/\D/g, '').slice(-4);
          return (
            <li key={`${row.phone}-${row.at}`} className="shrink-0">
              <Link
                href={buildDeskPrefillHref({ phone: row.phone })}
                className={cn(
                  'inline-flex h-9 min-w-[6.5rem] flex-col justify-center rounded-full px-3',
                  'bg-muted/40 ring-1 ring-border/50 transition-colors',
                  'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                aria-label={`Open desk for ${label}`}
              >
                <span className="truncate text-xs font-medium text-foreground">{label}</span>
                <span className="font-mono text-[10px] leading-none text-muted-foreground">
                  ···{last4}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
