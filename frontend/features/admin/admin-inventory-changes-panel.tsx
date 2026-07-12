'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardList, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { INVENTORY_ITEM_TYPES, approveInventoryChange, listAdminInventoryChangeRequests, rejectInventoryChange } from '@/services/inventory-verification';
import { queryKeys } from '@/lib/query-keys';

export function AdminInventoryChangesPanel() {
  const queryClient = useQueryClient();
  const changesQ = useQuery({
    queryKey: queryKeys.adminInventoryChanges(),
    queryFn: listAdminInventoryChangeRequests,
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveInventoryChange(id),
    onSuccess: () => {
      toast.success('Change approved');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminInventoryChanges() });
    },
    onError: () => toast.error('Could not approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => rejectInventoryChange(id),
    onSuccess: () => {
      toast.success('Change rejected');
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminInventoryChanges() });
    },
    onError: () => toast.error('Could not reject'),
  });

  if (changesQ.isLoading) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (changesQ.isError) {
    return (
      <InfoBanner variant="destructive" title="Could not load change requests">
        Try refreshing.
      </InfoBanner>
    );
  }

  const rows = changesQ.data ?? [];

  return (
    <AdminPanel
      meta={<span className="tabular-nums">{rows.length} pending</span>}
      bodyClassName="p-0"
    >
      {rows.length === 0 ? (
        <div className="p-6">
          <EmptyState
            icon={ClipboardList}
            title="No pending inventory changes"
            description="Partner change requests appear here for approval."
          />
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => {
            const items = row.proposed_items.items ?? {};
            const busy = approveMutation.isPending || rejectMutation.isPending;
            return (
              <li key={row.id} className="p-4">
                <Card className="border-amber-500/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Order {row.order_id.slice(0, 8)}…</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-muted-foreground">{row.reason}</p>
                    <dl className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
                      {INVENTORY_ITEM_TYPES.map((type) => (
                        <div key={type} className="rounded-lg bg-muted/50 px-2 py-1">
                          <dt className="text-xs capitalize text-muted-foreground">{type.replace(/_/g, ' ')}</dt>
                          <dd className="font-bold tabular-nums">{items[type] ?? 0}</dd>
                        </div>
                      ))}
                    </dl>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => approveMutation.mutate(row.id)}
                      >
                        {approveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Approve'}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy}
                        onClick={() => rejectMutation.mutate(row.id)}
                      >
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </AdminPanel>
  );
}
