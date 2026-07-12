'use client';

import { ArrowLeft } from 'lucide-react';

import { useSmartBack } from '@/hooks/use-smart-back';
import type { AppContext } from '@/lib/navigation/types';
import { cn } from '@/lib/utils';

export function NavbarBackButton({
  app,
  className,
}: {
  app: AppContext;
  className?: string;
}) {
  const { goBack, visible, ariaLabel } = useSmartBack(app);
  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        'inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md px-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
