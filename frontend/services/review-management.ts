import { api, type ApiEnvelope } from '@/lib/api';

export interface ReviewManagementRow {
  id: string;
  laundry_id: string;
  laundry_name: string | null;
  user_id: string;
  customer_name: string;
  order_id: string;
  rating: number;
  comment: string | null;
  status: string;
  partner_reply: string | null;
  partner_replied_at: string | null;
  abuse_reported: boolean;
  abuse_reason: string | null;
  is_fake: boolean;
  moderation_note: string | null;
  created_at: string;
}

export interface ReviewAnalytics {
  avg_rating: string;
  review_count: number;
  positive_reviews: number;
  negative_reviews: number;
  rating_trend: Array<{ date: string; avg_rating: number; review_count: number }>;
  common_complaints: Array<{ theme: string; count: number }>;
  common_praise: Array<{ theme: string; count: number }>;
}

export interface ReviewAuditRow {
  id: string;
  timestamp: string;
  user_name: string;
  action: string;
  review_id: string;
  old_value: string | null;
  new_value: string | null;
  note: string | null;
}

export async function listPartnerReviews(params?: {
  rating?: number;
  min_rating?: number;
  max_rating?: number;
  has_reply?: boolean;
  abuse_reported?: boolean;
}): Promise<ReviewManagementRow[]> {
  const { data } = await api.get<ApiEnvelope<ReviewManagementRow[]>>('/partner/review-management/reviews', { params });
  return data.data;
}

export async function getPartnerReviewAnalytics(): Promise<ReviewAnalytics> {
  const { data } = await api.get<ApiEnvelope<ReviewAnalytics>>('/partner/review-management/analytics');
  return data.data;
}

export async function replyToReview(reviewId: string, reply: string): Promise<ReviewManagementRow> {
  const { data } = await api.post<ApiEnvelope<ReviewManagementRow>>(
    `/partner/review-management/reviews/${reviewId}/reply`,
    { reply },
  );
  return data.data;
}

export async function reportReviewAbuse(reviewId: string, reason: string): Promise<ReviewManagementRow> {
  const { data } = await api.post<ApiEnvelope<ReviewManagementRow>>(
    `/partner/review-management/reviews/${reviewId}/report-abuse`,
    { reason },
  );
  return data.data;
}

export async function listAdminReviews(params?: {
  status?: string;
  abuse_reported?: boolean;
  is_fake?: boolean;
}): Promise<ReviewManagementRow[]> {
  const { data } = await api.get<ApiEnvelope<ReviewManagementRow[]>>('/admin/review-management/reviews', { params });
  return data.data;
}

export async function moderateReview(
  reviewId: string,
  body: { action: 'hide' | 'remove' | 'restore' | 'mark_fake'; note?: string },
): Promise<ReviewManagementRow> {
  const { data } = await api.patch<ApiEnvelope<ReviewManagementRow>>(
    `/admin/review-management/reviews/${reviewId}/moderate`,
    body,
  );
  return data.data;
}

export async function getAdminReviewAudit(reviewId?: string): Promise<ReviewAuditRow[]> {
  const { data } = await api.get<ApiEnvelope<ReviewAuditRow[]>>('/admin/review-management/audit', {
    params: reviewId ? { review_id: reviewId } : undefined,
  });
  return data.data;
}

export async function getAdminReviewDashboard(): Promise<{ moderation_queue: number; abuse_reported_total: number }> {
  const { data } = await api.get<ApiEnvelope<{ moderation_queue: number; abuse_reported_total: number }>>(
    '/admin/review-management/dashboard',
  );
  return data.data;
}
