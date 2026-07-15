'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { QueryErrorState } from '@/components/feedback/query-error-state';
import { Skeleton } from '@/components/ui/skeleton';
import { queryKeys } from '@/lib/query-keys';
import { STALE } from '@/lib/query-config';
import { listLaundries } from '@/services/laundries';

function DiscoverListSkeleton() {
  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2" aria-busy="true" aria-label="Loading laundries">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i}>
          <Skeleton className="h-24 w-full rounded-lg" />
        </li>
      ))}
    </ul>
  );
}

export function DiscoverList() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: queryKeys.laundries(),
    queryFn: () => listLaundries(),
    staleTime: STALE.laundries,
  });

  if (isLoading) {
    return <DiscoverListSkeleton />;
  }

  if (isError) {
    return (
      <QueryErrorState
        title="Could not load laundries"
        message="Ensure the API is running and demo data is seeded."
        onRetry={() => void refetch()}
        isRetrying={isFetching}
      />
    );
  }

  if (!data?.length) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-bg-1 p-8 text-center">
        <p className="text-fg-1">No laundries in your area yet.</p>
        <Link href="/partners" className="mt-4 inline-block text-sm font-medium text-brand-500">
          Join as a partner
        </Link>
      </div>
    );
  }

  return (
    <ul className="mt-6 grid gap-4 sm:grid-cols-2">
      {data.map((l) => (
        <li key={l.id} className="rounded-lg border border-border bg-bg-1 p-4">
          <Link href={`/discover/${l.id}`} className="font-semibold hover:text-brand-500">
            {l.name}
          </Link>
          <p className="text-sm text-fg-1">
            {l.city} · ★ {l.avg_rating} ({l.review_count})
          </p>
          {l.is_verified && (
            <span className="mt-2 inline-block text-xs text-brand-500">Verified</span>
          )}
        </li>
      ))}
    </ul>
  );
}
