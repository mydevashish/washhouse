'use client';

import { ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useSmartBack } from '@/hooks/use-smart-back';
import type { AppContext } from '@/lib/navigation/types';
import { cn } from '@/lib/utils';

function appFromPath(pathname: string): AppContext {
  if (pathname.startsWith('/admin')) return 'admin';
  if (pathname.startsWith('/partner')) return 'partner';
  return 'customer';
}

type BackLinkProps = {
  className?: string;
  app?: AppContext;
};

/** Legacy back control — prefer NavbarBackButton inside GlobalNavbar. */
export function BackLink({ className, app }: BackLinkProps) {
  const pathname = usePathname();
  const resolvedApp = app ?? appFromPath(pathname);
  const { goBack, visible, ariaLabel } = useSmartBack(resolvedApp);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={goBack}
      className={cn(
        'inline-flex min-h-[44px] items-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground',
        className,
      )}
      aria-label={ariaLabel}
    >
      <ArrowLeft className="h-4 w-4" aria-hidden />
      <span>Back</span>
    </button>
  );
}
