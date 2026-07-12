'use client';

import { useState } from 'react';

import { AdminLaundryTrustScoresPanel } from '@/features/admin/admin-laundry-trust-scores-panel';
import { AdminTrustScoresPanel } from '@/features/admin/admin-trust-scores-panel';
import { cn } from '@/lib/utils';

type TrustTab = 'customers' | 'partners';

export function AdminTrustScoresTabs() {
  const [tab, setTab] = useState<TrustTab>('customers');

  return (
    <div className="space-y-4">
      <div className="inline-flex rounded-xl border border-border bg-muted/30 p-1">
        {(
          [
            ['customers', 'Customer trust'],
            ['partners', 'Partner trust'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={cn(
              'rounded-lg px-4 py-2 text-sm font-semibold transition-colors',
              tab === id ? 'bg-card text-foreground shadow-soft' : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'customers' ? <AdminTrustScoresPanel /> : <AdminLaundryTrustScoresPanel />}
    </div>
  );
}
