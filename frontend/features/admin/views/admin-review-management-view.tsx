'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, Shield, Star } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AdminContent } from '@/features/admin/components/admin-content';
import { AdminPageHeader } from '@/features/admin/components/admin-page-header';
import { AdminPanel } from '@/features/admin/components/admin-panel';
import { KpiCard, KpiGrid } from '@/features/admin/components/kpi-card';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  getAdminReviewAudit,
  getAdminReviewDashboard,
  listAdminReviews,
  moderateReview,
  type ReviewManagementRow,
} from '@/services/review-management';

export function AdminReviewManagementView() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [abuseOnly, setAbuseOnly] = useState(false);
  const [fakeOnly, setFakeOnly] = useState(false);
  const [modNotes, setModNotes] = useState<Record<string, string>>({});

  const dashQ = useQuery({
    queryKey: queryKeys.adminReviewDashboard(),
    queryFn: getAdminReviewDashboard,
    staleTime: STALE.adminDashboard,
  });

  const reviewsQ = useQuery({
    queryKey: queryKeys.adminReviews(statusFilter, abuseOnly, fakeOnly),
    queryFn: () =>
      listAdminReviews({
        status: statusFilter || undefined,
        abuse_reported: abuseOnly || undefined,
        is_fake: fakeOnly || undefined,
      }),
    staleTime: 30_000,
  });

  const auditQ = useQuery({
    queryKey: queryKeys.adminReviewAudit(),
    queryFn: () => getAdminReviewAudit(),
    staleTime: 30_000,
  });

  const modM = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: 'hide' | 'remove' | 'restore' | 'mark_fake'; note?: string }) =>
      moderateReview(id, { action, note }),
    onSuccess: () => {
      toast.success('Review moderated');
      void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminReviewAudit() });
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminReviewDashboard() });
    },
    onError: () => toast.error('Moderation failed'),
  });

  const dash = dashQ.data;
  const reviews = reviewsQ.data ?? [];

  return (
    <AdminContent className="space-y-5">
      <AdminPageHeader
        title="Review management"
        description="Remove fake reviews, moderate reported content, and audit all review changes."
      />

      {dashQ.isError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(dashQ.error, 'Could not load review dashboard')}
        </p>
      )}

      <KpiGrid className="sm:grid-cols-2 lg:grid-cols-2">
        <KpiCard
          label="Moderation queue"
          value={dash ? String(dash.moderation_queue) : '—'}
          icon={Shield}
          loading={dashQ.isLoading}
          status={dash && dash.moderation_queue > 0 ? 'warning' : 'healthy'}
        />
        <KpiCard
          label="Abuse reports"
          value={dash ? String(dash.abuse_reported_total) : '—'}
          icon={Flag}
          loading={dashQ.isLoading}
          status={dash && dash.abuse_reported_total > 0 ? 'critical' : 'healthy'}
        />
      </KpiGrid>

      <AdminPanel title="Filters" bodyClassName="flex flex-wrap gap-3 px-4 py-4">
        <div className="grid gap-1.5">
          <Label>Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 w-40">
            <option value="">All</option>
            <option value="published">Published</option>
            <option value="pending_moderation">Pending moderation</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={abuseOnly} onChange={(e) => setAbuseOnly(e.target.checked)} />
          Abuse reported only
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={fakeOnly} onChange={(e) => setFakeOnly(e.target.checked)} />
          Marked fake only
        </label>
      </AdminPanel>

      {reviewsQ.isError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(reviewsQ.error, 'Could not load reviews')}
        </p>
      )}

      {reviewsQ.isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {!reviewsQ.isLoading && reviews.length === 0 && (
        <EmptyState icon={Star} title="No reviews match filters" description="Adjust filters or check back later." />
      )}

      {reviews.length > 0 && (
        <AdminPanel title="Reviews" meta={`${reviews.length} shown`} bodyClassName="divide-y divide-border/50 p-0">
          {reviews.map((r) => (
            <AdminReviewRow
              key={r.id}
              review={r}
              note={modNotes[r.id] ?? ''}
              onNote={(v) => setModNotes((n) => ({ ...n, [r.id]: v }))}
              onModerate={(action) => modM.mutate({ id: r.id, action, note: modNotes[r.id] })}
              pending={modM.isPending}
            />
          ))}
        </AdminPanel>
      )}

      <AdminPanel title="Review audit log" bodyClassName="divide-y divide-border/50 p-0">
        {auditQ.isLoading && <Skeleton className="m-4 h-24 w-full" />}
        {(auditQ.data ?? []).map((row) => (
          <div key={row.id} className="flex flex-col gap-0.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">{row.user_name} · {row.action}</p>
              <p className="text-xs text-muted-foreground">
                Review {row.review_id.slice(0, 8)}… {row.old_value ? `${row.old_value} → ${row.new_value}` : row.new_value}
                {row.note ? ` · ${row.note}` : ''}
              </p>
            </div>
            <ClientDate iso={row.timestamp} mode="datetime" className="text-[10px] text-muted-foreground" />
          </div>
        ))}
      </AdminPanel>
    </AdminContent>
  );
}

function AdminReviewRow({
  review: r,
  note,
  onNote,
  onModerate,
  pending,
}: {
  review: ReviewManagementRow;
  note: string;
  onNote: (v: string) => void;
  onModerate: (action: 'hide' | 'remove' | 'restore' | 'mark_fake') => void;
  pending: boolean;
}) {
  return (
    <div className="space-y-2 px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{r.customer_name} · {r.laundry_name}</p>
          <p className="text-xs text-muted-foreground">
            {r.rating} ★ · {r.status}
            {r.is_fake && <span className="ml-2 text-destructive">Fake</span>}
            {r.abuse_reported && <span className="ml-2 text-warning">Abuse: {r.abuse_reason}</span>}
          </p>
        </div>
        <ClientDate iso={r.created_at} mode="date" className="text-xs text-muted-foreground" />
      </div>
      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
      {r.partner_reply && <p className="text-xs italic text-muted-foreground">Partner reply: {r.partner_reply}</p>}
      <Input placeholder="Moderation note (optional)" value={note} onChange={(e) => onNote(e.target.value)} className="h-8 text-xs" />
      <div className="flex flex-wrap gap-1.5">
        <Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => onModerate('hide')}>Hide</Button>
        <Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => onModerate('remove')}>Remove</Button>
        <Button size="sm" variant="outline" className="h-8" disabled={pending} onClick={() => onModerate('restore')}>Restore</Button>
        <Button size="sm" variant="destructive" className="h-8" disabled={pending} onClick={() => onModerate('mark_fake')}>Mark fake</Button>
      </div>
    </div>
  );
}
