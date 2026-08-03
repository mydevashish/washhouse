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
import { PRELAUNCH_STATS } from '@/lib/prelaunch-stats';
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
    enabled: !PRELAUNCH_STATS,
  });

  const stats = useMemo(() => {
    if (PRELAUNCH_STATS) return MARKETING_STATS_FALLBACK;
    if (query.data) return mapMarketingStatsToDisplay(query.data);
    return MARKETING_STATS_FALLBACK;
  }, [query.data]);

  return {
    stats,
    isLoading: !PRELAUNCH_STATS && query.isLoading,
    isError: !PRELAUNCH_STATS && query.isError,
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
