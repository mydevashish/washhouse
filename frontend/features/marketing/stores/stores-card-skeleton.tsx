import { Skeleton } from '@/components/ui/skeleton';

export function StoresCardSkeleton() {
  return (
    <div className="rounded-xl border border-border/80 bg-card px-4 py-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="flex-1 space-y-2 pt-0.5">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="ml-auto h-9 w-24 rounded-md" />
      </div>
    </div>
  );
}
