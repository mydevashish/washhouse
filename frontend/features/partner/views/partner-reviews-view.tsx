'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Flag, MessageSquare, Star, ThumbsDown, ThumbsUp, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ClientDate } from '@/components/ui/client-date';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { PartnerContent, PartnerPageHeader } from '@/features/partner/components/partner-content';
import { PartnerKpiCard, PartnerKpiGrid } from '@/features/partner/components/partner-kpi-card';
import { PartnerPanel } from '@/features/partner/components/partner-panel';
import { ReviewRatingTrendChart } from '@/features/partner/reviews/review-rating-trend-chart';
import { usePartnerQueriesEnabled } from '@/features/partner/hooks/use-partner-operations';
import { getApiErrorMessage } from '@/lib/api-error-message';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import {
  getPartnerReviewAnalytics,
  listPartnerReviews,
  replyToReview,
  reportReviewAbuse,
  type ReviewManagementRow,
} from '@/services/review-management';
import { cn } from '@/lib/utils';

export function PartnerReviewsView() {
  const queryClient = useQueryClient();
  const enabled = usePartnerQueriesEnabled();
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyFilter, setReplyFilter] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [abuseDrafts, setAbuseDrafts] = useState<Record<string, string>>({});

  const analyticsQ = useQuery({
    queryKey: queryKeys.partnerReviewAnalytics(),
    queryFn: getPartnerReviewAnalytics,
    enabled,
    staleTime: STALE.adminDashboard,
  });

  const reviewsQ = useQuery({
    queryKey: queryKeys.partnerReviews(ratingFilter, replyFilter, sentimentFilter),
    queryFn: () =>
      listPartnerReviews({
        rating: ratingFilter ? Number(ratingFilter) : undefined,
        min_rating: sentimentFilter === 'positive' ? 4 : undefined,
        max_rating: sentimentFilter === 'negative' ? 2 : undefined,
        has_reply: replyFilter === 'yes' ? true : replyFilter === 'no' ? false : undefined,
      }),
    enabled,
    staleTime: 30_000,
  });

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.partnerReviewAnalytics() });
    void queryClient.invalidateQueries({ queryKey: ['partner-reviews'] });
  };

  const replyM = useMutation({
    mutationFn: ({ id, reply }: { id: string; reply: string }) => replyToReview(id, reply),
    onSuccess: () => { toast.success('Reply posted'); invalidate(); },
    onError: () => toast.error('Could not post reply'),
  });

  const abuseM = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => reportReviewAbuse(id, reason),
    onSuccess: () => { toast.success('Abuse reported to admin'); invalidate(); },
    onError: () => toast.error('Could not report review'),
  });

  const analytics = analyticsQ.data;
  const reviews = reviewsQ.data ?? [];

  return (
    <PartnerContent className="space-y-5">
      <PartnerPageHeader
        title="Review management"
        description="View customer feedback, reply publicly, filter reviews, and report abuse."
      />

      {analyticsQ.isError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(analyticsQ.error, 'Could not load review analytics')}
        </p>
      )}

      {analyticsQ.isLoading && <Skeleton className="h-24 w-full rounded-2xl" />}
      {analytics && (
        <PartnerKpiGrid className="lg:grid-cols-3 xl:grid-cols-6">
          <PartnerKpiCard label="Average rating" value={`${analytics.avg_rating} ★`} icon={Star} loading={false} accent="success" />
          <PartnerKpiCard label="Total reviews" value={String(analytics.review_count)} icon={MessageSquare} loading={false} />
          <PartnerKpiCard label="Positive reviews" value={String(analytics.positive_reviews)} hint="4–5 ★" icon={ThumbsUp} loading={false} accent="success" />
          <PartnerKpiCard label="Negative reviews" value={String(analytics.negative_reviews)} hint="1–2 ★" icon={ThumbsDown} loading={false} accent="warning" />
          <PartnerKpiCard
            label="Rating trend"
            value={
              analytics.rating_trend.length
                ? `${analytics.rating_trend.filter((t) => t.review_count > 0).at(-1)?.avg_rating.toFixed(1) ?? analytics.avg_rating} ★`
                : `${analytics.avg_rating} ★`
            }
            hint="Latest daily avg"
            icon={TrendingUp}
            loading={false}
          />
          <PartnerKpiCard
            label="Top praise"
            value={analytics.common_praise[0]?.theme ?? '—'}
            hint={analytics.common_praise[0] ? `${analytics.common_praise[0].count} mentions` : undefined}
            icon={Star}
            loading={false}
          />
        </PartnerKpiGrid>
      )}

      <ReviewRatingTrendChart data={analytics} loading={analyticsQ.isLoading} />

      <div className="grid gap-4 lg:grid-cols-2">
        {analytics && (
          <PartnerPanel title="Most common complaints" bodyClassName="px-4 py-3">
            {analytics.common_complaints.length === 0 && <p className="text-sm text-muted-foreground">No complaint themes yet.</p>}
            {analytics.common_complaints.map((c) => (
              <div key={c.theme} className="flex justify-between py-1 text-sm">
                <span>{c.theme}</span>
                <span className="font-medium tabular-nums">{c.count}</span>
              </div>
            ))}
          </PartnerPanel>
        )}
        {analytics && (
          <PartnerPanel title="Most common praise" bodyClassName="px-4 py-3">
            {analytics.common_praise.length === 0 && <p className="text-sm text-muted-foreground">No praise themes yet.</p>}
            {analytics.common_praise.map((c) => (
              <div key={c.theme} className="flex justify-between py-1 text-sm">
                <span>{c.theme}</span>
                <span className="font-medium tabular-nums">{c.count}</span>
              </div>
            ))}
          </PartnerPanel>
        )}
      </div>

      <PartnerPanel title="Filter reviews" bodyClassName="flex flex-wrap gap-3 px-4 py-4">
        <div className="grid gap-1.5">
          <Label htmlFor="rating-filter">Rating</Label>
          <Select id="rating-filter" value={ratingFilter} onChange={(e) => { setRatingFilter(e.target.value); if (e.target.value) setSentimentFilter(''); }} className="h-9 w-32">
            <option value="">All</option>
            {[5, 4, 3, 2, 1].map((r) => (
              <option key={r} value={String(r)}>{r} stars</option>
            ))}
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reply-filter">Reply status</Label>
          <Select id="reply-filter" value={replyFilter} onChange={(e) => setReplyFilter(e.target.value)} className="h-9 w-36">
            <option value="">All</option>
            <option value="no">Needs reply</option>
            <option value="yes">Replied</option>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="sentiment-filter">Sentiment</Label>
          <Select
            id="sentiment-filter"
            value={sentimentFilter}
            onChange={(e) => {
              setSentimentFilter(e.target.value);
              if (e.target.value) setRatingFilter('');
            }}
            className="h-9 w-36"
          >
            <option value="">All</option>
            <option value="positive">Positive (4–5★)</option>
            <option value="negative">Negative (1–2★)</option>
          </Select>
        </div>
      </PartnerPanel>

      {reviewsQ.isError && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {getApiErrorMessage(reviewsQ.error, 'Could not load reviews')}
        </p>
      )}

      {reviewsQ.isLoading && <Skeleton className="h-48 w-full rounded-2xl" />}
      {!reviewsQ.isLoading && reviews.length === 0 && (
        <EmptyState icon={Star} title="No reviews yet" description="Customer feedback will appear here after delivery." />
      )}

      {reviews.length > 0 && (
        <PartnerPanel bodyClassName="divide-y divide-border/50">
          {reviews.map((r) => (
            <ReviewRow
              key={r.id}
              review={r}
              replyDraft={replyDrafts[r.id] ?? r.partner_reply ?? ''}
              abuseDraft={abuseDrafts[r.id] ?? ''}
              onReplyDraft={(v) => setReplyDrafts((d) => ({ ...d, [r.id]: v }))}
              onAbuseDraft={(v) => setAbuseDrafts((d) => ({ ...d, [r.id]: v }))}
              onReply={() => replyM.mutate({ id: r.id, reply: replyDrafts[r.id] ?? '' })}
              onReport={() => abuseM.mutate({ id: r.id, reason: abuseDrafts[r.id] ?? '' })}
              replyPending={replyM.isPending}
              abusePending={abuseM.isPending}
            />
          ))}
        </PartnerPanel>
      )}
    </PartnerContent>
  );
}

