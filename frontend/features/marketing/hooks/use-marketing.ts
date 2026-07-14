'use client';

import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';

import {
  MARKETING_STATS_FALLBACK,
  mapMarketingStatsToDisplay,
} from '@/features/marketing/home/stats-fallback';
import { MARKETING_TESTIMONIALS_FALLBACK } from '@/features/marketing/testimonials/testimonials-fallback';
import type { MarketingTestimonial } from '@/features/marketing/testimonials/types';
import {
  getMarketingStats,
  getMarketingTestimonials,
  submitMarketingContact,
  submitMarketingFranchiseInquiry,
  type MarketingContactCreate,
  type MarketingFranchiseInquiryCreate,
} from '@/lib/api/marketing';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';

function selectDisplayTestimonials(items: MarketingTestimonial[]): MarketingTestimonial[] {
  const featured = items.filter((item) => item.isFeatured);
  return featured.length > 0 ? featured : items;
}

export function useMarketingStats() {
  const query = useQuery({
    queryKey: queryKeys.marketingStats(),
    queryFn: getMarketingStats,
    staleTime: STALE.marketingStats,
  });

  const stats = useMemo(() => {
    if (query.data) return mapMarketingStatsToDisplay(query.data);
    if (query.isError) return MARKETING_STATS_FALLBACK;
    return MARKETING_STATS_FALLBACK;
  }, [query.data, query.isError]);

  return {
    stats,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useMarketingTestimonials(limit = 6) {
  const query = useQuery({
    queryKey: queryKeys.marketingTestimonials(limit),
    queryFn: () => getMarketingTestimonials(limit),
    staleTime: STALE.marketingTestimonials,
  });

  const testimonials = useMemo(() => {
    const source = query.isError
      ? MARKETING_TESTIMONIALS_FALLBACK
      : query.data && query.data.length > 0
        ? query.data
        : query.isSuccess
          ? MARKETING_TESTIMONIALS_FALLBACK
          : [];

    return selectDisplayTestimonials(
      source.length > 0 ? source : MARKETING_TESTIMONIALS_FALLBACK,
    );
  }, [query.data, query.isError, query.isSuccess]);

  return {
    testimonials,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useSubmitContact() {
  return useMutation({
    mutationFn: (payload: MarketingContactCreate) => submitMarketingContact(payload),
  });
}

export function useSubmitFranchiseInquiry() {
  return useMutation({
    mutationFn: (payload: MarketingFranchiseInquiryCreate) =>
      submitMarketingFranchiseInquiry(payload),
  });
}
