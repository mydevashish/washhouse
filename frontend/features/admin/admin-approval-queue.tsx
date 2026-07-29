'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Store, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { ConfirmActionDialog } from '@/features/admin/components/confirm-action-dialog';
import { formatIndiaDateTime } from '@/lib/datetime';
import { queryKeys } from '@/lib/query-keys';
import { approveLaundry, listPendingLaundries, rejectLaundry } from '@/services/admin';

type PendingAction = { id: string; kind: 'approve' | 'reject'; name: string } | null;

export function AdminApprovalQueue({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
  const [confirm, setConfirm] = useState<PendingAction>(null);

  const pendingQ = useQuery({
    queryKey: queryKeys.adminPending(),
    queryFn: listPendingLaundries,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminPending() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminLaundries() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.adminDashboard() });
    void queryClient.invalidateQueries({ queryKey: queryKeys.laundries() });
  };

  const approveMutation = useMutation({
    mutationFn: approveLaundry,
    onSuccess: () => {
      toast.success('Laundry approved');
      setConfirm(null);
      invalidate();
    },
    onError: () => toast.error('Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectLaundry,
    onSuccess: () => {
      toast.success('Laundry rejected');
      setConfirm(null);
      invalidate();
    },
    onError: () => toast.error('Rejection failed'),
  });

  const busyId = approveMutation.isPending
    ? approveMutation.variables
    : rejectMutation.isPending
      ? rejectMutation.variables
      : null;

  if (pendingQ.isLoading) {
    return (
      <div className="space-y-2" aria-busy="true">
        {Array.from({ length: compact ? 1 : 2 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (pendingQ.isError) {
    return (
      <QueryErrorState
        title="Could not load approval queue"
        onRetry={() => void pendingQ.refetch()}
        isRetrying={pendingQ.isFetching}
      />
    );
  }

  const pending = pendingQ.data ?? [];

  if (!pending.length) {
    return (
      <EmptyState
        icon={Store}
        title="Queue is clear"
        description="New partner sign-ups will appear here."
      />
    );
  }

  const confirming = Boolean(confirm);
  const confirmPending =
    (confirm?.kind === 'approve' && approveMutation.isPending) ||
    (confirm?.kind === 'reject' && rejectMutation.isPending);

  return (
    <>
      <ul className="divide-y divide-border/50 rounded-xl ring-1 ring-border/50">
        {pending.map((l) => (
          <li
            key={l.id}
            className="flex flex-col gap-3 bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-foreground">{l.name}</p>
                <span className="rounded-md bg-warning-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-warning">
                  Pending
                </span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {l.city} · {l.owner_email ?? 'No email'} · {formatIndiaDateTime(l.created_at)}
              </p>
              {!compact && (
                <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{l.address_line}</p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                size="sm"
                className="gap-1.5"
                disabled={Boolean(busyId) || confirming}
                onClick={() => setConfirm({ id: l.id, kind: 'approve', name: l.name })}
              >
                {busyId === l.id && approveMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                Approve
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-1.5 text-destructive hover:bg-destructive/10"
                disabled={Boolean(busyId) || confirming}
                onClick={() => setConfirm({ id: l.id, kind: 'reject', name: l.name })}
              >
                {busyId === l.id && rejectMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <X className="h-3.5 w-3.5" />
                )}
                Reject
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmActionDialog
        open={Boolean(confirm)}
        onOpenChange={(open) => {
          if (!open && !confirmPending) setConfirm(null);
        }}
        title={confirm?.kind === 'reject' ? 'Reject laundry?' : 'Approve laundry?'}
        description={
          confirm?.kind === 'reject'
            ? `${confirm.name} will stay undiscoverable and cannot take marketplace orders.`
            : `${confirm?.name ?? 'This laundry'} will become discoverable and can receive customer orders.`
        }
        confirmLabel={confirm?.kind === 'reject' ? 'Confirm reject' : 'Confirm approve'}
        confirmVariant={confirm?.kind === 'reject' ? 'destructive' : 'default'}
        pending={confirmPending}
        onConfirm={() => {
          if (!confirm) return;
          if (confirm.kind === 'approve') approveMutation.mutate(confirm.id);
          else rejectMutation.mutate(confirm.id);
        }}
      />
    </>
  );
}
