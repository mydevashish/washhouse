import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type QuickPickSkeletonProps = {
  className?: string;
};

/** Layout-matched loading state for the stores quick-pick sheet (spotlight + rows). */
export function QuickPickSkeleton({ className }: QuickPickSkeletonProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 md:grid md:grid-cols-[1.15fr_1fr] md:items-start md:gap-4',
        className,
      )}
      role="status"
      aria-busy="true"
      aria-label="Loading nearby stores"
    >
      <div className="flex flex-col overflow-hidden rounded-xl bg-card shadow-soft ring-1 ring-border/60">
        <div className="relative aspect-[16/9] max-h-[40vh] overflow-hidden bg-muted md:aspect-[4/3] md:max-h-[36vh]">
          <Skeleton className="absolute inset-0 rounded-none motion-reduce:animate-none" />
          <div className="absolute inset-x-0 bottom-0 space-y-2 p-3 sm:p-4">
            <Skeleton className="h-6 w-2/3 bg-white/25 motion-reduce:animate-none" />
            <Skeleton className="h-4 w-1/3 bg-white/20 motion-reduce:animate-none" />
          </div>
        </div>
        <div className="flex items-center gap-2 p-3 sm:p-4">
          <Skeleton className="h-11 min-h-11 flex-1 rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-11 w-11 shrink-0 rounded-md motion-reduce:animate-none" />
          <Skeleton className="h-11 w-11 shrink-0 rounded-md motion-reduce:animate-none" />
        </div>
      </div>

      <ul className="flex flex-col gap-2 md:gap-3" aria-hidden>
        {[0, 1].map((i) => (
          <li
            key={i}
            className="flex items-center gap-2 rounded-xl border border-border/80 bg-card p-2 pr-1.5"
          >
            <Skeleton className="h-12 w-12 shrink-0 rounded-lg sm:h-14 sm:w-14 motion-reduce:animate-none" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5 motion-reduce:animate-none" />
              <Skeleton className="h-3.5 w-2/5 motion-reduce:animate-none" />
            </div>
            <Skeleton className="h-11 w-11 shrink-0 rounded-md motion-reduce:animate-none" />
            <Skeleton className="h-11 w-11 shrink-0 rounded-md motion-reduce:animate-none" />
          </li>
        ))}
      </ul>
    </div>
  );
}
