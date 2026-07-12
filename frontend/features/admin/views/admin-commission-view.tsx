'use client';

import { useQuery } from '@tanstack/react-query';

import { AdminCommissionSettings } from '@/features/admin/admin-commission-settings';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { queryKeys } from '@/lib/query-keys';
import { listLaundriesManagement } from '@/services/admin';

export function AdminCommissionView() {
  const laundriesQ = useQuery({
    queryKey: queryKeys.adminLaundriesManagement(),
    queryFn: listLaundriesManagement,
  });

  const custom = (laundriesQ.data ?? []).filter((l) => l.custom_commission_rate != null);

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader title="Commission" description="Global default and per-laundry overrides." />

      <div className="grid gap-4 lg:grid-cols-2">
        <AdminCommissionSettings />

        <AdminPanel
          title="Custom overrides"
          description={`${custom.length} with custom rates`}
          bodyClassName="max-h-64 overflow-y-auto divide-y divide-border/50"
        >
          {custom.length === 0 ? (
            <p className="px-4 py-4 text-sm text-muted-foreground">All laundries use the global default.</p>
          ) : (
            custom.map((l) => (
              <div key={l.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{l.name}</p>
                  <p className="text-xs text-muted-foreground">{l.city}</p>
                </div>
                <div className="shrink-0 text-right text-xs tabular-nums">
                  <p className="font-semibold text-primary">{l.custom_commission_rate}%</p>
                  <p className="text-muted-foreground">eff. {l.effective_commission_rate}%</p>
                </div>
              </div>
            ))
          )}
        </AdminPanel>
      </div>
    </AdminContent>
  );
}
