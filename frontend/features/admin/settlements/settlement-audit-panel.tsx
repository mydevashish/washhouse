'use client';

import { useQuery } from '@tanstack/react-query';

import { ClientDate } from '@/components/ui/client-date';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getSettlementAuditLog } from '@/services/settlements';

const ACTION_LABELS: Record<string, string> = {
  settlement_created: 'Created',
  settlement_approved: 'Approved',
  settlement_rejected: 'Rejected',
  settlement_payout_released: 'Payout released',
  settlement_adjustment: 'Adjustment',
  settlement_status_change: 'Status change',
  settlement_held: 'Held',
  settlement_released_from_hold: 'Released from hold',
};

type Props = {
  settlementId?: string;
  limit?: number;
};

export function SettlementAuditPanel({ settlementId, limit = 30 }: Props) {
  const auditQ = useQuery({
    queryKey: queryKeys.adminSettlementAudit(settlementId),
    queryFn: () => getSettlementAuditLog(settlementId),
    staleTime: STALE.adminDashboard,
  });

  const rows = auditQ.data ?? [];

  return (
    <AdminPanel
      title="Settlement audit log"
      meta={settlementId ? 'Filtered to selected settlement' : 'Recent settlement actions'}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted-foreground">
              <th className="px-3 py-2 font-medium">Time</th>
              <th className="px-3 py-2 font-medium">Actor</th>
              <th className="px-3 py-2 font-medium">Action</th>
              <th className="px-3 py-2 font-medium">Settlement</th>
              <th className="px-3 py-2 font-medium">Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((row) => (
              <tr key={row.id} className="border-b border-border/50 last:border-0">
                <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                  <ClientDate iso={row.timestamp} mode="datetime" />
                </td>
                <td className="px-3 py-2">{row.user_name}</td>
                <td className="px-3 py-2 text-xs font-medium">
                  {ACTION_LABELS[row.action] ?? row.action}
                </td>
                <td className="px-3 py-2 font-mono text-xs">{row.settlement_code ?? '—'}</td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {[row.old_value && `From ${row.old_value}`, row.new_value && `→ ${row.new_value}`, row.note]
                    .filter(Boolean)
                    .join(' · ') || '—'}
                </td>
              </tr>
            ))}
            {!rows.length && !auditQ.isLoading && (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No audit entries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </AdminPanel>
  );
}
