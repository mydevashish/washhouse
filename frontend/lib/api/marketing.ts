import { z } from 'zod';

import { api, type ApiEnvelope } from '@/lib/api';

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
  avatarUrl: z.string().optional(),
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

export const marketingBookNowCreateSchema = z.object({
  name: z.string().min(1).max(100),
  phone: z.string().min(8).max(20),
  service: z.string().min(1).max(100),
  preferred_time: z.string().min(1).max(100),
  message: z.string().min(10).max(2000),
});

export type MarketingSubmissionResponse = {
  success: true;
  message: string;
};
export type MarketingPublicStats = z.infer<typeof marketingPublicStatsSchema>;
export type MarketingTestimonialApi = z.infer<typeof marketingTestimonialSchema>;
export type MarketingContactCreate = z.infer<typeof marketingContactCreateSchema>;
export type MarketingFranchiseInquiryCreate = z.infer<typeof marketingFranchiseInquiryCreateSchema>;
export type MarketingBookNowCreate = z.infer<typeof marketingBookNowCreateSchema>;

const marketingApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

async function postMarketingForm(
  path: string,
  body: unknown,
  fallbackError: string,
): Promise<MarketingSubmissionResponse> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const raw: unknown = await response.json().catch(() => null);
  const parsed = marketingApiResponseSchema.safeParse(raw);
  const message =
    parsed.success && parsed.data.message?.trim()
      ? parsed.data.message
      : fallbackError;

  if (!response.ok || !parsed.success || parsed.data.success !== true) {
    throw new Error(message);
  }

  return { success: true, message };
}

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
  return postMarketingForm(
    '/api/marketing/contact',
    marketingContactCreateSchema.parse(payload),
    'Could not send your message. Try again or email us directly.',
  );
}

export async function submitMarketingFranchiseInquiry(
  payload: MarketingFranchiseInquiryCreate,
): Promise<MarketingSubmissionResponse> {
  return postMarketingForm(
    '/api/marketing/franchise-inquiries',
    marketingFranchiseInquiryCreateSchema.parse(payload),
    'Could not submit your application. Try again or email us directly.',
  );
}

export async function submitMarketingBookNow(
  payload: MarketingBookNowCreate,
): Promise<MarketingSubmissionResponse> {
  return postMarketingForm(
    '/api/marketing/book-now',
    marketingBookNowCreateSchema.parse(payload),
    'Could not send your pickup request. Try again or call us directly.',
  );
}