function ReviewRow({
  review: r,
  replyDraft,
  abuseDraft,
  onReplyDraft,
  onAbuseDraft,
  onReply,
  onReport,
  replyPending,
  abusePending,
}: {
  review: ReviewManagementRow;
  replyDraft: string;
  abuseDraft: string;
  onReplyDraft: (v: string) => void;
  onAbuseDraft: (v: string) => void;
  onReply: () => void;
  onReport: () => void;
  replyPending: boolean;
  abusePending: boolean;
}) {
  const [showAbuse, setShowAbuse] = useState(false);
  return (
    <article className="space-y-3 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="font-medium">{r.customer_name}</p>
          <p className="text-xs text-muted-foreground">
            <ClientDate iso={r.created_at} mode="date" /> · {r.status}
            {r.abuse_reported && <span className="ml-2 text-warning">Reported</span>}
          </p>
        </div>
        <span className={cn('text-sm font-semibold', r.rating <= 2 ? 'text-destructive' : r.rating >= 4 ? 'text-success' : '')}>
          {r.rating} ★
        </span>
      </div>
      {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
      {r.partner_reply && (
        <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
          <p className="text-xs font-semibold text-muted-foreground">Your reply</p>
          <p>{r.partner_reply}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor={`reply-${r.id}`}>Reply</Label>
        <Textarea id={`reply-${r.id}`} value={replyDraft} onChange={(e) => onReplyDraft(e.target.value)} rows={2} className="text-sm" />
        <div className="flex flex-wrap gap-2">
          <Button size="sm" disabled={!replyDraft.trim() || replyPending} onClick={onReply}>Post reply</Button>
          {!r.abuse_reported && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => setShowAbuse(!showAbuse)}>
              <Flag className="h-3.5 w-3.5" aria-hidden /> Report abuse
            </Button>
          )}
        </div>
      </div>
      {showAbuse && !r.abuse_reported && (
        <div className="space-y-2 rounded-lg border border-border/50 p-3">
          <Input placeholder="Reason for abuse report" value={abuseDraft} onChange={(e) => onAbuseDraft(e.target.value)} className="h-9 text-sm" />
          <Button size="sm" variant="destructive" disabled={abuseDraft.trim().length < 5 || abusePending} onClick={onReport}>
            Submit report
          </Button>
        </div>
      )}
    </article>
  );
}
