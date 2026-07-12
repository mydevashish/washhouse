'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { ClientDate } from '@/components/ui/client-date';
import { Select } from '@/components/ui/select';
import { queryKeys } from '@/lib/query-keys';
import {
  assignDispute,
  type DisputeAdminRow,
  type DisputeAssignee,
  type DisputeTableFilters,
} from '@/services/disputes';

function staffInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

type Props = {
  row: DisputeAdminRow;
  assignees: DisputeAssignee[];
  filterKey: DisputeTableFilters;
  compact?: boolean;
};

export function DisputeAssigneeCell({ row, assignees, filterKey, compact }: Props) {
  const queryClient = useQueryClient();

  const assignM = useMutation({
    mutationFn: (assignedToUserId: string | null) =>
      assignDispute(row.id, assignedToUserId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputesTable(filterKey) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputeMetrics() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminDisputeDetail(row.id) });
      toast.success('Assignment updated');
    },
    onError: () => toast.error('Could not update assignment'),
  });

  const handleChange = (value: string) => {
    const next = value || null;
    if (next === (row.assigned_to_user_id ?? '')) return;
    assignM.mutate(next);
  };

  return (
    <div className="flex min-w-[140px] items-start gap-2">
      {row.assigned_to_name ? (
        <span
          className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary"
          title={row.assigned_to_email ?? row.assigned_to_name}
        >
          {staffInitials(row.assigned_to_name)}
        </span>
      ) : (
        <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-[10px] text-muted-foreground">
          —
        </span>
      )}
      <div className="min-w-0 flex-1 space-y-0.5">
        <div className="relative">
          <Select
            className="h-7 min-h-0 py-0.5 pl-0 text-xs"
            value={row.assigned_to_user_id ?? ''}
            disabled={assignM.isPending}
            onChange={(e) => handleChange(e.target.value)}
            aria-label={`Assign dispute ${row.id}`}
          >
            <option value="">Unassigned</option>
            {assignees.map((a) => (
              <option key={a.id} value={a.id}>
                {a.full_name} ({a.role_label})
              </option>
            ))}
          </Select>
          {assignM.isPending && (
            <Loader2
              className="pointer-events-none absolute right-6 top-1.5 h-3.5 w-3.5 animate-spin text-muted-foreground"
              aria-hidden
            />
          )}
        </div>
        {!compact && row.assigned_at && (
          <span className="block text-[10px] text-muted-foreground">
            Assigned <ClientDate iso={row.assigned_at} mode="datetime" className="inline" />
          </span>
        )}
      </div>
    </div>
  );
}
