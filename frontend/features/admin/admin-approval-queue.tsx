'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, Store, X } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { InfoBanner } from '@/components/ui/info-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { formatIndiaDateTime } from '@/lib/datetime';
import { queryKeys } from '@/lib/query-keys';
import { approveLaundry, listPendingLaundries, rejectLaundry } from '@/services/admin';

export function AdminApprovalQueue({ compact = false }: { compact?: boolean }) {
  const queryClient = useQueryClient();
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
      invalidate();
    },
    onError: () => toast.error('Approval failed'),
  });

  const rejectMutation = useMutation({
    mutationFn: rejectLaundry,
    onSuccess: () => {
      toast.success('Laundry rejected');
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
      <InfoBanner variant="destructive" title="Could not load approval queue">
        Refresh the page or try again shortly.
      </InfoBanner>
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

  return (
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
              disabled={Boolean(busyId)}
              onClick={() => approveMutation.mutate(l.id)}
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
              disabled={Boolean(busyId)}
              onClick={() => rejectMutation.mutate(l.id)}
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
  );
}
