import { Skeleton } from '@/components/ui/skeleton';

export function LaundryDetailSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="overflow-hidden rounded-3xl border border-border">
        <Skeleton className="aspect-[5/3] max-h-[260px] w-full rounded-none sm:max-h-[300px]" />
        <div className="space-y-4 p-4 sm:p-6">
          <div className="-mt-14 flex gap-4">
            <Skeleton className="h-[5.5rem] w-[5.5rem] shrink-0 rounded-2xl" />
            <div className="flex-1 space-y-2 pt-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
      <Skeleton className="mt-8 h-14 w-full rounded-xl" />
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
