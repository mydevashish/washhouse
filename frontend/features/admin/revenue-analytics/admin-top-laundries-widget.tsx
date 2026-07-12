'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { TopLaundriesLeaderboard } from '@/features/admin/revenue-analytics/top-laundries-leaderboard';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { getRevenueAnalyticsDashboard } from '@/services/revenue-analytics';

export function AdminTopLaundriesWidget() {
  const router = useRouter();
  const q = useQuery({
    queryKey: queryKeys.adminRevenueAnalytics({ period: 'last_30_days' }),
    queryFn: () => getRevenueAnalyticsDashboard({ period: 'last_30_days' }),
    staleTime: STALE.adminDashboard,
  });

  return (
    <TopLaundriesLeaderboard
      rows={q.data?.top_laundries ?? []}
      compact
      onSelect={(id) => router.push(`/admin/revenue/analytics?laundry=${id}`)}
    />
  );
}
