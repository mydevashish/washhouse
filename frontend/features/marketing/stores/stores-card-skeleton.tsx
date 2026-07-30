import { Skeleton } from '@/components/ui/skeleton';

/** Matches StoresCard anatomy: cover → name/location → Call / Message / Get Location. */
export function StoresCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60">
      <div className="relative aspect-[5/3] bg-muted">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 sm:p-4">
          <Skeleton className="h-6 w-2/3 bg-white/25" />
          <Skeleton className="h-4 w-1/3 bg-white/20" />
        </div>
      </div>
      <div className="mt-auto flex flex-1 flex-col justify-end p-3 sm:p-4">
        <div className="flex flex-wrap gap-2 border-t border-border/60 pt-3">
          <Skeleton className="h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] rounded-md" />
          <Skeleton className="h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] rounded-md" />
          <Skeleton className="h-11 min-w-[8.5rem] flex-1 basis-[calc(50%-0.25rem)] rounded-md" />
        </div>
      </div>
    </div>
  );
}
