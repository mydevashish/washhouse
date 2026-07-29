'use client';

import { Loader2, LocateFixed, MapPinOff } from 'lucide-react';

import { Button } from '@/components/ui/button';
import type { GeolocationStatus } from '@/hooks/use-geolocation';
import { cn } from '@/lib/utils';

type StoresNearMeControlProps = {
  status: GeolocationStatus;
  errorMessage: string | null;
  onRequest: () => void;
  onClear: () => void;
  /** Compact pill for sticky / cluster rows — status text stays polite but tighter. */
  compact?: boolean;
  className?: string;
};

export function StoresNearMeControl({
  status,
  errorMessage,
  onRequest,
  onClear,
  compact = false,
  className,
}: StoresNearMeControlProps) {
  const isPending = status === 'pending';
  const isActive = status === 'granted';
  const failed =
    status === 'denied' || status === 'unavailable' || status === 'error';

  return (
    <div className={cn(compact ? 'space-y-1.5' : 'space-y-2', className)}>
      <div
        className={cn(
          'flex items-center gap-2',
          compact ? 'flex-nowrap' : 'flex-wrap',
        )}
      >
        <Button
          type="button"
          variant={isActive ? 'default' : 'outline'}
          size="sm"
          className={cn(
            'h-11 min-h-11 shrink-0 gap-2 rounded-full',
            compact ? 'px-3.5' : 'px-4',
            // Soft pulse while GPS resolves — state signal, not decoration
            isPending && 'animate-washhouse-pulse motion-reduce:animate-none',
          )}
          aria-pressed={isActive}
          aria-busy={isPending}
          disabled={isPending}
          onClick={() => {
            if (isActive) onClear();
            else void onRequest();
          }}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          ) : (
            <LocateFixed className="h-4 w-4" aria-hidden />
          )}
          <span className={cn(compact && 'whitespace-nowrap')}>
            {isPending ? 'Finding…' : isActive ? 'Near me · on' : 'Near me'}
          </span>
        </Button>
        {isActive && !compact && (
          <p className="text-sm text-muted-foreground" role="status">
            Sorted by distance from your location.
          </p>
        )}
        {isActive && compact && (
          <span className="sr-only" role="status">
            Sorted by distance from your location.
          </span>
        )}
      </div>
      {failed && errorMessage && (
        <p
          className={cn(
            'flex items-start gap-2 text-muted-foreground',
            compact ? 'text-xs' : 'text-sm',
          )}
          role="status"
          aria-live="polite"
        >
          <MapPinOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>{errorMessage}</span>
        </p>
      )}
    </div>
  );
}
