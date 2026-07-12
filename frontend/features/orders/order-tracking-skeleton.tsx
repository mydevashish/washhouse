import { Skeleton } from '@/components/ui/skeleton';

export function OrderTrackingSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading order">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <div className="space-y-6 pl-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
