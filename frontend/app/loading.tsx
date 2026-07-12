import { WashhouseLoader } from '@/components/brand/washhouse-loader';

/**
 * Root App Router loading UI — branded WashHouse loader + light content hint.
 * WashhouseLoader owns role="status" / aria-live; skeletons are decorative only.
 */
export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-screen-xl flex-col items-center justify-center px-4 py-10 sm:px-6">
      <WashhouseLoader size="lg" label="Loading…" />

      {/* Reserved hint bars — fixed heights, no layout animation */}
      <div className="mt-10 w-full max-w-md space-y-3" aria-hidden>
        <div className="h-8 w-full animate-pulse rounded-md bg-bg-2 motion-reduce:animate-none" />
        <div className="h-4 w-4/5 animate-pulse rounded-md bg-bg-2 motion-reduce:animate-none" />
        <div className="h-4 w-3/5 animate-pulse rounded-md bg-bg-2 motion-reduce:animate-none" />
      </div>
    </div>
  );
}
