'use client';

import dynamic from 'next/dynamic';

import { Skeleton } from '@/components/ui/skeleton';

export const AdminDashboardLazy = dynamic(
  () => import('@/features/admin/views/admin-overview-view').then((m) => m.AdminOverviewView),
  {
    loading: () => (
      <div className="space-y-6" aria-busy="true" aria-label="Loading admin dashboard">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    ),
    ssr: false,
  },
);
