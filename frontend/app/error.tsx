'use client';

import Link from 'next/link';

import { PublicShell } from '@/components/layout/public-shell';
import { Button } from '@/components/ui/button';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PublicShell>
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Error
        </p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-muted-foreground">
          {error.digest
            ? `Reference: ${error.digest}`
            : 'We have logged this issue. Please try again.'}
        </p>
        {isDevelopment && error.message ? (
          <p className="mt-3 max-w-full break-words rounded-md bg-muted px-3 py-2 font-mono text-left text-xs text-muted-foreground">
            {error.message}
          </p>
        ) : null}
        <div className="mt-8 flex w-full max-w-xs flex-col gap-3 sm:flex-row sm:max-w-none sm:justify-center">
          <Button type="button" size="lg" className="w-full sm:w-auto" onClick={() => reset()}>
            Try again
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
            <Link href="/discover">Go to Discover</Link>
          </Button>
        </div>
      </main>
    </PublicShell>
  );
}
