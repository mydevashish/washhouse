import Link from 'next/link';

import { PublicShell } from '@/components/layout/public-shell';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <PublicShell>
      <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center px-4 py-12 text-center">
        <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">404</p>
        <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
          Page not found
        </h1>
        <p className="mt-3 text-muted-foreground">
          The link may be broken or the page may have moved.
        </p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/discover">Browse laundries</Link>
        </Button>
      </main>
    </PublicShell>
  );
}
