import { Skeleton } from '@/components/ui/skeleton';

export function StoresCardSkeleton() {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-card px-4 py-4">
      <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
      <div className="flex-1 space-y-2 pt-0.5">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}
