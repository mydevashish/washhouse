import { z } from 'zod';

import { api, type ApiEnvelope } from '@/lib/api';

const marketingSubmissionResponseSchema = z.object({
  id: z.string().uuid(),
  status: z.string(),
});

const marketingPublicStatsSchema = z.object({
  happy_customers: z.number().int().nonnegative(),
  cities_covered: z.number().int().nonnegative(),
  pickup_points: z.number().int().nonnegative(),
  garments_cleaned: z.number().int().nonnegative(),
  avg_review_rating: z.number().nullable().optional(),
  customer_satisfaction_percent: z.number().int().nullable().optional(),
});

const marketingTestimonialSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  location: z.string(),
  rating: z.number().int().min(1).max(5),
  text: z.string(),
  avatarUrl: z.string(),
  isFeatured: z.boolean(),
});

const marketingTestimonialsSchema = z.array(marketingTestimonialSchema);

export const marketingContactSubjectSchema = z.enum([
  'general',
  'order-help',
  'franchise',
  'partnership',
  'legal-privacy',
]);

export const marketingInvestmentRangeSchema = z.enum(['10-25', '25-50', '50-plus', 'unsure']);

export const marketingContactCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email().optional(),
  subject: marketingContactSubjectSchema,
  message: z.string().min(10).max(2000),
});

export const marketingFranchiseInquiryCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  email: z.string().email(),
  city: z.string().min(1).max(100),
  investment_range: marketingInvestmentRangeSchema,
  message: z.string().min(10).max(2000),
});

export type MarketingSubmissionResponse = z.infer<typeof marketingSubmissionResponseSchema>;
export type MarketingPublicStats = z.infer<typeof marketingPublicStatsSchema>;
export type MarketingTestimonialApi = z.infer<typeof marketingTestimonialSchema>;
export type MarketingContactCreate = z.infer<typeof marketingContactCreateSchema>;
export type MarketingFranchiseInquiryCreate = z.infer<typeof marketingFranchiseInquiryCreateSchema>;

function parseEnvelope<T>(schema: z.ZodType<T>, payload: unknown): T {
  return schema.parse(payload);
}

export async function getMarketingStats(): Promise<MarketingPublicStats> {
  const { data } = await api.get<ApiEnvelope<unknown>>('/marketing/stats');
  return parseEnvelope(marketingPublicStatsSchema, data.data);
}

export async function getMarketingTestimonials(limit = 6): Promise<MarketingTestimonialApi[]> {
  const { data } = await api.get<ApiEnvelope<unknown>>('/marketing/testimonials', {
    params: { limit },
  });
  return parseEnvelope(marketingTestimonialsSchema, data.data);
}

export async function submitMarketingContact(
  payload: MarketingContactCreate,
): Promise<MarketingSubmissionResponse> {
  const body = marketingContactCreateSchema.parse(payload);
  const { data } = await api.post<ApiEnvelope<unknown>>('/marketing/contact', body);
  return parseEnvelope(marketingSubmissionResponseSchema, data.data);
}

export async function submitMarketingFranchiseInquiry(
  payload: MarketingFranchiseInquiryCreate,
): Promise<MarketingSubmissionResponse> {
  const body = marketingFranchiseInquiryCreateSchema.parse(payload);
  const { data } = await api.post<ApiEnvelope<unknown>>('/marketing/franchise-inquiries', body);
  return parseEnvelope(marketingSubmissionResponseSchema, data.data);
}
