import { Skeleton } from '@/components/ui/skeleton';

/** Matches StoresCard anatomy: cover → meta → service strip → actions. */
export function StoresCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60">
      <div className="relative aspect-[5/3] bg-muted">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-4">
          <Skeleton className="h-6 w-2/3 bg-white/25" />
          <Skeleton className="h-4 w-1/3 bg-white/20" />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Skeleton className="h-7 w-20 rounded-md" />
          <Skeleton className="h-7 w-24 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
          <Skeleton className="h-7 w-16 rounded-md" />
        </div>
        <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-3">
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="h-11 w-11 rounded-md" />
          <Skeleton className="ml-auto h-11 w-[7.5rem] rounded-md" />
        </div>
      </div>
    </div>
  );
}
